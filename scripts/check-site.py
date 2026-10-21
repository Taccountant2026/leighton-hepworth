"""Validate the actual static release: pages, anchors, local assets and project independence."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit, unquote
import json
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parent.parent
DIST=ROOT/'dist'
BASE='https://leightonhepworth.com/'
class Page(HTMLParser):
 def __init__(self,path):
  super().__init__(convert_charrefs=True);self.ids=set();self.refs=[];self.labels=[];self.headings=0;self.title=0;self.feed(path.read_text())
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:
   assert a['id'] not in self.ids,'duplicate id';self.ids.add(a['id'])
  if tag=='h1':self.headings+=1
  if tag=='title':self.title+=1
  if tag=='img':assert 'alt' in a,'image missing alternative text'
  if tag=='label' and 'for' in a:self.labels.append(a['for'])
  if tag in ('a','link') and a.get('href'):self.refs.append(a['href'])
  if tag in ('script','img') and a.get('src'):self.refs.append(a['src'])
pages={p:Page(p) for p in DIST.glob('*.html')}
count=0
for path,page in pages.items():
 assert page.headings==1 and page.title==1,'one h1 and title required: '+path.name
 for label in page.labels:assert label in page.ids,'missing form label target'
 for ref in page.refs:
  url=urlsplit(urljoin(BASE+path.name,ref))
  assert url.scheme in ('https','http'),'unexpected URL scheme'
  if url.netloc!='leightonhepworth.com':continue
  relative=unquote(url.path).lstrip('/') or 'index.html';target=(DIST/relative).resolve()
  assert target.is_relative_to(DIST.resolve()) and target.is_file(),'missing local target: '+ref
  if url.fragment and target in pages:assert unquote(url.fragment) in pages[target].ids,'missing anchor: '+ref
  count+=1
manifest=json.loads((ROOT/'.openai/hosting.json').read_text());assert manifest['project_id']=='appgprj_6ad8bd88eda08191920af743b641c3b2';assert manifest['static']['directory']=='dist'
js=(DIST/'app.js').read_text();assert 'fetch(' not in js and 'localStorage' not in js,'unexpected external data or persistent state'
home=(DIST/'index.html').read_text();assert 'assets/lh-business-group.png' in home;assert 'content="index,follow' in home and 'noindex' not in home
robots=(DIST/'robots.txt').read_text();assert 'Disallow: /' not in robots;assert 'Sitemap: '+BASE+'sitemap.xml' in robots
sitemap=ET.parse(DIST/'sitemap.xml').getroot();urls=[node.text for node in sitemap.iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
assert set(urls)=={BASE,BASE+'privacy.html'},'sitemap must contain the public canonical pages'
assert not list((ROOT/'.github/workflows').glob('*.y*ml')),'unexpected automatic GitHub Actions workflow'
print(f'Checked {len(pages)} pages, {count} local links/assets, image alternatives, form labels, anchors, public crawl settings, sitemap, LH identity and project independence.')
