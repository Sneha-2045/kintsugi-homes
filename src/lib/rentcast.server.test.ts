import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildListingUrl,
  parseRentCastFilters,
  searchRentCast,
  type RentCastFilters,
} from "./rentcast.server.ts";
import { toRentCastComparison } from "./rentcast-property.ts";
import { sanitizeComparisonProperties } from "./property-comparison.ts";

test("requires a city or ZIP and a valid state", () => {
  assert.throws(() => parseRentCastFilters(new URLSearchParams("state=TX")), /city or ZIP code/);
  assert.throws(
    () => parseRentCastFilters(new URLSearchParams("city=Austin&state=XX")),
    /city or ZIP code/,
  );
});

test("builds supported sale and rental searches with validated ranges", () => {
  const sale: RentCastFilters = {
    city: "Austin",
    state: "TX",
    propertyType: "Single Family",
    minPrice: 100_000,
    maxPrice: 500_000,
    bedrooms: 3,
    minSquareFootage: 1200,
    maxSquareFootage: 2400,
    listingType: "sale",
    offset: 0,
  };
  const url = buildListingUrl(sale);
  assert.equal(url.pathname, "/v1/listings/sale");
  assert.equal(url.searchParams.get("price"), "100000:500000");
  assert.equal(url.searchParams.get("squareFootage"), "1200:2400");
  assert.equal(url.searchParams.get("status"), "Active");
  assert.equal(url.searchParams.get("limit"), "20");
  assert.equal(
    buildListingUrl({ ...sale, listingType: "rental" }).pathname,
    "/v1/listings/rental/long-term",
  );
  assert.throws(
    () =>
      parseRentCastFilters(new URLSearchParams("zipCode=78701&state=TX&minPrice=50&maxPrice=20")),
    /Minimum price must not exceed maximum price/,
  );
});

test("keeps the API key server-side and maps actual provider results", async () => {
  const oldKey = process.env["RENTCAST_API_KEY"];
  const oldFetch = globalThis.fetch;
  process.env["RENTCAST_API_KEY"] = "test-secret";
  let seenHeaders: Headers | undefined;
  globalThis.fetch = async (_input, init) => {
    seenHeaders = new Headers(init?.headers);
    return Response.json([{ id: "real-provider-id", price: 325_000 }]);
  };
  try {
    const result = await searchRentCast(new URLSearchParams("city=Austin&state=TX"));
    assert.equal(result.listings[0]?.id, "real-provider-id");
    assert.equal(seenHeaders?.get("X-Api-Key"), "test-secret");
    assert.equal(JSON.stringify(result).includes("test-secret"), false);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey == null) delete process.env["RENTCAST_API_KEY"];
    else process.env["RENTCAST_API_KEY"] = oldKey;
  }
});

test("RentCast listings can be added to the shared comparison safely", () => {
  const property = toRentCastComparison({
    id: "123 Main St, Austin, TX 78701",
    listingType: "sale",
    formattedAddress: "123 Main St, Austin, TX 78701",
    state: "TX",
    price: 425_000,
  });
  const restored = sanitizeComparisonProperties([property]);
  assert.equal(restored.length, 1);
  assert.equal(restored[0]?.source, "rentcast");
  assert.equal(restored[0]?.priceBasis, "rentcast-listing");
});
