// Validates the hand-written content files (lessons, phrases, grammar) against Tag Grammar rules.
// Usage: node tools/validate-content.mjs data/lessons.json [data/phrases.json ...]
import fs from 'node:fs';
import { parseEx, exRomaji, TAGS, COMPOUND } from '../js/exparse.js';

const KANJI = /[㐀-䶿一-鿿豈-﫿々]/;
const KANA_TOKEN = /^[ぁ-ゖァ-ヺー、]+$/;
const POLITE_TAIL = /(ます|ますか|です|ですか|ません|ませんか|ましょう|ください|なさい)$/;
const PHRASES = new Set(['またあした', 'じゃあ、また', 'また', 'ただいま', 'いってらっしゃい', 'はじめまして', 'もしもし', 'どうぞ',
  'おだいじに', 'こんばんは', 'こんにちは', 'さようなら', 'いただきます', 'わかりました', 'ごちそうさまでした', 'はい', 'いいえ',
  'ええ', 'どうも', 'おめでとう', 'ようこそ', 'だいじょうぶ', 'おつかれさま', 'ありがとう', 'すみません', 'おはよう']);
const BAD_END = /(ましょうか|ね|よ|な)$/;
const PAST_END = /(ました|でした)$/;

const ALLOWED = ch => {
  if (!ch) return new Set([...TAGS, ...COMPOUND]);
  const by = { 1: [], 2: ['は', 'が'], 3: ['は', 'が', 'を', 'に'], 4: ['は', 'が', 'を', 'に', 'で', 'と'], 5: ['は', 'が', 'を', 'に', 'で', 'と', 'へ', 'から', 'まで'] };
  return new Set(ch >= 6 ? [...TAGS, ...COMPOUND] : by[ch]);
};

let errors = 0, checked = 0;
function err(where, msg) { errors++; console.log(`  ✗ ${where}: ${msg}`); }

function checkEx(str, where, chapter) {
  checked++;
  if (typeof str !== 'string' || !str.includes('|')) return err(where, `example must be "kana|English": ${JSON.stringify(str)}`);
  const [ja, en] = str.split('|');
  if (!en || !en.trim()) err(where, 'missing English after |');
  if (!/[。？]$/.test(ja.trim())) err(where, `Japanese must end with 。 or ？: ${ja}`);
  const ex = parseEx(str);
  const allowed = ALLOWED(chapter);
  for (const c of ex.chunks) {
    if (!KANA_TOKEN.test(c.k)) err(where, `chunk "${c.k}" must be kana only`);
    if (c.p && !allowed.has(c.p)) err(where, `tag "${c.p}" not allowed in chapter ${chapter || '-'} (${ja})`);
    if (c.p && !TAGS.includes(c.p) && !COMPOUND.includes(c.p)) err(where, `unknown tag "${c.p}"`);
  }
  const core = ex.core.k;
  if (!core) return err(where, 'empty core');
  if (!KANA_TOKEN.test(core)) err(where, `core "${core}" must be kana only`);
  const isPhrase = PHRASES.has(core);
  if (!isPhrase) {
    if (PAST_END.test(core)) err(where, `core "${core}" is past tense — Level 1 keeps the verb unchanged; use a time word instead`);
    else if (!POLITE_TAIL.test(core)) err(where, `core "${core}" must end in ます/です/ません/ください (or be a fixed phrase)`);
    if (BAD_END.test(core)) err(where, `core "${core}" must not end with ね/よ/な/ましょうか — Level 1 uses only ます・ますか・ません・ましょう (and です・ですか)`);
    if (ex.question && !/か$/.test(core)) err(where, `question core "${core}" must end with か (〜ますか / 〜ですか / 〜ませんか)`);
    if (!ex.question && /(ますか|ですか|ませんか)$/.test(core)) err(where, `core "${core}" ends with か but the sentence ends with 。 — use ？`);
  }
  try { exRomaji(ex); } catch (e) { err(where, 'romaji failed: ' + e.message); }
}

function walk(node, path, chapter) {
  if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${path}[${i}]`, chapter));
  if (node && typeof node === 'object') {
    const ch = typeof node.chapter === 'number' ? node.chapter : chapter;
    for (const [k, v] of Object.entries(node)) {
      const p = `${path}.${k}`;
      if (k === 'ex' || k === 'a' || k === 'examples' || k === 'wrong' || k === 'right') {
        const list = Array.isArray(v) ? v : [v];
        list.forEach((s, i) => {
          if (k === 'wrong') { // wrong examples may break tag rules on purpose, only check kana/format
            if (KANJI.test(s)) err(`${p}[${i}]`, `kanji found: ${s}`);
            return;
          }
          checkEx(s, `${p}[${i}]`, ch);
        });
      } else walk(v, p, ch);
    }
    return;
  }
  if (typeof node === 'string' && KANJI.test(node)) err(path, `kanji found (use kana): ${node.slice(0, 60)}`);
}

const files = process.argv.slice(2);
for (const f of files) {
  errors = 0; checked = 0;
  console.log(f);
  const data = JSON.parse(fs.readFileSync(f, 'utf8'));
  walk(data, '$', null);
  console.log(errors ? `  ${errors} error(s), ${checked} examples checked` : `  OK — ${checked} examples checked`);
  if (errors) process.exitCode = 1;
}
