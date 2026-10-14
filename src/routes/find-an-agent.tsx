import { createFileRoute } from "@tanstack/react-router";
import { Search, Star, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { agents } from "@/data/agents";
import { canonicalLink } from "@/lib/seo";

export const Route = createFileRoute("/find-an-agent")({
  head: () => ({
    meta: [
      { title: "Find a Real Estate Agent in Texas City, TX | Rylestate" },
      { name: "description", content: "Browse real estate agents serving Texas City, Texas. Compare agent ratings, brokerages and recent sales." },
    ],
    links: [canonicalLink("/find-an-agent")],
  }),
  component: FindAnAgentPage,
});

function FindAnAgentPage() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => agents.filter((agent) =>
    `${agent.name} ${agent.brokerage}`.toLowerCase().includes(query.toLowerCase()),
  ), [query]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <section className="border-b border-border bg-surface/70">
        <div className="container-page py-12 md:py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-light">Local expertise, made easy</p>
          <h1 className="mt-3 text-4xl font-bold text-foreground md:text-5xl">Find an agent in Texas City</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Meet experienced real estate professionals serving Texas City, TX. Compare ratings, recent activity and brokerages to find the right fit.</p>
          <div className="mt-8 flex max-w-3xl flex-col gap-3 sm:flex-row">
            <label className="flex h-14 flex-1 items-center gap-3 rounded-xl border border-border bg-card px-4 focus-within:ring-2 focus-within:ring-primary">
              <Search className="h-5 w-5 shrink-0 text-subtle" aria-hidden="true" />
              <span className="sr-only">Search by agent or brokerage</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Agent name or brokerage" className="w-full bg-transparent text-foreground outline-none placeholder:text-subtle" />
            </label>
            <a href="https://www.zillow.com/professionals/real-estate-agent-reviews/texas-city-tx/" target="_blank" rel="noreferrer" className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-primary px-7 font-semibold text-primary-foreground transition hover:bg-primary-hover">
              <Search className="h-4 w-4" /> View all on Zillow
            </a>
          </div>
        </div>
      </section>

      <section className="container-page py-9">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Real estate agents in Texas City, TX</h2>
            <p className="mt-1 text-sm text-muted-foreground">Showing {filtered.length} agents from the directory</p>
          </div>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-2">
          {filtered.map((agent) => (
            <article key={agent.name} className="group flex min-h-52 flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-elevated sm:flex-row sm:items-center sm:p-6">
              {agent.image ? (
                <img src={agent.image} alt={`${agent.name} headshot`} loading="lazy" className="h-28 w-28 shrink-0 rounded-full border border-border bg-elevated object-cover" />
              ) : (
                <div aria-label={`${agent.name} profile placeholder`} className="grid h-28 w-28 shrink-0 place-items-center rounded-full border border-primary/20 bg-primary/10 font-display text-3xl font-bold text-primary-light">
                  {agent.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    {agent.team ? <span className="rounded bg-warning/15 px-2 py-1 text-xs font-bold uppercase tracking-wide text-warning">Team</span> : null}
                    <h3 className="mt-1 text-xl font-bold text-foreground">{agent.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{agent.brokerage}</p>
                  </div>
                  {agent.rating ? <span className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-foreground">{agent.rating} <Star className="h-4 w-4 fill-primary text-primary" aria-hidden="true" /><span className="font-normal text-muted-foreground">({agent.reviews})</span></span> : null}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {agent.priceRange ? <p><strong className="text-foreground">{agent.priceRange}</strong><span className="text-muted-foreground"> price range</span></p> : null}
                  {agent.sales12 ? <p><strong className="text-foreground">{agent.sales12}</strong><span className="text-muted-foreground"> sales last 12 months</span></p> : null}
                  {agent.texasCitySales ? <p><strong className="text-foreground">{agent.texasCitySales}</strong><span className="text-muted-foreground"> sales in Texas City</span></p> : null}
                </div>
                <a href={agent.profile} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary-light hover:text-foreground">
                  <Users className="h-4 w-4" aria-hidden="true" /> View Zillow profile <span aria-hidden="true">↗</span>
                </a>
              </div>
            </article>
          ))}
        </div>
        {filtered.length === 0 ? <p className="py-16 text-center text-muted-foreground">No agents match “{query}”. Try another name or brokerage.</p> : null}
        <p className="mt-8 text-xs text-muted-foreground">Agent names, ratings and transaction details are shown as listed by Zillow and may change. Check each agent’s profile for current information.</p>
      </section>
    </div>
  );
}
