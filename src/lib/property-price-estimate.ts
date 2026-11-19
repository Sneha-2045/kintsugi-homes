export type PriceSignal = {
  price?: unknown;
  marketValue?: unknown;
  appraisedValue?: unknown;
  region?: string | undefined;
  city?: string | undefined;
  area?: unknown;
  bedrooms?: unknown;
};

export type PriceEstimate = {
  amount: number;
  basis: "appraisal" | "market-value" | "local-comparables" | "regional-comparables";
};

function positiveNumber(value: unknown): number | undefined {
  const amount = typeof value === "string" ? Number(value.replaceAll(",", "")) : value;
  return typeof amount === "number" && Number.isFinite(amount) && amount > 0 ? amount : undefined;
}

function normalized(value: string | undefined) {
  return value?.trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ");
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

function roundEstimate(amount: number) {
  const increment =
    amount >= 1_000_000 ? 10_000 : amount >= 100_000 ? 5_000 : amount >= 10_000 ? 1_000 : 100;
  return Math.max(increment, Math.round(amount / increment) * increment);
}

/** Estimate only for display; source prices stay the authoritative value for filters and sorting. */
export function estimateMissingPrice(
  subject: PriceSignal,
  comparables: PriceSignal[],
): PriceEstimate | undefined {
  if (positiveNumber(subject.price)) return undefined;

  const appraised = positiveNumber(subject.appraisedValue);
  if (appraised) return { amount: roundEstimate(appraised), basis: "appraisal" };
  const marketValue = positiveNumber(subject.marketValue);
  if (marketValue) return { amount: roundEstimate(marketValue), basis: "market-value" };

  const region = normalized(subject.region);
  if (!region) return undefined;
  const regional = comparables.filter(
    (item) => normalized(item.region) === region && Boolean(positiveNumber(item.price)),
  );
  if (regional.length < 2) return undefined;

  const city = normalized(subject.city);
  const local = city ? regional.filter((item) => normalized(item.city) === city) : [];
  const pool = local.length >= 2 ? local : regional;
  const basis = local.length >= 2 ? "local-comparables" : "regional-comparables";
  const targetArea = positiveNumber(subject.area);
  const targetBedrooms = positiveNumber(subject.bedrooms);

  if (targetArea) {
    const sizeComps = pool.filter((item) => {
      const area = positiveNumber(item.area);
      if (!area || area < targetArea * 0.45 || area > targetArea * 2.2) return false;
      const bedrooms = positiveNumber(item.bedrooms);
      return !targetBedrooms || !bedrooms || Math.abs(bedrooms - targetBedrooms) <= 2;
    });
    if (sizeComps.length >= 2) {
      const unitValues = sizeComps.flatMap((item) => {
        const price = positiveNumber(item.price);
        const area = positiveNumber(item.area);
        return price && area ? [price / area] : [];
      });
      if (unitValues.length >= 2) {
        const estimate = median(unitValues) * targetArea;
        if (Number.isFinite(estimate)) return { amount: roundEstimate(estimate), basis };
      }
    }
  }

  if (targetBedrooms) {
    const bedroomComps = pool.filter((item) => {
      const bedrooms = positiveNumber(item.bedrooms);
      return !bedrooms || Math.abs(bedrooms - targetBedrooms) <= 1;
    });
    const prices = bedroomComps.flatMap((item) => {
      const price = positiveNumber(item.price);
      return price ? [price] : [];
    });
    if (prices.length >= 2) return { amount: roundEstimate(median(prices)), basis };
  }

  const regionalPrices = pool.flatMap((item) => {
    const price = positiveNumber(item.price);
    return price ? [price] : [];
  });
  return regionalPrices.length >= 2
    ? { amount: roundEstimate(median(regionalPrices)), basis }
    : undefined;
}

export function estimateBasisLabel(basis: PriceEstimate["basis"]) {
  switch (basis) {
    case "appraisal":
      return "Estimated appraised value";
    case "market-value":
      return "Estimated market value";
    case "local-comparables":
      return "Estimate from local comparables";
    case "regional-comparables":
      return "Estimate from regional listings";
  }
}
