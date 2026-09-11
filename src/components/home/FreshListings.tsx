import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/common/Badge";
import { SectionHeader } from "@/components/common/SectionHeader";
import { PropertyCarousel } from "@/components/property/PropertyCarousel";

import { properties } from "@/data/properties";
import { usListings } from "@/data/us-listings";

export function FreshListings() {
  const japanListings = properties.filter(
  (property) => !usListings.some((usProperty) => usProperty.id === property.id),
);

  const activeUSListings = usListings.filter((property) => {
    if (!property.auctionDate) return true;

    const auctionDate = new Date(property.auctionDate);
    const today = new Date();

    auctionDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const daysUntilAuction =
      (auctionDate.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24);

    return daysUntilAuction >= 10;
  });

  return (
    <section
      className="bg-background py-16 md:py-24"
      aria-labelledby="fresh-title"
    >
      <div className="container-page">
        <SectionHeader
          eyebrow={
            <Badge variant="blue" size="md">
              New this week
            </Badge>
          }
          title="Fresh this week"
          subtitle={
            <>
              <span className="font-semibold text-primary-light">11,339</span>{" "}
              listed in the last seven days. These are open to browse now. The
              first 24 hours are members-only.
            </>
          }
          action={
            <Link
              to="/search"
              search={{ q: "new this week" }}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary-light hover:text-primary"
            >
              Browse the week
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
          className="mb-10"
        />

        <h2 id="fresh-title" className="sr-only">
          Fresh listings this week
        </h2>

        <div className="mb-16">
          <div className="mb-6">
            <h3 className="text-2xl font-semibold text-foreground">
              Japan Listings
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Japanese homes, akiya, land and apartments
            </p>
          </div>

          <PropertyCarousel
            properties={japanListings}
            label="Japan listings"
          />
        </div>

        <div>
          <div className="mb-6">
            <h3 className="text-2xl font-semibold text-foreground">
              US Foreclosure Listings
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Foreclosure properties with auctions at least 10 days away
            </p>
          </div>

          {activeUSListings.length > 0 ? (
            <PropertyCarousel
              properties={activeUSListings}
              label="US foreclosure listings"
            />
          ) : (
            <p className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
              No US foreclosure listings currently match the auction-date
              criteria.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}