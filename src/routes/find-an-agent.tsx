import { createFileRoute } from "@tanstack/react-router";
import { Star, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { canonicalLink } from "@/lib/seo";

export const Route = createFileRoute("/find-an-agent")({
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
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AgentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const search = new URLSearchParams({
      page: String(page),
      limit: "1000",
    });
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
  }, [page]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <section className="border-b border-border bg-surface/70">
        <div className="container-page py-12 md:py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-light">
            Agent directory
          </p>
          <h1 className="mt-3 text-4xl font-bold text-foreground md:text-5xl">
            Browse real estate agents
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Browse the agents currently available in our directory.
          </p>
        </div>
      </section>

      <section className="container-page py-9">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Real estate agents</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {loading
                ? "Loading agents from the directory…"
                : `Showing ${data?.total ?? 0} agents from the directory`}
            </p>
          </div>
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
