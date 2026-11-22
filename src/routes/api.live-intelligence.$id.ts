import { createFileRoute } from "@tanstack/react-router";
import { apifyForeclosures } from "@/data/apify-foreclosures";
import { getIntelligencePropertyDetail } from "@/server/property-service";
import { safeMongoError } from "@/server/mongo";

export const Route = createFileRoute("/api/live-intelligence/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const snapshot = apifyForeclosures.find((listing) => listing.id === params.id);
        if (snapshot) {
          return Response.json({
            dataSource: "recorded-snapshot",
            property: {
              ...snapshot,
              price: snapshot.priceUsd,
              currency: "USD",
              source: "Recorded Rylestate snapshot",
              sourceUrl: snapshot.sourceUrl ?? null,
              images: (snapshot.images ?? []).map((url, index) => ({ url, sortOrder: index })),
              features: snapshot.tags ?? [],
              buildingArea: snapshot.floorArea ?? null,
              lastCheckedAt: snapshot.lastCheckedAt ?? null,
            },
          }, { headers: { "Cache-Control": "private, max-age=60" } });
        }
        try {
          const property = await getIntelligencePropertyDetail(params.id);
          if (!property) return Response.json({ error: "Property not found." }, { status: 404 });
          return Response.json({ dataSource: "mongodb", property }, {
            headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=30" },
          });
        } catch (error) {
          console.error("[live-intelligence] Property detail request failed", safeMongoError(error));
          return Response.json({ error: "Property details are temporarily unavailable." }, { status: 503 });
        }
      },
    },
  },
});
