import { Link } from "@tanstack/react-router";
import { ArrowRight, Music, Play, Volume2 } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { SectionHeader } from "@/components/common/SectionHeader";
import { articles } from "@/data/articles";

export function AudioArticles() {
  return (
    <section className="bg-background py-16 md:py-24" aria-labelledby="listen-title">
      <div className="container-page">
        <SectionHeader
          eyebrow={
            <Badge variant="blue" size="md">
              <Music className="h-3.5 w-3.5" aria-hidden="true" />
              Listen
            </Badge>
          }
          serif
          title="Articles You Can Listen To"
          subtitle="Read or listen — every guide has an audio version you can play on the page or download as MP3."
          action={
            <Link
              to="/articles"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary-light hover:text-primary"
            >
              All articles
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
          className="mb-10"
        />
        <h2 id="listen-title" className="sr-only">
          Articles you can listen to
        </h2>

        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {articles.map((article) => (
            <li key={article.id} className="min-w-0">
              <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40 sm:flex-row">
                <div className="relative h-44 shrink-0 overflow-hidden bg-elevated sm:h-auto sm:w-2/5">
                  <img
                    src={article.image}
                    alt={article.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-background/80 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur">
                    <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Audio
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5 md:p-6">
                  <p className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-destructive">
                    {article.category}
                    <span className="text-subtle">·</span>
                    <span className="font-normal normal-case tracking-normal text-muted-foreground">
                      {article.readMinutes} min read
                    </span>
                  </p>
                  <h3 className="mt-3 font-serif text-xl leading-snug text-foreground sm:text-2xl">
                    {article.title}
                  </h3>
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                    {article.excerpt}
                  </p>
                  <Link
                    to="/articles"
                    className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-primary-light hover:text-primary"
                  >
                    <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                    Listen or read
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
