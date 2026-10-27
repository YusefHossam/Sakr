"use client";

import { useEffect, useRef } from "react";

// One bat silhouette (60×30), drawn with its wings scaled to flap.
const BAT_PATH =
  "M30 12 C27 6 22 4 16 6 C12 2 6 2 0 8 C6 8 9 12 10 16 C13 13 17 14 19 18 C22 15 26 16 28 20 L30 24 L32 20 C34 16 38 15 41 18 C43 14 47 13 50 16 C51 12 54 8 60 8 C54 2 48 2 44 6 C38 4 33 6 30 12 Z";

type Bat = { x: number; y: number; vx: number; vy: number; size: number; phase: number; speed: number };

/** Bats drifting across the screen; they scatter away from the cursor. */
export function Bats({ count = 7 }: { count?: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const BAT = new Path2D(BAT_PATH);

    let width = 0;
    let height = 0;
    const dpr = Math.min(devicePixelRatio, 2);
    const resize = () => {
      width = innerWidth;
      height = innerHeight;
      el.width = width * dpr;
      el.height = height * dpr;
    };
    resize();

    const bats: Bat[] = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height * 0.7,
      vx: (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.8),
      vy: (Math.random() - 0.5) * 0.4,
      size: 0.35 + Math.random() * 0.55,
      phase: Math.random() * Math.PI * 2,
      speed: 0.18 + Math.random() * 0.12,
    }));

    const mouse = { x: -9999, y: -9999 };
    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    let frame = 0;
    const tick = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      for (const b of bats) {
        const dx = b.x - mouse.x;
        const dy = b.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 160) {
          // Scatter: push away from the cursor and flap faster.
          b.vx += (dx / dist) * 0.6;
          b.vy += (dy / dist) * 0.6;
          b.phase += 0.25;
        }
        b.vx = Math.max(-4, Math.min(4, b.vx * 0.985 + (Math.sign(b.vx) || 1) * 0.01));
        b.vy = Math.max(-3, Math.min(3, b.vy * 0.97 + Math.sin(b.phase * 0.3) * 0.03));
        b.x += b.vx;
        b.y += b.vy;
        b.phase += b.speed;
        if (b.x < -80) b.x = width + 60;
        if (b.x > width + 80) b.x = -60;
        if (b.y < -60) b.y = height * 0.6;
        if (b.y > height + 60) b.y = 20;

        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.scale(b.size * (b.vx < 0 ? -1 : 1), b.size * (0.45 + Math.abs(Math.sin(b.phase)) * 0.75));
        ctx.translate(-30, -15);
        ctx.fillStyle = "rgba(150,150,150,0.55)";
        ctx.fill(BAT);
        ctx.restore();
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    addEventListener("resize", resize);
    addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("resize", resize);
      removeEventListener("pointermove", onMove);
    };
  }, [count]);

  return <canvas ref={canvas} aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 h-full w-full" />;
}
