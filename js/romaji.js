// Kana → Hepburn romaji. Works in the browser (ES module) and in Node.
const TABLE = {
  'きゃ':'kya','きゅ':'kyu','きょ':'kyo','しゃ':'sha','しゅ':'shu','しょ':'sho','ちゃ':'cha','ちゅ':'chu','ちょ':'cho',
  'にゃ':'nya','にゅ':'nyu','にょ':'nyo','ひゃ':'hya','ひゅ':'hyu','ひょ':'hyo','みゃ':'mya','みゅ':'myu','みょ':'myo',
  'りゃ':'rya','りゅ':'ryu','りょ':'ryo','ぎゃ':'gya','ぎゅ':'gyu','ぎょ':'gyo','じゃ':'ja','じゅ':'ju','じょ':'jo',
  'ぢゃ':'ja','ぢゅ':'ju','ぢょ':'jo','びゃ':'bya','びゅ':'byu','びょ':'byo','ぴゃ':'pya','ぴゅ':'pyu','ぴょ':'pyo',
  'てぃ':'ti','でぃ':'di','でゅ':'dyu','ふぁ':'fa','ふぃ':'fi','ふぇ':'fe','ふぉ':'fo','うぃ':'wi','うぇ':'we','うぉ':'wo',
  'ゔぁ':'va','ゔぃ':'vi','ゔぇ':'ve','ゔぉ':'vo','しぇ':'she','じぇ':'je','ちぇ':'che','つぁ':'tsa','つぇ':'tse','つぉ':'tso',
  'あ':'a','い':'i','う':'u','え':'e','お':'o','か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko',
  'さ':'sa','し':'shi','す':'su','せ':'se','そ':'so','た':'ta','ち':'chi','つ':'tsu','て':'te','と':'to',
  'な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no','は':'ha','ひ':'hi','ふ':'fu','へ':'he','ほ':'ho',
  'ま':'ma','み':'mi','む':'mu','め':'me','も':'mo','や':'ya','ゆ':'yu','よ':'yo','ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro',
  'わ':'wa','ゐ':'i','ゑ':'e','を':'o','ん':'n','が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go',
  'ざ':'za','じ':'ji','ず':'zu','ぜ':'ze','ぞ':'zo','だ':'da','ぢ':'ji','づ':'zu','で':'de','ど':'do',
  'ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo','ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po','ゔ':'vu',
  'ぁ':'a','ぃ':'i','ぅ':'u','ぇ':'e','ぉ':'o','ゃ':'ya','ゅ':'yu','ょ':'yo','ー':'-','、':',','。':'.','？':'?','！':'!','　':' '
};
const VOWELS = 'aiueo';
const LONG = {a:'ā', i:'ī', u:'ū', e:'ē', o:'ō'};

function kataToHira(s) {
  return s.replace(/[ァ-ヶ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

/** Convert a kana string to Hepburn romaji. Particles は/へ are handled by romajiParticle. */
export function kanaToRomaji(input, opts = {}) {
  const s = kataToHira(input);
  let out = '';
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === 'っ') {
      // gemination: double next consonant (chi → tchi)
      const next = s.slice(i + 1, i + 3);
      const nr = TABLE[next] || TABLE[s[i + 1]] || '';
      let c = nr[0] || '';
      if (nr.startsWith('ch')) c = 't';
      out += c; i++; continue;
    }
    if (ch === 'ん') {
      const nextKana = s[i + 1];
      const nr = nextKana ? (TABLE[s.slice(i + 1, i + 3)] || TABLE[nextKana] || '') : '';
      out += (nr && (VOWELS.includes(nr[0]) || nr[0] === 'y')) ? "n'" : 'n';
      i++; continue;
    }
    const two = s.slice(i, i + 2);
    if (TABLE[two] && two.length === 2 && s[i + 1] && 'ゃゅょぁぃぅぇぉ'.includes(s[i + 1])) { out = addSyllable(out, TABLE[two]); i += 2; continue; }
    if (ch === 'ー') { const last = out.slice(-1); out = out.slice(0, -1) + (LONG[last] || last); i++; continue; }
    if (TABLE[ch] !== undefined) { out = addSyllable(out, TABLE[ch]); i++; continue; }
    out += ch; i++;
  }
  if (opts.capitalize && out) out = out[0].toUpperCase() + out.slice(1);
  return out;
}

function addSyllable(out, r) {
  // long vowels: おう→ō, おお→ō, うう→ū, えい stays "ei", いい stays "ii"
  const last = out.slice(-1);
  if (r === 'u' && (last === 'o' || last === 'u')) return out.slice(0, -1) + LONG[last];
  if (r === 'o' && last === 'o') return out.slice(0, -1) + 'ō';
  if (r === 'a' && last === 'a') return out.slice(0, -1) + 'ā';
  return out + r;
}

/** Romaji for a particle as it is pronounced. */
export function romajiParticle(p) {
  if (p === 'は') return 'wa';
  if (p === 'へ') return 'e';
  if (p === 'を') return 'o';
  return kanaToRomaji(p);
}

/** Romaji for one chunk {k, p}: word + space + particle. */
export function chunkRomaji(c) {
  const w = kanaToRomaji(c.k);
  return c.p ? `${w} ${romajiParticle(c.p)}` : w;
}

/** Full sentence romaji from chunks and core. */
export function sentenceRomaji(ex) {
  const parts = ex.chunks.map(chunkRomaji);
  parts.push(kanaToRomaji(ex.core.k));
  let s = parts.join(' ').replace(/\s+/g, ' ').trim();
  s = s[0].toUpperCase() + s.slice(1);
  return s + (ex.question ? '?' : '.');
}
