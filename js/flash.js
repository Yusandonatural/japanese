// Instant speaking (瞬間作文): see the meaning, say the Japanese out loud before the timer runs out,
// then reveal the answer, hear it, and grade yourself. Optional microphone check where the
// browser supports speech recognition.
import { sentenceView, t, getSettings, setSettings } from './app.js';
import { speak } from './speech.js';

const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
export const canListen = () => !!SR;

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
const kanaOf = ex => ex.chunks.map(c => c.k + c.p).join('') + ex.core.k + (ex.question ? '？' : '。');
const norm = s => String(s || '').replace(/[、。？?！!\s　・,.]/g, '').replace(/[ァ-ヶ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));

function similarity(a, b) {
  a = norm(a); b = norm(b);
  if (!a || !b) return 0;
  const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return 1 - d[m][n] / Math.max(m, n);
}

/** Render one instant-speaking card. opts.onGraded(ok) is called when the learner grades. */
export function renderFlash(container, ex, opts = {}) {
  const s = getSettings();
  const secs = s.flashSec ?? 6;
  const wrap = el('div', 'flash');

  const prompt = el('div', 'flash-prompt', ex.en);
  const hint = el('div', 'small muted', t('Say it in Japanese, out loud, before time runs out.'));
  const timer = el('div', 'flash-timer'); const fill = el('i'); timer.appendChild(fill);
  const answer = el('div', 'flash-answer'); answer.hidden = true;
  const heard = el('div', 'small flash-heard');
  const actions = el('div', 'row flash-actions');
  const showBtn = el('button', 'btn', t('Show answer'));
  const micBtn = canListen() ? el('button', 'btn ghost', t('🎤 Speak')) : null;
  const speedSel = el('div', 'flash-speed small muted');
  speedSel.append(t('Time:') + ' ');
  [[4, '4s'], [6, '6s'], [10, '10s'], [0, '∞']].forEach(([v, label]) => {
    const b = el('button', 'chipbtn' + (v === secs ? ' on' : ''), label);
    b.type = 'button';
    b.addEventListener('click', () => { setSettings({ flashSec: v }); speedSel.querySelectorAll('.chipbtn').forEach(x => x.classList.toggle('on', x === b)); restartTimer(v); });
    speedSel.appendChild(b);
  });

  actions.appendChild(showBtn); if (micBtn) actions.appendChild(micBtn);
  wrap.append(prompt, hint, timer, actions, heard, answer, speedSel);
  if (ex.context?.q_en) { const c = el('div', 'small muted', '↳ ' + ex.context.q_en); wrap.insertBefore(c, hint); }
  container.appendChild(wrap);

  let revealed = false, raf = 0, t0 = 0, dur = 0, autoOk = null;
  function restartTimer(v) {
    cancelAnimationFrame(raf); dur = v * 1000; t0 = performance.now();
    if (!dur) { fill.style.width = '100%'; timer.classList.add('off'); return; }
    timer.classList.remove('off');
    const tick = now => {
      if (revealed) return;
      const left = Math.max(0, 1 - (now - t0) / dur);
      fill.style.width = (left * 100) + '%';
      timer.classList.toggle('late', left < .3);
      if (left <= 0) reveal(); else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  function reveal() {
    if (revealed) return;
    revealed = true; cancelAnimationFrame(raf);
    fill.style.width = '0%';
    showBtn.remove(); micBtn?.remove(); speedSel.remove();
    answer.hidden = false;
    answer.appendChild(sentenceView(ex, { particles: opts.particles, gloss: false }));
    speak(kanaOf(ex), s.rate || 0.9);
    const again = el('button', 'btn ghost small', '🔊 ' + t('Listen'));
    again.addEventListener('click', () => speak(kanaOf(ex), s.rate || 0.9));
    const grade = el('div', 'row flash-grade');
    const yes = el('button', 'btn', t('✓ I said it'));
    const no = el('button', 'btn ghost', t('✗ Not yet'));
    if (autoOk === true) yes.classList.add('suggest'); if (autoOk === false) no.classList.add('suggest');
    const done = ok => { yes.disabled = true; no.disabled = true; (ok ? yes : no).classList.add('picked'); opts.onGraded && opts.onGraded(ok); };
    yes.addEventListener('click', () => done(true));
    no.addEventListener('click', () => done(false));
    grade.append(yes, no, again);
    answer.appendChild(grade);
  }
  showBtn.addEventListener('click', reveal);

  if (micBtn) micBtn.addEventListener('click', () => {
    const rec = new SR(); rec.lang = 'ja-JP'; rec.interimResults = false; rec.maxAlternatives = 3;
    micBtn.disabled = true; micBtn.textContent = t('🎤 Listening…');
    rec.onresult = e => {
      const alts = [...e.results[0]].map(r => r.transcript);
      const best = Math.max(...alts.map(a => Math.max(similarity(a, ex.ja), similarity(a, ex.kana || kanaOf(ex)))));
      autoOk = best >= 0.75;
      heard.textContent = `${t('Heard:')} ${alts[0]}  ${autoOk ? '✓' : '…'}`;
      heard.className = 'small flash-heard ' + (autoOk ? 'ok' : 'ng');
      reveal();
    };
    rec.onerror = () => { micBtn.disabled = false; micBtn.textContent = t('🎤 Speak'); heard.textContent = t('Could not hear you — try again or tap Show answer.'); };
    rec.onend = () => { if (!revealed) { micBtn.disabled = false; micBtn.textContent = t('🎤 Speak'); } };
    try { rec.start(); } catch { micBtn.disabled = false; }
  });

  restartTimer(secs);
  return { selfGraded: true, check: () => ({ ok: false }), destroy: () => cancelAnimationFrame(raf) };
}
