// Shared helpers: data loading, settings, rendering of chunk cards, header.
import { kanaToRomaji, romajiParticle, chunkRomaji, coreRomaji } from './romaji.js';
import { parseEx, exKana, exRomaji } from './exparse.js';
import { speak, canSpeak } from './speech.js';

export const BASE = document.documentElement.dataset.base || './';
const cache = new Map();

export async function loadJSON(rel) {
  if (cache.has(rel)) return cache.get(rel);
  const p = fetch(BASE + rel).then(r => { if (!r.ok) throw new Error('load failed: ' + rel); return r.json(); });
  cache.set(rel, p);
  return p;
}
export const loadParticles = () => loadJSON('data/particles.json');
export const loadScenes = () => loadJSON('data/scenes.json');
export const loadConfusions = () => loadJSON('data/confusions.json');
export const loadAdverbs = () => loadJSON('data/adverbs.json');
export const loadLessons = () => loadJSON('data/lessons.json');
export const loadGrammar = () => loadJSON('data/grammar.json');
export const loadPhrases = () => loadJSON('data/phrases.json');
export const loadVocab = () => loadJSON('data/vocab.json');
export const loadChapter = n => loadJSON(`data/ch${String(n).padStart(2, '0')}.json`);
export async function loadChapters(list) { const all = await Promise.all(list.map(loadChapter)); return all.flat(); }
export const loadAll = () => loadChapters([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

export const CHAPTERS = [
  { n: 1, days: [1], title: 'Core only', ja: 'かくだけで はなす', sub: 'One word is a sentence. Greetings, time words, bare nouns.', particles: [] },
  { n: 2, days: [2], title: 'は and が', ja: 'は と が', sub: 'Topic vs. doer. Introduce yourself, describe people and things.', particles: ['は', 'が'] },
  { n: 3, days: [3], title: 'を and に', ja: 'を と に', sub: 'Target and goal: what you buy, where you go, who you tell.', particles: ['を', 'に'] },
  { n: 4, days: [4], title: 'で and と', ja: 'で と と', sub: 'Place of action, means, and “with”.', particles: ['で', 'と'] },
  { n: 5, days: [5, 6], title: 'へ・から・まで', ja: 'へ・から・まで', sub: 'Direction, start and end points, spans of time.', particles: ['へ', 'から', 'まで'] },
  { n: 6, days: [7], title: 'も and の', ja: 'も と の', sub: '“Also”, and linking nouns with の inside a chunk.', particles: ['も'] },
  { n: 7, days: [8, 9], title: 'Move the chunks', ja: 'にもつを うごかす', sub: 'Same sentence, new order, new emphasis. All ten tags.', particles: [] },
  { n: 8, days: [10], title: 'Drop the chunks', ja: 'にもつを はぶく', sub: 'Answer with only what is new. Context does the rest.', particles: [] },
  { n: 9, days: [11, 12], title: 'Decorate the chunks', ja: 'にもつを かざる', sub: 'Adjectives, の-links, numbers and colours inside a chunk.', particles: [] },
  { n: 10, days: [13, 14], title: 'Talk in scenes', ja: 'ばめんで はなす', sub: 'Twelve real-life scenes, start to finish. Final test.', particles: [] }
];
export const chapterFor = n => CHAPTERS.find(c => c.n === Number(n));
export const particlesUpTo = (parts, n) => n >= 7 ? parts.map(p => p.p) : parts.filter(p => p.chapter <= n).map(p => p.p);

// ---------- settings ----------
const SKEY = 'tags.settings';
export function getSettings() {
  try { return Object.assign({ script: 'kana', romaji: true, kanji: false, voice: true, rate: 0.9 }, JSON.parse(localStorage.getItem(SKEY) || '{}')); }
  catch { return { script: 'kana', romaji: true, kanji: false, voice: true, rate: 0.9 }; }
}
export function setSettings(patch) { const s = Object.assign(getSettings(), patch); try { localStorage.setItem(SKEY, JSON.stringify(s)); } catch {} return s; }

// ---------- rendering ----------
export function pColor(p) { if (!p) return 'var(--p-none)'; const base = p.length > 1 && p.endsWith('も') ? p.slice(0, -1) : p; return `var(--p-${base})`; }
export function roleLabel(c, particles) {
  if (c.role === 'time') return 'time';
  if (c.role === 'bare') return 'noun';
  const p = particles.find(x => x.p === c.p);
  return p ? p.label.toLowerCase() : c.role;
}

/** Build a chunk card element. c = {w,k,p,role,gloss} ; opts: {core, particles, showRole, locked} */
export function chunkCard(c, opts = {}) {
  const s = getSettings();
  const el = document.createElement('div');
  el.className = 'chunk' + (opts.core ? ' core' : '') + (!opts.core && !c.p ? ' none' : '') + (s.kanji ? ' kanji' : '') + (opts.locked ? ' locked' : '');
  el.dataset.idx = opts.idx ?? '';
  const role = document.createElement('div'); role.className = 'role';
  role.textContent = opts.core ? 'core' : (opts.particles ? roleLabel(c, opts.particles) : (c.role || ''));
  const word = document.createElement('div'); word.className = 'word';
  const w = document.createElement('span'); w.className = 'w'; w.textContent = c.k; w.dataset.kanji = c.w !== c.k ? c.w : '';
  word.appendChild(w);
  if (c.p) { const p = document.createElement('span'); p.className = 'p'; p.textContent = c.p; p.style.background = pColor(c.p); word.appendChild(p); }
  const roma = document.createElement('div'); roma.className = 'roma';
  roma.textContent = opts.core ? coreRomaji(c.k) : chunkRomaji(c);
  if (s.romaji === false) roma.style.display = 'none';
  el.append(role, word, roma);
  if (opts.gloss !== false && c.gloss) { const g = document.createElement('div'); g.className = 'roma'; g.textContent = c.gloss; g.style.fontStyle = 'italic'; el.appendChild(g); }
  return el;
}

/** Static sentence view (chunks + core + punctuation). */
export function sentenceView(ex, opts = {}) {
  const box = document.createElement('div'); box.className = 'sentence';
  ex.chunks.forEach((c, i) => box.appendChild(chunkCard(c, { idx: i, particles: opts.particles, gloss: opts.gloss })));
  box.appendChild(chunkCard(ex.core, { core: true, gloss: opts.gloss }));
  const punct = document.createElement('span'); punct.className = 'punct' + (ex.question ? ' q-mark' : ''); punct.textContent = ex.question ? '？' : '。';
  box.appendChild(punct);
  return box;
}

/** Plain text of a sentence for display or speech, in kana. */
export function kanaText(chunks, core, question) {
  return chunks.map(c => c.k + c.p).join(' ') + ' ' + core.k + (question ? '？' : '。');
}
export function romajiText(chunks, core, question) {
  const parts = chunks.map(chunkRomaji); parts.push(coreRomaji(core.k));
  let s = parts.join(' '); s = s[0].toUpperCase() + s.slice(1);
  return s + (question ? '?' : '.');
}
/** HTML for inline sentence with coloured particles (list views). */
export function inlineKana(ex) {
  const esc = t => t.replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
  return ex.chunks.map(c => esc(c.k) + (c.p ? `<b style="color:${pColor(c.p)}">${c.p}</b>` : '')).join(' ') + ' ' + esc(ex.core.k) + (ex.question ? '<span class="q-mark">？</span>' : '。');
}

// ---------- header ----------
export function renderHeader(active) {
  const h = document.createElement('header'); h.className = 'top';
  const links = [['', 'Home'], ['lesson/', 'Lessons'], ['grammar/', 'Grammar'], ['words/', 'Words'], ['scenes/', 'Scenes'], ['progress/', 'Progress']];
  h.innerHTML = `<a class="brand" href="${BASE}">にほんご Tags</a><nav>${links.map(([p, t]) => `<a href="${BASE}${p}" class="${active === t.toLowerCase() ? 'on' : ''}">${t}</a>`).join('')}</nav>`;
  document.body.prepend(h);
}
export function renderFooter() {
  const f = document.createElement('footer');
  f.innerHTML = `Tag Grammar · 2000 real-life sentences · <a href="${BASE}print/">Printable workbooks</a> · <a href="https://yusando.com" rel="noopener">Yusando</a>`;
  document.body.appendChild(f);
}
// ---------- compact examples ("わたし.は おちゃ.を のみます。|I drink tea.") ----------
const escH = t => String(t).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
/** Inline HTML for Japanese text inside prose: kana stays, particles get no colour. */
export function esc(t) { return escH(t); }
/** Render one example string as a block: coloured kana line (+ speak button), romaji, English. */
export function exBlock(str, opts = {}) {
  const ex = typeof str === 'string' ? parseEx(str) : str;
  const s = getSettings();
  const el = document.createElement('div'); el.className = 'exb' + (opts.wrong ? ' wrong' : '') + (opts.right ? ' right' : '');
  const ja = ex.chunks.map(c => `<span class="ck">${escH(c.k)}${c.p ? `<b class="tg" style="color:${pColor(c.p)}">${escH(c.p)}</b>` : ''}</span>`).join(' ')
    + ` <span class="ck core">${escH(ex.core.k)}</span>` + (ex.question ? '<span class="q-mark">？</span>' : '');
  el.innerHTML = `<div class="exb-ja">${opts.wrong ? '<span class="mark">✗</span>' : opts.right ? '<span class="mark">✓</span>' : ''}${ja}</div>`
    + (s.romaji !== false ? `<div class="exb-ro">${escH(exRomaji(ex))}</div>` : '')
    + (ex.en ? `<div class="exb-en">${escH(ex.en)}</div>` : '');
  if (canSpeak() && !opts.wrong) {
    const b = document.createElement('button'); b.className = 'say'; b.type = 'button'; b.title = 'Listen'; b.textContent = '🔊';
    b.addEventListener('click', () => speak(exKana(ex), s.rate || 0.9));
    el.querySelector('.exb-ja').appendChild(b);
  }
  return el;
}
/** Chunk-card view (the big coloured cards) from an example string. */
export function exCards(str, opts = {}) {
  const ex = parseEx(str);
  ex.chunks.forEach(c => { if (!c.p) c.role = /^(きょう|あした|きのう|いま|まいにち|まいあさ|こんばん|らいしゅう|せんしゅう|けさ|ゆうべ|あとで|もう|すぐ|いつ)$/.test(c.k) ? 'time' : 'bare'; });
  return sentenceView(ex, { particles: opts.particles, gloss: false });
}
export { parseEx, exKana, exRomaji };

export function qs(name) { return new URLSearchParams(location.search).get(name); }
export function shuffle(arr, rnd = Math.random) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export { kanaToRomaji, romajiParticle, chunkRomaji, coreRomaji };
