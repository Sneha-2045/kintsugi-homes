import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { CompareToggle } from "@/components/property/PropertyComparison";
import { loadSavedProperties, toggleSavedProperty } from "@/lib/saved-properties";
import { toRentCastComparison, type RentCastSearchListing } from "@/lib/rentcast-property";

export function RentCastActions({ listing }: { listing: RentCastSearchListing }) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const sync = () => setSaved(loadSavedProperties().some((item) =>
      item.id === listing.id && item.listingType === listing.listingType,
    ));
    sync();
    window.addEventListener("rylest-saved-properties-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("rylest-saved-properties-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, [listing.id, listing.listingType]);
  function toggle() {
    try {
      setSaved(toggleSavedProperty(listing).saved);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this property.");
    }
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={saved}
          onClick={toggle}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-semibold hover:bg-elevated"
        >
          {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          {saved ? "Saved" : "Save property"}
        </button>
        <CompareToggle property={toRentCastComparison(listing)} />
      </div>
      {error ? <p role="status" className="mt-2 text-xs text-amber-200">{error}</p> : null}
    </div>
  );
}
