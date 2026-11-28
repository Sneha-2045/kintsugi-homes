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
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/common/Button";
import { usListings } from "@/data/us-listings";
import { cn } from "@/lib/utils";

const tabs = ["Buy", "Rent", "Foreclosure", "Auction", "Investment"] as const;
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
  const [rentalMin, setRentalMin] = useState("");
  const [rentalType, setRentalType] = useState("");
  const [rentalBeds, setRentalBeds] = useState("");
  const [rentalBaths, setRentalBaths] = useState("");
  const [rentalAvailability, setRentalAvailability] = useState("");
  const [rentalFurnished, setRentalFurnished] = useState("");
  const [rentalLease, setRentalLease] = useState("");
  const [rentalAmenities, setRentalAmenities] = useState<string[]>([]);
  const [rentalMatches, setRentalMatches] = useState<number | null>(null);
  const [rentalCountLoading, setRentalCountLoading] = useState(false);
  const matchingListings = usListings.filter((listing) => {
    if (!(listing.priceUsd > 0 && listing.priceUsd <= budget)) return false;
    const term = query.trim().toLowerCase();
    if (
      term &&
      ![listing.title, listing.location, ...listing.tags]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    )
      return false;
    if (tab === "Foreclosure")
      return listing.dealCategory === "Foreclosure Sale" || listing.tags.includes("Foreclosure");
    if (tab === "Auction") return Boolean(listing.auctionDate) || listing.tags.includes("Auction");
    if (tab === "Investment")
      return listing.dealCategory === "Investment" || listing.tags.includes("Investment");
    return true;
  }).length;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("rentMode") !== "1") return;
    setTab("Rent");
    setQuery(params.get("rentQ") ?? "");
    setRentalMin(params.get("rentMin") ?? "");
    setBudget(Number(params.get("rentMax")) || 3200);
    setRentalType(params.get("rentType") ?? "");
    setRentalBeds(params.get("rentStudio") === "true" ? "0" : (params.get("rentBeds") ?? ""));
    setRentalBaths(params.get("rentBaths") ?? "");
    setRentalAvailability(params.get("rentAvailability") ?? "");
    setRentalFurnished(params.get("rentFurnished") ?? "");
    setRentalLease(params.get("rentLease") ?? "");
    setRentalAmenities(params.getAll("rentAmenity"));
  }, []);

  useEffect(() => {
    if (tab !== "Rent") return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setRentalCountLoading(true);
      try {
        const params = new URLSearchParams({ offset: "0", maxRent: String(budget) });
        params.set("preview", "1");
        if (query.trim()) params.set("q", query.trim());
        if (rentalMin) params.set("minRent", rentalMin);
        if (rentalType) params.set("type", rentalType);
        if (rentalBeds === "0") params.set("studio", "true");
        else if (rentalBeds) params.set("beds", rentalBeds);
        if (rentalBaths) params.set("bathrooms", rentalBaths);
        if (rentalAvailability) params.set("availability", rentalAvailability);
        if (rentalFurnished) params.set("furnished", rentalFurnished);
        if (rentalLease) params.set("leaseDuration", rentalLease);
        rentalAmenities.forEach((amenity) => params.append("amenity", amenity));
        const response = await fetch(`/api/rentals?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Rental count unavailable");
        const result = (await response.json()) as { totalCount?: number };
        setRentalMatches(result.totalCount ?? 0);
      } catch {
        if (!controller.signal.aborted) setRentalMatches(null);
      } finally {
        if (!controller.signal.aborted) setRentalCountLoading(false);
      }
    }, 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [
    tab,
    budget,
    query,
    rentalMin,
    rentalType,
    rentalBeds,
    rentalBaths,
    rentalAvailability,
    rentalFurnished,
    rentalLease,
    rentalAmenities,
  ]);

  const searchResultsUrl = () => {
    const params = new URLSearchParams({
      category: tab.toLowerCase(),
      maxPrice: String(budget),
    });
    if (query.trim()) params.set("q", query.trim());
    if (tab === "Rent") {
      if (rentalMin) params.set("minPrice", rentalMin);
      if (rentalType) params.set("propertyType", rentalType);
      if (rentalBeds) params.set("bedrooms", rentalBeds);
      if (rentalBaths) params.set("bathrooms", rentalBaths);
      if (rentalAvailability) params.set("availability", rentalAvailability);
      if (rentalFurnished) params.set("furnished", rentalFurnished);
      if (rentalLease) params.set("leaseDuration", rentalLease);
      rentalAmenities.forEach((amenity) => params.append("amenity", amenity));
    }
    return `/properties/search?${params.toString()}`;
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    window.location.assign(searchResultsUrl());
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
              {tab === "Rent" ? (
                <span className="text-primary-light">Find Your Next Home to Rent.</span>
              ) : (
                <>
                  More than a property.{" "}
                  <span className="text-primary-light">Your next opportunity.</span>
                </>
              )}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              {tab === "Rent"
                ? "Explore rental properties across all 50 U.S. states. Find a home that fits your lifestyle and budget."
                : "Discover exceptional homes, explore foreclosure opportunities, and find smarter ways to invest — all in one place."}
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
                    onClick={() => {
                      setTab(item);
                      setBudget(item === "Rent" ? 3200 : 320000);
                    }}
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
              <form
                onSubmit={onSubmit}
                className={`grid gap-3 p-3 sm:p-4 ${tab === "Rent" ? "sm:grid-cols-2" : "sm:grid-cols-[minmax(0,1fr)_auto]"}`}
              >
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
                    placeholder={
                      tab === "Rent"
                        ? "City, state, ZIP or neighborhood"
                        : "City, state, or ZIP code"
                    }
                    className="h-12 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    aria-label={
                      tab === "Rent" ? "Adjust maximum monthly rent" : "Adjust maximum home price"
                    }
                    aria-controls="hero-budget"
                    onClick={() => document.getElementById("hero-budget")?.focus()}
                    className="hidden rounded-md p-2 text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-light sm:block"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </button>
                </div>
                {tab === "Rent" && (
                  <>
                    <label className="sr-only" htmlFor="rental-min">
                      Minimum monthly rent
                    </label>
                    <input
                      id="rental-min"
                      type="number"
                      min="0"
                      value={rentalMin}
                      onChange={(event) => setRentalMin(event.target.value)}
                      placeholder="Min monthly rent"
                      className="h-12 min-w-0 rounded-xl border border-white/15 bg-[#0b1422] px-4 text-sm text-white outline-none placeholder:text-slate-400 focus:border-primary-light/70"
                    />
                    <label className="sr-only" htmlFor="rental-type">
                      Property type
                    </label>
                    <select
                      id="rental-type"
                      value={rentalType}
                      onChange={(event) => setRentalType(event.target.value)}
                      className="h-12 min-w-0 rounded-xl border border-white/15 bg-[#0b1422] px-4 text-sm text-white outline-none focus:border-primary-light/70"
                    >
                      <option value="">Any property type</option>
                      {["Apartment", "House", "Condo", "Townhouse", "Studio", "Duplex"].map(
                        (type) => (
                          <option key={type}>{type}</option>
                        ),
                      )}
                    </select>
                    <label className="sr-only" htmlFor="rental-beds">
                      Bedrooms
                    </label>
                    <select
                      id="rental-beds"
                      value={rentalBeds}
                      onChange={(event) => setRentalBeds(event.target.value)}
                      className="h-12 min-w-0 rounded-xl border border-white/15 bg-[#0b1422] px-4 text-sm text-white outline-none focus:border-primary-light/70"
                    >
                      <option value="">Any bedrooms</option>
                      <option value="0">Studio</option>
                      <option value="1">1+ bedrooms</option>
                      <option value="2">2+ bedrooms</option>
                      <option value="3">3+ bedrooms</option>
                      <option value="4">4+ bedrooms</option>
                    </select>
                    <label className="sr-only" htmlFor="rental-baths">
                      Bathrooms
                    </label>
                    <select
                      id="rental-baths"
                      value={rentalBaths}
                      onChange={(event) => setRentalBaths(event.target.value)}
                      className="h-12 min-w-0 rounded-xl border border-white/15 bg-[#0b1422] px-4 text-sm text-white outline-none focus:border-primary-light/70"
                    >
                      <option value="">Any bathrooms</option>
                      {[1, 2, 3, 4].map((baths) => (
                        <option key={baths} value={baths}>
                          {baths}+ bathrooms
                        </option>
                      ))}
                    </select>
                    <label className="sr-only" htmlFor="rental-availability">
                      Availability
                    </label>
                    <select
                      id="rental-availability"
                      value={rentalAvailability}
                      onChange={(event) => setRentalAvailability(event.target.value)}
                      className="h-12 min-w-0 rounded-xl border border-white/15 bg-[#0b1422] px-4 text-sm text-white outline-none focus:border-primary-light/70"
                    >
                      <option value="">Any availability</option>
                      <option value="now">Available now</option>
                      <option value="soon">Available soon</option>
                    </select>
                    <label className="sr-only" htmlFor="rental-furnished">
                      Furnishing
                    </label>
                    <select
                      id="rental-furnished"
                      value={rentalFurnished}
                      onChange={(event) => setRentalFurnished(event.target.value)}
                      className="h-12 min-w-0 rounded-xl border border-white/15 bg-[#0b1422] px-4 text-sm text-white outline-none focus:border-primary-light/70"
                    >
                      <option value="">Any furnishing</option>
                      <option value="true">Furnished</option>
                      <option value="false">Unfurnished</option>
                    </select>
                    <label className="sr-only" htmlFor="rental-lease">
                      Lease duration
                    </label>
                    <select
                      id="rental-lease"
                      value={rentalLease}
                      onChange={(event) => setRentalLease(event.target.value)}
                      className="h-12 min-w-0 rounded-xl border border-white/15 bg-[#0b1422] px-4 text-sm text-white outline-none focus:border-primary-light/70"
                    >
                      <option value="">Any lease duration</option>
                      <option value="short">Short-term</option>
                      <option value="long">Long-term</option>
                    </select>
                    <fieldset className="sm:col-span-2">
                      <legend className="mb-2 text-xs font-semibold text-slate-300">
                        Amenities
                      </legend>
                      <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {[
                          "Pool",
                          "Gym",
                          "Parking",
                          "Pet Friendly",
                          "Laundry",
                          "Dishwasher",
                          "Balcony",
                        ].map((amenity) => (
                          <label
                            key={amenity}
                            className="flex items-center gap-2 text-xs text-slate-300"
                          >
                            <input
                              type="checkbox"
                              checked={rentalAmenities.includes(amenity)}
                              onChange={(event) =>
                                setRentalAmenities((current) =>
                                  event.target.checked
                                    ? [...current, amenity]
                                    : current.filter((item) => item !== amenity),
                                )
                              }
                              className="accent-blue-400"
                            />
                            {amenity}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  </>
                )}
                <Button type="submit" size="lg" className="h-12 rounded-xl px-6">
                  <Search className="h-4 w-4" />{" "}
                  {tab === "Rent" ? "Search Rentals" : "Explore homes"}
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
              {tab === "Rent" ? (
                <span>
                  <strong className="font-mono text-white">
                    {rentalMatches?.toLocaleString("en-US") ?? "—"}
                  </strong>{" "}
                  matching rental listings
                </span>
              ) : null}
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
                    <p className="text-xs text-slate-400">
                      {tab === "Rent" ? "Monthly rental budget" : "Target home price"}
                    </p>
                    <p className="mt-1 font-mono text-3xl font-bold tracking-tight text-white">
                      ${tab === "Rent" ? budget.toLocaleString() : budget.toLocaleString()}
                      {tab === "Rent" ? (
                        <span className="ml-1 text-sm font-medium text-slate-400">/mo</span>
                      ) : null}
                    </p>
                  </div>
                  <BadgeDollarSign className="mb-1 h-7 w-7 text-primary-light" />
                </div>
                <input
                  id="hero-budget"
                  aria-label={
                    tab === "Rent" ? "Maximum monthly rental budget" : "Maximum home price"
                  }
                  type="range"
                  min={tab === "Rent" ? "500" : "100000"}
                  max={tab === "Rent" ? "10000" : "800000"}
                  step={tab === "Rent" ? "100" : "10000"}
                  value={budget}
                  onChange={(event) => setBudget(Number(event.target.value))}
                  className="mt-5 h-2 w-full cursor-pointer accent-blue-400"
                />
                <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                  <span>{tab === "Rent" ? "$500/mo" : "$100k"}</span>
                  <span>{tab === "Rent" ? "$10k/mo" : "$800k"}</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-[#0b1422] p-4">
                  <p className="text-xs text-slate-300">
                    {tab === "Rent" ? "Matching rental homes" : "Matching indexed listings"}
                  </p>
                  <p className="mt-1 text-xl font-bold text-white">
                    {tab === "Rent"
                      ? rentalCountLoading
                        ? "…"
                        : (rentalMatches?.toLocaleString() ?? "—")
                      : matchingListings.toLocaleString()}
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
                onClick={() => {
                  window.location.assign(searchResultsUrl());
                }}
                className="mt-5 flex w-full items-center justify-between rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#111e30]"
              >
                {tab === "Rent" ? "Find rentals in my range" : "Find homes in my range"}{" "}
                <ArrowRight className="h-4 w-4" />
              </button>
              <p className="mt-3 text-[11px] leading-4 text-slate-400">
                {tab === "Rent"
                  ? "Rental matches are counted from the active nationwide rentals feed."
                  : "Counts reflect priced listings in the selected property category."}
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
