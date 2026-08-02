import { createFileRoute } from "@tanstack/react-router";
import { Play, Volume2 } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { articles } from "@/data/articles";

export const Route = createFileRoute("/articles")({
  head: () => ({
    meta: [
      { title: "Guides & Audio Articles — Yadori Estate" },
      {
        name: "description",
        content:
          "Guides on Japanese architecture, akiya renovation and buying property in Japan — read or listen.",
      },
      { property: "og:title", content: "Guides & Audio Articles — Yadori Estate" },
      {
        property: "og:description",
        content:
          "Guides on Japanese architecture, akiya renovation and buying property in Japan — read or listen.",
      },
    ],
  }),
  component: ArticlesPage,
});

function ArticlesPage() {
  return (
    <PageShell
      title="Guides you can listen to"
      description="Every guide has an audio version. Written for buyers approaching the Japanese market from outside it."
    >
      <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((a) => (
          <li key={a.id}>
            <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40">
              <div className="relative aspect-16/10 overflow-hidden bg-elevated">
                <img
                  src={a.image}
                  alt={a.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-background/80 px-2.5 py-1 text-xs text-foreground backdrop-blur">
                  <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Audio
                </span>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-destructive">
                  {a.category} · <span className="text-muted-foreground">{a.readMinutes} min</span>
                </p>
                <h2 className="mt-3 font-serif text-2xl text-foreground">{a.title}</h2>
                <p className="mt-3 text-sm text-muted-foreground">{a.excerpt}</p>
                <button
                  type="button"
                  className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-primary-light hover:text-primary"
                >
                  <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                  Play audio version
                </button>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
