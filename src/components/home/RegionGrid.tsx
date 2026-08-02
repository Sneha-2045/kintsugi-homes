import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/common/SectionHeader";
import { regions } from "@/data/regions";

export function RegionGrid() {
  return (
    <section className="bg-background py-16 md:py-24" aria-labelledby="regions-title">
      <div className="container-page">
        <SectionHeader
          align="center"
          title="Browse by Region"
          subtitle="Explore properties across Japan's diverse regions"
          className="mb-12"
        />
        <h2 id="regions-title" className="sr-only">
          Browse by region
        </h2>

        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {regions.map((r) => (
            <li key={r.slug}>
              <Link
                to="/region/$slug"
                params={{ slug: r.slug }}
                className="group relative block aspect-4/3 overflow-hidden rounded-xl border border-border"
              >
                <img
                  src={r.image}
                  alt={`${r.name} region, Japan`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-4">
                  <span className="block text-lg font-bold text-white">{r.name}</span>
                  <span className="block text-sm text-white/75">
                    {r.count.toLocaleString("en-US")} properties
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10 text-center">
          <Link
            to="/map"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-light hover:text-primary"
          >
            View All Locations
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
