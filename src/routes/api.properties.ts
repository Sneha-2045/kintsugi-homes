import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, searchListings } from "@/lib/repliers.server";

export const Route = createFileRoute("/api/properties")({
  server: { handlers: { GET: async ({ request }) => {
    try {
      const data = await searchListings(new URL(request.url).searchParams);
      return Response.json(data, { headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=10" } });
    } catch (error) { return errorResponse(error); }
  } } },
});
