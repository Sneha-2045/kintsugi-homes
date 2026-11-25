import { createFileRoute } from "@tanstack/react-router";
import { ApifyRentalError, getApifyRentals } from "@/lib/apify-rentals.server";

export const Route = createFileRoute("/api/rentals")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const params = new URL(request.url).searchParams;
          const rawOffset = params.get("offset") ?? "0";
          const offset = Number(rawOffset);
          const data = await getApifyRentals(offset);
          return Response.json(data, {
            headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
          });
        } catch (error) {
          const status = error instanceof ApifyRentalError ? error.status : 500;
          const code =
            error instanceof ApifyRentalError ? "APIFY_RENTALS_ERROR" : "UPSTREAM_FAILURE";
          return Response.json(
            {
              error: {
                code,
                message:
                  error instanceof Error ? error.message : "Rental listings could not be loaded.",
              },
            },
            { status },
          );
        }
      },
    },
  },
});
