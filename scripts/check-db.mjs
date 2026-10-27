// Checks that .env.local is valid and MongoDB is reachable.
// Usage: npm run check:db
import mongoose from "mongoose";

process.loadEnvFile(".env.local");

const missing = ["MONGODB_URI", "MONGODB_DB"].filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`✗ Missing env vars: ${missing.join(", ")}`);
  process.exit(1);
}
console.log("✓ env vars present");

try {
  const started = Date.now();
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB,
    serverSelectionTimeoutMS: 10_000,
  });
  await mongoose.connection.db.admin().ping();
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log(`✓ MongoDB connected (db: ${mongoose.connection.name}, ${Date.now() - started} ms, ${collections.length} collections)`);
} catch (error) {
  console.error(`✗ MongoDB: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
