// Asks image CDNs for a photo no wider than needed. Shopify and Zara resize on the fly; local files are already small WebPs.
export function sized(url: string | null, width: number): string | null {
  if (!url) return url;
  if (url.includes("cdn.shopify.com") || url.includes("/cdn/shop/")) {
    const u = new URL(url, "https://x.invalid");
    u.searchParams.set("width", String(width));
    return url.startsWith("http") ? u.toString() : u.pathname + u.search;
  }
  if (url.includes("static.zara.net")) return url.replace(/([?&])w=\d+/, `$1w=${width}`);
  return url;
}
