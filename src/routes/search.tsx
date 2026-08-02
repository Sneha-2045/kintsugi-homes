import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search as SearchIcon } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/common/Button";
import { PageShell } from "@/components/layout/PageShell";
import { PropertyCard } from "@/components/property/PropertyCard";
import { properties } from "@/data/properties";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: typeof search.q === "string" && search.q.length > 0 ? search.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Search Japanese Property — Yadori Estate" },
      {
        name: "description",
        content: "Search houses, akiya, land and apartments across all 47 Japanese prefectures.",
      },
      { property: "og:title", content: "Search Japanese Property — Yadori Estate" },
      {
        property: "og:description",
        content: "Search houses, akiya, land and apartments across all 47 Japanese prefectures.",
      },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const [value, setValue] = useState(q ?? "");

  const term = (q ?? "").toLowerCase();
  const results = term
    ? properties.filter((p) =>
        [p.location, p.title, p.prefecture, p.tags.join(" ")].join(" ").toLowerCase().includes(term),
      )
    : properties;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    navigate({ to: "/search", search: { q: value.trim() || undefined } });
  };

  return (
    <PageShell
      title={q ? `Results for “${q}”` : "Search properties"}
      description={`${results.length} matching ${results.length === 1 ? "listing" : "listings"} from our mock index of Japanese property.`}
    >
      <form onSubmit={onSubmit} className="mb-10 flex flex-col gap-3 sm:flex-row">
        <label htmlFor="search-input" className="sr-only">
          Search query
        </label>
        <input
          id="search-input"
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={'Try "kominka in Okayama"'}
          className="h-13 flex-1 rounded-lg border border-border bg-card px-5 text-base text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Button type="submit" size="lg">
          <SearchIcon className="h-4 w-4" />
          Search
        </Button>
      </form>

      {results.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
          No listings matched that search. Try a prefecture, a property type or a price band.
        </p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((p) => (
            <li key={p.id}>
              <PropertyCard property={p} />
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
