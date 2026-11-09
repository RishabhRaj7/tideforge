import json,re,sys,urllib.request,urllib.parse,time,os,html
UA={'User-Agent':'Mozilla/5.0'}
def api(**p):
    p['format']='json'
    url='https://wutheringwaves.fandom.com/api.php?'+urllib.parse.urlencode(p)
    for i in range(4):
        try:
            return json.load(urllib.request.urlopen(urllib.request.Request(url,headers=UA),timeout=60))
        except Exception as e:
            time.sleep(2+i*2)
    return None
def render(title):
    c='/tmp/wk/cache/'+re.sub(r'[^A-Za-z0-9]','_',title)+'.html'
    if os.path.exists(c): return open(c).read()
    d=api(action='parse',page=title,prop='text',disablelimitreport=1,redirects=1)
    if not d or 'parse' not in d: return ''
    h=d['parse']['text']['*']
    os.makedirs('/tmp/wk/cache',exist_ok=True)
    open(c,'w').write(h)
    return h
def totext(h):
    t=re.sub(r'<script.*?</script>|<style.*?</style>','',h,flags=re.S)
    t=re.sub(r'<sup[^>]*class="reference".*?</sup>','',t,flags=re.S)
    t=re.sub(r'<(?:br|/tr|/p|/div|/h\d|/li)[^>]*>','\n',t)
    t=re.sub(r'<td[^>]*>|<th[^>]*>',' | ',t)
    t=re.sub(r'<[^>]+>','',t)
    t=html.unescape(t)
    t=re.sub(r'[ \t]+',' ',t)
    t=re.sub(r'\n\s*\n+','\n',t)
    return t
if __name__=='__main__':
    t=totext(render(sys.argv[1]))
    a=int(sys.argv[2]) if len(sys.argv)>2 else 0
    b=int(sys.argv[3]) if len(sys.argv)>3 else 3000
    print(len(t)); print(t[a:b])
