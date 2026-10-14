#!/usr/bin/env python3
"""Import each member page from a user-downloaded Notion HTML export.

No network requests. Raw private data stays outside client/public and git.
Usage: python3 scripts/import-notion-members.py /path/to/export-folder
"""
import argparse
from collections import Counter
from datetime import datetime, timezone
from html.parser import HTMLParser
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess
from urllib.parse import unquote, urlparse

class Node:
    def __init__(self, tag='', attrs=None):
        self.tag, self.attrs, self.children = tag, dict(attrs or []), []
    def find_all(self, tag=None, cls=None):
        result = []
        for child in self.children:
            if isinstance(child, Node):
                if (tag is None or child.tag == tag) and (cls is None or cls in child.attrs.get('class', '').split()):
                    result.append(child)
                result.extend(child.find_all(tag, cls))
        return result
    def text(self):
        return ''.join(c.text() if isinstance(c, Node) else c for c in self.children)

class Parser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node(); self.stack = [self.root]
    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs); self.stack[-1].children.append(node)
        if tag not in {'img','br','hr','meta','link','input','source','wbr'}: self.stack.append(node)
    def handle_endtag(self, tag):
        for i in range(len(self.stack)-1, 0, -1):
            if self.stack[i].tag == tag:
                self.stack = self.stack[:i]; break
    def handle_data(self, data): self.stack[-1].children.append(data)

def clean(node): return re.sub(r'[ \t]+', ' ', node.text()).strip()
def safe_link(value):
    return value if urlparse(value).scheme in {'https','http','mailto','tel'} else None

ALIASES = {'Stina Sfatcu':'Christina Sfatcu', 'Vaibhava Rajesh':'Vaibhava Raja', 'Brooke Bradley':'Brooke Namie Bradley', 'Ryan Nguyen ⋆˙⟡':'Ryan Nguyen', 'Sally Hu ˖ . ݁𝜗𝜚. ݁₊':'Sally Hu'}

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('export'); ap.add_argument('--output',default='.private/member-import'); args=ap.parse_args()
    source=Path(args.export).resolve(); out=Path(args.output).resolve(); assets=out/'assets'; originals=out/'originals'
    assets.mkdir(parents=True,exist_ok=True); originals.mkdir(exist_ok=True)
    report={'sourcePages':0,'skipped':[],'missingAssets':[],'profiles':[]}; copied={}
    def image_file(page,src):
        if not src or urlparse(src).scheme: return None
        file=(page.parent/unquote(src)).resolve()
        if not file.is_relative_to(source): raise ValueError('Asset outside export')
        if not file.is_file(): report['missingAssets'].append(str(file.relative_to(source))); return None
        if file in copied: return copied[file]
        digest=hashlib.sha256(file.read_bytes()).hexdigest()[:24]
        original=originals/(digest+file.suffix.lower()); shutil.copy2(file,original)
        dest=assets/(digest+'.jpg')
        result=subprocess.run(['sips','-s','format','jpeg','-s','formatOptions','82','-Z','1800',str(file),'--out',str(dest)],capture_output=True,text=True)
        if result.returncode: raise RuntimeError('Image conversion failed: '+str(file.name))
        copied[file]='/api/process/directory/assets/'+dest.name
        return copied[file]
    profiles=[]
    for page in sorted(source.rglob('*.html')):
        parser=Parser(); parser.feed(page.read_text()); root=parser.root
        tables=root.find_all('table','properties')
        if not tables: continue
        report['sourcePages']+=1
        title=root.find_all('h1','page-title'); raw_name=clean(title[0]) if title else ''
        article=root.find_all('article')[0]; page_id=article.attrs['id']
        if not raw_name: report['skipped'].append({'id':page_id,'reason':'Unnamed empty profile'}); continue
        fields={}; sections=[]; media=[]
        for row in tables[0].find_all('tr'):
            th=row.find_all('th'); td=row.find_all('td')
            if not th or not td: continue
            label=clean(th[0]); cell=td[0]
            if label.lower() in {'position','role','title'}: continue
            choices=cell.find_all(cls='selected-value')
            value=', '.join(clean(v) for v in choices) if choices else clean(cell)
            images=[url for img in cell.find_all('img') if (url:=image_file(page,img.attrs.get('src')))]
            links=[{'label':clean(a) or a.attrs.get('href'),'url':url} for a in cell.find_all('a') if (url:=safe_link(a.attrs.get('href','')))]
            if value: fields[label]=value
            if value or images:
                sections.append({'title':label,'body':value,**({'images':images} if images else {}),**({'links':links} if links else {})})
                media.extend(images)
        cover_nodes=root.find_all('img','page-cover-image'); cover=cover_nodes[0] if cover_nodes else None
        cover_url=image_file(page,cover.attrs.get('src')) if cover else None
        icons=root.find_all('img','icon'); icon=next((image_file(page,i.attrs.get('src')) for i in icons if i.attrs.get('src') and not urlparse(i.attrs['src']).scheme),None)
        body_nodes=root.find_all(cls='page-body'); body=clean(body_nodes[0]) if body_nodes else ''
        if body: sections.append({'title':'About','body':body})
        for node in body_nodes:
            for img in node.find_all('img'):
                url=image_file(page,img.attrs.get('src'))
                if url: media.append(url)
        photo=icon or cover_url
        profile={'id':'notion-'+page_id.replace('-',''),'notionId':page_id,'name':ALIASES.get(raw_name,raw_name),'sourceName':raw_name,'sourceUrl':'https://www.notion.so/'+page_id.replace('-',''),'email':fields.get('Email',''),'phone':fields.get('Phone',''),'major':fields.get('Major',''),'year':fields.get('Year',''),'pledgeClass':fields.get('Class',''),'hometown':fields.get('Hometown',''),'linkedin':fields.get('LinkedIn',''),'instagram':fields.get('Instagram',''),'membershipStatus':fields.get('Status',''),'photoUrl':photo or '', 'coverUrl':cover_url or '', 'coverPosition':(re.search(r'object-position:([^;]+)',cover.attrs.get('style',''))[1] if cover and re.search(r'object-position:([^;]+)',cover.attrs.get('style','')) else 'center 50%'),'profileSections':sections,'profileImages':list(dict.fromkeys(media)),'color':'blue','role':'active'}
        # Role above is a display compatibility value, never an account assignment.
        profiles.append(profile)
        report['profiles'].append({'name':profile['name'],'properties':len(fields),'photo':bool(photo),'cover':bool(cover_url),'status':profile['membershipStatus'],'class':profile['pledgeClass']})
    stamp=datetime.now(timezone.utc).isoformat()
    payload={'importedAt':stamp,'source':'Notion Member Profiles','profiles':profiles}
    if (out/'profiles.json').exists(): shutil.copy2(out/'profiles.json',out/'profiles.previous.json')
    (out/'profiles.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2))
    report.update({'imported':len(profiles),'assets':len(copied),'phones':sum(bool(p['phone']) for p in profiles),'emails':sum(bool(p['email']) for p in profiles),'classes':sum(bool(p['pledgeClass']) for p in profiles),'statuses':dict(Counter(p['membershipStatus'] for p in profiles))})
    (out/'import-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    print(json.dumps({k:v for k,v in report.items() if k!='profiles'},indent=2))

if __name__=='__main__': main()
