"use server";

import { getSession } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { MOODS, isMood, type Mood } from "@/lib/moods";
import { CATEGORIES, Product } from "@/models/product";

export type FitPick = { slug: string; title: string; brand: string; image: string | null; price: number };
export type FitCheckResult =
  | { ok: true; score: number; verdict: string; tips: string[]; mood: Mood | null; picks: FitPick[] }
  | { ok: false; error: "login" | "photo" | "busy" | "nokey" };

const MAX_BYTES = 1_500_000;
const MODELS = ["gemini-flash-latest", "gemini-3.5-flash", "gemini-flash-lite-latest"];

/** Rates the outfit in a photo and suggests what to add from the store. The photo is sent to Gemini for this one call and never stored. */
export async function checkFit(form: FormData): Promise<FitCheckResult> {
  if (!(await getSession())) return { ok: false, error: "login" };
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { ok: false, error: "nokey" };
  const photo = form.get("photo");
  const locale = form.get("locale") === "en" ? "en" : "ar";
  if (!(photo instanceof File) || !photo.type.startsWith("image/") || photo.size > MAX_BYTES || photo.size < 2_000) return { ok: false, error: "photo" };
  const data = Buffer.from(await photo.arrayBuffer()).toString("base64");

  const prompt = `You are a streetwear stylist for SAKR, a men's store in Cairo. Look at the outfit in this photo and answer as JSON:
{"score": integer 1-10, "verdict": one short sentence, "tips": up to 3 short actionable tips, "add": up to 3 of ${JSON.stringify(CATEGORIES)} worth adding, "mood": one of "drip","clean","opium","old-money"}
Write verdict and tips in ${locale === "ar" ? "Egyptian Arabic" : "English"}. Be honest but encouraging. If there is no clothing visible, use score 0 and say so.`;
  const body = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: prompt }, { inline_data: { mime_type: photo.type, data } }] }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.7, thinkingConfig: { thinkingLevel: "low" } },
  });

  let parsed: { score?: number; verdict?: string; tips?: string[]; add?: string[]; mood?: string } | null = null;
  const deadline = Date.now() + 40_000;
  for (const model of MODELS) {
    const left = deadline - Date.now();
    if (left < 4_000) break;
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": key },
        body,
        signal: AbortSignal.timeout(Math.min(left, 20_000)),
      });
      if (!res.ok) continue;
      const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] };
      const text = (json.candidates?.[0]?.content?.parts ?? []).filter((p) => !p.thought).map((p) => p.text ?? "").join("");
      parsed = JSON.parse(text);
      if (parsed) break;
    } catch {
      /* next model */
    }
  }
  if (!parsed) return { ok: false, error: "busy" };

  const mood = isMood(parsed.mood) ? parsed.mood : null;
  const wanted = (parsed.add ?? []).filter((c): c is (typeof CATEGORIES)[number] => (CATEGORIES as readonly string[]).includes(c)).slice(0, 3);
  await connectDB();
  const picks: FitPick[] = [];
  for (const category of wanted) {
    const docs = await Product.find({
      active: true,
      category,
      ...(mood ? { brandSlug: { $in: [...MOODS[mood].brands] } } : {}),
      variants: { $elemMatch: { stock: { $gt: 3 } } },
    })
      .select("slug title brand price images")
      .limit(40)
      .lean<{ slug: string; title: string; brand: string; price: number; images?: string[] }[]>();
    const d = docs[Math.floor(Math.random() * docs.length)];
    if (d) picks.push({ slug: d.slug, title: d.title, brand: d.brand, image: d.images?.[0] ?? null, price: d.price });
  }
  return {
    ok: true,
    score: Math.max(0, Math.min(10, Math.round(Number(parsed.score) || 0))),
    verdict: String(parsed.verdict ?? "").slice(0, 240),
    tips: (parsed.tips ?? []).map((t) => String(t).slice(0, 200)).slice(0, 3),
    mood,
    picks,
  };
}
