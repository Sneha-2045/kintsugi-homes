import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";

export const Route = createFileRoute("/properties/$id")({ component: PropertyDetailPage });
type Listing = {
  address?: {
    streetNumber?: string;
    streetName?: string;
    streetSuffix?: string;
    city?: string;
    state?: string;
  };
  images?: Array<string | { url?: string; path?: string }>;
  details?: {
    propertyType?: string;
    numBedrooms?: number;
    numBathrooms?: number;
    sqft?: number;
  };
  permissions?: { displayAddressOnInternet?: string };
  publicRemarks?: string;
  listPrice?: number | string;
  office?: { brokerageName?: string };
  listOfficeName?: string;
};
function PropertyDetailPage() {
  const { id } = Route.useParams();
  const [listing, setListing] = useState<Listing | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/properties/${encodeURIComponent(id)}`, { signal: controller.signal })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) {
          const message = typeof body.error === "string" ? body.error : body.error?.message;
          throw new Error(message ?? "Listing unavailable.");
        }
        return body;
      })
      .then(setListing)
      .catch((e: unknown) => {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : "Listing unavailable.");
      });
    return () => controller.abort();
  }, [id]);
  const address = listing?.address ?? {};
  const heading =
    [address.streetNumber, address.streetName, address.streetSuffix, address.city, address.state]
      .filter(Boolean)
      .join(" ") || "Property details";
  const pics: string[] = (listing?.images ?? [])
    .map((img) => (typeof img === "string" ? img : (img.url ?? img.path)))
    .filter((path): path is string => Boolean(path))
    .map((path: string) =>
      path.startsWith("http")
        ? path
        : `https://cdn.repliers.io/${path.replace(/^\//, "")}?class=large`,
    );
  return (
    <PageShell
      title={listing ? heading : "Property details"}
      description={listing?.details?.propertyType ?? "Current MLS listing"}
    >
      {!listing ? (
        <p className="rounded-xl border border-border bg-card p-8">{error || "Loading listing…"}</p>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <section>
            <div className="grid gap-3 sm:grid-cols-2">
              {pics.length ? (
                pics.map((src, i) => <ListingDetailPhoto key={`${src}-${i}`} src={src} index={i} />)
              ) : (
                <div className="grid aspect-[4/3] place-items-center rounded-xl bg-elevated text-muted-foreground">
                  Photos unavailable
                </div>
              )}
            </div>
            {listing.publicRemarks && (
              <div className="mt-7">
                <h2 className="text-xl font-bold">About this property</h2>
                <p className="mt-3 whitespace-pre-line text-muted-foreground">
                  {listing.publicRemarks}
                </p>
              </div>
            )}
          </section>
          <aside className="h-fit rounded-2xl border border-border bg-card p-6">
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0,
              }).format(Number(listing.listPrice ?? 0))}
            </p>
            <h2 className="mt-2 text-lg font-semibold">
              {listing.permissions?.displayAddressOnInternet === "N"
                ? [address.city, address.state].filter(Boolean).join(", ") || "Address withheld"
                : heading}
            </h2>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              {[
                ["Bedrooms", listing.details?.numBedrooms],
                ["Bathrooms", listing.details?.numBathrooms],
                ["Area", listing.details?.sqft ? `${listing.details.sqft} sqft` : null],
                ["Type", listing.details?.propertyType],
              ]
                .filter(([, value]) => value != null)
                .map(([label, value]) => (
                  <div key={String(label)} className="rounded-lg bg-elevated p-3">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="mt-1 font-semibold">{value}</dd>
                  </div>
                ))}
            </dl>
            <p className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
              Listing brokerage:{" "}
              {listing.office?.brokerageName ?? listing.listOfficeName ?? "See listing details"} ·
              Data provided through Repliers
            </p>
            <Link to="/properties" className="mt-5 inline-block text-primary-light underline">
              Back to search
            </Link>
          </aside>
        </div>
      )}
    </PageShell>
  );
}

function ListingDetailPhoto({ src, index }: { src: string; index: number }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div className="grid aspect-[4/3] place-items-center rounded-xl bg-elevated text-sm text-muted-foreground">
      Photo unavailable
    </div>
  ) : (
    <img
      src={src}
      alt={`Property photo ${index + 1}`}
      loading="lazy"
      className="aspect-[4/3] w-full rounded-xl bg-elevated object-cover"
      onError={() => setFailed(true)}
    />
  );
}
