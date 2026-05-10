/* ──────────────────────────────────────────────────────────────
   helpers/chime.js — synthesized brew-end bell.

   Uses the Web Audio API to generate a soft two-note descending
   fifth (G5 → D5), a recognizable "ding-DONG" bell shape that
   reads as a notification without being jarring against the
   calm-tea register. Synthesized rather than file-based so it
   works identically on web and inside the Capacitor WebView,
   with no asset bundling or licensing concerns.

   Browser audio gating: AudioContext can't play until a user
   gesture has happened on the page. SteepScreen mounts in
   response to a "Brew" tap, which counts as a gesture — call
   warmupChime() during mount so the context is alive and ready
   when the timer hits zero a few minutes later.
   ────────────────────────────────────────────────────────────── */

let _ctx = null;

function getCtx() {
  if (_ctx) return _ctx;
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  try {
    _ctx = new Ctor();
  } catch {
    _ctx = null;
  }
  return _ctx;
}

/**
 * Warm up the AudioContext on a user gesture (e.g. SteepScreen
 * mount, which follows a Brew tap) so the chime can fire later
 * without needing a fresh gesture. No-op when the browser doesn't
 * support Web Audio. Safe to call multiple times.
 */
export function warmupChime() {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
}

/**
 * Play a soft two-note bell chime — G5 followed by D5 a beat
 * later. Bell-like envelope: fast attack, exponential decay.
 * Falls silently if the audio context is suspended and can't
 * be resumed (browser policy, page hidden, etc.) — the native
 * LocalNotification + haptic are the reliable path on native;
 * the chime is best-effort sweetener.
 */
export function playBrewChime() {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const playNote = (freq, startOffset, duration, peakGain) => {
    const startTime = ctx.currentTime + startOffset;
    let osc, gain;
    try {
      osc = ctx.createOscillator();
      gain = ctx.createGain();
    } catch {
      return;
    }
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  };

  // G5 → D5 descending fifth, soft peak gain to keep it gentle.
  playNote(783.99, 0,    0.85, 0.22);
  playNote(587.33, 0.42, 1.20, 0.20);
}
