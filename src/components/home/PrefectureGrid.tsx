import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/common/SectionHeader";
import { prefectures } from "@/data/prefectures";

const popularPrefectures = prefectures
  .filter((prefecture) => prefecture.count > 0)
  .sort((a, b) => b.count - a.count)
  .slice(0, 12);

export function PrefectureGrid() {
  return (
    <section className="bg-surface py-16 md:py-24" aria-labelledby="prefectures-title">
      <div className="container-page">
        <SectionHeader
          align="center"
          title="Popular Prefectures"
          subtitle="Browse prefectures with listings in our current index"
          className="mb-12"
        />
        <h2 id="prefectures-title" className="sr-only">
          Popular prefectures
        </h2>

        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {popularPrefectures.map((p) => (
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
            </li>
          ))}
        </ul>

        <div className="mt-10 text-center">
          <Link
            to="/search"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-light hover:text-primary"
          >
            Search Japan listings
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
