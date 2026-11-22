import mongoose from "mongoose";
import { mongoModels } from "./models.ts";

let connection: Promise<typeof mongoose> | undefined;

/** Log actionable database failures without ever printing credentials embedded in a URI. */
export function safeMongoError(error: unknown) {
  if (!(error instanceof Error))
    return { name: "UnknownError", message: String(error).slice(0, 500) };
  const details: string[] = [];
  const seen = new Set<unknown>();
  const append = (candidate: unknown) => {
    if (!(candidate instanceof Error) || seen.has(candidate) || details.length >= 6) return;
    seen.add(candidate);
    const rawCode = "code" in candidate ? candidate.code : undefined;
    const code = typeof rawCode === "string" ? rawCode : "";
    const message = candidate.message
      .replace(/mongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi, "mongodb://[redacted]")
      .slice(0, 300);
    const detail = `${candidate.name || "Error"}${code ? ` (${code})` : ""}: ${message}`;
    if (!details.includes(detail)) details.push(detail);
    const reason = "reason" in candidate ? candidate.reason : undefined;
    if (reason instanceof Error) append(reason);
    if (
      reason &&
      typeof reason === "object" &&
      "servers" in reason &&
      reason.servers instanceof Map
    ) {
      for (const server of reason.servers.values()) append(server?.error ?? server?.lastError);
    }
    if ("cause" in candidate) append(candidate.cause);
  };
  append(error);
  return {
    name: error.name || "Error",
    message: details.join(" <- ").slice(0, 1600),
  };
}

const MONGO_CONNECTIVITY_NAMES =
  /^(?:MongooseServerSelectionError|MongoServerSelectionError|MongoNetworkError|MongoNetworkTimeoutError|MongoTopologyClosedError|MongoPoolClearedError)$/;
const MONGO_CONNECTIVITY_CODES = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "ENOTFOUND",
  "EAI_AGAIN",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "ECONNABORTED",
  "ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR",
]);

/** Identifies DNS, socket, TLS, and driver server-selection failures for API status mapping. */
export function isMongoConnectivityError(error: unknown) {
  const queue: unknown[] = [error];
  const seen = new Set<unknown>();
  while (queue.length > 0 && seen.size < 20) {
    const current = queue.shift();
    if (!current || typeof current !== "object" || seen.has(current)) continue;
    seen.add(current);
    const value = current as {
      name?: unknown;
      code?: unknown;
      message?: unknown;
      cause?: unknown;
      reason?: unknown;
    };
    const name = typeof value.name === "string" ? value.name : "";
    const code = typeof value.code === "string" ? value.code : "";
    const message = typeof value.message === "string" ? value.message : "";
    if (
      MONGO_CONNECTIVITY_NAMES.test(name) ||
      MONGO_CONNECTIVITY_CODES.has(code) ||
      code.startsWith("ERR_SSL_") ||
      /querySrv\s+ECONNREFUSED|tlsv1 alert internal error/i.test(message)
    )
      return true;
    if (value.cause) queue.push(value.cause);
    if (value.reason) {
      queue.push(value.reason);
      if (
        typeof value.reason === "object" &&
        "servers" in value.reason &&
        value.reason.servers instanceof Map
      ) {
        for (const server of value.reason.servers.values())
          queue.push(server?.error ?? server?.lastError);
      }
    }
  }
  return false;
}

/** Connects application persistence to the single Atlas database for Rylestate. */
export function connectMongo() {
  if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose);
  if (connection) return connection;

  const uri = process.env["MONGODB_URI"];
  if (!uri) throw new Error("MONGODB_URI is required to connect to the Rylestate database.");

  connection = mongoose
    .connect(uri, {
      dbName: "rylestate",
      bufferCommands: false,
      autoIndex: process.env["NODE_ENV"] !== "production",
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    })
    .catch((error: unknown) => {
      connection = undefined;
      throw error;
    });

  return connection;
}

/** Creates declared indexes without dropping any indexes on an existing database. */
export async function initializeMongo() {
  await connectMongo();
  await Promise.all(mongoModels.map((model) => model.createIndexes()));
  return mongoose;
}
