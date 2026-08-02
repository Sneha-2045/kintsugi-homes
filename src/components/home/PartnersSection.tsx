import { Link } from "@tanstack/react-router";
import { ArrowRight, Star } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/common/Badge";
import { SectionHeader } from "@/components/common/SectionHeader";
import { partners } from "@/data/partners";
import { cn } from "@/lib/utils";

export function PartnersSection() {
  const [index, setIndex] = useState(0);
  const partner = partners[index];

  return (
    <section className="bg-background py-16 md:py-24" aria-labelledby="partners-title">
      <div className="container-page">
        <SectionHeader
          align="center"
          title="Our partners"
          subtitle="Yadori Estate is the search engine. Licensed partners handle the purchase."
          className="mb-12"
        />
        <h2 id="partners-title" className="sr-only">
          Our partners
        </h2>

        <div className="mx-auto grid max-w-4xl overflow-hidden rounded-2xl border border-border bg-card md:grid-cols-[300px_minmax(0,1fr)]">
          <div
            className="grid min-h-45 place-items-center p-8"
            style={{ backgroundColor: partner.color }}
          >
            <span className="font-display text-3xl font-bold tracking-tight text-white">
              {partner.name}
            </span>
          </div>

          <div className="p-6 md:p-8">
            <Badge variant="blue" size="xs">
              {partner.badge.toUpperCase()}
            </Badge>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
              {partner.description}
            </p>

            <div className="mt-6 flex items-center gap-1" aria-label={`${partner.rating} out of 5 stars`}>
              {Array.from({ length: partner.rating }).map((_, i) => (
                <Star key={i} className="h-4.5 w-4.5 fill-warning text-warning" aria-hidden="true" />
              ))}
            </div>
            <blockquote className="mt-3 text-sm text-muted-foreground">
              “{partner.quote}” <span className="text-subtle">— {partner.author}</span>
            </blockquote>

            <div className="mt-8 flex items-center gap-2" role="tablist" aria-label="Partners">
              {partners.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Show partner ${p.name}`}
                  onClick={() => setIndex(i)}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    i === index ? "w-6 bg-primary" : "w-2 bg-subtle/50 hover:bg-subtle",
                  )}
                />
              ))}
            </div>

            <Link
              to="/consult"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-light hover:text-primary"
            >
              Book a consultation
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
