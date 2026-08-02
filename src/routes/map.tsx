import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { regions } from "@/data/regions";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Map Search — Yadori Estate" },
      {
        name: "description",
        content: "Explore Japanese property region by region on an interactive mock map view.",
      },
      { property: "og:title", content: "Map Search — Yadori Estate" },
      {
        property: "og:description",
        content: "Explore Japanese property region by region on an interactive mock map view.",
      },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  return (
    <PageShell
      title="Map view"
      description="A demo map placeholder. Pick a region to see the listings indexed there."
    >
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <ul className="space-y-2">
          {regions.map((r) => (
            <li key={r.slug}>
              <Link
                to="/region/$slug"
                params={{ slug: r.slug }}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm transition-colors hover:border-primary/50 hover:bg-elevated"
              >
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <MapPin className="h-4 w-4 text-primary-light" aria-hidden="true" />
                  {r.name}
                </span>
                <span className="text-muted-foreground">{r.count.toLocaleString("en-US")}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="grid min-h-100 place-items-center rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="max-w-md text-muted-foreground">
            Interactive map is not part of this front-end demo. Region and prefecture pages contain
            the same mock listing data.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
