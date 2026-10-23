const API_URL = "https://api.repliers.io/listings";

export type RepliersListing = {
  mlsNumber: string;
  boardId?: number;
  address?: Record<string, unknown>;
  details?: Record<string, unknown>;
  images?: Array<string | { url?: string; path?: string }>;
  permissions?: {
    displayInternetEntireListing?: string;
    displayPublic?: string;
  };
  [key: string]: unknown;
};

export type RepliersSearchResponse = {
  listings: RepliersListing[];
  page?: number;
  pageSize?: number;
  numPages?: number;
  count?: number;
  [key: string]: unknown;
};

export type RepliersErrorCode =
  | "CONFIGURATION_MISSING"
  | "INVALID_SEARCH"
  | "AUTHENTICATION_FAILED"
  | "MARKET_ACCESS_DENIED"
  | "UNSUPPORTED_MARKET"
  | "RATE_LIMITED"
  | "UPSTREAM_TIMEOUT"
  | "UPSTREAM_UNAVAILABLE"
  | "UPSTREAM_FAILURE"
  | "INVALID_UPSTREAM_RESPONSE"
  | "LISTING_NOT_FOUND";

export class RepliersError extends Error {
  constructor(
    public status: number,
    public code: RepliersErrorCode,
    message: string,
    public retryable = false,
    public retryAfter?: string,
  ) {
    super(message);
    this.name = "RepliersError";
  }
}

function apiKey() {
  const value = process.env["REPLIERS_API_KEY"]?.trim();
  if (!value) {
    logRepliersFailure({ code: "CONFIGURATION_MISSING" });
    throw new RepliersError(
      503,
      "CONFIGURATION_MISSING",
      "MLS search is not configured on this server. Add the Repliers API key and redeploy.",
    );
  }
  return value;
}

function logRepliersFailure(details: {
  code: RepliersErrorCode;
  status?: number;
  causeName?: string;
}) {
  // Do not log request URLs, query values, response bodies, or credentials.
  console.error("[Repliers] MLS request failed", details);
}

function upstreamMessage(body: string) {
  try {
    const parsed: unknown = JSON.parse(body);
    if (typeof parsed === "string") return parsed.slice(0, 1000);
    if (Array.isArray(parsed)) {
      return parsed
        .map((entry) =>
          entry && typeof entry === "object" && "msg" in entry ? String(entry.msg) : "",
        )
        .filter(Boolean)
        .join(" ")
        .slice(0, 1000);
    }
    if (parsed && typeof parsed === "object") {
      const record = parsed as Record<string, unknown>;
      const detail = [record["message"], record["error"], record["msg"]]
        .filter((value): value is string => typeof value === "string")
        .join(" ");
      return detail.slice(0, 1000);
    }
  } catch {
    // Repliers may return a non-JSON error page; only use its text for classification.
  }
  return body.slice(0, 1000);
}

function upstreamError(status: number, detail: string, retryAfter?: string) {
  const text = detail.toLowerCase();
  if (status === 401) {
    return new RepliersError(
      502,
      "AUTHENTICATION_FAILED",
      "Repliers rejected the server credentials. Verify the API key in the Repliers portal and deployment settings.",
    );
  }
  if (status === 403) {
    return new RepliersError(
      403,
      "MARKET_ACCESS_DENIED",
      "Repliers denied access to this search. Check MLS market coverage, account permissions, and any Repliers firewall rules.",
    );
  }
  if (status === 404 || (status === 400 && /market|board|coverage|location|city/.test(text))) {
    return new RepliersError(
      422,
      "UNSUPPORTED_MARKET",
      "Repliers could not serve this market or location. Check that it is included in the account’s MLS coverage.",
    );
  }
  if (status === 400) {
    return new RepliersError(
      400,
      "INVALID_SEARCH",
      "Repliers rejected the search filters. Review the location and filter values.",
    );
  }
  if (status === 429) {
    return new RepliersError(
      503,
      "RATE_LIMITED",
      "The MLS provider is rate limiting searches. Please retry shortly.",
      true,
      retryAfter,
    );
  }
  if (status === 408 || status >= 500) {
    return new RepliersError(
      503,
      "UPSTREAM_UNAVAILABLE",
      "The MLS provider is temporarily unavailable. Please try again.",
      true,
      retryAfter,
    );
  }
  return new RepliersError(
    502,
    "UPSTREAM_FAILURE",
    "The MLS provider could not complete the request.",
  );
}

async function request(url: URL, method: "GET" | "POST" = "GET") {
  // Keep configuration failures out of the network-error catch below.
  const key = apiKey();
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: { "REPLIERS-API-KEY": key, Accept: "application/json" },
      signal: AbortSignal.timeout(12000),
    });
  } catch (cause) {
    const causeName = cause instanceof Error ? cause.name : "UnknownError";
    const timedOut = causeName === "TimeoutError" || causeName === "AbortError";
    const error = new RepliersError(
      503,
      timedOut ? "UPSTREAM_TIMEOUT" : "UPSTREAM_UNAVAILABLE",
      timedOut
        ? "The MLS provider took too long to respond. Please try again."
        : "The MLS provider is temporarily unreachable. Please try again.",
      true,
    );
    logRepliersFailure({ code: error.code, causeName });
    throw error;
  }

  if (!response.ok) {
    let body = "";
    try {
      body = await response.text();
    } catch {
      // Status alone is enough to classify a response when its body cannot be read.
    }
    const error = upstreamError(
      response.status,
      upstreamMessage(body),
      response.headers.get("retry-after") ?? undefined,
    );
    logRepliersFailure({ code: error.code, status: response.status });
    throw error;
  }

  try {
    return (await response.json()) as unknown;
  } catch (cause) {
    const causeName = cause instanceof Error ? cause.name : "UnknownError";
    const error = new RepliersError(
      502,
      "INVALID_UPSTREAM_RESPONSE",
      "The MLS provider returned an unreadable response.",
    );
    logRepliersFailure({ code: error.code, status: response.status, causeName });
    throw error;
  }
}

function publicListing(item: RepliersListing) {
  const permissions = item.permissions;
  if (!permissions) return true;
  if (permissions.displayInternetEntireListing === "N" || permissions.displayPublic === "N")
    return false;
  return true;
}

export function filterPublicListings(data: unknown): RepliersSearchResponse {
  if (
    !data ||
    typeof data !== "object" ||
    !Array.isArray((data as Record<string, unknown>)["listings"])
  ) {
    throw new RepliersError(
      502,
      "INVALID_UPSTREAM_RESPONSE",
      "The MLS provider returned an unexpected listings response.",
    );
  }
  const response = data as RepliersSearchResponse;
  return { ...response, listings: response.listings.filter(publicListing) };
}

function validateFilters(params: URLSearchParams) {
  const allowed = new Set([
    "city",
    "state",
    "area",
    "zip",
    "neighborhood",
    "type",
    "minPrice",
    "maxPrice",
    "propertyType",
    "minBedrooms",
    "minBaths",
    "minSqft",
    "maxSqft",
    "sortBy",
    "pageNum",
    "resultsPerPage",
  ]);
  for (const name of params.keys()) {
    if (!allowed.has(name))
      throw new RepliersError(400, "INVALID_SEARCH", `Unsupported search filter: ${name}.`);
  }
  for (const name of allowed) {
    const values = params.getAll(name);
    if (values.length > 1)
      throw new RepliersError(400, "INVALID_SEARCH", `Only one ${name} value may be provided.`);
    const value = values[0]?.trim();
    // eslint-disable-next-line no-control-regex
    if (value && (value.length > 100 || /[<>\u0000-\u001f]/.test(value))) {
      throw new RepliersError(400, "INVALID_SEARCH", `Invalid ${name} filter.`);
    }
  }

  const numericFilters = ["minPrice", "maxPrice", "minBedrooms", "minBaths", "minSqft", "maxSqft"];
  for (const name of numericFilters) {
    const value = params.get(name);
    if (
      value != null &&
      (!/^\d+(\.\d+)?$/.test(value) || Number(value) < 0 || Number(value) > 1000000000)
    ) {
      throw new RepliersError(400, "INVALID_SEARCH", `Invalid ${name} filter.`);
    }
  }
  if (
    Number(params.get("minPrice") ?? 0) > Number(params.get("maxPrice") ?? Number.MAX_SAFE_INTEGER)
  ) {
    throw new RepliersError(400, "INVALID_SEARCH", "Minimum price must not exceed maximum price.");
  }
  if (
    Number(params.get("minSqft") ?? 0) > Number(params.get("maxSqft") ?? Number.MAX_SAFE_INTEGER)
  ) {
    throw new RepliersError(
      400,
      "INVALID_SEARCH",
      "Minimum square footage must not exceed maximum square footage.",
    );
  }
  if (params.get("type") && !["sale", "lease"].includes(params.get("type")!)) {
    throw new RepliersError(400, "INVALID_SEARCH", "Listing type must be sale or lease.");
  }
  for (const name of ["pageNum", "resultsPerPage"]) {
    const value = params.get(name);
    if (value != null && !/^\d+$/.test(value))
      throw new RepliersError(400, "INVALID_SEARCH", `Invalid ${name}.`);
  }
  const pageNum = Number(params.get("pageNum") ?? 1);
  const resultsPerPage = Number(params.get("resultsPerPage") ?? 24);
  if (!Number.isInteger(pageNum) || pageNum < 1 || pageNum > 10000)
    throw new RepliersError(400, "INVALID_SEARCH", "Invalid page number.");
  if (!Number.isInteger(resultsPerPage) || resultsPerPage < 1 || resultsPerPage > 48)
    throw new RepliersError(400, "INVALID_SEARCH", "Invalid page size.");
  if (params.get("zip") && !/^\d{5}(?:-\d{4})?$/.test(params.get("zip")!)) {
    throw new RepliersError(400, "INVALID_SEARCH", "Enter a valid US ZIP code.");
  }
  if (params.get("state") && !/^[A-Za-z]{2}$/.test(params.get("state")!)) {
    throw new RepliersError(400, "INVALID_SEARCH", "State must be a two-letter code.");
  }
  return { pageNum, resultsPerPage };
}

export async function searchListings(params: URLSearchParams) {
  const { pageNum, resultsPerPage } = validateFilters(params);
  const url = new URL(API_URL);
  for (const [name, value] of params) {
    const clean = value.trim();
    if (clean) url.searchParams.set(name, clean);
  }
  url.searchParams.set("pageNum", String(pageNum));
  url.searchParams.set("resultsPerPage", String(resultsPerPage));
  url.searchParams.set("status", "A");
  url.searchParams.set("displayInternetEntireListing", "Y");
  url.searchParams.set("displayPublic", "Y");
  return filterPublicListings(await request(url));
}

export async function getListing(id: string) {
  const match = /^(?:(\d+)~)?([A-Za-z0-9_-]{1,80})$/.exec(id);
  if (!match) throw new RepliersError(400, "INVALID_SEARCH", "Invalid listing identifier.");
  const url = new URL(`${API_URL}/${encodeURIComponent(match[2]!)}`);
  if (match[1]) url.searchParams.set("boardId", match[1]!);
  const data = await request(url);
  if (!data || typeof data !== "object")
    throw new RepliersError(
      502,
      "INVALID_UPSTREAM_RESPONSE",
      "The MLS provider returned an unexpected listing response.",
    );
  const record = data as Record<string, unknown>;
  const listing = (record["listing"] ?? data) as RepliersListing;
  if (!listing.mlsNumber)
    throw new RepliersError(
      502,
      "INVALID_UPSTREAM_RESPONSE",
      "The MLS provider returned an unexpected listing response.",
    );
  if (!publicListing(listing))
    throw new RepliersError(404, "LISTING_NOT_FOUND", "This listing is not publicly available.");
  return listing;
}

export function errorResponse(error: unknown) {
  const known =
    error instanceof RepliersError
      ? error
      : new RepliersError(500, "UPSTREAM_FAILURE", "Unexpected listing service error.");
  if (!(error instanceof RepliersError))
    logRepliersFailure({ code: known.code, status: known.status });
  const headers = new Headers({ "Cache-Control": "no-store" });
  if (known.retryAfter && /^\d+$/.test(known.retryAfter))
    headers.set("Retry-After", known.retryAfter);
  return Response.json(
    { error: { code: known.code, message: known.message, retryable: known.retryable } },
    { status: known.status, headers },
  );
}
