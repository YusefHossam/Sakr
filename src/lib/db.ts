import "server-only";
import mongoose from "mongoose";
import { env } from "./env";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Reuse the connection across hot reloads (dev) and warm invocations (serverless).
const globalForMongoose = globalThis as typeof globalThis & {
  __mongoose?: MongooseCache;
};

const cache: MongooseCache = (globalForMongoose.__mongoose ??= {
  conn: null,
  promise: null,
});

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    const { MONGODB_URI, MONGODB_DB } = env();
    cache.promise = mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB,
      bufferCommands: false,
      serverSelectionTimeoutMS: 10_000,
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }

  return cache.conn;
}
