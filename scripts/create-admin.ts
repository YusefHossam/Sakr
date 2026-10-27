// Creates (or promotes) the store owner's admin account.
// Usage: npm run create-admin -- <email> <password> [name]
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User } from "../src/models/user.ts";

process.loadEnvFile(".env.local");

const [email, password, name = "SAKR Owner"] = process.argv.slice(2);
if (!email || !password || password.length < 8) {
  console.error("Usage: npm run create-admin -- <email> <password (8+ chars)> [name]");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI!, { dbName: process.env.MONGODB_DB, serverSelectionTimeoutMS: 15_000 });
try {
  const passwordHash = await bcrypt.hash(password, 10);
  await User.updateOne(
    { email: email.toLowerCase() },
    { $set: { role: "admin", passwordHash }, $setOnInsert: { name, email: email.toLowerCase(), phone: "" } },
    { upsert: true },
  );
  console.log(`✓ Admin ready: ${email.toLowerCase()}`);
} finally {
  await mongoose.disconnect();
}
