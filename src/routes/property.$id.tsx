import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { PageShell } from "@/components/layout/PageShell";
import { ReportListingIssue } from "@/components/property/ReportListingIssue";

import { formatJpy, formatUsd, properties } from "@/data/properties";
import { usListings } from "@/data/us-listings";

export const Route = createFileRoute("/property/$id")({
  loader: ({ params }) => {
    // First search Japan listings
    const japanProperty = properties.find((p) => p.id === params.id);

    // If not found, search US listings
    const usProperty = usListings.find((p) => p.id === params.id);

    // Use whichever listing was found
    const property = japanProperty ?? usProperty;

    if (!property) {
      throw notFound();
    }

    return { property };
  },

  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          {
            title: "Listing unavailable — Real Estate",
          },
        ],
      };
    }

    const t = `${loaderData.property.location} — ${formatUsd(
      loaderData.property.priceUsd
    )} | Real Estate`;

    return {
      meta: [
        { title: t },
        {
          name: "description",
          content: loaderData.property.description,
        },
        {
          property: "og:title",
          content: t,
        },
        {
          property: "og:description",
          content: loaderData.property.description,
        },
      ],
    };
  },

  errorComponent: () => (
    <PageShell title="This listing didn't load" />
  ),

  notFoundComponent: () => (
    <PageShell
      title="Listing not found"
      description="This property is no longer in our index."
    >
      <Button asChild>
        <Link to="/search">Back to search</Link>
      </Button>
    </PageShell>
  ),

  component: PropertyDetails,
});

function PropertyDetails() {
  const { property } = Route.useLoaderData();
  const tags = property.tags.filter(
    (tag, index, values) =>
      values.findIndex((value) => value.trim().toLowerCase() === tag.trim().toLowerCase()) === index,
  );

  const ld = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    url: `https://rylestate.com/property/${property.id}`,
    description: property.description,
    image: property.images,
    offers: {
      "@type": "Offer",
      price: property.priceUsd,
      priceCurrency: "USD",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(ld),
        }}
      />

      <PageShell
        title={property.location}
        description={property.title}
      >
        <ul className="grid gap-4 md:grid-cols-2">
          {property.images.map((src: string, i: number) => (
            <li
              key={src}
              className={i === 0 ? "md:col-span-2" : undefined}
            >
              <img
                src={src}
                alt={`${property.title} — photo ${i + 1}`}
                loading={i === 0 ? "eager" : "lazy"}
                className="aspect-16/9 w-full rounded-2xl border border-border object-cover"
              />
            </li>
          ))}
        </ul>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <ul className="flex flex-wrap gap-2">
              {tags.map((t: string) => (
                <li key={t}>
                  <Badge variant="neutral" size="sm">
                    {t}
                  </Badge>
                </li>
              ))}
            </ul>

            <h2 className="mt-8 text-2xl font-bold text-foreground">
              About this property
            </h2>

            <p className="mt-3 leading-relaxed text-muted-foreground">
              {property.description}
            </p>

            <section className="mt-8 border-t border-border pt-6" aria-labelledby="source-title">
              <h3 id="source-title" className="text-lg font-semibold text-foreground">
                Listing source &amp; freshness
              </h3>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Original listing</dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {property.sourceUrl ? (
                      <a
                        href={property.sourceUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-primary-light underline underline-offset-4"
                      >
                        View source listing
                      </a>
                    ) : (
                      "Not provided"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Last checked by Real Estate</dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {property.lastCheckedAt
                      ? new Date(`${property.lastCheckedAt}T00:00:00`).toLocaleDateString()
                      : "Not recorded; freshness unverified"}
                  </dd>
                </div>
              </dl>
            </section>

            <ReportListingIssue listingId={property.id} />

            <h3 className="mt-8 text-lg font-semibold text-foreground">
              Key facts
            </h3>

            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                [
                  "Property type",
                  property.propertyType ?? "—",
                ],
                [
                  "Auction date",
                  property.auctionDate ?? "—",
                ],
                [
                  "Location",
                  property.prefecture,
                ],
                [
                  "Bedrooms",
                  property.bedrooms
                    ? String(property.bedrooms)
                    : "—",
                ],
                [
                  "Floor area",
                  property.floorArea
                    ? `${property.floorArea} ${
                        property.prefecture === "Florida"
                          ? "sq ft"
                          : "m²"
                      }`
                    : "—",
                ],
                [
                  "Land area",
                  property.landArea
                    ? `${property.landArea} ${
                        property.prefecture === "Florida"
                          ? "acres"
                          : "m²"
                      }`
                    : "—",
                ],
                [
                  "Year built",
                  property.yearBuilt
                    ? String(property.yearBuilt)
                    : "—",
                ],
                [
                  "Nearby",
                  property.amenity,
                ],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <dt className="text-xs uppercase tracking-wide text-subtle">
                    {k}
                  </dt>

                  <dd className="mt-1 font-medium text-foreground">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <aside className="h-fit rounded-2xl border border-border bg-card p-6">
            <p className="text-3xl font-bold text-foreground">
              Approx. {formatUsd(property.priceUsd)}
            </p>

            {property.priceJpy != null && (
              <p className="mt-1 text-sm text-muted-foreground">
                Original asking price: {formatJpy(property.priceJpy)}
              </p>
            )}

            <Button
              asChild
              className="mt-6 w-full"
              size="lg"
            >
              <Link to="/consult">Enquire via partner</Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="mt-3 w-full"
            >
              <Link to="/saved">Save this property</Link>
            </Button>
          </aside>
        </div>
      </PageShell>
    </>
  );
}