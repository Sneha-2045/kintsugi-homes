import { useNavigate } from "@tanstack/react-router";
import { Apple, ChevronDown, List, Map as MapIcon, Search, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/common/Button";
import { IMAGES } from "@/data/properties";
import { cn } from "@/lib/utils";

const tabs = ["Buy", "Rent", "Sold", "Akiya bank", "Map"] as const;
const views = ["List", "Grid", "Map"] as const;

const stats = [
  { value: "1,536,000+", label: "properties" },
  { value: "2,690", label: "Japanese sources" },
  { value: null, label: "every listing in English" },
  { value: null, label: "free to browse" },
  { value: null, label: "updated daily" },
];

export function HeroSearch() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Buy");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<(typeof views)[number]>("List");
  const [viewOpen, setViewOpen] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    navigate({ to: "/search", search: { q: query.trim() || "Japan" } });
  };

  return (
    <section className="relative isolate overflow-hidden" aria-labelledby="hero-title">
      <img
        src={IMAGES.hero}
        alt="Traditional Japanese houses along a quiet street"
        className="absolute inset-0 -z-10 h-full w-full scale-105 object-cover blur-[2px]"
      />
      <div className="absolute inset-0 -z-10 bg-background/85" />

      <div className="container-page py-14 md:py-20">
        <h1
          id="hero-title"
          className="max-w-4xl text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-[46px]"
        >
          Your place in Japan is probably already listed here
        </h1>

        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-background/85 backdrop-blur-md">
          <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-border px-3 md:px-6">
            {tabs.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                aria-pressed={tab === t}
                className={cn(
                  "relative whitespace-nowrap px-4 py-4 text-[15px] font-medium transition-colors",
                  tab === t ? "text-primary-light" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t}
                {tab === t ? (
                  <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" />
                ) : null}
              </button>
            ))}
          </div>

          <div className="p-4 md:p-6">
            <form onSubmit={onSubmit} className="flex flex-col gap-3 md:flex-row md:items-center">
              <label htmlFor="hero-search" className="sr-only">
                Search Japanese property listings
              </label>
              <input
                id="hero-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={'Try "land near Hakuba"'}
                className="h-14 w-full flex-1 rounded-lg bg-foreground px-5 text-base text-[#0B1628] placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex items-center gap-3">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setViewOpen((v) => !v)}
                    aria-haspopup="listbox"
                    aria-expanded={viewOpen}
                    className="flex h-14 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <List className="h-4 w-4" />
                    {view}
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {viewOpen ? (
                    <ul
                      role="listbox"
                      className="absolute right-0 top-16 z-20 w-36 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-elevated"
                    >
                      {views.map((v) => (
                        <li key={v}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={v === view}
                            onClick={() => {
                              setView(v);
                              setViewOpen(false);
                            }}
                            className="block w-full px-4 py-2 text-left text-sm text-muted-foreground hover:bg-elevated hover:text-foreground"
                          >
                            {v}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <Button type="submit" size="lg" className="h-14 flex-1 md:flex-none">
                  <Search className="h-4.5 w-4.5" />
                  Search
                </Button>
              </div>
            </form>

            <ul className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              {stats.map((s, i) => (
                <li key={s.label} className="flex items-center gap-2">
                  {i > 0 ? <span className="text-subtle">·</span> : null}
                  <span>
                    {s.value ? (
                      <span className="font-mono font-semibold text-foreground">{s.value} </span>
                    ) : null}
                    {s.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-border p-4 md:p-6">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-muted-foreground">Not sure where to start?</p>
              <Button variant="subtle" size="md" asChild>
                <a href="/search">
                  <Sparkles className="h-4 w-4 text-primary-light" />
                  Use the search wizard
                </a>
              </Button>
              <Button variant="subtle" size="md" asChild>
                <a href="/map">
                  <MapIcon className="h-4 w-4 text-primary-light" />
                  Try the map
                </a>
              </Button>
            </div>

            <div className="mt-5 grid gap-4 border-t border-border pt-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <p className="text-sm text-muted-foreground">
                Need help?{" "}
                <a href="/consult" className="text-primary-light underline underline-offset-4">
                  Consult an expert
                </a>
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-muted-foreground">Sign in with</span>
                <Button variant="outline" size="sm" className="h-10">
                  <span aria-hidden="true" className="font-bold text-primary-light">
                    G
                  </span>
                  Google
                </Button>
                <Button variant="outline" size="sm" className="h-10">
                  <Apple className="h-4 w-4" />
                  Apple
                </Button>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-4 text-right text-xs text-subtle">
          Photo: traditional house with large land in Fukuchiyama, Kyoto
        </p>
      </div>
    </section>
  );
}
