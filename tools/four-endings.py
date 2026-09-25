# One-off migration to the "four endings" rule: questions get か, some statements become ましょう,
# and context questions are rewritten in kana. Kept for reference.
import json, re, pykakasi
kk = pykakasi.kakasi()
def hira(s): return ''.join(x['orig'] if re.fullmatch(r'[ァ-ヺー]+', x['orig']) else x['hira'] for x in kk.convert(s))
VOL = set('いきます たべます のみます かえります はじめます やすみます あいます かいます つくります あるきます みます そうじします でかけます まちます はなします します でます のります よびます しらべます あそびます うたいます すわります おくります ならびます いれます あけます しめます つみます はこびます'.split())
stats = {'q': 0, 'lets': 0, 'ctx': 0}
all_ja = set()
chapters = {}
for n in range(1, 11):
    chapters[n] = json.load(open(f'data/ch{n:02d}.json'))
    for e in chapters[n]: all_ja.add(e['kana'])
for n, exs in chapters.items():
    lets_done = 0
    cap = 12 if n > 1 else 8
    for i, e in enumerate(exs):
        c = e['core']
        if e['question'] and re.search(r'(ます|です|ません)$', c['k']):
            c['k'] += 'か'; c['w'] += 'か'
            e['ja'] = re.sub(r'？$', 'か？', e['ja']); e['kana'] = re.sub(r'？$', 'か？', e['kana'])
            stats['q'] += 1
        en = e['en']
        forced = re.match(r"^(Let's|Shall we)", en)
        cand = (not e['question'] and c['k'] in VOL and re.match(r"^(I|We)('ll| will) ", en) and not re.search(r"\b(off|you)\b", en)
                and not any(ch['p'] in ('は', 'が', 'と', 'も') for ch in e['chunks'])
                and not re.search(r"\b(me|I|my|myself)\b", re.sub(r"^(I|We)('ll| will) ", '', en))
                and lets_done < cap)
        if (forced or cand) and c['k'].endswith(('ます', 'ますか')):
            base_k = re.sub(r'か$', '', c['k']); base_w = re.sub(r'か$', '', c['w'])
            newk = base_k[:-2] + 'ましょう'
            newkana = re.sub(r'ますか？$|ます。$', 'ましょう。', e['kana'])
            if newkana in all_ja: continue
            all_ja.add(newkana)
            c['k'] = newk; c['w'] = base_w[:-2] + 'ましょう'
            e['ja'] = re.sub(r'ますか？$|ます。$', 'ましょう。', e['ja']); e['kana'] = newkana
            e['question'] = False
            e['en'] = re.sub(r"^(I'll|I will|We'll|We will|Shall we) ", "Let's ", en).rstrip('?') .rstrip('.') + '.'
            e['en'] = e['en'][0] + e['en'][1:]
            lets_done += 1; stats['lets'] += 1
        ctx = e.get('context')
        if ctx and ctx.get('q_ja'):
            q = hira(ctx['q_ja'])
            q = re.sub(r'(ます|です|ません)？$', r'\1か？', q)
            ctx['q_ja'] = q; stats['ctx'] += 1
    json.dump(exs, open(f'data/ch{n:02d}.json', 'w'), ensure_ascii=False, indent=1)
print(stats)
