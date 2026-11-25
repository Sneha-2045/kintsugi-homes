const DATASET_ID = "bZhSt4i1bdfnniiaV";
const APIFY_API = "https://api.apify.com/v2";
const PAGE_SIZE = 20;
const CACHE_MS = 15 * 60 * 1000;
const STATE_ORDER =
  "CA TX FL NY WA IL GA AZ CO NV NC NJ MA TN OR VA PA MI OH AL AK AR CT DE HI ID IN IA KS KY LA ME MD MN MS MO MT NE NH NM ND OK RI SC SD UT VT WV WI WY".split(
    " ",
  );

export type ApifyRentalListing = {
  zpid: string;
  address?: string;
  addressLine1?: string;
  city: string;
  state: string;
  zipCode?: string;
  price?: number;
  priceLabel?: string;
  beds?: number;
  bathrooms?: number;
  propertyType?: string;
  statusType?: string;
  statusText?: string;
  buildingName?: string;
  detailUrl?: string;
  imgSrc: string;
  monthlyRent?: number;
  minRent?: number;
  maxRent?: number;
  availableUnits?: number;
};

export class ApifyRentalError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApifyRentalError";
  }
}

let cachedListings: ApifyRentalListing[] | undefined;
let cacheExpiresAt = 0;
let pendingRequest: Promise<ApifyRentalListing[]> | undefined;

function parseListings(value: unknown): ApifyRentalListing[] {
  if (!Array.isArray(value)) {
    throw new ApifyRentalError(502, "Apify returned an unexpected rentals dataset.");
  }

  const unique = new Map<string, ApifyRentalListing>();
  for (const valueItem of value) {
    if (!valueItem || typeof valueItem !== "object") continue;
    const item = valueItem as Record<string, unknown>;
    const zpid = typeof item["zpid"] === "string" ? item["zpid"] : "";
    const state = typeof item["state"] === "string" ? item["state"] : "";
    const city = typeof item["city"] === "string" ? item["city"] : "";
    const imgSrc = typeof item["imgSrc"] === "string" ? item["imgSrc"] : "";
    if (!zpid || !city || !/^[A-Z]{2}$/.test(state) || item["statusType"] !== "FOR_RENT") continue;
    let photoUrl: URL;
    try {
      photoUrl = new URL(imgSrc);
    } catch {
      continue;
    }
    if (photoUrl.protocol !== "https:") continue;

    unique.set(zpid, {
      zpid,
      city,
      state,
      imgSrc: photoUrl.toString(),
      ...(typeof item["address"] === "string" ? { address: item["address"] } : {}),
      ...(typeof item["addressLine1"] === "string" ? { addressLine1: item["addressLine1"] } : {}),
      ...(typeof item["zipCode"] === "string" ? { zipCode: item["zipCode"] } : {}),
      ...(typeof item["price"] === "number" ? { price: item["price"] } : {}),
      ...(typeof item["priceLabel"] === "string" ? { priceLabel: item["priceLabel"] } : {}),
      ...(typeof item["beds"] === "number" ? { beds: item["beds"] } : {}),
      ...(typeof item["bathrooms"] === "number"
        ? { bathrooms: item["bathrooms"] }
        : typeof item["baths"] === "number"
          ? { bathrooms: item["baths"] }
          : {}),
      ...(typeof item["propertyType"] === "string" ? { propertyType: item["propertyType"] } : {}),
      ...(typeof item["statusType"] === "string" ? { statusType: item["statusType"] } : {}),
      ...(typeof item["statusText"] === "string" ? { statusText: item["statusText"] } : {}),
      ...(typeof item["buildingName"] === "string" ? { buildingName: item["buildingName"] } : {}),
      ...(typeof item["detailUrl"] === "string" ? { detailUrl: item["detailUrl"] } : {}),
      ...(typeof item["monthlyRent"] === "number" ? { monthlyRent: item["monthlyRent"] } : {}),
      ...(typeof item["minRent"] === "number" ? { minRent: item["minRent"] } : {}),
      ...(typeof item["maxRent"] === "number" ? { maxRent: item["maxRent"] } : {}),
      ...(typeof item["availableUnits"] === "number"
        ? { availableUnits: item["availableUnits"] }
        : {}),
    });
  }

  const groups = new Map<string, ApifyRentalListing[]>();
  for (const listing of unique.values()) {
    const group = groups.get(listing.state) ?? [];
    group.push(listing);
    groups.set(listing.state, group);
  }
  const orderedStates = [
    ...STATE_ORDER.filter((state) => groups.has(state)),
    ...[...groups.keys()].filter((state) => !STATE_ORDER.includes(state)).sort(),
  ];
  const mixed: ApifyRentalListing[] = [];
  for (
    let index = 0;
    index < Math.max(0, ...[...groups.values()].map((group) => group.length));
    index += 1
  ) {
    for (const state of orderedStates) {
      const listing = groups.get(state)?.[index];
      if (listing) mixed.push(listing);
    }
  }
  return mixed;
}

async function fetchListings() {
  const token = process.env["APIFY_TOKEN"]?.trim();
  if (!token) throw new ApifyRentalError(503, "Apify rentals are not configured on this server.");

  let response: Response;
  try {
    response = await fetch(
      `${APIFY_API}/datasets/${DATASET_ID}/items?clean=true&format=json&limit=1000`,
      {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        signal: AbortSignal.timeout(15_000),
      },
    );
  } catch {
    throw new ApifyRentalError(503, "Apify rentals are temporarily unavailable.");
  }
  if (!response.ok) {
    throw new ApifyRentalError(503, "Apify rentals are temporarily unavailable.");
  }
  let value: unknown;
  try {
    value = await response.json();
  } catch {
    throw new ApifyRentalError(502, "Apify returned unreadable rental data.");
  }
  return parseListings(value);
}

async function getListings() {
  if (cachedListings && cacheExpiresAt > Date.now()) return cachedListings;
  if (!pendingRequest) {
    pendingRequest = fetchListings()
      .then((listings) => {
        cachedListings = listings;
        cacheExpiresAt = Date.now() + CACHE_MS;
        return listings;
      })
      .finally(() => {
        pendingRequest = undefined;
      });
  }
  return pendingRequest;
}

export async function getApifyRentals(offset = 0) {
  if (!Number.isSafeInteger(offset) || offset < 0 || offset % PAGE_SIZE !== 0) {
    throw new ApifyRentalError(400, "Invalid rental page.");
  }
  const listings = await getListings();
  const page = listings.slice(offset, offset + PAGE_SIZE);
  const stateCounts: Record<string, number> = {};
  for (const listing of listings)
    stateCounts[listing.state] = (stateCounts[listing.state] ?? 0) + 1;
  return {
    listings: page,
    offset,
    limit: PAGE_SIZE,
    totalCount: listings.length,
    hasMore: offset + page.length < listings.length,
    stateCounts,
    statesResponded: Object.keys(stateCounts),
  };
}
