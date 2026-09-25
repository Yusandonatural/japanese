// Builds data/vocab.json (word list) from the 2000 examples in data/ch01..ch10.json.
// Usage: node tools/build-vocab.mjs
import fs from 'node:fs';
import { coreRomaji as kanaToRomaji } from '../js/exparse.js';

const all = [];
for (let i = 1; i <= 10; i++) all.push(...JSON.parse(fs.readFileSync(`data/ch${String(i).padStart(2, '0')}.json`, 'utf8')));

const QUESTION = new Set(['だれ', 'なに', 'なん', 'どこ', 'いつ', 'なんじ', 'いくら', 'どれ', 'どう', 'どちら', 'なんにん', 'なんようび', 'いくつ', 'どの', 'どなた', 'なんで', 'どうして']);
const PEOPLE = /^(I|me|you|we|wife|husband|mother|father|mom|dad|child|children|kids?|friend|friends|colleague|colleagues|teacher|doctor|boss|family|son|daughter|older brother|younger brother|older sister|younger sister|brother|sister|grandmother|grandfather|grandma|grandpa|baby|everyone|everybody|someone|nobody|customer|customers|guest|guests|neighbou?r|staff|manager|student|students|person|people|parents|Mr\.? ?\w*|Ms\.? ?\w*|he|she|they|him|her|them|dog|cat|man|woman|boy|girl|nurse|driver|shop assistant|clerk|farmer|volunteer|intern)$/i;

// A chunk is "decorated" (a phrase, not a dictionary word) if it links nouns or holds an adjective.
function decorated(w, k) {
  if (/.の./.test(w) && !['この前', 'その後'].includes(w)) return true;
  if (/.と./.test(w) && /[一-龯]/.test(w)) return true;
  if (/.[いな][一-龯ァ-ヶおご]/.test(w)) return true;
  if (/^(この|その|あの|どの)./.test(w)) return true;
  if (/^[一二三四五六七八九十百千0-9０-９]+[つ人枚本杯個台匹冊回時分円歳]/.test(w) && w.length > 3) return true;
  return k.length > 9;
}
const NA_ADJ = new Set(['すき','きらい','だいすき','げんき','きれい','しずか','ひま','だいじょうぶ','じょうず','へた','たいへん','べんり','ゆうめい','しんせつ','にぎやか','だめ','かんたん','ていねい','いや','むり','たいせつ','とくい','にがて','じゆう','あんぜん','きけん','らく','しんぱい','ふべん','まじめ','ざんねん','しあわせ','ふしぎ','すてき','おなじ','たいくつ','ひつよう','だいじ','いたい','つめたい','かたい','ひくい','おもい']);
const PHRASE_CORES = new Set();

const words = new Map();
function add(key, entry, ex) {
  if (!words.has(key)) words.set(key, { ...entry, n: 0, ch: ex.chapter, roles: {}, ex: null });
  const e = words.get(key);
  e.n++;
  if (entry.role) e.roles[entry.role] = (e.roles[entry.role] || 0) + 1;
  if (ex.chapter < e.ch) e.ch = ex.chapter;
  // keep the shortest example as the illustration
  const kana = ex.chunks.map(c => c.k + c.p).join(' ') + (ex.chunks.length ? ' ' : '') + ex.core.k + (ex.question ? '？' : '。');
  if (!e.ex || kana.length < e.ex.k.length) e.ex = { k: kana, en: ex.en };
}

for (const ex of all) {
  for (const c of ex.chunks) {
    if (!c.k || decorated(c.w, c.k)) continue;
    const g = String(c.gloss || '').replace(/\s*\(too\)\s*/g, '').trim();
    if (/^(with|from|at|in|to|on|for|until|by|upstairs|downstairs)\b/i.test(g) && /(と|から|に|で|まで|へ)$/.test(c.k)) continue;
    if (/^(a|an|the) \S+ \S+/i.test(g)) continue;
    const g2 = g.replace(/^(to|at|in|from|with|for|on) /i, '').replace(/^the /i, '');
    add('n:' + c.k, { k: c.k, en: g2, role: c.role, kind: 'noun' }, ex);
  }
  const k = ex.core.k.replace(/[、。？]/g, '').replace(/(ます|です|ません)か$/, '$1').replace(/ましょう$/, 'ます');
  add('c:' + k, { k, en: ex.core.gloss || '', kind: 'core' }, ex);
}

for (const e of words.values()) if (e.kind === 'core' && !/(ます|ません|です|ください|なさい)$/.test(e.k)) PHRASE_CORES.add(e.k);
const out = [];
for (const e of words.values()) {
  let cat;
  if (e.kind === 'noun' && PHRASE_CORES.has(e.k)) continue;
  if (e.kind === 'noun') {
    const topRole = Object.entries(e.roles).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (QUESTION.has(e.k)) cat = 'question';
    else if (topRole === 'time') cat = 'time';
    else if (PEOPLE.test(e.en || '')) cat = 'people';
    else cat = 'thing';
  } else {
    if (/(ます|ません)$/.test(e.k)) cat = 'verb';
    else if (/ください$/.test(e.k)) cat = 'request';
    else if (/です$/.test(e.k)) {
      const stem = e.k.replace(/です$/, '');
      const adj = NA_ADJ.has(stem) || (/い$/.test(stem) && !/(せい|けい|さい|ばい|たい)$/.test(stem) && !/の/.test(stem));
      if (adj && !/^(すこし|とても|もっと|ちょっと)/.test(stem)) cat = 'describe'; else continue;
    }
    else cat = 'phrase';
  }
  out.push({ k: e.k, r: kanaToRomaji(e.k), en: e.en, cat, n: e.n, ch: e.ch, ex: e.ex });
}
out.sort((a, b) => b.n - a.n || a.k.localeCompare(b.k, 'ja'));
fs.writeFileSync('data/vocab.json', JSON.stringify(out));
const counts = out.reduce((m, w) => (m[w.cat] = (m[w.cat] || 0) + 1, m), {});
console.log('vocab.json:', out.length, 'entries', counts);
