import { createFileRoute } from "@tanstack/react-router";
import {
  getApifyRentals,
  type ApifyRentalListing,
  type RentalFilters as ApifyRentalFilters,
} from "@/lib/apify-rentals.server";
import { connectMongo } from "@/server/mongo";
import { PropertyModel } from "@/server/models";
import { stateCodes, stateNames } from "@/lib/us-states";

const PAGE_SIZE = 20;
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const stateCodeFor = (value: string) =>
  Object.entries(stateCodes).find(
    ([name, code]) =>
      name.toLowerCase() === value.trim().toLowerCase() ||
      code.toLowerCase() === value.trim().toLowerCase(),
  )?.[1];

export const Route = createFileRoute("/api/rentals")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const params = new URL(request.url).searchParams;
          const numberParam = (key: string, max: number) => {
            const raw = params.get(key);
            if (!raw) return undefined;
            const parsed = Number(raw);
            if (!Number.isSafeInteger(parsed) || parsed < 0 || parsed > max)
              throw new Error(`Invalid ${key} filter.`);
            return parsed;
          };
          const offset = numberParam("offset", 50_000) ?? 0;
          if (offset % PAGE_SIZE) throw new Error("Invalid rental page.");
          const minRent = numberParam("minRent", 1_000_000);
          const maxRent = numberParam("maxRent", 1_000_000);
          if (minRent !== undefined && maxRent !== undefined && minRent > maxRent)
            throw new Error("Minimum rent must be less than or equal to maximum rent.");
          const beds = numberParam("beds", 20);
          const bathrooms = numberParam("bathrooms", 20);
          const rawSort = params.get("sort") ?? "";
          const sort = [
            "price-asc",
            "price-desc",
            "beds-desc",
            "newest",
            "oldest",
            "updated",
          ].includes(rawSort)
            ? rawSort
            : "updated";
          const query: Record<string, unknown> = {
            country: "United States",
            status: { $in: ["published", "active"] },
            listingType: "rent",
          };
          const q = params.get("q")?.trim().slice(0, 120) ?? "";
          const searchFields = ["title", "address", "location", "city", "state", "postalCode"];
          if (q) {
            const fullStateCode = stateCodeFor(q);
            const tokens = (fullStateCode ? [q] : q.split(/[\s,]+/)).filter(Boolean).slice(0, 8);
            query["$and"] = tokens.map((token) => ({
              $or: [
                ...searchFields.map((field) => ({
                  [field]: { $regex: escapeRegex(token), $options: "i" },
                })),
                ...(stateCodeFor(token)
                  ? [{ state: { $in: [stateCodeFor(token), stateNames[stateCodeFor(token)!]] } }]
                  : []),
              ],
            }));
          }
          for (const [param, field] of [
            ["state", "state"],
            ["city", "city"],
            ["zipCode", "postalCode"],
            ["neighborhood", "address"],
          ] as const) {
            const value = params.get(param)?.trim().slice(0, 100);
            if (value && param === "state") {
              const stateCode = stateCodeFor(value);
              query[field] = stateCode
                ? { $in: [stateCode, stateNames[stateCode]] }
                : { $regex: escapeRegex(value), $options: "i" };
            } else if (value) query[field] = { $regex: escapeRegex(value), $options: "i" };
          }
          const type = params.get("type")?.trim().slice(0, 80);
          const isStudio = type?.toLowerCase() === "studio" || params.get("studio") === "true";
          if (isStudio) query["bedrooms"] = 0;
          else if (type && type.toLowerCase() === "house")
            query["propertyType"] = { $regex: "single.?family|house|home", $options: "i" };
          else if (type) query["propertyType"] = { $regex: escapeRegex(type), $options: "i" };
          if (minRent !== undefined || maxRent !== undefined) {
            query["price"] = {
              ...(minRent !== undefined ? { $gte: minRent } : {}),
              ...(maxRent !== undefined ? { $lte: maxRent } : {}),
            };
          }
          if (beds !== undefined) {
            if (isStudio)
              query["$and"] = [
                ...(Array.isArray(query["$and"]) ? query["$and"] : []),
                { bedrooms: { $gte: beds } },
              ];
            else query["bedrooms"] = { $gte: beds };
          }
          if (bathrooms !== undefined) query["bathrooms"] = { $gte: bathrooms };
          const amenities = params
            .getAll("amenity")
            .map((value) => value.trim().slice(0, 60))
            .filter(Boolean)
            .slice(0, 12);
          if (amenities.length)
            query["features"] = {
              $all: amenities.map((value) => new RegExp(escapeRegex(value), "i")),
            };
          if (params.get("furnished") === "true")
            query["$and"] = [
              ...(Array.isArray(query["$and"]) ? query["$and"] : []),
              { $or: [{ "metadata.furnished": true }, { features: /furnished/i }] },
            ];
          if (params.get("furnished") === "false")
            query["$and"] = [
              ...(Array.isArray(query["$and"]) ? query["$and"] : []),
              { $or: [{ "metadata.furnished": false }, { features: /unfurnished/i }] },
            ];
          const leaseDuration = params.get("leaseDuration")?.trim().slice(0, 40);
          if (leaseDuration)
            query["metadata.leaseDuration"] = { $regex: escapeRegex(leaseDuration), $options: "i" };
          const availability = params.get("availability");
          if (availability === "now") {
            const todayString = new Date().toISOString().slice(0, 10);
            query["$and"] = [
              ...(Array.isArray(query["$and"]) ? query["$and"] : []),
              {
                $or: [
                  { "metadata.availableDate": { $lte: new Date() } },
                  { "metadata.availableDate": { $lte: todayString } },
                  { "metadata.availability": /available now|immediately/i },
                ],
              },
            ];
          } else if (availability === "soon") {
            const soon = new Date();
            soon.setDate(soon.getDate() + 60);
            const todayString = new Date().toISOString().slice(0, 10);
            const soonString = soon.toISOString().slice(0, 10);
            query["$and"] = [
              ...(Array.isArray(query["$and"]) ? query["$and"] : []),
              {
                $or: [
                  { "metadata.availableDate": { $gt: new Date(), $lte: soon } },
                  { "metadata.availableDate": { $gt: todayString, $lte: soonString } },
                  { "metadata.availability": /available soon|upcoming/i },
                ],
              },
            ];
          }
          const sortSpec =
            sort === "price-asc"
              ? { price: 1 as const, _id: 1 as const }
              : sort === "price-desc"
                ? { price: -1 as const, _id: 1 as const }
                : sort === "beds-desc"
                  ? { bedrooms: -1 as const, _id: 1 as const }
                  : sort === "newest"
                    ? { createdAt: -1 as const, _id: -1 as const }
                    : sort === "oldest"
                      ? { createdAt: 1 as const, _id: 1 as const }
                      : { updatedAt: -1 as const, _id: -1 as const };
          const useApifyFeed =
            amenities.length === 0 && !availability && !params.has("furnished") && !leaseDuration;
          const apifyFilters: ApifyRentalFilters = {
            ...(q ? { q } : {}),
            ...(type ? { type } : {}),
            ...(minRent !== undefined ? { minRent } : {}),
            ...(maxRent !== undefined ? { maxRent } : {}),
            ...(params.get("state") ? { state: params.get("state")!.toUpperCase() } : {}),
            ...(params.get("city") ? { city: params.get("city")! } : {}),
            ...(params.get("zipCode") ? { zipCode: params.get("zipCode")! } : {}),
            ...(params.get("neighborhood") ? { neighborhood: params.get("neighborhood")! } : {}),
            ...(beds !== undefined && !isStudio ? { beds } : {}),
            ...(bathrooms !== undefined ? { bathrooms } : {}),
            ...(isStudio ? { studio: true } : {}),
            ...(sort === "price-asc" || sort === "price-desc" || sort === "beds-desc"
              ? { sort }
              : {}),
          };
          const apifyListings = [] as Awaited<ReturnType<typeof getApifyRentals>>["listings"];
          let apifyUnavailable = false;
          if (useApifyFeed) {
            try {
              for (let apifyOffset = 0; apifyOffset < 50_000; apifyOffset += PAGE_SIZE) {
                const page = await getApifyRentals(apifyOffset, apifyFilters);
                apifyListings.push(...page.listings);
                if (!page.hasMore) break;
              }
            } catch {
              apifyUnavailable = true;
            }
          }
          const records = await connectMongo()
            .then(() =>
              PropertyModel.find(query)
                .collation({ locale: "en", strength: 2 })
                .sort(sortSpec)
                .limit(50_000)
                .lean(),
            )
            .catch((error: unknown) => {
              if (!useApifyFeed) throw error;
              return [];
            });
          const mongoListings: ApifyRentalListing[] = records.map((record) => {
            const images: unknown[] = Array.isArray(record.images) ? record.images : [];
            const image = images
              .map((item: unknown) =>
                typeof item === "string"
                  ? item
                  : item && typeof item === "object" && "url" in item
                    ? item.url
                    : undefined,
              )
              .find((url): url is string => typeof url === "string" && /^https:\/\//.test(url));
            const availableDate =
              record.metadata?.availableDate instanceof Date
                ? record.metadata.availableDate.toISOString().slice(0, 10)
                : typeof record.metadata?.availableDate === "string"
                  ? record.metadata.availableDate
                  : undefined;
            return {
              zpid: record.sourceListingId || String(record._id),
              ...(record.sourceListingId ? { sourceId: record.sourceListingId } : {}),
              ...(record.address ? { address: record.address, addressLine1: record.address } : {}),
              city: record.city ?? "",
              state: record.state ?? "",
              ...(record.postalCode ? { zipCode: record.postalCode } : {}),
              ...(record.price != null ? { price: record.price, monthlyRent: record.price } : {}),
              ...(record.bedrooms != null ? { beds: record.bedrooms } : {}),
              ...(record.bathrooms != null ? { bathrooms: record.bathrooms } : {}),
              ...(record.propertyType ? { propertyType: record.propertyType } : {}),
              ...(availableDate ? { availableDate } : {}),
              amenities: Array.isArray(record.features) ? record.features : [],
              ...(record.updatedAt instanceof Date
                ? { updatedAt: record.updatedAt.toISOString() }
                : {}),
              ...(record.createdAt instanceof Date
                ? { createdAt: record.createdAt.toISOString() }
                : {}),
              statusType: "FOR_RENT",
              statusText: "For Rent",
              buildingName: record.title,
              source: record.source || "Rylestate property database",
              imgSrc: image ?? "",
            };
          });
          if (apifyUnavailable && mongoListings.length === 0)
            throw new Error("Rental data sources are unavailable.");
          const listingBySourceId = new Map<string, (typeof mongoListings)[number]>();
          for (const listing of mongoListings)
            listingBySourceId.set(`source:${listing.zpid}`, listing);
          for (const listing of apifyListings) {
            if (!listingBySourceId.has(`source:${listing.zpid}`))
              listingBySourceId.set(`source:${listing.zpid}`, listing);
          }
          const allListings = [...listingBySourceId.values()];
          if (sort === "price-asc")
            allListings.sort(
              (a, b) =>
                (a.monthlyRent ?? a.minRent ?? a.price ?? Number.POSITIVE_INFINITY) -
                (b.monthlyRent ?? b.minRent ?? b.price ?? Number.POSITIVE_INFINITY),
            );
          else if (sort === "price-desc")
            allListings.sort(
              (a, b) =>
                (b.monthlyRent ?? b.minRent ?? b.price ?? Number.NEGATIVE_INFINITY) -
                (a.monthlyRent ?? a.minRent ?? a.price ?? Number.NEGATIVE_INFINITY),
            );
          else if (sort === "beds-desc")
            allListings.sort(
              (a, b) => (b.beds ?? Number.NEGATIVE_INFINITY) - (a.beds ?? Number.NEGATIVE_INFINITY),
            );
          else if (sort === "newest" || sort === "oldest" || sort === "updated")
            allListings.sort((a, b) => {
              const aDate = Date.parse(
                sort === "newest" || sort === "oldest" ? (a.createdAt ?? "") : (a.updatedAt ?? ""),
              );
              const bDate = Date.parse(
                sort === "newest" || sort === "oldest" ? (b.createdAt ?? "") : (b.updatedAt ?? ""),
              );
              const direction = sort === "oldest" ? 1 : -1;
              return (
                ((Number.isFinite(aDate) ? aDate : 0) - (Number.isFinite(bDate) ? bDate : 0)) *
                direction
              );
            });
          const total = allListings.length;
          const listings = allListings.slice(offset, offset + PAGE_SIZE);
          const stateCounts: Record<string, number> = {};
          for (const listing of allListings)
            stateCounts[listing.state] = (stateCounts[listing.state] ?? 0) + 1;
          const data = {
            listings,
            offset,
            limit: PAGE_SIZE,
            totalCount: total,
            hasMore: offset + listings.length < total,
            stateCounts,
            statesResponded: Object.keys(stateCounts),
          };
          return Response.json(data, {
            headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
          });
        } catch (error) {
          return Response.json(
            {
              error: {
                code:
                  error instanceof Error && error.message.startsWith("Invalid")
                    ? "INVALID_SEARCH"
                    : "RENTALS_UNAVAILABLE",
                message:
                  error instanceof Error && error.message.startsWith("Invalid")
                    ? error.message
                    : "Rental listings could not be loaded.",
              },
            },
            { status: error instanceof Error && error.message.startsWith("Invalid") ? 400 : 503 },
          );
        }
      },
    },
  },
});
