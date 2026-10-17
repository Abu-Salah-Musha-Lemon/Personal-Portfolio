#!/usr/bin/env node
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');

global.window = {
  location: { href: 'https://portfolio.example/index.html', protocol: 'https:', origin: 'https://portfolio.example' },
  __portfolioDesign: {},
  matchMedia: () => ({ matches: false })
};
global.document = {
  documentElement: { dataset: {}, style: { setProperty(){}, removeProperty(){} } },
  querySelector(){ return null; },
  querySelectorAll(){ return []; },
  getElementById(){ return null; },
  head: { appendChild(){} },
  createElement(){ return { setAttribute(){}, remove(){}, style:{}, dataset:{} }; }
};
global.localStorage = { getItem(){ return null; }, setItem(){} };

const source = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'core.js'), 'utf8');
vm.runInThisContext(source, { filename: 'core.js' });
const C = global.window.PortfolioCore;
if (!C) throw new Error('PortfolioCore was not exported');

const checks = [];
function assert(name, condition, detail='') {
  if (!condition) throw new Error(`FAIL: ${name}${detail ? ` — ${detail}` : ''}`);
  checks.push(name);
}

let info = C.mediaInfo({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' });
assert('YouTube video detected', info.kind === 'video' && info.embedType === 'iframe' && /youtube\.com\/embed\//.test(info.embedUrl));

info = C.mediaInfo({ url: 'https://www.youtube.com/channel/UCuJrVADp9B0T9AIadz2eAVw' });
assert('YouTube channel converted to uploads playlist', info.kind === 'video' && /videoseries\?list=UU/.test(info.embedUrl));

info = C.mediaInfo({ url: 'https://youtube.com/playlist?list=RDB2xCioFEeCQ&playnext=1&si=fpYTyX_6XKopg7Te' });
assert('YouTube RD Mix uses seed-video playlist embed', info.kind === 'video' && info.provider === 'YouTube Mix' && info.embedUrl.includes('/embed/B2xCioFEeCQ?list=RDB2xCioFEeCQ'));

info = C.mediaInfo({ url: 'https://ncs.io/track/download/e129ae98-f110-496c-8490-5dd339f63914', sourceUrl: 'https://ncs.io/free', kind: 'audio' });
assert('NCS extensionless download uses native audio', info.kind === 'audio' && info.embedType === 'native-audio' && info.originalUrl === 'https://ncs.io/free');

info = C.mediaInfo({ url: 'https://images.pexels.com/photos/14016664/pexels-photo-14016664.jpeg?auto=compress&dpr=1&h=750&w=1260', sourceUrl:'https://www.pexels.com/photo/computer-set-up-on-the-table-14016664/' });
assert('Pexels direct image uses image renderer', info.kind === 'image' && info.embedType === 'image' && info.originalUrl.includes('pexels.com/photo/'));

info = C.mediaInfo({ url: 'https://open.spotify.com/intl-fr/track/abc123' });
assert('Spotify intl URL detected', info.kind === 'audio' && info.embedType === 'iframe' && info.embedUrl.includes('/embed/track/abc123'));

info = C.mediaInfo({ url: 'https://cdn.example.com/demo.mp4' });
assert('Direct MP4 uses native video', info.kind === 'video' && info.embedType === 'native-video');

info = C.mediaInfo({ url: 'https://cdn.example.com/audio.mp3' });
assert('Direct MP3 uses native audio', info.kind === 'audio' && info.embedType === 'native-audio');

info = C.mediaInfo({ url: 'https://example.com/post/123', kind: 'video', platform: 'Unsupported Platform' });
const unsupportedHtml = C.renderMediaPlayer({ title:'Unsupported', url:'https://example.com/post/123', kind:'video' }, info);
assert('Unsupported video link falls back to external card', unsupportedHtml.includes('media-link-preview') && !unsupportedHtml.includes('<video'));

info = C.mediaInfo({ url:'https://platform.example/watch/123', embedUrl:'https://platform.example/embed/123', kind:'video', platform:'Custom' });
const customHtml = C.renderMediaPlayer({ title:'Custom', url:'https://platform.example/watch/123', embedUrl:'https://platform.example/embed/123', kind:'video' }, info);
assert('Custom embedUrl renders iframe', customHtml.includes('<iframe') && customHtml.includes('platform.example/embed/123'));


info = C.mediaInfo({
  url: 'https://www.youtube.com/watch?v=B2xCioFEeCQ&list=RDB2xCioFEeCQ&start_radio=1',
  embedUrl: 'https://www.youtube.com/embed/B2xCioFEeCQ?si=abc&amp;start=286',
  alternateEmbedUrl: 'https://www.youtube-nocookie.com/embed/B2xCioFEeCQ?start=286',
  kind: 'video', platform: 'YouTube'
});
assert('Exact YouTube embedUrl takes priority', info.embedUrl.includes('youtube.com/embed/B2xCioFEeCQ') && info.embedUrl.includes('start=286'));
assert('HTML-escaped ampersand normalized in URL', !info.embedUrl.includes('&amp;') && info.embedUrl.includes('&start=286'));
assert('YouTube fallback embed retained', info.fallbackEmbedUrl.includes('youtube-nocookie.com/embed/B2xCioFEeCQ'));
const exactEmbedHtml = C.renderMediaPlayer({ title:'Exact YouTube', kind:'video' }, info);
assert('YouTube uses click-to-play shell with external fallback', exactEmbedHtml.includes('media-youtube-click') && exactEmbedHtml.includes('Play video') && exactEmbedHtml.includes('YouTube ↗'));
assert('YouTube embed identifies site origin', exactEmbedHtml.includes('origin=https%3A%2F%2Fportfolio.example'));

assert('javascript URL rejected', C.safeHref('javascript:alert(1)') === '');
assert('relative project URL allowed', C.safeLocalHref('project.html?project=demo') === 'project.html?project=demo');
assert('external URL rejected as local', C.safeLocalHref('https://evil.example/x') === '');

console.log(`PASS: ${checks.length} PortfolioCore unit checks`);
checks.forEach(name => console.log(`  ✓ ${name}`));
