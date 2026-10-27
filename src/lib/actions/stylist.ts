"use server";

import { z } from "zod";
import { connectDB } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { promoFor, variantPrice } from "@/lib/pricing";
import { Product } from "@/models/product";

export type StylistItem = { slug: string; title: string; brand: string; category: string; price: number; image: string | null };
export type Outfit = { name: string; why: string; items: StylistItem[]; total: number };
export type StylistResult = { ok: true; outfits: Outfit[]; source: "gemini" | "rules" } | { ok: false };

const SLOTS = {
  top: ["hoodies", "tees", "crewnecks"],
  bottom: ["pants", "sweatpants", "shorts"],
  shoes: ["footwear"],
  outer: ["jackets"],
  accessory: ["accessories"],
} as const;

// Vibe keywords → brands that fit them (English and Arabic).
const VIBES: [RegExp, string[]][] = [
  [/travis|cactus|ترافيس/i, ["jordan", "nike", "off-white", "denim-tears"]],
  [/rick|owens|goth|dark|ريك|جوث/i, ["rick-owens", "chrome-hearts", "comme-des-garcons"]],
  [/chrome|كروم/i, ["chrome-hearts"]],
  [/corteiz|drill|uk|london|دريل|لندن/i, ["corteiz", "trapstar", "nike"]],
  [/lux|luxury|فخم|غالي/i, ["amiri", "balenciaga", "louis-vuitton", "rick-owens", "lanvin", "dior", "gucci"]],
  [/bape|ape|بيب/i, ["bape", "aape"]],
  [/clean|minimal|نضيف|بسيط/i, ["essentials", "comme-des-garcons", "asics", "nike"]],
  [/jordan|جوردن/i, ["jordan"]],
];
const BLACK = /black|all[- ]?black|أسود|اسود|سودا/i;
const SUMMER = /summer|hot|صيف|حر/i;

const toLatinDigits = (s: string) => s.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

/** "under 10k", "تحت ١٠ آلاف", "15,000 EGP" → EGP budget. */
function parseBudget(prompt: string): number | null {
  const s = toLatinDigits(prompt).replace(/,/g, "");
  const m = s.match(/(\d+(?:\.\d+)?)\s*(k|K|ألف|الف|آلاف|الاف|thousand)?/);
  if (!m) return null;
  const n = Number(m[1]) * (m[2] ? 1000 : 1);
  return n >= 500 ? n : null;
}

type Candidate = StylistItem & { slot: keyof typeof SLOTS; score: number };

async function candidates(prompt: string): Promise<Candidate[]> {
  await connectDB();
  const { promos } = await getSettings();
  const brands = VIBES.filter(([re]) => re.test(prompt)).flatMap(([, b]) => b);
  const docs = await Product.find({
    active: true,
    "images.0": { $exists: true },
    ...(brands.length ? { brandSlug: { $in: brands } } : {}),
    ...(SUMMER.test(prompt) ? { category: { $in: ["tees", "shorts", "footwear", "accessories"] } } : {}),
    variants: { $elemMatch: { stock: { $gt: 0 } } },
  })
    .sort({ publishedAt: -1 })
    .limit(400)
    .select("slug title brand brandSlug category price images variants")
    .lean();
  return docs.flatMap((d) => {
    const slot = (Object.keys(SLOTS) as (keyof typeof SLOTS)[]).find((k) => (SLOTS[k] as readonly string[]).includes(d.category));
    if (!slot) return [];
    const best = Math.min(...d.variants.filter((v) => v.stock > 0).map((v) => variantPrice(d.price, v.stock, promoFor(d, promos))));
    const score = (BLACK.test(prompt) && /black|noir|ebony|triple black/i.test(d.title) ? 3 : 0) + Math.random();
    return [{ slug: d.slug, title: d.title, brand: d.brand, category: d.category, price: best, image: d.images[0] ?? null, slot, score }];
  });
}

/** House rules: one top + bottom + shoes (+ outerwear/accessory if the budget allows), cheapest-first within budget. */
function ruleOutfits(pool: Candidate[], budget: number | null): Outfit[] {
  const bySlot = (slot: keyof typeof SLOTS) => pool.filter((c) => c.slot === slot).sort((a, b) => b.score - a.score);
  const used = new Set<string>();
  const outfits: Outfit[] = [];
  for (let n = 0; n < 3; n++) {
    const pick: Candidate[] = [];
    let spent = 0;
    for (const slot of ["shoes", "top", "bottom", "outer", "accessory"] as const) {
      const left = budget ? budget - spent : Infinity;
      const optional = slot === "outer" || slot === "accessory";
      const item = bySlot(slot).find((c) => !used.has(c.slug) && c.price <= (optional ? left : left * (slot === "shoes" ? 0.55 : 0.7)));
      if (item) {
        pick.push(item);
        used.add(item.slug);
        spent += item.price;
      }
    }
    if (pick.length >= 3) outfits.push({ name: "", why: "", items: pick, total: spent });
  }
  return outfits;
}

const promptSchema = z.string().trim().min(2).max(200);

export async function styleMe(input: string, locale: "ar" | "en"): Promise<StylistResult> {
  const parsed = promptSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const prompt = parsed.data;
  const budget = parseBudget(prompt);
  const pool = await candidates(prompt);
  const key = process.env.GEMINI_API_KEY;

  if (key && pool.length) {
    // Gemini (free tier) picks from a short, in-stock shortlist; we validate every slug and the budget.
    const shortlist = pool.sort((a, b) => b.score - a.score).slice(0, 90);
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `You are SAKR's streetwear stylist in Cairo. Build up to 3 outfits for this request: "${prompt}". ${budget ? `Each outfit's total must be at most ${budget} EGP.` : ""}
Use ONLY items from this list (slug | brand | category | price EGP | title):
${shortlist.map((c) => `${c.slug} | ${c.brand} | ${c.category} | ${c.price} | ${c.title}`).join("\n")}
Each outfit: 1 top, 1 bottom, 1 pair of shoes, optionally 1 jacket and 1 accessory. Write "name" (3-5 words) and "why" (one short line) in ${locale === "ar" ? "Egyptian Arabic" : "English"}.
Reply as JSON: {"outfits":[{"name":"","why":"","slugs":["..."]}]}`,
                },
              ],
            },
          ],
          generationConfig: { responseMimeType: "application/json", temperature: 0.9 },
        }),
        signal: AbortSignal.timeout(25_000),
      });
      if (res.ok) {
        const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        const json = JSON.parse(text) as { outfits?: { name?: string; why?: string; slugs?: string[] }[] };
        const bySlug = new Map(shortlist.map((c) => [c.slug, c]));
        const outfits = (json.outfits ?? []).flatMap((o) => {
          const items = (o.slugs ?? []).map((s) => bySlug.get(s)).filter((c): c is Candidate => !!c);
          const total = items.reduce((s, i) => s + i.price, 0);
          if (items.length < 2 || (budget && total > budget * 1.05)) return [];
          return [{ name: String(o.name ?? "").slice(0, 60), why: String(o.why ?? "").slice(0, 160), items, total }];
        });
        if (outfits.length) return { ok: true, outfits: outfits.map(strip), source: "gemini" };
      }
    } catch (error) {
      console.warn("[stylist] Gemini failed, using house rules:", error);
    }
  }
  return { ok: true, outfits: ruleOutfits(pool, budget).map(strip), source: "rules" };
}

const strip = (o: Outfit): Outfit => ({
  ...o,
  items: o.items.map(({ slug, title, brand, category, price, image }) => ({ slug, title, brand, category, price, image })),
});
