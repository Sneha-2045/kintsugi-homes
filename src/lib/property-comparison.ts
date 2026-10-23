import type { Property } from "@/types/property";

export type ComparisonSource = "us" | "japan" | "mls";
export type PriceBasis =
  "mls-asking" | "auction-listed" | "tranchi-reported" | "source-reported" | "japan-listed";

export type ComparisonProperty = {
  key: string;
  source: ComparisonSource;
  sourceLabel: string;
  name: string;
  address?: string | undefined;
  city?: string | undefined;
  state?: string | undefined;
  zipCode?: string | undefined;
  image?: string | undefined;
  price?: number | undefined;
  priceBasis: PriceBasis;
  currency: "USD" | "JPY";
  marketValue?: number | undefined;
  appraisedValue?: number | undefined;
  bedrooms?: number | undefined;
  bathrooms?: number | undefined;
  areaSqFt?: number | undefined;
  lotAreaSqFt?: number | undefined;
  propertyType?: string | undefined;
  category?: string | undefined;
  status?: string | undefined;
  auctionDate?: string | undefined;
  sourceUrl?: string | undefined;
  lastCheckedAt?: string | undefined;
  monthlyRent?: number | undefined;
  reportedMonthlyCashFlow?: number | undefined;
  detailHref: string;
};

export function sanitizeComparisonProperties(value: unknown): ComparisonProperty[] {
  if (!Array.isArray(value)) return [];
  const hasControlCharacter = (value: string) => {
    // eslint-disable-next-line no-control-regex
    return /[\u0000-\u001f]/.test(value);
  };
  const stringValue = (item: Record<string, unknown>, key: string) =>
    typeof item[key] === "string" &&
    item[key].length < 2000 &&
    !hasControlCharacter(item[key] as string)
      ? (item[key] as string)
      : undefined;
  return value
    .flatMap((entry): ComparisonProperty[] => {
      if (!entry || typeof entry !== "object") return [];
      const item = entry as Record<string, unknown>;
      const key = stringValue(item, "key");
      const name = stringValue(item, "name");
      const detailHref = stringValue(item, "detailHref");
      const source = item["source"];
      const currency = item["currency"];
      const priceBasis = item["priceBasis"];
      const price = item["price"];
      if (
        !key ||
        key.length >= 250 ||
        !name ||
        !detailHref ||
        (!detailHref.startsWith("/property/") && !detailHref.startsWith("/properties/")) ||
        !["us", "japan", "mls"].includes(String(source)) ||
        ![
          "mls-asking",
          "auction-listed",
          "tranchi-reported",
          "source-reported",
          "japan-listed",
        ].includes(String(priceBasis)) ||
        (currency !== "USD" && currency !== "JPY") ||
        (price != null && (typeof price !== "number" || !Number.isFinite(price)))
      )
        return [];
      const numberValue = (field: string) =>
        typeof item[field] === "number" && Number.isFinite(item[field])
          ? (item[field] as number)
          : undefined;
      const image = stringValue(item, "image");
      const safeImage =
        image && !/^[a-z][a-z0-9+.-]*:/i.test(image)
          ? image.startsWith("//")
            ? undefined
            : image
          : safeHttpUrl(image);
      return [
        {
          key,
          source: source as ComparisonSource,
          sourceLabel: stringValue(item, "sourceLabel") ?? "Property listing",
          name,
          address: stringValue(item, "address"),
          city: stringValue(item, "city"),
          state: stringValue(item, "state"),
          zipCode: stringValue(item, "zipCode"),
          image: safeImage,
          price: typeof price === "number" ? price : undefined,
          currency,
          priceBasis: priceBasis as PriceBasis,
          marketValue: numberValue("marketValue"),
          appraisedValue: numberValue("appraisedValue"),
          bedrooms: numberValue("bedrooms"),
          bathrooms: numberValue("bathrooms"),
          areaSqFt: numberValue("areaSqFt"),
          lotAreaSqFt: numberValue("lotAreaSqFt"),
          propertyType: stringValue(item, "propertyType"),
          category: stringValue(item, "category"),
          status: stringValue(item, "status"),
          auctionDate: stringValue(item, "auctionDate"),
          sourceUrl: safeHttpUrl(item["sourceUrl"]),
          lastCheckedAt: stringValue(item, "lastCheckedAt"),
          monthlyRent: numberValue("monthlyRent"),
          reportedMonthlyCashFlow: numberValue("reportedMonthlyCashFlow"),
          detailHref,
        },
      ];
    })
    .slice(0, 4);
}

export function toggleComparisonSelection(
  current: ComparisonProperty[],
  property: ComparisonProperty,
) {
  if (current.some((item) => item.key === property.key))
    return current.filter((item) => item.key !== property.key);
  return current.length >= 4 ? current : [...current, property];
}

export function removeComparisonSelection(current: ComparisonProperty[], key: string) {
  return current.filter((item) => item.key !== key);
}

export type InvestmentAssumptions = {
  monthlyRent: string;
  downPaymentPercent: string;
  annualInterestRate: string;
  loanTermYears: string;
  annualPropertyTax: string;
  annualInsurance: string;
  monthlyMaintenance: string;
  vacancyPercent: string;
  monthlyHoa: string;
  renovationBudget: string;
};

export const DEFAULT_ASSUMPTIONS: InvestmentAssumptions = {
  monthlyRent: "",
  downPaymentPercent: "",
  annualInterestRate: "",
  loanTermYears: "",
  annualPropertyTax: "",
  annualInsurance: "",
  monthlyMaintenance: "",
  vacancyPercent: "",
  monthlyHoa: "",
  renovationBudget: "",
};

const finitePositive = (value: unknown): number | undefined => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : undefined;
};
const finiteNumber = (value: unknown): number | undefined => {
  if (value == null || value === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};
const optionalNonNegative = (value: string): number | undefined => {
  if (value.trim() === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
};
const safeHttpUrl = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
};

export function fromProperty(property: Property): ComparisonProperty {
  const isMls = property.sourceDetails?.["sourceProvider"] === "Repliers";
  const isUs =
    ["texas", "georgia", "us"].includes(property.regionSlug) ||
    property.isTranchi === true ||
    isMls;
  const address = property.address ?? property.title;
  const sourceUrl = safeHttpUrl(property.sourceUrl);
  const provider = sourceUrl ? new URL(sourceUrl).hostname.replace(/^www\./i, "") : undefined;
  return {
    key: `${isMls ? "mls" : property.isTranchi ? "tranchi" : isUs ? "us" : "japan"}:${property.sourcePropertyId ?? property.id}`,
    source: isMls ? "mls" : isUs ? "us" : "japan",
    sourceLabel: isMls
      ? "Repliers MLS"
      : property.isTranchi
        ? "Tranchi AI"
        : (provider ?? (isUs ? "US listing" : "Japan listing")),
    name: property.title,
    address,
    city: property.city,
    state: property.state ?? property.prefecture,
    zipCode: property.zipCode,
    image: property.images[0],
    price: finitePositive(property.priceJpy ?? property.priceUsd),
    priceBasis: isMls
      ? "mls-asking"
      : property.isTranchi
        ? "tranchi-reported"
        : isUs
          ? property.auctionDate || property.sourceUrl?.includes("auction.com")
            ? "auction-listed"
            : "source-reported"
          : "japan-listed",
    currency: property.priceJpy != null ? "JPY" : "USD",
    marketValue: finitePositive(property.estimatedMarketValue),
    appraisedValue: finitePositive(property.estimatedAppraisedValue),
    bedrooms: finitePositive(property.bedrooms),
    bathrooms: finitePositive(property.bathrooms),
    areaSqFt:
      finitePositive(property.floorArea) == null
        ? undefined
        : property.priceJpy != null
          ? property.floorArea! * 10.7639
          : property.floorArea,
    lotAreaSqFt:
      finitePositive(property.landArea) == null
        ? undefined
        : property.priceJpy != null
          ? property.landArea! * 10.7639
          : property.landArea,
    propertyType: property.propertyType,
    category: property.dealCategory ?? property.tags[0],
    status: property.status,
    auctionDate: property.auctionDate,
    sourceUrl,
    lastCheckedAt: property.lastCheckedAt ?? property.sourceDetails?.["lastFreshnessCheck"],
    monthlyRent: finitePositive(property.monthlyRentEstimate),
    reportedMonthlyCashFlow: finiteNumber(property.monthlyCashFlowEstimate),
    detailHref: isMls
      ? `/properties/${encodeURIComponent(property.sourceDetails?.["repliersId"] ?? property.id)}`
      : `/property/${encodeURIComponent(property.id)}`,
  };
}

type MlsComparisonInput = {
  address?: unknown;
  details?: unknown;
  images?: unknown;
  mlsNumber?: string | number;
  id?: string | number;
  boardId?: string | number;
  city?: string;
  listPrice?: unknown;
  price?: unknown;
  status?: string;
  sourceUrl?: string;
};

export function fromMlsListing(listing: MlsComparisonInput): ComparisonProperty {
  const address = (
    listing.address && typeof listing.address === "object" ? listing.address : {}
  ) as Record<string, unknown>;
  const details = (
    listing.details && typeof listing.details === "object" ? listing.details : {}
  ) as Record<string, unknown>;
  const photos = Array.isArray(listing.images) ? listing.images : [];
  const first = photos[0];
  const rawImage =
    typeof first === "string"
      ? first
      : first && typeof first === "object"
        ? ((first as Record<string, unknown>)["url"] ?? (first as Record<string, unknown>)["path"])
        : undefined;
  const mls = String(listing.mlsNumber ?? listing.id ?? "");
  const boardId = listing.boardId;
  const image =
    typeof rawImage === "string"
      ? /^https?:\/\//i.test(rawImage)
        ? rawImage
        : `https://cdn.repliers.io/${rawImage.replace(/^\/+/, "")}?class=medium`
      : undefined;
  const value = (key: string) =>
    typeof address[key] === "string" ? (address[key] as string) : undefined;
  const addr = [value("streetNumber"), value("streetName"), value("streetSuffix")]
    .filter(Boolean)
    .join(" ");
  return {
    key: `mls:${String(boardId ?? "")}:${mls}`,
    source: "mls",
    sourceLabel: "Repliers MLS",
    name: addr || "MLS listing",
    address: addr || undefined,
    city: value("city") ?? (typeof listing.city === "string" ? listing.city : undefined),
    state: value("state"),
    zipCode: value("zip"),
    image,
    price: finitePositive(listing.listPrice ?? listing.price),
    priceBasis: "mls-asking",
    currency: "USD",
    bedrooms: finitePositive(details["numBedrooms"]),
    bathrooms: finitePositive(details["numBathrooms"]),
    areaSqFt: finitePositive(details["sqft"]),
    propertyType: typeof details["propertyType"] === "string" ? details["propertyType"] : undefined,
    status: typeof listing.status === "string" ? listing.status : undefined,
    sourceUrl: safeHttpUrl(listing.sourceUrl),
    detailHref: `/properties/${encodeURIComponent(boardId ? `${boardId}~${mls}` : mls)}`,
  };
}

export function parseAssumptions(value: unknown): InvestmentAssumptions {
  if (!value || typeof value !== "object") return DEFAULT_ASSUMPTIONS;
  const record = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.keys(DEFAULT_ASSUMPTIONS).map((key) => [
      key,
      typeof record[key] === "string" && record[key].length < 30
        ? record[key]
        : DEFAULT_ASSUMPTIONS[key as keyof InvestmentAssumptions],
    ]),
  ) as InvestmentAssumptions;
}

export function calculateComparison(
  property: ComparisonProperty,
  assumptions: InvestmentAssumptions,
) {
  const area = property.areaSqFt;
  const price = property.price;
  const monthlyRent =
    property.currency === "USD"
      ? (finitePositive(assumptions.monthlyRent) ?? property.monthlyRent)
      : undefined;
  const downPercent = optionalNonNegative(assumptions.downPaymentPercent);
  const annualRate = optionalNonNegative(assumptions.annualInterestRate);
  const years = optionalNonNegative(assumptions.loanTermYears);
  const renovationBudget = optionalNonNegative(assumptions.renovationBudget);
  const vacancy = optionalNonNegative(assumptions.vacancyPercent);
  const downValid = downPercent != null && downPercent < 100;
  const loanInputsValid =
    annualRate != null &&
    annualRate <= 100 &&
    years != null &&
    Number.isInteger(years) &&
    years > 0 &&
    years <= 50;
  const taxes = optionalNonNegative(assumptions.annualPropertyTax);
  const insurance = optionalNonNegative(assumptions.annualInsurance);
  const maintenance = optionalNonNegative(assumptions.monthlyMaintenance);
  const hoa = optionalNonNegative(assumptions.monthlyHoa);
  const vacancyValid = vacancy != null && vacancy < 100;
  const operatingInputsValid =
    taxes != null && insurance != null && maintenance != null && hoa != null;
  const monthlyPitiExpenses =
    taxes != null && insurance != null && maintenance != null && hoa != null
      ? (taxes + insurance) / 12 + maintenance + hoa
      : undefined;
  const pricePerSqFt = price != null && area != null && area > 0 ? price / area : undefined;
  const discountComparable =
    property.source === "us" &&
    property.category?.toLowerCase().includes("foreclosure") === true &&
    property.marketValue != null &&
    price != null &&
    property.currency === "USD";
  const discountPercent =
    discountComparable && property.marketValue! > 0
      ? ((property.marketValue! - price!) / property.marketValue!) * 100
      : undefined;
  const annualRent = monthlyRent != null ? monthlyRent * 12 : undefined;
  const grossYield =
    annualRent != null && price != null && price > 0 && property.currency === "USD"
      ? (annualRent / price) * 100
      : undefined;
  let annualDebt = 0;
  if (price != null && property.currency === "USD" && downValid && loanInputsValid) {
    const principal = price * (1 - downPercent! / 100);
    const periods = years * 12;
    const rate = annualRate! / 1200;
    const monthlyPayment =
      rate === 0 ? principal / periods : (principal * rate) / (1 - Math.pow(1 + rate, -periods));
    annualDebt = monthlyPayment * 12;
  }
  const estimatedInitialCash =
    price != null && property.currency === "USD" && downValid
      ? price * (downPercent! / 100) + (renovationBudget ?? 0)
      : undefined;
  const monthlyCashFlow =
    annualRent != null &&
    vacancyValid &&
    operatingInputsValid &&
    price != null &&
    downValid &&
    loanInputsValid
      ? (annualRent * (1 - vacancy! / 100) - monthlyPitiExpenses! * 12 - annualDebt) / 12
      : undefined;
  const annualOperatingExpenses =
    annualRent != null && vacancyValid && operatingInputsValid
      ? (annualRent * vacancy!) / 100 + monthlyPitiExpenses! * 12
      : undefined;
  return {
    pricePerSqFt,
    discountPercent,
    annualRent,
    grossYield,
    annualOperatingExpenses,
    monthlyCashFlow,
    monthlyRent,
    annualDebt,
    estimatedInitialCash,
    operatingInputsValid,
  };
}
