"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import type { FaceLandmarker as FaceLandmarkerType } from "@mediapipe/tasks-vision";

const VISION_VERSION = "0.10.35";
const MODEL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

let landmarkerPromise: Promise<FaceLandmarkerType> | null = null;
// Loaded on demand; the camera feed never leaves the browser (WASM + model come from public CDNs).
function getLandmarker() {
  landmarkerPromise ??= (async () => {
    const { FilesetResolver, FaceLandmarker } = await import("@mediapipe/tasks-vision");
    const fileset = await FilesetResolver.forVisionTasks(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VISION_VERSION}/wasm`);
    return FaceLandmarker.createFromOptions(fileset, { baseOptions: { modelAssetPath: MODEL, delegate: "GPU" }, runningMode: "VIDEO", numFaces: 1 });
  })();
  return landmarkerPromise;
}

/** Product photos sit on flat grey or white. Key that colour out (from the corners) and crop to the item. */
function cutout(img: HTMLImageElement): HTMLCanvasElement {
  const w = 320;
  const h = Math.round((img.naturalHeight / img.naturalWidth) * w) || w;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  try {
    const data = ctx.getImageData(0, 0, w, h);
    const px = data.data;
    const at = (x: number, y: number) => (y * w + x) * 4;
    const corners = [at(2, 2), at(w - 3, 2), at(2, h - 3), at(w - 3, h - 3)];
    const bg = [0, 1, 2].map((k) => corners.reduce((s, i) => s + px[i + k], 0) / 4);
    let minX = w, minY = h, maxX = 0, maxY = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = at(x, y);
        const dist = Math.hypot(px[i] - bg[0], px[i + 1] - bg[1], px[i + 2] - bg[2]);
        const alpha = Math.min(1, Math.max(0, (dist - 22) / 38));
        px[i + 3] = Math.round(alpha * 255);
        if (alpha > 0.5) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
      }
    }
    ctx.putImageData(data, 0, 0);
    if (maxX > minX && maxY > minY) {
      const out = document.createElement("canvas");
      out.width = maxX - minX + 1;
      out.height = maxY - minY + 1;
      out.getContext("2d")!.drawImage(c, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
      return out;
    }
  } catch {
    /* tainted canvas (CDN without CORS): use the photo as it is */
  }
  return c;
}

type Kind = "headwear" | "sunglasses";

/** Try a cap or sunglasses on your own face with the camera. Everything runs on-device. */
export function ArTryOn({ image, kind }: { image: string; kind: Kind }) {
  const locale = useLocale();
  const L = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "live" | "error">("idle");
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!open) return;
    let stopped = false;
    let raf = 0;
    let stream: MediaStream | null = null;

    (async () => {
      setStatus("loading");
      try {
        const photo = new Image();
        photo.crossOrigin = "anonymous";
        photo.src = image;
        await photo.decode().catch(() => undefined);
        const item = cutout(photo);
        const [landmarker, media] = await Promise.all([getLandmarker(), navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 }, audio: false })]);
        stream = media;
        const el = video.current;
        const cv = canvas.current;
        if (stopped || !el || !cv) return;
        el.srcObject = media;
        await el.play();
        cv.width = el.videoWidth || 640;
        cv.height = el.videoHeight || 480;
        const ctx = cv.getContext("2d")!;
        setStatus("live");

        const tick = () => {
          if (stopped) return;
          const W = cv.width, H = cv.height;
          // Mirror like a selfie camera.
          ctx.save();
          ctx.translate(W, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(el, 0, 0, W, H);
          ctx.restore();
          const face = landmarker.detectForVideo(el, performance.now()).faceLandmarks[0];
          cv.dataset.face = face ? "tracked" : "searching"; // lets tests (and devtools) see whether a face is found
          if (face) {
            const p = (i: number) => ({ x: (1 - face[i].x) * W, y: face[i].y * H });
            const eyeA = p(33), eyeB = p(263);
            const [left, right] = eyeA.x < eyeB.x ? [eyeA, eyeB] : [eyeB, eyeA];
            const roll = Math.atan2(right.y - left.y, right.x - left.x);
            const eyes = { x: (left.x + right.x) / 2, y: (left.y + right.y) / 2 };
            const aspect = item.height / item.width;
            let w: number, cx: number, cy: number;
            if (kind === "sunglasses") {
              w = Math.hypot(right.x - left.x, right.y - left.y) * 2.3;
              cx = eyes.x;
              cy = eyes.y + w * aspect * 0.04;
            } else {
              const cheekA = p(234), cheekB = p(454);
              const top = p(10);
              w = Math.hypot(cheekA.x - cheekB.x, cheekA.y - cheekB.y) * 1.5;
              cx = top.x;
              cy = top.y - w * aspect * 0.32;
            }
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(roll);
            ctx.drawImage(item, -w / 2, (-w * aspect) / 2, w, w * aspect);
            ctx.restore();
          }
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch (error) {
        console.warn("[ar-try-on]", error);
        if (!stopped) setStatus("error");
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [open, image, kind]);

  const save = () => {
    canvas.current?.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "sakr-try-on.png";
      a.click();
      URL.revokeObjectURL(a.href);
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="self-start text-xs text-steel underline underline-offset-4 hover:text-bone">
        ◉ {open ? L("اقفل الكاميرا", "Close camera") : kind === "sunglasses" ? L("جرّب النضارة على وشك (AR)", "Try the sunglasses on (AR)") : L("جرّب الكاب على راسك (AR)", "Try the cap on (AR)")}
      </button>
      {open && (
        <div className="flex flex-col gap-2 border border-ash p-3">
          <video ref={video} className="hidden" playsInline muted />
          <canvas ref={canvas} className="aspect-[4/3] w-full bg-smoke object-cover" aria-label={L("معاينة الكاميرا", "Camera preview")} />
          <p className="text-xs text-dust" role="status">
            {status === "loading" && L("بنحمّل الكاميرا والموديل…", "Loading the camera and model…")}
            {status === "live" && L("بصّ للكاميرا. الصورة بتفضل على جهازك.", "Look at the camera. The picture stays on your device.")}
            {status === "error" && L("مقدرتش أفتح الكاميرا. اسمح بالكاميرا من المتصفح وجرّب تاني.", "Couldn't open the camera. Allow camera access and try again.")}
          </p>
          {status === "live" && <button type="button" onClick={save} className="self-start border border-bone/60 px-3 py-1.5 text-xs text-bone hover:bg-bone hover:text-ink">{L("احفظ الصورة", "Save photo")}</button>}
        </div>
      )}
    </div>
  );
}
