import { createFileRoute } from "@tanstack/react-router";
import { Search, Star, Users } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { canonicalLink } from "@/lib/seo";

export const Route = createFileRoute("/find-an-agent")({
  head: () => ({
    meta: [
      { title: "Find a Real Estate Agent in Texas City, TX | Rylestate" },
      {
        name: "description",
        content:
          "Browse real estate agents by location. Compare agent ratings, brokerages and recent sales.",
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

function locationTitle(location: string) {
  const [city, state] = location.split(",").map((part) => part.trim());
  return city && state ? `${city}, ${state}` : location || "the United States";
}

function FindAnAgentPage() {
  const [location, setLocation] = useState("Texas City, TX");
  const [appliedLocation, setAppliedLocation] = useState("Texas City, TX");
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [sortBy, setSortBy] = useState<"rating" | "sales">("rating");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AgentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const title = useMemo(() => locationTitle(appliedLocation), [appliedLocation]);

  useEffect(() => {
    const controller = new AbortController();
    const search = new URLSearchParams({
      location: appliedLocation,
      page: String(page),
      limit: "24",
      sortBy,
    });
    if (appliedQuery) search.set("q", appliedQuery);
    const cacheKey = `rylestate-agents:${search.toString()}`;
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
    }, 12000);
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
          setError("Agent results are taking too long to load. Please try again shortly.");
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
  }, [appliedLocation, appliedQuery, page, sortBy]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedLocation(location.trim());
    setAppliedQuery(query.trim());
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <section className="border-b border-border bg-surface/70">
        <div className="container-page py-12 md:py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-light">
            Local expertise, made easy
          </p>
          <h1 className="mt-3 text-4xl font-bold text-foreground md:text-5xl">
            Find an agent near you
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Search agent records by city, state, ZIP code, agent name, or brokerage.
          </p>
          <form
            onSubmit={handleSearch}
            className="mt-8 grid max-w-5xl gap-3 md:grid-cols-[1fr_1fr_auto]"
          >
            <label className="flex h-14 items-center gap-3 rounded-xl border border-border bg-card px-4 focus-within:ring-2 focus-within:ring-primary">
              <Search className="h-5 w-5 shrink-0 text-subtle" aria-hidden="true" />
              <span className="sr-only">City, state, or ZIP code</span>
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="City, state, or ZIP code"
                className="w-full bg-transparent text-foreground outline-none placeholder:text-subtle"
              />
            </label>
            <label className="flex h-14 items-center gap-3 rounded-xl border border-border bg-card px-4 focus-within:ring-2 focus-within:ring-primary">
              <Users className="h-5 w-5 shrink-0 text-subtle" aria-hidden="true" />
              <span className="sr-only">Agent or brokerage</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Agent name or brokerage"
                className="w-full bg-transparent text-foreground outline-none placeholder:text-subtle"
              />
            </label>
            <button
              type="submit"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-primary px-7 font-semibold text-primary-foreground transition hover:bg-primary-hover"
            >
              <Search className="h-4 w-4" aria-hidden="true" /> Search agents
            </button>
          </form>
        </div>
      </section>

      <section className="container-page py-9">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Real estate agents in {title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {loading
                ? "Loading agents from the directory…"
                : `Showing ${data?.total ?? 0} agents from the directory`}
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Sort by
            <select
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value as "rating" | "sales");
                setPage(1);
              }}
              className="rounded-lg border border-border bg-card px-3 py-2 text-foreground"
            >
              <option value="rating">Rating</option>
              <option value="sales">Recent sales</option>
            </select>
          </label>
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-7 rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-foreground"
          >
            {error}
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
            No agents found for {title}
            {appliedQuery ? ` matching “${appliedQuery}”` : ""}. Try another location or search
            term.
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
                  <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {agent.salesPriceRange ? (
                      <p>
                        <strong className="text-foreground">{agent.salesPriceRange}</strong>
                        <span className="text-muted-foreground"> price range</span>
                      </p>
                    ) : null}
                    {agent.salesLast12Months !== undefined ? (
                      <p>
                        <strong className="text-foreground">{agent.salesLast12Months}</strong>
                        <span className="text-muted-foreground"> sales last 12 months</span>
                      </p>
                    ) : null}
                    {agent.salesInSelectedCity !== undefined ? (
                      <p>
                        <strong className="text-foreground">{agent.salesInSelectedCity}</strong>
                        <span className="text-muted-foreground"> sales in {title}</span>
                      </p>
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
