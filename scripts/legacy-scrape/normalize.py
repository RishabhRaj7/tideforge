#!/usr/bin/env python3
"""Turn raw scrape output into the final JSON consumed by the Next.js app (+ slim calculator payload)."""
import sys, os, re, json
sys.path.insert(0, os.path.dirname(__file__))
from chars import file_urls, download

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
D = os.path.join(ROOT, 'src', 'data')
ld = lambda n: json.load(open(os.path.join(D, n + '.raw.json')))
sv = lambda n, o: json.dump(o, open(os.path.join(D, n + '.json'), 'w'), ensure_ascii=False, separators=(',', ':'))

STAT_BEFORE = [
    (r'Crit\. ?Rate', 'critRate'), (r'Crit\. ?DMG', 'critDmg'), (r'Energy Regen', 'er'), (r'ATK', 'atkPct'), (r'HP', 'hpPct'), (r'DEF', 'defPct'),
    (r'Basic Attack DMG(?: Bonus)?', 'basic'), (r'Heavy Attack DMG(?: Bonus)?', 'heavy'), (r'Resonance Skill DMG(?: Bonus)?', 'skill'),
    (r'Resonance Liberation DMG(?: Bonus)?', 'lib'), (r'Intro Skill DMG(?: Bonus)?', 'intro'), (r'Outro Skill DMG(?: Bonus)?', 'outro'),
    (r'Echo Skill DMG(?: Bonus)?', 'echoSkill'), (r'Healing Bonus', 'heal'),
    (r'(?:Glacio|Fusion|Electro|Aero|Spectro|Havoc|All-Attribute|Attribute) DMG(?: Bonus)?', 'ele'),
]
TRIG = re.compile(r'(Casting|When|After|Upon|for \d+s|Hitting|Dealing|Inflicting|Using|If |While|Each|Within|Triggering|Attacking|Reaching|releasing|Releasing|Switching|stack)', re.I)


def label_for(text, s, e):
    before = text[max(0, s - 60):s]
    after = text[e:e + 60]
    mb = re.search(r'(' + '|'.join(p for p, _ in STAT_BEFORE) + r')\s*(?:by|\+|is increased by|increased by|up by)?\s*$', before)
    if mb:
        for p, k in STAT_BEFORE:
            if re.fullmatch(p, mb.group(1)):
                return k, mb.group(1)
    ma = re.match(r'^\s*(' + '|'.join(p for p, _ in STAT_BEFORE) + r')\b', after)
    if ma:
        for p, k in STAT_BEFORE:
            if re.fullmatch(p, ma.group(1)):
                return k, ma.group(1)
    return None, None


def sentence(text, i):
    a = max(text.rfind('.\n', 0, i), text.rfind('. ', 0, i), text.rfind('\n', 0, i))
    b_c = [x for x in (text.find('. ', i), text.find('.\n', i), text.find('\n', i)) if x != -1]
    b = min(b_c) if b_c else len(text)
    return text[a + 1:b + 1].strip()


def parse_buffs(texts):
    """texts: list of effect texts per rank (1 or 5). Returns list of buffs with per-rank values."""
    base = texts[0]
    pat = re.compile(r'(\d+(?:\.\d+)?)%')
    ms = list(pat.finditer(base))
    allm = [list(pat.finditer(t)) for t in texts]
    buffs = []
    if any(len(a) != len(ms) for a in allm):
        return buffs
    for i, m in enumerate(ms):
        key, lab = label_for(base, m.start(), m.end())
        if not key:
            continue
        sent = sentence(base, m.start())
        vals = [float(a[i].group(1)) for a in allm]
        el = None
        if key == 'ele':
            me = re.match(r'(Glacio|Fusion|Electro|Aero|Spectro|Havoc)', lab)
            el = me.group(1) if me else None
        stacks = 1
        ms2 = re.search(r'(?:up to|max(?:imum)?(?: of)?|stack(?:s|ing)? up to) (\d+) (?:stack|time|layer)', sent, re.I)
        if ms2:
            stacks = int(ms2.group(1))
        always = not TRIG.search(sent)
        b = {'stat': key, 'v': vals, 'always': always, 'stacks': stacks, 'text': sent[:160]}
        if el:
            b['el'] = el
        buffs.append(b)
    return buffs


def main():
    chars = ld('characters')
    weapons = ld('weapons')
    echoes = ld('echoes')
    sonatas = ld('sonatas')
    events = ld('events')
    banners = ld('banners')

    # Rover imagery
    urls = file_urls(['File:Rover 1.png', 'File:Female Rover 1.jpg', 'File:Male Rover 1.jpg'])
    ok = {}
    for k, f in (('card', 'File:Rover 1.png'), ('splash', 'File:Female Rover 1.jpg')):
        if f in urls and download(urls[f], os.path.join(ROOT, 'public/img/characters/rover-%s.webp' % k), 800):
            ok[k] = '/img/characters/rover-%s.webp' % k
    avg = {5: (900, 33, 96), 4: (780, 21, 90)}
    for c in chars:
        if c['name'].startswith('Rover') and ok:
            c['images'].update(ok)
            c['images']['sprite'] = ok.get('card', ok.get('splash'))
        if not c['base']['hp']:
            h, a, d = avg.get(c['rarity'], avg[5])
            c['base'] = {'hp': h, 'atk': a, 'def': d}
            c['statsEstimated'] = True
        if len(c['skills']) < 4:
            c['limited'] = True
        for s in c['skills']:
            s.pop('icon', None)
        for ch in c['chain']:
            ch.pop('icon', None)
        c['roles'] = c['roles'][:4]
    order = {'Glacio': 0, 'Fusion': 1, 'Electro': 2, 'Aero': 3, 'Spectro': 4, 'Havoc': 5}
    # versions by release date
    for w in weapons:
        w['buffs'] = parse_buffs(w['ranks']) if len(w['ranks']) == 5 else []
        # sanity: max ranks
    for s in sonatas:
        s['buffs'] = []
        for piece, eff in zip(s['pieces'], s['effects']):
            for b in parse_buffs([eff]):
                b['v'] = [b['v'][0]]
                b['piece'] = piece
                s['buffs'].append(b)
    for b in banners:
        if b['type'] == 'Featured Weapon Convene':
            b['featured'] = b['featured'][:1]
    sv('characters', chars)
    sv('weapons', weapons)
    sv('echoes', echoes)
    sv('sonatas', sonatas)
    sv('events', events)
    sv('banners', banners)
    # slim calc payload
    slim = []
    for c in chars:
        sk = []
        for s in c['skills']:
            rows = [{'l': r['label'], 'h': r['hits'], 'k': r['kind']} for r in s['rows']]
            if rows:
                sk.append({'n': s['name'], 't': s['type'], 'r': rows})
        slim.append({'slug': c['slug'], 'name': c['name'], 'el': c['element'], 'wp': c['weapon'], 'rar': c['rarity'], 'b': c['base'], 'sk': sk,
                     'img': c['images'].get('icon'), 'ch': [{'l': x['level'], 'n': x['name'], 'd': x['desc']} for x in c['chain']]})
    sv('calc-chars', slim)
    print('chars', len(chars), 'weapons', len(weapons), 'with buffs', sum(1 for w in weapons if w['buffs']), 'sonata buffs', sum(len(s['buffs']) for s in sonatas))
    print(json.dumps([w for w in weapons if w['name'] == 'Ages of Harvest'][0]['buffs'], ensure_ascii=False))
    print(json.dumps([s for s in sonatas if s['name'] == 'Molten Rift'][0]['buffs'], ensure_ascii=False))
    print([c['name'] for c in chars if c.get('limited')], [c['name'] for c in chars if c.get('statsEstimated')])
    print(sorted({c['weapon'] for c in chars}), sorted({c['element'] for c in chars}))


if __name__ == '__main__':
    main()
