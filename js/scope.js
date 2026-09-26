// What has been taught by a given chapter/day, so drills and instant-speaking cards only use
// sentences the learner has actually learned to build.
import { parseEx, exKana } from './exparse.js';

const SCENES_DAY13 = new Set(['greeting', 'shopping', 'food', 'transport', 'time', 'phone']);
const hasNoLink = w => /.の./.test(w) && !/^(この|その|あの|どの)/.test(w) && w !== 'この前';
const hasAdj = w => /.[いな][一-龯ァ-ヶおご]/.test(w) || /^(この|その|あの|どの)./.test(w);
const hasNumber = w => /[一二三四五六七八九十百千0-9０-９]+[つ人枚本杯個台匹冊回分円歳]|^(ひとつ|ふたつ|みっつ|よっつ|いつつ|ひとり|ふたり)/.test(w);

/** The last day of the course the learner has reached for this chapter (day param wins). */
const DAYS = { 1: [1], 2: [2], 3: [3], 4: [4], 5: [5, 6], 6: [7], 7: [8, 9], 8: [10], 9: [11, 12], 10: [13, 14] };
export function dayFor(ch, day) {
  const days = DAYS[Number(ch)] || [14];
  const d = Number(day);
  return days.includes(d) ? d : days[days.length - 1];
}

/** true if every piece of the sentence has been taught by (chapter, day). */
export function inScope(ex, ch, day) {
  const d = dayFor(ch, day);
  const words = [...ex.chunks.map(c => c.w || c.k), ex.core.w || ex.core.k];
  if (d < 6 && ex.chunks.some(c => c.p === 'まで')) return false;          // まで arrives on day 6
  if (d < 7 && words.some(hasNoLink)) return false;                        // の-links: day 7
  if (d < 11 && words.some(hasAdj)) return false;                          // decorations: day 11
  if (d < 12 && words.some(hasNumber)) return false;                       // numbers & counters: day 12
  if (d === 13 && !SCENES_DAY13.has(ex.scene)) return false;               // scenes part 1
  if (d === 14 && SCENES_DAY13.has(ex.scene)) return false;                // scenes part 2
  return true;
}

/** Chapter examples limited to what has been taught; falls back to the whole chapter if too few. */
export function scopedExamples(examples, ch, day, min = 12) {
  const inside = examples.filter(e => inScope(e, ch, day));
  return inside.length >= min ? inside : examples;
}

/** Example sentences from the lesson(s) of this chapter up to `day`, as drill-ready objects. */
export function lessonExamples(lessons, ch, day) {
  const d = dayFor(ch, day);
  const out = [];
  lessons.filter(l => l.chapter === Number(ch) && l.day <= d).forEach(l => {
    const strs = [...l.sections.flatMap(s => [...(s.ex || []), ...(s.right || [])]), ...(l.tryit || []).map(x => x.a)];
    strs.forEach((str, i) => {
      if (!str || !str.includes('|')) return;
      const ex = parseEx(str);
      if (!ex.en) return;
      ex.chunks.forEach(c => { if (!c.role) c.role = c.p ? '' : 'bare'; });
      const kana = exKana(ex).replace(/ /g, '');
      out.push({ ...ex, id: `L${l.day}-${i}`, chapter: Number(ch), scene: 'lesson', kana, ja: kana, fromLesson: true });
    });
  });
  const seen = new Set();
  return out.filter(e => (seen.has(e.kana) ? false : seen.add(e.kana)));
}
