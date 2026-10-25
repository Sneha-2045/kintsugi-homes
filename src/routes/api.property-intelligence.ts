import { createFileRoute } from "@tanstack/react-router";
import { rentCastErrorResponse, searchRentCast } from "@/lib/rentcast.server";

export const Route = createFileRoute("/api/property-intelligence")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const data = await searchRentCast(new URL(request.url).searchParams);
          return Response.json(data, {
            headers: { "Cache-Control": "private, max-age=45, stale-while-revalidate=60" },
          });
        } catch (error) {
          return rentCastErrorResponse(error);
        }
      },
    },
  },
});
