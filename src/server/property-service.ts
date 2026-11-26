import { createHash } from "node:crypto";
import { Types } from "mongoose";
import { z } from "zod";
import { connectMongo } from "./mongo.ts";
import {
  Favorite,
  PropertyModel,
  SavedSearchEvent,
  SavedSearchMatch,
  SearchCache,
} from "./models.ts";

export const PropertySearchArgs = z.object({
  city: z.string().trim().min(1).max(80).optional(),
  state: z.string().trim().min(2).max(30).optional(),
  zipCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/)
    .optional(),
  minPrice: z.number().finite().min(0).max(100_000_000).optional(),
  maxPrice: z.number().finite().min(0).max(100_000_000).optional(),
  bedrooms: z.number().int().min(0).max(20).optional(),
  bathrooms: z.number().finite().min(0).max(20).optional(),
  minArea: z.number().finite().min(0).max(2_000_000).optional(),
  minLandArea: z.number().finite().min(0).max(10_000_000).optional(),
  propertyType: z.string().trim().min(1).max(60).optional(),
  foreclosureStatus: z.string().trim().min(1).max(80).optional(),
  q: z.string().trim().min(1).max(120).optional(),
  auctionOnly: z.boolean().optional(),
  limit: z.number().int().min(1).max(20).optional(),
  offset: z.number().int().min(0).max(50_000).optional(),
  sortBy: z.enum(["price", "auctionDate", "bedrooms", "area", "updatedAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});
export type PropertySearchArgs = z.infer<typeof PropertySearchArgs>;

type PropertyRecord = {
  _id: unknown;
  sourceListingId: string;
  title: string;
  price?: number | null;
  currency?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  buildingArea?: number;
  landArea?: number;
  auctionDate?: Date | string;
  status?: string;
  foreclosureStatus?: string;
  description?: string;
  images?: Array<string | { url?: string }>;
  source?: string;
  sourceUrl?: string;
  latitude?: number;
  longitude?: number;
  geoPoint?: { coordinates?: unknown };
  lastCheckedAt?: Date | string;
  metadata?: { foreclosureStatus?: string };
};

function finiteCoordinate(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function propertyDto(property: PropertyRecord) {
  const coordinates = Array.isArray(property.geoPoint?.coordinates)
    ? property.geoPoint.coordinates
    : [property.longitude, property.latitude];
  return {
    id: String(property._id),
    sourceId: property.sourceListingId,
    title: property.title,
    price: property.price ?? null,
    currency: property.currency ?? "USD",
    address: property.address ?? null,
    city: property.city ?? null,
    state: property.state ?? null,
    zipCode: property.postalCode ?? null,
    location: [property.city, property.state, property.postalCode].filter(Boolean).join(", "),
    propertyType: property.propertyType ?? null,
    bedrooms: property.bedrooms ?? null,
    bathrooms: property.bathrooms ?? null,
    areaSqft: property.buildingArea ?? null,
    landArea: property.landArea ?? null,
    auctionDate: property.auctionDate
      ? new Date(property.auctionDate).toISOString().slice(0, 10)
      : null,
    status: property.status ?? null,
    foreclosureStatus: property.foreclosureStatus ?? property.metadata?.foreclosureStatus ?? null,
    description: String(property.description ?? "").slice(0, 5000),
    images: (property.images ?? [])
      .map((image) => (typeof image === "string" ? image : image.url))
      .filter((image): image is string => typeof image === "string" && image.length > 0)
      .slice(0, 5),
    source: property.source,
    sourceUrl: property.sourceUrl ?? null,
    latitude: finiteCoordinate(coordinates[1]),
    longitude: finiteCoordinate(coordinates[0]),
    lastCheckedAt: property.lastCheckedAt ?? null,
  };
}

function getQuery(args: PropertySearchArgs) {
  if (args.minPrice !== undefined && args.maxPrice !== undefined && args.minPrice > args.maxPrice)
    throw new Error("Minimum price cannot exceed maximum price.");
  const query: Record<string, unknown> = {
    country: "United States",
    status: { $in: ["published", "active"] },
  };
  if (args.city) query["city"] = args.city;
  if (args.state) query["state"] = { $in: stateAliases(args.state) };
  if (args.zipCode) query["postalCode"] = args.zipCode;
  if (args.propertyType) query["propertyType"] = args.propertyType;
  if (args.foreclosureStatus) query["foreclosureStatus"] = args.foreclosureStatus;
  if (args.q) query["$text"] = { $search: args.q };
  if (args.minPrice !== undefined || args.maxPrice !== undefined) {
    query["price"] = {
      ...(args.minPrice !== undefined ? { $gte: args.minPrice } : {}),
      ...(args.maxPrice !== undefined ? { $lte: args.maxPrice } : {}),
    };
  }
  if (args.bedrooms !== undefined) query["bedrooms"] = { $gte: args.bedrooms };
  if (args.bathrooms !== undefined) query["bathrooms"] = { $gte: args.bathrooms };
  if (args.minArea !== undefined) query["buildingArea"] = { $gte: args.minArea };
  if (args.minLandArea !== undefined) query["landArea"] = { $gte: args.minLandArea };
  if (args.auctionOnly)
    query["auctionDate"] = { $gte: new Date(new Date().toISOString().slice(0, 10)) };
  return query;
}

const IntelligenceQuery = z
  .object({
    west: z.number().finite().min(-180).max(180),
    south: z.number().finite().min(-90).max(90),
    east: z.number().finite().min(-180).max(180),
    north: z.number().finite().min(-90).max(90),
    minPrice: z.number().finite().min(0).max(100_000_000).optional(),
    maxPrice: z.number().finite().min(0).max(100_000_000).optional(),
    propertyType: z.string().trim().min(1).max(60).optional(),
    q: z.string().trim().max(120).optional(),
    limit: z.number().int().min(1).max(5000).default(1200),
    offset: z.number().int().min(0).max(50000).default(0),
  })
  .refine((value) => value.south < value.north, {
    message: "Map bounds must have south below north.",
  })
  .refine(
    (value) =>
      value.minPrice === undefined ||
      value.maxPrice === undefined ||
      value.minPrice <= value.maxPrice,
    { message: "Minimum price cannot exceed maximum price." },
  );

export type IntelligenceQuery = z.input<typeof IntelligenceQuery>;

const IntelligencePageArgs = z.object({
  cursor: z
    .string()
    .regex(/^[a-f\d]{24}$/i)
    .optional(),
  pageSize: z.number().int().min(1).max(1000).default(500),
});

/** Lightweight, cursor-paginated US inventory for the map and listings panel. */
export async function getIntelligenceInventoryPage(input: unknown) {
  const args = IntelligencePageArgs.parse(input);
  await connectMongo();
  const query: Record<string, unknown> = {
    country: "United States",
    status: { $ne: "draft" },
  };
  if (args.cursor) query["_id"] = { $gt: new Types.ObjectId(args.cursor) };

  const projection = [
    "_id",
    "sourceListingId",
    "legacyId",
    "title",
    "price",
    "currency",
    "country",
    "state",
    "city",
    "address",
    "postalCode",
    "location",
    "latitude",
    "longitude",
    "geoPoint",
    "propertyType",
    "foreclosureStatus",
    "listingType",
    "bedrooms",
    "bathrooms",
    "status",
    "auctionDate",
    "lastCheckedAt",
    "source",
    "sourceUrl",
    "images",
    "createdAt",
    "updatedAt",
    "metadata.previousPrice",
    "metadata.listedAt",
    "metadata.dealCategory",
    "metadata.tags",
    "metadata.isInvestment",
  ].join(" ");
  const [total, records] = await Promise.all([
    PropertyModel.countDocuments({ country: "United States", status: { $ne: "draft" } }),
    PropertyModel.find(query)
      .select(projection)
      .sort({ _id: 1 })
      .limit(args.pageSize + 1)
      .lean(),
  ]);
  const hasMore = records.length > args.pageSize;
  if (hasMore) records.pop();
  const properties = records.map((record) => {
    const metadata = (record.metadata ?? {}) as Record<string, unknown>;
    const geoCoordinates = Array.isArray(record.geoPoint?.coordinates)
      ? record.geoPoint.coordinates
      : [];
    const geoLongitude = geoCoordinates[0];
    const geoLatitude = geoCoordinates[1];
    const storedLatValid =
      typeof record.latitude === "number" && record.latitude >= -90 && record.latitude <= 90;
    const storedLngValid =
      typeof record.longitude === "number" && record.longitude >= -180 && record.longitude <= 180;
    const geoLatValid = typeof geoLatitude === "number" && geoLatitude >= -90 && geoLatitude <= 90;
    const geoLngValid =
      typeof geoLongitude === "number" && geoLongitude >= -180 && geoLongitude <= 180;
    const latitude =
      storedLatValid && storedLngValid
        ? record.latitude
        : geoLatValid && geoLngValid
          ? geoLatitude
          : null;
    const longitude =
      storedLatValid && storedLngValid
        ? record.longitude
        : geoLatValid && geoLngValid
          ? geoLongitude
          : null;
    return {
      id: String(record._id),
      sourceId: record.sourceListingId,
      legacyId: record.legacyId ?? null,
      title: record.title,
      price: record.price ?? null,
      currency: record.currency ?? "USD",
      country: record.country,
      state: record.state ?? null,
      city: record.city ?? null,
      address: record.address ?? null,
      zipCode: record.postalCode ?? null,
      location: record.location ?? null,
      latitude: typeof latitude === "number" && Number.isFinite(latitude) ? latitude : null,
      longitude: typeof longitude === "number" && Number.isFinite(longitude) ? longitude : null,
      propertyType: record.propertyType ?? null,
      foreclosureStatus: record.foreclosureStatus ?? null,
      listingType: record.listingType ?? null,
      bedrooms: record.bedrooms ?? null,
      bathrooms: record.bathrooms ?? null,
      status: record.status ?? null,
      auctionDate: record.auctionDate ?? null,
      lastCheckedAt: record.lastCheckedAt ?? null,
      source: record.source ?? null,
      sourceUrl: record.sourceUrl ?? null,
      images: (record.images ?? [])
        .map((image: { url?: string; path?: string }) => image.url ?? image.path)
        .filter(Boolean),
      dealCategory: metadata["dealCategory"] ?? null,
      tags: Array.isArray(metadata["tags"]) ? metadata["tags"] : [],
      isInvestment: metadata["isInvestment"] === true,
      createdAt: metadata["listedAt"] ?? null,
      updatedAt: record.updatedAt ?? null,
      recordCreatedAt: record.createdAt ?? null,
      previousPrice:
        typeof metadata["previousPrice"] === "number" ? metadata["previousPrice"] : null,
      geocodingStatus: record.geocoding?.status ?? null,
      geocodingPrecision: record.geocoding?.precision ?? null,
    };
  });
  const geolocated = properties.reduce(
    (count, property) => count + (property.latitude != null && property.longitude != null ? 1 : 0),
    0,
  );
  return {
    properties,
    total,
    geolocatedInPage: geolocated,
    nextCursor: hasMore ? String(records[records.length - 1]?._id ?? "") : null,
    fetchedAt: new Date().toISOString(),
  };
}

/** Full MongoDB record for the selected map marker. */
export async function getIntelligencePropertyDetail(id: string) {
  if (typeof id !== "string" || id.length < 1 || id.length > 120)
    throw new Error("Enter a valid property ID.");
  await connectMongo();
  const clauses: Record<string, unknown>[] = [{ legacyId: id }, { sourceListingId: id }];
  if (/^[a-f\d]{24}$/i.test(id)) clauses.push({ _id: new Types.ObjectId(id) });
  const property = await PropertyModel.findOne({
    $or: clauses,
    country: "United States",
    status: { $ne: "draft" },
  }).lean();
  if (!property) return null;
  const metadata = (property.metadata ?? {}) as Record<string, unknown>;
  const coordinates = Array.isArray(property.geoPoint?.coordinates)
    ? property.geoPoint.coordinates
    : [];
  const [matches, events] = await Promise.all([
    SavedSearchMatch.find({ source: property.source, listingId: property.sourceListingId })
      .select("firstSeenAt lastSeenAt updatedAt")
      .sort({ lastSeenAt: -1 })
      .limit(20)
      .lean(),
    SavedSearchEvent.find({ source: property.source, listingId: property.sourceListingId })
      .select("eventType createdAt previousValue currentValue")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
  ]);
  return {
    id: String(property._id),
    sourceId: property.sourceListingId,
    title: property.title,
    address: property.address ?? null,
    city: property.city ?? null,
    state: property.state ?? null,
    zipCode: property.postalCode ?? null,
    country: property.country,
    location: property.location ?? null,
    propertyType: property.propertyType ?? null,
    status: property.status ?? null,
    price: property.price ?? null,
    currency: property.currency ?? "USD",
    bedrooms: property.bedrooms ?? null,
    bathrooms: property.bathrooms ?? null,
    buildingArea: property.buildingArea ?? null,
    landArea: property.landArea ?? null,
    yearBuilt: property.yearBuilt ?? null,
    description: property.description ?? null,
    features: property.features ?? [],
    nearbyPlaces: property.nearbyPlaces ?? [],
    amenities: Array.isArray(metadata["amenities"]) ? metadata["amenities"] : [],
    garage: metadata["garage"] ?? null,
    parking: metadata["parking"] ?? null,
    condition: metadata["condition"] ?? metadata["propertyCondition"] ?? null,
    construction: metadata["construction"] ?? metadata["constructionType"] ?? null,
    images: (property.images ?? []).map(
      (image: {
        url?: string;
        altText?: string;
        sortOrder?: number;
        width?: number;
        height?: number;
      }) => ({
        url: image.url,
        altText: image.altText ?? null,
        sortOrder: image.sortOrder ?? 0,
        width: image.width ?? null,
        height: image.height ?? null,
      }),
    ),
    source: property.source,
    sourceUrl: property.sourceUrl ?? null,
    listingType: property.listingType ?? null,
    foreclosureStatus: property.foreclosureStatus ?? null,
    auctionDate: property.auctionDate ?? null,
    createdAt: metadata["listedAt"] ?? null,
    recordCreatedAt: property.createdAt ?? null,
    listingDate: metadata["listedAt"] ?? null,
    updatedAt: property.updatedAt ?? null,
    lastCheckedAt: property.lastCheckedAt ?? null,
    recordedAvailabilityChecks: matches.map((match) => ({
      firstSeenAt: match.firstSeenAt,
      lastSeenAt: match.lastSeenAt,
      updatedAt: match.updatedAt,
    })),
    recordedAvailabilityEvents: events.map((event) => ({
      type: event.eventType,
      date: event.createdAt,
      previousValue: event.previousValue ?? null,
      currentValue: event.currentValue ?? null,
    })),
    latitude: property.latitude ?? coordinates[1] ?? null,
    longitude: property.longitude ?? coordinates[0] ?? null,
    previousPrice: typeof metadata["previousPrice"] === "number" ? metadata["previousPrice"] : null,
    geocoding: property.geocoding ?? metadata["geocoding"] ?? null,
  };
}

/** Public, viewport-bounded inventory for the property intelligence map. */
export async function getIntelligenceInventory(input: IntelligenceQuery) {
  const args = IntelligenceQuery.parse(input);
  await connectMongo();
  const query: Record<string, unknown> = {
    country: "United States",
    status: { $in: ["published", "active", "pending", "sold"] },
    latitude: { $gte: args.south, $lte: args.north },
  };
  if (args.west <= args.east) {
    query["longitude"] = { $gte: args.west, $lte: args.east };
  } else {
    query["$or"] = [
      { longitude: { $gte: args.west, $lte: 180 } },
      { longitude: { $gte: -180, $lte: args.east } },
    ];
  }
  if (args.minPrice !== undefined || args.maxPrice !== undefined) {
    query["price"] = {
      ...(args.minPrice !== undefined ? { $gte: args.minPrice } : {}),
      ...(args.maxPrice !== undefined ? { $lte: args.maxPrice } : {}),
    };
  }
  if (args.propertyType) query["propertyType"] = args.propertyType;
  if (args.q) query["$text"] = { $search: args.q };

  const [total, records, activityEvents] = await Promise.all([
    PropertyModel.countDocuments(query),
    PropertyModel.find(query)
      .sort({ updatedAt: -1, _id: -1 })
      .skip(args.offset)
      .limit(args.limit)
      .lean(),
    SavedSearchEvent.find({
      eventType: { $in: ["new", "price_changed", "status_changed", "auction_changed"] },
      createdAt: { $gte: new Date(Date.now() - 7 * 86400000) },
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
  ]);
  const matchingEvents = activityEvents.filter((event) =>
    records.some(
      (property) =>
        property.source === event.source && property.sourceListingId === event.listingId,
    ),
  );
  const activity = matchingEvents.slice(0, 12).map((event) => {
    const property = records.find(
      (candidate) =>
        candidate.source === event.source && candidate.sourceListingId === event.listingId,
    )!;
    return {
      id: String(event._id),
      propertyId: String(property._id),
      title: property.address || property.title,
      eventType: event.eventType,
      changedAt: event.createdAt,
      data_source: event.source,
    };
  });
  return {
    properties: records.map((record) => {
      const metadata = (record.metadata ?? {}) as Record<string, unknown>;
      return {
        ...propertyDto(record),
        createdAt: metadata["listedAt"] ?? null,
        updatedAt: record.updatedAt ?? null,
        listingType: record.listingType ?? null,
        previousPrice:
          typeof metadata["previousPrice"] === "number" ? metadata["previousPrice"] : null,
        last_verified_at: record.lastCheckedAt ?? null,
        data_source: record.source,
        source: record.source,
        areaSqft: record.buildingArea ?? null,
        sourceDetails: metadata,
      };
    }),
    total,
    offset: args.offset,
    limit: args.limit,
    hasMore: args.offset + records.length < total,
    activity,
    fetchedAt: new Date().toISOString(),
    dataSource: "mongodb" as const,
  };
}

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
};

function stateAliases(input: string) {
  const normalized = input.trim().toLowerCase();
  const entry = Object.entries(STATE_NAMES).find(
    ([code, name]) => code.toLowerCase() === normalized || name.toLowerCase() === normalized,
  );
  return entry ? [entry[0], entry[1]] : [input];
}

export async function searchProperties(input: unknown, useCache = true) {
  const args = PropertySearchArgs.parse(input);
  const query = getQuery(args);
  const key = createHash("sha256")
    .update(
      JSON.stringify({
        query,
        sortBy: args.sortBy,
        sortOrder: args.sortOrder,
        limit: args.limit ?? 8,
        offset: args.offset ?? 0,
      }),
    )
    .digest("hex");
  await connectMongo();
  if (useCache) {
    const cached = await SearchCache.findOne({ key, expiresAt: { $gt: new Date() } }).lean();
    if (cached)
      return cached.value as {
        properties: ReturnType<typeof propertyDto>[];
        hasMore: boolean;
        total: number;
      };
  }
  const fields = {
    price: "price",
    auctionDate: "auctionDate",
    bedrooms: "bedrooms",
    area: "buildingArea",
    updatedAt: "updatedAt",
  } as const;
  const sortField = fields[args.sortBy ?? "price"];
  const sort = {
    [sortField]: args.sortOrder === "desc" ? (-1 as const) : (1 as const),
    _id: 1 as const,
  };
  const limit = args.limit ?? 8;
  const [items, total] = await Promise.all([
    PropertyModel.find(query)
      .collation({ locale: "en", strength: 2 })
      .sort(sort)
      .skip(args.offset ?? 0)
      .limit(limit + 1)
      .lean(),
    PropertyModel.countDocuments(query).collation({ locale: "en", strength: 2 }),
  ]);
  const result = {
    properties: items.slice(0, limit).map((item) => propertyDto(item)),
    hasMore:
      (args.offset ?? 0) + items.length > (args.offset ?? 0) + limit &&
      total > (args.offset ?? 0) + limit,
    total,
  };
  if (useCache) {
    await SearchCache.updateOne(
      { key },
      { $set: { value: result, expiresAt: new Date(Date.now() + 30_000) } },
      { upsert: true },
    );
  }
  return result;
}

export async function getProperty(id: string) {
  if (typeof id !== "string" || id.length < 1 || id.length > 120)
    throw new Error("Enter a valid property ID.");
  await connectMongo();
  const clauses: Record<string, unknown>[] = [{ legacyId: id }, { sourceListingId: id }];
  if (/^[a-f\d]{24}$/i.test(id)) clauses.push({ _id: id });
  const property = await PropertyModel.findOne({
    $or: clauses,
    status: { $in: ["published", "active", "pending", "sold"] },
  }).lean();
  return property ? propertyDto(property) : null;
}

export async function findSimilarProperties(id: string, limit = 6) {
  const property = await getProperty(id);
  if (!property) return { properties: [], total: 0 };
  const input = {
    ...(property.state ? { state: property.state } : {}),
    ...(property.city ? { city: property.city } : {}),
    ...(property.propertyType ? { propertyType: property.propertyType } : {}),
    ...(property.price
      ? { minPrice: Math.round(property.price * 0.65), maxPrice: Math.round(property.price * 1.35) }
      : {}),
    limit: Math.min(Math.max(limit, 1), 12),
    sortBy: "price" as const,
  };
  const found = await searchProperties(input);
  return {
    properties: found.properties.filter((item) => item.id !== property.id),
    total: found.total,
  };
}

export async function compareProperties(ids: string[]) {
  if (
    !Array.isArray(ids) ||
    ids.length < 2 ||
    ids.length > 5 ||
    ids.some((id) => typeof id !== "string" || id.length > 120)
  )
    throw new Error("Compare between two and five property IDs.");
  await connectMongo();
  const clauses: Record<string, unknown>[] = ids.flatMap((id) =>
    /^[a-f\d]{24}$/i.test(id)
      ? [{ _id: id }, { legacyId: id }, { sourceListingId: id }]
      : [{ legacyId: id }, { sourceListingId: id }],
  );
  const properties = await PropertyModel.find({
    $or: clauses,
    status: { $in: ["published", "active"] },
  })
    .limit(5)
    .lean();
  return properties.map((p) => propertyDto(p));
}

export function calculateTargetOffer(price: number, discountPercent: number) {
  if (
    !Number.isFinite(price) ||
    price < 0 ||
    price > 100_000_000 ||
    !Number.isFinite(discountPercent) ||
    discountPercent < 0 ||
    discountPercent > 100
  )
    throw new Error("Enter a valid asking price and discount from 0 to 100 percent.");
  return {
    askingPrice: price,
    discountPercent,
    targetOffer: Math.round(price * (1 - discountPercent / 100) * 100) / 100,
    note: "A calculation only; it is not a valuation or an offer acceptance prediction.",
  };
}

export function calculatePricePerSqft(price: number, area: number) {
  if (!Number.isFinite(price) || price < 0 || !Number.isFinite(area) || area <= 0)
    throw new Error("A valid price and positive area are required.");
  return { price, areaSqft: area, pricePerSqft: Math.round((price / area) * 100) / 100 };
}

export function calculateTotalInvestment(
  price: number,
  repairCosts: number,
  closingPercent: number,
) {
  if (
    ![price, repairCosts, closingPercent].every(Number.isFinite) ||
    price < 0 ||
    repairCosts < 0 ||
    closingPercent < 0 ||
    closingPercent > 30
  )
    throw new Error("Enter valid price, repair cost, and closing cost percentage.");
  const closingCosts = Math.round(price * closingPercent) / 100;
  return {
    purchasePrice: price,
    repairCosts,
    estimatedClosingCosts: closingCosts,
    estimatedTotalInvestment: Math.round((price + repairCosts + closingCosts) * 100) / 100,
    userProvidedAssumptions: { repairCosts, closingPercent },
  };
}

export function estimateInvestmentReturn(investment: number, annualNetIncome: number) {
  if (
    ![investment, annualNetIncome].every(Number.isFinite) ||
    investment <= 0 ||
    annualNetIncome < 0 ||
    annualNetIncome > 100_000_000
  )
    throw new Error("Provide a positive total investment and a nonnegative annual net income.");
  return {
    investment,
    annualNetIncome,
    estimatedAnnualRoiPercent: Math.round((annualNetIncome / investment) * 10000) / 100,
    note: "Based only on your figures; excludes taxes, financing, vacancy and other costs and does not guarantee future returns.",
  };
}

export async function saveProperty(userId: string, id: string, saved = true) {
  if (typeof id !== "string" || id.length < 1 || id.length > 120)
    throw new Error("Enter a valid property ID.");
  await connectMongo();
  const conditions: Record<string, unknown>[] = [{ legacyId: id }, { sourceListingId: id }];
  if (/^[a-f\d]{24}$/i.test(id)) conditions.push({ _id: id });
  const property = await PropertyModel.findOne({
    $or: conditions,
    status: { $in: ["published", "active"] },
  })
    .select("_id")
    .lean();
  if (!property) throw new Error("Property not found in the current database.");
  if (saved)
    await Favorite.updateOne(
      { userId, propertyId: property._id },
      { $setOnInsert: { userId, propertyId: property._id } },
      { upsert: true },
    );
  else await Favorite.deleteOne({ userId, propertyId: property._id });
  return { saved, propertyId: String(property._id) };
}
