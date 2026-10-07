import { createFileRoute } from "@tanstack/react-router";

import { PageShell } from "@/components/layout/PageShell";
import { CountrySwitcher } from "@/components/common/CountrySwitcher";
import { PropertyCard } from "@/components/property/PropertyCard";
import { usListings } from "@/data/us-listings";
import { canonicalLink } from "@/lib/seo";

const title = "US Properties | Real Estate";
const description = "US foreclosure properties with upcoming auction dates.";

export const Route = createFileRoute("/us-properties")({
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
  return (
    <PageShell title="US Properties" description={description}>
      <div className="mb-8">
        <CountrySwitcher active="us" />
      </div>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {usListings.map((property) => (
          <li key={property.id}>
            <PropertyCard property={property} />
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
