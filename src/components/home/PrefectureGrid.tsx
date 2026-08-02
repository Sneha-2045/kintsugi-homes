import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/common/SectionHeader";
import { prefectures } from "@/data/prefectures";

const miniLinks = ["Houses", "Apts", "Land", "Rent"];

export function PrefectureGrid() {
  return (
    <section className="bg-surface py-16 md:py-24" aria-labelledby="prefectures-title">
      <div className="container-page">
        <SectionHeader
          align="center"
          title="Popular Prefectures"
          subtitle="Browse property for sale across Japan's 47 prefectures"
          className="mb-12"
        />
        <h2 id="prefectures-title" className="sr-only">
          Popular prefectures
        </h2>

        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {prefectures.slice(0, 12).map((p) => (
            <li
              key={p.slug}
              className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-elevated"
            >
              <h3 className="text-base font-bold text-foreground">
                <Link to="/prefecture/$slug" params={{ slug: p.slug }} className="hover:text-primary-light">
                  {p.name}
                </Link>
              </h3>
              <p className="mt-0.5 text-xs text-subtle">{p.nameJa}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="font-semibold text-primary-light">
                  {p.count.toLocaleString("en-US")}
                </span>{" "}
                listings
              </p>
              <ul className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 border-t border-border pt-3 text-[11px] text-subtle">
                {miniLinks.map((m, i) => (
                  <li key={m} className="flex items-center gap-1.5">
                    {i > 0 ? <span aria-hidden="true">·</span> : null}
                    <Link
                      to="/prefecture/$slug"
                      params={{ slug: p.slug }}
                      className="hover:text-primary-light"
                    >
                      {m}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>

        <div className="mt-10 text-center">
          <Link
            to="/search"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-light hover:text-primary"
          >
            View All 47 Prefectures
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
