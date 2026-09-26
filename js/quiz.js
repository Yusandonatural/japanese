// Question generation + rendering for the 7 drill/test types (see DATA_SPEC.md §5).
import { chunkCard, kanaToRomaji, chunkRomaji, pColor, shuffle, getSettings, t } from './app.js';
import { buildWidget, dropWidget, moveWidget } from './chunks.js';

export const TYPE_RANGE = { split: [1, 10], tag: [2, 10], build: [1, 10], move: [7, 10], drop: [8, 10], sayit: [3, 10], hear: [4, 10] };
export const TYPE_LABEL = { split: 'Split', tag: 'Tag it', build: 'Build it', move: 'Move it', drop: 'Drop it', sayit: 'Say it', hear: 'Hear it' };

export function allowedTypes(chapter) {
  return Object.entries(TYPE_RANGE).filter(([, [a, b]]) => chapter >= a && chapter <= b).map(([k]) => k);
}

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

/** Pick a random question type suited to ex.chapter, weighted toward types with content. */
export function pickType(ex, rnd = Math.random) {
  let types = allowedTypes(ex.chapter);
  if (ex.chunks.length === 0) types = types.filter(t => !['split', 'tag', 'build', 'move', 'drop'].includes(t) || false);
  if (ex.chunks.length < 2) types = types.filter(t => t !== 'move');
  if (!ex.chunks.some(c => c.omit)) types = types.filter(t => t !== 'drop');
  if (!types.length) types = ['sayit'];
  return types[Math.floor(rnd() * types.length)];
}

/** Render one question into `container`. Returns { check(): boolean, reveal(): void }. */
export function renderQuestion(container, ex, type, opts = {}) {
  container.innerHTML = '';
  const label = el('div', 'small muted', t(TYPE_LABEL[type]) + (opts.showChapter ? ` · ${t('Ch{n}', { n: ex.chapter })}` : ''));
  container.appendChild(label);
  const fn = RENDERERS[type] || RENDERERS.sayit;
  return fn(container, ex, opts);
}

function fullKanaText(ex) { return ex.chunks.map(c => c.k + c.p).join('') + ex.core.k + (ex.question ? '？' : '。'); }

const RENDERERS = {
  // Q1 split — multiple choice: pick the correctly-chunked reading.
  split(container, ex, opts) {
    const q = el('div', 'lead', t('Where do the tags split this sentence?'));
    const target = el('div', 'big', fullKanaText(ex));
    container.append(q, target);
    const correct = ex.chunks.map(c => c.k + (c.p ? '/' + c.p : '')).join(' + ') + ' + ' + ex.core.k;
    const wrongs = makeWrongSplits(ex);
    const choices = shuffle([correct, ...wrongs]);
    const box = el('div', 'choices');
    let picked = null;
    choices.forEach(txt => {
      const b = el('button', 'choice', txt);
      b.addEventListener('click', () => { picked = txt; box.querySelectorAll('.choice').forEach(x => x.classList.remove('ok', 'ng')); b.classList.add('ok'); });
      box.appendChild(b);
    });
    container.appendChild(box);
    return { check: () => ({ ok: picked === correct }), correctText: correct };
  },

  // Q2 tag — fill each blank particle from the 10-tag palette.
  tag(container, ex, opts) {
    const taggable = ex.chunks.filter(c => c.p);
    if (!taggable.length) return RENDERERS.build(container, ex, opts);
    const q = el('div', 'lead', t('Pick the right tag for each highlighted chunk.'));
    container.appendChild(q);
    const row = el('div', 'sentence');
    const answers = new Map();
    ex.chunks.forEach((c, i) => {
      const card = chunkCard({ ...c, p: c.p ? '?' : c.p }, { idx: i, gloss: false });
      if (c.p) card.querySelector('.p') || (() => { const p = el('span', 'p', '?'); p.style.background = 'var(--p-none)'; card.querySelector('.word').appendChild(p); })();
      row.appendChild(card);
    });
    row.appendChild(chunkCard(ex.core, { core: true, gloss: false }));
    container.appendChild(row);
    const upTo = opts.particles.filter(p => opts.availableParticles.includes(p.p));
    taggable.forEach((c, qi) => {
      const line = el('div', 'row');
      line.appendChild(el('span', 'small muted', c.k + ' → '));
      const choices = el('div', 'choices');
      let picked = null;
      shuffle(upTo).forEach(p => {
        const b = el('button', 'choice p', p.p); b.style.background = pColor(p.p); b.style.borderColor = pColor(p.p);
        b.addEventListener('click', () => { picked = p.p; choices.querySelectorAll('.choice').forEach(x => x.style.outline = ''); b.style.outline = '3px solid var(--ink)'; answers.set(c, picked); });
        choices.appendChild(b);
      });
      line.appendChild(choices);
      container.appendChild(line);
    });
    return { check: () => ({ ok: taggable.every(c => answers.get(c) === c.p) }) };
  },

  // Q3 build — assemble the chunk cards (any order unless fixedOrder) + core last.
  build(container, ex, opts) {
    container.appendChild(el('div', 'lead', t('Tap the pieces in an order that works. Core stays last.')));
    const w = buildWidget(ex, opts);
    container.appendChild(w.el);
    return { check: () => w.check() };
  },

  // Q4 move — tap the chunk to bring to the front for emphasis.
  move(container, ex, opts) {
    const movable = ex.chunks.map((c, i) => i).filter(i => !(ex.fixedOrder || []).flat().includes(i) || ex.fixedOrder.every(g => g[0] === i));
    const targetIdx = movable[Math.floor(Math.random() * movable.length)] ?? 0;
    const target = ex.chunks[targetIdx];
    container.appendChild(el('div', 'lead', t('Tap the chunk to bring to the front, to stress "{g}".', { g: target.gloss })));
    const w = moveWidget(ex, targetIdx, opts);
    container.appendChild(w.el);
    return { check: () => w.check() };
  },

  // Q5 drop — tap to remove chunks that a natural reply would omit.
  drop(container, ex, opts) {
    const q = ex.context ? ex.context.q_ja : t('What can you drop when the context is already clear?');
    container.appendChild(el('div', 'lead', q));
    if (ex.context) container.appendChild(el('div', 'small muted', ex.context.q_en));
    const w = dropWidget(ex, opts);
    container.appendChild(w.el);
    return { check: () => w.check() };
  },

  // Q6 sayit — see the English, build the Japanese from a mixed bank of chunks + a couple distractors.
  sayit(container, ex, opts) {
    container.appendChild(el('div', 'lead', ex.en));
    if (ex.context) container.appendChild(el('div', 'small muted', ex.context.q_en));
    const w = buildWidget(ex, opts);
    container.appendChild(w.el);
    return { check: () => w.check() };
  },

  // Q7 hear — play audio (or show romaji if no voice), pick the matching English from 4.
  hear(container, ex, opts) {
    const pool = opts.pool || [];
    const btn = el('button', 'btn', t('🔊 Play'));
    container.appendChild(btn);
    const s = getSettings();
    btn.addEventListener('click', () => opts.speak && opts.speak(fullKanaText(ex), s.rate));
    if (opts.speak) opts.speak(fullKanaText(ex), s.rate);
    const distractors = shuffle([...new Set(pool.filter(o => o.id !== ex.id && o.en !== ex.en).map(o => o.en))]).slice(0, 3);
    const choices = shuffle([ex.en, ...distractors]);
    const box = el('div', 'choices'); let picked = null;
    choices.forEach(txt => { const b = el('button', 'choice', txt); b.addEventListener('click', () => { picked = txt; box.querySelectorAll('.choice').forEach(x => x.classList.remove('ok')); b.classList.add('ok'); }); box.appendChild(b); });
    container.appendChild(box);
    return { check: () => ({ ok: picked === ex.en }) };
  }
};

function makeWrongSplits(ex) {
  const correct = ex.chunks.map(c => c.k);
  const flat = correct.join('') + ex.core.k;
  const out = [];
  // shift a boundary
  if (correct.length >= 2) {
    const alt = correct.slice(); const merged = alt[0] + alt[1]; alt.splice(0, 2, merged);
    out.push(alt.map(k => k).join(' + ') + ' + ' + ex.core.k);
  }
  // swap order
  if (correct.length >= 2) out.push(shuffle(ex.chunks.map(c => c.k)).join(' + ') + ' + ' + ex.core.k);
  // split core off wrong
  out.push(correct.join(' + ') + (ex.core.k.length > 1 ? (' + ' + ex.core.k[0] + ' + ' + ex.core.k.slice(1)) : ' + ' + ex.core.k + 'っ'));
  return out.slice(0, 3);
}
