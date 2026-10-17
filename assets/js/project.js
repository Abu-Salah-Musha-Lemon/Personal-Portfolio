(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const C = () => window.PortfolioCore;
  const t = v => C().escapeHtml(v ?? '');
  const h = v => C().safeHref(v || '');

  const notFound = (message = 'Project not found.') => {
    $('projectPage').innerHTML = `<section class="case-hero"><div class="container"><div class="case-breadcrumb"><a href="index.html">Portfolio</a> / Project</div><h1>${t(message)}</h1><p class="case-lead">Check the project link or return to the selected work section.</p><div class="case-actions"><a class="btn btn-primary" href="index.html#work">Back to selected work</a></div></div></section>`;
  };

  const render = data => {
    C().initTheme($('themeToggle'));
    const p = data.profile || {};
    $('brandMark').textContent = p.brandMark || 'AL';
    $('brandName').textContent = p.shortName || p.name || 'ASM Lemon';

    const slug = new URLSearchParams(location.search).get('project') || '';
    const projects = data.projects || [];
    const index = projects.findIndex(item => item.slug === slug);
    if (index < 0) return notFound();
    const project = projects[index];
    const cs = project.caseStudyData || {};
    if (!cs.sections?.length) return notFound('No detailed case study is available for this project yet.');

    document.title = `${project.title} — Case Study | ${p.shortName || p.name || 'Portfolio'}`;
    const meta = document.querySelector('meta[name="description"]'); if (meta) meta.content = cs.lead || project.description || '';
    const next = projects.slice(index + 1).concat(projects.slice(0, index)).find(item => item.caseStudyData?.sections?.length);

    const actionHtml = [
      h(project.demo) ? `<a class="btn btn-primary" href="${t(h(project.demo))}" target="_blank" rel="noopener noreferrer">Open live project ↗</a>` : '',
      h(project.code) ? `<a class="btn btn-secondary" href="${t(h(project.code))}" target="_blank" rel="noopener noreferrer">View source code ↗</a>` : ''
    ].join('');

    const sections = cs.sections.map(section => `<section class="case-section"><div class="container case-layout"><div><span class="case-kicker">${t(section.kicker)}</span><h2>${t(section.title)}</h2></div><div class="case-body">${(section.paragraphs || []).map(p => `<p>${t(p)}</p>`).join('')}${section.cards?.length ? `<div class="case-list">${section.cards.map(card => `<article><h3>${t(card.title)}</h3><p>${t(card.description)}</p></article>`).join('')}</div>` : ''}${section.stack?.length ? `<div class="case-stack">${section.stack.map(x => `<span>${t(x)}</span>`).join('')}</div>` : ''}</div></div></section>`).join('');

    $('projectPage').innerHTML = `<section class="case-hero"><div class="container"><div class="case-breadcrumb"><a href="index.html">Portfolio</a> / <a href="index.html#work">Selected work</a> / ${t(project.title)}</div><div class="case-hero-grid"><div><p class="eyebrow">${t(project.eyebrow || '')}</p><h1>${t(project.title)}</h1><p class="case-lead">${t(cs.lead || project.description || '')}</p><div class="case-actions">${actionHtml}</div></div><div class="case-meta"><div><span>Role</span><strong>${t(cs.role || '')}</strong></div><div><span>Year</span><strong>${t(cs.year || '')}</strong></div><div><span>Status</span><strong>${t(cs.status || '')}</strong></div><div><span>Focus</span><strong>${t(cs.focus || '')}</strong></div></div></div></div></section>${sections}${next ? `<section class="case-next"><div class="container"><a class="case-next-card" href="project.html?project=${encodeURIComponent(next.slug)}"><div><span>Next case study</span><h2>${t(next.title)}</h2></div><strong>View project →</strong></a></div></section>` : ''}`;

    $('projectFooter').innerHTML = `<div><strong>${t(p.shortName || p.name || '')}</strong><p>${t((p.roles || []).join(' × '))}</p></div><div class="footer-links"><a href="index.html">Portfolio</a><a href="index.html#research">Research</a>${h(p.github) ? `<a href="${t(h(p.github))}" target="_blank" rel="noopener noreferrer">GitHub</a>` : ''}</div><p class="copyright">© ${new Date().getFullYear()} ${t(p.name || '')}.</p>`;
    C().observeReveals(document);
  };

  const boot = async () => {
    try { const data = await C().loadContent('data/content.json'); C().applyDesignSettings(data.design || {}); render(data); }
    catch (err) { console.error(err); notFound('The case-study data could not be loaded.'); }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
})();
