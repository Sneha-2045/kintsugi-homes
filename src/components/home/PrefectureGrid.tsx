import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/common/SectionHeader";
import { usListings } from "@/data/us-listings";

const popularStates = Array.from(
  usListings.reduce((states, listing) => {
    states.set(listing.prefecture, (states.get(listing.prefecture) ?? 0) + 1);
    return states;
  }, new Map<string, number>()),
)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 12);

export function PrefectureGrid() {
  return (
    <section className="bg-surface py-16 md:py-24" aria-labelledby="states-title">
      <div className="container-page">
        <SectionHeader
          align="center"
          title="Popular US States"
          subtitle="Browse states with foreclosure listings in our current index"
          className="mb-12"
        />
        <h2 id="states-title" className="sr-only">
          Popular US states
        </h2>

        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {popularStates.map(([state, count]) => (
            <li key={state}>
              <Link
                to="/us-properties"
                search={{ q: state }}
                className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-elevated"
              >
                <h3 className="text-base font-bold text-foreground hover:text-primary-light">
                  {state}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-primary-light">
                    {count.toLocaleString("en-US")}
                  </span>{" "}
                  listings
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10 text-center">
          <Link
            to="/us-properties"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-light hover:text-primary"
          >
            Search US listings
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
