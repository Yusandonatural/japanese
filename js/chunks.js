// Interactive chunk-card sentence builder: tap-to-place, tap-to-drop, tap-to-move.
import { chunkCard, shuffle } from './app.js';

/**
 * Build a "組む" (assemble) widget: every card, the core included, starts in a shuffled bank.
 * Tap to place, tap a placed card to send it back. Correct = all placed, core last.
 * Returns { el, check(): {ok, placed} }
 */
const CORE = 'core';
export function buildWidget(ex, opts = {}) {
  const wrap = document.createElement('div');
  const bank = document.createElement('div'); bank.className = 'bank';
  const slot = document.createElement('div'); slot.className = 'sentence answer';
  const placed = [];
  const pool = shuffle([...ex.chunks.map((c, i) => i), CORE]);
  const card = (i, inBank) => i === CORE
    ? chunkCard(ex.core, { core: true, gloss: false })
    : chunkCard(ex.chunks[i], { idx: i, particles: opts.particles, gloss: inBank ? undefined : false });

  function renderBank() {
    bank.innerHTML = '';
    pool.forEach(i => {
      if (placed.includes(i)) return;
      const c = card(i, true);
      c.addEventListener('click', () => { placed.push(i); render(); });
      bank.appendChild(c);
    });
  }
  function renderSlot() {
    slot.innerHTML = '';
    placed.forEach(i => {
      const c = card(i, false);
      c.classList.add('selected');
      c.addEventListener('click', () => { placed.splice(placed.indexOf(i), 1); render(); });
      slot.appendChild(c);
    });
    if (placed.length === pool.length) {
      const punct = document.createElement('span'); punct.className = 'punct' + (ex.question ? ' q-mark' : ''); punct.textContent = ex.question ? '？' : '。';
      slot.appendChild(punct);
    }
  }
  function render() { renderBank(); renderSlot(); }
  render();
  wrap.append(slot, bank);

  function check() {
    if (placed.length !== pool.length) return { ok: false, reason: 'incomplete' };
    if (placed[placed.length - 1] !== CORE) return { ok: false, reason: 'core-last' };
    // any chunk order is fine unless fixedOrder groups require relative order
    let ok = true;
    for (const group of (ex.fixedOrder || [])) {
      const positions = group.map(gi => placed.indexOf(gi));
      for (let k = 1; k < positions.length; k++) if (positions[k] < positions[k - 1]) ok = false;
    }
    return { ok, placed: placed.slice() };
  }
  return { el: wrap, check, reset: () => { placed.length = 0; render(); } };
}

/**
 * "省く" (drop) widget: full sentence shown, tap chunks to toggle dropped; check against omit flags.
 */
export function dropWidget(ex, opts = {}) {
  const wrap = document.createElement('div');
  const row = document.createElement('div'); row.className = 'sentence';
  const dropped = new Set();
  ex.chunks.forEach((c, i) => {
    const card = chunkCard(c, { idx: i, particles: opts.particles, gloss: false });
    card.addEventListener('click', () => {
      if (dropped.has(i)) dropped.delete(i); else dropped.add(i);
      card.classList.toggle('dropped', dropped.has(i));
    });
    row.appendChild(card);
  });
  const core = chunkCard(ex.core, { core: true, gloss: false }); core.classList.add('locked');
  row.appendChild(core);
  wrap.appendChild(row);
  function check() {
    const wantDrop = new Set(ex.chunks.map((c, i) => c.omit ? i : -1).filter(i => i >= 0));
    if (wantDrop.size !== dropped.size) return { ok: false };
    for (const i of dropped) if (!wantDrop.has(i)) return { ok: false };
    return { ok: true };
  }
  return { el: wrap, check };
}

/**
 * "動かす" (move / emphasize) widget: tap the chunk that should move to the front.
 */
export function moveWidget(ex, targetIdx, opts = {}) {
  const wrap = document.createElement('div');
  const row = document.createElement('div'); row.className = 'sentence';
  let picked = null;
  ex.chunks.forEach((c, i) => {
    const card = chunkCard(c, { idx: i, particles: opts.particles, gloss: false });
    card.addEventListener('click', () => {
      row.querySelectorAll('.chunk').forEach(el => el.classList.remove('selected'));
      card.classList.add('selected');
      picked = i;
    });
    row.appendChild(card);
  });
  wrap.appendChild(row);
  function check() { return { ok: picked === targetIdx }; }
  return { el: wrap, check };
}
