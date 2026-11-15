import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calculatePricePerSqft,
  calculateTargetOffer,
  calculateTotalInvestment,
  estimateInvestmentReturn,
  PropertySearchArgs,
} from "./property-service.ts";

test("property search filters validate bounded and well-formed inventory requests", () => {
  assert.equal(
    PropertySearchArgs.parse({ state: "FL", maxPrice: 300_000, bedrooms: 3 }).maxPrice,
    300_000,
  );
  assert.throws(() => PropertySearchArgs.parse({ zipCode: "1234" }));
  assert.throws(() => PropertySearchArgs.parse({ maxPrice: Infinity }));
  assert.throws(() => PropertySearchArgs.parse({ limit: 21 }));
});

test("target offer and price per square foot use the supplied listing values", () => {
  assert.equal(calculateTargetOffer(490_075, 30).targetOffer, 343_052.5);
  assert.equal(calculatePricePerSqft(300_000, 1500).pricePerSqft, 200);
  assert.throws(() => calculatePricePerSqft(300_000, 0));
});

test("investment outputs separate supplied assumptions and make no guarantees", () => {
  const total = calculateTotalInvestment(200_000, 25_000, 3);
  assert.equal(total.estimatedClosingCosts, 6_000);
  assert.equal(total.estimatedTotalInvestment, 231_000);
  assert.equal(
    estimateInvestmentReturn(total.estimatedTotalInvestment, 24_000).estimatedAnnualRoiPercent,
    10.39,
  );
  assert.throws(() => calculateTargetOffer(-1, 30));
  assert.throws(() => estimateInvestmentReturn(0, 100));
});
