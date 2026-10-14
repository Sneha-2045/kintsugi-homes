const API_URL = "https://api.repliers.io/listings";

export type RepliersListing = Record<string, any> & {
  mlsNumber: string;
  permissions?: Record<string, string>;
};

export class RepliersError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function key() {
  const value = process.env["REPLIERS_API_KEY"];
  if (!value) throw new RepliersError(503, "MLS search is not configured yet.");
  return value;
}

async function request(url: URL) {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "REPLIERS-API-KEY": key(), Accept: "application/json" },
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    throw new RepliersError(502, "The listing service could not be reached. Please try again.");
  }
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new RepliersError(502, "The MLS service rejected the configured credentials.");
    }
    if (response.status === 429) throw new RepliersError(429, "Too many searches. Please try again shortly.");
    throw new RepliersError(response.status >= 500 ? 502 : response.status, "The listing service could not complete that request.");
  }
  return response.json() as Promise<Record<string, any>>;
}

function publicListing(item: RepliersListing) {
  const permissions = item.permissions;
  // Search requests ask Repliers to return only public, internet-displayable
  // listings. Some feeds omit the permissions object; reject explicit denials
  // here while relying on the upstream filters when the object is absent.
  if (!permissions) return true;
  if (permissions.displayInternetEntireListing === "N" || permissions.displayPublic === "N") return false;
  return true;
}

export function filterPublicListings(data: Record<string, any>) {
  return { ...data, listings: (Array.isArray(data.listings) ? data.listings : []).filter(publicListing) };
}

export async function searchListings(params: URLSearchParams) {
  const allowed = ["city", "zip", "neighborhood", "type", "minPrice", "maxPrice", "propertyType", "minBedrooms", "minBaths", "minSqft", "maxSqft", "sortBy"];
  const url = new URL(API_URL);
  for (const name of allowed) {
    const value = params.get(name)?.trim();
    if (!value) continue;
    if (value.length > 100 || /[<>]/.test(value)) throw new RepliersError(400, `Invalid ${name} filter.`);
    url.searchParams.set(name, value);
  }
  for (const name of ["minPrice", "maxPrice", "minBedrooms", "minBaths", "minSqft", "maxSqft"]) {
    const value = params.get(name);
    if (value != null && (!/^\d+(\.\d+)?$/.test(value) || Number(value) < 0 || Number(value) > 1000000000)) {
      throw new RepliersError(400, `Invalid ${name} filter.`);
    }
  }
  if (Number(params.get("minPrice") ?? 0) > Number(params.get("maxPrice") ?? Number.MAX_SAFE_INTEGER)) throw new RepliersError(400, "Minimum price must not exceed maximum price.");
  if (Number(params.get("minSqft") ?? 0) > Number(params.get("maxSqft") ?? Number.MAX_SAFE_INTEGER)) throw new RepliersError(400, "Minimum square footage must not exceed maximum square footage.");
  if (params.get("type") && !["sale", "lease"].includes(params.get("type")!)) throw new RepliersError(400, "Listing type must be sale or lease.");
  const pageNum = Number(params.get("pageNum") ?? 1);
  const resultsPerPage = Number(params.get("resultsPerPage") ?? 24);
  if (!Number.isInteger(pageNum) || pageNum < 1 || pageNum > 10000) throw new RepliersError(400, "Invalid page number.");
  if (!Number.isInteger(resultsPerPage) || resultsPerPage < 1 || resultsPerPage > 48) throw new RepliersError(400, "Invalid page size.");
  url.searchParams.set("pageNum", String(pageNum));
  url.searchParams.set("resultsPerPage", String(resultsPerPage));
  url.searchParams.set("status", "A");
  url.searchParams.set("displayInternetEntireListing", "Y");
  url.searchParams.set("displayPublic", "Y");
  return filterPublicListings(await request(url));
}

export async function getListing(id: string) {
  const match = /^(?:(\d+)~)?([A-Za-z0-9_-]{1,80})$/.exec(id);
  if (!match) throw new RepliersError(400, "Invalid listing identifier.");
  const url = new URL(`${API_URL}/${encodeURIComponent(match[2])}`);
  if (match[1]) url.searchParams.set("boardId", match[1]);
  const data = await request(url);
  const listing = (data.listing ?? data) as RepliersListing;
  if (!publicListing(listing)) throw new RepliersError(404, "This listing is not publicly available.");
  return listing;
}

export function errorResponse(error: unknown) {
  const known = error instanceof RepliersError ? error : new RepliersError(500, "Unexpected listing service error.");
  return Response.json({ error: known.message }, { status: known.status, headers: { "Cache-Control": "no-store" } });
}
