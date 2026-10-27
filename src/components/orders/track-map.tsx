"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip } from "react-leaflet";

// SAKR warehouse (Zamalek, Cairo).
const WAREHOUSE: [number, number] = [30.0626, 31.2197];

/** Route from the warehouse to the customer; the courier dot moves while the order is out for delivery. */
export default function TrackMap({ to, progress }: { to: [number, number]; progress: number }) {
  const [t, setT] = useState(progress);
  const moving = progress > 0 && progress < 1;

  useEffect(() => {
    if (!moving) return;
    // Drift back and forth around the current leg so "out for delivery" feels live.
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setT(Math.min(0.95, progress + Math.sin((now - start) / 1600) * 0.06));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [moving, progress]);

  const courier: [number, number] = [WAREHOUSE[0] + (to[0] - WAREHOUSE[0]) * t, WAREHOUSE[1] + (to[1] - WAREHOUSE[1]) * t];
  const bounds: [[number, number], [number, number]] = [
    [Math.min(WAREHOUSE[0], to[0]) - 0.01, Math.min(WAREHOUSE[1], to[1]) - 0.01],
    [Math.max(WAREHOUSE[0], to[0]) + 0.01, Math.max(WAREHOUSE[1], to[1]) + 0.01],
  ];

  return (
    <MapContainer bounds={bounds} className="h-72 w-full grayscale invert-[0.9] hue-rotate-180" scrollWheelZoom={false}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Polyline positions={[WAREHOUSE, to]} pathOptions={{ color: "#5f5f5f", dashArray: "6 8", weight: 3 }} />
      <CircleMarker center={WAREHOUSE} radius={7} pathOptions={{ color: "#b9b9b9", fillOpacity: 1 }}>
        <Tooltip permanent direction="top">SAKR</Tooltip>
      </CircleMarker>
      <CircleMarker center={to} radius={7} pathOptions={{ color: "#e4e4e4", fillOpacity: 1 }} />
      {progress > 0 && <CircleMarker center={courier} radius={11} pathOptions={{ color: "#9b111e", fillColor: "#9b111e", fillOpacity: 0.95 }} />}
    </MapContainer>
  );
}
