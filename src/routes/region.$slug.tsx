import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Button } from "@/components/common/Button";
import { PageShell } from "@/components/layout/PageShell";
import { PropertyCard } from "@/components/property/PropertyCard";
import { prefectures } from "@/data/prefectures";
import { properties } from "@/data/properties";
import { regions } from "@/data/regions";

export const Route = createFileRoute("/region/$slug")({
  loader: ({ params }) => {
    const region = regions.find((r) => r.slug === params.slug);
    if (!region) throw notFound();
    return { region };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Region unavailable — Yadori Estate" }] };
    const t = `Property for sale in ${loaderData.region.name}, Japan | Yadori Estate`;
    return {
      meta: [
        { title: t },
        { name: "description", content: loaderData.region.blurb },
        { property: "og:title", content: t },
        { property: "og:description", content: loaderData.region.blurb },
      ],
    };
  },
  errorComponent: () => <PageShell title="This region didn't load" />,
  notFoundComponent: () => (
    <PageShell title="Region not found">
      <Button asChild>
        <Link to="/">Go home</Link>
      </Button>
    </PageShell>
  ),
  component: RegionPage,
});

function RegionPage() {
  const { region } = Route.useLoaderData();
  const listings = properties.filter((p) => p.regionSlug === region.slug);
  const localPrefectures = prefectures.filter((p) => p.regionSlug === region.slug);

  return (
    <PageShell
      title={`${region.name} ${region.nameJa}`}
      description={`${region.blurb} ${region.count.toLocaleString("en-US")} properties indexed.`}
    >
      {localPrefectures.length ? (
        <ul className="mb-10 flex flex-wrap gap-2">
          {localPrefectures.map((p) => (
            <li key={p.slug}>
              <Link
                to="/prefecture/$slug"
                params={{ slug: p.slug }}
                className="inline-block rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground"
              >
                {p.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {listings.length ? (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((p) => (
            <li key={p.id}>
              <PropertyCard property={p} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
          No sample listings for this region in the demo dataset.
        </p>
      )}
    </PageShell>
  );
}
