import mongoose from "mongoose";
import { buildOutfits } from "../src/lib/outfit-formulas.ts";
import { MOODS, type Mood } from "../src/lib/moods.ts";
process.loadEnvFile(".env.local");
await mongoose.connect(process.env.MONGODB_URI!, { dbName: process.env.MONGODB_DB });
const c = mongoose.connection.db!.collection("products");
const F = "slug title brand brandSlug category subcategory model fit colors price".split(" ");
const proj = Object.fromEntries(F.map((f) => [f, 1]));
const stocked = { active: true, "images.0": { $exists: true }, variants: { $elemMatch: { stock: { $gt: 3 } } } };
for (const mood of (process.argv[2] ? process.argv[2].split(",") : Object.keys(MOODS)) as Mood[]) {
  const m = MOODS[mood];
  const clothes = await c.aggregate([{ $match: { ...stocked, brandSlug: { $in: [...m.brands] }, category: { $nin: [...m.exclude, "footwear", "slides", "accessories"] } } }, { $sample: { size: 900 } }, { $project: proj }]).toArray();
  const extras = [...await c.aggregate([{ $match: { ...stocked, category: { $in: ["footwear", "accessories"] } } }, { $sample: { size: 600 } }, { $project: proj }]).toArray(), ...await c.find({ ...stocked, category: "footwear", title: /loafer|derby|oxford|moccasin|penny|horsebit|boots?|tabi|ramones/i }).project(proj).limit(400).toArray()];
  const fits = buildOutfits([...clothes, ...extras] as any[], { count: 6, seed: `${mood}:t2`, mood });
  console.log(`\n===== ${mood} (${fits.length})`);
  for (const f of fits) console.log(`[${f.formula.en}]\n   ` + f.items.map((i) => `${i.brand}: ${i.title}`).join("\n   "));
}
process.exit(0);
