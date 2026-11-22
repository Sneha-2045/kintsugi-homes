import { createHash } from "node:crypto";
import mongoose from "mongoose";
import { connectMongo } from "../src/server/mongo.ts";
import { PropertyGeocodeCache, PropertyModel } from "../src/server/models.ts";

const apiKey = process.env["GOOGLE_MAPS_GEOCODING_API_KEY"];
const provider = "google-geocoding";
const pageSize = Math.max(1, Math.min(500, Number(process.env["GEOCODING_BATCH_SIZE"] ?? 100)));
const delayMs = Math.max(200, Number(process.env["GEOCODING_DELAY_MS"] ?? 250));
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

if (!apiKey) {
  console.error("Set GOOGLE_MAPS_GEOCODING_API_KEY in .env before running the geocoding job.");
  process.exit(1);
}

const normalizeAddress = (property) =>
  [property.address, property.city, property.state, property.postalCode, property.country]
    .filter((part) => typeof part === "string" && part.trim())
    .join(", ")
    .replace(/\s+/g, " ")
    .trim();
const hashAddress = (address) => createHash("sha256").update(address.toLowerCase()).digest("hex");

async function geocode(address) {
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", address);
  url.searchParams.set("region", "us");
  url.searchParams.set("key", apiKey);
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Geocoder HTTP ${response.status}`);
  const body = await response.json();
  if (body.status === "OVER_QUERY_LIMIT" || body.status === "REQUEST_DENIED")
    throw new Error(`Geocoder stopped: ${body.status}`);
  const result = body.status === "OK" ? body.results?.[0] : undefined;
  const precision = result?.geometry?.location_type;
  const latitude = result?.geometry?.location?.lat;
  const longitude = result?.geometry?.location?.lng;
  if (
    !result ||
    !["ROOFTOP", "RANGE_INTERPOLATED"].includes(precision) ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return {
      status: "failed",
      error: !result ? `no_result:${body.status}` : `insufficient_precision:${precision ?? "unknown"}`,
      precision: precision ?? null,
    };
  }
  return { status: "geocoded", latitude, longitude, precision };
}

await connectMongo();
const missing = {
  country: "United States",
  status: { $ne: "draft" },
  $and: [
    {
      $nor: [
        { $and: [
          { latitude: { $type: "number", $gte: -90, $lte: 90 } },
          { longitude: { $type: "number", $gte: -180, $lte: 180 } },
        ] },
        { $and: [
          { "geoPoint.type": "Point" },
          { "geoPoint.coordinates.0": { $type: "number", $gte: -180, $lte: 180 } },
          { "geoPoint.coordinates.1": { $type: "number", $gte: -90, $lte: 90 } },
        ] },
      ],
    },
    { "geocoding.status": { $nin: ["geocoded", "failed"] } },
  ],
};
let geocodedCount = 0;
let failedCount = 0;

try {
  while (true) {
    const records = await PropertyModel.find(missing)
      .select("_id address city state postalCode country")
      .sort({ _id: 1 })
      .limit(pageSize)
      .lean();
    if (!records.length) break;

    for (const property of records) {
      const address = normalizeAddress(property);
      const addressKey = hashAddress(address || String(property._id));
      const attemptedAt = new Date();
      if (!property.address || !property.city || !property.state) {
        const error = "incomplete_address";
        await PropertyModel.updateOne({ _id: property._id }, {
          $set: { geocoding: { status: "failed", provider, addressKey, attemptedAt, error } },
        });
        await PropertyGeocodeCache.updateOne({ addressKey }, {
          $set: { addressKey, normalizedAddress: address || "", provider, status: "failed", error, attemptedAt },
        }, { upsert: true });
        failedCount += 1;
        continue;
      }

      let cached = await PropertyGeocodeCache.findOne({ addressKey }).lean();
      if (!cached) {
        const result = await geocode(address);
        cached = await PropertyGeocodeCache.findOneAndUpdate(
          { addressKey },
          { $set: { addressKey, normalizedAddress: address, provider, ...result, attemptedAt } },
          { upsert: true, new: true },
        ).lean();
        await delay(delayMs);
      }
      if (cached?.status === "geocoded" && Number.isFinite(cached.latitude) && Number.isFinite(cached.longitude)) {
        await PropertyModel.updateOne({ _id: property._id }, {
          $set: {
            latitude: cached.latitude,
            longitude: cached.longitude,
            geoPoint: { type: "Point", coordinates: [cached.longitude, cached.latitude] },
            geocoding: { status: "geocoded", provider, precision: cached.precision, addressKey, attemptedAt: cached.attemptedAt },
          },
        });
        geocodedCount += 1;
      } else {
        await PropertyModel.updateOne({ _id: property._id }, {
          $set: {
            geocoding: {
              status: "failed", provider, precision: cached?.precision, addressKey,
              attemptedAt: cached?.attemptedAt ?? attemptedAt,
              error: cached?.error ?? "geocoder_no_result",
            },
          },
        });
        failedCount += 1;
      }
    }
    console.log(`Geocoding progress: updated ${geocodedCount}, failed ${failedCount}`);
  }

  const total = await PropertyModel.countDocuments({ country: "United States", status: { $ne: "draft" } });
  const mapped = await PropertyModel.countDocuments({
    country: "United States",
    status: { $ne: "draft" },
    $or: [
      { $and: [
        { latitude: { $type: "number", $gte: -90, $lte: 90 } },
        { longitude: { $type: "number", $gte: -180, $lte: 180 } },
      ] },
      { $and: [
        { "geoPoint.type": "Point" },
        { "geoPoint.coordinates.0": { $type: "number", $gte: -180, $lte: 180 } },
        { "geoPoint.coordinates.1": { $type: "number", $gte: -90, $lte: 90 } },
      ] },
    ],
  });
  console.log(JSON.stringify({ total, geolocated: mapped, missingCoordinates: total - mapped, geocodedThisRun: geocodedCount, failuresThisRun: failedCount }, null, 2));
} finally {
  await mongoose.disconnect();
}
