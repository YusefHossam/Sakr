"use client";

import { useEffect, useRef } from "react";

/**
 * A chrome falcon built from layered SVG shapes in CSS 3D: the whole bird tilts toward the cursor, the head turns
 * further than the body, and the wings breathe. It is an illustration in perspective, not a modelled mesh.
 * Touch devices and reduced-motion visitors get it standing still.
 */
export function Falcon3D() {
  const rig = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rig.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let targetX = 0, targetY = 0, x = 0, y = 0, raf = 0;
    const onMove = (e: PointerEvent) => {
      targetX = (e.clientX / innerWidth - 0.5) * 2;
      targetY = (e.clientY / innerHeight - 0.5) * 2;
    };
    const tick = () => {
      x += (targetX - x) * 0.07;
      y += (targetY - y) * 0.07;
      el.style.setProperty("--yaw", `${x * 26}deg`);
      el.style.setProperty("--pitch", `${-y * 12}deg`);
      el.style.setProperty("--head", `${x * 38}deg`);
      raf = requestAnimationFrame(tick);
    };
    addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const WING = "M196 118 C150 78 86 66 16 96 L52 104 L26 128 L68 130 L50 156 L96 150 L88 176 L140 166 L124 190 L170 178 L196 200 Z";
  const paint = { fill: "url(#falcon-chrome)", stroke: "rgba(0,0,0,0.55)", strokeWidth: 1.5, strokeLinejoin: "round" as const };

  return (
    <div className="falcon" aria-hidden="true" dir="ltr">
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="falcon-chrome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fafafa" />
            <stop offset="0.44" stopColor="#a3a3a3" />
            <stop offset="0.52" stopColor="#2e2e2e" />
            <stop offset="0.72" stopColor="#d4d4d4" />
            <stop offset="1" stopColor="#5c5c5c" />
          </linearGradient>
        </defs>
      </svg>
      <div ref={rig} className="falcon-rig">
        <svg viewBox="0 0 400 300" className="falcon-layer falcon-wing falcon-wing-l"><path d={WING} {...paint} /></svg>
        <svg viewBox="0 0 400 300" className="falcon-layer falcon-wing falcon-wing-r"><g transform="translate(400 0) scale(-1 1)"><path d={WING} {...paint} /></g></svg>
        <svg viewBox="0 0 400 300" className="falcon-layer falcon-body">
          <path d="M184 226 L200 286 L216 226 Z" {...paint} />
          <path d="M200 62 C180 62 168 84 170 112 C172 154 184 206 200 262 C216 206 228 154 230 112 C232 84 220 62 200 62 Z" {...paint} />
        </svg>
        <svg viewBox="0 0 400 300" className="falcon-layer falcon-head">
          <circle cx="200" cy="78" r="17" {...paint} />
          <path d="M200 86 C206 90 209 98 206 106 C202 102 198 98 200 86 Z" fill="#161616" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
          <path d="M191 83 L187 99 M209 83 L213 99" stroke="#161616" strokeWidth="3" strokeLinecap="round" />
          <circle cx="193" cy="75" r="2.4" fill="#e4e4e4" />
          <circle cx="207" cy="75" r="2.4" fill="#e4e4e4" />
        </svg>
      </div>
    </div>
  );
}
