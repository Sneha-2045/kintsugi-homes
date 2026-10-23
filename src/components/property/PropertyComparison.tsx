import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeftRight, Check, X } from "lucide-react";
import {
  removeComparisonSelection,
  sanitizeComparisonProperties,
  toggleComparisonSelection,
  type ComparisonProperty,
} from "@/lib/property-comparison";

const STORAGE_KEY = "rylest-property-comparison-v1";
type ComparisonContextValue = {
  properties: ComparisonProperty[];
  toggle: (property: ComparisonProperty) => void;
  remove: (key: string) => void;
  clear: () => void;
  selected: (key: string) => boolean;
  limitReached: boolean;
};
const ComparisonContext = createContext<ComparisonContextValue | null>(null);

export function PropertyComparisonProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<ComparisonProperty[]>([]);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      setProperties(sanitizeComparisonProperties(stored));
    } catch {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Storage may be disabled by the browser; comparisons still work for this session.
      }
    }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
    } catch {
      // Keep the comparison available in memory when browser storage is unavailable.
    }
  }, [properties, hydrated]);
  const value = useMemo<ComparisonContextValue>(
    () => ({
      properties,
      toggle: (property) =>
        setProperties((current) => {
          return toggleComparisonSelection(current, property);
        }),
      remove: (key) => setProperties((current) => removeComparisonSelection(current, key)),
      clear: () => setProperties([]),
      selected: (key) => properties.some((item) => item.key === key),
      limitReached: properties.length >= 4,
    }),
    [properties],
  );
  return (
    <ComparisonContext.Provider value={value}>
      {children}
      <ComparisonToolbar />
    </ComparisonContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePropertyComparison() {
  const value = useContext(ComparisonContext);
  if (!value) throw new Error("PropertyComparisonProvider is missing.");
  return value;
}

export function CompareToggle({ property }: { property: ComparisonProperty }) {
  const comparison = usePropertyComparison();
  const checked = comparison.selected(property.key);
  const blocked = comparison.limitReached && !checked;
  return (
    <button
      type="button"
      aria-pressed={checked}
      disabled={blocked}
      onClick={() => comparison.toggle(property)}
      title={blocked ? "Remove a property before adding another" : undefined}
      className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${checked ? "border-primary bg-primary/15 text-primary-light" : "border-border bg-background/90 text-foreground hover:border-primary/50"} disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {checked ? (
        <Check className="h-4 w-4" aria-hidden="true" />
      ) : (
        <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
      )}
      {checked ? "Compared" : "Compare"}
    </button>
  );
}

function ComparisonToolbar() {
  const comparison = usePropertyComparison();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (!comparison.properties.length || pathname === "/compare") return null;
  return (
    <aside
      aria-label="Property comparison"
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-4xl rounded-2xl border border-blue-300/20 bg-[#101d32]/95 p-3 shadow-2xl backdrop-blur-xl sm:inset-x-6 sm:bottom-5 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:px-5"
    >
      <div className="min-w-0">
        <p className="font-semibold text-white">
          {comparison.properties.length} of 4 properties selected
        </p>
        <p className="text-xs text-slate-300">
          {comparison.properties.length < 2
            ? "Select 2–4 properties to compare."
            : "Ready for a side-by-side comparison."}
        </p>
      </div>
      <div className="mt-2 flex items-center gap-2 sm:mt-0">
        {comparison.properties.length < 2 ? (
          <button
            type="button"
            disabled
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-lg bg-slate-600 px-4 text-sm font-semibold text-slate-300 sm:flex-none"
          >
            Compare Properties
          </button>
        ) : (
          <Link
            to="/compare"
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover sm:flex-none"
          >
            Compare Properties
          </Link>
        )}
        <button
          type="button"
          onClick={comparison.clear}
          className="min-h-10 rounded-lg border border-white/20 px-3 text-sm text-white hover:bg-white/10"
        >
          Clear all
        </button>
      </div>
    </aside>
  );
}

export function ComparisonRemoveButton({ propertyKey }: { propertyKey: string }) {
  const { remove } = usePropertyComparison();
  return (
    <button
      type="button"
      aria-label="Remove property from comparison"
      onClick={() => remove(propertyKey)}
      className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground"
    >
      <X className="h-4 w-4" />
    </button>
  );
}
