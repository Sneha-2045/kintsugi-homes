const DATASET_ID = "bZhSt4i1bdfnniiaV";
const APIFY_API = "https://api.apify.com/v2";
const PAGE_SIZE = 20;
const DATASET_PAGE_SIZE = 1000;
const APIFY_TIMEOUT_MS = 15_000;
const CACHE_MS = 15 * 60 * 1000;
const STATE_ORDER =
  "CA TX FL NY WA IL GA AZ CO NV NC NJ MA TN OR VA PA MI OH AL AK AR CT DE HI ID IN IA KS KY LA ME MD MN MS MO MT NE NH NM ND OK RI SC SD UT VT WV WI WY".split(
    " ",
  );
const US_STATE_CODES = new Set(STATE_ORDER);
const STATE_NAME_TO_CODE: Record<string, string> = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY",
};

export type ApifyRentalListing = {
  zpid: string;
  sourceId?: string;
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
  availableDate?: string;
  createdAt?: string;
  updatedAt?: string;
  amenities?: string[];
  furnished?: boolean;
  leaseDuration?: string;
  buildingName?: string;
  detailUrl?: string;
  description?: string;
  source?: string;
  sourceUrl?: string;
  imgSrc: string;
  monthlyRent?: number;
  minRent?: number;
  maxRent?: number;
  availableUnits?: number;
};

export type RentalFilters = {
  q?: string;
  type?: string;
  minRent?: number;
  maxRent?: number;
  state?: string;
  city?: string;
  zipCode?: string;
  neighborhood?: string;
  beds?: number;
  studio?: boolean;
  bathrooms?: number;
  sort?: "price-asc" | "price-desc" | "beds-desc";
  availability?: "now" | "soon";
  furnished?: boolean;
  amenities?: string[];
  leaseDuration?: string;
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
      ...(typeof item["description"] === "string" ? { description: item["description"] } : {}),
      ...(typeof item["source"] === "string" ? { source: item["source"] } : {}),
      ...(typeof item["sourceUrl"] === "string" ? { sourceUrl: item["sourceUrl"] } : {}),
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

async function fetchDatasetPage(offset: number) {
  const token = process.env["APIFY_TOKEN"]?.trim();
  if (!token) throw new ApifyRentalError(503, "Apify rentals are not configured on this server.");

  let response: Response;
  try {
    response = await fetch(
      `${APIFY_API}/datasets/${DATASET_ID}/items?clean=true&format=json&limit=${DATASET_PAGE_SIZE}&offset=${offset}`,
      {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        signal: AbortSignal.timeout(APIFY_TIMEOUT_MS),
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
  if (!Array.isArray(value))
    throw new ApifyRentalError(502, "Apify returned an unexpected rentals dataset.");
  const rawTotal = Number(response.headers.get("X-Apify-Pagination-Total"));
  return { items: value, total: Number.isFinite(rawTotal) && rawTotal >= 0 ? rawTotal : null };
}

async function fetchListings() {
  const first = await fetchDatasetPage(0);
  const rawItems = [...first.items];
  let offset = first.items.length;
  const expectedTotal = first.total;
  while (
    first.items.length === DATASET_PAGE_SIZE &&
    (expectedTotal === null || offset < expectedTotal)
  ) {
    const page = await fetchDatasetPage(offset);
    if (page.items.length === 0) break;
    rawItems.push(...page.items);
    offset += page.items.length;
    if (page.items.length < DATASET_PAGE_SIZE) break;
  }
  return parseListings(rawItems);
}

function normalized(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function rentAmount(listing: ApifyRentalListing) {
  return listing.monthlyRent ?? listing.minRent ?? listing.price;
}

function propertyTypeMatches(listingType: string | undefined, filterType: string) {
  const value = normalized(listingType);
  const type = normalized(filterType);
  if (!value || !type) return !type;
  const aliases: Record<string, string[]> = {
    apartment: ["apartment", "apt"],
    house: ["house", "single family", "single-family", "home"],
    condo: ["condo", "condominium"],
    townhouse: ["townhouse", "townhome", "town home"],
    studio: ["studio"],
    duplex: ["duplex"],
    "single-family home": ["single family", "single-family", "house"],
    "shared accommodation": ["shared", "room", "roommate"],
  };
  return (aliases[type] ?? [type]).some((alias) => value.includes(alias));
}

function filterListings(listings: ApifyRentalListing[], filters: RentalFilters) {
  const q = normalized(filters.q);
  const city = normalized(filters.city);
  const zipCode = normalized(filters.zipCode);
  const neighborhood = normalized(filters.neighborhood);
  const filtered = listings.filter((listing) => {
    const amount = rentAmount(listing);
    const address = normalized(
      `${listing.address ?? ""} ${listing.addressLine1 ?? ""} ${listing.buildingName ?? ""}`,
    );
    const fullLocation = normalized(
      `${listing.city} ${listing.state} ${listing.zipCode ?? ""} ${address}`,
    );
    if (q && STATE_NAME_TO_CODE[q] && listing.state !== STATE_NAME_TO_CODE[q]) return false;
    if (q && !STATE_NAME_TO_CODE[q]) {
      const tokens = q.split(/[\s,]+/).filter(Boolean);
      if (
        !tokens.every((token) => {
          const tokenLower = token.toLowerCase();
          const stateCode =
            STATE_NAME_TO_CODE[tokenLower] ??
            (US_STATE_CODES.has(token.toUpperCase()) ? token.toUpperCase() : undefined);
          return (
            fullLocation.includes(tokenLower) || (stateCode != null && listing.state === stateCode)
          );
        })
      )
        return false;
    }
    if (filters.state && listing.state !== filters.state) return false;
    if (city && !normalized(listing.city).includes(city)) return false;
    if (zipCode && !normalized(listing.zipCode).startsWith(zipCode)) return false;
    if (neighborhood && !address.includes(neighborhood)) return false;
    if (!propertyTypeMatches(listing.propertyType, filters.type ?? "")) return false;
    if (
      filters.studio &&
      !(normalized(listing.propertyType).includes("studio") || listing.beds === 0)
    )
      return false;
    if (filters.beds !== undefined && (listing.beds === undefined || listing.beds < filters.beds))
      return false;
    if (
      filters.bathrooms !== undefined &&
      (listing.bathrooms === undefined || listing.bathrooms < filters.bathrooms)
    )
      return false;
    if (filters.minRent !== undefined && (amount === undefined || amount < filters.minRent))
      return false;
    if (filters.maxRent !== undefined && (amount === undefined || amount > filters.maxRent))
      return false;
    return true;
  });

  switch (filters.sort) {
    case "price-asc":
      filtered.sort(
        (a, b) =>
          (rentAmount(a) ?? Number.POSITIVE_INFINITY) - (rentAmount(b) ?? Number.POSITIVE_INFINITY),
      );
      break;
    case "price-desc":
      filtered.sort(
        (a, b) =>
          (rentAmount(b) ?? Number.NEGATIVE_INFINITY) - (rentAmount(a) ?? Number.NEGATIVE_INFINITY),
      );
      break;
    case "beds-desc":
      filtered.sort(
        (a, b) => (b.beds ?? Number.NEGATIVE_INFINITY) - (a.beds ?? Number.NEGATIVE_INFINITY),
      );
      break;
  }
  return filtered;
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

export async function getApifyRentals(offset = 0, filters: RentalFilters = {}) {
  if (!Number.isSafeInteger(offset) || offset < 0 || offset % PAGE_SIZE !== 0) {
    throw new ApifyRentalError(400, "Invalid rental page.");
  }
  const listings = await getListings();
  const matchingListings = filterListings(listings, filters);
  const page = matchingListings.slice(offset, offset + PAGE_SIZE);
  const stateCounts: Record<string, number> = {};
  for (const listing of listings)
    stateCounts[listing.state] = (stateCounts[listing.state] ?? 0) + 1;
  return {
    listings: page,
    offset,
    limit: PAGE_SIZE,
    totalCount: matchingListings.length,
    hasMore: offset + page.length < matchingListings.length,
    stateCounts,
    statesResponded: Object.keys(stateCounts),
  };
}

export async function getApifyRentalById(id: string) {
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(id)) return null;
  const listings = await getListings();
  return listings.find((listing) => listing.zpid === id) ?? null;
}
