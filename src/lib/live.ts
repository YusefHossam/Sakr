/** Turns a YouTube/Twitch link into a safe embed URL; anything else is rejected. */
export function safeEmbed(raw: string, parent = "localhost"): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.slice(1);
    return /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    const id = url.pathname.startsWith("/embed/") || url.pathname.startsWith("/live/") ? url.pathname.split("/")[2] : url.searchParams.get("v");
    return id && /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (host === "twitch.tv") {
    const channel = url.pathname.split("/")[1];
    return channel && /^\w{3,25}$/.test(channel) ? `https://player.twitch.tv/?channel=${channel}&parent=${parent}` : null;
  }
  return null;
}
