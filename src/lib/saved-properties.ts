import { rentCastDetailHref, type RentCastSearchListing } from "@/lib/rentcast-property";

const STORAGE_KEY = "rylest-saved-properties-v1";
export type SavedProperty = {
  id: string;
  listingType: "sale" | "rental";
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  propertyType?: string;
  status?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  listedDate?: string;
  detailHref: string;
  sourceUrl?: string;
};

export function loadSavedProperties(): SavedProperty[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is SavedProperty =>
      Boolean(item && typeof item === "object" && typeof item.id === "string" &&
        (item.listingType === "sale" || item.listingType === "rental") &&
        typeof item.address === "string" && typeof item.detailHref === "string" &&
        item.detailHref.startsWith("/property-intelligence/")),
    );
  } catch {
    return [];
  }
}

function toSavedProperty(listing: RentCastSearchListing): SavedProperty {
  const sourceUrl = typeof listing.url === "string" && /^https?:\/\//i.test(listing.url) ? listing.url : undefined;
  return {
    id: listing.id,
    listingType: listing.listingType,
    address: listing.formattedAddress || listing.addressLine1 || "Property address unavailable",
    ...(listing.city ? { city: listing.city } : {}),
    ...(listing.state ? { state: listing.state } : {}),
    ...(listing.zipCode ? { zipCode: listing.zipCode } : {}),
    ...(listing.propertyType ? { propertyType: listing.propertyType } : {}),
    ...(listing.status ? { status: listing.status } : {}),
    ...(typeof listing.price === "number" ? { price: listing.price } : {}),
    ...(typeof listing.bedrooms === "number" ? { bedrooms: listing.bedrooms } : {}),
    ...(typeof listing.bathrooms === "number" ? { bathrooms: listing.bathrooms } : {}),
    ...(typeof listing.squareFootage === "number" ? { squareFootage: listing.squareFootage } : {}),
    ...(listing.listedDate ? { listedDate: listing.listedDate } : {}),
    detailHref: rentCastDetailHref(listing),
    ...(sourceUrl ? { sourceUrl } : {}),
  };
}

export function toggleSavedProperty(listing: RentCastSearchListing) {
  const key = `${listing.listingType}:${listing.id}`;
  const current = loadSavedProperties();
  const exists = current.some((item) => `${item.listingType}:${item.id}` === key);
  const updated = exists
    ? current.filter((item) => `${item.listingType}:${item.id}` !== key)
    : [toSavedProperty(listing), ...current].slice(0, 100);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("rylest-saved-properties-change"));
  } catch {
    throw new Error("Browser storage is unavailable. Try enabling storage to save properties.");
  }
  return { saved: !exists, properties: updated };
}

export function removeSavedProperty(id: string, listingType: "sale" | "rental") {
  const updated = loadSavedProperties().filter((item) => item.id !== id || item.listingType !== listingType);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("rylest-saved-properties-change"));
  } catch {
    // The page can still reflect the in-memory removal until it is refreshed.
  }
  return updated;
}
