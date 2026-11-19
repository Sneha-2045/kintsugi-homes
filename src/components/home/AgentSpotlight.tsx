import { useEffect, useState } from "react";
import { ArrowRight, MapPin, Sparkles, Star, Trophy } from "lucide-react";
import { Link } from "@tanstack/react-router";

type FeaturedAgent = {
  id: string;
  name: string;
  profileImage?: string;
  brokerage?: string;
  rating?: number;
  reviewCount?: number;
  salesPriceRange?: string;
  salesLast12Months?: number;
  city?: string;
  state?: string;
  zillowProfileUrl: string;
};

type AgentResponse = { agents: FeaturedAgent[]; total: number };

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function AgentAvatar({ agent }: { agent: FeaturedAgent }) {
  const [imageFailed, setImageFailed] = useState(false);
  if (agent.profileImage && !imageFailed) {
    return (
      <img
        src={agent.profileImage}
        alt={`${agent.name} profile`}
        loading="lazy"
        onError={() => setImageFailed(true)}
        className="h-16 w-16 shrink-0 rounded-2xl border border-border object-cover transition duration-300 group-hover:scale-105"
      />
    );
  }
  return (
    <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-lg font-extrabold text-primary-light">
      {initials(agent.name)}
    </div>
  );
}

export function AgentSpotlight() {
  const [agents, setAgents] = useState<FeaturedAgent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 10000);
    fetch("/api/agents?page=1&limit=6&sortBy=sales&sortOrder=desc", {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Agent directory unavailable");
        return (await response.json()) as AgentResponse;
      })
      .then((result) => {
        setAgents(Array.isArray(result.agents) ? result.agents : []);
        setTotal(Number.isFinite(result.total) ? result.total : 0);
      })
      .catch(() => {
        if (!controller.signal.aborted || timedOut) setError(true);
      })
      .finally(() => {
        window.clearTimeout(timeout);
        if (!controller.signal.aborted || timedOut) setLoading(false);
      });
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  return (
    <section
      className="bg-surface py-16 text-foreground md:py-24"
      aria-labelledby="agent-spotlight-title"
    >
      <div className="container-page">
        <div className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 bg-[#081526] px-6 py-8 text-white shadow-2xl shadow-slate-950/20 sm:px-9 sm:py-10 lg:px-12">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_85%_0%,rgba(45,121,235,.38),transparent_40%),radial-gradient(ellipse_at_5%_100%,rgba(23,171,151,.16),transparent_45%)]"
          />
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[.16em] text-blue-200">
                <Sparkles className="h-4 w-4" aria-hidden="true" /> Find your local expert
              </p>
              <h2
                id="agent-spotlight-title"
                className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
              >
                A better move starts with the right agent.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
                Compare recent sales, client ratings, and typical price ranges, then explore an
                agent’s profile before you reach out.
              </p>
            </div>
            <Link
              to="/find-an-agent"
              search={{ location: undefined, q: undefined }}
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-950/30 transition hover:-translate-y-0.5 hover:bg-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
            >
              Explore all agents <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-5 text-sm text-slate-300">
            <span className="inline-flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-300" aria-hidden="true" /> Ranked by reported
              sales activity
            </span>
            <span>
              {loading ? "Loading agent directory…" : `${total.toLocaleString()} agent profiles`}
            </span>
          </div>
        </div>

        {loading ? (
          <div
            className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            aria-label="Loading agent profiles"
          >
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="h-56 animate-pulse rounded-2xl border border-border bg-card"
              />
            ))}
          </div>
        ) : error ? (
          <p
            role="status"
            className="mt-6 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground"
          >
            Agent profiles are temporarily unavailable. Visit the directory to try again.
          </p>
        ) : agents.length ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent, index) => (
              <article
                key={agent.id}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-elevated sm:p-6"
              >
                {agent.salesLast12Months !== undefined ? (
                  <div className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-xs font-bold text-amber-300">
                    <Trophy className="h-3.5 w-3.5" aria-hidden="true" /> #{index + 1} sales
                  </div>
                ) : null}
                <div className="flex items-center gap-4 pr-20">
                  <AgentAvatar agent={agent} />
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-bold text-foreground">{agent.name}</h3>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {agent.brokerage ?? "Agent profile"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  {(agent.city || agent.state) && (
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary-light" aria-hidden="true" />
                      {[agent.city, agent.state].filter(Boolean).join(", ")}
                    </span>
                  )}
                  {agent.rating !== undefined && (
                    <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                      {agent.rating.toFixed(1)}
                      {agent.reviewCount !== undefined && (
                        <span className="font-normal text-muted-foreground">
                          ({agent.reviewCount.toLocaleString()} reviews)
                        </span>
                      )}
                    </span>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-elevated p-3">
                    <p className="text-xl font-extrabold text-foreground">
                      {agent.salesLast12Months?.toLocaleString() ?? "—"}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      sales in last 12 months
                    </p>
                  </div>
                  <div className="rounded-xl bg-elevated p-3">
                    <p className="truncate text-base font-extrabold text-foreground">
                      {agent.salesPriceRange ?? "Varies"}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      reported price range
                    </p>
                  </div>
                </div>

                <a
                  href={agent.zillowProfileUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary-light transition-colors hover:text-foreground"
                >
                  View agent profile <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Agent profiles will appear here when the directory has records.
          </p>
        )}

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Sales and review figures come from the agent directory and may change. Confirm current
          details with each agent.
        </p>
      </div>
    </section>
  );
}
