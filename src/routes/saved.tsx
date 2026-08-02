import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { Button } from "@/components/common/Button";
import { PageShell } from "@/components/layout/PageShell";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved Properties — Yadori Estate" },
      { name: "description", content: "Your saved Japanese property listings and search alerts." },
      { property: "og:title", content: "Saved Properties — Yadori Estate" },
      {
        property: "og:description",
        content: "Your saved Japanese property listings and search alerts.",
      },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  return (
    <PageShell title="Saved" description="Properties and searches you have kept for later.">
      <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-card px-6 py-20 text-center">
        <Heart className="h-10 w-10 text-subtle" aria-hidden="true" />
        <h2 className="mt-5 text-xl font-semibold text-foreground">Nothing saved yet</h2>
        <p className="mt-2 max-w-md text-muted-foreground">
          Tap the heart on any listing to keep it here. Members also get email alerts when a saved
          search picks up something new.
        </p>
        <Button asChild className="mt-6">
          <Link to="/search">Browse listings</Link>
        </Button>
      </div>
    </PageShell>
  );
}
