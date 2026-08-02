import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Button } from "@/components/common/Button";
import { PageShell } from "@/components/layout/PageShell";
import { PropertyCard } from "@/components/property/PropertyCard";
import { prefectures } from "@/data/prefectures";
import { properties } from "@/data/properties";

export const Route = createFileRoute("/prefecture/$slug")({
  loader: ({ params }) => {
    const prefecture = prefectures.find((p) => p.slug === params.slug);
    if (!prefecture) throw notFound();
    return { prefecture };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Prefecture unavailable — Yadori Estate" }] };
    const t = `${loaderData.prefecture.name} property for sale | Yadori Estate`;
    const d = `Browse ${loaderData.prefecture.count.toLocaleString("en-US")} houses, akiya, land and apartments listed in ${loaderData.prefecture.name} Prefecture.`;
    return {
      meta: [
        { title: t },
        { name: "description", content: d },
        { property: "og:title", content: t },
        { property: "og:description", content: d },
      ],
    };
  },
  errorComponent: () => <PageShell title="This prefecture didn't load" />,
  notFoundComponent: () => (
    <PageShell title="Prefecture not found">
      <Button asChild>
        <Link to="/">Go home</Link>
      </Button>
    </PageShell>
  ),
  component: PrefecturePage,
});

function PrefecturePage() {
  const { prefecture } = Route.useLoaderData();
  const listings = properties.filter((p) => p.prefectureSlug === prefecture.slug);

  return (
    <PageShell
      title={`${prefecture.name} ${prefecture.nameJa}`}
      description={`${prefecture.count.toLocaleString("en-US")} listings indexed across ${prefecture.name} Prefecture.`}
    >
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
          No sample listings for this prefecture in the demo dataset.
        </p>
      )}
    </PageShell>
  );
}
