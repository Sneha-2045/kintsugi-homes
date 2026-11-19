import { useNavigate } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeDollarSign,
  CalendarDays,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/common/Button";
import { usListings } from "@/data/us-listings";
import { cn } from "@/lib/utils";

const tabs = ["Buy", "Foreclosure", "Auction", "Investment"] as const;
const markets = [
  { name: "Florida", detail: "Sunshine state deals" },
  { name: "Georgia", detail: "Atlanta & beyond" },
  { name: "North Carolina", detail: "New listings weekly" },
  { name: "Japan", detail: "Akiya & investment" },
];

export function HeroSearch() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Foreclosure");
  const [query, setQuery] = useState("");
  const [budget, setBudget] = useState(320000);
  const matchingListings = usListings.filter(
    (listing) => listing.priceUsd > 0 && listing.priceUsd <= budget,
  ).length;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const category = tab === "Foreclosure" ? "Foreclosure Sale" : tab === "Buy" ? undefined : tab;
    navigate({
      to: "/us-properties",
      search: { q: query.trim() || undefined, maxPrice: String(budget), category },
    });
  };

  const searchFor = (market: string) => {
    if (market === "Japan") navigate({ to: "/search", search: { q: "Japan" } });
    else navigate({ to: "/us-properties", search: { q: market } });
  };

  return (
    <section
      className="relative isolate overflow-hidden border-b border-border bg-[#07111f]"
      aria-labelledby="hero-title"
    >
      <img
        src="/images/miami-1369.avif"
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        className="hero-photo absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(5,12,23,.94)_0%,rgba(5,12,23,.82)_52%,rgba(5,12,23,.62)_100%)]" />
      <div className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_78%_10%,rgba(42,91,157,.24),transparent_42%),linear-gradient(0deg,rgba(5,12,23,.45),transparent_48%)]" />

      <div className="container-page relative z-10 py-12 sm:py-16 lg:py-20">
        <div className="grid min-w-0 items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,.72fr)] lg:gap-14">
          <div className="hero-enter min-w-0 max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold tracking-wide text-slate-200">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              PROPERTY SIGNAL · LIVE INVENTORY
            </div>
            <h1
              id="hero-title"
              className="max-w-3xl break-words text-[clamp(2rem,8.5vw,3rem)] font-bold leading-[1.04] tracking-tight text-white sm:text-5xl lg:text-[68px]"
            >
              More than a property.{" "}
              <span className="text-primary-light">Your next opportunity.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Discover exceptional homes, explore foreclosure opportunities, and find smarter ways
              to invest — all in one place.
            </p>

            <div className="mt-8 max-w-2xl overflow-hidden rounded-2xl border border-white/15 bg-[#111e30] shadow-2xl shadow-black/30">
              <div
                role="group"
                aria-label="Choose property category"
                className="no-scrollbar flex gap-1 overflow-x-auto border-b border-white/10 px-3 pt-2 sm:px-5"
              >
                {tabs.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTab(item)}
                    aria-pressed={tab === item}
                    className={cn(
                      "relative px-4 py-3 text-sm font-semibold transition-colors",
                      tab === item ? "text-white" : "text-slate-400 hover:text-white",
                    )}
                  >
                    {item}
                    {tab === item && (
                      <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary-light" />
                    )}
                  </button>
                ))}
              </div>
              <form onSubmit={onSubmit} className="flex flex-col gap-3 p-3 sm:flex-row sm:p-4">
                <label htmlFor="hero-search" className="sr-only">
                  Search by city, state, or ZIP code
                </label>
                <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-white/15 bg-[#0b1422] px-4 focus-within:border-primary-light/70 focus-within:ring-2 focus-within:ring-primary/30">
                  <MapPin className="h-5 w-5 shrink-0 text-primary-light" />
                  <input
                    id="hero-search"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="City, state, or ZIP code"
                    className="h-12 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    aria-label="Adjust maximum home price"
                    aria-controls="hero-budget"
                    onClick={() => document.getElementById("hero-budget")?.focus()}
                    className="hidden rounded-md p-2 text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-light sm:block"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </button>
                </div>
                <Button type="submit" size="lg" className="h-12 rounded-xl px-6">
                  <Search className="h-4 w-4" /> Explore homes
                </Button>
              </form>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 pb-4 text-xs text-slate-400">
                <span>Popular:</span>
                {["Miami, FL", "Atlanta, GA", "Charlotte, NC"].map((place) => (
                  <button
                    key={place}
                    type="button"
                    onClick={() => setQuery(place)}
                    className="text-slate-200 underline decoration-white/20 underline-offset-4 transition hover:text-white"
                  >
                    {place}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">
              <span>
                <strong className="font-mono text-white">
                  {usListings.length.toLocaleString("en-US")}
                </strong>{" "}
                indexed US listings
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-primary-light" /> Auction dates shown when
                available
              </span>
            </div>
          </div>

          <aside
            className="hero-enter relative mx-auto w-full min-w-0 max-w-md [animation-delay:140ms] lg:mx-0 lg:justify-self-end"
            aria-label="Home affordability planner"
          >
            <div className="absolute -inset-3 rounded-[2rem] bg-primary/20 blur-2xl" />
            <div className="relative rounded-[1.5rem] border border-white/15 bg-[#111e30] p-4 shadow-2xl sm:p-7">
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between sm:gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-primary-light">
                    <Sparkles className="h-4 w-4" /> Smart home finder
                  </div>
                  <h2 className="mt-3 text-[clamp(1.25rem,6vw,1.5rem)] font-bold text-white">
                    Set your comfort zone
                  </h2>
                </div>
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
                  QUICK ESTIMATE
                </span>
              </div>
              <div className="mt-6 rounded-2xl border border-white/10 bg-[#0b1422] p-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-400">Target home price</p>
                    <p className="mt-1 font-mono text-3xl font-bold tracking-tight text-white">
                      ${budget.toLocaleString()}
                    </p>
                  </div>
                  <BadgeDollarSign className="mb-1 h-7 w-7 text-primary-light" />
                </div>
                <input
                  id="hero-budget"
                  aria-label="Maximum home price"
                  type="range"
                  min="100000"
                  max="800000"
                  step="10000"
                  value={budget}
                  onChange={(event) => setBudget(Number(event.target.value))}
                  className="mt-5 h-2 w-full cursor-pointer accent-blue-400"
                />
                <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                  <span>$100k</span>
                  <span>$800k</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-[#0b1422] p-4">
                  <p className="text-xs text-slate-300">Matching indexed listings</p>
                  <p className="mt-1 text-xl font-bold text-white">
                    {matchingListings.toLocaleString()}
                    <span className="text-xs font-medium text-slate-300"> homes</span>
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0b1422] p-4">
                  <p className="text-xs text-slate-300">Search signal</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-emerald-300">
                    <ArrowUpRight className="h-4 w-4" /> Live listings
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  navigate({ to: "/us-properties", search: { maxPrice: String(budget) } })
                }
                className="mt-5 flex w-full items-center justify-between rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#111e30]"
              >
                Find homes in my range <ArrowRight className="h-4 w-4" />
              </button>
              <p className="mt-3 text-[11px] leading-4 text-slate-400">
                Counts reflect priced homes in our current foreclosure index.
              </p>
            </div>
          </aside>
        </div>

        <div className="mt-12 border-t border-white/15 pt-5 sm:mt-14">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-slate-400">
              Explore markets
            </p>
            <ArrowDownRight className="h-4 w-4 text-slate-500" />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {markets.map((market) => (
              <button
                key={market.name}
                type="button"
                onClick={() => searchFor(market.name)}
                className="group flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#111e30] px-4 py-3 text-left transition hover:border-primary-light/40 hover:bg-[#172941]"
              >
                <span>
                  <span className="block text-sm font-semibold text-white">{market.name}</span>
                  <span className="mt-0.5 block text-xs text-slate-400">{market.detail}</span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary-light" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
