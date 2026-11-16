import { createHash } from "node:crypto";
import { ApifyClient } from "apify-client";
import { AgentSyncLog, RealEstateAgent } from "./models.ts";
import { connectMongo } from "./mongo.ts";

const ACTOR_ID = "hello.datawizards/real-estate-agents-scraper";
const PAGE_SIZE = 1000;
type ActorItem = Record<string, unknown>;
type AgentLocation = { city?: string; state?: string; zipCode?: string; label: string };

function textValue(value: unknown): string | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const valueText = String(value).trim();
  return valueText && !/^(null|undefined|n\/a|-)$/i.test(valueText) ? valueText : undefined;
}

function firstText(item: ActorItem, fields: string[]) {
  for (const field of fields) {
    const value = textValue(item[field]);
    if (value) return value;
  }
  return undefined;
}

function numericValue(value: unknown): number | undefined {
  const text = textValue(value);
  if (!text) return undefined;
  const match = text.replaceAll(",", "").match(/\d+(?:\.\d+)?/);
  if (!match) return undefined;
  const numeric = Number(match[0]);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function normalizedLocation(label: string): AgentLocation {
  const normalized = label.trim();
  const zipMatch = normalized.match(/\b(\d{5})(?:-\d{4})?\b/);
  const withoutZip = zipMatch
    ? normalized
        .replace(zipMatch[0], "")
        .replace(/[\s,]+$/, "")
        .trim()
    : normalized;
  const stateMatch = withoutZip.match(/(?:,\s*|\s+)([a-z]{2})$/i);
  const state = stateMatch?.[1]?.toUpperCase();
  const city = stateMatch
    ? withoutZip
        .slice(0, stateMatch.index)
        .replace(/[,\s]+$/, "")
        .trim() || undefined
    : zipMatch
      ? withoutZip || undefined
      : normalized || undefined;
  const zipCode = zipMatch?.[1];
  return {
    label,
    ...(city ? { city } : {}),
    ...(state ? { state } : {}),
    ...(zipCode ? { zipCode } : {}),
  };
}

function zillowProfile(value: string | undefined) {
  if (!value) return undefined;
  try {
    const url = new URL(value.startsWith("/") ? `https://www.zillow.com${value}` : value);
    if (url.protocol !== "https:" || !/(^|\.)zillow\.com$/i.test(url.hostname)) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

function mapActorItem(item: ActorItem, location: AgentLocation) {
  const name = firstText(item, ["NAME", "name", "agentName", "agent_name"]);
  const profileUrl = zillowProfile(
    firstText(item, ["PROFILE_LINK", "profileLink", "profile_url", "zillowProfileUrl"]),
  );
  if (!name || !profileUrl) return undefined;

  const brokerage = firstText(item, [
    "AGENCY_NAME",
    "agencyName",
    "brokerage",
    "teamName",
    "TEAM_NAME",
  ]);
  const rating = numericValue(item["REVIEW_AVERAGE"] ?? item["reviewAverage"] ?? item["rating"]);
  const reviewCount = numericValue(item["REVIEW_COUNT"] ?? item["reviewCount"] ?? item["reviews"]);
  const salesPriceRange = firstText(item, ["TEAM_PRICE_RANGE", "priceRange", "salesPriceRange"]);
  const salesLast12Months = numericValue(
    item["TEAM_SALES_LAST_12_MONTHS"] ?? item["salesLast12Months"] ?? item["sales_12_months"],
  );
  const salesInSearchedCity = numericValue(
    item["TEAM_SALES_IN_LOCATION"] ?? item["salesInLocation"] ?? item["sales_in_location"],
  );
  const image = firstText(item, ["IMAGE_URL", "imageUrl", "profileImage", "profile_image"]);
  const data: Record<string, unknown> = {
    name,
    zillowProfileUrl: profileUrl,
    source: "Zillow",
    lastUpdatedAt: new Date(),
  };
  if (image && /^https:\/\//i.test(image)) data["profileImage"] = image;
  if (brokerage) data["brokerage"] = brokerage;
  if (rating !== undefined && rating >= 0 && rating <= 5) data["rating"] = rating;
  if (reviewCount !== undefined) data["reviewCount"] = reviewCount;
  if (salesPriceRange) data["salesPriceRange"] = salesPriceRange;
  if (salesLast12Months !== undefined) data["salesLast12Months"] = salesLast12Months;
  if (salesInSearchedCity !== undefined) data["salesInSearchedCity"] = salesInSearchedCity;
  if (location.city) data["city"] = location.city;
  if (location.state) data["state"] = location.state;
  if (location.zipCode) data["zipCode"] = location.zipCode;

  const profileIdentity = profileUrl
    .toLowerCase()
    .replace(/[?#].*$/, "")
    .replace(/\/$/, "");
  const agentKey = `zillow:${createHash("sha256").update(profileIdentity).digest("hex")}`;
  return { agentKey, data, location, salesInSearchedCity };
}

function mergeMappedAgents(items: ActorItem[], location: AgentLocation) {
  const mapped = new Map<string, ReturnType<typeof mapActorItem> & {}>();
  for (const item of items) {
    const agent = mapActorItem(item, location);
    if (!agent) continue;
    const previous = mapped.get(agent.agentKey);
    if (!previous) mapped.set(agent.agentKey, agent);
    else mapped.set(agent.agentKey, { ...previous, data: { ...previous.data, ...agent.data } });
  }
  return [...mapped.values()];
}

export async function searchStoredAgents(args: {
  city?: string;
  state?: string;
  zipCode?: string;
  location?: string;
  q?: string;
  page: number;
  limit: number;
  sortBy: "rating" | "sales";
  sortOrder: "asc" | "desc";
}) {
  await connectMongo();
  const clauses: Record<string, unknown>[] = [];
  const location = args.location ? normalizedLocation(args.location) : undefined;
  const city = args.city ?? location?.city;
  const state = args.state ?? location?.state;
  const zipCode = args.zipCode ?? location?.zipCode;
  if (city || state || zipCode) {
    const locationMatch: Record<string, unknown> = {};
    if (city) locationMatch["city"] = new RegExp(`^${escapeRegex(city)}$`, "i");
    if (state) locationMatch["state"] = new RegExp(`^${escapeRegex(state)}$`, "i");
    if (zipCode) locationMatch["zipCode"] = new RegExp(`^${escapeRegex(zipCode)}(?:-\\d{4})?$`);
    clauses.push({ $or: [{ ...locationMatch }, { locations: { $elemMatch: locationMatch } }] });
  }
  if (args.q?.trim()) {
    const expression = new RegExp(escapeRegex(args.q.trim()), "i");
    clauses.push({ $or: [{ name: expression }, { brokerage: expression }] });
  }
  const filter = clauses.length ? { $and: clauses } : {};
  const sortField = args.sortBy === "sales" ? "salesLast12Months" : "rating";
  const skip = (args.page - 1) * args.limit;
  const [agents, total] = await Promise.all([
    RealEstateAgent.find(filter)
      .sort({ [sortField]: args.sortOrder === "asc" ? 1 : -1, name: 1 })
      .skip(skip)
      .limit(args.limit)
      .lean(),
    RealEstateAgent.countDocuments(filter),
  ]);
  const selectedLocationKey =
    city || state || zipCode
      ? `${city ?? ""}|${state ?? ""}|${zipCode ?? ""}`.toLowerCase()
      : undefined;
  return {
    agents: agents.map((agent) => {
      const locationRecord = selectedLocationKey
        ? agent.locations?.find(
            (item: { city?: string; state?: string; zipCode?: string; salesInLocation?: number }) =>
              (city ? item.city?.toLowerCase() === city.toLowerCase() : true) &&
              (state ? item.state?.toLowerCase() === state.toLowerCase() : true) &&
              (zipCode ? item.zipCode === zipCode : true),
          )
        : undefined;
      return {
        ...agent,
        id: String(agent._id),
        ...(locationRecord?.salesInLocation !== undefined
          ? { salesInSelectedCity: locationRecord.salesInLocation }
          : {}),
      };
    }),
    total,
    page: args.page,
    limit: args.limit,
    totalPages: Math.ceil(total / args.limit),
  };
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function getStoredAgent(id: string) {
  await connectMongo();
  const agent = await RealEstateAgent.findOne({
    $or: [...(/^[a-f\d]{24}$/i.test(id) ? [{ _id: id }] : []), { agentKey: id }],
  }).lean();
  return agent ? { ...agent, id: String(agent._id) } : undefined;
}

export async function syncAgentsForLocation(
  locationLabel: string,
  options: { skipIfRecent?: boolean } = {},
) {
  const token = process.env["APIFY_TOKEN"];
  if (!token) throw new Error("APIFY_TOKEN is not configured on this server.");
  await connectMongo();
  if (options.skipIfRecent) {
    const intervalHours = Number(
      process.env["AGENT_SYNC_MIN_INTERVAL_HOURS"] ??
        Number(process.env["AGENT_SYNC_INTERVAL_DAYS"] ?? 7) * 24,
    );
    const since = new Date(Date.now() - Math.max(1, intervalHours) * 60 * 60 * 1000);
    const recent = await AgentSyncLog.findOne({
      location: locationLabel,
      status: "succeeded",
      finishedAt: { $gte: since },
    })
      .select("_id")
      .lean();
    if (recent) return { location: locationLabel, skipped: true };
  }
  const location = normalizedLocation(locationLabel);
  const startedAt = new Date();
  const log = await AgentSyncLog.create({ location: locationLabel, status: "running", startedAt });
  let runId: string | undefined;
  let actorStatus: string | undefined;
  let datasetId: string | undefined;
  let usageUsd: number | undefined;
  let recordsFetched = 0;
  try {
    const client = new ApifyClient({ token });
    const run = await client.actor(ACTOR_ID).call({
      search_query: locationLabel,
      itemLimit: Number(process.env["AGENT_ACTOR_ITEM_LIMIT"] ?? 1000),
      proxyConfiguration: {
        useApifyProxy: true,
        apifyProxyGroups: ["RESIDENTIAL"],
        apifyProxyCountry: "US",
      },
    });
    runId = run.id;
    datasetId = run.defaultDatasetId;
    actorStatus = run.status;
    if (run.status !== "SUCCEEDED") {
      throw new Error(
        `Apify Actor run ${run.status.toLowerCase()}${run.id ? ` (${run.id})` : ""}.`,
      );
    }
    usageUsd = typeof run.usageTotalUsd === "number" ? run.usageTotalUsd : undefined;
    const dataset = client.dataset(datasetId);
    const items: ActorItem[] = [];
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const page = await dataset.listItems({ offset, limit: PAGE_SIZE });
      items.push(...(page.items as ActorItem[]));
      if (page.items.length < PAGE_SIZE) break;
    }
    recordsFetched = items.length;
    const mapped = mergeMappedAgents(items, location);
    if (mapped.length === 0) {
      throw new Error(
        `The Actor returned no usable agent records for ${locationLabel}. Check its source access and output data.`,
      );
    }
    const now = new Date();
    const locationKey =
      `${location.city ?? ""}|${location.state ?? ""}|${location.zipCode ?? ""}`.toLowerCase();
    const operations = mapped.map((agent) => {
      const locationEntry = {
        locationKey,
        ...(location.city ? { city: location.city } : {}),
        ...(location.state ? { state: location.state } : {}),
        ...(location.zipCode ? { zipCode: location.zipCode } : {}),
        ...(agent.salesInSearchedCity !== undefined
          ? { salesInLocation: agent.salesInSearchedCity }
          : {}),
        lastUpdatedAt: now,
      };
      const setValues = { ...agent.data };
      delete setValues["lastUpdatedAt"];
      const pipeline = [
        { $set: { ...setValues, agentKey: agent.agentKey, lastUpdatedAt: now } },
        ...(location.city || location.state || location.zipCode
          ? [
              {
                $set: {
                  locations: {
                    $let: {
                      vars: {
                        currentLocations: { $ifNull: ["$locations", []] },
                        previousLocation: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: { $ifNull: ["$locations", []] },
                                as: "existing",
                                cond: { $eq: ["$$existing.locationKey", locationKey] },
                              },
                            },
                            0,
                          ],
                        },
                      },
                      in: {
                        $concatArrays: [
                          {
                            $filter: {
                              input: "$$currentLocations",
                              as: "existing",
                              cond: { $ne: ["$$existing.locationKey", locationKey] },
                            },
                          },
                          [
                            {
                              $mergeObjects: [
                                { $ifNull: ["$$previousLocation", {}] },
                                locationEntry,
                              ],
                            },
                          ],
                        ],
                      },
                    },
                  },
                },
              },
            ]
          : []),
      ];
      return {
        updateOne: { filter: { agentKey: agent.agentKey }, update: pipeline, upsert: true },
      };
    });
    const result = operations.length ? await RealEstateAgent.bulkWrite(operations) : undefined;
    const recordsUpserted = result ? result.upsertedCount + result.modifiedCount : 0;
    await AgentSyncLog.updateOne(
      { _id: log._id },
      {
        $set: {
          status: "succeeded",
          actorStatus,
          actorRunId: runId,
          datasetId,
          recordsFetched,
          recordsUpserted,
          ...(usageUsd !== undefined ? { usageUsd } : {}),
          finishedAt: new Date(),
        },
      },
    );
    return {
      location: locationLabel,
      actorRunId: runId,
      recordsFetched,
      recordsUpserted,
      ...(usageUsd !== undefined ? { usageUsd } : {}),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Actor sync failure.";
    await AgentSyncLog.updateOne(
      { _id: log._id },
      {
        $set: {
          status: "failed",
          ...(actorStatus ? { actorStatus } : {}),
          ...(runId ? { actorRunId: runId } : {}),
          ...(datasetId ? { datasetId } : {}),
          recordsFetched,
          ...(usageUsd !== undefined ? { usageUsd } : {}),
          error: message.slice(0, 2000),
          finishedAt: new Date(),
        },
      },
    );
    throw error;
  }
}

export async function configuredAgentLocations() {
  return (process.env["AGENT_SYNC_LOCATIONS"] ?? "")
    .split(";")
    .map((location) => location.trim())
    .filter(Boolean);
}
