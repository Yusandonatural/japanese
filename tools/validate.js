#!/usr/bin/env node
// Validates data/chNN.json files against the Tag Grammar example schema.
// Usage: node tools/validate.js [data/ch03.json ...]   (no args = all chapters)
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const particles = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/particles.json'), 'utf8'));
const scenes = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/scenes.json'), 'utf8')).map(s => s.id);
const P_ROLE = Object.fromEntries(particles.map(p => [p.p, p.role]));
const P_CH = Object.fromEntries(particles.map(p => [p.p, p.chapter]));
const ROLES = new Set([...particles.map(p => p.role), 'time', 'bare']);
const TENSES = new Set(['past', 'present', 'future']);
const COUNTS = {1: 150, 2: 200, 3: 200, 4: 200, 5: 200, 6: 200, 7: 200, 8: 200, 9: 200, 10: 250};
const MAX_CHUNKS = {1: 2, 2: 3, 3: 3, 4: 4, 5: 4, 6: 4, 7: 5, 8: 5, 9: 5, 10: 5};
const BAD_CORE = /(ましょうか|ね|よ)$/;
const BAD_CORE_UNLESS_PHRASE = /(ました|でした)$/;
const POLITE_TAIL = /(ます|ますか|です|ですか|ません|ませんか|ましょう|ください|なさい)$/;
const PHRASE_OK = new Set(['また明日','じゃあ、また','また','ただいま','いってらっしゃい','はじめまして','もしもし','どうぞ','お大事に','こんばんは','こんにちは','さようなら','いただきます','わかりました','ごちそうさまでした']);
const HAS_PARTICLE_TAIL = /(は|が|を|に|で|と|へ|から|まで|も)$/;

function strip(s) { return s.replace(/[、。？?！!\s　↗]/g, ''); }

function validateFile(file) {
  const errors = [];
  const err = (id, msg) => errors.push(`${id}: ${msg}`);
  let data;
  try { data = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { return [`${file}: invalid JSON – ${e.message}`]; }
  if (!Array.isArray(data)) return [`${file}: top level must be an array`];
  const m = path.basename(file).match(/ch(\d\d)\.json/);
  const chapter = m ? parseInt(m[1], 10) : null;
  if (!chapter) return [`${file}: file name must be chNN.json`];
  if (data.length !== COUNTS[chapter]) err('file', `expected ${COUNTS[chapter]} examples, got ${data.length}`);
  const allowedP = new Set(['', ...particles.filter(p => p.chapter <= chapter).map(p => p.p)]);
  if (chapter >= 7) particles.forEach(p => allowedP.add(p.p));
  const ids = new Set(), sentences = new Set();
  data.forEach((ex, i) => {
    const id = ex.id || `#${i}`;
    const expectId = `c${String(chapter).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}`;
    if (ex.id !== expectId) err(id, `id should be ${expectId}`);
    if (ids.has(ex.id)) err(id, 'duplicate id'); ids.add(ex.id);
    if (ex.chapter !== chapter) err(id, `chapter should be ${chapter}`);
    if (!scenes.includes(ex.scene)) err(id, `unknown scene "${ex.scene}"`);
    if (typeof ex.ja !== 'string' || !ex.ja) err(id, 'missing ja');
    if (typeof ex.kana !== 'string' || !ex.kana) err(id, 'missing kana');
    if (typeof ex.romaji !== 'string' || !ex.romaji) err(id, 'missing romaji');
    if (typeof ex.en !== 'string' || !ex.en) err(id, 'missing en');
    if (typeof ex.question !== 'boolean') err(id, 'question must be boolean');
    if (!TENSES.has(ex.tense)) err(id, `bad tense "${ex.tense}"`);
    if (![1, 2, 3].includes(ex.level)) err(id, 'level must be 1..3');
    if (!Array.isArray(ex.chunks)) { err(id, 'chunks must be array'); return; }
    if (ex.chunks.length > MAX_CHUNKS[chapter]) err(id, `too many chunks (${ex.chunks.length} > ${MAX_CHUNKS[chapter]})`);
    if (chapter > 1 && ex.chunks.length === 0) err(id, 'needs at least one chunk after chapter 1');
    if (!ex.core || typeof ex.core.w !== 'string') { err(id, 'missing core'); return; }
    if (BAD_CORE.test(ex.core.w)) err(id, `core "${ex.core.w}" must not end with ね/よ/ましょうか (four endings only: ます・ますか・ません・ましょう)`);
    if (ex.question && !/か$/.test(ex.core.w) && !PHRASE_OK.has(ex.core.w)) err(id, `question core "${ex.core.w}" must end with か`);
    if (!ex.question && /(ますか|ですか|ませんか)$/.test(ex.core.w)) err(id, `statement core "${ex.core.w}" must not end with か`);
    if (BAD_CORE_UNLESS_PHRASE.test(ex.core.w) && !PHRASE_OK.has(ex.core.w)) err(id, `core "${ex.core.w}" must not end with ました/でした (except a fixed greeting)`);
    if (!POLITE_TAIL.test(ex.core.w) && !PHRASE_OK.has(ex.core.w)) err(id, `core "${ex.core.w}" must be ます/です form (or a fixed greeting)`);
    if (HAS_PARTICLE_TAIL.test(ex.core.w) && !/^(ある|いる|する|来る|くる)$/.test(ex.core.w)) {
      // core like "好きだ" fine; but "本を読む" inside core is not
      if (/[をにでとへ]/.test(ex.core.w) && ex.core.w.length > 4) err(id, `core "${ex.core.w}" seems to contain a tagged chunk`);
    }
    let hasTime = false;
    ex.chunks.forEach((c, j) => {
      const cid = `${id}[${j}]`;
      if (typeof c.w !== 'string' || !c.w) err(cid, 'missing w');
      if (typeof c.k !== 'string' || !c.k) err(cid, 'missing k');
      if (typeof c.gloss !== 'string' || !c.gloss) err(cid, 'missing gloss');
      if (typeof c.omit !== 'boolean') err(cid, 'omit must be boolean');
      if (typeof c.p !== 'string') err(cid, 'p must be string');
      else {
        if (!(c.p in P_ROLE) && c.p !== '') err(cid, `unknown particle "${c.p}"`);
        else if (!allowedP.has(c.p)) err(cid, `particle "${c.p}" not yet introduced in chapter ${chapter}`);
        if (!ROLES.has(c.role)) err(cid, `bad role "${c.role}"`);
        else if (c.p === '' && !['time', 'bare'].includes(c.role)) err(cid, 'untagged chunk must have role time or bare');
        else if (c.p !== '' && c.role !== 'time' && c.role !== P_ROLE[c.p]) err(cid, `role "${c.role}" does not match particle ${c.p} (${P_ROLE[c.p]})`);
        if (c.role === 'time') hasTime = true;
        if (c.p === '' && HAS_PARTICLE_TAIL.test(c.w) && c.w.length > 1 && !/^(まで|から)$/.test(c.w)) err(cid, `untagged chunk "${c.w}" ends with a particle – move it to p`);
        if (c.p && c.w.endsWith(c.p) && c.w.length > c.p.length && !/^(これ|それ|あれ|どれ|だれ|誰|なに|何|ここ|そこ|あそこ|どこ|とき|時)$/.test(c.w)) {
          // w should not repeat the particle; warn only for obvious cases
          if (['は','が','を','へ','も'].includes(c.p)) err(cid, `w "${c.w}" already ends with particle ${c.p}`);
        }
      }
    });
    if (ex.tense !== 'present' && !hasTime) err(id, `tense "${ex.tense}" but no time chunk (role time)`);
    // reconstruct
    const built = ex.chunks.map(c => c.w + c.p).join('') + ex.core.w;
    if (strip(built) !== strip(ex.ja)) err(id, `ja mismatch: chunks+core = "${built}" vs ja "${ex.ja}"`);
    const builtK = ex.chunks.map(c => c.k + c.p).join('') + (ex.core.k || '');
    if (strip(builtK) !== strip(ex.kana)) err(id, `kana mismatch: "${builtK}" vs "${ex.kana}"`);
    if (ex.question && !/[？?]$/.test(ex.ja)) err(id, 'question sentence must end with ？');
    if (!ex.question && /[？?]$/.test(ex.ja)) err(id, 'non-question ends with ？');
    if (!ex.question && !/。$/.test(ex.ja)) err(id, 'statement must end with 。');
    if (sentences.has(strip(ex.ja))) err(id, 'duplicate sentence'); sentences.add(strip(ex.ja));
    if (!Array.isArray(ex.focusParticles)) err(id, 'focusParticles must be array');
    else ex.focusParticles.forEach(p => { if (!(p in P_ROLE)) err(id, `focusParticles has unknown "${p}"`); });
    if (!Array.isArray(ex.fixedOrder)) err(id, 'fixedOrder must be array of index arrays');
    else ex.fixedOrder.forEach(g => { if (!Array.isArray(g) || g.some(n => !Number.isInteger(n) || n < 0 || n >= ex.chunks.length)) err(id, 'fixedOrder indexes out of range'); });
    if (ex.context) {
      if (typeof ex.context.q_ja !== 'string' || typeof ex.context.q_en !== 'string') err(id, 'context needs q_ja and q_en');
      if (!ex.chunks.some(c => c.omit === false) && ex.chunks.length) err(id, 'context given but every chunk is omittable – keep the answer chunk (omit:false)');
    }
  });
  return errors;
}

const args = process.argv.slice(2);
const files = args.length ? args : fs.readdirSync(path.join(ROOT, 'data')).filter(f => /^ch\d\d\.json$/.test(f)).sort().map(f => path.join(ROOT, 'data', f));
let total = 0;
for (const f of files) {
  const errs = validateFile(f);
  total += errs.length;
  console.log(`${path.basename(f)}: ${errs.length ? errs.length + ' error(s)' : 'OK'}`);
  errs.slice(0, 60).forEach(e => console.log('  ' + e));
  if (errs.length > 60) console.log(`  … ${errs.length - 60} more`);
}
// cross-chapter duplicates
if (files.length > 1) {
  const seen = new Map();
  for (const f of files) {
    let d; try { d = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { continue; }
    if (!Array.isArray(d)) continue;
    d.forEach(ex => { const k = strip(ex.ja || ''); if (seen.has(k)) { console.log(`  cross-duplicate: ${ex.id} = ${seen.get(k)}`); total++; } else seen.set(k, ex.id); });
  }
}
process.exit(total ? 1 : 0);
