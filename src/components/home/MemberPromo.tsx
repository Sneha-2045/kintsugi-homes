import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { formatJpy, lockedListings } from "@/data/properties";

export function MemberPromo() {
  return (
    <section className="bg-background pb-16 md:pb-24" aria-labelledby="members-title">
      <div className="container-page">
        <div className="grid gap-10 rounded-2xl border border-warning/60 bg-card/60 p-6 md:p-10 lg:grid-cols-2 lg:gap-14 lg:p-14">
          <div>
            <Badge variant="orange" size="md">
              Members only
            </Badge>
            <h2
              id="members-title"
              className="mt-5 text-3xl font-bold leading-tight text-foreground md:text-[40px]"
            >
              Every new listing is members-only for its first 24 hours
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
              These three are the most viewed right now — locked until their first day is up. On
              249 arrivals a day, that head start is how the good ones get claimed.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button asChild size="lg">
                <Link to="/pricing">
                  <Lock className="h-4 w-4" />
                  Unlock with Free Trial
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">then $5/month · cancel anytime</p>
            </div>
          </div>

          <ul className="space-y-4">
            {lockedListings.map((l) => (
              <li
                key={l.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-elevated/60 p-3"
              >
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-elevated">
                  <img
                    src={l.image}
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
                  <p className="truncate text-lg font-bold text-foreground">{formatJpy(l.priceJpy)}</p>
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
