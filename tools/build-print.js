#!/usr/bin/env node
// Generates print/chNN.html — a printable worksheet (50 fill-in questions + answer key) per chapter.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
// `node tools/build-print.js tr` builds the Turkish worksheets into tr/print/ (the index page is
// converted by tools/build-tr.mjs like the other pages).
const TRMODE = process.argv[2] === 'tr';
const OUT = path.join(ROOT, TRMODE ? 'tr/print' : 'print');
const TRX = TRMODE ? JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tr/ex.json'), 'utf8')) : {};
const L = TRMODE ? {
  back: '← Yazdırılabilir çalışma kitapları', title: ch => `Easy Japanese 14 Days — Bölüm ${ch} Çalışma Kitabı`, doc: ch => `Bölüm ${ch} — Yazdırılabilir Çalışma Kitabı`,
  intro: 'İşaretli parçanın etiketini (は が を に で と へ から まで も) yaz ya da her Türkçe cümlenin Japoncasını yaz. Cevaplar son sayfada.', answers: 'Cevaplar', lang: 'tr'
} : {
  back: '← Printable workbooks', title: ch => `Easy Japanese 14 Days — Chapter ${ch} Workbook`, doc: ch => `Chapter ${ch} — Printable Workbook`,
  intro: 'Fill in the tag (は が を に で と へ から まで も) for the marked chunk, or write the Japanese for each English sentence. Answers on the last page.', answers: 'Answers', lang: 'en'
};
const enOf = ex => (TRMODE && TRX[ex.id]?.tr) || ex.en;

function loadJSON(rel) { return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8')); }
const particles = loadJSON('data/particles.json');
const P_LABEL = Object.fromEntries(particles.map(p => [p.p, p.label]));

function esc(s) { return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }

function seededShuffle(arr, seed) {
  const a = arr.slice();
  let s = seed;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function buildQuestions(examples, chapter) {
  const taggedPool = examples.filter(e => e.chunks.some(c => c.p));
  const picks = seededShuffle(examples, chapter * 97 + 13).slice(0, 50);
  return picks.map((ex, i) => {
    const withBlank = ex.chunks.some(c => c.p) && Math.random_unused !== 1; // always try tag-blank style when possible
    const taggable = ex.chunks.filter(c => c.p);
    if (taggable.length) {
      const target = taggable[(i + chapter) % taggable.length];
      const idx = ex.chunks.indexOf(target);
      const blanked = ex.chunks.map((c, j) => j === idx ? `${c.k}[___]` : (c.k + c.p)).join('') + ex.core.k + (ex.question ? '？' : '。');
      return { n: i + 1, prompt: blanked, en: enOf(ex), answer: target.p, kind: 'tag' };
    }
    return { n: i + 1, prompt: enOf(ex), en: null, answer: ex.kana, kind: 'translate' };
  });
}

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const links = [];
for (let ch = 1; ch <= 10; ch++) {
  const examples = loadJSON(`data/ch${String(ch).padStart(2, '0')}.json`);
  const qs = buildQuestions(examples, ch);
  const rows = qs.map(q => q.kind === 'tag'
    ? `<div class="q"><span class="n">${q.n}.</span><span class="jp">${esc(q.prompt)}</span><span class="en muted">${esc(q.en)}</span></div>`
    : `<div class="q"><span class="n">${q.n}.</span><span class="en">${esc(q.prompt)}</span><span class="blank">＿＿＿＿＿＿＿＿＿＿</span></div>`).join('\n');
  const answers = qs.map(q => `<span class="a"><b>${q.n}.</b> ${esc(q.answer)}</span>`).join(' ');
  const html = `<!doctype html>
<html lang="${L.lang}">
<head><meta charset="utf-8"><title>${L.doc(ch)}</title>
<style>
  body{font-family:'Hiragino Sans','Noto Sans JP',Arial,sans-serif;max-width:800px;margin:24px auto;padding:0 16px;color:#1f1f1f}
  h1{font-size:20px} .q{margin:10px 0;line-height:1.6} .n{font-weight:700;margin-right:6px}
  .jp{font-size:18px} .en{display:block;color:#666;font-size:13px;margin-left:22px}
  .blank{display:inline-block;margin-left:8px;color:#999}
  .answers{margin-top:40px;padding-top:16px;border-top:2px solid #333;font-size:13px;color:#444}
  .answers .a{display:inline-block;margin:2px 10px 2px 0}
  @media print{ .answers{page-break-before:always} a{color:inherit;text-decoration:none} }
  .top{margin-bottom:20px} .top a{color:#2f6f5e;text-decoration:none;font-size:13px}
</style></head>
<body>
<div class="top"><a href="./">${L.back}</a></div>
<h1>${L.title(ch)}</h1>
<p class="muted" style="color:#666;font-size:13px">${L.intro}</p>
${rows}
<div class="answers"><b>${L.answers}</b><br>${answers}</div>
</body></html>`;
  fs.writeFileSync(path.join(OUT, `ch${String(ch).padStart(2, '0')}.html`), html, 'utf8');
  links.push(ch);
}

if (TRMODE) { console.log(`Generated ${links.length} Turkish workbooks.`); process.exit(0); }
const indexHtml = `<!doctype html>
<html lang="en" data-base="../">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Printable Workbooks — Easy Japanese 14 Days</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap"><link rel="stylesheet" href="../css/tags.css"></head>
<body><main class="wrap">
<div class="muted small"><a href="../" data-i18n>Home</a> / <span data-i18n>Print</span></div>
<h1 data-i18n>Printable workbooks</h1>
<p class="lead" data-i18n>50 questions per chapter, with an answer key at the end. Open a chapter and print or save as PDF.</p>
<div class="grid">
${links.map(ch => `<a class="chapter-card" href="ch${String(ch).padStart(2, '0')}.html"><div class="n" data-i18n>Chapter ${ch}</div><div class="t" data-i18n>Workbook · 50 questions</div></a>`).join('\n')}
</div>
</main></body></html>`;
fs.writeFileSync(path.join(OUT, 'index.html'), indexHtml, 'utf8');
console.log(`Generated ${links.length} printable workbooks + index.`);
