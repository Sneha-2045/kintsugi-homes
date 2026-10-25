import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BedDouble, Bath, Maximize2, MapPin } from "lucide-react";

import { PageShell } from "@/components/layout/PageShell";
import { CountrySwitcher } from "@/components/common/CountrySwitcher";
import { PropertyCard } from "@/components/property/PropertyCard";
import { CompareToggle, usePropertyComparison } from "@/components/property/PropertyComparison";
import { usListings } from "@/data/us-listings";
import { tranchiProperties } from "@/data/tranchi-properties";
import { formatUsd } from "@/data/properties";
import { canonicalLink } from "@/lib/seo";
import { fromProperty } from "@/lib/property-comparison";
import type { Property } from "@/types/property";
import { SaveSearchButton } from "@/components/search/SaveSearchButton";

const title = "US Properties & Investment Opportunities | Rylestate";
const description = "Explore US property opportunities with source-provided prices, property images, and clearly identified investment estimates.";

export const Route = createFileRoute("/us-properties")({
  validateSearch: (search: Record<string, unknown>): { q?: string | undefined; minPrice?: string | undefined; maxPrice?: string | undefined; state?: string | undefined; city?: string | undefined; category?: string | undefined; bedrooms?: string | undefined; status?: string | undefined } => ({
    q: typeof search["q"] === "string" && search["q"].length > 0 ? search["q"] : undefined,
    minPrice: typeof search["minPrice"] === "string" ? search["minPrice"] : undefined,
    maxPrice: typeof search["maxPrice"] === "string" ? search["maxPrice"] : undefined,
    state: typeof search["state"] === "string" ? search["state"] : undefined,
    city: typeof search["city"] === "string" ? search["city"] : undefined,
    category: typeof search["category"] === "string" ? search["category"] : undefined,
    bedrooms: typeof search["bedrooms"] === "string" ? search["bedrooms"] : undefined,
    status: typeof search["status"] === "string" ? search["status"] : undefined,
  }),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
    links: [canonicalLink("/us-properties")],
  }),
  component: USPropertiesPage,
});

function USPropertiesPage() {
  const search = Route.useSearch();
  const { q } = search;
  const [minPrice, setMinPrice] = useState(search.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(search.maxPrice ?? "");
  const [state, setState] = useState(search.state ?? "");
  const [city, setCity] = useState(search.city ?? "");
  const [category, setCategory] = useState(search.category ?? "");
  const [bedrooms, setBedrooms] = useState(search.bedrooms ?? "");
  const [status, setStatus] = useState(search.status ?? "");
  const [sort, setSort] = useState("default");
  useEffect(() => {
    setMinPrice(search.minPrice ?? ""); setMaxPrice(search.maxPrice ?? ""); setState(search.state ?? "");
    setCity(search.city ?? ""); setCategory(search.category ?? ""); setBedrooms(search.bedrooms ?? ""); setStatus(search.status ?? "");
  }, [search.minPrice, search.maxPrice, search.state, search.city, search.category, search.bedrooms, search.status]);
  const term = q?.toLowerCase() ?? "";
  const categories = [...new Set(tranchiProperties.map((p) => p.dealCategory).filter((v): v is string => Boolean(v)))];
  const statuses = [...new Set(tranchiProperties.map((p) => p.status).filter((v): v is string => Boolean(v)))];
  const listings = useMemo(() => {
    const filtered = tranchiProperties.filter((p) => {
      const price = p.priceUsd;
      return (!term || [p.title, p.location, p.dealCategory, p.leadStatus].join(" ").toLowerCase().includes(term))
        && (!minPrice || (price > 0 && price >= Number(minPrice)))
        && (!maxPrice || (price > 0 && price <= Number(maxPrice)))
        && (!state || (p.state ?? "").toLowerCase().includes(state.toLowerCase()))
        && (!city || (p.city ?? "").toLowerCase().includes(city.toLowerCase()))
        && (!category || p.dealCategory === category)
        && (!bedrooms || (p.bedrooms ?? 0) >= Number(bedrooms))
        && (!status || p.status === status);
    });
    return filtered.sort((a, b) => {
      if (sort === "price-asc") return (a.priceUsd || Number.MAX_VALUE) - (b.priceUsd || Number.MAX_VALUE);
      if (sort === "price-desc") return (b.priceUsd || -1) - (a.priceUsd || -1);
      if (sort === "value-desc") return (b.estimatedAppraisedValue ?? b.estimatedMarketValue ?? -1) - (a.estimatedAppraisedValue ?? a.estimatedMarketValue ?? -1);
      if (sort === "cashflow-desc") return (b.monthlyCashFlowEstimate ?? -Infinity) - (a.monthlyCashFlowEstimate ?? -Infinity);
      return 0;
    });
  }, [term, minPrice, maxPrice, state, city, category, bedrooms, status, sort]);
  const otherListings = term
    ? usListings.filter((p) => !p.isTranchi && [p.title, p.location, p.prefecture, p.tags.join(" ")].join(" ").toLowerCase().includes(term))
    : usListings.filter((p) => !p.isTranchi);

  return (
    <PageShell title={q ? `US properties matching “${q}”` : "US Properties"} description={q ? `${listings.length + otherListings.length} matching US listings.` : description}>
      <div className="mb-8"><CountrySwitcher active="us" /></div>

      <section aria-labelledby="investment-heading" className="mb-16">
        <div className="rounded-3xl border border-blue-900/40 bg-gradient-to-br from-[#101d32] via-[#0d1728] to-[#111a2a] p-6 shadow-elevated md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">Curated US opportunities</p>
          <h2 id="investment-heading" className="mt-3 text-2xl font-bold text-white md:text-4xl">Find Your Next <em>$5k House.</em></h2>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-300 md:text-base">Explore handpicked US property opportunities, from foreclosure sales to below-market homes, with property images and investment insights to help you make informed decisions.</p>

          <div className="mt-8 grid gap-3 rounded-2xl border border-white/10 bg-black/10 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-medium text-slate-300">Minimum price<input type="number" min="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="$ Min" className="mt-1.5 w-full rounded-lg border border-white/15 bg-slate-950/50 px-3 py-2.5 text-sm text-white placeholder:text-slate-500" /></label>
            <label className="text-xs font-medium text-slate-300">Maximum price<input type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="$ Max" className="mt-1.5 w-full rounded-lg border border-white/15 bg-slate-950/50 px-3 py-2.5 text-sm text-white placeholder:text-slate-500" /></label>
            <label className="text-xs font-medium text-slate-300">State<input value={state} onChange={(e) => setState(e.target.value)} placeholder="State or code" className="mt-1.5 w-full rounded-lg border border-white/15 bg-slate-950/50 px-3 py-2.5 text-sm text-white placeholder:text-slate-500" /></label>
            <label className="text-xs font-medium text-slate-300">City<input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="mt-1.5 w-full rounded-lg border border-white/15 bg-slate-950/50 px-3 py-2.5 text-sm text-white placeholder:text-slate-500" /></label>
            <label className="text-xs font-medium text-slate-300">Deal category<select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1.5 w-full rounded-lg border border-white/15 bg-slate-950/50 px-3 py-2.5 text-sm text-white"><option value="">All categories</option>{categories.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
            <label className="text-xs font-medium text-slate-300">Bedrooms<select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="mt-1.5 w-full rounded-lg border border-white/15 bg-slate-950/50 px-3 py-2.5 text-sm text-white"><option value="">Any</option>{[1,2,3,4,5].map((v) => <option key={v} value={v}>{v}+ bedrooms</option>)}</select></label>
            <label className="text-xs font-medium text-slate-300">Property status<select disabled={!statuses.length} value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1.5 w-full rounded-lg border border-white/15 bg-slate-950/50 px-3 py-2.5 text-sm text-white disabled:opacity-60"><option value="">{statuses.length ? "Any status" : "Unavailable in source"}</option>{statuses.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
            <label className="text-xs font-medium text-slate-300">Sort by<select value={sort} onChange={(e) => setSort(e.target.value)} className="mt-1.5 w-full rounded-lg border border-white/15 bg-slate-950/50 px-3 py-2.5 text-sm text-white"><option value="default">Recommended</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="value-desc">Estimated value</option><option value="cashflow-desc">Estimated cash flow</option></select></label>
          </div>

          <div className="mt-4 flex justify-end">
            <SaveSearchButton
              filters={{ source: "us", q: q ?? "", minPrice, maxPrice, state, city, category, bedrooms, status }}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 font-semibold text-white transition hover:bg-white/10"
            />
          </div>

          <p className="mt-5 text-sm text-slate-400">{listings.length} opportunities · Price and investment figures are source-provided estimates and should be independently confirmed.</p>
          {listings.length ? <ul className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{listings.map((p) => <li key={p.id}><InvestmentCard property={p} /></li>)}</ul> : <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-10 text-center text-slate-300">No opportunities match these filters. Adjust your search to see more listings.</div>}
        </div>
      </section>

      <section aria-labelledby="other-us-heading">
        <h2 id="other-us-heading" className="mb-6 text-2xl font-bold text-foreground">More US foreclosure listings</h2>
        {otherListings.length ? <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{otherListings.map((property) => <li key={property.id}><PropertyCard property={property} /></li>)}</ul> : <p className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">No other US listings matched that search.</p>}
      </section>
    </PageShell>
  );
}

function InvestmentCard({ property }: { property: Property }) {
  const [imageFailed, setImageFailed] = useState(false);
  const comparison = usePropertyComparison();
  const comparisonProperty = fromProperty(property);
  const comparisonSelected = comparison.selected(comparisonProperty.key);
  const cityState = [property.city, property.state].filter(Boolean).join(", ");
  const fullLocation = [cityState, property.zipCode].filter(Boolean).join(" ") || "Location unavailable";
  const displayedValue = property.estimatedAppraisedValue ?? property.estimatedMarketValue;
  return (
    <article className={`h-full overflow-hidden rounded-2xl border bg-[#111d30] shadow-lg transition hover:-translate-y-0.5 hover:border-blue-400/40 ${comparisonSelected ? "border-blue-300 ring-2 ring-blue-400/50" : "border-white/10"}`}>
      <Link to="/property/$id" params={{ id: property.id }} className="group block" aria-label={`View property: ${property.title}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
          {property.images[0] && !imageFailed ? <img src={property.images[0]} alt={`${property.title} property`} loading="lazy" sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" onError={() => setImageFailed(true)} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" /> : <div className="grid h-full place-items-center text-sm text-slate-400">Property image unavailable</div>}
          {property.dealCategory && <span className="absolute left-3 top-3 rounded-full bg-[#101d32]/90 px-3 py-1 text-xs font-semibold text-blue-100 backdrop-blur">{property.dealCategory}</span>}
          {property.status && <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold capitalize text-slate-900">{property.status}</span>}
        </div>
      </Link>
      <div className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-blue-300">Reported price</p>
        <p className="mt-1 text-2xl font-bold text-white">{property.priceUsd > 0 ? formatUsd(property.priceUsd) : "Unavailable"}</p>
        <h3 className="mt-3 text-lg font-semibold leading-snug text-white">{property.address ?? property.title}</h3>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-300"><MapPin className="h-4 w-4 shrink-0 text-blue-300" />{fullLocation}</p>
        <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-b border-white/10 pb-4 text-sm text-slate-300">
          {property.bedrooms != null && <Fact icon={<BedDouble className="h-4 w-4" />} label="Bedrooms" value={String(property.bedrooms)} />}
          {property.bathrooms != null && <Fact icon={<Bath className="h-4 w-4" />} label="Bathrooms" value={String(property.bathrooms)} />}
          {property.floorArea ? <Fact icon={<Maximize2 className="h-4 w-4" />} label="Square feet" value={property.floorArea.toLocaleString()} /> : null}
        </dl>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          {displayedValue != null && displayedValue > 0 && <Metric label="Estimated value" value={formatUsd(displayedValue)} />}
          {property.monthlyRentEstimate != null && property.monthlyRentEstimate > 0 && <Metric label="Est. monthly rent" value={`${formatUsd(property.monthlyRentEstimate)}/mo`} />}
          {property.monthlyCashFlowEstimate != null && <Metric label="Est. monthly cash flow" value={`${formatUsd(property.monthlyCashFlowEstimate)}/mo`} />}
          {property.leadStatus && <Metric label="Lead status" value={property.leadStatus} />}
        </dl>
        <Link to="/property/$id" params={{ id: property.id }} className="mt-5 flex min-h-11 items-center justify-center rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300">View Property</Link>
        <div className="mt-3"><CompareToggle property={comparisonProperty} /></div>
        <p className="mt-3 text-[11px] leading-5 text-slate-400">Source figures may be estimates. Confirm price, availability, and terms independently.</p>
      </div>
    </article>
  );
}

function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-1.5"><dt className="sr-only">{label}</dt><dd className="flex items-center gap-1.5">{icon}{value}</dd></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-slate-950/40 p-3"><dt className="text-xs text-slate-400">{label}</dt><dd className="mt-1 font-semibold text-slate-100">{value}</dd></div>;
}
