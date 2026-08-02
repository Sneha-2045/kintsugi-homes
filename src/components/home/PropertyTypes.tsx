import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronRight } from "lucide-react";
import { SectionHeader } from "@/components/common/SectionHeader";
import { propertyCategories } from "@/data/properties";

export function PropertyTypes() {
  return (
    <section className="bg-surface py-16 md:py-24" aria-labelledby="types-title">
      <div className="container-page">
        <SectionHeader
          align="center"
          title="Property Types Available"
          subtitle="Live counts, updated as listings land."
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
