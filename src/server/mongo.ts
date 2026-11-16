import mongoose from "mongoose";
import { mongoModels } from "./models.ts";

let connection: Promise<typeof mongoose> | undefined;

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
