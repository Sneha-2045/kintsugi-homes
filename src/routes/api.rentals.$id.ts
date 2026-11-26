import { createFileRoute } from "@tanstack/react-router";
import { Types } from "mongoose";
import { getApifyRentalById } from "@/lib/apify-rentals.server";
import { connectMongo } from "@/server/mongo";
import { PropertyModel } from "@/server/models";

export const Route = createFileRoute("/api/rentals/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const id = params.id;
          const conditions: Record<string, unknown>[] = [{ sourceListingId: id }, { legacyId: id }];
          if (/^[a-f\d]{24}$/i.test(id)) conditions.push({ _id: new Types.ObjectId(id) });
          const record = await (async () => {
            try {
              await connectMongo();
              return await PropertyModel.findOne({
                $or: conditions,
                country: "United States",
                listingType: "rent",
                status: { $in: ["published", "active"] },
              }).lean();
            } catch {
              // The current Apify rental feed can still provide details when Mongo is unavailable.
              return null;
            }
          })();
          if (record) {
            return Response.json({
              id: String(record._id),
              title: record.title,
              address: record.address ?? null,
              city: record.city ?? null,
              state: record.state ?? null,
              zipCode: record.postalCode ?? null,
              price: record.price ?? null,
              bedrooms: record.bedrooms ?? null,
              bathrooms: record.bathrooms ?? null,
              buildingArea: record.buildingArea ?? null,
              propertyType: record.propertyType ?? null,
              status: record.status,
              description: record.description ?? null,
              amenities: record.features ?? [],
              images: ((record.images ?? []) as unknown[])
                .map((image: unknown) =>
                  typeof image === "string"
                    ? image
                    : image && typeof image === "object" && "url" in image
                      ? image.url
                      : undefined,
                )
                .filter((image): image is string => typeof image === "string"),
              availableDate: record.metadata?.availableDate ?? null,
              source: record.source,
              sourceUrl: record.sourceUrl ?? null,
            });
          }
          const listing = await getApifyRentalById(id);
          if (!listing)
            return Response.json({ error: "Rental listing not found." }, { status: 404 });
          return Response.json({
            id: listing.zpid,
            title: listing.buildingName || listing.addressLine1 || `Rental home in ${listing.city}`,
            address: listing.addressLine1 || listing.address || null,
            city: listing.city,
            state: listing.state,
            zipCode: listing.zipCode ?? null,
            price: listing.monthlyRent ?? listing.minRent ?? listing.price ?? null,
            bedrooms: listing.beds ?? null,
            bathrooms: listing.bathrooms ?? null,
            propertyType: listing.propertyType ?? null,
            status: listing.statusText || "For Rent",
            description: listing.description ?? null,
            amenities: listing.amenities ?? [],
            images: [listing.imgSrc],
            availableDate: listing.availableDate ?? null,
            source: listing.source || "Apify rental feed",
            sourceUrl: listing.sourceUrl ?? listing.detailUrl ?? null,
          });
        } catch {
          return Response.json({ error: "Rental details could not be loaded." }, { status: 503 });
        }
      },
    },
  },
});
