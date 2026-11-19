import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { DiscountedPrice } from "@/components/property/DiscountedPrice";
import { formatUsd } from "@/data/properties";
import { usListings } from "@/data/us-listings";

const lockedUsListings = usListings.filter((listing) => listing.priceUsd > 0).slice(0, 3);

export function MemberPromo() {
  return (
    <section className="bg-background pb-16 md:pb-24" aria-labelledby="members-title">
      <div className="container-page">
        <div className="grid min-w-0 gap-8 rounded-2xl border border-warning/60 bg-card/60 p-4 sm:gap-10 sm:p-6 md:p-10 lg:grid-cols-2 lg:gap-14 lg:p-14">
          <div className="min-w-0">
            <Badge variant="orange" size="md">
              Members only
            </Badge>
            <h2
              id="members-title"
              className="mt-5 break-words text-[clamp(1.75rem,7vw,2.5rem)] font-bold leading-tight text-foreground"
            >
              Every new listing is members-only for its first 24 hours
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
              These US properties are locked until their first day is up. Members get early access
              to new listings before they become public.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                asChild
                size="lg"
                className="max-w-full whitespace-normal px-4 text-sm sm:px-7 sm:text-base"
              >
                <Link to="/pricing">
                  <Lock className="h-4 w-4" />
                  Unlock with Free Trial
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">then $5/month · cancel anytime</p>
            </div>
          </div>

          <ul className="min-w-0 space-y-4">
            {lockedUsListings.map((l) => (
              <li
                key={l.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-elevated/60 p-3"
              >
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-elevated">
                  <img
                    src={l.images[0] ?? ""}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="h-full w-full scale-110 object-cover blur-md"
                  />
                  <span className="absolute inset-0 grid place-items-center text-muted-foreground">
                    <Lock className="h-5 w-5" />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <DiscountedPrice
                    price={l.priceUsd}
                    format={formatUsd}
                    originalClassName="text-xs text-muted-foreground"
                    discountedClassName="text-sm font-bold text-primary-light"
                    className="gap-x-1"
                  />
                  <p className="truncate text-sm text-muted-foreground">{l.location}</p>
                </div>
                <Badge variant="orangeSoft" size="xs">
                  &lt;24h
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
