// Builds the translated editions (/tr/, /fr/) from the English pages.
//   node tools/build-tr.mjs          (all editions)   node tools/build-tr.mjs fr   (one edition)
// For each page: static text marked with data-i18n (and data-i18n-placeholder) is replaced with the
// edition's strings (TR in js/i18n.js, FR in js/i18n-fr.js), <html> gets lang/data-locale, asset paths
// get one more "../", and the SEO head (title, description, canonical, Open Graph, JSON-LD) is switched.
// It also adds hreflang alternates to every edition. Run it after inject-seo.mjs and build-print.js.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TR } from '../js/i18n.js';
import { FR } from '../js/i18n-fr.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://nihongo.yusando.com';

const PAGES_TR = [
  { file: 'index.html', path: '/', title: '14 Günde Kolay Japonca — İki haftada Japonca konuş', desc: 'Etiket Dilbilgisi ile 2.000 gerçek hayat cümlesinden Japonca öğren: parçacıkları etiket gibi kullan, cümleyi kendin kur. Fiil çekimi yok, on bölüm, iki hafta. Türkçe konuşanlar için.' },
  { file: 'lesson/index.html', path: '/lesson/', title: '14 günlük Japonca dersi — 14 Günde Kolay Japonca', desc: 'Türkçe konuşanlar için 14 kısa günlük ders: Japonca parçacıklar Türkçe hâl ekleriyle karşılaştırmalı, serbest kelime sırası, fiil çekimi yok.' },
  { file: 'grammar/index.html', path: '/grammar/', title: 'Etiket Dilbilgisi — Japonca parçacıklar Türkçe anlatım — 14 Günde Kolay Japonca', desc: 'Japonca parçacıklar (は が を に で と へ から まで も) Türkçe hâl ekleriyle karşılaştırmalı olarak: beş ilke, 1. seviyenin dört eki, örnekler ve sık yapılan hatalar.' },
  { file: 'words/index.html', path: '/words/', title: 'Japonca kelimeler ve ifadeler — 14 Günde Kolay Japonca', desc: 'On iki günlük sahne için ifade kılavuzu, dört ekiyle en kullanışlı 200 Japonca fiil, aranabilir kelime listesi ve zaman kelimeleri — Türkçe açıklamalı.' },
  { file: 'ch/index.html', path: '/ch/', title: 'Bölümler — 14 Günde Kolay Japonca', desc: 'On etiketten kurulmuş gerçek hayat Japonca cümleleri, bölüm bölüm.' },
  { file: 'drill/index.html', path: '/drill/', title: 'Günlük alıştırma — 14 Günde Kolay Japonca', desc: 'Yedi alıştırma türüyle günlük Japonca pratiği.' },
  { file: 'test/index.html', path: '/test/', title: 'Bölüm sınavı — 14 Günde Kolay Japonca', desc: 'Her bölüm için puanlı bir sınav ve on bölümün tamamını kapsayan 100 soruluk final.' },
  { file: 'progress/index.html', path: '/progress/', title: 'İlerlemen — 14 Günde Kolay Japonca', desc: '14 günlük planını, bölüm sınavı puanlarını ve etiket doğruluğunu takip et.' },
  { file: 'scenes/index.html', path: '/scenes/', title: 'Sahnelere göre — 14 Günde Kolay Japonca', desc: '2.000 örnek cümleye günlük sahnelere göre göz at: alışveriş, yemek, ulaşım, iş, çiftlik hayatı ve daha fazlası.' },
  { file: 'print/index.html', path: '/print/', title: 'Yazdırılabilir çalışma kitapları — 14 Günde Kolay Japonca', desc: 'Her bölüm için cevap anahtarlı 50 soruluk yazdırılabilir çalışma kağıtları.' },
];

const PAGES_FR = [
  { file: 'index.html', path: '/', title: 'Le japonais facile en 14 jours — Parle japonais en deux semaines', desc: 'Apprends 2 000 phrases japonaises de la vie réelle avec la Grammaire des étiquettes : les particules deviennent des étiquettes, tu construis la phrase toi-même. Sans conjugaison, dix chapitres, deux semaines.' },
  { file: 'lesson/index.html', path: '/lesson/', title: '14 leçons de japonais — Le japonais facile en 14 jours', desc: 'Quatorze courtes leçons quotidiennes pour apprendre le japonais parlé pas à pas : particules comme étiquettes, ordre des mots libre, sans conjugaison.' },
  { file: 'grammar/index.html', path: '/grammar/', title: 'Grammaire des étiquettes — les particules japonaises expliquées — Le japonais facile en 14 jours', desc: 'Les particules japonaises (は が を に で と へ から まで も) expliquées en français : cinq principes, les quatre terminaisons du niveau 1, des exemples et les erreurs fréquentes.' },
  { file: 'words/index.html', path: '/words/', title: 'Mots et expressions japonais — Le japonais facile en 14 jours', desc: 'Un guide de conversation pour douze situations du quotidien, les 200 verbes japonais les plus utiles, une liste de mots consultable et les mots de temps — expliqués en français.' },
  { file: 'ch/index.html', path: '/ch/', title: 'Chapitres — Le japonais facile en 14 jours', desc: 'Des phrases japonaises de la vie réelle, construites à partir de dix étiquettes, chapitre par chapitre.' },
  { file: 'drill/index.html', path: '/drill/', title: 'Exercice du jour — Le japonais facile en 14 jours', desc: 'Un entraînement quotidien au japonais avec sept types d’exercices.' },
  { file: 'test/index.html', path: '/test/', title: 'Test de chapitre — Le japonais facile en 14 jours', desc: 'Un test noté pour chaque chapitre et un examen final de 100 questions sur les dix chapitres.' },
  { file: 'progress/index.html', path: '/progress/', title: 'Ta progression — Le japonais facile en 14 jours', desc: 'Suis ton plan de 14 jours, tes résultats aux tests et ta précision par étiquette.' },
  { file: 'scenes/index.html', path: '/scenes/', title: 'Par situation — Le japonais facile en 14 jours', desc: 'Parcours les 2 000 phrases d’exemple par situation du quotidien : courses, repas, transports, travail, vie à la ferme et plus encore.' },
  { file: 'print/index.html', path: '/print/', title: 'Cahiers à imprimer — Le japonais facile en 14 jours', desc: 'Des fiches de 50 questions à imprimer pour chacun des dix chapitres, avec corrigé.' },
];

// code → strings, pages, Open Graph locale, site name, home-screen app title
const EDITIONS = {
  tr: { dict: TR, pages: PAGES_TR, og: 'tr_TR', name: '14 Günde Kolay Japonca', app: 'Japonca 14', label: 'Turkish' },
  fr: { dict: FR, pages: PAGES_FR, og: 'fr_FR', name: 'Le japonais facile en 14 jours', app: 'Japonais 14', label: 'French' },
};
const CODES = ['en', ...Object.keys(EDITIONS)];
const PAGES = PAGES_TR; // every edition has the same page list

const norm = s => s.replace(/\s+/g, ' ').replace(/&amp;/g, '&').trim();
const escAttr = s => s.replace(/"/g, '&quot;');
let missing = 0;

function translateStatic(html, file, DICT, label) {
  // elements with data-i18n: <tag ... data-i18n ...>content</tag>
  html = html.replace(/<(\w+)([^>]*\sdata-i18n(?:\s[^>]*)?)>([\s\S]*?)<\/\1>/g, (m, tag, attrs, inner) => {
    const key = norm(inner);
    if (!Object.prototype.hasOwnProperty.call(DICT, key)) { missing++; console.warn(`  [${file}] no ${label} for: ${key.slice(0, 80)}`); return m; }
    return `<${tag}${attrs}>${DICT[key]}</${tag}>`;
  });
  html = html.replace(/placeholder="([^"]*)"([^>]*?)data-i18n-placeholder/g, (m, ph, rest) => {
    const tr = DICT[ph];
    if (!tr) { missing++; console.warn(`  [${file}] no ${label} placeholder: ${ph}`); return m; }
    return `placeholder="${escAttr(tr)}"${rest}data-i18n-placeholder`;
  });
  return html;
}

function alternates(p) {
  return CODES.map(c => `<link rel="alternate" hreflang="${c}" href="${SITE}${c === 'en' ? '' : '/' + c}${p}">\n`).join('')
    + `<link rel="alternate" hreflang="x-default" href="${SITE}${p}">\n`;
}
function withAlternates(html, p) {
  html = html.replace(/<link rel="alternate" hreflang="[^"]*" href="[^"]*">\n?/g, '');
  return html.replace('</head>', alternates(p) + '</head>');
}

// English pages get the full set of hreflang alternates once
for (const page of PAGES) {
  const src = path.join(ROOT, page.file);
  fs.writeFileSync(src, withAlternates(fs.readFileSync(src, 'utf8'), page.path), 'utf8');
}

const only = process.argv[2];
for (const [code, ed] of Object.entries(EDITIONS)) {
  if (only && only !== code) continue;
  const before = missing;
  for (const page of ed.pages) {
    let html = fs.readFileSync(path.join(ROOT, page.file), 'utf8');
    html = html.replace(/<html lang="en"( data-base="([^"]*)")?/, (m, a, base) => `<html lang="${code}" data-locale="${code}" data-base="../${base && base !== './' ? base : ''}"`);
    // asset paths (css, js, favicon, icons) move one level deeper; page links stay relative inside /<code>/
    const deeper = p => (p === './' || !p) ? '../' : '../' + p;
    html = html.replace(/href="(\.\/|(?:\.\.\/)*)(css\/|favicon|icons\/)/g, (m, p, what) => `href="${deeper(p)}${what}`)
               .replace(/from '(\.\/|(?:\.\.\/)+)js\//g, (m, p) => `from '${deeper(p)}js/`);
    // SEO head
    const url = `${SITE}/${code}${page.path}`;
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${page.title}</title>`)
               .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escAttr(page.desc)}">`)
               .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`)
               .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${escAttr(page.title)}">`)
               .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${escAttr(page.desc)}">`)
               .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`)
               .replace(/<meta property="og:locale" content="[^"]*">/, `<meta property="og:locale" content="${ed.og}">`)
               .replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${escAttr(page.title)}">`)
               .replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${escAttr(page.desc)}">`)
               .replace(/"inLanguage": "en"/, `"inLanguage": "${code}"`)
               .replace('<meta name="apple-mobile-web-app-title" content="Japanese 14">', `<meta name="apple-mobile-web-app-title" content="${ed.app}">`);
    html = translateStatic(html, page.file, ed.dict, ed.label);
    html = html.split('Easy Japanese 14 Days').join(ed.name);
    const out = path.join(ROOT, code, page.file);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, html, 'utf8');
  }
  const m = missing - before;
  console.log(`${ed.label} edition: ${ed.pages.length} pages written to ${code}/${m ? ` (${m} untranslated strings)` : ''}.`);
}
if (missing) process.exitCode = 1;
