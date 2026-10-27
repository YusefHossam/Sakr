"use client";

import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet";

export type Pin = { lat: number; lng: number };

function ClickToPin({ onPick }: { onPick: (p: Pin) => void }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

/** OpenStreetMap (free) with a tap-to-pin marker. Loaded client-side only. */
export default function PinMap({ pin, onPick }: { pin: Pin | null; onPick: (p: Pin) => void }) {
  const center: [number, number] = pin ? [pin.lat, pin.lng] : [30.0444, 31.2357];
  return (
    <MapContainer key={pin ? "pinned" : "cairo"} center={center} zoom={pin ? 15 : 11} className="h-64 w-full grayscale invert-[0.9] hue-rotate-180" scrollWheelZoom={false}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ClickToPin onPick={onPick} />
      {pin && <CircleMarker center={[pin.lat, pin.lng]} radius={10} pathOptions={{ color: "#9b111e", fillColor: "#9b111e", fillOpacity: 0.9 }} />}
    </MapContainer>
  );
}
