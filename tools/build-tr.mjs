// Builds the Turkish edition (/tr/) from the English pages.
//   node tools/build-tr.mjs
// For each page: static text marked with data-i18n (and data-i18n-placeholder) is replaced with the
// Turkish from js/i18n.js, <html> gets lang="tr" data-locale="tr", asset paths get one more "../",
// and the SEO head (title, description, canonical, Open Graph, JSON-LD) is switched to Turkish.
// It also adds hreflang alternates to both editions. Run it after inject-seo.mjs and build-print.js.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TR } from '../js/i18n.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://nihongo.yusando.com';

const PAGES = [
  { file: 'index.html', path: '/', title: 'にほんご Tags — 14 günde Japonca konuş', desc: 'Etiket Dilbilgisi ile 2.000 gerçek hayat cümlesinden Japonca öğren: parçacıkları etiket gibi kullan, cümleyi kendin kur. Fiil çekimi yok, on bölüm, iki hafta. Türkçe konuşanlar için.' },
  { file: 'lesson/index.html', path: '/lesson/', title: '14 günlük Japonca dersi — にほんご Tags', desc: 'Türkçe konuşanlar için 14 kısa günlük ders: Japonca parçacıklar Türkçe hâl ekleriyle karşılaştırmalı, serbest kelime sırası, fiil çekimi yok.' },
  { file: 'grammar/index.html', path: '/grammar/', title: 'Etiket Dilbilgisi — Japonca parçacıklar Türkçe anlatım — にほんご Tags', desc: 'Japonca parçacıklar (は が を に で と へ から まで も) Türkçe hâl ekleriyle karşılaştırmalı olarak: beş ilke, 1. seviyenin dört eki, örnekler ve sık yapılan hatalar.' },
  { file: 'words/index.html', path: '/words/', title: 'Japonca kelimeler ve ifadeler — にほんご Tags', desc: 'On iki günlük sahne için ifade kılavuzu, dört ekiyle en kullanışlı 200 Japonca fiil, aranabilir kelime listesi ve zaman kelimeleri — Türkçe açıklamalı.' },
  { file: 'ch/index.html', path: '/ch/', title: 'Bölümler — にほんご Tags', desc: 'On etiketten kurulmuş gerçek hayat Japonca cümleleri, bölüm bölüm.' },
  { file: 'drill/index.html', path: '/drill/', title: 'Günlük alıştırma — にほんご Tags', desc: 'Yedi alıştırma türüyle günlük Japonca pratiği.' },
  { file: 'test/index.html', path: '/test/', title: 'Bölüm sınavı — にほんご Tags', desc: 'Her bölüm için puanlı bir sınav ve on bölümün tamamını kapsayan 100 soruluk final.' },
  { file: 'progress/index.html', path: '/progress/', title: 'İlerlemen — にほんご Tags', desc: '14 günlük planını, bölüm sınavı puanlarını ve etiket doğruluğunu takip et.' },
  { file: 'scenes/index.html', path: '/scenes/', title: 'Sahnelere göre — にほんご Tags', desc: '2.000 örnek cümleye günlük sahnelere göre göz at: alışveriş, yemek, ulaşım, iş, çiftlik hayatı ve daha fazlası.' },
  { file: 'print/index.html', path: '/print/', title: 'Yazdırılabilir çalışma kitapları — にほんご Tags', desc: 'Her bölüm için cevap anahtarlı 50 soruluk yazdırılabilir çalışma kağıtları.' },
];

const norm = s => s.replace(/\s+/g, ' ').replace(/&amp;/g, '&').trim();
const escAttr = s => s.replace(/"/g, '&quot;');
let missing = 0;

function translateStatic(html, file) {
  // elements with data-i18n: <tag ... data-i18n ...>content</tag>
  html = html.replace(/<(\w+)([^>]*\sdata-i18n(?:\s[^>]*)?)>([\s\S]*?)<\/\1>/g, (m, tag, attrs, inner) => {
    const key = norm(inner);
    if (!Object.prototype.hasOwnProperty.call(TR, key)) { missing++; console.warn(`  [${file}] no Turkish for: ${key.slice(0, 80)}`); return m; }
    return `<${tag}${attrs}>${TR[key]}</${tag}>`;
  });
  html = html.replace(/placeholder="([^"]*)"([^>]*?)data-i18n-placeholder/g, (m, ph, rest) => {
    const tr = TR[ph];
    if (!tr) { missing++; console.warn(`  [${file}] no Turkish placeholder: ${ph}`); return m; }
    return `placeholder="${escAttr(tr)}"${rest}data-i18n-placeholder`;
  });
  return html;
}

function alternates(p) {
  return `<link rel="alternate" hreflang="en" href="${SITE}${p}">\n<link rel="alternate" hreflang="tr" href="${SITE}/tr${p}">\n<link rel="alternate" hreflang="x-default" href="${SITE}${p}">\n`;
}
function withAlternates(html, p) {
  html = html.replace(/<link rel="alternate" hreflang="[^"]*" href="[^"]*">\n?/g, '');
  return html.replace('</head>', alternates(p) + '</head>');
}

for (const page of PAGES) {
  const src = path.join(ROOT, page.file);
  let en = fs.readFileSync(src, 'utf8');
  en = withAlternates(en, page.path);
  fs.writeFileSync(src, en, 'utf8');

  let html = en;
  const depthPrefix = '../';
  html = html.replace(/<html lang="en"( data-base="([^"]*)")?/, (m, a, base) => `<html lang="tr" data-locale="tr" data-base="${depthPrefix}${base && base !== './' ? base : ''}"`);
  // asset paths (css, js, favicon) move one level deeper; page links stay relative inside /tr/
  const deeper = p => (p === './' || !p) ? '../' : '../' + p;
  html = html.replace(/href="(\.\/|(?:\.\.\/)*)(css\/|favicon)/g, (m, p, what) => `href="${deeper(p)}${what}`)
             .replace(/from '(\.\/|(?:\.\.\/)+)js\//g, (m, p) => `from '${deeper(p)}js/`);
  // SEO head
  const url = `${SITE}/tr${page.path}`;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${page.title}</title>`)
             .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escAttr(page.desc)}">`)
             .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`)
             .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${escAttr(page.title)}">`)
             .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${escAttr(page.desc)}">`)
             .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`)
             .replace(/<meta property="og:locale" content="[^"]*">/, '<meta property="og:locale" content="tr_TR">')
             .replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${escAttr(page.title)}">`)
             .replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${escAttr(page.desc)}">`)
             .replace(/"inLanguage": "en"/, '"inLanguage": "tr"');
  html = translateStatic(html, page.file);
  const out = path.join(ROOT, 'tr', page.file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html, 'utf8');
}
console.log(`Turkish edition: ${PAGES.length} pages written to tr/${missing ? ` (${missing} untranslated strings)` : ''}.`);
if (missing) process.exitCode = 1;
