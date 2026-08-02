import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { SectionHeader } from "@/components/common/SectionHeader";
import { PropertyCarousel } from "@/components/property/PropertyCarousel";
import { properties } from "@/data/properties";

export function FreshListings() {
  return (
    <section className="bg-background py-16 md:py-24" aria-labelledby="fresh-title">
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
              <span className="font-semibold text-primary-light">11,339</span> listed in the last
              seven days. These are open to browse now. The first 24 hours are members-only.
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
        <PropertyCarousel properties={properties} label="fresh listings" />
      </div>
    </section>
  );
}
