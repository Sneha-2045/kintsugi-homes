import { createFileRoute } from "@tanstack/react-router";
import { getRentCastDetails, rentCastErrorResponse } from "@/lib/rentcast.server";

export const Route = createFileRoute("/api/property-intelligence/details")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const data = await getRentCastDetails(new URL(request.url).searchParams);
          return Response.json(data, {
            headers: { "Cache-Control": "private, max-age=300, stale-while-revalidate=900" },
          });
        } catch (error) {
          return rentCastErrorResponse(error);
        }
      },
    },
  },
});
