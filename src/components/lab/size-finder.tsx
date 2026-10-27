"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { PoseLandmarker as PoseLandmarkerType } from "@mediapipe/tasks-vision";
import { Link } from "@/i18n/navigation";
import { saveSizePassport } from "@/lib/actions/account";
import { measure, type Mask, type Measurements, type Point } from "@/lib/body-measure";

const VISION_VERSION = "0.10.35";
const MODEL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task";
type Slot = "front" | "side" | "back";

let landmarkerPromise: Promise<PoseLandmarkerType> | null = null;
// Loaded on demand; runs entirely in the browser (WASM + model from public CDNs).
function getLandmarker() {
  landmarkerPromise ??= (async () => {
    const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
    const fileset = await FilesetResolver.forVisionTasks(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VISION_VERSION}/wasm`);
    return PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL, delegate: "GPU" },
      runningMode: "IMAGE",
      numPoses: 1,
      outputSegmentationMasks: true,
    });
  })();
  return landmarkerPromise;
}

type Detection = { landmarks: Point[]; mask: Mask; image: HTMLImageElement };

async function detect(src: string): Promise<Detection | null> {
  const image = new Image();
  image.src = src;
  await image.decode();
  const landmarker = await getLandmarker();
  const res = landmarker.detect(image);
  const lm = res.landmarks[0];
  const m = res.segmentationMasks?.[0];
  if (!lm || !m) return null;
  const mask: Mask = { width: m.width, height: m.height, data: m.getAsFloat32Array().slice() };
  m.close();
  return { landmarks: lm.map((p) => ({ x: p.x, y: p.y })), mask, image };
}

/** Upload or camera capture (with a body guide and 3-2-1) for one view. */
function PhotoInput({ label, value, onChange }: { label: string; value: string | null; onChange: (src: string) => void }) {
  const t = useTranslations("sizes");
  const video = useRef<HTMLVideoElement>(null);
  const [live, setLive] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!live) return;
    let stream: MediaStream | null = null;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", height: 1280 } })
      .then((s) => {
        stream = s;
        if (video.current) video.current.srcObject = s;
      })
      .catch(() => setLive(false));
    return () => stream?.getTracks().forEach((tr) => tr.stop());
  }, [live]);

  const capture = () => {
    let n = 3;
    setCount(n);
    const id = setInterval(() => {
      n -= 1;
      if (n > 0) return setCount(n);
      clearInterval(id);
      setCount(null);
      const v = video.current;
      if (!v) return;
      const c = document.createElement("canvas");
      c.width = v.videoWidth;
      c.height = v.videoHeight;
      c.getContext("2d")!.drawImage(v, 0, 0);
      onChange(c.toDataURL("image/jpeg", 0.92));
      setLive(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs tracking-[0.2em] text-dust uppercase">{label}</span>
      <div className="relative aspect-[3/4] overflow-hidden border border-ash bg-smoke">
        {live ? (
          <>
            <video ref={video} autoPlay playsInline muted className="size-full -scale-x-100 object-cover" />
            {/* Body guide */}
            <svg viewBox="0 0 100 133" className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
              <path d="M50 10a8 8 0 1 1 0 16a8 8 0 1 1 0-16M38 30h24l6 40h-6l-2 55h-8l-2-40-2 40h-8l-2-55h-6z" fill="none" stroke="#e4e4e4" strokeWidth="0.6" strokeDasharray="2 2" />
            </svg>
            {count && <span className="absolute inset-0 grid place-items-center font-display text-8xl text-chrome">{count}</span>}
          </>
        ) : value ? (
          // eslint-disable-next-line @next/next/no-img-element -- local preview of the visitor's own photo
          <img src={value} alt={label} className="size-full object-contain" />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-4xl text-iron" aria-hidden="true">+</span>
        )}
      </div>
      <div className="flex gap-2">
        {live ? (
          <button type="button" onClick={capture} disabled={count !== null} className="min-h-11 flex-1 bg-bone text-xs tracking-[0.2em] text-ink uppercase">{count ? t("countdown") : t("capture")}</button>
        ) : (
          <button type="button" onClick={() => setLive(true)} className="min-h-11 flex-1 border border-ash text-xs tracking-[0.15em] text-bone uppercase">{t("camera")}</button>
        )}
        <label className="flex min-h-11 flex-1 cursor-pointer items-center justify-center border border-ash text-xs tracking-[0.15em] text-bone uppercase">
          {t("upload")}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onChange(URL.createObjectURL(file));
            }}
          />
        </label>
      </div>
    </div>
  );
}

/** Draws the photo, the skeleton and the measurement lines, animating them in. */
function ResultCanvas({ detection, result }: { detection: Detection; result: Measurements }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const { image, landmarks } = detection;
    c.width = image.naturalWidth;
    c.height = image.naturalHeight;
    const ctx = c.getContext("2d")!;
    const bones = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]];
    let frame = 0;
    const start = performance.now();
    const draw = (now: number) => {
      const t = Math.min(1, (now - start) / 1800);
      ctx.drawImage(image, 0, 0);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, 0, c.width, c.height);
      const lw = Math.max(2, c.width / 260);
      ctx.lineWidth = lw;
      ctx.strokeStyle = "rgba(228,228,228,0.9)";
      bones.slice(0, Math.ceil(bones.length * Math.min(1, t * 1.6))).forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(landmarks[a].x * c.width, landmarks[a].y * c.height);
        ctx.lineTo(landmarks[b].x * c.width, landmarks[b].y * c.height);
        ctx.stroke();
      });
      const lt = Math.max(0, (t - 0.45) / 0.55);
      ctx.font = `600 ${Math.max(14, c.width / 32)}px sans-serif`;
      result.lines.forEach((l, i) => {
        const p = Math.min(1, lt * 1.4 - i * 0.15);
        if (p <= 0) return;
        const y = l.y * c.height;
        const x1 = l.x1 * c.width;
        const x2 = x1 + (l.x2 - l.x1) * c.width * p;
        ctx.strokeStyle = "#c21a2a";
        ctx.lineWidth = lw * 1.4;
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.stroke();
        if (p >= 1) {
          const cm = l.key === "chest" ? result.chestCm : l.key === "waist" ? result.waistCm : result.hipsCm;
          ctx.fillStyle = "#ffffff";
          ctx.fillText(`${cm} cm`, l.x2 * c.width + 10, y + 5);
        }
      });
      if (t < 1) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [detection, result]);
  return <canvas ref={canvas} className="max-h-[70vh] w-full border border-ash object-contain" aria-hidden="true" />;
}

export function SizeFinder({ loggedIn }: { loggedIn: boolean }) {
  const t = useTranslations("sizes");
  const [photos, setPhotos] = useState<Record<Slot, string | null>>({ front: null, side: null, back: null });
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState<number | "">("");
  const [phase, setPhase] = useState<"idle" | "loading" | "error">("idle");
  const [result, setResult] = useState<{ m: Measurements; d: Detection } | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  // Warm the model up while the visitor picks photos.
  useEffect(() => {
    void getLandmarker().catch(() => {});
  }, []);

  async function run() {
    if (!photos.front) return;
    setPhase("loading");
    setSaved(false);
    try {
      const [front, side, back] = await Promise.all([detect(photos.front), photos.side ? detect(photos.side) : null, photos.back ? detect(photos.back) : null]);
      const m = front && measure(front, height, weight === "" ? null : weight, side, back);
      if (!front || !m) return setPhase("error");
      setResult({ m, d: front });
      setPhase("idle");
    } catch {
      setPhase("error");
    }
  }

  const rows: [string, number][] = result
    ? [[t("shoulders"), result.m.shouldersCm], [t("chest"), result.m.chestCm], [t("waist"), result.m.waistCm], [t("hips"), result.m.hipsCm], [t("inseam"), result.m.inseamCm]]
    : [];

  return (
    <div className="flex flex-col gap-10">
      <p className="border border-bone/30 bg-smoke p-4 text-sm text-bone">🔒 {t("privacy")}</p>
      <div className="grid grid-cols-2 gap-4 sm:max-w-md">
        <label className="flex flex-col gap-1 text-xs text-dust">{t("height")}<input type="number" min={140} max={220} value={height} onChange={(e) => setHeight(Number(e.target.value))} className="min-h-11 border border-ash bg-smoke px-3 text-bone" /></label>
        <label className="flex flex-col gap-1 text-xs text-dust">{t("weight")}<input type="number" min={35} max={200} value={weight} onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : "")} className="min-h-11 border border-ash bg-smoke px-3 text-bone" /></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {(["front", "side", "back"] as const).map((slot) => (
          <PhotoInput key={slot} label={t(slot)} value={photos[slot]} onChange={(src) => setPhotos((p) => ({ ...p, [slot]: src }))} />
        ))}
      </div>
      <button type="button" onClick={run} disabled={!photos.front || phase === "loading"} className="min-h-12 self-start bg-bone px-10 font-display tracking-[0.3em] text-ink uppercase disabled:opacity-40">
        {phase === "loading" ? t("analyzing") : t("analyze")}
      </button>
      {phase === "error" && <p className="text-sm text-blood" role="alert">{t("noBody")}</p>}

      {result && (
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <ResultCanvas detection={result.d} result={result.m} />
          <div className="flex flex-col gap-5">
            <h2 className="street-heading text-3xl">{t("results")}</h2>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              {rows.map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-ash py-1.5"><dt className="text-steel">{k}</dt><dd className="text-bone" dir="ltr">{v} cm</dd></div>
              ))}
            </dl>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[[t("top"), result.m.top], [t("bottom"), result.m.bottom], [t("shoe"), result.m.shoeUS]].map(([k, v]) => (
                <div key={String(k)} className="flex flex-col gap-1 border border-bone/50 p-3">
                  <span className="text-[11px] text-dust">{k}</span>
                  <span className="font-display text-3xl text-chrome" dir="ltr">{v}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-dust">{t("approx")}</p>
            {loggedIn ? (
              <button
                type="button"
                disabled={pending || saved}
                onClick={() =>
                  startTransition(async () => {
                    const res = await saveSizePassport({
                      top: result.m.top as "M",
                      bottom: result.m.bottom as "32",
                      shoeUS: result.m.shoeUS,
                      heightCm: height,
                      weightKg: weight === "" ? null : weight,
                    });
                    setSaved(res.ok);
                  })
                }
                className="min-h-11 border border-bone/70 text-xs tracking-[0.2em] text-bone uppercase hover:bg-bone hover:text-ink disabled:opacity-60"
              >
                {saved ? `✓ ${t("saved")}` : t("save")}
              </button>
            ) : (
              <Link href="/login?next=/size-finder" className="text-sm text-bone underline underline-offset-4">{t("login")}</Link>
            )}
          </div>
        </section>
      )}
      <p className="text-xs text-dust">{t("manual")}</p>
    </div>
  );
}
