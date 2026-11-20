"""Export the P1 Markdown report with embedded original screenshots; no app writes.

Uses macOS Ruby/RDoc and the existing Edge executable. No new package install.
Run from any directory: python3 docs/evidence/run26/reports/render-report.py
"""
from pathlib import Path
from datetime import datetime, timezone
from urllib.parse import unquote, urlsplit
import base64
import hashlib
import html
import json
import re
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
SOURCE = ROOT / 'docs/ANDROID_FONT_SCALE_P1_REPORT.md'
HTML = OUT / 'android-font-scale-p1.html'
PDF = OUT / 'android-font-scale-p1.pdf'
EDGE = Path('/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge')
RUBY = shutil.which('ruby') or '/usr/bin/ruby'
digest = lambda data: hashlib.sha256(data).hexdigest()

# RDoc supports the report's Markdown tables and explicit HTML figure tables.
ruby = '''require "rdoc"; require "rdoc/markdown"; require "rdoc/markup/to_html";
print RDoc::Markdown.parse(File.read(ARGV[0])).accept(RDoc::Markup::ToHtml.new(RDoc::Options.new))'''
body = subprocess.check_output([RUBY, '-e', ruby, str(SOURCE)], text=True)
if body.count('<table') != 9:
    raise ValueError('Expected six analysis tables and three screenshot tables; use Ruby/RDoc with GFM table support')
# RDoc table cells can retain multi-word Markdown bold delimiters literally.
# Resolve those remaining authored delimiters before adding embedded image data.
def table_cell(match):
    value = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', match.group(1))
    value = re.sub(r'`([^`]+)`', r'<code>\1</code>', value)
    return '<td>'+value+'</td>'
body = re.sub(r'<td>(.*?)</td>', table_cell, body, flags=re.S)
figures = []
def embed_image(match):
    relative = html.unescape(match.group(1))
    path = (SOURCE.parent / unquote(relative)).resolve()
    if not path.is_relative_to(ROOT):
        raise ValueError('Image outside repository: '+relative)
    data = path.read_bytes()
    if not data.startswith(b'\x89PNG\r\n\x1a\n'):
        raise ValueError('Expected original PNG: '+relative)
    figures.append({'source': str(path.relative_to(ROOT)), 'sha256': digest(data), 'bytes': len(data)})
    return 'src="data:image/png;base64,' + base64.b64encode(data).decode() + '"'
body = re.sub(r'src="([^"]+)"', embed_image, body)
if len(figures) != 6:
    raise ValueError('Expected exactly the six explicit screenshot examples')

# PDF images are self-contained. Local evidence links intentionally reference
# the checkout, rather than pretending uncommitted artifacts have public URLs.
def local_link(match):
    value = html.unescape(match.group(1))
    split = urlsplit(value)
    if split.scheme or value.startswith('#'):
        return match.group(0)
    link_path = unquote(split.path)
    # RDoc's API-document formatter rewrites Markdown file references to its
    # generated *_md.html names. This report links to the real checkout files.
    if link_path.endswith('_md.html'):
        link_path = link_path[:-len('_md.html')]+'.md'
    target = (SOURCE.parent / link_path).resolve()
    if not target.is_relative_to(ROOT):
        raise ValueError('Evidence link outside repository: '+value)
    if target != PDF and not target.exists():
        raise FileNotFoundError(value)
    return 'href="'+html.escape(target.as_uri()+('#'+split.fragment if split.fragment else ''), quote=True)+'"'
body = re.sub(r'href="([^"]*)"', local_link, body)

style = '''
@page { size: A4; margin: 16mm 17mm 17mm; }
* { box-sizing: border-box; }
html { font-family: Arial, Helvetica, sans-serif; color: #172536; font-size: 10.25pt; }
body { max-width: 780px; margin: 0 auto; line-height: 1.43; }
h1 { font-size: 26pt; line-height: 1.13; color: #102e55; margin: 0 0 16pt; }
h2 { font-size: 16.5pt; line-height: 1.2; color: #123b66; margin: 22pt 0 9pt;
     padding-top: 8pt; border-top: 1px solid #b9c9da; break-after: avoid; }
h3 { font-size: 12pt; line-height: 1.22; margin: 15pt 0 6pt; break-after: avoid; }
h1 span, h2 span, h3 span { display: none; }
p { margin: 6pt 0 9pt; orphans: 3; widows: 3; break-inside: avoid; }
a { color: #14518e; text-decoration: underline; overflow-wrap: anywhere; }
code { font-family: Menlo, Consolas, monospace; font-size: .84em; overflow-wrap: anywhere; }
pre { border: 1px solid #ced7e0; background: #f4f7fa; padding: 10pt;
      white-space: pre-wrap; overflow-wrap: anywhere; font-size: 9pt; break-inside: avoid; }
table { border-collapse: collapse; width: 100%; table-layout: fixed;
        margin: 10pt 0 12pt; font-size: 9.1pt; line-height: 1.35; }
th { background: #eaf0f7; color: #123b66; font-weight: bold; text-align: left; }
td, th { border: 1px solid #c8d3de; padding: 6pt; vertical-align: top; overflow-wrap: anywhere; }
tr { break-inside: avoid; }
thead { display: table-header-group; }
table.figure-pair { break-inside: avoid; table-layout: fixed; }
table.figure-pair td { padding: 8pt; text-align: center; background: #f7f9fc; }
table.figure-pair th { text-align: center; }
table.figure-pair img { display: block; max-width: 100%; width: auto; height: 142mm;
                       margin: 0 auto; object-fit: contain; border: 1px solid #d5dce4; }
img { max-width: 100%; }
ul, ol { padding-left: 20pt; }
li { margin: 5pt 0; orphans: 2; widows: 2; }
@media screen { body { padding: 34px; background: white; } html { background: #e4eaf0; } }
'''
HTML.write_text('<!doctype html><html lang="en"><head><meta charset="utf-8">'
                '<meta name="viewport" content="width=device-width,initial-scale=1">'
                '<title>Android live font sizing — P05.2 issue and repair evidence</title>'
                '<style>'+style+'</style></head><body>'+body+'</body></html>')

if not EDGE.exists():
    raise FileNotFoundError('Existing Microsoft Edge is required for this local PDF export')
with tempfile.TemporaryDirectory(prefix='nato-p1-report-browser-') as profile:
    command = [str(EDGE), '--headless', '--disable-gpu', '--no-first-run',
               '--disable-background-networking', '--no-pdf-header-footer',
               '--user-data-dir='+profile, '--print-to-pdf='+str(PDF), HTML.as_uri()]
    result = subprocess.run(command, capture_output=True, timeout=60)
    (OUT/'pdf-export.log').write_bytes(result.stdout+result.stderr)
    if result.returncode != 0:
        raise RuntimeError('PDF export failed; see pdf-export.log')
pdf_bytes = PDF.read_bytes()
if not pdf_bytes.startswith(b'%PDF-') or len(pdf_bytes) < 10000:
    raise ValueError('PDF output is missing or unexpectedly empty')
metadata = {'generatedAt': datetime.now(timezone.utc).isoformat(),
            'evidenceAsOf': 'Run26 / 2026-11-19',
            'scope': 'Documentation export of existing observations; no new application acceptance',
            'markdown': {'path': str(SOURCE.relative_to(ROOT)), 'sha256': digest(SOURCE.read_bytes())},
            'html': {'path': str(HTML.relative_to(ROOT)), 'sha256': digest(HTML.read_bytes())},
            'pdf': {'path': str(PDF.relative_to(ROOT)), 'sha256': digest(pdf_bytes), 'bytes': len(pdf_bytes)},
            'figures': figures,
            'rubyRdocVersion': subprocess.check_output([RUBY, '-e', 'require "rdoc"; print RUBY_VERSION+" / RDoc "+RDoc::VERSION'], text=True),
            'browserVersion': subprocess.check_output([str(EDGE), '--version'], text=True).strip(),
            'notes': ['Original screenshot bytes embedded without cropping or editing.',
                      'PDF evidence links require the local repository checkout.',
                      'Existing Run26 verification and native evidence remain untouched.']}
(OUT/'report-metadata.json').write_text(json.dumps(metadata, indent=2)+'\n')
print(json.dumps({'pdf': str(PDF.relative_to(ROOT)), 'bytes': len(pdf_bytes), 'figures': len(figures)}))
