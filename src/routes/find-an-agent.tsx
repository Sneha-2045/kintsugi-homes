import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, MapPin, Search, SlidersHorizontal, Star, Trophy, Users } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { canonicalLink } from "@/lib/seo";

export const Route = createFileRoute("/find-an-agent")({
  validateSearch: (search: Record<string, unknown>) => ({
    location: typeof search["location"] === "string" ? search["location"] : undefined,
    q: typeof search["q"] === "string" ? search["q"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Real Estate Agents | Rylestate" },
      {
        name: "description",
        content: "Browse the real estate agents available in the Rylestate directory.",
      },
    ],
    links: [canonicalLink("/find-an-agent")],
  }),
  component: FindAnAgentPage,
});

type Agent = {
  id: string;
  name: string;
  profileImage?: string;
  brokerage?: string;
  rating?: number;
  reviewCount?: number;
  salesPriceRange?: string;
  salesLast12Months?: number;
  salesInSelectedCity?: number;
  city?: string;
  state?: string;
  zipCode?: string;
  zillowProfileUrl: string;
};

type AgentResponse = { agents: Agent[]; total: number; page: number; totalPages: number };
const AGENT_CACHE_TTL = 24 * 60 * 60 * 1000;

function readAgentCache(key: string): AgentResponse | undefined {
  try {
    const cached = window.localStorage.getItem(key);
    if (!cached) return undefined;
    const parsed = JSON.parse(cached) as { savedAt?: number; data?: AgentResponse };
    if (
      !parsed.savedAt ||
      Date.now() - parsed.savedAt > AGENT_CACHE_TTL ||
      !Array.isArray(parsed.data?.agents)
    ) {
      window.localStorage.removeItem(key);
      return undefined;
    }
    return parsed.data;
  } catch {
    return undefined;
  }
}

function FindAnAgentPage() {
  const initialSearch = Route.useSearch();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AgentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [locationInput, setLocationInput] = useState(initialSearch.location ?? "");
  const [queryInput, setQueryInput] = useState(initialSearch.q ?? "");
  const [location, setLocation] = useState(initialSearch.location ?? "");
  const [query, setQuery] = useState(initialSearch.q ?? "");
  const [sortBy, setSortBy] = useState<"sales" | "rating">("sales");
  const [retryCount, setRetryCount] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const search = new URLSearchParams({
      page: String(page),
      limit: "24",
      sortBy,
      sortOrder: "desc",
    });
    if (location) search.set("location", location);
    if (query) search.set("q", query);
    const cacheKey = `rylestate-agents-v2:${search.toString()}`;
    const cached = readAgentCache(cacheKey);
    let timedOut = false;
    if (cached) {
      setData(cached);
      setLoading(false);
    } else {
      setData(null);
      setLoading(true);
    }
    setError("");
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
      // The first request may need to read and rank the latest Apify directory.
      // Give that cold cache fill time to finish before surfacing a timeout.
    }, 45000);
    fetch(`/api/agents?${search.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error || "Agent search is temporarily unavailable.");
        }
        return response.json() as Promise<AgentResponse>;
      })
      .then((result) => {
        setData(result);
        try {
          window.localStorage.setItem(
            cacheKey,
            JSON.stringify({ savedAt: Date.now(), data: result }),
          );
        } catch {
          // The live database response remains usable when browser storage is unavailable.
        }
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted && !timedOut) return;
        if (cached) return;
        if (timedOut) {
          setError("The agent directory is taking longer than usual to respond.");
          return;
        }
        setError(
          reason instanceof Error ? reason.message : "Agent search is temporarily unavailable.",
        );
        setData(null);
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
        if (!controller.signal.aborted || timedOut) setLoading(false);
      });
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [page, location, query, sortBy, retryCount]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setLocation(locationInput.trim());
    setQuery(queryInput.trim());
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <section className="relative isolate overflow-hidden border-b border-border bg-[#081526] text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_10%,rgba(45,121,235,.34),transparent_42%),radial-gradient(ellipse_at_8%_100%,rgba(23,171,151,.16),transparent_45%)]"
        />
        <div className="container-page py-12 md:py-16">
          <p className="inline-flex items-center gap-2 rounded-full border border-blue-200/20 bg-blue-200/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
            <Trophy className="h-4 w-4" aria-hidden="true" /> Agent directory · ranked by sales
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
            Find an agent who knows your market.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
            Compare recent sales, client ratings, brokerages, and price ranges to find the right
            local fit for your next move.
          </p>
          <form
            onSubmit={submitSearch}
            className="mt-8 grid max-w-5xl gap-3 rounded-2xl border border-white/10 bg-slate-950/55 p-3 shadow-2xl shadow-black/20 md:grid-cols-[1fr_1fr_auto]"
          >
            <label className="flex min-h-12 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4">
              <MapPin className="h-5 w-5 shrink-0 text-blue-300" aria-hidden="true" />
              <span className="sr-only">City, state, or ZIP</span>
              <input
                value={locationInput}
                onChange={(event) => setLocationInput(event.target.value)}
                placeholder="City, state, or ZIP"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
              />
            </label>
            <label className="flex min-h-12 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4">
              <Search className="h-5 w-5 shrink-0 text-blue-300" aria-hidden="true" />
              <span className="sr-only">Agent name or brokerage</span>
              <input
                value={queryInput}
                onChange={(event) => setQueryInput(event.target.value)}
                placeholder="Agent name or brokerage"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
              />
            </label>
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 text-sm font-bold text-white transition hover:bg-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
            >
              Search agents <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      </section>

      <section className="container-page py-9">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Real estate agents</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {loading
                ? "Loading agents from the directory…"
                : `${(data?.total ?? 0).toLocaleString()} agents · sorted by ${sortBy === "sales" ? "reported sales" : "rating and reviews"}`}
            </p>
          </div>
          <label className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4 text-primary-light" aria-hidden="true" />
            <span className="sr-only">Sort agents</span>
            <select
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value === "rating" ? "rating" : "sales");
                setPage(1);
              }}
              className="bg-transparent font-semibold text-foreground outline-none"
            >
              <option value="sales">Most sales</option>
              <option value="rating">Top rated</option>
            </select>
          </label>
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-7 flex flex-col gap-4 rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-foreground sm:flex-row sm:items-center sm:justify-between"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
              className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-primary px-4 font-semibold text-primary-foreground transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Try again
            </button>
          </div>
        ) : null}
        {loading ? (
          <p
            role="status"
            className="mt-7 rounded-xl border border-border bg-card p-8 text-center text-muted-foreground"
          >
            Loading agent records…
          </p>
        ) : null}
        {!loading && !error && data?.agents.length === 0 ? (
          <p className="mt-7 rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
            No agents are currently available in the directory.
          </p>
        ) : null}

        {!loading && !error && data?.agents.length ? (
          <div className="mt-7 grid gap-5 lg:grid-cols-2">
            {data.agents.map((agent) => (
              <article
                key={agent.id}
                className="group flex min-h-52 flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-elevated sm:flex-row sm:items-center sm:p-6"
              >
                {agent.profileImage ? (
                  <img
                    src={agent.profileImage}
                    alt={`${agent.name} headshot`}
                    loading="lazy"
                    className="h-28 w-28 shrink-0 rounded-full border border-border bg-elevated object-cover"
                  />
                ) : (
                  <div
                    aria-label={`${agent.name} profile image unavailable`}
                    className="grid h-28 w-28 shrink-0 place-items-center rounded-full border border-primary/20 bg-primary/10 font-display text-3xl font-bold text-primary-light"
                  >
                    {agent.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{agent.name}</h3>
                      {agent.brokerage ? (
                        <p className="mt-1 text-sm text-muted-foreground">{agent.brokerage}</p>
                      ) : null}
                      {(agent.city || agent.state || agent.zipCode) && (
                        <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 text-primary-light" aria-hidden="true" />
                          {[agent.city, agent.state, agent.zipCode].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                    {agent.rating !== undefined ? (
                      <span className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-foreground">
                        {agent.rating.toFixed(1)}{" "}
                        <Star className="h-4 w-4 fill-primary text-primary" aria-hidden="true" />
                        {agent.reviewCount !== undefined ? (
                          <span className="font-normal text-muted-foreground">
                            ({agent.reviewCount})
                          </span>
                        ) : null}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-elevated p-3">
                      <strong className="block text-lg font-extrabold text-foreground">
                        {agent.salesLast12Months?.toLocaleString() ?? "—"}
                      </strong>
                      <span className="text-xs text-muted-foreground">sales last 12 months</span>
                    </div>
                    <div className="rounded-xl bg-elevated p-3">
                      <strong className="block truncate text-base font-bold text-foreground">
                        {agent.salesPriceRange ?? "Varies"}
                      </strong>
                      <span className="text-xs text-muted-foreground">reported price range</span>
                    </div>
                    {agent.salesInSelectedCity !== undefined ? (
                      <div className="col-span-2 rounded-xl bg-elevated p-3">
                        <strong className="text-foreground">
                          {agent.salesInSelectedCity.toLocaleString()}
                        </strong>
                        <span className="text-xs text-muted-foreground"> sales in this market</span>
                      </div>
                    ) : null}
                  </div>
                  <a
                    href={agent.zillowProfileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary-light hover:text-foreground"
                  >
                    <Users className="h-4 w-4" aria-hidden="true" /> View profile{" "}
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {data && data.totalPages > 1 ? (
          <nav
            aria-label="Agent result pages"
            className="mt-8 flex items-center justify-center gap-4"
          >
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {data.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= data.totalPages || loading}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-40"
            >
              Next
            </button>
          </nav>
        ) : null}
        <p className="mt-8 text-xs text-muted-foreground">
          Agent information may change. Confirm current details with the agent before making a
          decision.
        </p>
      </section>
    </div>
  );
}
