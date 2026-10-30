// Shared Web Audio context. Browsers only allow sound after a user gesture, so the intro's
// ENTER button calls unlockAudio(); everything else checks audioUnlocked() first.
let ctx: AudioContext | null = null;

export function unlockAudio(): void {
  if (typeof window === "undefined") return;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  preloadScreech();
}

export const audioUnlocked = () => ctx?.state === "running";

let screech: AudioBuffer | null = null;
let loading = false;

/** Fetches and decodes the raptor call once, as soon as audio is unlocked. */
function preloadScreech(): void {
  if (!ctx || screech || loading) return;
  loading = true;
  fetch("/sfx/falcon.mp3")
    .then((r) => r.arrayBuffer())
    .then((buf) => ctx!.decodeAudioData(buf))
    .then((decoded) => {
      screech = decoded;
    })
    .catch(() => {
      loading = false; // the synthesized fallback plays meanwhile
    });
}

/**
 * The falcon scream: a real red-tailed hawk recording (the classic movie "eagle" cry), pushed hard
 * through a limiter with a deep sub hit under it so it startles. Falls back to a synthesized cry
 * if the recording hasn't loaded.
 */
export function playScreech(volume = 1): void {
  if (!ctx || ctx.state !== "running") return;
  preloadScreech();
  const now = ctx.currentTime;
  const level = Math.min(1, Math.max(0.2, volume));

  // The limiter lets the call be loud without clipping.
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -14;
  limiter.knee.value = 6;
  limiter.ratio.value = 14;
  limiter.attack.value = 0.002;
  limiter.release.value = 0.25;
  const master = ctx.createGain();
  master.gain.value = 1.9 * level;
  limiter.connect(master).connect(ctx.destination);

  // Sub hit: a fast falling sine that makes the cry hit the chest.
  const boom = ctx.createOscillator();
  const boomGain = ctx.createGain();
  boom.type = "sine";
  boom.frequency.setValueAtTime(110, now);
  boom.frequency.exponentialRampToValueAtTime(38, now + 0.5);
  boomGain.gain.setValueAtTime(0.0001, now);
  boomGain.gain.exponentialRampToValueAtTime(0.9, now + 0.02);
  boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
  boom.connect(boomGain).connect(limiter);
  boom.start(now);
  boom.stop(now + 0.65);

  if (screech) {
    const src = ctx.createBufferSource();
    src.buffer = screech;
    src.playbackRate.value = 0.94; // a touch lower: bigger bird
    const lift = ctx.createBiquadFilter(); // brighten the cry so it cuts
    lift.type = "highshelf";
    lift.frequency.value = 2500;
    lift.gain.value = 5;
    src.connect(lift).connect(limiter);
    src.start(now + 0.01);
    return;
  }

  // Fallback: the synthesized cry.
  const tone = ctx.createBiquadFilter();
  tone.type = "bandpass";
  tone.frequency.value = 2600;
  tone.Q.value = 1.4;
  const out = ctx.createGain();
  out.gain.setValueAtTime(0.0001, now);
  out.gain.exponentialRampToValueAtTime(0.5, now + 0.04);
  out.gain.exponentialRampToValueAtTime(0.0001, now + 1.05);
  tone.connect(out).connect(limiter);
  const carrier = ctx.createOscillator();
  carrier.type = "sawtooth";
  carrier.frequency.setValueAtTime(2900, now);
  carrier.frequency.linearRampToValueAtTime(3400, now + 0.12);
  carrier.frequency.exponentialRampToValueAtTime(1600, now + 1);
  carrier.connect(tone);
  carrier.start(now);
  carrier.stop(now + 1.1);
}
