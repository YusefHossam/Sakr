"use client";

import dynamic from "next/dynamic";

const TrackMap = dynamic(() => import("./track-map"), { ssr: false, loading: () => <div className="h-72 animate-pulse bg-smoke" /> });

export function TrackMapLoader(props: { to: [number, number]; progress: number }) {
  return <TrackMap {...props} />;
}
