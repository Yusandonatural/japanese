// Interactive chunk-card sentence builder: tap-to-place, tap-to-drop, tap-to-move.
import { chunkCard, shuffle } from './app.js';

/**
 * Build a "組む" (assemble) widget: shuffled chunk bank + core fixed at the end slot.
 * Returns { el, check(): {ok, correctOrder} }
 */
export function buildWidget(ex, opts = {}) {
  const wrap = document.createElement('div');
  const bank = document.createElement('div'); bank.className = 'bank';
  const slot = document.createElement('div'); slot.className = 'sentence';
  const placed = [];
  const pool = shuffle(ex.chunks.map((c, i) => ({ c, i })));

  function renderBank() {
    bank.innerHTML = '';
    pool.forEach(({ c, i }) => {
      if (placed.includes(i)) return;
      const card = chunkCard(c, { idx: i, particles: opts.particles });
      card.addEventListener('click', () => { placed.push(i); render(); });
      bank.appendChild(card);
    });
  }
  function renderSlot() {
    slot.innerHTML = '';
    placed.forEach(i => {
      const c = ex.chunks[i];
      const card = chunkCard(c, { idx: i, particles: opts.particles, gloss: false });
      card.classList.add('selected');
      card.addEventListener('click', () => { placed.splice(placed.indexOf(i), 1); render(); });
      slot.appendChild(card);
    });
    const core = chunkCard(ex.core, { core: true, gloss: false }); core.classList.add('locked');
    slot.appendChild(core);
    const punct = document.createElement('span'); punct.className = 'punct' + (ex.question ? ' q-mark' : ''); punct.textContent = ex.question ? '↗' : '。';
    slot.appendChild(punct);
  }
  function render() { renderBank(); renderSlot(); }
  render();
  wrap.append(bank, document.createElement('hr'), slot);

  function check() {
    if (placed.length !== ex.chunks.length) return { ok: false, reason: 'incomplete' };
    // any order is fine unless fixedOrder groups require relative order
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
