export type MatchListing = {
  source: string;
  id: string;
  title: string;
  category?: string;
  address: string;
  city: string;
  state: string;
  price: number | null;
  status: string | null;
  image: string | null;
  url: string;
  bedrooms: number | null;
  bathrooms: number | null;
  size: number | null;
  actualPrice: boolean;
  auctionDate: string | null;
};

export function matchesSavedSearch(listing: MatchListing, filters: Record<string, string>) {
  const term = [listing.title, listing.category, listing.address, listing.city, listing.state]
    .join(" ")
    .toLowerCase();
  const q = filters.q?.trim().toLowerCase();
  const city = (filters.city ?? "").trim().toLowerCase();
  const region = (filters.state ?? filters.region ?? "").trim().toLowerCase();
  if (q && !term.includes(q)) return false;
  if (
    city &&
    !listing.city.toLowerCase().includes(city) &&
    !listing.address.toLowerCase().includes(city)
  )
    return false;
  if (region && !listing.state.toLowerCase().includes(region)) return false;
  if (filters.minPrice && (listing.price == null || listing.price < Number(filters.minPrice)))
    return false;
  if (filters.maxPrice && (listing.price == null || listing.price > Number(filters.maxPrice)))
    return false;
  const bedrooms = filters.minBedrooms ?? filters.bedrooms;
  if (bedrooms && (listing.bedrooms == null || listing.bedrooms < Number(bedrooms))) return false;
  if (filters.status && listing.status?.toLowerCase() !== filters.status.toLowerCase())
    return false;
  if (
    filters.category &&
    !(listing.category ?? "").toLowerCase().includes(filters.category.toLowerCase())
  )
    return false;
  return true;
}

export function changedListingFields(
  previous: { price?: number | null; status?: string | null; auctionDate?: string | null },
  current: MatchListing,
) {
  const changes: Array<{
    type: "price_changed" | "status_changed" | "auction_changed";
    oldValue: string | number;
    newValue: string | number;
  }> = [];
  if (
    current.actualPrice &&
    previous.price != null &&
    current.price != null &&
    previous.price !== current.price
  ) {
    changes.push({ type: "price_changed", oldValue: previous.price, newValue: current.price });
  }
  if (previous.status && current.status && previous.status !== current.status) {
    changes.push({ type: "status_changed", oldValue: previous.status, newValue: current.status });
  }
  if (previous.auctionDate && current.auctionDate && previous.auctionDate !== current.auctionDate) {
    changes.push({
      type: "auction_changed",
      oldValue: previous.auctionDate,
      newValue: current.auctionDate,
    });
  }
  return changes;
}

export function listingEventKey(
  searchId: string,
  source: string,
  listingId: string,
  type: string,
  oldValue?: string | number,
  newValue?: string | number,
) {
  return [searchId, source, listingId, type, oldValue, newValue]
    .filter((value) => value !== undefined)
    .join(":");
}
