#!/usr/bin/env python3
"""Scrape Resonator data (infobox, skills, resonance chain, stats, images) from the community wiki API."""
import sys, os, re, json, html, urllib.request, urllib.parse
sys.path.insert(0, os.path.dirname(__file__))
from wk import api, render, totext, UA
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'src', 'data')
IMG = os.path.join(ROOT, 'public', 'img', 'characters')
os.makedirs(IMG, exist_ok=True)
ELEMENTS = ['Glacio', 'Fusion', 'Electro', 'Aero', 'Spectro', 'Havoc']


def slugify(n):
    return re.sub(r'[^a-z0-9]+', '-', n.lower()).strip('-')


def wikitext(title):
    d = api(action='query', prop='revisions', rvprop='content', rvslots='main', titles=title, redirects=1)
    if not d:
        return ''
    for p in d['query']['pages'].values():
        try:
            return p['revisions'][0]['slots']['main']['*']
        except Exception:
            return ''
    return ''


def clean(s):
    s = re.sub(r'<ref[^>]*>.*?</ref>', '', s, flags=re.S)
    s = re.sub(r'<ref[^>]*/>', '', s)
    s = re.sub(r'<!--.*?-->', '', s, flags=re.S)
    s = re.sub(r'\{\{Lang\|[^}]*\}\}', '', s)
    s = re.sub(r'\{\{Rubi\|([^|}]*)\|([^}]*)\}\}', r'\1', s)
    s = re.sub(r'\[\[(?:[^\]|]*\|)?([^\]]*)\]\]', r'\1', s)
    s = re.sub(r'\[https?://\S+ ([^\]]*)\]', r'\1', s)
    s = re.sub(r"'''?", '', s)
    s = re.sub(r'\{\{[^{}]*\}\}', '', s)
    s = re.sub(r'\s*\(\s*\)', '', s)
    return html.unescape(s).strip()


def infobox(wt):
    out = {}
    m = re.search(r'\{\{Resonator Infobox(.*?)\n\}\}', wt, flags=re.S)
    if not m:
        return out
    for line in m.group(1).split('\n|'):
        if '=' in line:
            k, v = line.split('=', 1)
            out[k.strip()] = clean(v)
    return out


def intro(wt):
    m = re.search(r'\{\{Intro/Resonator[^}]*\}\}\s*(.+)', wt)
    if m:
        return clean(m.group(1))
    return ''


def strip_tags(s, br='\n'):
    s = re.sub(r'<br\s*/?>', br, s)
    s = re.sub(r'<[^>]+>', '', s)
    s = html.unescape(s)
    s = re.sub(r'[ \t\xa0]+', ' ', s)
    s = re.sub(r'\n\s*\n+', '\n', s)
    return s.strip()


def parse_hits(cell):
    txt = strip_tags(cell, ' ')
    parts = [p for p in txt.split('+')]
    hits = []
    for p in parts:
        m = re.match(r'^\s*([\d.,]+)\s*%?\s*(?:[*x×]\s*(\d+))?\s*$', p)
        if not m:
            return None
        v = float(m.group(1).replace(',', ''))
        n = int(m.group(2) or 1)
        hits.append([v, n])
    return hits or None


SKILL_RE = re.compile(
    r'<td>(?:<a [^>]*>)?([^<]+?)(?:</a>)?</td><td>(?:<a [^>]*>)?([^<]+?)(?:</a>)?</td></tr><tr><td colspan="\d+" style="text-align:left[^"]*">(.*?)</td></tr>',
    re.S)
CHAIN_RE = re.compile(
    r'<td>(?:<a [^>]*>)?([^<]+?)(?:</a>)?</td><td>(\d)</td></tr><tr><td colspan="\d+" style="text-align:left[^"]*">(.*?)</td></tr>', re.S)
TYPE_WORDS = ('Skill', 'Attack', 'Liberation', 'Circuit', 'Forte')
ICON_RE = re.compile(r'data-src="([^"]+)"')


HEAD_RE = re.compile(
    r'<td>(?:<a [^>]*>)?([^<]+?)(?:</a>)?</td><td>(?:<a [^>]*>)?([^<]+?)(?:</a>)?</td></tr><tr><td colspan="\d+" style="text-align:left[^"]*">', re.S)


def parse_skills(h):
    skills = []
    heads = [m for m in HEAD_RE.finditer(h)]
    heads = [m for m in heads if any(w in m.group(2) for w in TYPE_WORDS) and len(m.group(2)) < 30]
    for idx, m in enumerate(heads):
        name, typ = m.group(1).strip(), m.group(2).strip()
        end = heads[idx + 1].start() if idx + 1 < len(heads) else m.end() + 40000
        seg = h[m.end():end]
        pre = h[max(0, m.start() - 900):m.start()]
        ic = ICON_RE.findall(pre)
        icon = ic[-1] if ic else None
        if '<div class="wuwa-collapsible' in seg:
            dpart, tbl = seg.split('<div class="wuwa-collapsible', 1)
            tbl = tbl.split('</table>')[0]
        else:
            dpart, tbl = seg.split('</td></tr>')[0], ''
        desc = strip_tags(dpart)
        rows = []
        info = []
        for tr in re.findall(r'<tr>(.*?)</tr>', tbl, flags=re.S):
            th = re.search(r'<th[^>]*>(.*?)</th>', tr, flags=re.S)
            if not th:
                continue
            label = strip_tags(th.group(1), ' ')
            tds = re.findall(r'<td[^>]*>(.*?)</td>', tr, flags=re.S)
            if not tds or not label:
                continue
            label_c = re.sub(r'\s*\(%\)\s*$', '', label).strip()
            hits = parse_hits(tds[0])
            if hits and re.search(r'DMG|Damage|Heal|Shield', label_c) and not re.search(r'Cost|Regen|Energy', label_c):
                kind = 'heal' if re.search(r'Heal|Shield', label_c) and not re.search(r'DMG|Damage', label_c) else 'dmg'
                rows.append({'label': label_c, 'kind': kind, 'hits': hits})
            else:
                info.append({'label': label_c, 'value': strip_tags(tds[0], ' ')})
        skills.append({'name': name, 'type': typ, 'desc': desc, 'icon': icon, 'rows': rows, 'info': info})
    return skills


def parse_chain(h):
    i = h.find('id="Resonance_Chain"')
    seg = h[i:] if i >= 0 else h
    out = []
    for m in CHAIN_RE.finditer(seg):
        pre = seg[max(0, m.start() - 900):m.start()]
        ic = ICON_RE.findall(pre)
        out.append({'level': int(m.group(2)), 'name': m.group(1).strip(), 'desc': strip_tags(m.group(3)), 'icon': ic[-1] if ic else None})
    seen = {}
    for c in out:
        seen.setdefault(c['level'], c)
    return [seen[k] for k in sorted(seen)]


def base_stats(t):
    m = re.search(r'0✦ \| 1/20 \| ([\d,.]+) \| ([\d,.]+) \| ([\d,.]+)', t)
    if m:
        return [float(x.replace(',', '')) for x in m.groups()]
    return None


def load_res_lua():
    txt = open(os.path.join(os.path.dirname(__file__), 'res.lua')).read()
    res = {}
    for m in re.finditer(r"\['([^']+)'\]\s*=\s*\{(.*?)\n\t\},?", txt, flags=re.S):
        b = m.group(2)
        g = lambda k: (re.search(r"\['%s'\]\s*=\s*'?([^',\n]*)'?" % k, b) or [None, ''])[1].strip().replace('nil', '')
        common = re.search(r"\['common'\]\s*=\s*\{([^}]*)\}", b)
        res[m.group(1)] = {
            'boss': g('boss'), 'local': g('local'), 'spec': g('spec'),
            'common': [c.strip().strip("'") for c in common.group(1).split(',')][-1].replace('FF ', '') if common else '',
            'hp': float(g('base_hp') or 0), 'atk': float(g('base_atk') or 0), 'def': float(g('base_def') or 0),
        }
    return res


def file_urls(titles):
    urls = {}
    titles = list(titles)
    for i in range(0, len(titles), 40):
        d = api(action='query', prop='imageinfo', iiprop='url', titles='|'.join(titles[i:i + 40]))
        if not d:
            continue
        for p in d['query']['pages'].values():
            if 'imageinfo' in p:
                urls[p['title']] = p['imageinfo'][0]['url']
    return urls


def download(url, path, width=None):
    if os.path.exists(path) and os.path.getsize(path) > 500:
        return True
    u = url
    if width:
        base, _, q = u.partition('?')
        u = base + '/scale-to-width-down/%d?%s&format=webp' % (width, q)
    else:
        u = u + ('&' if '?' in u else '?') + 'format=webp'
    for _ in range(3):
        try:
            data = urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60).read()
            if len(data) > 300:
                open(path, 'wb').write(data)
                return True
        except Exception:
            pass
    return False


def split_rover(skills):
    groups, cur = [], []
    for s in skills:
        if s['type'] == 'Basic Attack' and cur:
            groups.append(cur)
            cur = []
        cur.append(s)
    if cur:
        groups.append(cur)
    return groups


def element_of(skills, fallback=''):
    txt = ' '.join(s['desc'] for s in skills)
    best, bi = fallback, 10 ** 9
    for e in ELEMENTS:
        i = txt.find(e + ' DMG')
        if i >= 0 and i < bi:
            best, bi = e, i
    return best


def scrape(name):
    slug = slugify(name)
    wt = wikitext(name)
    ib = infobox(wt)
    ch = render(name + '/Combat')
    t = totext(ch)
    skills = parse_skills(ch)
    chain = parse_chain(ch)
    stats = base_stats(t)
    imgs = api(action='query', prop='images', titles=name, imlimit=500)
    files = []
    if imgs:
        for p in imgs['query']['pages'].values():
            files = [i['title'] for i in p.get('images', [])]
    first = name.split(':')[0].split()[0]
    pick = {}
    for f in files:
        base = f[5:]
        if not base.startswith(first):
            if base.startswith("Verina's") and first == 'Verina':
                pass
            else:
                continue
        if ' Full Sprite' in base:
            pick.setdefault('sprite', f)
        elif ' Splash Art' in base:
            pick.setdefault('splash', f)
        elif base.endswith(' Card.png') or base.endswith(' Card.jpg') or "'s Card" in base:
            pick.setdefault('card', f)
    for f in files:
        if f.startswith('File:Resonator ') and name.replace(':', '') in f[15:]:
            pick['icon'] = f
    return {'name': name, 'slug': slug, 'ib': ib, 'intro': intro(wt), 'skills': skills, 'chain': chain, 'stats': stats, 'pick': pick}


def main():
    only = sys.argv[1:]
    cat = api(action='query', list='categorymembers', cmtitle='Category:Resonators', cmlimit=200)
    names = [x['title'] for x in cat['query']['categorymembers'] if not x['title'].startswith('Category:') and x['title'] != 'Resonator']
    if only:
        names = [n for n in names if n in only]
    with ThreadPoolExecutor(4) as ex:
        raw = list(ex.map(scrape, names))
    res = load_res_lua()
    want = set()
    for r in raw:
        for v in r['pick'].values():
            want.add(v)
    urls = file_urls(want)
    chars = []
    for r in raw:
        ib = r['ib']
        name = r['name']
        variants = [(name, r['skills'], ib.get('attribute', ''), r['slug'])]
        if name == 'Rover':
            groups = split_rover(r['skills'])
            variants = []
            for g in groups:
                el = element_of(g)
                variants.append(('Rover (%s)' % el, g, el, 'rover-' + el.lower()))
        for vname, sk, el, slug in variants:
            rs = res.get(name, {})
            stats = r['stats'] or [rs.get('hp', 0), rs.get('atk', 0), rs.get('def', 0)]
            c = {
                'slug': slug, 'name': vname, 'rarity': int(ib.get('rarity') or 5),
                'element': el or ib.get('attribute', ''), 'weapon': ib.get('weapon', ''), 'class': ib.get('class', ''),
                'roles': [x.strip() for x in ib.get('role', '').split(';') if x.strip()],
                'title': ib.get('title', ''), 'realname': ib.get('realname', ''), 'gender': ib.get('gender', ''),
                'birthday': ib.get('birthday', ''), 'birthplace': ib.get('birthplace', ''), 'nation': ib.get('nation', ''),
                'affiliation': ib.get('affiliation', ''), 'release': (ib.get('releaseDate', '') or '').strip(),
                'dish': ib.get('dish', ''), 'obtain': ib.get('obtain', ''),
                'voice': {k[5:]: ib.get(k, '') for k in ('voiceEN', 'voiceJP', 'voiceCN', 'voiceKR') if ib.get(k)},
                'intro': r['intro'], 'base': {'hp': stats[0], 'atk': stats[1], 'def': stats[2]},
                'materials': {'boss': rs.get('boss', ''), 'local': rs.get('local', ''), 'common': rs.get('common', ''), 'weekly': rs.get('spec', '')},
                'skills': sk, 'chain': r['chain'], 'images': {},
            }
            if name == 'Rover':
                c['rarity'] = 5
                c['weapon'] = 'Sword'
                c['title'] = 'Wanderer of the Waves'
            for kind, f in r['pick'].items():
                u = urls.get(f)
                if not u:
                    continue
                w = {'sprite': 700, 'card': 700, 'splash': 1200, 'icon': 160}[kind]
                p = os.path.join(IMG, '%s-%s.webp' % ('rover' if name == 'Rover' else slug, kind))
                if download(u, p, w):
                    c['images'][kind] = '/img/characters/%s' % os.path.basename(p)
            for s in c['skills']:
                s['icon'] = None
            chars.append(c)
    chars.sort(key=lambda c: c['name'])
    json.dump(chars, open(os.path.join(OUT, 'characters.raw.json'), 'w'), indent=1, ensure_ascii=False)
    print('characters', len(chars))
    for c in chars:
        print(c['slug'], c['rarity'], c['element'], c['weapon'], len(c['skills']), len(c['chain']), list(c['images']), c['base'])


if __name__ == '__main__':
    main()
