// One-off migration: dictionary-form cores → ます形 / です, regenerate ja/kana/romaji, fix cross-chapter duplicates.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sentenceRomaji } from '../js/romaji.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const ICHIDAN = new Set(['食べる','いる','寝る','見る','開ける','起きる','入れる','植える','降りる','閉める','出る','出かける','あげる','忘れる','くれる','教える','見える','乗り換える','始める','片付ける','遅れる','聞こえる','止める','借りる','見せる','かける','調べる','壊れる','考える','並べる','数える','できる','育てる','着る','浴びる','捨てる','決める','答える','続ける','疲れる','覚える','変える','伝える','集める','付ける','つける','出来る','いれる','あける','しめる','たべる','みる','ねる','おきる','でる']);
// Godan verbs whose reading ends in "いる"/"える" and would be misdetected as ichidan by suffix match — force godan.
const GODAN_EXCEPTIONS = new Set(['入る','はいる','要る','いる_need','帰る','走る','切る','知る','散る','限る','滑る','蹴る','喋る']);
function isGodanException(w, k) { return w === '入る' || k === 'はいる' || w === '要る' || (w.endsWith('要る')); }
const IRREGULAR = { 'する':['します','します'], '来る':['来ます','きます'], 'くる':['きます','きます'], 'ある':['あります','あります'], '行く':['行きます','いきます'], 'いく':['いきます','いきます'] };
const GODAN_I = { 'う':'い','く':'き','ぐ':'ぎ','す':'し','つ':'ち','ぬ':'に','ぶ':'び','む':'み','る':'り' };
const PHRASES = {
  'おはよう':'おはようございます','ありがとう':'ありがとうございます','どうもありがとう':'どうもありがとうございます','ごめん':'ごめんなさい',
  'お願い':'お願いします','おやすみ':'おやすみなさい','おかえり':'おかえりなさい','お疲れさま':'お疲れさまです','よろしく':'よろしくお願いします',
  'お先に':'お先に失礼します','ごちそうさま':'ごちそうさまでした','わかった':'わかりました','待って':'待ってください','お久しぶり':'お久しぶりです',
  'また明日':'また明日','じゃあ、また':'じゃあ、また','また':'また','ただいま':'ただいま','いってらっしゃい':'いってらっしゃい','はじめまして':'はじめまして',
  'もしもし':'もしもし','どうぞ':'どうぞ','お大事に':'お大事に','こんばんは':'こんばんは','ください':'ください','いただきます':'いただきます',
  'ない':'ありません','いない':'いません','出ない':'出ません','開かない':'開きません','好きだ':'好きです'
};
const PHRASES_K = {
  'おはよう':'おはようございます','ありがとう':'ありがとうございます','どうもありがとう':'どうもありがとうございます','ごめん':'ごめんなさい',
  'おねがい':'おねがいします','おやすみ':'おやすみなさい','おかえり':'おかえりなさい','おつかれさま':'おつかれさまです','よろしく':'よろしくおねがいします',
  'おさきに':'おさきにしつれいします','ごちそうさま':'ごちそうさまでした','わかった':'わかりました','まって':'まってください','おひさしぶり':'おひさしぶりです',
  'ない':'ありません','いない':'いません','でない':'でません','あかない':'あきません','すきだ':'すきです'
};
const NO_CHANGE_TAIL = /(ます|です|ください|ません|でした)$/;
const ADJ_TAIL = /[いイ]$/;

function polite(w, k) {
  if (NO_CHANGE_TAIL.test(w)) return [w, k];
  if (PHRASES[w] !== undefined) return [PHRASES[w], PHRASES_K[k] !== undefined ? PHRASES_K[k] : (PHRASES[w] === w ? k : k + PHRASES[w].slice(w.length))];
  // verbs: find the verb at the end (may be preceded by an adverb/number: 少し話す, 三匹買う)
  for (const [dict, [pw, pk]] of Object.entries(IRREGULAR)) {
    if (w.endsWith(dict)) {
      const kd = dict === '行く' ? 'いく' : dict === '来る' ? 'くる' : dict;
      if (k.endsWith(kd)) return [w.slice(0, -dict.length) + pw, k.slice(0, -kd.length) + pk];
    }
  }
  const last = w.slice(-1);
  const isVerb = last in GODAN_I && k.slice(-1) === last && !ADJ_TAIL.test(w);
  if (isVerb) {
    const ichidan = !isGodanException(w, k) && [...ICHIDAN].some(v => w.endsWith(v) || k.endsWith(v));
    if (ichidan) return [w.slice(0, -1) + 'ます', k.slice(0, -1) + 'ます'];
    return [w.slice(0, -1) + GODAN_I[last] + 'ます', k.slice(0, -1) + GODAN_I[last] + 'ます'];
  }
  // adjectives, nouns, wh-words → + です
  return [w + 'です', k + 'です'];
}

function strip(s) { return s.replace(/[、。？?！!\s　↗]/g, ''); }

const files = fs.readdirSync(path.join(ROOT, 'data')).filter(f => /^ch\d\d\.json$/.test(f)).sort();
const seen = new Map();
const report = { changed: 0, dupFixed: 0, samples: [] };
for (const f of files) {
  const p = path.join(ROOT, 'data', f);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  for (const ex of data) {
    ex.core.k = ex.core.k.replace(/\./g, '');
    const [w, k] = polite(ex.core.w, ex.core.k);
    if (w !== ex.core.w) { report.changed++; if (report.samples.length < 40) report.samples.push(`${ex.core.w} → ${w} / ${k}`); }
    ex.core.w = w; ex.core.k = k;
    if (ex.context && ex.context.q_ja) {
      // politeify the context question's last word too (best effort: same rules on the trailing token)
      const m = ex.context.q_ja.match(/^(.*?)([^、\s]+?)([？?])$/);
      if (m) {
        const [pw] = polite(m[2], m[2]);
        ex.context.q_ja = m[1] + pw + '？';
      }
    }
    const rebuild = () => {
      const punct = ex.question ? '？' : '。';
      const timeFirst = ex.chunks.length > 1 && ex.chunks[0].role === 'time' && !ex.chunks[0].p;
      ex.ja = ex.chunks.map((c, i) => c.w + c.p + (i === 0 && timeFirst ? '、' : '')).join('') + ex.core.w + punct;
      ex.kana = ex.chunks.map((c, i) => c.k + c.p + (i === 0 && timeFirst ? '、' : '')).join('') + ex.core.k + punct;
      ex.romaji = sentenceRomaji(ex);
    };
    rebuild();
    // cross-chapter duplicate fix
    let key = strip(ex.ja);
    if (seen.has(key)) {
      const alts = [['今日','きょう','today'],['毎日','まいにち','every day'],['今','いま','now'],['いつも','いつも','always']];
      const t = ex.chunks.find(c => c.role === 'time' && !c.p);
      if (t) {
        for (const [aw, ak, ag] of alts) {
          if (aw === t.w) continue;
          const save = { ...t };
          t.w = aw; t.k = ak; t.gloss = ag; rebuild(); key = strip(ex.ja);
          if (!seen.has(key)) break;
          Object.assign(t, save); rebuild(); key = strip(ex.ja);
        }
      } else if (ex.tense === 'present') {
        for (const [aw, ak, ag] of alts) {
          ex.chunks.unshift({ w: aw, k: ak, p: '', role: 'time', gloss: ag, omit: true }); rebuild(); key = strip(ex.ja);
          if (!seen.has(key)) break;
          ex.chunks.shift(); rebuild(); key = strip(ex.ja);
        }
      }
      if (seen.has(key)) console.log('still duplicate:', ex.id, ex.ja); else report.dupFixed++;
    }
    seen.set(key, ex.id);
  }
  fs.writeFileSync(p, '[\n' + data.map(e => JSON.stringify(e)).join(',\n') + '\n]\n', 'utf8');
}
console.log(report);
