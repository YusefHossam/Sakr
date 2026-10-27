import { Client, handle_file } from "@gradio/client";
import { getSession } from "@/lib/auth/session";

// POST /api/try-on (multipart: person, garmentUrl, description) → { image: dataURL }
// Runs IDM-VTON on a free Hugging Face Space. The photo is sent there for processing only;
// SAKR stores nothing. Free Spaces queue and sleep, so this can be slow or busy.
const SPACE = process.env.TRYON_SPACE ?? "yisol/IDM-VTON";
const MAX_BYTES = 6 * 1024 * 1024;
const ALLOWED_GARMENT_HOSTS = ["cdn.shopify.com", "chromeheartswear.com", "www.stadiumgoods.com"];

export const maxDuration = 120;

export async function POST(request: Request) {
  if (!(await getSession())) return Response.json({ error: "login" }, { status: 401 });
  const form = await request.formData();
  const person = form.get("person");
  const garmentUrl = String(form.get("garmentUrl") ?? "");
  const description = String(form.get("description") ?? "streetwear top").slice(0, 120);
  if (!(person instanceof File) || !person.type.startsWith("image/") || person.size > MAX_BYTES) {
    return Response.json({ error: "photo" }, { status: 400 });
  }

  // Only our own catalog images (CDN or local) — never fetch arbitrary URLs from the server.
  let garment: Blob;
  try {
    if (garmentUrl.startsWith("/products/")) {
      garment = await (await fetch(new URL(garmentUrl, request.url))).blob();
    } else {
      const url = new URL(garmentUrl);
      if (url.protocol !== "https:" || !ALLOWED_GARMENT_HOSTS.includes(url.hostname)) return Response.json({ error: "garment" }, { status: 400 });
      garment = await (await fetch(url)).blob();
    }
  } catch {
    return Response.json({ error: "garment" }, { status: 400 });
  }

  try {
    const client = await Client.connect(SPACE, process.env.HF_TOKEN ? { hf_token: process.env.HF_TOKEN as `hf_${string}` } : undefined);
    const result = await client.predict("/tryon", {
      dict: { background: handle_file(person), layers: [], composite: null },
      garm_img: handle_file(garment),
      garment_des: description,
      is_checked: true,
      is_checked_crop: true,
      denoise_steps: 30,
      seed: 42,
    });
    const out = (result.data as { url?: string }[])[0]?.url;
    if (!out) throw new Error("no image");
    const img = await fetch(out);
    const buf = Buffer.from(await img.arrayBuffer());
    return Response.json({ image: `data:${img.headers.get("content-type") ?? "image/png"};base64,${buf.toString("base64")}` });
  } catch (error) {
    console.error("[try-on]", error);
    return Response.json({ error: "busy" }, { status: 503 });
  }
}
