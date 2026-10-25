import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";

export function SubscribeForMore({ className = "" }: { className?: string }) {
  return (
    <aside
      className={`flex flex-col gap-4 rounded-2xl border border-blue-300/20 bg-gradient-to-r from-blue-500/15 via-blue-500/5 to-transparent p-5 sm:flex-row sm:items-center sm:justify-between ${className}`}
      aria-label="More listings with membership"
    >
      <div className="flex gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-400/15 text-blue-200">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-semibold text-foreground">Want to see more properties?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Subscribe for unlimited property views and keep exploring beyond the 20 free listings.
          </p>
        </div>
      </div>
      <Link
        to="/pricing"
        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
      >
        View membership plans <ArrowRight className="h-4 w-4" />
      </Link>
    </aside>
  );
}
