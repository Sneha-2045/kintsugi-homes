import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculateComparison,
  DEFAULT_ASSUMPTIONS,
  fromMlsListing,
  removeComparisonSelection,
  sanitizeComparisonProperties,
  toggleComparisonSelection,
  type ComparisonProperty,
  type InvestmentAssumptions,
} from "./property-comparison.ts";

const base: ComparisonProperty = {
  key: "us:test-1",
  source: "us",
  sourceLabel: "US listing",
  name: "Test home",
  price: 100_000,
  priceBasis: "auction-listed",
  currency: "USD",
  category: "Foreclosure Sale",
  marketValue: 125_000,
  bedrooms: 2,
  bathrooms: 1,
  areaSqFt: 1_000,
  detailHref: "/property/test-1",
};

test("calculates price per square foot and discount from estimated market value", () => {
  const result = calculateComparison(base, DEFAULT_ASSUMPTIONS);
  assert.equal(result.pricePerSqFt, 100);
  assert.equal(result.discountPercent, 20);
  assert.equal(
    calculateComparison({ ...base, source: "us", category: "Tax Lien" }, DEFAULT_ASSUMPTIONS)
      .discountPercent,
    undefined,
  );
});

test("calculates yield and monthly cash flow only when all cost assumptions are supplied", () => {
  const assumptions: InvestmentAssumptions = {
    monthlyRent: "1200",
    downPaymentPercent: "20",
    annualInterestRate: "0",
    loanTermYears: "30",
    annualPropertyTax: "1200",
    annualInsurance: "600",
    monthlyMaintenance: "100",
    vacancyPercent: "0",
    monthlyHoa: "50",
    renovationBudget: "5000",
  };
  const result = calculateComparison(base, assumptions);
  assert.equal(result.annualRent, 14_400);
  assert.ok(Math.abs((result.grossYield ?? 0) - 14.4) < 0.001);
  assert.equal(result.annualOperatingExpenses, 3_600);
  assert.ok(Math.abs((result.monthlyCashFlow ?? 0) - 677.7777777778) < 0.01);
  assert.equal(calculateComparison(base, DEFAULT_ASSUMPTIONS).monthlyCashFlow, undefined);
});

test("normalizes MLS identifiers, listing details and image paths without inventing source URLs", () => {
  const property = fromMlsListing({
    boardId: 7,
    mlsNumber: "ABC123",
    listPrice: 250_000,
    address: {
      streetNumber: "8",
      streetName: "Main",
      streetSuffix: "St",
      city: "Austin",
      state: "TX",
      zip: "78701",
    },
    details: { numBedrooms: 3, numBathrooms: 2, sqft: 1450 },
    images: ["sample/photo.jpg"],
  });
  assert.equal(property.key, "mls:7:ABC123");
  assert.equal(property.detailHref, "/properties/7~ABC123");
  assert.equal(property.image, "https://cdn.repliers.io/sample/photo.jpg?class=medium");
  assert.equal(property.price, 250_000);
  assert.equal(property.sourceUrl, undefined);
});

test("enforces four selections, avoids duplicates, removes individual entries and validates restored data", () => {
  const properties = Array.from({ length: 5 }, (_, index) => ({
    ...base,
    key: `us:${index}`,
    name: `Home ${index}`,
  }));
  let selected = properties.slice(0, 4);
  selected = toggleComparisonSelection(selected, properties[0]!);
  assert.equal(selected.length, 3);
  selected = toggleComparisonSelection(selected, properties[0]!);
  assert.equal(selected.length, 4);
  assert.equal(toggleComparisonSelection(selected, properties[4]!).length, 4);
  assert.equal(removeComparisonSelection(selected, properties[2]!.key).length, 3);
  assert.equal(sanitizeComparisonProperties([...selected, { key: "invalid" }]).length, 4);
  const restored = sanitizeComparisonProperties([{ ...base, sourceUrl: "javascript:alert(1)" }]);
  assert.equal(restored[0]?.sourceUrl, undefined);
});
