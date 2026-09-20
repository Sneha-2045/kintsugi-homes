import { createFileRoute } from "@tanstack/react-router";

import { PageShell } from "@/components/layout/PageShell";
import { PropertyCard } from "@/components/property/PropertyCard";
import { usListings } from "@/data/us-listings";

const title = "US Properties | Yadori Estate";
const description = "US foreclosure properties with upcoming auction dates.";

export const Route = createFileRoute("/us-properties")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: USPropertiesPage,
});

function USPropertiesPage() {
  return (
    <PageShell title="US Properties" description={description}>
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