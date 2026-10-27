// Adds SAKR's own products: the Mystery Box tiers (BR-55). Safe to re-run.
// Usage: npm run seed:extras
import mongoose from "mongoose";
import { Brand } from "../src/models/brand.ts";
import { Product } from "../src/models/product.ts";

process.loadEnvFile(".env.local");

const TIERS = [
  { price: 5_000, worth: 8_000 },
  { price: 10_000, worth: 17_000 },
  { price: 20_000, worth: 35_000 },
];

await mongoose.connect(process.env.MONGODB_URI!, { dbName: process.env.MONGODB_DB, serverSelectionTimeoutMS: 15_000 });
try {
  for (const tier of TIERS) {
    const slug = `sakr-mystery-box-${tier.price}`;
    await Product.updateOne(
      { slug },
      {
        $set: {
          title: `Mystery Box ${tier.price.toLocaleString("en")}`,
          description: `Pieces worth up to ${tier.worth.toLocaleString("en")} EGP, packed in your size-passport sizes. Contents are a surprise; mystery boxes can't be exchanged.`,
          brand: "SAKR",
          brandSlug: "sakr",
          category: "accessories",
          subcategory: "mystery",
          price: tier.price,
          costPrice: Math.round(tier.worth * 0.55),
          images: ["/mystery/box.svg"],
          sizes: ["ONE"],
          variants: [{ size: "ONE", color: null, stock: 50 }],
          active: true,
          publishedAt: new Date(),
        },
      },
      { upsert: true },
    );
  }
  await Brand.updateOne({ slug: "sakr" }, { $set: { name: "SAKR", categories: ["accessories"], productCount: TIERS.length } }, { upsert: true });
  console.log(`✓ ${TIERS.length} mystery boxes ready`);
} finally {
  await mongoose.disconnect();
}
