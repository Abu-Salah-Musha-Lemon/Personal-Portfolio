#!/usr/bin/env python3
from __future__ import annotations
import json, re, subprocess, sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []
warnings: list[str] = []

def fail(msg): errors.append(msg)
def warn(msg): warnings.append(msg)

# ---------- JSON ----------
content_path = ROOT / 'data' / 'content.json'
try:
    data = json.loads(content_path.read_text(encoding='utf-8'))
except Exception as exc:
    print(f'FAIL: content.json cannot be parsed: {exc}')
    sys.exit(1)

required_top = ['site','profile','design','projects','media','skills','experience','research','contact']
for key in required_top:
    if key not in data: fail(f'missing top-level key: {key}')

for key in ['projects','skills','experience']:
    if not isinstance(data.get(key), list): fail(f'{key} must be an array')
if not isinstance(data.get('media',{}).get('items',[]), list): fail('media.items must be an array')
if not isinstance(data.get('research',{}).get('directions',[]), list): fail('research.directions must be an array')

projects = data.get('projects', []) if isinstance(data.get('projects'), list) else []
slugs = set()
for i, project in enumerate(projects):
    if not isinstance(project, dict):
        fail(f'projects[{i}] must be an object'); continue
    if not str(project.get('title','')).strip(): fail(f'projects[{i}] missing title')
    slug = str(project.get('slug','')).strip()
    if project.get('caseStudyData') and not slug: fail(f'projects[{i}] has caseStudyData but no slug')
    if slug:
        if slug in slugs: fail(f'duplicate project slug: {slug}')
        slugs.add(slug)
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', slug):
            fail(f'project slug must be lowercase kebab-case: {slug}')

allowed_kinds = {'video','audio','image','document','link'}
for i, item in enumerate(data.get('media',{}).get('items',[])):
    if not isinstance(item, dict):
        fail(f'media.items[{i}] must be an object'); continue
    if not str(item.get('title','')).strip(): fail(f'media.items[{i}] missing title')
    if not (item.get('url') or item.get('embedUrl')): fail(f'media.items[{i}] needs url or embedUrl')
    kind = str(item.get('kind') or item.get('type') or '').strip().lower()
    if kind and kind not in allowed_kinds: fail(f'media.items[{i}].kind must be one of {sorted(allowed_kinds)}')
    if item.get('embedUrl') and not kind:
        warn(f'media.items[{i}] has embedUrl but no kind; add video/audio/document for inline embedding')

design = data.get('design', {}) if isinstance(data.get('design'), dict) else {}
components = design.get('components', {}) if isinstance(design.get('components'), dict) else {}
allowed_components = {
    'surfaceStyle': {'glass','solid','flat'},
    'buttonStyle': {'gradient','solid','outline'},
    'shapeStyle': {'rounded','soft','square'},
    'motion': {'full','reduced','none'},
}
for key, values in allowed_components.items():
    if components.get(key) not in values: fail(f'design.components.{key} must be one of: {sorted(values)}')

layout = design.get('layout', {}) if isinstance(design.get('layout'), dict) else {}
cols = layout.get('projectColumns', 2)
if not isinstance(cols, (int,float)) or isinstance(cols, bool) or not (1 <= cols <= 3):
    fail('design.layout.projectColumns must be between 1 and 3')

if design.get('defaultTheme') not in {'dark','light'}:
    fail('design.defaultTheme must be dark or light')
if not isinstance(design.get('allowThemeToggle'), bool):
    fail('design.allowThemeToggle must be true or false')

palette_keys = {'background','backgroundElevated','surface','surfaceSolid','surfaceSecondary','text','muted','mutedSecondary','line','lineStrong','primary','secondary','tertiary','success'}
for theme in ('dark','light'):
    palette = design.get('palette',{}).get(theme,{})
    if not isinstance(palette,dict):
        fail(f'design.palette.{theme} must be an object')
        continue
    missing = palette_keys - set(palette)
    if missing: fail(f'design.palette.{theme} missing: {", ".join(sorted(missing))}')

site = data.get('site', {}) if isinstance(data.get('site'), dict) else {}
known_sections = {'home','about','experience','education','work','creative','research','media','skills','learning','contact'}
order = site.get('sectionOrder', [])
hidden = site.get('hiddenSections', [])
if not isinstance(order,list): fail('site.sectionOrder must be an array')
else:
    unknown = [x for x in order if x not in known_sections]
    for x in unknown: fail(f'unknown site.sectionOrder id: {x}')
    if len(order) != len(set(order)): fail('site.sectionOrder contains duplicates')
if not isinstance(hidden,list): fail('site.hiddenSections must be an array')
else:
    for x in hidden:
        if x not in known_sections: fail(f'unknown site.hiddenSections id: {x}')
for i, nav in enumerate(site.get('navigation', [])):
    target = nav.get('target') if isinstance(nav,dict) else None
    if target not in known_sections: fail(f'site.navigation[{i}] has unknown target: {target}')

# ---------- HTML link / ID checks ----------
class Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs=[]
        self.ids=[]
    def handle_starttag(self, tag, attrs):
        d=dict(attrs)
        if 'id' in d: self.ids.append(d['id'])
        for attr in ('href','src'):
            if attr in d: self.refs.append((tag,attr,d[attr]))

html_files = list(ROOT.glob('*.html')) + list(ROOT.glob('*.htm')) + list((ROOT/'projects').glob('*.html'))
for html in html_files:
    parser=Parser()
    try: parser.feed(html.read_text(encoding='utf-8'))
    except Exception as exc:
        fail(f'{html.relative_to(ROOT)} cannot be parsed as HTML text: {exc}')
        continue
    seen=set()
    for ident in parser.ids:
        if ident in seen: fail(f'{html.relative_to(ROOT)} duplicate id="{ident}"')
        seen.add(ident)
    for tag, attr, value in parser.refs:
        raw=(value or '').strip()
        if not raw or raw.startswith(('#','mailto:','tel:','data:','javascript:')): continue
        parts=urlsplit(raw)
        if parts.scheme in ('http','https'): continue
        if parts.scheme: continue
        local=parts.path
        if not local: continue
        target=(html.parent / local).resolve()
        # directory links like ./ are valid if directory exists
        if not target.exists():
            fail(f'{html.relative_to(ROOT)} references missing local file: {raw}')

required_ids = {
    'index.html': {'heroContent','focusAreas','aboutHeading','aboutCopy','experienceHeading','experienceList','educationHeading','educationGrid','workHeading','projectFilters','projectGrid','creativeHeading','creativeGrid','researchHeading','researchIntro','researchGrid','researchExplorations','publicationNote','mediaHeading','mediaFilters','mediaIntro','mediaGrid','skillsHeading','skillsGrid','learningHeading','certList','contactContent','footerContent','themeToggle'},
    'media.html': {'mediaIntro','mediaFilters','mediaSearch','mediaGrid','libraryFooter','themeToggle'},
    'research.html': {'researchIntro','researchGrid','researchExplorations','publicationNote','libraryFooter','themeToggle'},
    'project.html': {'projectPage','projectFooter','themeToggle'},
}
for name, ids in required_ids.items():
    p=Parser(); p.feed((ROOT/name).read_text(encoding='utf-8'))
    missing=ids-set(p.ids)
    if missing: fail(f'{name} missing required ids: {", ".join(sorted(missing))}')

# ---------- CSS sanity ----------
css_path=ROOT/'assets'/'css'/'styles.css'
css=css_path.read_text(encoding='utf-8')
for name, value in re.findall(r'(--[\w-]+)\s*:\s*([^;{}]+);', css):
    if re.search(rf'var\(\s*{re.escape(name)}\s*[,)]', value):
        fail(f'CSS variable self-reference detected: {name}: {value.strip()}')
if '.media-card.hidden' not in css and '[hidden]' not in css:
    fail('CSS has no rule to hide filtered media cards')
if 'min-height: var(--project-min-height)' not in css:
    fail('projectMinHeight JSON variable is not wired to project cards')

# ---------- JavaScript syntax ----------
for js in sorted((ROOT/'assets'/'js').glob('*.js')):
    result=subprocess.run(['node','--check',str(js)],capture_output=True,text=True)
    if result.returncode:
        fail(f'JavaScript syntax error in {js.relative_to(ROOT)}: {result.stderr.strip()}')

# Core behavior unit tests
core_test=subprocess.run(['node',str(ROOT/'tools'/'test_core.js')],capture_output=True,text=True)
if core_test.returncode:
    fail(f'PortfolioCore unit tests failed:\n{core_test.stdout}{core_test.stderr}')

# ---------- result ----------
if errors:
    print('FAIL:')
    for error in errors: print(' -', error)
    if warnings:
        print('WARNINGS:')
        for item in warnings: print(' -', item)
    sys.exit(1)

print('PASS: portfolio validation completed')
print(f'  HTML pages: {len(html_files)}')
print(f'  projects: {len(projects)}')
print(f'  media items: {len(data.get("media",{}).get("items",[]))}')
print(f'  research directions: {len(data.get("research",{}).get("directions",[]))}')
print('  JavaScript syntax: PASS')
print('  Core media/link unit tests: PASS')
print('  Local file references: PASS')
print('  CSS dynamic-variable sanity: PASS')
if warnings:
    print('WARNINGS:')
    for item in warnings: print(' -', item)
