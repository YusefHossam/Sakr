// Shared Web Audio context. Browsers only allow sound after a user gesture, so the intro's
// ENTER button calls unlockAudio(); everything else checks audioUnlocked() first.
let ctx: AudioContext | null = null;

export function unlockAudio(): void {
  if (typeof window === "undefined") return;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
}

export const audioUnlocked = () => ctx?.state === "running";

/**
 * A synthesized falcon screech (~1s): a harsh, high, falling cry with a little breath noise.
 * Built from oscillators so no sound file (or license) is needed.
 */
export function playScreech(volume = 0.18): void {
  if (!ctx || ctx.state !== "running") return;
  const now = ctx.currentTime;
  const out = ctx.createGain();
  out.gain.setValueAtTime(0.0001, now);
  out.gain.exponentialRampToValueAtTime(volume, now + 0.04);
  out.gain.exponentialRampToValueAtTime(volume * 0.6, now + 0.35);
  out.gain.exponentialRampToValueAtTime(0.0001, now + 1.05);

  // Bandpass gives the nasal, raspy colour of a raptor call.
  const tone = ctx.createBiquadFilter();
  tone.type = "bandpass";
  tone.frequency.value = 2600;
  tone.Q.value = 1.4;
  tone.connect(out).connect(ctx.destination);

  // Carrier: sawtooth sliding from ~3.4 kHz down to ~1.6 kHz, frequency-modulated for the rasp.
  const carrier = ctx.createOscillator();
  carrier.type = "sawtooth";
  carrier.frequency.setValueAtTime(2900, now);
  carrier.frequency.linearRampToValueAtTime(3400, now + 0.12);
  carrier.frequency.exponentialRampToValueAtTime(1600, now + 1);
  const fm = ctx.createOscillator();
  fm.frequency.value = 55;
  const fmDepth = ctx.createGain();
  fmDepth.gain.value = 260;
  fm.connect(fmDepth).connect(carrier.frequency);
  carrier.connect(tone);

  // Breath: a short burst of filtered noise.
  const noise = ctx.createBufferSource();
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.35;
  noise.buffer = buffer;
  noise.connect(tone);

  for (const node of [carrier, fm, noise]) {
    node.start(now);
    node.stop(now + 1.1);
  }
}
