(() => {
  'use strict';
  const C = () => window.PortfolioCore;
  const $ = id => document.getElementById(id);
  const t = v => C().escapeHtml(v ?? '');
  const h = v => C().safeHref(v || '');
  let mediaRows = [];
  let activeKind = 'all';
  let query = '';

  const footer = data => {
    const p = data.profile || {};
    $('libraryFooter').innerHTML = `<div><strong>${t(p.shortName || p.name || '')}</strong><p>${t((p.roles || []).join(' × '))}</p></div><div class="footer-links"><a href="index.html">Portfolio</a><a href="research.html">Research</a><a href="media.html">Media</a>${h(p.github) ? `<a href="${t(h(p.github))}" target="_blank" rel="noopener noreferrer">GitHub</a>` : ''}</div><p class="copyright">© ${new Date().getFullYear()} ${t(p.name || '')}.</p>`;
  };

  const renderResearch = data => {
    const research = data.research || {};
    $('researchIntro').innerHTML = `<p>${t(research.intro || '')}</p>`;
    $('researchGrid').innerHTML = (research.directions || []).map((item, index) => `<article class="research-card reveal"><div class="research-card-top"><span class="research-index">R${String(index+1).padStart(2,'0')}</span><span class="research-status">${t(item.status || '')}</span></div><h3>${t(item.title || '')}</h3><p>${t(item.description || '')}</p><div class="research-tags">${(item.tags || []).map(tag => `<span>${t(tag)}</span>`).join('')}</div></article>`).join('');
    $('researchExplorations').innerHTML = (research.explorations || []).map(item => `<a class="exploration-card reveal" href="${t(h(item.url) || '#')}" ${h(item.url) ? 'target="_blank" rel="noopener noreferrer"' : ''}><div><span class="mini-label">${t(item.type || '')}</span><h3>${t(item.title || '')}</h3></div><p>${t(item.description || '')}</p><span class="text-link">Open public work ↗</span></a>`).join('');
    $('publicationNote').textContent = research.publicationNote || '';
    const publicationBlock = $('publicationBlock');
    if (publicationBlock) publicationBlock.hidden = !String(research.publicationNote || '').trim();
    C().observeReveals(document);
  };

  const drawMedia = () => {
    const settings = window.__mediaSettings || {};
    const filtered = mediaRows.filter(row => {
      const kindOk = activeKind === 'all' || row.info.kind === activeKind;
      const hay = `${row.item.title || ''} ${row.item.description || ''} ${row.info.provider || ''} ${(row.item.tags || []).join(' ')}`.toLowerCase();
      return kindOk && (!query || hay.includes(query));
    });
    if (!filtered.length) {
      $('mediaGrid').innerHTML = `<div class="media-empty"><span>NO MATCHES</span><h3>No media matched this filter.</h3><p>Try another type or search term.</p></div>`;
      return;
    }
    const lazy = Boolean(settings.lazyEmbeds);
    $('mediaGrid').innerHTML = filtered.map(({item, info}) => `<article class="media-card reveal" data-media-kind="${t(info.kind)}">${C().renderMediaPlayer(item, info, {lazyEmbeds:lazy})}<div class="media-card-body"><div class="media-meta">${settings.showProvider === false ? '<span></span>' : `<span class="media-provider">${t(info.provider)}</span>`}${item.date ? `<span>${t(item.date)}</span>` : ''}</div><h3>${t(item.title || 'Published material')}</h3>${item.description ? `<p>${t(item.description)}</p>` : ''}${item.tags?.length ? `<div class="research-tags">${item.tags.map(tag => `<span>${t(tag)}</span>`).join('')}</div>` : ''}<div class="media-card-actions"><span class="media-kind">${t(info.kind)}</span>${settings.showOpenOriginal === false || !(info.originalUrl || info.rawUrl) ? '' : `<a href="${t(info.originalUrl || info.rawUrl)}" target="_blank" rel="noopener noreferrer">Open original ↗</a>`}</div></div></article>`).join('');
    C().bindLazyMedia($('mediaGrid'));
    C().observeReveals($('mediaGrid'));
  };

  const renderMedia = data => {
    const media = data.media || {};
    window.__mediaSettings = media.settings || {};
    $('mediaIntro').textContent = media.intro || '';
    mediaRows = (media.items || []).filter(item => C().safeHttpUrl(item.url || '') || C().safeHttpUrl(item.embedUrl || '')).map(item => ({item, info:C().mediaInfo(item)}));
    if (!mediaRows.length) {
      $('mediaGrid').innerHTML = `<div class="media-empty"><span>MEDIA</span><h3>No published media is listed yet.</h3><p>Selected videos, audio and presentations will appear here as they are published.</p></div>`;
      return;
    }
    const kinds = [...new Set(mediaRows.map(row => row.info.kind))];
    const filters = $('mediaFilters');
    filters.hidden = media.settings?.showFilters === false;
    filters.innerHTML = `<button class="media-filter active" data-kind="all" type="button">All</button>${kinds.map(k => `<button class="media-filter" data-kind="${t(k)}" type="button">${t(k.charAt(0).toUpperCase()+k.slice(1))}</button>`).join('')}`;
    document.querySelectorAll('#mediaFilters .media-filter').forEach(button => button.addEventListener('click', () => {
      document.querySelectorAll('#mediaFilters .media-filter').forEach(b => b.classList.remove('active'));
      button.classList.add('active'); activeKind = button.dataset.kind; drawMedia();
    }));
    $('mediaSearch')?.addEventListener('input', e => { query = String(e.target.value || '').trim().toLowerCase(); drawMedia(); });
    drawMedia();
  };

  const boot = async () => {
    C().initTheme($('themeToggle'));
    try {
      const data = await C().loadContent('data/content.json');
      C().applyDesignSettings(data.design || {});
      const p = data.profile || {};
      $('brandMark').textContent = p.brandMark || 'AL';
      $('brandName').textContent = p.shortName || p.name || 'ASM Lemon';
      footer(data);
      const mode = document.body.dataset.libraryPage;
      const section = data.site?.sections?.[mode] || {};
      const pageTitle = mode === 'research' ? 'Research & Exploration' : 'Media & Publications';
      document.title = `${section.title || pageTitle} — ${p.shortName || p.name || 'Portfolio'}`;
      const desc = document.querySelector('meta[name="description"]');
      if (desc && section.description) desc.content = section.description;
      if (mode === 'research') renderResearch(data); else renderMedia(data);
    } catch (err) {
      console.error(err);
      const target = $('mediaGrid') || $('researchIntro'); if (target) target.innerHTML = `<div class="load-error"><h2>Content is temporarily unavailable.</h2><p>Please refresh the page or try again shortly.</p></div>`;
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
})();
