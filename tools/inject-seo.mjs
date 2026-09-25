#!/usr/bin/env node
// Injects title/description/canonical/OGP/JSON-LD/gtag into every public page per google-ids.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const IDS = JSON.parse(fs.readFileSync(path.join(ROOT, 'google-ids.json'), 'utf8'));

const PAGES = [
  { file: 'index.html', path: '/', title: 'にほんご Tags — Learn Japanese in 14 Days', desc: 'Learn 2,000 real-life Japanese sentences with Tag Grammar: move the particle tags, build the sentence yourself. No conjugation, ten chapters, two weeks.' },
  { file: 'grammar/index.html', path: '/grammar/', title: 'Tag Grammar — Japanese particles explained — にほんご Tags', desc: 'The Tag Grammar reference: five principles, the level-1 rules for talking without conjugating, and every Japanese particle (は が を に で と へ から まで も) with examples and common mistakes.' },
  { file: 'ch/index.html', path: '/ch/', title: 'Chapters — にほんご Tags', desc: 'Ten chapters of real-life Japanese sentences, built from ten particle tags. Browse examples chapter by chapter.', noindex: true },
  { file: 'drill/index.html', path: '/drill/', title: 'Daily drill — にほんご Tags', desc: 'A 30-question daily drill mixing seven exercise types to build tag-grammar reflexes.', noindex: true },
  { file: 'test/index.html', path: '/test/', title: 'Chapter test — にほんご Tags', desc: 'A scored test for each chapter, plus a 100-question final covering all ten.', noindex: true },
  { file: 'progress/index.html', path: '/progress/', title: 'Your progress — にほんご Tags', desc: 'Track your 14-day plan, chapter test scores, and per-tag accuracy.', noindex: true },
  { file: 'scenes/index.html', path: '/scenes/', title: 'Browse by scene — にほんご Tags', desc: 'Browse the 2,000 example sentences by everyday scene: shopping, food, transport, work, farm life and more.' },
  { file: 'lesson/index.html', path: '/lesson/', title: '14 daily lessons — にほんご Tags', desc: 'Fourteen short daily lessons that teach spoken Japanese step by step with Tag Grammar: particles as tags, free word order, no conjugation.' },
  { file: 'words/index.html', path: '/words/', title: 'Japanese words & phrases — にほんご Tags', desc: 'A phrase book for twelve everyday scenes, a searchable list of every word in 2,000 example sentences, and the time words for past and future.' },
  { file: 'print/index.html', path: '/print/', title: 'Printable workbooks — にほんご Tags', desc: '50-question printable worksheets for each of the ten chapters, with an answer key.' },
];

function head(page) {
  const url = IDS.site_url.replace(/\/$/, '') + page.path;
  const robots = page.noindex ? 'noindex,follow' : 'index,follow';
  return `<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${page.title}</title>
<meta name="description" content="${page.desc}">
<meta name="robots" content="${robots}">
<link rel="canonical" href="${url}">

<meta property="og:type" content="website">
<meta property="og:site_name" content="${IDS.site_name}">
<meta property="og:title" content="${page.title}">
<meta property="og:description" content="${page.desc}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${IDS.og_image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${page.title}">
<meta name="twitter:description" content="${page.desc}">
<meta name="twitter:image" content="${IDS.og_image}">

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": "https://yusando.com/#organization", "name": "株式会社悠三堂", "url": "https://yusando.com" },
    { "@type": "WebSite", "@id": "${IDS.site_url}/#website", "name": "${IDS.site_name}", "url": "${IDS.site_url}", "publisher": { "@id": "https://yusando.com/#organization" }, "inLanguage": "en" }
  ]
}
</script>

<script>
  window.GOOGLE_IDS = ${JSON.stringify(IDS)};
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  gtag('consent', 'default', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' });
  window.__GTAG_ENABLED = (location.hostname === (function(){ try { return new URL(GOOGLE_IDS.site_url).hostname; } catch(e){ return ''; } })());
</script>
<script>
  if (window.__GTAG_ENABLED) {
    var s = document.createElement('script'); s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GOOGLE_IDS.ga4_measurement_id;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', GOOGLE_IDS.ga4_measurement_id, { send_page_view: true });
  }
  window.trackConversion = function(name, params) {
    params = params || {};
    if (!window.__GTAG_ENABLED) { return; }
    gtag('event', name, params);
    var label = GOOGLE_IDS.ads_conversion_labels && GOOGLE_IDS.ads_conversion_labels[name];
    if (label && GOOGLE_IDS.ads_conversion_id) gtag('event', 'conversion', Object.assign({ send_to: GOOGLE_IDS.ads_conversion_id + '/' + label }, params));
  };
</script>`;
}

for (const page of PAGES) {
  const p = path.join(ROOT, page.file);
  let html = fs.readFileSync(p, 'utf8');
  if (html.includes('window.GOOGLE_IDS')) continue; // already injected
  // strip any existing <title>/<meta viewport>/<meta description>/<link stylesheet> block up to the stylesheet link, keep stylesheet
  html = html.replace(/<meta name="viewport"[^>]*>\s*/i, '');
  html = html.replace(/<title>[^<]*<\/title>\s*/i, '');
  html = html.replace(/<meta name="description"[^>]*>\s*/i, '');
  html = html.replace(/<meta charset="utf-8">\s*/i, `<meta charset="utf-8">\n${head(page)}\n`);
  fs.writeFileSync(p, html, 'utf8');
}
console.log(`SEO/gtag injected into ${PAGES.length} pages.`);
