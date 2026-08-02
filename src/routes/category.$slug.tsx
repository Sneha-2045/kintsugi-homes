import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Button } from "@/components/common/Button";
import { PageShell } from "@/components/layout/PageShell";
import { PropertyCard } from "@/components/property/PropertyCard";
import { properties, propertyCategories } from "@/data/properties";

export const Route = createFileRoute("/category/$slug")({
  loader: ({ params }) => {
    const category = propertyCategories.find((c) => c.slug === params.slug);
    if (!category) throw notFound();
    return { category };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Category unavailable — Yadori Estate" }] };
    const t = `${loaderData.category.title} for sale in Japan | Yadori Estate`;
    const d = `${loaderData.category.description} — ${loaderData.category.count.toLocaleString("en-US")} listings indexed in English.`;
    return {
      meta: [
        { title: t },
        { name: "description", content: d },
        { property: "og:title", content: t },
        { property: "og:description", content: d },
      ],
    };
  },
  errorComponent: () => <PageShell title="This category didn't load" />,
  notFoundComponent: () => (
    <PageShell title="Category not found">
      <Button asChild>
        <Link to="/">Go home</Link>
      </Button>
    </PageShell>
  ),
  component: CategoryPage,
});

function CategoryPage() {
  const { category } = Route.useLoaderData();
  const listings = properties.filter((p) => p.categorySlug === category.slug);

  return (
    <PageShell
      title={category.title}
      description={`${category.description} — ${category.count.toLocaleString("en-US")} listings.`}
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
          No sample listings in this category yet.
        </p>
      )}
    </PageShell>
  );
}
