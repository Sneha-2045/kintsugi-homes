import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/common/SectionHeader";
import { regions } from "@/data/regions";
import { usListings } from "@/data/us-listings";

const usMarkets = Array.from(
  usListings.reduce((markets, listing) => {
    const current = markets.get(listing.prefecture);
    if (current) {
      current.count += 1;
    } else {
      markets.set(listing.prefecture, {
        name: listing.prefecture,
        count: 1,
        image: listing.images[0] ?? "/images/miami-1369.avif",
      });
    }
    return markets;
  }, new Map<string, { name: string; count: number; image: string }>()),
).sort((a, b) => b[1].count - a[1].count);

export function RegionGrid() {
  return (
    <section className="bg-background py-16 md:py-24" aria-labelledby="regions-title">
      <div className="container-page">
        <SectionHeader
          align="center"
          title="Browse by Region"
          subtitle="Start with US markets, then explore properties across Japan"
          className="mb-12"
        />
        <h2 id="regions-title" className="sr-only">
          Browse by region
        </h2>

        <h3 className="mb-5 text-xl font-semibold text-foreground">US Markets</h3>
        <ul className="mb-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {usMarkets.map(([slug, market]) => (
            <li key={slug}>
              <Link
                to="/us-properties"
                search={{ q: market.name }}
                className="group relative block aspect-4/3 overflow-hidden rounded-xl border border-border"
              >
                <img
                  src={market.image}
                  alt={`${market.name} real estate listings`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-4">
                  <span className="block text-lg font-bold text-white">{market.name}</span>
                  <span className="block text-sm text-white/75">
                    {market.count.toLocaleString("en-US")} listings
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <h3 className="mb-5 text-xl font-semibold text-foreground">Japan Regions</h3>

        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {regions.filter((region) => region.count > 0).map((r) => (
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
