// Game layer (Duolingo-style): XP, daily streak, daily goal, sounds and a confetti burst.
// Everything lives in localStorage on this device, next to the SRS data in srs.js.
const KEY = 'tags.game.v1';
export const GOALS = [10, 20, 30, 50];
export const HEARTS = 5;

/** Local calendar date, YYYY-MM-DD (streaks follow the learner's own midnight, not UTC). */
export function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function shift(date, n) { const d = new Date(date + 'T12:00:00'); d.setDate(d.getDate() + n); return localDate(d); }

function load() {
  const def = { xp: 0, byDay: {}, streak: 0, best: 0, last: null, goal: 20, sound: true };
  try { return Object.assign(def, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { return def; }
}
function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }

/** Current state; the streak reads 0 once a whole day has been missed. */
export function getGame() {
  const s = load(); const today = localDate();
  const alive = s.last === today || s.last === shift(today, -1);
  return { ...s, streak: alive ? s.streak : 0, today: s.byDay[today] || 0, doneToday: s.last === today };
}

/** Add XP for today. Returns { xp, today, streak, streakUp, goalReached }. */
export function addXP(n) {
  const s = load(); const today = localDate();
  const before = s.byDay[today] || 0;
  let streakUp = false;
  if (n > 0 && s.last !== today) {
    s.streak = s.last === shift(today, -1) ? s.streak + 1 : 1;
    s.last = today; streakUp = true;
    s.best = Math.max(s.best || 0, s.streak);
  }
  s.xp += n; s.byDay[today] = before + n;
  save(s);
  return { xp: s.xp, today: s.byDay[today], streak: s.streak, streakUp, goalReached: before < s.goal && s.byDay[today] >= s.goal };
}
export function setGoal(goal) { const s = load(); s.goal = goal; save(s); }
export function setSound(on) { const s = load(); s.sound = on; save(s); }
export function resetGame() { try { localStorage.removeItem(KEY); } catch {} }
/** XP for the last n days, oldest first: [{ date, xp }]. */
export function lastDays(n = 7) {
  const s = load(); const today = localDate();
  return Array.from({ length: n }, (_, i) => { const date = shift(today, i - n + 1); return { date, xp: s.byDay[date] || 0 }; });
}

// ---------- sounds (tiny WebAudio chimes, no files) ----------
let ctx = null;
function tone(freq, start, dur, type = 'sine', vol = 0.18) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  g.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
  o.connect(g).connect(ctx.destination); o.start(ctx.currentTime + start); o.stop(ctx.currentTime + start + dur + 0.05);
}
export function sound(kind) {
  if (!load().sound) return;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    if (kind === 'ok') { tone(784, 0, .12); tone(1175, .09, .2); }
    else if (kind === 'ng') { tone(220, 0, .18, 'triangle', .2); tone(185, .12, .25, 'triangle', .2); }
    else if (kind === 'done') { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .11, .28)); }
    else if (kind === 'combo') { tone(988, 0, .1); tone(1319, .07, .12); tone(1568, .14, .18); }
  } catch {}
}

// ---------- confetti ----------
export function confetti(ms = 2200) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas'); c.className = 'confetti';
  const dpr = window.devicePixelRatio || 1;
  c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  document.body.appendChild(c);
  const g = c.getContext('2d'); g.scale(dpr, dpr);
  const cols = ['#d49a1a', '#c0452c', '#3e5c3b', '#2f6f9e', '#8a4f9e', '#e0a800'];
  const bits = Array.from({ length: 140 }, () => ({
    x: innerWidth / 2 + (Math.random() - .5) * 120, y: innerHeight * .35,
    vx: (Math.random() - .5) * 14, vy: -Math.random() * 14 - 4, r: Math.random() * 6.28, vr: (Math.random() - .5) * .4,
    w: 6 + Math.random() * 6, h: 4 + Math.random() * 4, c: cols[Math.floor(Math.random() * cols.length)]
  }));
  const t0 = performance.now();
  (function frame(now) {
    g.clearRect(0, 0, innerWidth, innerHeight);
    bits.forEach(b => { b.vy += .35; b.vx *= .99; b.x += b.vx; b.y += b.vy; b.r += b.vr;
      g.save(); g.translate(b.x, b.y); g.rotate(b.r); g.fillStyle = b.c; g.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); g.restore(); });
    if (now - t0 < ms) requestAnimationFrame(frame); else c.remove();
  })(t0);
}
