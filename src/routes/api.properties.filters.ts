import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, searchListings } from "@/lib/repliers.server";

export const Route = createFileRoute("/api/properties/filters")({
  server: { handlers: { GET: async () => {
    try {
      const data = await searchListings(new URLSearchParams("resultsPerPage=48"));
      const listings = data.listings ?? [];
      return Response.json({ propertyTypes: [...new Set(listings.map((x: any) => x.details?.propertyType ?? x.propertyType).filter(Boolean))], basedOnCurrentResults: true });
    } catch (error) { return errorResponse(error); }
  } } },
});
