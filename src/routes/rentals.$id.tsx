import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bath, BedDouble, MapPin, Square } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";

type RentalDetail = {
  title?: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  price?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  buildingArea?: number | null;
  propertyType?: string | null;
  status?: string | null;
  description?: string | null;
  amenities?: string[];
  images?: string[];
  availableDate?: string | null;
  source?: string | null;
  sourceUrl?: string | null;
};

export const Route = createFileRoute("/rentals/$id")({ component: RentalDetailPage });
function RentalDetailPage() {
  const { id } = Route.useParams();
  const [listing, setListing] = useState<RentalDetail | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/rentals/${encodeURIComponent(id)}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Rental details could not be loaded.");
        return body as RentalDetail;
      })
      .then(setListing)
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setError(cause instanceof Error ? cause.message : "Rental details could not be loaded.");
      });
    return () => controller.abort();
  }, [id]);
  const title = listing?.title || "Rental property details";
  const address = [listing?.address, listing?.city, listing?.state, listing?.zipCode]
    .filter(Boolean)
    .join(", ");
  const fields: Array<{ label: string; value: string; Icon?: typeof BedDouble }> = [
    ...(listing?.bedrooms != null
      ? [{ label: "Bedrooms", value: String(listing.bedrooms), Icon: BedDouble }]
      : []),
    ...(listing?.bathrooms != null
      ? [{ label: "Bathrooms", value: String(listing.bathrooms), Icon: Bath }]
      : []),
    ...(listing?.buildingArea
      ? [
          {
            label: "Area",
            value: `${listing.buildingArea.toLocaleString()} sqft`,
            Icon: Square,
          },
        ]
      : []),
    ...(listing?.propertyType ? [{ label: "Property type", value: listing.propertyType }] : []),
    ...(listing?.status ? [{ label: "Status", value: listing.status }] : []),
    ...(listing?.availableDate ? [{ label: "Available", value: listing.availableDate }] : []),
  ];
  return (
    <PageShell
      title={title}
      description="Current rental listing details from Rylestate's connected rental sources."
    >
      <section className="container-page py-10 md:py-14">
        {!listing ? (
          <div
            role={error ? "alert" : "status"}
            className="rounded-2xl border border-border bg-card p-8 text-muted-foreground"
          >
            {error || "Loading rental details…"}
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <div className="grid gap-3 sm:grid-cols-2">
                {listing.images?.length ? (
                  listing.images.map((image, index) => (
                    <img
                      key={`${image}-${index}`}
                      src={image}
                      alt={`${title} photo ${index + 1}`}
                      className="aspect-[4/3] w-full rounded-2xl bg-elevated object-cover"
                      loading="lazy"
                    />
                  ))
                ) : (
                  <div className="grid aspect-[4/3] place-items-center rounded-2xl bg-elevated text-muted-foreground">
                    Photos unavailable
                  </div>
                )}
              </div>
              {listing.description ? (
                <section className="mt-7">
                  <h2 className="text-xl font-bold">About this home</h2>
                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                    {listing.description}
                  </p>
                </section>
              ) : null}
            </div>
            <aside className="h-fit rounded-2xl border border-border bg-card p-6">
              <p className="text-2xl font-bold">
                {listing.price == null
                  ? "Rent unavailable"
                  : `${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(listing.price)}/mo`}
              </p>
              <h1 className="mt-3 flex items-start gap-2 text-lg font-semibold">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-primary-light" />
                {address || "Address unavailable"}
              </h1>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                {fields.map(({ label, value, Icon }) => (
                  <div key={String(label)} className="rounded-lg bg-elevated p-3">
                    <dt className="text-muted-foreground">
                      {Icon ? <Icon className="mr-1 inline h-4 w-4" /> : null}
                      {label}
                    </dt>
                    <dd className="mt-1 font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
              {listing.amenities?.length ? (
                <div className="mt-5">
                  <h2 className="font-semibold">Amenities</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {listing.amenities.join(", ")}
                  </p>
                </div>
              ) : null}
              <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
                Listing source: {listing.source || "Rylestate connected rental feed"}
              </p>
              {listing.sourceUrl ? (
                <a
                  href={listing.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block text-sm text-primary-light underline"
                >
                  Original listing source
                </a>
              ) : null}
              <Link
                to="/properties/search"
                search={{ category: "rent" }}
                className="mt-5 block text-sm text-primary-light underline"
              >
                Back to rental search
              </Link>
            </aside>
          </div>
        )}
      </section>
    </PageShell>
  );
}
