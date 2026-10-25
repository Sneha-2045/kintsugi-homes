import assert from "node:assert/strict";
import test from "node:test";
import {
  changedListingFields,
  listingEventKey,
  matchesSavedSearch,
  type MatchListing,
} from "./saved-search-matching.ts";

const listing: MatchListing = {
  source: "repliers",
  id: "board-1~abc123",
  title: "Ranch home",
  address: "10 Main Street",
  city: "Houston",
  state: "TX",
  price: 185000,
  status: "A",
  image: null,
  url: "/properties/abc123",
  bedrooms: 3,
  bathrooms: 2,
  size: 1400,
  actualPrice: true,
  auctionDate: null,
};

test("matches location, price and bedroom filters", () => {
  assert.equal(
    matchesSavedSearch(listing, { city: "hou", state: "TX", maxPrice: "200000", minBedrooms: "3" }),
    true,
  );
  assert.equal(matchesSavedSearch(listing, { city: "Dallas" }), false);
  assert.equal(matchesSavedSearch(listing, { maxPrice: "150000" }), false);
  assert.equal(matchesSavedSearch(listing, { minBedrooms: "4" }), false);
});

test("does not emit a price event for estimated or missing prices", () => {
  assert.deepEqual(changedListingFields({ price: 180000 }, { ...listing, price: 185000 }), [
    { type: "price_changed", oldValue: 180000, newValue: 185000 },
  ]);
  assert.deepEqual(
    changedListingFields({ price: 180000 }, { ...listing, actualPrice: false, price: 185000 }),
    [],
  );
  assert.deepEqual(changedListingFields({ price: null }, { ...listing, price: 185000 }), []);
});

test("reports meaningful status and auction changes with stable event keys", () => {
  const changes = changedListingFields(
    { status: "A", auctionDate: "2026-11-01" },
    { ...listing, status: "U", auctionDate: "2026-11-02" },
  );
  assert.deepEqual(changes, [
    { type: "status_changed", oldValue: "A", newValue: "U" },
    { type: "auction_changed", oldValue: "2026-11-01", newValue: "2026-11-02" },
  ]);
  assert.equal(
    listingEventKey("search", "mls", "listing", "new"),
    listingEventKey("search", "mls", "listing", "new"),
  );
  assert.notEqual(
    listingEventKey("search", "mls", "listing", "price_changed", 100, 200),
    listingEventKey("search", "mls", "listing", "price_changed", 100, 300),
  );
});
