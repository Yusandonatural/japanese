// Compact example-sentence notation used by lessons, grammar and phrase data.
//   "わたし.は おちゃ.を のみます。|I drink tea."
// Tokens are separated by spaces. "noun.tag" = a chunk with a tag; a token without "." is a
// tagless chunk (time word, bare noun). The LAST token is the core. The core ends with 。 or ？.
// Text after "|" is the English translation. Works in the browser and in Node.
import { kanaToRomaji, romajiParticle } from './romaji.js';

export const TAGS = ['は', 'が', 'を', 'に', 'で', 'と', 'へ', 'から', 'まで', 'も'];
// Compound tags allowed after chapter 6: でも, にも, とも, へも, からも, までも
export const COMPOUND = ['でも', 'にも', 'とも', 'へも', 'からも', 'までも'];

export function parseEx(str) {
  const [jaRaw, en = ''] = String(str).split('|');
  const ja = jaRaw.trim();
  const question = /[？?]$/.test(ja);
  const body = ja.replace(/[。？?！!]$/, '');
  const tokens = body.split(/\s+/).filter(Boolean);
  const coreTok = tokens.pop() || '';
  const chunks = tokens.map(t => {
    const i = t.lastIndexOf('.');
    if (i < 0) return { k: t, w: t, p: '', role: 'bare' };
    return { k: t.slice(0, i), w: t.slice(0, i), p: t.slice(i + 1), role: '' };
  });
  const core = { k: coreTok, w: coreTok };
  return { chunks, core, question, en: en.trim(), raw: str };
}

export function exKana(ex) {
  return ex.chunks.map(c => c.k + c.p).join(' ') + (ex.chunks.length ? ' ' : '') + ex.core.k + (ex.question ? '？' : '。');
}

function particleRomaji(p) {
  if (!p) return '';
  if (p.length > 1 && p.endsWith('も') && p !== 'も') return romajiParticle(p.slice(0, -1)) + ' mo';
  return romajiParticle(p);
}

/** Core romaji with "desu" split off: おいしいです → oishii desu. */
export function coreRomaji(k) {
  const r = kanaToRomaji(k);
  return k.length > 2 && k.endsWith('です') ? r.replace(/desu$/, ' desu') : r;
}

export function exRomaji(ex) {
  const parts = ex.chunks.map(c => kanaToRomaji(c.k) + (c.p ? ' ' + particleRomaji(c.p) : ''));
  parts.push(coreRomaji(ex.core.k));
  let s = parts.join(' ');
  s = s.charAt(0).toUpperCase() + s.slice(1);
  return s + (ex.question ? '?' : '.');
}
