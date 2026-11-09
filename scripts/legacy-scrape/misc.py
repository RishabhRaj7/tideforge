#!/usr/bin/env python3
"""Scrape weapons, echoes, sonata sets, events and convene banners from the community wiki API."""
import sys, os, re, json, html
sys.path.insert(0, os.path.dirname(__file__))
from wk import api, render, totext
from chars import strip_tags, download, slugify, file_urls
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'src', 'data')
PUB = os.path.join(ROOT, 'public', 'img')


def page_images(titles):
    urls = {}
    titles = list(titles)
    for i in range(0, len(titles), 40):
        d = api(action='query', prop='pageimages', piprop='original', pilimit=50, titles='|'.join(titles[i:i + 40]), redirects=1)
        if not d:
            continue
        norm = {}
        for k in d['query'].get('normalized', []) + d['query'].get('redirects', []):
            norm[k['to']] = k['from']
        for p in d['query']['pages'].values():
            if 'original' in p:
                urls[p['title']] = p['original']['source']
                if p['title'] in norm:
                    urls[norm[p['title']]] = p['original']['source']
    return urls


def save_icon(url, folder, slug, w=200):
    if not url:
        return None
    p = os.path.join(PUB, folder, slug + '.webp')
    if download(url, p, w):
        return '/img/%s/%s.webp' % (folder, slug)
    return None


# ---------------- weapons ----------------
def weapons():
    txt = open(os.path.join(os.path.dirname(__file__), 'wep.lua')).read()
    cur = None
    entries = []
    for block in re.split(r'\n(?=\s*(?:--[A-Za-z]+\s*\n|\[\'))', txt):
        pass
    pos = 0
    for m in re.finditer(r"--\s*(Broadblade|Sword|Pistols|Gauntlets|Rectifier)\b|\[\'([^\']+)\'\]\s*=\s*\{(.*?)\n\t\},?", txt, flags=re.S):
        if m.group(1):
            cur = m.group(1)
            continue
        b = m.group(3)
        def g(k):
            r = re.search(r"\['%s'\]\s*=\s*'?([^',\n]*)'?" % k, b)
            return r.group(1).strip() if r else ''
        entries.append({'name': m.group(2), 'type': cur, 'rarity': int(g('rarity') or 0), 'atk': float(g('base_atk') or 0),
                        'stat': g('2nd_stat_type'), 'statValue': float(g('2nd_stat') or 0)})
    return entries


def parse_weapon_page(name):
    h = render(name)
    t = totext(h)
    out = {'passive': None, 'ranks': [], 'source': '', 'resonator': '', 'desc': ''}
    blocks = re.findall(r'\n \| \n \| ([^\n]+)\n \| (.*?)(?=\n \d → \d|\n MAX)', t, flags=re.S)
    if blocks:
        out['passive'] = blocks[0][0].strip()
        out['ranks'] = [b[1].strip() for b in blocks][:5]
    m = re.search(r'Acquisition Method\n ([^\n]+)', t)
    if m:
        out['source'] = m.group(1).strip()
    m = re.search(r'Associated Resonator\n ([^\n]+)', t)
    if m:
        out['resonator'] = m.group(1).strip()
    m = re.search(r'\n MAX\n(.*?)\n[^\n]*is an? [A-Za-z]+ weapon', t, flags=re.S)
    if m:
        out['desc'] = m.group(1).strip().replace('\n', ' ')
    return out


def weapon_list():
    out = []
    for cat, typ in [('Broadblades', 'Broadblade'), ('Swords', 'Sword'), ('Pistols', 'Pistols'), ('Gauntlets', 'Gauntlets'), ('Rectifiers', 'Rectifier')]:
        cm = None
        while True:
            d = api(action='query', list='categorymembers', cmtitle='Category:' + cat, cmlimit=500, **({'cmcontinue': cm} if cm else {}))
            if not d or 'query' not in d:
                break
            for x in d['query']['categorymembers']:
                n = x['title']
                if n.startswith('Category:') or re.match(r'^(Broadblade|Sword|Pistols|Gauntlets|Rectifier)\d+', n) or n in ('Weapon',):
                    continue
                out.append((n, typ))
            cm = d.get('continue', {}).get('cmcontinue')
            if not cm:
                break
    return list(dict.fromkeys(out))


def parse_weapon_full(name):
    p = parse_weapon_page(name)
    h = render(name)
    t = totext(h)
    r = re.search(r'Icon_(\d)_Stars', h)
    p['rarity'] = int(r.group(1)) if r else 0
    m = re.search(r'0✦ \| 1/20 \| ([\d,.]+) \| ([\d,.]+)%?', t)
    p['atk'] = float(m.group(1).replace(',', '')) if m else 0
    p['statValue'] = float(m.group(2).replace(',', '')) if m else 0
    m = re.search(r'2nd Stat\n\(([^)]+)\)', t)
    p['stat'] = m.group(1).strip() if m else ''
    return p


def do_weapons():
    lst = weapon_list()
    with ThreadPoolExecutor(5) as ex:
        pages = list(ex.map(lambda e: parse_weapon_full(e[0]), lst))
    urls = page_images([e[0] for e in lst])
    ents = []
    for (n, typ), p in zip(lst, pages):
        e = {'name': n, 'type': typ}
        e.update(p)
        e['slug'] = slugify(n)
        e['icon'] = save_icon(urls.get(n), 'weapons', e['slug'])
        ents.append(e)
    ents = [e for e in ents if e['atk'] > 0]
    ents.sort(key=lambda e: (e['type'], -e['rarity'], e['name']))
    json.dump(ents, open(os.path.join(OUT, 'weapons.raw.json'), 'w'), indent=1, ensure_ascii=False)
    print('weapons', len(ents), 'noicon', [e['name'] for e in ents if not e['icon']], 'nopassive', [e['name'] for e in ents if not e['passive']])


# ---------------- sonatas ----------------
def do_sonatas():
    h = render('Sonata')
    out = []
    for tb in re.findall(r'<table.*?</table>', h, flags=re.S):
        for tr in re.findall(r'<tr[^>]*>(.*?)</tr>', tb, flags=re.S):
            tds = re.findall(r'<td[^>]*>(.*?)</td>', tr, flags=re.S)
            if len(tds) not in (2, 3):
                continue
            name = strip_tags(tds[0], ' ').strip()
            if not name:
                continue
            ic = re.findall(r'data-src="([^"]+)"', tds[0])
            effects = [strip_tags(x, ' ') for x in tds[1:]]
            if len(tds) == 3:
                kind = '2/5'
            else:
                kind = None
            out.append({'name': name, 'cols': len(tds), 'effects': effects, 'icon': ic[0] if ic else None})
    # determine piece layout by order of appearance
    final = []
    for s in out:
        if s['cols'] == 3:
            pieces = [2, 5]
        else:
            pieces = [3] if any(f.get('piece') == 3 for f in final) is False and not any(f.get('pieces') == [3] for f in final) else None
            pieces = pieces
        final.append(s | {'pieces': pieces})
    # second table (cols 2) first = 3-piece, then 1-piece
    seen3 = False
    twos = [s for s in final if s['cols'] == 2]
    for s in final:
        s['slug'] = slugify(s['name'])
    # Pull explicit piece counts from effect text if sonata is one-piece
    for s in twos:
        s['pieces'] = [3]
    # Identify 1-piece group: appear after 3-piece group; heuristic by wiki ordering — mark by effect text
    for s in twos:
        if s['effects'] and re.search(r'^(1-piece|1 piece)', s['effects'][0], re.I):
            s['pieces'] = [1]
    return final


def do_sonatas_full():
    h = render('Sonata')
    # find section anchors to determine piece layout
    secs = [(m.start(), m.group(1)) for m in re.finditer(r'id="([^"]*Piece[^"]*)"', h)]
    out = []
    for tb in re.finditer(r'<table.*?</table>', h, flags=re.S):
        pos = tb.start()
        sec = ''
        for sp, sn in secs:
            if sp < pos:
                sec = sn
        pieces = [2, 5]
        if sec.startswith('3'):
            pieces = [3]
        elif sec.startswith('1'):
            pieces = [1]
        for tr in re.findall(r'<tr[^>]*>(.*?)</tr>', tb.group(0), flags=re.S):
            tds = re.findall(r'<td[^>]*>(.*?)</td>', tr, flags=re.S)
            if len(tds) not in (2, 3):
                continue
            name = strip_tags(tds[0], ' ').strip()
            if not name or len(name) > 40:
                continue
            ic = re.findall(r'data-src="([^"]+)"', tds[0])
            out.append({'name': name, 'slug': slugify(name), 'pieces': pieces, 'effects': [strip_tags(x, ' ') for x in tds[1:]], 'iconUrl': ic[0] if ic else None})
    for s in out:
        if s['iconUrl']:
            base = s['iconUrl'].split('/revision')[0] + '/revision' + s['iconUrl'].split('/revision')[1].split('/scale-to')[0] if '/revision' in s['iconUrl'] else s['iconUrl']
            s['icon'] = save_icon(base, 'sonatas', s['slug'], 96)
        else:
            s['icon'] = None
        s.pop('iconUrl', None)
    out = [x for x in out if x['name'] not in ('English','Chinese (S)','Chinese (T)','Japanese','Korean','French','German','Spanish')]
    json.dump(out, open(os.path.join(OUT, 'sonatas.raw.json'), 'w'), indent=1, ensure_ascii=False)
    print('sonatas', len(out), [(s['name'], s['pieces']) for s in out][:40])
    return out


# ---------------- echoes ----------------
def do_echoes(sonatas):
    names = {s['name'] for s in sonatas}
    h = render('Echo/List')
    rows = []
    for tr in re.findall(r'<tr>(.*?)</tr>', h, flags=re.S):
        tds = re.findall(r'<td[^>]*>(.*?)</td>', tr, flags=re.S)
        if len(tds) != 5:
            continue
        no = strip_tags(tds[0], ' ')
        link = re.search(r'title="([^"]+/Echo)"', tds[1])
        nm = strip_tags(tds[1], ' ').strip()
        cost = strip_tags(tds[2], ' ').strip()
        sons = [x for x in re.findall(r'title="([^"]+)"', tds[3]) if x in names]
        if not sons:
            sons = [x for x in re.findall(r'alt="([^"]+)"', tds[3]) if x in names]
        rows.append({'no': no, 'name': nm, 'cost': int(cost) if cost.isdigit() else 0, 'sonatas': sons, 'class': strip_tags(tds[4], ' ').strip(),
                     'page': link.group(1) if link else nm + '/Echo',
                     'iconUrl': (re.findall(r'data-src="([^"]+)"', tds[1]) or [None])[0]})
    def pg(r):
        h = render(r['page'])
        t = totext(h)
        skill = ''
        m = re.search(r'Echo Skill\n(?: \d\n)+ \| \n(.*?)(?=\n \| \n|\nTransform|\n[A-Z][^\n]* \(Chinese)', t, flags=re.S)
        blocks = re.findall(r'\n \| \n([^|]*?CD: ?\d+s)', t, flags=re.S)
        sk = [b.strip() for b in blocks]
        # sonatas from page
        ps = []
        i = h.find('Possible Sonata')
        if i >= 0:
            seg = h[i:i + 6000]
            ps = [x for x in re.findall(r'title="([^"]+)"', seg) if x in names]
        typ = re.search(r'Type\n (\w+)', t)
        return {'skills': sk, 'sonatas2': list(dict.fromkeys(ps)), 'type': typ.group(1) if typ else ''}
    with ThreadPoolExecutor(5) as ex:
        pages = list(ex.map(pg, rows))
    urls = page_images([r['page'] for r in rows])
    for r, p in zip(rows, pages):
        if not r['sonatas']:
            r['sonatas'] = p['sonatas2']
        r['skill'] = p['skills'][0] if p['skills'] else ''
        r['skillMax'] = p['skills'][-1] if p['skills'] else ''
        r['slug'] = slugify(r['name'])
        iu = r.pop('iconUrl', None)
        if iu:
            iu = re.sub(r'/scale-to-width-down/\d+', '', iu)
        r['icon'] = save_icon(iu or urls.get(r['page']), 'echoes', r['slug'], 128)
        r.pop('page', None)
    json.dump(rows, open(os.path.join(OUT, 'echoes.raw.json'), 'w'), indent=1, ensure_ascii=False)
    print('echoes', len(rows), 'noicon', sum(1 for e in rows if not e['icon']), 'nosonata', sum(1 for e in rows if not e['sonatas'] and e['cost'] > 1), 'noskill', sum(1 for e in rows if not e['skill']))


# ---------------- events ----------------
DATE = r'[A-Z][a-z]+ \d{1,2}, \d{4}|TBA|Indefinite'


def do_events():
    events = []
    for v in (1, 2, 3):
        t = totext(render('Event/History/Version %d' % v))
        ver = None
        lines = t.split('\n')
        for i, ln in enumerate(lines):
            m = re.match(r'^Version (\d+\.\d+)$', ln.strip())
            if m:
                ver = m.group(1)
                continue
            m = re.match(r'^ \| ((?:%s) [–-] (?:%s))\s*$' % (DATE, DATE), ln)
            if m and ver:
                name = lines[i - 1].strip()
                if name.startswith('File:'):
                    name = lines[i - 1].strip()
                if name in ('|', '') or name.startswith(' |'):
                    name = lines[i - 2].strip()
                name = re.sub(r'^File:[^\n]*\n', '', name)
                if name.startswith('File:'):
                    continue
                a, b = [x.strip() for x in re.split(r' [–-] ', m.group(1))]
                events.append({'name': name, 'version': ver, 'start': a, 'end': b})
    # dedupe
    seen = set()
    out = []
    for e in events:
        k = (e['name'], e['version'])
        if k in seen:
            continue
        seen.add(k)
        out.append(e)
    json.dump(out, open(os.path.join(OUT, 'events.raw.json'), 'w'), indent=1, ensure_ascii=False)
    print('events', len(out))
    # Event types
    return out


def do_banners(chars, weapons_):
    t = totext(render('Convene/List'))
    lines = [l.strip() for l in t.split('\n')]
    out = []
    ver = start = end = None
    typ = None
    for ln in lines:
        m = re.match(r'^\|? ?Version (\d+\.\d+): (.+?) [—–-] (.+)$', ln)
        if m:
            ver, start, end = m.group(1), m.group(2).strip(), m.group(3).strip()
            typ = None
            continue
        m = re.match(r'^\|\s*(Featured Resonator Convene|Featured Weapon Convene|Convene)\s*\|?$', ln)
        if m:
            typ = m.group(1)
            continue
        if ver and typ and ln and not ln.startswith('|') and not ln.startswith('Past') and ln not in ('Current', 'Upcoming', 'Type | Convenes', 'Convenes'):
            out.append({'name': ln, 'type': typ, 'version': ver, 'start': start, 'end': end})
    seen = set()
    final = []
    for b in out:
        k = (b['name'], b['start'])
        if k in seen:
            continue
        seen.add(k)
        final.append(b)
    chn = [c['name'].split(' (')[0] for c in chars] + ['Rover']
    def feat(b):
        title = b['name'] if not b['name'].startswith('Absolute Pulsation') else b['name']
        h = totext(render(title))
        head = h[:2500]
        found = []
        if b['type'] == 'Featured Weapon Convene':
            for w in weapons_:
                if w['name'] in head:
                    found.append((head.find(w['name']), w['name']))
        else:
            for n in chn:
                if re.search(r'\b%s\b' % re.escape(n), head):
                    found.append((head.find(n), n))
        found.sort()
        return [n for _, n in found][:3]
    with ThreadPoolExecutor(5) as ex:
        fs = list(ex.map(feat, final))
    for b, f in zip(final, fs):
        b['featured'] = f
    json.dump(final, open(os.path.join(OUT, 'banners.raw.json'), 'w'), indent=1, ensure_ascii=False)
    print('banners', len(final))


if __name__ == '__main__':
    what = sys.argv[1:] or ['weapons', 'sonatas', 'echoes', 'events', 'banners']
    chars = json.load(open(os.path.join(OUT, 'characters.raw.json')))
    if 'weapons' in what:
        do_weapons()
    sons = None
    if 'sonatas' in what or 'echoes' in what:
        sons = do_sonatas_full()
    if 'echoes' in what:
        do_echoes(sons)
    if 'events' in what:
        do_events()
    if 'banners' in what:
        do_banners(chars, json.load(open(os.path.join(OUT, 'weapons.raw.json'))))
