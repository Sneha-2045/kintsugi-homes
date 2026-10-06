import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { PropertyMap } from "@/components/map/PropertyMap";
import { properties } from "@/data/properties";
import { regions } from "@/data/regions";
import { usListings } from "@/data/us-listings";

export const Route = createFileRoute("/map")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { id?: string | undefined; market?: "japan" | "us" } => ({
    id:
      typeof search["id"] === "string" && search["id"].length > 0
        ? (search["id"] as string)
        : undefined,
    market: search["market"] === "us" ? "us" : "japan",
  }),
  head: () => ({
    meta: [
      { title: "Map Search — Real Estate" },
      {
        name: "description",
        content: "Explore property listings in Japan or the United States on an interactive map.",
      },
      { property: "og:title", content: "Map Search — Real Estate" },
      {
        property: "og:description",
        content: "Explore property listings in Japan or the United States on an interactive map.",
      },
    ],
  }),
  component: MapPage,
});

function mapListings(market: "japan" | "us") {
  const seen = new Set<string>();
  const listings = [];
  for (const property of market === "us" ? usListings : properties) {
    if (seen.has(property.id)) continue;
    seen.add(property.id);
    listings.push(property);
  }
  return listings;
}

const MARKET_LISTINGS = {
  japan: mapListings("japan"),
  us: mapListings("us"),
};

function MapPage() {
  const { id, market } = Route.useSearch();
  const selectedMarket = market ?? "japan";
  const listings = MARKET_LISTINGS[selectedMarket];
  const isUs = market === "us";

  return (
    <PageShell
      title={isUs ? "US property map" : "Japan property map"}
      description={`Browse ${isUs ? "US foreclosure" : "Japanese"} listings on the map. Open a marker for property details, or use Show on Map from a listing card to jump to that home.`}
    >
      <div className="mb-6 flex gap-2" aria-label="Choose listing country">
        <Link
          to="/map"
          search={{ market: "japan" }}
          className={`rounded-full border px-4 py-2 text-sm ${!isUs ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"}`}
        >
          Japan
        </Link>
        <Link
          to="/map"
          search={{ market: "us" }}
          className={`rounded-full border px-4 py-2 text-sm ${isUs ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"}`}
        >
          United States
        </Link>
      </div>
      <div className={`grid gap-6 ${isUs ? "" : "lg:grid-cols-[320px_minmax(0,1fr)]"}`}>
        {!isUs ? (
          <ul className="space-y-2">
            {regions.filter((region) => region.count > 0).map((r) => (
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
        ) : null}
        <PropertyMap properties={listings} focusId={id} market={selectedMarket} />
      </div>
    </PageShell>
  );
}
