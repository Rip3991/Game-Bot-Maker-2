/**
 * Game sound engine — Web Audio API synthesized SFX + real recorded background music.
 */

let ctx: AudioContext | null = null;
let enabled = true;

// ── Background Music (real recorded farm theme, looped via <audio>) ──────────
let musicEl: HTMLAudioElement | null = null;
let musicEnabled = true;
let musicVol = 0.32;

function ensureMusicEl(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!musicEl) {
    musicEl = new Audio(new URL('../assets/farm-theme.mp3', import.meta.url).href);
    musicEl.loop = true;
    musicEl.volume = musicVol;
    musicEl.preload = 'auto';
  }
  return musicEl;
}

export function initBackgroundMusic() {
  if (typeof window === 'undefined') return;
  const el = ensureMusicEl();
  if (!el || !musicEnabled) return;
  el.play().catch(() => {
    // Autoplay blocked until a user gesture — resumeBackgroundMusic() covers that.
  });
}

export function resumeBackgroundMusic() {
  if (!musicEnabled) return;
  const el = ensureMusicEl();
  if (!el) return;
  if (el.paused) el.play().catch(() => {});
}

export function setMusicEnabled(val: boolean) {
  musicEnabled = val;
  const el = ensureMusicEl();
  if (!el) return;
  if (!val) {
    el.pause();
  } else {
    el.play().catch(() => {});
  }
}

export function isMusicEnabled() { return musicEnabled; }

export function getMusicVolume(): number { return musicVol; }

export function setMusicVolume(val: number) {
  musicVol = Math.max(0, Math.min(1, val));
  if (musicEl) musicEl.volume = musicVol;
}
// ─────────────────────────────────────────────────────────────────────────────

/* ── Unlock audio on first user gesture (browser autoplay policy) ── */
// Creates ctx if not yet created AND resumes it if suspended.
// Must run inside a user-gesture handler to satisfy autoplay policy.
if (typeof document !== 'undefined') {
  const unlock = () => {
    try {
      if (!ctx) {
        ctx = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    } catch {
      // AudioContext not supported — sounds simply won't play
    }
  };
  document.addEventListener('touchstart', unlock, { once: true, capture: true });
  document.addEventListener('touchend',   unlock, { once: true, capture: true });
  document.addEventListener('click',      unlock, { once: true, capture: true });
  document.addEventListener('keydown',    unlock, { once: true, capture: true });
}

function getCtx(): AudioContext | null {
  if (!enabled) return null;
  try {
    if (!ctx) {
      ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    // Always try to resume (safe to call repeatedly)
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  } catch {
    return null;
  }
}

export function setSoundEnabled(val: boolean) {
  enabled = val;
}

export function isSoundEnabled() {
  return enabled;
}

function makeEnvelope(
  ac: AudioContext,
  gain: GainNode,
  attackTime: number,
  peakGain: number,
  decayTime: number,
  sustainGain: number,
  releaseTime: number,
  totalDuration: number,
) {
  const now = ac.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peakGain, now + attackTime);
  gain.gain.linearRampToValueAtTime(sustainGain, now + attackTime + decayTime);
  gain.gain.setValueAtTime(sustainGain, now + totalDuration - releaseTime);
  gain.gain.linearRampToValueAtTime(0, now + totalDuration);
}

/* ── Coin / purchase ── */
export function playCoinSound() {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;

  for (let i = 0; i < 3; i++) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880 + i * 280, now + i * 0.07);
    osc.frequency.exponentialRampToValueAtTime(1200 + i * 300, now + i * 0.07 + 0.08);
    gain.gain.setValueAtTime(0.25, now + i * 0.07);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.2);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now + i * 0.07);
    osc.stop(now + i * 0.07 + 0.2);
  }
}

/* ── Unlock / level up ── */
export function playUnlockSound() {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const freqs = [523, 659, 784, 1046];
  freqs.forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, now + i * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.35);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now + i * 0.1);
    osc.stop(now + i * 0.1 + 0.35);
  });
}

/* ── Income tick (soft) ── */
export function playIncomeSound() {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sine';
  osc.frequency.value = 660;
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.12);
}

/* ── Animal sounds ── */

/** 🐔 Chicken cluck */
export function playChickenSound() {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;

  for (let i = 0; i < 2; i++) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, now + i * 0.14);
    osc.frequency.exponentialRampToValueAtTime(600, now + i * 0.14 + 0.09);
    gain.gain.setValueAtTime(0.18, now + i * 0.14);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.1);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now + i * 0.14);
    osc.stop(now + i * 0.14 + 0.11);
  }
}

/** 🐄 Cow moo */
export function playCowSound() {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(120, now);
  osc.frequency.linearRampToValueAtTime(100, now + 0.3);
  osc.frequency.linearRampToValueAtTime(90, now + 0.7);
  makeEnvelope(ac, gain, 0.05, 0.3, 0.1, 0.2, 0.3, 0.7);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.75);
}

/** 🐑 Sheep baa */
export function playSheepSound() {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sawtooth';
  // Create vibrato with LFO
  const lfo = ac.createOscillator();
  const lfoGain = ac.createGain();
  lfo.frequency.value = 7;
  lfoGain.gain.value = 8;
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  osc.frequency.value = 320;
  makeEnvelope(ac, gain, 0.04, 0.2, 0.05, 0.15, 0.2, 0.5);
  osc.connect(gain);
  gain.connect(ac.destination);
  lfo.start(now);
  osc.start(now);
  lfo.stop(now + 0.55);
  osc.stop(now + 0.55);
}

/** 🐷 Pig oink */
export function playPigSound() {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(350, now);
  osc.frequency.linearRampToValueAtTime(240, now + 0.12);
  osc.frequency.linearRampToValueAtTime(280, now + 0.22);
  makeEnvelope(ac, gain, 0.02, 0.15, 0.06, 0.1, 0.12, 0.3);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.32);
}

/** 🐴 Horse neigh */
export function playHorseSound() {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(400, now);
  osc.frequency.exponentialRampToValueAtTime(900, now + 0.2);
  osc.frequency.exponentialRampToValueAtTime(600, now + 0.5);
  makeEnvelope(ac, gain, 0.03, 0.25, 0.1, 0.18, 0.2, 0.6);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.65);
}

/** 🐰 Rabbit (soft squeak) */
export function playRabbitSound() {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(900, now);
  osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.12);
}

/** 🦆 Duck quack */
export function playDuckSound() {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  for (let i = 0; i < 2; i++) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(480, now + i * 0.18);
    osc.frequency.exponentialRampToValueAtTime(320, now + i * 0.18 + 0.12);
    gain.gain.setValueAtTime(0.14, now + i * 0.18);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.13);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now + i * 0.18);
    osc.stop(now + i * 0.18 + 0.15);
  }
}

/** 🐐 Goat meh */
export function playGoatSound() {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.linearRampToValueAtTime(380, now + 0.15);
  osc.frequency.linearRampToValueAtTime(400, now + 0.3);
  makeEnvelope(ac, gain, 0.03, 0.18, 0.08, 0.12, 0.15, 0.4);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.42);
}

/* ── Map section id → animal sound ── */
const ANIMAL_SOUNDS: Record<string, () => void> = {
  chicken: playChickenSound,
  cow: playCowSound,
  sheep: playSheepSound,
  pig: playPigSound,
  horse: playHorseSound,
  rabbit: playRabbitSound,
  duck: playDuckSound,
  goat: playGoatSound,
};

export function playAnimalSound(sectionId: string) {
  const fn = ANIMAL_SOUNDS[sectionId];
  if (fn) fn();
  else playCoinSound();
}
