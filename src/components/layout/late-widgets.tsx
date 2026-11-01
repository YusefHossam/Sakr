"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Decoration and helpers nobody needs to paint the page: their code downloads and runs only once the page is
// loaded and the browser is idle, so they never compete with the content for bandwidth or the main thread.
const Bats = dynamic(() => import("./bats").then((m) => m.Bats), { ssr: false });
const MusicPlayer = dynamic(() => import("./music-player").then((m) => m.MusicPlayer), { ssr: false });
const ChatWidget = dynamic(() => import("./chat-widget").then((m) => m.ChatWidget), { ssr: false });
const CartSync = dynamic(() => import("@/components/cart/cart-sync").then((m) => m.CartSync), { ssr: false });

export function LateWidgets() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const go = () => {
      const run = () => setReady(true);
      if ("requestIdleCallback" in window) idle = window.requestIdleCallback(run, { timeout: 2500 });
      else timer = setTimeout(run, 1200);
    };
    if (document.readyState === "complete") go();
    else addEventListener("load", go, { once: true });
    return () => {
      removeEventListener("load", go);
      if (idle !== undefined) window.cancelIdleCallback(idle);
      clearTimeout(timer);
    };
  }, []);

  if (!ready) return null;
  return (
    <>
      <Bats />
      <MusicPlayer />
      <ChatWidget />
      <CartSync />
    </>
  );
}
