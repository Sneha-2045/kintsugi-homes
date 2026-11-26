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
          const numberParam = (key: string, min: number, max: number) => {
            const raw = params.get(key);
            if (!raw) return undefined;
            const parsed = Number(raw);
            if (!Number.isFinite(parsed) || parsed < min || parsed > max)
              throw new ApifyRentalError(400, `Invalid ${key} filter.`);
            return parsed;
          };
          const state = params.get("state")?.toUpperCase();
          if (state && !/^[A-Z]{2}$/.test(state)) throw new ApifyRentalError(400, "Invalid state filter.");
          const rawSort = params.get("sort") ?? "";
          const sort = rawSort === "price-asc" || rawSort === "price-desc" || rawSort === "beds-desc"
            ? rawSort
            : undefined;
          if (rawSort && !sort) throw new ApifyRentalError(400, "Invalid sort order.");
          const minRent = numberParam("minRent", 0, 1_000_000);
          const maxRent = numberParam("maxRent", 0, 1_000_000);
          if (minRent !== undefined && maxRent !== undefined && minRent > maxRent)
            throw new ApifyRentalError(400, "Minimum rent must be less than or equal to maximum rent.");
          const beds = numberParam("beds", 1, 20);
          const bathrooms = numberParam("bathrooms", 1, 20);
          const data = await getApifyRentals(offset, {
            ...(params.get("q") ? { q: params.get("q")!.slice(0, 120) } : {}),
            ...(params.get("type") ? { type: params.get("type")!.slice(0, 80) } : {}),
            ...(minRent !== undefined ? { minRent } : {}),
            ...(maxRent !== undefined ? { maxRent } : {}),
            ...(state ? { state } : {}),
            ...(params.get("city") ? { city: params.get("city")!.slice(0, 100) } : {}),
            ...(params.get("zipCode") ? { zipCode: params.get("zipCode")!.slice(0, 10) } : {}),
            ...(params.get("neighborhood") ? { neighborhood: params.get("neighborhood")!.slice(0, 100) } : {}),
            ...(beds !== undefined ? { beds } : {}),
            ...(bathrooms !== undefined ? { bathrooms } : {}),
            ...(params.get("studio") === "true" ? { studio: true } : {}),
            ...(sort ? { sort } : {}),
          });
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
