// Downloads the temporary background tracks (Creative Commons / public domain beats from archive.org)
// into public/music/ and writes public/music/tracks.json with the attribution each license requires.
// Usage: node scripts/fetch-music.mjs
import { mkdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";

const OUT_DIR = path.resolve(import.meta.dirname, "../public/music");
const MAX_BYTES = 12 * 1024 * 1024;

// archive.org item ids, picked for a dark drill/trap mood and a license that allows playback with credit.
// Display names replace the uploaders' keyword-stuffed titles; credits keep the original creator.
const ITEMS = {
  "jamendo-603856": { title: "Codex of Shadows", artist: "Kontraa" },
  THEEYETRAPRAPTRAPINSTRUMENTALBEAT: { title: "The Eye", artist: "Sebastián Lorca Díez (Base Rap)" },
  TrapBeat_201804: { title: "Trap Type Beat", artist: "Sebastián Lorca Díez (Base Rap)" },
  BASERAP_20180210_0120: { title: "Trap Culture", artist: "Sebastián Lorca Díez (Base Rap)" },
  natbombcrap: { title: "Instrumental Trap Track", artist: "808 Master" },
  TrapMan: { title: "TrapMan", artist: "TaintedBeats" },
  "FreeStuffPlease-Simple-Trap-Beat": { title: "Simple Trap Beat", artist: "FreeStuffPlease" },
  // Kontraa (CC BY-ND: free to play with credit, no edits).
  "jamendo-574260": { title: "Black Box", artist: "Kontraa" },
  "jamendo-574105": { title: "Mortal Kombat", artist: "Kontraa" },
  "jamendo-574277": { title: "Taboo", artist: "Kontraa" },
  "jamendo-574012": { title: "Tombstone", artist: "Kontraa" },
  "jamendo-574570": { title: "Parasite", artist: "Kontraa" },
  "jamendo-594109": { title: "Dracula", artist: "Kontraa" },
  "jamendo-574574": { title: "Zodiac", artist: "Kontraa" },
  "jamendo-574075": { title: "Outer Banks", artist: "Kontraa" },
  "jamendo-574573": { title: "Whistle Her", artist: "Kontraa" },
  "jamendo-573987": { title: "Betrayed", artist: "Kontraa" },
  "jamendo-604189": { title: "Time Machine", artist: "Kontraa" },
  "jamendo-573834": { title: "Wrong Time", artist: "Kontraa" },
  "jamendo-574672": { title: "Nasty", artist: "Kontraa" },
  "jamendo-574678": { title: "Flashback", artist: "Kontraa" },
  "jamendo-612881": { title: "Gaslight", artist: "Kontraa" },
  "jamendo-639273": { title: "Misery", artist: "Kontraa" },
  "jamendo-574654": { title: "Goosebumps", artist: "Kontraa" },
  // Non-commercial licenses (CC BY-NC-ND): fine for this showcase, must be swapped before any commercial launch.
  "jamendo-452924": { title: "Dark Trap", artist: "Adi Rambo", nonCommercial: true },
  "jamendo-573780": { title: "Horror Trap", artist: "Adi Rambo", nonCommercial: true },
  "jamendo-524615": { title: "Dark Trap Beat", artist: "Adi Rambo", nonCommercial: true },
  "jamendo-520582": { title: "Woo Walk", artist: "Adi Rambo", nonCommercial: true },
  "jamendo-401857": { title: "Night Shift", artist: "Adi Rambo", nonCommercial: true },
  "jamendo-488572": { title: "Up Time", artist: "The ARTISANS Beats", nonCommercial: true },
};

const exists = (file) => stat(file).then(() => true, () => false);
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

await mkdir(OUT_DIR, { recursive: true });
const tracks = [];

for (const [id, display] of Object.entries(ITEMS)) {
  try {
    const meta = await (await fetch(`https://archive.org/metadata/${id}`)).json();
    const mp3 = meta.files
      ?.filter((f) => /\.mp3$/i.test(f.name) && Number(f.size) <= MAX_BYTES)
      .sort((a, b) => Number(b.size) - Number(a.size))[0];
    if (!mp3) {
      console.warn(`skip ${id}: no mp3 under ${MAX_BYTES / 1e6} MB`);
      continue;
    }
    const file = `${slug(id)}.mp3`;
    const dest = path.join(OUT_DIR, file);
    if (!(await exists(dest))) {
      const res = await fetch(`https://archive.org/download/${id}/${encodeURIComponent(mp3.name)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await writeFile(dest, Buffer.from(await res.arrayBuffer()));
    }
    const m = meta.metadata ?? {};
    const pick = (v) => (Array.isArray(v) ? v[0] : v) ?? "";
    tracks.push({
      src: `/music/${file}`,
      title: display.title,
      artist: display.artist,
      originalTitle: String(pick(m.title)).replace(/\s+/g, " ").trim(),
      nonCommercial: display.nonCommercial ?? false,
      license: pick(m.licenseurl),
      sourceUrl: `https://archive.org/details/${id}`,
    });
    console.log(`✓ ${file} (${(Number(mp3.size) / 1e6).toFixed(1)} MB)`);
  } catch (err) {
    console.error(`✗ ${id}: ${err.message}`);
  }
}

await writeFile(path.join(OUT_DIR, "tracks.json"), JSON.stringify(tracks, null, 2));
console.log(`\n${tracks.length} tracks → public/music/tracks.json`);
