import { createFileRoute } from "@tanstack/react-router";
import { getIntelligenceInventoryPage } from "@/server/property-service";
import { safeMongoError } from "@/server/mongo";
import { apifyForeclosures } from "@/data/apify-foreclosures";

const MAX_PAGE_SIZE = 1000;

function pageArgs(url: URL) {
  const requested = Number(url.searchParams.get("pageSize") ?? 500);
  if (!Number.isInteger(requested) || requested < 1 || requested > MAX_PAGE_SIZE)
    throw new Error(`pageSize must be between 1 and ${MAX_PAGE_SIZE}.`);
  const cursor = url.searchParams.get("cursor") || undefined;
  return { pageSize: requested, ...(cursor ? { cursor } : {}) };
}

function getRecordedListingSnapshot() {
  const seen = new Set<string>();
  const properties = apifyForeclosures.flatMap((listing) => {
    const id = listing.id;
    if (
      !id ||
      seen.has(id) ||
      !Number.isFinite(listing.latitude) ||
      !Number.isFinite(listing.longitude) ||
      listing.latitude! < -90 ||
      listing.latitude! > 90 ||
      listing.longitude! < -180 ||
      listing.longitude! > 180
    )
      return [];
    seen.add(id);
    const auction = /auction/i.test(`${listing.dealCategory ?? ""} ${listing.categorySlug}`);
    return [
      {
        id,
        title: listing.title,
        address: listing.address ?? null,
        city: listing.city ?? null,
        state: listing.state ?? null,
        zipCode: listing.zipCode ?? null,
        location: listing.location,
        latitude: listing.latitude,
        longitude: listing.longitude,
        price: listing.priceUsd,
        currency: "USD",
        status: listing.status ?? null,
        foreclosureStatus: listing.dealCategory ?? null,
        listingType: auction ? "auction" : null,
        auctionDate: listing.auctionDate ?? null,
        lastCheckedAt: listing.lastCheckedAt ?? null,
        sourceUrl: listing.sourceUrl ?? null,
        propertyType: listing.propertyType ?? null,
        bedrooms: listing.bedrooms ?? null,
        bathrooms: listing.bathrooms ?? null,
        buildingArea: listing.floorArea ?? null,
        landArea: listing.landArea ?? null,
        yearBuilt: listing.yearBuilt ?? null,
        previousPrice: null,
        createdAt: null,
        updatedAt: null,
      },
    ];
  });
  return properties;
}

function snapshotResponse(args: { cursor?: string; pageSize: number }) {
  const properties = getRecordedListingSnapshot();
  const offset = args.cursor?.startsWith("snapshot:")
    ? Number(args.cursor.slice("snapshot:".length))
    : 0;
  if (!Number.isInteger(offset) || offset < 0 || offset > properties.length)
    throw new Error("Invalid recorded inventory cursor.");
  const page = properties.slice(offset, offset + args.pageSize);
  const hasMore = offset + page.length < properties.length;
  return Response.json(
    {
      properties: page,
      total: properties.length,
      nextCursor: hasMore ? `snapshot:${offset + page.length}` : null,
      fetchedAt: new Date().toISOString(),
      dataSource: "recorded-snapshot",
    },
    {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        "X-Rylestate-Inventory-Source": "recorded-snapshot",
      },
    },
  );
}

export const Route = createFileRoute("/api/live-intelligence")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        let args: ReturnType<typeof pageArgs>;
        try {
          args = pageArgs(new URL(request.url));
        } catch (error) {
          return Response.json(
            { error: error instanceof Error ? error.message : "Invalid inventory page." },
            { status: 400 },
          );
        }
        try {
          if (args.cursor?.startsWith("snapshot:")) return snapshotResponse(args);
          const data = await getIntelligenceInventoryPage(args);
          // Keep the map useful when Mongo is healthy but has no imported rows.
          // The snapshot is recorded application data and is clearly labeled below.
          if (data.total === 0 && !args.cursor && getRecordedListingSnapshot().length)
            return snapshotResponse(args);
          return Response.json(
            {
              ...data,
              dataSource: "mongodb",
            },
            {
              headers: {
                "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
                "X-Rylestate-Inventory-Source": "mongodb",
              },
            },
          );
        } catch (error) {
          console.error(
            "[live-intelligence] MongoDB inventory request failed",
            safeMongoError(error),
          );
          // The page can still show geolocated listings already bundled with the app.
          // This keeps the map available during a database outage or an empty import.
          if (getRecordedListingSnapshot().length) return snapshotResponse(args);
          return Response.json(
            {
              error: "The property database is temporarily unavailable. Please retry shortly.",
              code: "DATABASE_UNAVAILABLE",
            },
            { status: 503 },
          );
        }
      },
    },
  },
});
