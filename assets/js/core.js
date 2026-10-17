(() => {
  'use strict';

  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));

  const normalizeUrlText = (value = '') => String(value || '').trim()
    .replace(/&amp;/gi, '&')
    .replace(/&#0*38;/gi, '&')
    .replace(/&#x0*26;/gi, '&');

  const safeHttpUrl = (value = '') => {
    const raw = normalizeUrlText(value);
    if (!raw) return '';
    try {
      const url = new URL(raw, window.location.href);
      if (!['http:', 'https:'].includes(url.protocol)) return '';
      return url.href;
    } catch { return ''; }
  };

  const safeHref = (value = '') => {
    const raw = normalizeUrlText(value);
    if (!raw) return '';
    if (/^(mailto:|tel:)/i.test(raw)) return raw.replace(/["'<>`]/g, '');
    try {
      const url = new URL(raw, window.location.href);
      if (!['http:', 'https:'].includes(url.protocol)) return '';
      return url.href;
    } catch { return ''; }
  };

  const safeLocalHref = (value = '') => {
    const raw = String(value || '').trim();
    if (!raw || /[<>"'`]/.test(raw)) return '';
    if (raw.startsWith('#')) return raw;
    if (/^(?:javascript|data|vbscript):/i.test(raw) || raw.startsWith('//')) return '';
    if (!/^[a-z][a-z0-9+.-]*:/i.test(raw)) return raw;
    try {
      const base = new URL(window.location.href);
      const url = new URL(raw, base);
      if (!['http:', 'https:', 'file:'].includes(url.protocol)) return '';
      if (base.protocol === 'file:') return url.protocol === 'file:' ? `${url.pathname}${url.search}${url.hash}` : '';
      return url.origin === base.origin ? `${url.pathname}${url.search}${url.hash}` : '';
    } catch { return ''; }
  };

  const loadContent = async (path = 'data/content.json') => {
    const response = await fetch(path, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Content request failed (${response.status})`);
    const data = await response.json();
    if (!data || typeof data !== 'object') throw new Error('Content JSON is invalid.');
    return data;
  };

  const THEME_STORAGE_KEY = 'asm-theme-choice';

  const setTheme = (theme, persist = true) => {
    const next = theme === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    if (persist) {
      try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch { /* storage can be unavailable */ }
    }
    const design = window.__portfolioDesign || {};
    const palette = next === 'light' ? design.palette?.light : design.palette?.dark;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && palette?.background) meta.content = palette.background;
    document.querySelectorAll('[data-theme-toggle], #themeToggle').forEach(button => {
      button.setAttribute('aria-pressed', String(next === 'light'));
      button.setAttribute('title', next === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    });
  };

  const getStoredTheme = () => {
    try {
      const value = localStorage.getItem(THEME_STORAGE_KEY) || '';
      return value === 'light' || value === 'dark' ? value : '';
    } catch { return ''; }
  };

  const initTheme = (button) => {
    if (!button || button.dataset.themeBound === '1') return;
    button.dataset.themeBound = '1';
    button.addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark', true));
  };



  const cssSafe = (value, fallback = '') => {
    const raw = String(value ?? '').trim();
    if (!raw || /[{};<>]/.test(raw)) return fallback;
    return raw.slice(0, 240);
  };

  const numberInRange = (value, fallback, min, max) => {
    const n = Number(value);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  };

  const applyDesignSettings = (design = {}) => {
    if (!design || typeof design !== 'object') return;
    const dark = design.palette?.dark || {};
    const light = design.palette?.light || {};
    const type = design.typography || {};
    const layout = design.layout || {};
    const shape = design.shape || {};
    const effects = design.effects || {};
    const components = design.components || {};

    const fontStylesheet = safeHttpUrl(type.fontStylesheet || '');
    let fontLink = document.getElementById('portfolio-dynamic-font');
    if (fontStylesheet) {
      if (!fontLink) { fontLink = document.createElement('link'); fontLink.id = 'portfolio-dynamic-font'; fontLink.rel = 'stylesheet'; document.head.appendChild(fontLink); }
      fontLink.href = fontStylesheet;
    } else if (fontLink) { fontLink.remove(); }

    const varMap = {
      '--font-body': cssSafe(type.bodyFont, "Inter, ui-sans-serif, system-ui, sans-serif"),
      '--font-heading': cssSafe(type.headingFont, "Inter, ui-sans-serif, system-ui, sans-serif"),
      '--font-mono': cssSafe(type.monoFont, "ui-monospace, SFMono-Regular, Menlo, monospace"),
      '--base-font-size': cssSafe(type.baseSize, '16px'),
      '--body-line-height': cssSafe(type.lineHeight, '1.65'),
      '--heading-weight': cssSafe(type.headingWeight, '800'),
      '--heading-letter-spacing': cssSafe(type.letterSpacing, '-0.02em'),
      '--container': cssSafe(layout.containerWidth, '1180px'),
      '--header-h': cssSafe(layout.headerHeight, '78px'),
      '--section-space': cssSafe(layout.sectionSpacing, '116px'),
      '--grid-gap': cssSafe(layout.gridGap, '18px'),
      '--project-columns': String(Math.round(numberInRange(layout.projectColumns, 2, 1, 3))),
      '--project-min-height': cssSafe(layout.projectMinHeight, '430px'),
      '--radius-xl': cssSafe(shape.radiusXL, '28px'),
      '--radius-lg': cssSafe(shape.radiusLG, '20px'),
      '--radius-md': cssSafe(shape.radiusMD, '14px'),
      '--button-radius': cssSafe(shape.buttonRadius, '13px'),
      '--glass-blur': cssSafe(effects.glassBlur, '18px'),
      '--hover-lift': cssSafe(effects.hoverLift, '5px'),
      '--noise-opacity': cssSafe(effects.noiseOpacity, '.035'),
      '--aurora-opacity': cssSafe(effects.auroraOpacity, '.12'),
      '--motion-duration': cssSafe(effects.motionDuration, '250ms'),
      '--shadow-dark': cssSafe(effects.shadow, '0 30px 80px rgba(0,0,0,.32)'),
      '--shadow-light': cssSafe(effects.lightShadow, '0 24px 70px rgba(21,37,68,.12)')
    };

    const paletteVars = palette => ({
      '--bg': cssSafe(palette.background),
      '--bg-elev': cssSafe(palette.backgroundElevated),
      '--surface': cssSafe(palette.surface),
      '--surface-solid': cssSafe(palette.surfaceSolid),
      '--surface-2': cssSafe(palette.surfaceSecondary),
      '--text': cssSafe(palette.text),
      '--muted': cssSafe(palette.muted),
      '--muted-2': cssSafe(palette.mutedSecondary),
      '--line': cssSafe(palette.line),
      '--line-strong': cssSafe(palette.lineStrong),
      '--primary': cssSafe(palette.primary),
      '--primary-2': cssSafe(palette.secondary),
      '--primary-3': cssSafe(palette.tertiary),
      '--success': cssSafe(palette.success)
    });

    const toCss = vars => Object.entries(vars).filter(([,v]) => v).map(([k,v]) => `${k}:${v}`).join(';');
    const styleId = 'portfolio-dynamic-design';
    let style = document.getElementById(styleId);
    if (!style) { style = document.createElement('style'); style.id = styleId; document.head.appendChild(style); }
    const common = {...varMap, '--shadow': varMap['--shadow-dark']};
    const lightVars = {...paletteVars(light), '--shadow': varMap['--shadow-light']};
    style.textContent = `:root{${toCss({...common, ...paletteVars(dark)})}}html[data-theme="light"]{${toCss(lightVars)}}`;

    const root = document.documentElement;
    const surface = ['glass','solid','flat'].includes(components.surfaceStyle) ? components.surfaceStyle : 'glass';
    const buttons = ['gradient','solid','outline'].includes(components.buttonStyle) ? components.buttonStyle : 'gradient';
    const shapeStyle = ['rounded','soft','square'].includes(components.shapeStyle) ? components.shapeStyle : 'rounded';
    const motion = ['full','reduced','none'].includes(components.motion) ? components.motion : 'full';
    root.dataset.surfaceStyle = surface;
    root.dataset.buttonStyle = buttons;
    root.dataset.shapeStyle = shapeStyle;
    root.dataset.motion = motion;

    if (shapeStyle === 'square') {
      root.style.setProperty('--radius-xl', '4px'); root.style.setProperty('--radius-lg', '4px'); root.style.setProperty('--radius-md', '4px'); root.style.setProperty('--button-radius', '4px');
    } else if (shapeStyle === 'soft') {
      root.style.setProperty('--radius-xl', '18px'); root.style.setProperty('--radius-lg', '14px'); root.style.setProperty('--radius-md', '10px'); root.style.setProperty('--button-radius', '10px');
    } else {
      ['--radius-xl','--radius-lg','--radius-md','--button-radius'].forEach(x => root.style.removeProperty(x));
    }

    window.__portfolioDesign = design;
    const saved = getStoredTheme();
    const preferred = window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    const configured = ['light','dark'].includes(design.defaultTheme) ? design.defaultTheme : preferred;
    setTheme(saved || configured, false);
    document.querySelectorAll('[data-theme-toggle], #themeToggle').forEach(button => {
      button.hidden = design.allowThemeToggle === false;
      initTheme(button);
    });
  };

  const mediaInfo = (item = {}) => {
    const rawUrl = safeHttpUrl(item.url || '');
    const originalUrl = safeHttpUrl(item.sourceUrl || item.originalUrl || item.url || '');
    const customEmbed = safeHttpUrl(item.embedUrl || '');
    const alternateEmbed = safeHttpUrl(item.alternateEmbedUrl || item.fallbackEmbedUrl || '');
    const forcedRaw = String(item.kind || item.type || '').toLowerCase().trim();
    const allowedKinds = new Set(['video', 'audio', 'image', 'document', 'link']);
    const forced = allowedKinds.has(forcedRaw) ? forcedRaw : '';
    let kind = forced || 'link';
    let embedUrl = customEmbed;
    let fallbackEmbedUrl = alternateEmbed;
    let provider = String(item.platform || '').trim();
    let thumbnail = safeHttpUrl(item.thumbnail || item.poster || '');
    let embedType = customEmbed ? 'iframe' : '';
    let mediaId = '';

    if (!rawUrl) return { rawUrl: '', originalUrl, embedUrl, fallbackEmbedUrl, kind, provider: provider || 'External resource', thumbnail, embedType, mediaId };

    const parsed = new URL(rawUrl);
    const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
    const path = parsed.pathname;
    const lower = rawUrl.toLowerCase();
    let match;

    const isYouTube = host === 'youtu.be' || host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com');
    if (isYouTube) {
      let videoId = '';
      let channelId = '';
      let playlistId = parsed.searchParams.get('list') || '';
      if (host === 'youtu.be') videoId = path.split('/').filter(Boolean)[0] || '';
      if (!videoId) videoId = parsed.searchParams.get('v') || '';
      if (!videoId) videoId = path.match(/^\/(?:shorts|live|embed|v)\/([A-Za-z0-9_-]{6,})/i)?.[1] || '';
      channelId = path.match(/^\/channel\/(UC[A-Za-z0-9_-]+)/i)?.[1] || '';

      if (videoId) {
        kind = forced || 'video'; provider ||= 'YouTube'; mediaId = videoId;
        const privacyEmbed = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0&playsinline=1`;
        const standardEmbed = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?rel=0&playsinline=1`;
        embedUrl ||= standardEmbed;
        if (!fallbackEmbedUrl) fallbackEmbedUrl = embedUrl.includes('youtube.com') && !embedUrl.includes('youtube-nocookie.com') ? privacyEmbed : standardEmbed;
        thumbnail ||= `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
        embedType = 'iframe';
      } else if (playlistId) {
        kind = forced || 'video'; mediaId = playlistId;
        const mixSeed = playlistId.match(/^RD([A-Za-z0-9_-]{11})/)?.[1] || '';
        if (mixSeed) {
          provider ||= 'YouTube Mix';
          const privacyEmbed = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(mixSeed)}?list=${encodeURIComponent(playlistId)}&rel=0&playsinline=1`;
          const standardEmbed = `https://www.youtube.com/embed/${encodeURIComponent(mixSeed)}?list=${encodeURIComponent(playlistId)}&rel=0&playsinline=1`;
          embedUrl ||= standardEmbed;
          if (!fallbackEmbedUrl) fallbackEmbedUrl = embedUrl.includes('youtube.com') && !embedUrl.includes('youtube-nocookie.com') ? privacyEmbed : standardEmbed;
          thumbnail ||= `https://i.ytimg.com/vi/${encodeURIComponent(mixSeed)}/hqdefault.jpg`;
        } else {
          provider ||= 'YouTube Playlist';
          const privacyEmbed = `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(playlistId)}`;
          const standardEmbed = `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(playlistId)}`;
          embedUrl ||= standardEmbed;
          if (!fallbackEmbedUrl) fallbackEmbedUrl = embedUrl.includes('youtube.com') && !embedUrl.includes('youtube-nocookie.com') ? privacyEmbed : standardEmbed;
        }
        embedType = 'iframe';
      } else if (channelId) {
        // YouTube uploads playlist: UCxxxxxxxx -> UUxxxxxxxx.
        const uploads = `UU${channelId.slice(2)}`;
        kind = forced || 'video'; provider ||= 'YouTube Channel'; mediaId = channelId;
        const privacyEmbed = `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(uploads)}`;
        const standardEmbed = `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(uploads)}`;
        embedUrl ||= standardEmbed;
        if (!fallbackEmbedUrl) fallbackEmbedUrl = embedUrl.includes('youtube.com') && !embedUrl.includes('youtube-nocookie.com') ? privacyEmbed : standardEmbed;
        embedType = 'iframe';
      } else {
        kind = forced || 'link'; provider ||= 'YouTube';
      }
    } else if ((match = rawUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/i))) {
      kind = forced || 'video'; provider ||= 'Vimeo'; mediaId = match[1];
      embedUrl ||= `https://player.vimeo.com/video/${match[1]}`; embedType = 'iframe';
    } else if ((match = rawUrl.match(/(?:dailymotion\.com\/video\/|dai\.ly\/)([A-Za-z0-9]+)/i))) {
      kind = forced || 'video'; provider ||= 'Dailymotion'; mediaId = match[1];
      embedUrl ||= `https://www.dailymotion.com/embed/video/${match[1]}`; embedType = 'iframe';
    } else if ((match = rawUrl.match(/instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i))) {
      kind = forced || 'video'; provider ||= 'Instagram'; mediaId = match[1];
      embedUrl ||= `https://www.instagram.com/p/${match[1]}/embed/`; embedType = 'iframe';
    } else if ((match = rawUrl.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/i))) {
      kind = forced || 'video'; provider ||= 'TikTok'; mediaId = match[1];
      embedUrl ||= `https://www.tiktok.com/player/v1/${match[1]}`; embedType = 'iframe';
    } else if (host.endsWith('spotify.com')) {
      const spotifyPath = path.replace(/^\//, '').replace(/^intl-[^/]+\//i, '').split('?')[0];
      if (/^(track|episode|show|playlist|album)\/[A-Za-z0-9]+/.test(spotifyPath)) {
        kind = forced || 'audio'; provider ||= 'Spotify';
        embedUrl ||= `https://open.spotify.com/embed/${spotifyPath}`; embedType = 'iframe';
      }
    } else if (host.endsWith('soundcloud.com')) {
      kind = forced || 'audio'; provider ||= 'SoundCloud';
      embedUrl ||= `https://w.soundcloud.com/player/?url=${encodeURIComponent(rawUrl)}&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&visual=false`;
      embedType = 'iframe';
    } else if (host.endsWith('mixcloud.com')) {
      kind = forced || 'audio'; provider ||= 'Mixcloud';
      embedUrl ||= `https://www.mixcloud.com/widget/iframe/?hide_cover=1&feed=${encodeURIComponent(path)}`;
      embedType = 'iframe';
    } else if (host === 'drive.google.com') {
      const id = path.match(/\/file\/d\/([^/]+)/)?.[1] || parsed.searchParams.get('id') || '';
      if (id) {
        provider ||= 'Google Drive'; mediaId = id;
        embedUrl ||= `https://drive.google.com/file/d/${encodeURIComponent(id)}/preview`;
        if (!forced) kind = /\.(mp4|webm|mov|m4v)$/i.test(String(item.filename || '')) ? 'video' : 'document';
        embedType = 'iframe';
      }
    } else if (host === 'ncs.io' && /^\/track\/download\/[A-Za-z0-9-]+\/?$/i.test(path)) {
      kind = forced || 'audio'; provider ||= 'NCS'; embedType = 'native-audio';
    } else if (host.endsWith('facebook.com') && (path.includes('/videos/') || path.includes('/watch') || parsed.searchParams.has('v'))) {
      kind = forced || 'video'; provider ||= 'Facebook';
      embedUrl ||= `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(rawUrl)}&show_text=false`;
      embedType = 'iframe';
    } else if (/\.(mp4|webm|mov|m4v)(?:[?#].*)?$/i.test(lower)) {
      kind = forced || 'video'; provider ||= 'Video file'; embedType = 'native-video';
    } else if (/\.(mp3|wav|m4a|aac|flac|oga|ogg|opus)(?:[?#].*)?$/i.test(lower)) {
      kind = forced || 'audio'; provider ||= 'Audio file'; embedType = 'native-audio';
    } else if (/\.(png|jpe?g|webp|gif|avif|svg)(?:[?#].*)?$/i.test(lower)) {
      kind = forced || 'image'; provider ||= 'Image'; embedType = 'image';
    } else if (/\.pdf(?:[?#].*)?$/i.test(lower)) {
      kind = forced || 'document'; provider ||= 'PDF'; embedUrl ||= rawUrl; embedType = 'iframe';
    } else if (customEmbed) {
      embedType = 'iframe';
    }

    return { rawUrl, originalUrl: originalUrl || rawUrl, embedUrl, fallbackEmbedUrl, kind, provider: provider || 'External resource', thumbnail, embedType, mediaId };
  };

  const prepareEmbedUrl = (url = '', provider = '') => {
    const safe = safeHttpUrl(url || '');
    if (!safe) return '';
    try {
      const parsed = new URL(safe);
      const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
      const isYouTubeEmbed = (host === 'youtube.com' || host === 'youtube-nocookie.com') && /^\/embed\//i.test(parsed.pathname);
      if (isYouTubeEmbed) {
        // YouTube recommends identifying the embedding origin. This also avoids
        // common Error 153/referrer issues on hosted sites such as GitHub Pages.
        if (window.location && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
          parsed.searchParams.set('origin', window.location.origin);
        }
        parsed.searchParams.set('playsinline', '1');
        parsed.searchParams.set('rel', '0');
      }
      return parsed.toString();
    } catch (_) {
      return safe;
    }
  };

  const withAutoplay = (url = '') => {
    const prepared = prepareEmbedUrl(url);
    if (!prepared) return '';
    try {
      const parsed = new URL(prepared);
      const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
      if ((host === 'youtube.com' || host === 'youtube-nocookie.com') && /^\/embed\//i.test(parsed.pathname)) {
        parsed.searchParams.set('autoplay', '1');
      }
      return parsed.toString();
    } catch (_) {
      return prepared;
    }
  };

  const renderMediaPlayer = (item = {}, info = mediaInfo(item), options = {}) => {
    const title = escapeHtml(item.title || 'Published material');
    const raw = escapeHtml(info.rawUrl);
    const preparedEmbed = prepareEmbedUrl(info.embedUrl, info.provider);
    const embed = escapeHtml(preparedEmbed);
    const thumb = escapeHtml(info.thumbnail);
    const lazy = Boolean(options.lazyEmbeds || item.lazy);

    const isYouTube = /^YouTube/i.test(String(info.provider || '')) && info.kind === 'video' && info.embedType === 'iframe';
    if (isYouTube && info.embedUrl) {
      const fallback = escapeHtml(prepareEmbedUrl(info.fallbackEmbedUrl || '', info.provider));
      const helper = fallback ? `<div class="media-player-helper"><span></span><a class="media-fallback-link" href="${escapeHtml(info.originalUrl || info.rawUrl)}" target="_blank" rel="noopener noreferrer">YouTube ↗</a></div>` : '';
      const poster = thumb ? `<img src="${thumb}" alt="" loading="eager">` : '';
      return `<div class="media-player media-frame media-lazy media-youtube-click" data-embed-url="${embed}" data-title="${title}">${poster}<button class="media-load" type="button" aria-label="Play video: ${title}"><span aria-hidden="true">▶</span> Play video</button></div>${helper}`;
    }

    if (info.embedType === 'iframe' && info.embedUrl && ['video', 'audio', 'document'].includes(info.kind)) {
      const wrapper = info.kind === 'audio' ? 'media-audio-embed' : info.kind === 'document' ? 'media-document' : 'media-frame';
      const action = info.kind === 'audio' ? 'Load audio player' : info.kind === 'document' ? 'Preview document' : 'Play on this site';
      const icon = info.kind === 'document' ? '↗' : '▶';
      if (lazy) {
        return `<div class="media-player ${wrapper} media-lazy" data-embed-url="${embed}" data-title="${title}">${thumb ? `<img src="${thumb}" alt="" loading="lazy">` : ''}<button class="media-load" type="button" aria-label="${action}: ${title}"><span aria-hidden="true">${icon}</span> ${action}</button></div>`;
      }
      const allow = info.kind === 'document' ? '' : ' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowfullscreen';
      const preparedFallback = prepareEmbedUrl(info.fallbackEmbedUrl || '', info.provider);
      const fallback = escapeHtml(preparedFallback);
      const helper = fallback && fallback !== embed ? `<div class="media-player-helper"><span></span><button type="button" class="media-fallback-btn" data-media-fallback="${fallback}">Alternate player</button></div>` : '';
      const loadMode = item.featured ? 'eager' : 'lazy';
      return `<div class="media-player ${wrapper}"><iframe src="${embed}" title="${title}" loading="${loadMode}" referrerpolicy="strict-origin-when-cross-origin"${allow}></iframe></div>${helper}`;
    }
    if (info.embedType === 'native-video' && info.rawUrl) {
      return `<div class="media-player media-native"><video controls preload="metadata" playsinline ${thumb ? `poster="${thumb}"` : ''}><source src="${raw}">Your browser does not support this video. <a href="${raw}" target="_blank" rel="noopener noreferrer">Open video</a>.</video></div>`;
    }
    if (info.embedType === 'native-audio' && info.rawUrl) {
      return `<div class="media-player media-native media-native-audio"><audio controls preload="metadata"><source src="${raw}">Your browser does not support this audio. <a href="${raw}" target="_blank" rel="noopener noreferrer">Open audio</a>.</audio></div>`;
    }
    if (info.embedType === 'image' && info.rawUrl) {
      return `<a class="media-player media-image" href="${raw}" target="_blank" rel="noopener noreferrer"><img src="${raw}" alt="${escapeHtml(item.alt || item.title || 'Published visual')}" loading="lazy"></a>`;
    }

    const destination = raw || embed;
    if (!destination) return `<div class="media-player media-link-preview"><span class="media-link-icon" aria-hidden="true">!</span><span>Invalid media URL</span></div>`;
    return `<a class="media-player media-link-preview" href="${destination}" target="_blank" rel="noopener noreferrer">${thumb ? `<img src="${thumb}" alt="" loading="lazy">` : `<span class="media-link-icon" aria-hidden="true">↗</span>`}<span>Open ${escapeHtml(info.provider)}</span></a>`;
  };

  const bindLazyMedia = (scope = document) => {
    scope.querySelectorAll('.media-lazy .media-load').forEach(button => {
      if (button.dataset.bound === '1') return;
      button.dataset.bound = '1';
      button.addEventListener('click', () => {
        const holder = button.closest('.media-lazy');
        const src = holder?.dataset.embedUrl;
        if (!holder || !src) return;
        const title = holder.dataset.title || 'Media player';
        const finalSrc = holder.classList.contains('media-youtube-click') ? withAutoplay(src) : src;
        holder.classList.remove('media-lazy');
        holder.innerHTML = `<iframe src="${escapeHtml(finalSrc)}" title="${escapeHtml(title)}" loading="eager" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowfullscreen></iframe>`;
      });
    });
    scope.querySelectorAll('.media-fallback-btn').forEach(button => {
      if (button.dataset.bound === '1') return;
      button.dataset.bound = '1';
      button.addEventListener('click', () => {
        const fallback = safeHttpUrl(button.dataset.mediaFallback || '');
        const card = button.closest('.media-card');
        const frame = card?.querySelector('.media-player iframe');
        if (!fallback || !frame) return;
        frame.src = fallback;
        button.disabled = true;
        button.textContent = 'Standard player loaded';
      });
    });
  };

  const observeReveals = (scope = document) => {
    if (!('IntersectionObserver' in window)) {
      scope.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
      return { observe: () => {} };
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    scope.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return observer;
  };

  window.PortfolioCore = {
    escapeHtml,
    safeHttpUrl,
    safeHref,
    safeLocalHref,
    loadContent,
    setTheme,
    initTheme,
    applyDesignSettings,
    mediaInfo,
    renderMediaPlayer,
    bindLazyMedia,
    observeReveals
  };
})();
