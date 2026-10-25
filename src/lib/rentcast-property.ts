import type { RentCastListing } from "@/lib/rentcast.server";
import type { ComparisonProperty } from "@/lib/property-comparison";

export type RentCastSearchListing = RentCastListing & { listingType: "sale" | "rental" };

export function propertyAddress(listing: RentCastListing) {
  return listing.formattedAddress ||
    [listing.addressLine1, listing.addressLine2, listing.city, listing.state, listing.zipCode]
      .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
      .join(", ");
}

export function rentCastDetailHref(listing: RentCastSearchListing) {
  const sourceValue = listing.url ?? listing["listingUrl"] ?? listing["sourceUrl"];
  const sourceUrl = typeof sourceValue === "string" ? sourceValue : "";
  const safeSourceUrl = (() => {
    try {
      const url = new URL(sourceUrl);
      return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
    } catch {
      return "";
    }
  })();
  const query = new URLSearchParams({
    address: propertyAddress(listing),
    listingType: listing.listingType,
    ...(listing.propertyType ? { propertyType: listing.propertyType } : {}),
    ...(listing.bedrooms != null ? { bedrooms: String(listing.bedrooms) } : {}),
    ...(listing.bathrooms != null ? { bathrooms: String(listing.bathrooms) } : {}),
    ...(listing.squareFootage != null ? { squareFootage: String(listing.squareFootage) } : {}),
    ...(safeSourceUrl ? { sourceUrl: safeSourceUrl } : {}),
  });
  return `/property-intelligence/${encodeURIComponent(listing.id)}?${query.toString()}`;
}

export function toRentCastComparison(listing: RentCastSearchListing): ComparisonProperty {
  const validUrl = (value: unknown) => {
    if (typeof value !== "string") return undefined;
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined;
    } catch {
      return undefined;
    }
  };
  const image = listingImage(listing);
  return {
    key: `rentcast:${listing.listingType}:${listing.id}`,
    source: "rentcast",
    sourceLabel: "RentCast",
    name: propertyAddress(listing) || "Property address unavailable",
    address: listing.addressLine1 ?? listing.formattedAddress,
    city: listing.city,
    state: listing.state,
    zipCode: listing.zipCode,
    image,
    price: typeof listing.price === "number" && Number.isFinite(listing.price) ? listing.price : undefined,
    priceBasis: "rentcast-listing",
    currency: "USD",
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    areaSqFt: listing.squareFootage,
    lotAreaSqFt: listing.lotSize,
    propertyType: listing.propertyType,
    status: listing.status,
    sourceUrl: validUrl(listing.url ?? listing["listingUrl"] ?? listing["sourceUrl"]),
    detailHref: rentCastDetailHref(listing),
  };
}

export function listingImage(listing: RentCastListing) {
  const images = listing["images"] ?? listing["photos"];
  const firstImage = Array.isArray(images) ? images[0] : undefined;
  const firstCandidate = typeof firstImage === "string"
    ? firstImage
    : firstImage && typeof firstImage === "object"
      ? (firstImage as Record<string, unknown>)["url"] ?? (firstImage as Record<string, unknown>)["src"]
      : undefined;
  const candidate = listing["image"] ?? listing["imageUrl"] ?? listing["photoUrl"] ?? firstCandidate;
  if (typeof candidate !== "string") return undefined;
  try { const url = new URL(candidate); return url.protocol === "https:" ? url.toString() : undefined; }
  catch { return undefined; }
}
