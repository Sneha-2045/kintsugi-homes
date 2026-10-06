import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/common/Badge";
import { SectionHeader } from "@/components/common/SectionHeader";
import { PropertyCarousel } from "@/components/property/PropertyCarousel";

import { properties } from "@/data/properties";

export function FreshListings() {
  return (
    <section
      className="bg-background py-16 md:py-24"
      aria-labelledby="fresh-title"
    >
      <div className="container-page">
        <SectionHeader
          eyebrow={
            <Badge variant="blue" size="md">
              Japan inventory
            </Badge>
          }
          title="Browse Japan listings"
          subtitle={
            "A small selection to start your search. Sources and checked dates may be unavailable; confirm current price and availability with the publisher."
          }
          action={
            <Link
              to="/search"
              search={{ q: "Japan" }}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary-light hover:text-primary"
            >
              Search all listings
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
          className="mb-10"
        />

        <h2 id="fresh-title" className="sr-only">
          Japan property listings
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
            properties={properties.slice(0, 6)}
            label="Japan listings"
          />
        </div>
      </div>
    </section>
  );
}