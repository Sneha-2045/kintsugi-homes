import { createFileRoute } from "@tanstack/react-router";

import { PageShell } from "@/components/layout/PageShell";
import { PropertyCard } from "@/components/property/PropertyCard";
import { properties } from "@/data/properties";

const title = "Japan Properties | Yadori Estate";
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
  }),
  component: JapanPropertiesPage,
});

function JapanPropertiesPage() {
  return (
    <PageShell title="Japan Properties" description={description}>
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
