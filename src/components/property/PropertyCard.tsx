import { Link } from "@tanstack/react-router";
import {
  BedDouble,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Heart,
  Maximize2,
  Store,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/common/Badge";
import { formatUsd } from "@/data/properties";
import { cn } from "@/lib/utils";
import type { Property } from "@/types/property";

export function PropertyCard({ property }: { property: Property }) {
  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const total = property.images.length;

  const step = (dir: 1 | -1) => setIndex((i) => (i + dir + total) % total);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-elevated">
      <div className="relative aspect-[4/3] overflow-hidden bg-elevated">
        <img
          src={property.images[index]}
          alt={`${property.title} in ${property.location}`}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 to-transparent" />

        <div className="absolute left-3 top-3">
          <Badge variant="solidBlue" size="sm">
            Added {property.addedDaysAgo} day{property.addedDaysAgo === 1 ? "" : "s"} ago
          </Badge>
        </div>

        <button
          type="button"
          onClick={() => setSaved((v) => !v)}
          aria-label={saved ? "Remove from saved" : "Save this property"}
          aria-pressed={saved}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/70 text-foreground backdrop-blur transition-colors hover:bg-background"
        >
          <Heart className={cn("h-4.5 w-4.5", saved && "fill-destructive text-destructive")} />
        </button>

        {total > 1 ? (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-background/60 text-foreground opacity-0 backdrop-blur transition-opacity hover:bg-background/90 focus-visible:opacity-100 group-hover:opacity-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-background/60 text-foreground opacity-0 backdrop-blur transition-opacity hover:bg-background/90 focus-visible:opacity-100 group-hover:opacity-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-4 right-4 flex items-center gap-1.5">
              {property.images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Show photo ${i + 1}`}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-all",
                    i === index ? "w-4 bg-foreground" : "bg-foreground/40",
                  )}
                />
              ))}
            </div>
          </>
        ) : null}

        <p className="absolute bottom-3 left-3 rounded-md bg-background/85 px-3 py-1.5 text-lg font-bold text-foreground">
          {formatUsd(property.priceUsd)}
        </p>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold text-foreground">
          <Link
            to="/property/$id"
            params={{ id: property.id }}
            className="after:absolute hover:text-primary-light"
          >
            {property.location}
          </Link>
        </h3>

        <ul className="mt-3 flex flex-wrap gap-1.5">
          {property.tags.map((tag, i) => (
            <li key={tag}>
              <Badge variant={i === 0 || i === 3 ? "blue" : "neutral"} size="xs">
                {tag}
              </Badge>
            </li>
          ))}
          {property.extraTags > 0 ? (
            <li>
              <Badge variant="neutral" size="xs">
                +{property.extraTags}
              </Badge>
            </li>
          ) : null}
        </ul>

        <dl className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          {property.bedrooms ? (
            <div className="flex items-center gap-1.5">
              <BedDouble className="h-4 w-4 text-subtle" aria-hidden="true" />
              <dt className="sr-only">Bedrooms</dt>
              <dd>{property.bedrooms}</dd>
            </div>
          ) : null}
          {property.landArea ? (
            <div className="flex items-center gap-1.5">
              <Maximize2 className="h-4 w-4 text-subtle" aria-hidden="true" />
              <dt className="sr-only">Land area</dt>
              <dd>{property.landArea}m²</dd>
            </div>
          ) : null}
          {property.floorArea ? (
            <div className="flex items-center gap-1.5">
              <Maximize2 className="h-4 w-4 text-subtle" aria-hidden="true" />
              <dt className="sr-only">Floor area</dt>
              <dd>{property.floorArea}m²</dd>
            </div>
          ) : null}
          {property.yearBuilt ? (
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-subtle" aria-hidden="true" />
              <dt className="sr-only">Year built</dt>
              <dd>{property.yearBuilt}</dd>
            </div>
          ) : null}
        </dl>

        <p className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-sm text-muted-foreground">
          <Store className="h-4 w-4 text-success" aria-hidden="true" />
          {property.amenity}
        </p>
      </div>
    </article>
  );
}
