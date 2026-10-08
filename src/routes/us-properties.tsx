import { createFileRoute } from "@tanstack/react-router";

import { PageShell } from "@/components/layout/PageShell";
import { CountrySwitcher } from "@/components/common/CountrySwitcher";
import { PropertyCard } from "@/components/property/PropertyCard";
import { usListings } from "@/data/us-listings";
import { canonicalLink } from "@/lib/seo";

const title = "US Properties | Real Estate";
const description = "US foreclosure properties with upcoming auction dates.";

export const Route = createFileRoute("/us-properties")({
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: typeof search["q"] === "string" && search["q"].length > 0 ? search["q"] : undefined,
  }),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
    links: [canonicalLink("/us-properties")],
  }),
  component: USPropertiesPage,
});

function USPropertiesPage() {
  const { q } = Route.useSearch();
  const term = q?.toLowerCase();
  const listings = term
    ? usListings.filter((property) =>
        [property.title, property.location, property.prefecture, property.tags.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(term),
      )
    : usListings;

  return (
    <PageShell
      title={q ? `US properties matching “${q}”` : "US Properties"}
      description={q ? `${listings.length} matching US listings.` : description}
    >
      <div className="mb-8">
        <CountrySwitcher active="us" />
      </div>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((property) => (
          <li key={property.id}>
            <PropertyCard property={property} />
          </li>
        ))}
      </ul>
      {listings.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          No US listings matched that search. Try a city or state.
        </p>
      ) : null}
    </PageShell>
  );
}
