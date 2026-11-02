// Creates (or updates) the store owner's admin account.
// Usage: npm run create-admin            -> reads ADMIN_USERNAME, ADMIN_PASSWORD (and ADMIN_EMAIL, ADMIN_NAME) from .env.local
//        npm run create-admin -- <username> <password> [email] [name]
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User } from "../src/models/user.ts";

process.loadEnvFile(".env.local");

const [argUser, argPassword, argEmail, argName] = process.argv.slice(2);
const username = (argUser ?? process.env.ADMIN_USERNAME ?? "").trim();
const password = argPassword ?? process.env.ADMIN_PASSWORD ?? "";
const email = (argEmail ?? process.env.ADMIN_EMAIL ?? `${username}@sakr.local`).trim().toLowerCase();
const name = argName ?? process.env.ADMIN_NAME ?? username;
if (!/^[A-Za-z0-9._-]{3,30}$/.test(username) || password.length < 8) {
  console.error("Set ADMIN_USERNAME (3-30 letters/digits) and ADMIN_PASSWORD (8+ chars) in .env.local, or pass them as arguments.");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI!, { dbName: process.env.MONGODB_DB, serverSelectionTimeoutMS: 15_000 });
try {
  await User.syncIndexes();
  const passwordHash = await bcrypt.hash(password, 10);
  await User.updateOne(
    { username: username.toLowerCase() },
    { $set: { role: "admin", passwordHash, blocked: false, name }, $setOnInsert: { username: username.toLowerCase(), email, phone: "" } },
    { upsert: true },
  );
  console.log(`✓ Admin ready: username "${username}" (email ${email})`);
} finally {
  await mongoose.disconnect();
}
