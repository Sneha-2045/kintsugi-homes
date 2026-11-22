import { createFileRoute } from "@tanstack/react-router";
import { getIntelligenceInventory } from "@/server/property-service";
import { safeMongoError } from "@/server/mongo";
import { usListings } from "@/data/us-listings";

function getRecordedListingSnapshot() {
  const seen = new Set<string>();
  const properties = usListings.flatMap((listing) => {
    const id = listing.id;
    if (
      !id ||
      seen.has(id) ||
      !Number.isFinite(listing.latitude) ||
      !Number.isFinite(listing.longitude)
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
        description: listing.description,
        images: listing.images,
        lastCheckedAt: listing.lastCheckedAt ?? null,
        sourceUrl: listing.sourceUrl ?? null,
      },
    ];
  });
  return properties;
}

function snapshotResponse() {
  const properties = getRecordedListingSnapshot();
  return Response.json(
    {
      properties,
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
      GET: async () => {
        try {
          const data = await getIntelligenceInventory({
            west: -180,
            south: -90,
            east: 180,
            north: 90,
            limit: 5000,
          });
          // Keep the map useful when Mongo is healthy but has no imported rows.
          // These listings are an existing Rylestate snapshot, not live Mongo data.
          const snapshot = data.properties.length ? [] : getRecordedListingSnapshot();
          if (snapshot.length) return snapshotResponse();
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
          if (getRecordedListingSnapshot().length) return snapshotResponse();
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
