import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { PropertyMap } from "@/components/map/PropertyMap";
import { properties } from "@/data/properties";
import { regions } from "@/data/regions";
import { usListings } from "@/data/us-listings";

export const Route = createFileRoute("/map")({
  validateSearch: (search: Record<string, unknown>): { id?: string | undefined } => ({
    id: typeof search["id"] === "string" && search["id"].length > 0 ? (search["id"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Map Search — Yadori Estate" },
      {
        name: "description",
        content: "Explore Japanese property listings on an interactive OpenStreetMap view.",
      },
      { property: "og:title", content: "Map Search — Yadori Estate" },
      {
        property: "og:description",
        content: "Explore Japanese property listings on an interactive OpenStreetMap view.",
      },
    ],
  }),
  component: MapPage,
});

function mapListings() {
  const seen = new Set<string>();
  const listings = [];
  for (const property of [...properties, ...usListings]) {
    if (seen.has(property.id)) continue;
    seen.add(property.id);
    listings.push(property);
  }
  return listings;
}

const MAP_LISTINGS = mapListings();

function MapPage() {
  const { id } = Route.useSearch();

  return (
    <PageShell
      title="Map view"
      description="Browse every listing on the map. Open a marker for property details, or use Show on Map from a listing card to jump to that home."
    >
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <ul className="space-y-2">
          {regions.map((r) => (
            <li key={r.slug}>
              <Link
                to="/region/$slug"
                params={{ slug: r.slug }}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm transition-colors hover:border-primary/50 hover:bg-elevated"
              >
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <MapPin className="h-4 w-4 text-primary-light" aria-hidden="true" />
                  {r.name}
                </span>
                <span className="text-muted-foreground">{r.count.toLocaleString("en-US")}</span>
              </Link>
            </li>
          ))}
        </ul>
        <PropertyMap properties={MAP_LISTINGS} focusId={id} />
      </div>
    </PageShell>
  );
}
