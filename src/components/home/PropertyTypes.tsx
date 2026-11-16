import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronRight } from "lucide-react";
import { SectionHeader } from "@/components/common/SectionHeader";
import { propertyCategories } from "@/data/properties";
import { usListings } from "@/data/us-listings";
import { tranchiProperties } from "@/data/tranchi-properties";

export function PropertyTypes() {
  const [usPropertyTypes, setUsPropertyTypes] = useState<Array<{ name: string; count: number }>>([]);
  const [usMlsTotal, setUsMlsTotal] = useState(0);
  const [usPropertyTypeError, setUsPropertyTypeError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/properties?aggregates=details.propertyType&listings=false", {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then(
        (data: {
          count?: unknown;
          aggregates?: { details?: { propertyType?: Record<string, unknown> } };
        } | null) => {
          if (controller.signal.aborted) return;
          const counts = data?.aggregates?.details?.propertyType;
          if (!counts) {
            setUsPropertyTypeError(true);
            return;
          }
          setUsPropertyTypes(
            Object.entries(counts)
              .map(([name, count]) => ({ name, count: Number(count) }))
              .filter((type) => Number.isFinite(type.count) && type.count > 0)
              .sort((a, b) => b.count - a.count)
              .slice(0, 9),
          );
          const typeTotal = Object.values(counts).reduce((sum, count) => sum + Number(count), 0);
          setUsMlsTotal(
            typeof data?.count === "number" && Number.isFinite(data.count) ? data.count : typeTotal,
          );
        },
      )
      .catch(() => {
        if (!controller.signal.aborted) setUsPropertyTypeError(true);
      });
    return () => controller.abort();
  }, []);

  return (
    <section className="bg-surface py-16 md:py-24" aria-labelledby="types-title">
      <div className="container-page">
        <SectionHeader
          align="center"
          title="Property Types Available"
          subtitle="Counts reflect the listings currently in our Japan index."
          className="mb-12"
        />
        <h2 id="types-title" className="sr-only">
          Property types available
        </h2>

        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {propertyCategories.map((c) => (
            <li key={c.slug}>
              <Link
                to="/category/$slug"
                params={{ slug: c.slug }}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50 hover:bg-elevated"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-foreground">{c.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    <span className="font-bold text-primary-light">
                      {c.count.toLocaleString("en-US")}
                    </span>{" "}
                    listings
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-subtle" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-16">
          <SectionHeader
            align="center"
            title="US MLS Property Types"
            subtitle={`${usMlsTotal.toLocaleString("en-US")} live Repliers MLS listings grouped by type. Select a type to view matching listings.`}
            className="mb-8"
          />
          <ul className="mb-6 grid gap-4 sm:grid-cols-2">
            <li>
              <Link
                to="/us-properties"
                className="block rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50 hover:bg-elevated"
              >
                <span className="block text-base font-bold text-foreground">Foreclosure listings</span>
                <span className="mt-2 block text-sm text-muted-foreground">
                  <span className="font-bold text-primary-light">
                    {usListings.length.toLocaleString("en-US")}
                  </span>{" "}
                  listings
                </span>
                <span className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-primary/40 px-3 py-2 text-sm font-semibold text-primary-light transition-colors hover:border-primary/70 hover:bg-primary/10">
                  See listings
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </li>
            <li>
              <Link
                to="/us-properties"
                className="block rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50 hover:bg-elevated"
              >
                <span className="block text-base font-bold text-foreground">Investment opportunities</span>
                <span className="mt-2 block text-sm text-muted-foreground">
                  <span className="font-bold text-primary-light">
                    {tranchiProperties.length.toLocaleString("en-US")}
                  </span>{" "}
                  listings
                </span>
                <span className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-primary/40 px-3 py-2 text-sm font-semibold text-primary-light transition-colors hover:border-primary/70 hover:bg-primary/10">
                  See listings
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </li>
          </ul>
          {usPropertyTypes.length ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {usPropertyTypes.map((type) => (
                <li key={type.name}>
                  <Link
                    to="/us-properties"
                    search={{ category: type.name }}
                    className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50 hover:bg-elevated"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-bold text-foreground">{type.name}</span>
                      <span className="mt-2 block text-sm text-muted-foreground">
                        <span className="font-bold text-primary-light">
                          {type.count.toLocaleString("en-US")}
                        </span>{" "}
                        listings
                      </span>
                      <span className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-primary/40 px-3 py-2 text-sm font-semibold text-primary-light transition-colors hover:border-primary/70 hover:bg-primary/10">
                        See listings
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              {usPropertyTypeError
                ? "Live US MLS property type counts are unavailable right now."
                : "Loading US MLS property types…"}
            </p>
          )}
          <div className="mt-8 text-center">
            <Link
              to="/us-properties"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary-light hover:text-primary"
            >
              Browse all US listings
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/search"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-light hover:text-primary"
          >
            View all property categories
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
