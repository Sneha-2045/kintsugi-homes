import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const markets = [
  { id: "japan", label: "Japan Properties", flag: "🇯🇵", to: "/japan-properties" },
  { id: "us", label: "US Properties", flag: "🇺🇸", to: "/us-properties" },
] as const;

export function CountrySwitcher({ active }: { active?: (typeof markets)[number]["id"] }) {
  return (
    <nav
      aria-label="Switch property market"
      className="inline-flex rounded-xl border border-border bg-surface/90 p-1"
    >
      {markets.map((market) => (
        <Link
          key={market.id}
          to={market.to}
          aria-current={active === market.id ? "page" : undefined}
          className={cn(
            "inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors sm:px-4",
            active === market.id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-elevated hover:text-foreground",
          )}
        >
          <span aria-hidden="true">{market.flag}</span>
          {market.label}
        </Link>
      ))}
    </nav>
  );
}
