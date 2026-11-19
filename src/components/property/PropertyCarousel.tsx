import { PropertyCard } from "./PropertyCard";
import type { Property } from "@/types/property";

export function PropertyCarousel({ properties }: { properties: Property[] }) {
  return (
    <div>
      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {properties.slice(0, 6).map((p) => (
          <li key={p.id} className="min-w-0">
            <PropertyCard property={p} />
          </li>
        ))}
      </ul>
    </div>
  );
}
