import { createHash } from "node:crypto";
import { ApifyClient } from "apify-client";
import { AgentSyncLog, RealEstateAgent } from "./models.ts";
import { connectMongo } from "./mongo.ts";

const ACTOR_ID = "blackfalcondata/zillow-agent-leads-scraper";
const PAGE_SIZE = 1000;
type ActorItem = Record<string, unknown>;
type AgentLocation = { city?: string; state?: string; zipCode?: string; label: string };
type DirectoryArgs = {
  city?: string;
  state?: string;
  zipCode?: string;
  location?: string;
  q?: string;
  page: number;
  limit: number;
  sortBy: "rating" | "sales";
  sortOrder: "asc" | "desc";
};
type CachedAgentDirectory = { expiresAt: number; agents: Record<string, unknown>[] };
let cachedAgentDirectory: CachedAgentDirectory | undefined;

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
  const name = firstText(item, ["displayName", "agentName", "NAME", "name", "agent_name"]);
  const profileUrl = zillowProfile(
    firstText(item, [
      "profileUrl",
      "url",
      "PROFILE_LINK",
      "profileLink",
      "profile_url",
      "zillowProfileUrl",
    ]),
  );
  if (!name || !profileUrl) return undefined;

  const brokerage = firstText(item, [
    "businessName",
    "brokerageName",
    "AGENCY_NAME",
    "agencyName",
    "brokerage",
    "teamName",
    "TEAM_NAME",
  ]);
  const rating = numericValue(item["rating"] ?? item["reviewAverage"] ?? item["REVIEW_AVERAGE"]);
  const reviewCount = numericValue(item["reviewCount"] ?? item["REVIEW_COUNT"] ?? item["reviews"]);
  const salesPriceRange = firstText(item, ["salesPriceRange", "priceRange", "TEAM_PRICE_RANGE"]);
  const salesLast12Months = numericValue(
    item["recentSalesCount"] ??
      item["salesLast12Months"] ??
      item["TEAM_SALES_LAST_12_MONTHS"] ??
      item["sales_12_months"],
  );
  const salesInSearchedCity = numericValue(
    item["salesInSearchArea"] ??
      item["salesInLocation"] ??
      item["TEAM_SALES_IN_LOCATION"] ??
      item["sales_in_location"],
  );
  const image = firstText(item, [
    "photoUrl",
    "imageUrl",
    "profileImage",
    "IMAGE_URL",
    "profile_image",
  ]);
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

  const profileIdentity = firstText(item, ["zuid", "username"]) ?? profileUrl;
  const agentKey = `zillow:${createHash("sha256").update(profileIdentity.toLowerCase()).digest("hex")}`;
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

async function upsertAgentItems(locationLabel: string, items: ActorItem[]) {
  const location = normalizedLocation(locationLabel);
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
                            $mergeObjects: [{ $ifNull: ["$$previousLocation", {}] }, locationEntry],
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
  const result = await RealEstateAgent.bulkWrite(operations);
  return {
    recordsFetched: items.length,
    recordsMapped: mapped.length,
    recordsUpserted: result.upsertedCount + result.modifiedCount,
  };
}

export async function saveAgentDataset(locationLabel: string, items: ActorItem[]) {
  await connectMongo();
  return upsertAgentItems(locationLabel, items);
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

/** Read the latest completed Apify dataset as a fast fallback when MongoDB is unavailable or empty. */
export async function searchApifyAgentDirectory(args: DirectoryArgs) {
  const token = process.env["APIFY_TOKEN"];
  if (!token) throw new Error("APIFY_TOKEN is not configured on this server.");

  if (!cachedAgentDirectory || cachedAgentDirectory.expiresAt <= Date.now()) {
    const client = new ApifyClient({ token });
    const run = await client.actor(ACTOR_ID).lastRun({ status: "SUCCEEDED" }).get();
    if (!run?.defaultDatasetId) throw new Error("No completed Zillow agent dataset is available.");
    const items: ActorItem[] = [];
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const result = await client.dataset(run.defaultDatasetId).listItems({
        offset,
        limit: PAGE_SIZE,
      });
      items.push(...(result.items as ActorItem[]));
      if (result.items.length < PAGE_SIZE) break;
    }
    const mapped = mergeMappedAgents(items, normalizedLocation("Texas City, TX"));
    cachedAgentDirectory = {
      expiresAt: Date.now() + 5 * 60 * 1000,
      agents: mapped.map((agent) => ({ ...agent.data, id: agent.agentKey })),
    };
  }

  const location = args.location ? normalizedLocation(args.location) : undefined;
  const city = args.city ?? location?.city;
  const state = args.state ?? location?.state;
  const zipCode = args.zipCode ?? location?.zipCode;
  const query = args.q?.trim().toLowerCase();
  let agents = cachedAgentDirectory.agents.filter((agent) => {
    if (city && String(agent["city"] ?? "").toLowerCase() !== city.toLowerCase()) return false;
    if (state && String(agent["state"] ?? "").toLowerCase() !== state.toLowerCase()) return false;
    if (zipCode && String(agent["zipCode"] ?? "") !== zipCode) return false;
    if (
      query &&
      !`${String(agent["name"] ?? "")} ${String(agent["brokerage"] ?? "")}`
        .toLowerCase()
        .includes(query)
    ) {
      return false;
    }
    return true;
  });
  const sortField = args.sortBy === "sales" ? "salesLast12Months" : "rating";
  agents = agents.sort((left, right) => {
    const leftValue = Number(left[sortField] ?? 0);
    const rightValue = Number(right[sortField] ?? 0);
    const direction = args.sortOrder === "asc" ? 1 : -1;
    return (
      (leftValue - rightValue) * direction ||
      String(left["name"]).localeCompare(String(right["name"]))
    );
  });
  const total = agents.length;
  const offset = (args.page - 1) * args.limit;
  return {
    agents: agents.slice(offset, offset + args.limit),
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
      agentLocations: [locationLabel],
      maxResults: Number(process.env["AGENT_ACTOR_ITEM_LIMIT"] ?? 0),
      incrementalMode: false,
      compact: false,
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
    const saved = await saveAgentDataset(locationLabel, items);
    recordsFetched = saved.recordsFetched;
    const recordsUpserted = saved.recordsUpserted;
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
