// 3-box Leitner system, keyed by example id, stored in localStorage.
const KEY = 'tags.srs.v1';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}
function save(state) { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} }

/** state[id] = { box: 1|2|3, streak: number, lastSeen: 'YYYY-MM-DD', dueOn: 'YYYY-MM-DD' } */
export function getState() { return load(); }

function today() { return new Date().toISOString().slice(0, 10); }
function addDays(n) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

export function recordAnswer(id, correct) {
  const state = load();
  const cur = state[id] || { box: 1, streak: 0 };
  if (correct) {
    cur.streak = (cur.streak || 0) + 1;
    if (cur.box === 1 && cur.streak >= 1) { cur.box = 2; cur.streak = 0; cur.dueOn = addDays(3); }
    else if (cur.box === 2 && cur.streak >= 2) { cur.box = 3; cur.streak = 0; cur.dueOn = addDays(7); }
    else if (cur.box === 3) { cur.dueOn = addDays(14); }
    else { cur.dueOn = today(); }
  } else {
    cur.box = 1; cur.streak = 0; cur.dueOn = today();
  }
  cur.lastSeen = today();
  state[id] = cur;
  save(state);
  return cur;
}

export function boxOf(id) { return (load()[id] || { box: 1 }).box; }

/** Weight examples so low-accuracy chunks/particles surface more in drills. */
export function weight(id) {
  const s = load()[id];
  if (!s) return 3;          // never seen: high priority
  if (s.box === 1) return 3;
  if (s.box === 2) return 2;
  return 1;
}

export function dueToday(ids) {
  const state = load(); const t = today();
  return ids.filter(id => { const s = state[id]; return !s || !s.dueOn || s.dueOn <= t; });
}

// ---------- per-particle accuracy ----------
const PKEY = 'tags.particleStats.v1';
function loadP() { try { return JSON.parse(localStorage.getItem(PKEY) || '{}'); } catch { return {}; } }
function saveP(s) { try { localStorage.setItem(PKEY, JSON.stringify(s)); } catch {} }

export function recordParticle(p, correct) {
  const key = p || '(none)';
  const s = loadP();
  const cur = s[key] || { right: 0, wrong: 0 };
  if (correct) cur.right++; else cur.wrong++;
  s[key] = cur; saveP(s);
}
export function particleStats() { return loadP(); }
export function particleAccuracy(p) {
  const s = loadP()[p || '(none)'];
  if (!s || (s.right + s.wrong) === 0) return null;
  return s.right / (s.right + s.wrong);
}

// ---------- 14-day progress ----------
const DKEY = 'tags.dayLog.v1';
export function markDayDone(day) {
  const s = loadDayLog(); s[day] = today(); saveDayLog(s);
}
export function loadDayLog() { try { return JSON.parse(localStorage.getItem(DKEY) || '{}'); } catch { return {}; } }
function saveDayLog(s) { try { localStorage.setItem(DKEY, JSON.stringify(s)); } catch {} }
export function isDayDone(day) { return !!loadDayLog()[day]; }
export function daysDoneCount() { return Object.keys(loadDayLog()).length; }

// ---------- chapter test results ----------
const TKEY = 'tags.chapterTests.v1';
export function recordChapterTest(ch, correct, total) {
  const s = loadTests(); s[ch] = { correct, total, at: today() }; saveTests(s);
}
export function loadTests() { try { return JSON.parse(localStorage.getItem(TKEY) || '{}'); } catch { return {}; } }
function saveTests(s) { try { localStorage.setItem(TKEY, JSON.stringify(s)); } catch {} }
