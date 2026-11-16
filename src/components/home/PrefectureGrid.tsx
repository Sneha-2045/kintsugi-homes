import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/common/SectionHeader";
import { usListings } from "@/data/us-listings";
import { tranchiProperties } from "@/data/tranchi-properties";
import { getUsStateCode, stateCodes, stateNames } from "@/lib/us-states";

const popularStates = Array.from(
  [...usListings, ...tranchiProperties].reduce((states, listing) => {
    const code = getUsStateCode(listing);
    const state = code ? stateNames[code] : undefined;
    if (!code || !state) return states;
    const current = states.get(state) ?? { count: 0, code };
    current.count += 1;
    states.set(state, current);
    return states;
  }, new Map<string, { count: number; code: string }>()),
)
  .sort((a, b) => b[1].count - a[1].count);

export function PrefectureGrid() {
  const [repliersCounts, setRepliersCounts] = useState<Record<string, number>>({});
  const [repliersTotal, setRepliersTotal] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/properties?aggregates=address.state&listings=false", {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then(
        (data: {
          count?: unknown;
          aggregates?: { address?: { state?: Record<string, unknown> } };
        } | null) => {
          if (controller.signal.aborted || !data) return;
          if (typeof data.count === "number" && Number.isFinite(data.count)) {
            setRepliersTotal(data.count);
          }
          const stateCounts = data.aggregates?.address?.state ?? {};
          const normalizedCounts = Object.fromEntries(
            Object.entries(stateCounts).flatMap(([code, count]) => {
              const name = stateNames[code.toUpperCase()];
              const numericCount = Number(count);
              return name && Number.isFinite(numericCount) ? [[name, numericCount]] : [];
            }),
          );
          setRepliersCounts(normalizedCounts);
          if (typeof data.count !== "number") {
            setRepliersTotal(Object.values(normalizedCounts).reduce((sum, count) => sum + count, 0));
          }
        },
      )
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const localStateCounts = new Map(popularStates);
  const statesToShow = Array.from(new Set([...localStateCounts.keys(), ...Object.keys(repliersCounts)]))
    .flatMap((state) => {
      const code = stateCodes[state];
      if (!code) return [];
      const localCount = localStateCounts.get(state)?.count ?? 0;
      return [[state, { code }, localCount + (repliersCounts[state] ?? 0)] as const];
    })
    .sort((a, b) => b[2] - a[2]);

  return (
    <section className="bg-surface py-16 md:py-24" aria-labelledby="states-title">
      <div className="container-page">
        <SectionHeader
          align="center"
          title="Popular US States"
          subtitle={`${(usListings.length + tranchiProperties.length + repliersTotal).toLocaleString("en-US")} total US listings across foreclosure, MLS and investment sources`}
          className="mb-12"
        />
        <h2 id="states-title" className="sr-only">
          Popular US states
        </h2>

        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {statesToShow.map(([state, details, count]) => (
            <li key={state}>
              <Link
                to="/us-properties"
                search={{ state: details.code }}
                className="group block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-elevated"
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
                <span className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-primary/40 px-3 py-2 text-sm font-semibold text-primary-light transition-colors group-hover:border-primary/70 group-hover:bg-primary/10">
                  See listings
                  <ArrowRight className="h-4 w-4" />
                </span>
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
