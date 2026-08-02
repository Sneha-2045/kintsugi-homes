import { useRef } from "react";
import { CarouselControls } from "@/components/common/CarouselControls";
import { PropertyCard } from "./PropertyCard";
import type { Property } from "@/types/property";

export function PropertyCarousel({
  properties,
  label = "listings",
}: {
  properties: Property[];
  label?: string;
}) {
  const trackRef = useRef<HTMLUListElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const amount = el.clientWidth > 900 ? el.clientWidth / 3 + 16 : el.clientWidth * 0.85;
    el.scrollBy({ left: amount * dir, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <ul
        ref={trackRef}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0"
      >
        {properties.map((p) => (
          <li
            key={p.id}
            className="w-[84vw] max-w-[420px] shrink-0 snap-start sm:w-[60vw] lg:w-[calc((100%-2.5rem)/3)]"
          >
            <PropertyCard property={p} />
          </li>
        ))}
      </ul>
      <CarouselControls
        label={label}
        onPrev={() => scrollBy(-1)}
        onNext={() => scrollBy(1)}
        className="mt-6 justify-end"
      />
    </div>
  );
}
