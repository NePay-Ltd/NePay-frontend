/**
 * A short chime for "an agent replied while you had the chat closed" —
 * synthesized via the Web Audio API, no audio file to host/bundle.
 *
 * One AudioContext is created lazily and reused for the page's lifetime
 * rather than a fresh one per alert, with an explicit resume() on every
 * attempt plus a page-wide first-interaction unlock as a backstop. A
 * freshly-created context is not guaranteed to start 'running' — browsers
 * frequently start it suspended unless created inside the exact call stack
 * of a user gesture, which an async socket event never is. See the admin
 * panel's queue-alert-sound.ts, which hit exactly this as a real (silent,
 * no-error) bug: tones scheduled against a context that never started
 * ticking, destroyed by its own cleanup timer before ever playing. This
 * mirrors that fix rather than repeating the mistake.
 *
 * A distinct two-note ascending "ding" (rising, not the admin alert's
 * two-tone chime) so the two contexts don't sound identical.
 */
let sharedContext: AudioContext | null = null;
let unlockAttached = false;

function getSharedAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  sharedContext ??= new AudioContextClass();
  return sharedContext;
}

function attachUnlockListener(): void {
  if (unlockAttached || typeof window === "undefined") return;
  unlockAttached = true;
  const unlock = () => { void getSharedAudioContext()?.resume(); };
  (["pointerdown", "keydown"] as const).forEach((event) => window.addEventListener(event, unlock, { once: true, passive: true }));
}
attachUnlockListener();

export function playSupportReplySound(): void {
  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return;
    void ctx.resume();

    const playTone = (frequency: number, startAt: number, duration: number) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      gain.connect(ctx.destination);

      gain.gain.setValueAtTime(0, startAt);
      gain.gain.linearRampToValueAtTime(0.18, startAt + 0.02);
      gain.gain.linearRampToValueAtTime(0, startAt + duration);

      oscillator.start(startAt);
      oscillator.stop(startAt + duration);
    };

    const now = ctx.currentTime;
    playTone(660, now, 0.11);
    playTone(990, now + 0.12, 0.16);
  } catch {
    // Autoplay restrictions or an unsupported browser — a missed chime isn't worth surfacing an error over.
  }
}
