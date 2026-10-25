import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookmarkX } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { CompareToggle } from "@/components/property/PropertyComparison";
import { loadSavedProperties, removeSavedProperty, type SavedProperty } from "@/lib/saved-properties";
import { toRentCastComparison } from "@/lib/rentcast-property";

export const Route = createFileRoute("/saved-properties")({
  head: () => ({ meta: [{ title: "Saved Properties | Rylestate" }, { name: "description", content: "Review properties saved from RentCast searches." }] }),
  component: SavedPropertiesPage,
});

function SavedPropertiesPage() {
  const [properties, setProperties] = useState<SavedProperty[]>([]);
  useEffect(() => {
    const sync = () => setProperties(loadSavedProperties());
    sync();
    window.addEventListener("rylest-saved-properties-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("rylest-saved-properties-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return <PageShell title="Saved Properties" description="Properties saved from RentCast searches.">
    <header className="mb-7"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-light">Your shortlist</p><h1 className="mt-2 text-3xl font-bold">Saved properties</h1><p className="mt-2 text-muted-foreground">These properties are saved in this browser. Sign-in syncing is not enabled for RentCast saves.</p></header>
    {!properties.length ? <div className="rounded-2xl border border-border bg-card p-9 text-center"><h2 className="text-xl font-semibold">No saved properties yet</h2><p className="mt-2 text-muted-foreground">Save properties from your Property Intelligence search results to keep a shortlist here.</p><Link to="/property-intelligence" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-primary px-4 font-semibold text-primary-foreground">Search properties</Link></div> : <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{properties.map((property) => <li key={`${property.listingType}:${property.id}`}><SavedPropertyCard property={property} onRemove={() => setProperties(removeSavedProperty(property.id, property.listingType))} /></li>)}</ul>}
  </PageShell>;
}

function SavedPropertyCard({ property, onRemove }: { property: SavedProperty; onRemove: () => void }) {
  const listing = { ...property, formattedAddress: property.address, listingType: property.listingType };
  const price = typeof property.price === "number" ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(property.price) : "Price unavailable";
  return <article className="rounded-2xl border border-border bg-card p-5"><p className="text-xl font-bold">{price}{property.listingType === "rental" && property.price != null ? <span className="text-sm font-medium text-muted-foreground"> / mo</span> : null}</p><h2 className="mt-3 min-h-12 font-semibold">{property.address}</h2><p className="mt-2 text-sm text-muted-foreground">{[property.propertyType, property.city, property.state].filter(Boolean).join(" · ")}</p><p className="mt-2 text-xs text-subtle">{property.status ?? "Status unavailable"}{property.listedDate ? ` · Listed ${new Date(property.listedDate).toLocaleDateString()}` : ""}</p><div className="mt-4 flex flex-wrap gap-2"><CompareToggle property={toRentCastComparison(listing)} /><button type="button" onClick={onRemove} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold hover:bg-elevated"><BookmarkX className="h-4 w-4" />Remove</button></div><Link to={property.detailHref as never} className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground">Property details</Link></article>;
}
