import { createFileRoute } from "@tanstack/react-router";

import { PageShell } from "@/components/layout/PageShell";
import { CountrySwitcher } from "@/components/common/CountrySwitcher";
import { PropertyCard } from "@/components/property/PropertyCard";
import { properties } from "@/data/properties";
import { canonicalLink } from "@/lib/seo";

const title = "Japan Properties | Real Estate";
const description =
  "Browse Japanese houses, akiya, land and apartments across Japan.";

export const Route = createFileRoute("/japan-properties")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
    links: [canonicalLink("/japan-properties")],
  }),
  component: JapanPropertiesPage,
});

function JapanPropertiesPage() {
  return (
    <PageShell title="Japan Properties" description={description}>
      <div className="mb-8">
        <CountrySwitcher active="japan" />
      </div>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <li key={property.id}>
            <PropertyCard property={property} />
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
