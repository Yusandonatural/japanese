// UI localisation. English strings are the keys; the Turkish edition (/tr/) looks them up in TR.
// Pages under /tr/ have <html data-locale="tr">. Static HTML marked with data-i18n is translated at
// build time by tools/build-tr.mjs; strings built in JavaScript go through t().
export const LOCALE = (typeof document !== 'undefined' && document.documentElement.dataset.locale) || 'en';

export function t(key, vars) {
  let s = (LOCALE === 'tr' && Object.prototype.hasOwnProperty.call(TR, key)) ? TR[key] : key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
  return s;
}

export const TR = {
  // header / footer
  'Home': 'Ana sayfa', 'Lessons': 'Dersler', 'Grammar': 'Dilbilgisi', 'Words': 'Kelimeler', 'Scenes': 'Sahneler', 'Progress': 'İlerleme',
  'Tag Grammar · 2000 real-life sentences': 'Etiket Dilbilgisi · 2000 gerçek hayat cümlesi',
  'Printable workbooks': 'Yazdırılabilir çalışma kitapları',
  'Learn Japanese in English': 'Japoncayı İngilizce öğren', 'Learn Japanese in Turkish': 'Japoncayı Türkçe öğren',

  // chapters
  'Core only': 'Sadece çekirdek', 'One word is a sentence. Greetings, time words, bare nouns.': 'Tek kelime de bir cümledir. Selamlaşmalar, zaman kelimeleri, yalın isimler.',
  'は and が': 'は ve が', 'Topic vs. doer. Introduce yourself, describe people and things.': 'Konu ve yapan. Kendini tanıt, insanları ve şeyleri anlat.',
  'を and に': 'を ve に', 'Target and goal: what you buy, where you go, who you tell.': 'Hedef ve varış: ne aldığın, nereye gittiğin, kime söylediğin.',
  'で and と': 'で ve と', 'Place of action, means, and “with”.': 'Eylemin yapıldığı yer, araç ve “ile”.',
  'Direction, start and end points, spans of time.': 'Yön, başlangıç ve bitiş noktaları, zaman aralıkları.',
  'も and の': 'も ve の', '“Also”, and linking nouns with の inside a chunk.': '“de/da” ve bir parçanın içinde isimleri の ile bağlamak.',
  'Move the chunks': 'Parçaları taşı', 'Same sentence, new order, new emphasis. All ten tags.': 'Aynı cümle, yeni sıra, yeni vurgu. On etiketin hepsi.',
  'Drop the chunks': 'Parçaları at', 'Answer with only what is new. Context does the rest.': 'Sadece yeni olanla cevap ver. Gerisini bağlam halleder.',
  'Decorate the chunks': 'Parçaları süsle', 'Adjectives, の-links, numbers and colours inside a chunk.': 'Parçanın içinde sıfatlar, の bağları, sayılar ve renkler.',
  'Talk in scenes': 'Sahnelerle konuş', 'Twelve real-life scenes, start to finish. Final test.': 'Baştan sona on iki gerçek hayat sahnesi. Final sınavı.',

  // chunk cards / examples
  'core': 'çekirdek', 'time': 'zaman', 'noun': 'isim', 'Listen': 'Dinle',

  // quiz
  'Split': 'Böl', 'Tag it': 'Etiketle', 'Build it': 'Kur', 'Move it': 'Taşı', 'Drop it': 'At', 'Say it': 'Söyle', 'Hear it': 'Dinle',
  'Ch{n}': 'Bl.{n}',
  'Where do the tags split this sentence?': 'Etiketler bu cümleyi nereden bölüyor?',
  'Pick the right tag for each highlighted chunk.': 'İşaretli her parça için doğru etiketi seç.',
  'Tap the pieces in an order that works. Core stays last.': 'Parçalara uygun bir sırayla dokun. Çekirdek hep sonda kalır.',
  'Tap the chunk to bring to the front, to stress "{g}".': '"{g}" anlamını vurgulamak için öne alınacak parçaya dokun.',
  'What can you drop when the context is already clear?': 'Bağlam zaten açıksa neyi atabilirsin?',
  '🔊 Play': '🔊 Dinle',

  // drill / test
  'Drill': 'Alıştırma', 'Chapter {n}': 'Bölüm {n}', 'Drill · Chapter {n}. {title}': 'Alıştırma · Bölüm {n}. {title}',
  'Skip': 'Geç', 'Check': 'Kontrol et', 'Next →': 'Sonraki →', 'Nice work 🎉': 'Harika iş 🎉', 'Next lesson →': 'Sonraki ders →',
  'Back to chapter': 'Bölüme dön', 'Question {n} / {total}': 'Soru {n} / {total}', '✓ That works.': '✓ Doğru.',
  'Not quite. → {x}': 'Tam değil. → {x}', '✗ Not quite — try to notice the difference and move on.': '✗ Tam değil — farkı görmeye çalış ve devam et.',
  'You got {c} of {a} right.': '{a} sorudan {c} tanesini doğru yaptın.', 'Keep an eye on:': 'Bunlara dikkat et:', 'no tag': 'etiket yok',
  'Day {n} lesson →': '{n}. gün dersi →',
  'Chapter test': 'Bölüm sınavı', 'Result': 'Sonuç', 'Try again': 'Tekrar dene', 'See progress': 'İlerlemeyi gör', 'Test': 'Sınav',
  'Final test · all 10 chapters': 'Final sınavı · 10 bölümün hepsi', 'Chapter {n} test': 'Bölüm {n} sınavı',
  'A mix of 100 questions drawn from everything you have learned.': 'Öğrendiğin her şeyden seçilmiş 100 karışık soru.',
  '30 questions from Chapter {n}. {title}.': 'Bölüm {n} ({title}) üzerine 30 soru.',
  'Passed 🎉': 'Geçtin 🎉', 'Keep practicing': 'Çalışmaya devam',
  'You have the basics. Time to talk.': 'Temeller sende. Şimdi konuşma zamanı.',
  'Chapter {n} is ready when you are.': 'Hazır olduğunda Bölüm {n} seni bekliyor.',
  'No rush — drill this chapter again before moving on.': 'Acele yok — devam etmeden önce bu bölümü tekrar çalış.',

  // progress
  'Your progress': 'İlerlemen', '14-day plan': '14 günlük plan', 'Chapter tests': 'Bölüm sınavları', 'Tag accuracy': 'Etiket doğruluğu',
  'Based on your drill and test answers in this browser.': 'Bu tarayıcıdaki alıştırma ve sınav cevaplarına göre.',
  'Reset all progress': 'Tüm ilerlemeyi sıfırla', 'Day {n}': '{n}. gün', 'No chapter tests taken yet.': 'Henüz bölüm sınavı yapılmadı.',
  'not taken': 'yapılmadı', 'Do a drill or two, and this fills in.': 'Bir iki alıştırma yap, burası dolacak.',
  'Reset all progress on this device? This cannot be undone.': 'Bu cihazdaki tüm ilerleme sıfırlansın mı? Bu işlem geri alınamaz.',

  // scenes
  'Browse by scene': 'Sahnelere göre göz at',
  'Every one of the 2,000 sentences belongs to a real-life scene. Pick one to see it in context.': '2.000 cümlenin her biri gerçek hayattan bir sahneye ait. Cümleleri bağlamı içinde görmek için bir sahne seç.',
  '{n} sentences': '{n} cümle',
  'See all example sentences for this scene →': 'Bu sahnenin tüm örnek cümlelerini gör →',

  // home
  'Day {d} of 14': 'Gün {d} / 14', 'Day 1 of 14': 'Gün 1 / 14', '{n} days done': '{n} gün tamamlandı', '{n} day done': '{n} gün tamamlandı', 'not started yet': 'henüz başlamadın',
  'Continue → Day {d}': 'Devam → {d}. gün', 'Start Day 1 →': '1. güne başla →', 'Chapter {n} · Day {d}': 'Bölüm {n} · Gün {d}',

  // chapter page
  'Chapter {n}. {title}': 'Bölüm {n}. {title}', '(all 10 tags)': '(10 etiketin hepsi)', 'All ({n})': 'Hepsi ({n})',
  '+ {n} more — head to the drill to see them all.': '+ {n} tane daha — hepsini görmek için alıştırmaya geç.',
  '📖 Day {d} lesson': '📖 {d}. gün dersi',

  // lessons
  'Daily lessons': 'Günlük dersler', '14 daily lessons': '14 günlük ders',
  "Read the day's lesson (about 15 minutes), then do the drill. Each lesson explains one step of Tag Grammar with examples you can listen to.": 'Günün dersini oku (yaklaşık 15 dakika), sonra alıştırmayı yap. Her ders Etiket Dilbilgisi’nin bir adımını, dinleyebileceğin örneklerle anlatır.',
  'Day {d} of 14 · Chapter {c}: {t} · about {m} min': 'Gün {d} / 14 · Bölüm {c}: {t} · yaklaşık {m} dk',
  'Try it': 'Dene', 'Say it out loud first, then tap to check.': 'Önce yüksek sesle söyle, sonra kontrol etmek için dokun.',
  'Key words': 'Anahtar kelimeler', 'Recap': 'Özet', 'Next:': 'Sonraki:', 'Now practise': 'Şimdi pratik yap',
  'A short drill on Chapter {c}. It marks Day {d} as done.': 'Bölüm {c} üzerine kısa bir alıştırma. Bitirince {d}. gün tamamlanmış sayılır.',
  'Examples': 'Örnekler', 'Start the drill →': 'Alıştırmaya başla →', '← Day {d}': '← {d}. gün', 'Day {d} →': '{d}. gün →',
  'All lessons': 'Tüm dersler', 'Watch out': 'Dikkat', 'Loading…': 'Yükleniyor…',

  // grammar
  'Answers:': 'Cevapladığı soru:', 'Learned on Day {d}': '{d}. günde öğrenilir', 'Common mistake': 'Sık yapılan hata', 'Common mistakes': 'Sık yapılan hatalar',
  'Ending': 'Ek', 'Use': 'Kullanım', 'Example': 'Örnek', '(no tag)': '(etiket yok)', 'In Turkish: {x}': 'Türkçede: {x}',

  // words
  'All': 'Hepsi', 'Verbs': 'Fiiller', 'Describing': 'Nitelemeler', 'Things & places': 'Şeyler ve yerler', 'People & animals': 'İnsanlar ve hayvanlar',
  'Time': 'Zaman', 'Question words': 'Soru kelimeleri', 'Set phrases': 'Kalıp ifadeler', 'Requests': 'Rica',
  '{n} word · sorted by how often they appear': '{n} kelime · kullanım sıklığına göre', '{n} words · sorted by how often they appear': '{n} kelime · kullanım sıklığına göre',
  'Chapter {c} · {n}×': 'Bölüm {c} · {n}×', 'Show more': 'Daha fazla göster',
  'Moving': 'Hareket', 'Daily life': 'Günlük hayat', 'Food': 'Yemek', 'Talking': 'Konuşma', 'Thinking': 'Düşünme', 'Giving & getting': 'Verme ve alma',
  'Work': 'İş', 'At home': 'Ev', 'Body': 'Vücut', 'Feelings': 'Duygular', 'Other': 'Diğer',
  '{n} verb · most useful first': '{n} fiil · en kullanışlıları başta', '{n} verbs · most useful first': '{n} fiil · en kullanışlıları başta',
  'not used': 'kullanılmaz', 'Dictionary form: {d} · group {g}': 'Sözlük biçimi: {d} · grup {g}', ' · usually with {t}': ' · genelde {t} ile',
  'Past': 'Geçmiş', 'Now & habits': 'Şimdi ve alışkanlıklar', 'Future': 'Gelecek',
  'At Level 1 the core never changes. These words — placed as a chunk with <b>no tag</b> — tell the listener when. <span class="muted">(In Level 2 you will also change the verb: いきました.)</span>': '1. seviyede çekirdek hiç değişmez. Bu kelimeler — <b>etiketsiz</b> bir parça olarak — dinleyene zamanı söyler. <span class="muted">(2. seviyede fiili de değiştireceksin: いきました.)</span>',
  'きのう なら.に いきます。|I went to Nara yesterday.': 'きのう なら.に いきます。|Dün Nara’ya gittim.',
  'まいにち おちゃ.を のみます。|I drink tea every day.': 'まいにち おちゃ.を のみます。|Her gün çay içerim.',
  "あした なら.に いきます。|I'll go to Nara tomorrow.": 'あした なら.に いきます。|Yarın Nara’ya gideceğim.',
  'あした ともだち.と なら.に いきますか？|Are you going to Nara with a friend tomorrow?': 'あした ともだち.と なら.に いきますか？|Yarın bir arkadaşınla Nara’ya gidiyor musun?',

  // ---- static page text (translated at build time by tools/build-tr.mjs) ----
  'Learn spoken Japanese in 14 days with <b>Tag Grammar</b>: every sentence is a set of tagged chunks in front of one final verb. Move the chunks, keep the tags, say it your way.': 'Konuşma Japoncasını <b>Etiket Dilbilgisi</b> ile 14 günde öğren: her cümle, sondaki tek bir fiilin önünde duran etiketli parçalardan oluşur. Parçaları taşı, etiketleri koru, kendi bildiğin gibi söyle.',
  'How it works': 'Nasıl çalışır', '1. Tags, not word order': '1. Kelime sırası değil, etiketler',
  "は が を に で と へ から まで も — ten tags mark each chunk's job. Put the chunks in any order you like.": 'は が を に で と へ から まで も — on etiket her parçanın görevini gösterir; tıpkı Türkçedeki hâl ekleri gibi. Parçaları istediğin sırayla söyle.',
  '2. Four endings, nothing else': '2. Sadece dört ek',
  "いきます (go) · いきますか (go?) · いきません (don't go) · いきましょう (let's go). That's the whole verb system at level 1.": 'いきます (gidiyorum) · いきますか (gidiyor musun?) · いきません (gitmiyorum) · いきましょう (gidelim). 1. seviyedeki fiil sisteminin tamamı bu.',
  '3. Time words do the tense': '3. Zamanı zaman kelimeleri gösterir',
  'Past and future come from a time word — きのう (yesterday), あした (tomorrow), らいしゅう (next week). The verb never changes.': 'Geçmiş ve gelecek bir zaman kelimesinden anlaşılır — きのう (dün), あした (yarın), らいしゅう (gelecek hafta). Fiil hiç değişmez.',
  'The 10 chapters': '10 bölüm', 'How each day works': 'Her gün nasıl geçer',
  '1. Read the lesson': '1. Dersi oku',
  'About 15 minutes. One new step of Tag Grammar, with examples you can listen to and a short "try it" quiz.': 'Yaklaşık 15 dakika. Etiket Dilbilgisi’nin yeni bir adımı; dinleyebileceğin örnekler ve kısa bir “dene” testi.',
  '2. Do the drill': '2. Alıştırmayı yap',
  'Split, tag, build, move and drop chunks in real sentences. Finishing it marks the day as done.': 'Gerçek cümlelerde parçaları böl, etiketle, kur, taşı ve at. Bitirdiğinde gün tamamlanmış sayılır.',
  '3. Keep the phrases': '3. İfadeleri yanında tut',
  'The phrase book and word list are there whenever you need a sentence for real life.': 'Gerçek hayatta bir cümleye ihtiyacın olduğunda ifade kılavuzu ve kelime listesi hep burada.',
  'Reference': 'Başvuru', 'Tag grammar rules': 'Etiket dilbilgisi kuralları', 'Words & phrases': 'Kelimeler ve ifadeler',
  '← Prev': '← Önceki', 'Start drill →': 'Alıştırmaya başla →', 'gloss': 'anlam',
  'Phrase book': 'İfade kılavuzu', '200 verbs': '200 fiil', 'Word list': 'Kelime listesi', 'Time words': 'Zaman kelimeleri',
  'Ready-to-say phrases for twelve everyday scenes, the 200 most useful verbs, every word used in the 2,000 examples, and the time words that do the job of past and future.': 'On iki günlük sahne için hazır ifadeler, en kullanışlı 200 fiil, 2.000 örnekte geçen her kelime ve geçmişle geleceği anlatan zaman kelimeleri.',
  "The 200 verbs you will use most in conversation, each in the four Level-1 endings: <b>ます</b> (do) · <b>ますか</b> (do?) · <b>ません</b> (don't) · <b>ましょう</b> (let's). Tap a verb to hear it and see an example.": 'Konuşmada en çok kullanacağın 200 fiil, 1. seviyenin dört ekiyle: <b>ます</b> (-iyorum) · <b>ますか</b> (-iyor musun?) · <b>ません</b> (-miyorum) · <b>ましょう</b> (-elim). Dinlemek ve örnek görmek için bir fiile dokun.',
  'Search kana, romaji or English…': 'Kana, romaji veya Türkçe ara…',
  'Tag Grammar': 'Etiket Dilbilgisi',
  'A Japanese sentence is a row of tagged chunks with one core at the end. Learn what each tag does, and you can put the chunks in whatever order you like.': 'Japonca bir cümle, sonunda tek bir çekirdek olan etiketli parçalar dizisidir. Her etiketin ne işe yaradığını öğren; parçaları istediğin sırayla söyleyebilirsin.',
  'Sentence anatomy — tap 🔊 to listen': 'Cümlenin yapısı — dinlemek için 🔊 simgesine dokun',
  '<b>chunk</b> = noun + tag': '<b>parça</b> = isim + etiket', '<b>core</b> = the last word, always': '<b>çekirdek</b> = her zaman son kelime',
  '<b>ます・ますか・ません・ましょう</b> = the only four endings': '<b>ます・ますか・ません・ましょう</b> = yalnızca dört ek',
  '5 principles': '5 ilke', 'Level 1 rules': '1. seviye kuralları', 'The core': 'Çekirdek', 'The 10 tags': '10 etiket', 'No tag': 'Etiketsiz',
  'Easy to confuse': 'Kolay karışanlar', 'Five principles': 'Beş ilke', 'Level 1 — four endings, nothing else': '1. seviye — sadece dört ek',
  'Most courses spend weeks on verb forms before you can say anything. Tag Grammar postpones all of that. At Level 1 the core has just four endings — ます, ますか, ません, ましょう — and time words do the rest. Learn these and start talking.': 'Çoğu kurs, daha tek cümle kuramadan haftalarca fiil çekimi öğretir. Etiket Dilbilgisi bunların hepsini erteler. 1. seviyede çekirdeğin sadece dört eki vardır — ます, ますか, ません, ましょう — gerisini zaman kelimeleri halleder. Bunları öğren ve konuşmaya başla.',
  'Print': 'Yazdır', '50 questions per chapter, with an answer key at the end. Open a chapter and print or save as PDF.': 'Her bölüm için 50 soru, sonunda cevap anahtarı. Bir bölümü aç, yazdır ya da PDF olarak kaydet.', 'Workbook · 50 questions': 'Çalışma kitabı · 50 soru',
  'Chapter 1': 'Bölüm 1', 'Chapter 2': 'Bölüm 2', 'Chapter 3': 'Bölüm 3', 'Chapter 4': 'Bölüm 4', 'Chapter 5': 'Bölüm 5', 'Chapter 6': 'Bölüm 6', 'Chapter 7': 'Bölüm 7', 'Chapter 8': 'Bölüm 8', 'Chapter 9': 'Bölüm 9', 'Chapter 10': 'Bölüm 10',
  'Speak Japanese in 14 days': '14 günde Japonca konuş', 'Tap the sentence: the chunks move, the meaning stays.': 'Cümleye dokun: parçalar yer değiştirir, anlam aynı kalır.',
  "あした ともだち.と なら.に いきます。|Tomorrow I'm going to Nara with a friend.": 'あした ともだち.と なら.に いきます。|Yarın bir arkadaşımla Nara’ya gidiyorum.',
  'The core — four kinds': 'Çekirdek — dört tür', 'No tag at all': 'Hiç etiket yok', 'の — the glue inside a chunk': 'の — parçanın içindeki yapıştırıcı',
};
