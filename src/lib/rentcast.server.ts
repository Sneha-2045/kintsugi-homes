const API_BASE = "https://api.rentcast.io/v1";
const PAGE_SIZE = 20;
const STATE_CODES = new Set(
  "AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC".split(
    " ",
  ),
);
const PROPERTY_TYPES = new Set([
  "Single Family",
  "Condo",
  "Townhouse",
  "Apartment",
  "Multi-Family",
  "Land",
]);

export type RentCastListing = {
  id: string;
  formattedAddress?: string;
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  lotSize?: number;
  yearBuilt?: number;
  status?: string;
  price?: number;
  listingType?: string;
  listedDate?: string;
  removedDate?: string | null;
  lastSeenDate?: string;
  daysOnMarket?: number;
  url?: string;
  [key: string]: unknown;
};

export type RentCastFilters = {
  city?: string;
  zipCode?: string;
  state: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  minSquareFootage?: number;
  maxSquareFootage?: number;
  listingType: "sale" | "rental";
  offset: number;
};

export type RentCastErrorCode =
  | "CONFIGURATION_MISSING"
  | "INVALID_SEARCH"
  | "AUTHENTICATION_FAILED"
  | "MARKET_ACCESS_DENIED"
  | "UNSUPPORTED_MARKET"
  | "RATE_LIMITED"
  | "UPSTREAM_TIMEOUT"
  | "UPSTREAM_UNAVAILABLE"
  | "UPSTREAM_FAILURE"
  | "INVALID_UPSTREAM_RESPONSE";

export class RentCastError extends Error {
  public status: number;
  public code: RentCastErrorCode;
  public retryable: boolean;

  constructor(status: number, code: RentCastErrorCode, message: string, retryable = false) {
    super(message);
    this.status = status;
    this.code = code;
    this.retryable = retryable;
    this.name = "RentCastError";
  }
}

function boundedText(raw: string | null, name: string, maxLength = 80) {
  const value = raw?.trim() ?? "";
  // eslint-disable-next-line no-control-regex
  if (value.length > maxLength || /[\u0000-\u001f]/.test(value)) {
    throw new RentCastError(400, "INVALID_SEARCH", `Enter a valid ${name}.`);
  }
  return value;
}

function rangeValue(minRaw: string | null, maxRaw: string | null, label: string, max: number) {
  const parse = (raw: string | null) => {
    if (raw == null || raw.trim() === "") return undefined;
    const value = Number(raw);
    if (!Number.isSafeInteger(value) || value < 0 || value > max) {
      throw new RentCastError(400, "INVALID_SEARCH", `Enter a valid ${label}.`);
    }
    return value;
  };
  const min = parse(minRaw);
  const high = parse(maxRaw);
  if (min != null && high != null && min > high) {
    throw new RentCastError(
      400,
      "INVALID_SEARCH",
      `Minimum ${label} must not exceed maximum ${label}.`,
    );
  }
  return { min, max: high };
}

export function parseRentCastFilters(params: URLSearchParams): RentCastFilters {
  const city = boundedText(params.get("city"), "city", 80);
  const zipCode = boundedText(params.get("zipCode"), "ZIP code", 5);
  const state = boundedText(params.get("state"), "state", 2).toUpperCase();
  if ((!city && !zipCode) || !state || !STATE_CODES.has(state)) {
    throw new RentCastError(
      400,
      "INVALID_SEARCH",
      "Enter a city or ZIP code and select a valid US state.",
    );
  }
  if (zipCode && !/^\d{5}$/.test(zipCode)) {
    throw new RentCastError(400, "INVALID_SEARCH", "Enter a 5-digit ZIP code.");
  }
  const propertyType = boundedText(params.get("propertyType"), "property type", 40);
  if (propertyType && !PROPERTY_TYPES.has(propertyType)) {
    throw new RentCastError(400, "INVALID_SEARCH", "Choose a supported property type.");
  }
  const listingType = params.get("listingType") || "sale";
  if (listingType !== "sale" && listingType !== "rental") {
    throw new RentCastError(400, "INVALID_SEARCH", "Choose sale or rental listings.");
  }
  const bedrooms = rangeValue(
    params.get("bedrooms"),
    params.get("bedrooms"),
    "bedroom count",
    20,
  ).min;
  const bathrooms = rangeValue(
    params.get("bathrooms"),
    params.get("bathrooms"),
    "bathroom count",
    20,
  ).min;
  const price = rangeValue(params.get("minPrice"), params.get("maxPrice"), "price", 100_000_000);
  const area = rangeValue(
    params.get("minSquareFootage"),
    params.get("maxSquareFootage"),
    "square footage",
    1_000_000,
  );
  const rawOffset = params.get("offset") ?? "0";
  const offset = Number(rawOffset);
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 10_000 || offset % PAGE_SIZE !== 0) {
    throw new RentCastError(400, "INVALID_SEARCH", "Invalid results page. Please search again.");
  }
  return {
    ...(city ? { city } : {}),
    ...(zipCode ? { zipCode } : {}),
    state,
    ...(propertyType ? { propertyType } : {}),
    ...(price.min != null ? { minPrice: price.min } : {}),
    ...(price.max != null ? { maxPrice: price.max } : {}),
    ...(bedrooms != null ? { bedrooms } : {}),
    ...(bathrooms != null ? { bathrooms } : {}),
    ...(area.min != null ? { minSquareFootage: area.min } : {}),
    ...(area.max != null ? { maxSquareFootage: area.max } : {}),
    listingType,
    offset,
  };
}

function range(min?: number, max?: number) {
  if (min == null && max == null) return undefined;
  return `${min ?? ""}:${max ?? ""}`;
}

export function buildListingUrl(filters: RentCastFilters) {
  const endpoint = filters.listingType === "sale" ? "listings/sale" : "listings/rental/long-term";
  const url = new URL(`${API_BASE}/${endpoint}`);
  if (filters.city) url.searchParams.set("city", filters.city);
  if (filters.zipCode) url.searchParams.set("zipCode", filters.zipCode);
  url.searchParams.set("state", filters.state);
  if (filters.propertyType) url.searchParams.set("propertyType", filters.propertyType);
  url.searchParams.set("status", "Active");
  const price = range(filters.minPrice, filters.maxPrice);
  const squareFootage = range(filters.minSquareFootage, filters.maxSquareFootage);
  if (price) url.searchParams.set("price", price);
  if (filters.bedrooms != null) url.searchParams.set("bedrooms", String(filters.bedrooms));
  if (filters.bathrooms != null) url.searchParams.set("bathrooms", String(filters.bathrooms));
  if (squareFootage) url.searchParams.set("squareFootage", squareFootage);
  url.searchParams.set("limit", String(PAGE_SIZE));
  url.searchParams.set("offset", String(filters.offset));
  return url;
}

const responseCache = new Map<string, { expires: number; value: unknown; headers: Headers }>();
const MAX_CACHE_ENTRIES = 80;

function cacheGet(key: string) {
  const entry = responseCache.get(key);
  if (!entry) return undefined;
  if (entry.expires <= Date.now()) {
    responseCache.delete(key);
    return undefined;
  }
  return entry;
}

function cacheSet(key: string, value: unknown, headers: Headers, ttlMs: number) {
  if (responseCache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = responseCache.keys().next().value;
    if (firstKey) responseCache.delete(firstKey);
  }
  responseCache.set(key, { expires: Date.now() + ttlMs, value, headers });
}

function apiKey() {
  const key = process.env["RENTCAST_API_KEY"]?.trim();
  if (!key) {
    throw new RentCastError(
      503,
      "CONFIGURATION_MISSING",
      "Property Intelligence is not configured on this server yet. Add the RENTCAST_API_KEY secret and redeploy.",
    );
  }
  return key;
}

function classifyUpstream(status: number) {
  if (status === 401)
    return new RentCastError(
      502,
      "AUTHENTICATION_FAILED",
      "RentCast rejected the server credentials. Check the API key in the hosting dashboard.",
    );
  if (status === 403)
    return new RentCastError(
      403,
      "MARKET_ACCESS_DENIED",
      "RentCast denied this request. Check your subscription and endpoint access.",
    );
  if (status === 404)
    return new RentCastError(
      422,
      "UNSUPPORTED_MARKET",
      "RentCast has no data for this location or property.",
    );
  if (status === 429)
    return new RentCastError(
      429,
      "RATE_LIMITED",
      "RentCast API quota or rate limit reached. Please try again later.",
      true,
    );
  if (status === 400 || status === 422)
    return new RentCastError(
      400,
      "INVALID_SEARCH",
      "RentCast could not use these search filters. Check the location and property details.",
    );
  if (status === 408 || status >= 500)
    return new RentCastError(
      503,
      "UPSTREAM_UNAVAILABLE",
      "RentCast is temporarily unavailable. Please try again.",
      true,
    );
  return new RentCastError(502, "UPSTREAM_FAILURE", "RentCast could not complete the request.");
}

async function rentCastGet(url: URL, ttlMs = 60_000) {
  const key = apiKey();
  const cached = cacheGet(url.toString());
  if (cached) return { value: cached.value, headers: cached.headers };
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "X-Api-Key": key, Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
    });
  } catch (cause) {
    const timedOut =
      cause instanceof Error && (cause.name === "TimeoutError" || cause.name === "AbortError");
    throw new RentCastError(
      503,
      timedOut ? "UPSTREAM_TIMEOUT" : "UPSTREAM_UNAVAILABLE",
      timedOut
        ? "RentCast took too long to respond. Please try again."
        : "Could not connect to RentCast. Please try again.",
      true,
    );
  }
  if (!response.ok) {
    // Read only for classification; response bodies are never logged or sent to the browser.
    const error = classifyUpstream(response.status);
    console.error("[RentCast] API request failed", { code: error.code, status: response.status });
    throw error;
  }
  let value: unknown;
  try {
    value = await response.json();
  } catch {
    throw new RentCastError(
      502,
      "INVALID_UPSTREAM_RESPONSE",
      "RentCast returned an unreadable response.",
    );
  }
  if (!value || typeof value !== "object") {
    throw new RentCastError(
      502,
      "INVALID_UPSTREAM_RESPONSE",
      "RentCast returned an unexpected response.",
    );
  }
  const headers = new Headers({
    "X-Total-Count": response.headers.get("X-Total-Count") ?? "",
  });
  cacheSet(url.toString(), value, headers, ttlMs);
  return { value, headers };
}

export async function searchRentCast(params: URLSearchParams) {
  const filters = parseRentCastFilters(params);
  const url = buildListingUrl(filters);
  const result = await rentCastGet(url);
  if (!Array.isArray(result.value)) {
    throw new RentCastError(
      502,
      "INVALID_UPSTREAM_RESPONSE",
      "RentCast returned an unexpected listings response.",
    );
  }
  const listings = (result.value as unknown[]).filter((item): item is RentCastListing =>
    Boolean(
      item &&
      typeof item === "object" &&
      typeof (item as Record<string, unknown>)["id"] === "string",
    ),
  );
  const totalCount = Number(result.headers.get("X-Total-Count")) || undefined;
  return {
    listings,
    offset: filters.offset,
    limit: PAGE_SIZE,
    hasMore:
      totalCount != null
        ? totalCount > filters.offset + listings.length
        : listings.length === PAGE_SIZE,
    totalCount,
  };
}

function detailsAddress(params: URLSearchParams) {
  const address = boundedText(params.get("address"), "property address", 250);
  if (!address || !/[A-Za-z]/.test(address)) {
    throw new RentCastError(
      400,
      "INVALID_SEARCH",
      "A complete property address is required for investment details.",
    );
  }
  const propertyType = boundedText(params.get("propertyType"), "property type", 40);
  if (propertyType && !PROPERTY_TYPES.has(propertyType))
    throw new RentCastError(400, "INVALID_SEARCH", "Choose a supported property type.");
  const query = new URLSearchParams({ address });
  if (propertyType) query.set("propertyType", propertyType);
  for (const key of ["bedrooms", "bathrooms", "squareFootage"] as const) {
    const raw = params.get(key);
    if (raw == null || raw === "") continue;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0 || value > 1_000_000)
      throw new RentCastError(400, "INVALID_SEARCH", `Enter valid ${key}.`);
    query.set(key, String(value));
  }
  return query;
}

async function optionalDetails(endpoint: string, query: URLSearchParams) {
  const url = new URL(`${API_BASE}/${endpoint}`);
  query.forEach((value, key) => url.searchParams.set(key, value));
  try {
    return (await rentCastGet(url, 6 * 60 * 60 * 1000)).value;
  } catch (error) {
    if (error instanceof RentCastError && [400, 403, 422].includes(error.status)) {
      return { unavailable: error.message };
    }
    throw error;
  }
}

export async function getRentCastDetails(params: URLSearchParams) {
  const query = detailsAddress(params);
  const [records, valuation, rent] = await Promise.all([
    optionalDetails("properties", query),
    optionalDetails("avm/value", query),
    optionalDetails("avm/rent/long-term", query),
  ]);
  return {
    property: Array.isArray(records) ? (records[0] ?? null) : records,
    valuation,
    rent,
  };
}

export function rentCastErrorResponse(error: unknown) {
  const normalized =
    error instanceof RentCastError
      ? error
      : new RentCastError(
          500,
          "UPSTREAM_FAILURE",
          "Property search failed unexpectedly. Please try again.",
        );
  if (normalized.status >= 500)
    console.error("[RentCast] request error", { code: normalized.code });
  return Response.json(
    {
      error: {
        code: normalized.code,
        message: normalized.message,
        retryable: normalized.retryable,
      },
    },
    { status: normalized.status, headers: { "Cache-Control": "no-store" } },
  );
}
