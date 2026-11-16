import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/common/SectionHeader";
import { regions } from "@/data/regions";
import { usListings } from "@/data/us-listings";
import { tranchiProperties } from "@/data/tranchi-properties";
import { getUsStateCode, stateCodes, stateNames } from "@/lib/us-states";

const image = (photoId: string) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1200&q=75`;

const fallbackMarketPhotos = [
  image("photo-1568605114967-8130f3a36994"),
  image("photo-1570129477492-45c003edd2be"),
  image("photo-1600585154340-be6161a56a0c"),
  image("photo-1605276374104-dee2a0ed3cd6"),
  image("photo-1583608205776-bfd35f0d9f83"),
  image("photo-1613490493576-7fde63acd811"),
  image("photo-1605146769289-440113cc3d00"),
  image("photo-1564013799919-ab600027ffc6"),
  image("photo-1512917774080-9991f1c4c750"),
  image("photo-1582268611958-ebfd161ef9cf"),
  image("photo-1600585154526-990dced4db0d"),
  image("photo-1600566753086-00f18fb6b3ea"),
  image("photo-1600607687644-c7171b42498f"),
  image("photo-1600607687939-ce8a6c25118c"),
  image("photo-1560448204-e02f11c3d0e2"),
  image("photo-1500382017468-9049fed747ef"),
  image("photo-1524413840807-0c3cb6fa808d"),
  image("photo-1502672260266-1c1ef2d93688"),
  image("photo-1493809842364-78817add7ffb"),
];

const stateMarketPhotos: Record<string, string> = {
  Florida: "/images/miami-1369.avif",
  Texas: image("photo-1625278152200-ae2d1fc87c5f"),
  "North Carolina": image("photo-1676934556859-624fa21e2588"),
  Tennessee: image("photo-1715014258786-998a463ad77c"),
  Colorado: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Denver%2C_Colorado_skyline.jpg/1280px-Denver%2C_Colorado_skyline.jpg",
  Georgia: image("photo-1634010727710-aeef03fa4cba"),
  Kansas: image("photo-1536622638768-9403a9d35a1a"),
  Iowa: "https://www.traveliowa.com/userdocs/cities/Skyline_at_night_-_Catch_Des_Moines.jpg?format=jpg&width=1200",
  Alabama: "https://alabama-travel.s3.amazonaws.com/uploads/area/image/2/birmingham_skyline_credit_ted_tucker.jpg",
};

const fallbackMarketImage = (name: string) => {
  const stateIndex = Object.keys(stateCodes).sort().indexOf(name);
  return fallbackMarketPhotos[(stateIndex < 0 ? 0 : stateIndex) % fallbackMarketPhotos.length]!;
};

const localUsMarkets = Array.from(
  [...usListings, ...tranchiProperties].reduce((markets, listing) => {
    const code = getUsStateCode(listing);
    const name = code ? stateNames[code] : undefined;
    if (!code || !name) return markets;
    const current = markets.get(name) ?? {
      name,
      code,
      count: 0,
      image: stateMarketPhotos[name] ?? fallbackMarketImage(name),
    };
    current.count += 1;
    markets.set(name, current);
    return markets;
  }, new Map<string, { name: string; code: string; count: number; image: string }>()),
);

export function RegionGrid() {
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
          const stateCounts = data.aggregates?.address?.state ?? {};
          const normalizedCounts = Object.fromEntries(
            Object.entries(stateCounts).flatMap(([code, count]) => {
              const name = stateNames[code.toUpperCase()];
              const numericCount = Number(count);
              return name && Number.isFinite(numericCount) ? [[name, numericCount]] : [];
            }),
          );
          setRepliersCounts(normalizedCounts);
          setRepliersTotal(
            typeof data.count === "number" && Number.isFinite(data.count)
              ? data.count
              : Object.values(normalizedCounts).reduce((sum, count) => sum + count, 0),
          );
        },
      )
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const localMarketMap = new Map(localUsMarkets);
  const usMarkets = Array.from(new Set([...localMarketMap.keys(), ...Object.keys(repliersCounts)]))
    .flatMap((name) => {
      const code = stateCodes[name];
      if (!code) return [];
      const local = localMarketMap.get(name);
      return [[
        name,
        {
          name,
          code,
          count: (local?.count ?? 0) + (repliersCounts[name] ?? 0),
          image: local?.image ?? stateMarketPhotos[name] ?? fallbackMarketImage(name),
        },
      ] as const];
    })
    .sort((a, b) => b[1].count - a[1].count);

  return (
    <section className="bg-background py-16 md:py-24" aria-labelledby="regions-title">
      <div className="container-page">
        <SectionHeader
          align="center"
          title="Browse by Region"
          subtitle={`${(usListings.length + tranchiProperties.length + repliersTotal).toLocaleString("en-US")} US listings across all available states, then explore properties across Japan`}
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
                search={{ state: market.code }}
                className="group relative block aspect-4/3 overflow-hidden rounded-xl border border-border"
              >
                <img
                  src={market.image}
                  alt={`${market.name} real estate listings`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 z-10 p-3 sm:p-4">
                  <span className="block rounded-xl bg-slate-950/85 px-4 py-3 shadow-lg backdrop-blur-sm">
                    <span className="block text-lg font-bold text-white drop-shadow">
                      {market.name}
                    </span>
                    <span className="block text-sm font-medium text-white drop-shadow">
                      {market.count.toLocaleString("en-US")} listings
                    </span>
                    <span className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-white/50 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-white/20">
                      See listings
                      <ArrowRight className="h-4 w-4" />
                    </span>
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
