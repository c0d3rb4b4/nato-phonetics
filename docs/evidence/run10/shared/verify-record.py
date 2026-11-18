from pathlib import Path
from urllib.parse import unquote
import re,json,hashlib,collections
root=Path(__file__).resolve().parents[4];out=root/'docs/evidence/run10';failures=[]
files=[root/'README.md',root/'PRIVACY.md',root/'docs/DELIVERY_PLAN.md',root/'docs/APP_REVIEW.md',root/'docs/CONVERTER_POLICY.md',*out.rglob('*.md')]
links=0
for p in files:
 for target in re.findall(r'\[[^\]]*\]\(([^)\n]+)\)',p.read_text()):
  target=target.strip('<>');target=unquote(target)
  if re.match(r'^[a-zA-Z][a-zA-Z0-9+.-]*:',target):continue
  path,_,anchor=target.partition('#');q=(p.parent/path).resolve() if path else p
  links+=1
  if not q.exists():failures.append({'file':str(p.relative_to(root)),'missing':target});continue
  if anchor and q.suffix=='.md':
   headings=re.findall(r'^#{1,6}\s+(.+)$',q.read_text(),re.M)
   slugs=[re.sub(r'[^\w\s-]','',heading.lower()).replace(' ','-') for heading in headings]
   if anchor not in slugs:failures.append({'file':str(p.relative_to(root)),'missingAnchor':target})
identity=json.loads((out/'source-identity.json').read_text())
for name,h in identity['files'].items():
 p=root/name
 if not p.exists() or hashlib.sha256(p.read_bytes()).hexdigest()!=h:failures.append({'sourceMismatch':name})
images=json.loads((out/'screenshots/all-metadata.json').read_text())
for row in images:
 p=out/'screenshots'/row['platform']/row['file']
 if hashlib.sha256(p.read_bytes()).hexdigest()!=row['sha256']:failures.append({'imageMismatch':str(p)})
for platform in ['android','ios']:
 j=json.loads((out/platform/'loaded-javascript.json').read_text())
 for row in j['scripts']:
  p=root/row['file']
  if not p.exists() or hashlib.sha256(p.read_bytes()).hexdigest()!=row['sha256']:failures.append({'loadedJavaScriptMismatch':str(p)})
web=json.loads((out/'web/artifact.json').read_text())
for name,h in web['files'].items():
 if hashlib.sha256((root/name).read_bytes()).hexdigest()!=h:failures.append({'webArtifactMismatch':name})
plan=(root/'docs/DELIVERY_PLAN.md').read_text();rows=[]
for line in plan.splitlines():
 c=[x.strip() for x in line.split('|')][1:-1]
 if c and re.fullmatch(r'(R\d{2}|F\d{2})',c[0]):rows.append(c)
counts=dict(collections.Counter(r[3] for r in rows));assert len(rows)==35 and len({r[0] for r in rows})==35
assert counts=={'resolved':4,'implemented-awaiting-M11':12,'in-progress':13,'open':6},counts
assert not re.search(r'^- \[x\] \*\*M11\.',plan,re.M)
for task in ['P05.2','P05.8','P06.2','P06.3','P06.4','P07.4']:
 assert f'- [ ] **{task}' in plan,task
pres=json.loads((out/'shared/review-preservation.json').read_text());prefix=(root/'docs/APP_REVIEW.md').read_text().split('## Current delivery status')[0]
assert hashlib.sha256(prefix.encode()).hexdigest()==pres['historicalReviewPrefixSha256']
changes=json.loads((out/'shared/source-changes.json').read_text());whitespace=[]
for name in [r['file'] for r in changes['confirmedHashChanges']]+['scripts/verify-pacing-browser.cjs','docs/DELIVERY_PLAN.md','docs/APP_REVIEW.md','docs/CONVERTER_POLICY.md']:
 for n,line in enumerate((root/name).read_text().splitlines(),1):
  if line.rstrip()!=line:whitespace.append({'file':name,'line':n})
failures.extend(whitespace)
result={'date':'2026-11-18','localMarkdownLinksChecked':links,'sourceInputsChecked':len(identity['files']),'originalPngsChecked':len(images),'screenshotsByPlatform':dict(collections.Counter(r['platform'] for r in images)),'loadedJavaScriptAndWebHashesChecked':True,'historicalReviewPrefixPreserved':True,'resolutionItemCounts':counts,'scopeItems':35,'unverifiedTaskCheckboxesRemainOpen':True,'M11Unperformed':True,'changedFileWhitespaceErrors':whitespace,'failures':failures}
(out/'shared/document-checks.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2));assert not failures,failures
