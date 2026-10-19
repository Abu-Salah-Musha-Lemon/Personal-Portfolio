(() => {
  'use strict';

  const C = () => window.PortfolioCore;
  const $ = (id) => document.getElementById(id);
  let revealObserver = null;
  let sectionObserver = null;

  const text = (value = '') => C().escapeHtml(value);
  const href = (value = '') => C().safeHref(value);

  const setText = (id, value) => { const el = $(id); if (el) el.textContent = value ?? ''; };

  const sectionHeading = (targetId, config = {}, extra = '') => {
    const target = $(targetId);
    if (!target) return;
    target.innerHTML = `<div><p class="eyebrow">${text(config.eyebrow || '')}</p><h2>${text(config.title || '')}</h2></div>${config.description ? `<p>${text(config.description)}</p>` : ''}${extra}`;
  };

  const sectionConfig = (site = {}, id, config = {}, fallbackLabel = '') => {
    if (site.autoSectionNumbers === false) return config;
    const hidden = new Set(Array.isArray(site.hiddenSections) ? site.hiddenSections : []);
    const baseOrder = Array.isArray(site.sectionOrder) && site.sectionOrder.length
      ? site.sectionOrder
      : ['home','about','experience','education','work','creative','research','media','skills','learning','contact'];
    const visible = baseOrder.filter(sectionId => sectionId !== 'home' && !hidden.has(sectionId));
    const position = visible.indexOf(id);
    const configured = String(config.eyebrow || '').replace(/^\s*\d+\s*[·.\-:]\s*/, '').trim();
    const label = configured || fallbackLabel;
    return { ...config, eyebrow: position >= 0 ? `${String(position + 1).padStart(2, '0')} · ${label}` : label };
  };

  const initHeaderBehavior = () => {
    const header = document.querySelector('.site-header');
    const menuBtn = $('menuBtn');
    const mobileMenu = $('mobileMenu');
    C().initTheme($('themeToggle'));

    const closeMenu = () => {
      if (!menuBtn || !mobileMenu) return;
      menuBtn.setAttribute('aria-expanded', 'false');
      mobileMenu.hidden = true;
      document.body.classList.remove('menu-open');
    };

    menuBtn?.addEventListener('click', () => {
      const open = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', String(!open));
      mobileMenu.hidden = open;
      document.body.classList.toggle('menu-open', !open);
    });
    window.addEventListener('resize', () => { if (window.innerWidth > 980) closeMenu(); });
    const handleHeader = () => header?.classList.toggle('scrolled', window.scrollY > 18);
    handleHeader();
    window.addEventListener('scroll', handleHeader, { passive: true });
    return closeMenu;
  };



  const applySectionLayout = (site = {}) => {
    const main = document.querySelector('main');
    if (!main) return;
    const allSections = [...main.querySelectorAll(':scope > section[id]')];
    const byId = new Map(allSections.map(section => [section.id, section]));
    const focusStrip = main.querySelector(':scope > .trust-strip');
    const hidden = new Set(Array.isArray(site.hiddenSections) ? site.hiddenSections : []);
    const requested = Array.isArray(site.sectionOrder) ? site.sectionOrder : [];
    const order = [...requested.filter(id => byId.has(id)), ...allSections.map(section => section.id).filter(id => !requested.includes(id))];

    order.forEach(id => {
      const section = byId.get(id);
      if (section) main.appendChild(section);
      if (id === 'home' && focusStrip) main.appendChild(focusStrip);
    });

    allSections.forEach(section => {
      section.hidden = hidden.has(section.id);
      section.classList.remove('section-alt');
    });
    if (focusStrip) focusStrip.hidden = hidden.has('home');

    if (site.alternateSectionBackgrounds !== false) {
      let visibleIndex = 0;
      order.forEach(id => {
        const section = byId.get(id);
        if (!section || section.hidden || id === 'home' || id === 'contact') return;
        section.classList.toggle('section-alt', visibleIndex % 2 === 1);
        visibleIndex += 1;
      });
    }
  };

  const renderNavigation = (site = {}, closeMenu = () => {}) => {
    const hidden = new Set(Array.isArray(site.hiddenSections) ? site.hiddenSections : []);
    const items = (Array.isArray(site.navigation) ? site.navigation : []).filter(item => {
      const target = String(item.target || '').trim();
      return target && !hidden.has(target) && document.getElementById(target);
    });
    const html = items.map(item => `<a href="#${text(String(item.target || '').trim())}">${text(item.label)}</a>`).join('');
    if ($('desktopNav')) $('desktopNav').innerHTML = html;
    if ($('mobileMenu')) $('mobileMenu').innerHTML = html;
    document.querySelectorAll('#mobileMenu a').forEach(link => link.addEventListener('click', closeMenu));

    if (sectionObserver) sectionObserver.disconnect();
    if ('IntersectionObserver' in window) {
      sectionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          document.querySelectorAll('#desktopNav a, #mobileMenu a').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
          });
        });
      }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
      document.querySelectorAll('main section[id]').forEach(section => sectionObserver.observe(section));
    }
  };

  const renderHero = (data = {}) => {
    const p = data.profile || {};
    const metrics = Array.isArray(data.metrics) ? data.metrics : [];
    setText('brandMark', p.brandMark || 'AL');
    setText('brandName', p.shortName || p.name || 'Portfolio');
    setText('brandSubtitle', (p.roles || []).slice(0, 2).join(' × ') || 'Developer × Designer');
    const email = p.email || data.contact?.email || '';
    const cta = $('headerCta');
    if (cta && email) cta.href = `mailto:${email}`;

    const socialLinks = [
      ['LinkedIn', p.linkedin], ['Behance', p.behance], ['YouTube', p.youtube]
    ].filter(([,u]) => href(u));
    const socialHtml = socialLinks.map(([label, url], i) => `${i ? '<span>•</span>' : ''}<a href="${text(href(url))}" target="_blank" rel="noopener noreferrer">${text(label)}</a>`).join('');
    const github = href(p.github);
    const avatar = href(p.avatar);
    const fallback = p.avatarFallback || 'assets/img/asm-logo.png';

    $('heroContent').innerHTML = `
      <div class="hero-copy reveal">
        <div class="availability"><span class="status-dot"></span>${text(p.availability || '')}</div>
        <p class="eyebrow">${text(p.eyebrow || (p.roles || []).join(' · '))}</p>
        <h1 id="heroTitle">${text(p.headline || p.name || '')}</h1>
        <p class="hero-lead">${text(p.lead || '')}</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#work">Explore selected work <span aria-hidden="true">↗</span></a>
          ${github ? `<a class="btn btn-secondary" href="${text(github)}" target="_blank" rel="noopener noreferrer">View GitHub</a>` : ''}
          ${p.cvUrl ? `<a class="btn btn-secondary btn-cv" href="${text(p.cvUrl)}" download>Download CV</a>` : ''}
        </div>
        <div class="social-row" aria-label="Social links">${socialHtml}</div>
      </div>
      <aside class="hero-card reveal delay-1" aria-label="Profile snapshot">
        <div class="profile-visual">
          <div class="avatar-ring"><img class="avatar" ${avatar ? `src="${text(avatar)}"` : `src="${text(fallback)}"`} onerror="this.onerror=null;this.src='${text(fallback)}';this.classList.add('avatar-fallback')" alt="${text(p.name || 'Profile')} profile"></div>
          <div class="profile-copy"><span class="mini-label">Based in</span><strong>${text(p.location || '')}</strong><span>${text(p.timezone || '')}</span></div>
        </div>
        <div class="metric-grid">${metrics.map(m => `<div><strong ${m.id ? `id="${text(m.id)}"` : ''}>${text(m.value || '—')}</strong><span>${text(m.label || '')}</span></div>`).join('')}</div>
        <div class="now-card"><span class="mini-label">Now</span><p>${text(p.now || '')}</p></div>
      </aside>`;
  };

  const renderFocus = (items = []) => {
    $('focusAreas').innerHTML = items.map((item, i) => `${i ? '<i></i>' : ''}<span>${text(item)}</span>`).join('');
  };

  const renderAbout = (data = {}, section = {}) => {
    const p = data.profile || {};
    $('aboutHeading').innerHTML = `<p class="eyebrow">${text(section.eyebrow || '01 · About')}</p><h2>${text(section.title || p.aboutTitle || 'About')}</h2>${section.description ? `<p>${text(section.description)}</p>` : ''}`;
    const facts = Array.isArray(data.aboutFacts) ? data.aboutFacts : [];
    $('aboutCopy').innerHTML = `<p class="large-copy">${text(p.aboutLead || '')}</p><p>${text(p.aboutBody || '')}</p><div class="about-facts">${facts.map(f => `<div><span>${text(f.label)}</span><strong>${text(f.value)}</strong></div>`).join('')}</div>`;
  };

  const renderExperience = (items = []) => {
    $('experienceList').innerHTML = items.map((item, index) => `
      <article class="timeline-item reveal" style="transition-delay:${Math.min(index * .06, .24)}s">
        <div class="timeline-period">${text(item.period)}</div>
        <div class="timeline-role"><h3>${text(item.role)}</h3>${href(item.companyUrl) ? `<a href="${text(href(item.companyUrl))}" target="_blank" rel="noopener noreferrer">${text(item.company)} ↗</a>` : `<p>${text(item.company)}</p>`}</div>
        <ul class="timeline-details">${(item.details || []).map(d => `<li>${text(d)}</li>`).join('')}</ul>
      </article>`).join('');
  };


  const renderEducation = (items = []) => {
    const target = $('educationGrid');
    if (!target) return;
    target.innerHTML = items.map((item, index) => `
      <article class="education-card reveal" style="transition-delay:${Math.min(index * .06, .18)}s">
        <span class="education-status">${text(item.status || '')}</span>
        <h3>${text(item.program || '')}</h3>
        <p>${text(item.institution || '')}</p>
      </article>`).join('');
  };

  const renderProjectFilters = (items = []) => {
    const categories = [...new Set(items.map(i => String(i.category || '').trim()).filter(Boolean))];
    $('projectFilters').innerHTML = `<button class="filter active" data-filter="all" type="button">All work</button>${categories.map(c => `<button class="filter" data-filter="${text(c)}" type="button">${text(c.charAt(0).toUpperCase() + c.slice(1))}</button>`).join('')}`;
    document.querySelectorAll('#projectFilters .filter').forEach(button => button.addEventListener('click', () => {
      document.querySelectorAll('#projectFilters .filter').forEach(b => b.classList.remove('active'));
      button.classList.add('active');
      const filter = button.dataset.filter;
      document.querySelectorAll('#projectGrid .project-card').forEach(card => card.classList.toggle('hidden', filter !== 'all' && card.dataset.category !== filter));
    }));
  };

  const renderProjects = (items = []) => {
    $('projectGrid').innerHTML = items.map((item, index) => `
      <article class="project-card reveal" data-category="${text(item.category || '')}" data-accent="${text(item.accent || 'violet')}" style="transition-delay:${Math.min(index * .05, .25)}s">
        ${item.image ? `<div class="project-cover"><img src="${text(item.image)}" alt="${text(item.title || '')} preview" loading="lazy" width="640" height="360" onerror="this.parentElement.remove()"></div>` : ''}
        <div class="project-top"><div><div class="project-type">${text(item.eyebrow || '')}</div><h3>${text(item.title || '')}</h3></div><span class="project-number">${String(index + 1).padStart(2, '0')}</span></div>
        <p>${text(item.description || '')}</p>
        <div class="tech-list">${(item.stack || []).map(t => `<span class="tech">${text(t)}</span>`).join('')}</div>
        <div class="project-links">
          ${href(item.demo) ? `<a href="${text(href(item.demo))}" target="_blank" rel="noopener noreferrer">Live preview ↗</a>` : ''}
          ${(item.caseStudyData?.sections?.length && item.slug) ? `<a class="case-link" href="project.html?project=${encodeURIComponent(item.slug)}">Case study →</a>` : (C().safeLocalHref(item.caseStudy || '') ? `<a class="case-link" href="${text(C().safeLocalHref(item.caseStudy))}">Case study →</a>` : '')}
          ${href(item.code) ? `<a href="${text(href(item.code))}" target="_blank" rel="noopener noreferrer">Source code ↗</a>` : ''}
        </div>
      </article>`).join('');
    renderProjectFilters(items);
  };

  const renderCreative = (items = []) => {
    $('creativeGrid').innerHTML = items.map((item, index) => `
      <a class="creative-card reveal${item.image ? ' has-image' : ''}" href="${text(href(item.url) || '#')}" ${href(item.url) ? 'target="_blank" rel="noopener noreferrer"' : ''} style="transition-delay:${Math.min(index * .06, .2)}s">
        ${item.image ? `<div class="creative-thumb"><img src="${text(item.image)}" alt="${text(item.title || '')}" loading="lazy" onerror="this.parentElement.remove()"></div>` : `<div class="creative-icon">${String(index + 1).padStart(2, '0')}</div>`}<div class="creative-body"><span>${text(item.type || '')}</span><h3>${text(item.title || '')}</h3></div>
      </a>`).join('');
  };

  const renderResearch = (research = {}) => {
    $('researchIntro').innerHTML = research.intro ? `<p>${text(research.intro)}</p>` : '';
    $('researchGrid').innerHTML = (research.directions || []).map((item, index) => `
      <article class="research-card reveal" style="transition-delay:${Math.min(index * .06, .18)}s"><div class="research-card-top"><span class="research-index">R${String(index + 1).padStart(2, '0')}</span><span class="research-status">${text(item.status || '')}</span></div><h3>${text(item.title || '')}</h3><p>${text(item.description || '')}</p><div class="research-tags">${(item.tags || []).map(tag => `<span>${text(tag)}</span>`).join('')}</div></article>`).join('');
    $('researchExplorations').innerHTML = (research.explorations || []).map(item => `
      <a class="exploration-card reveal" href="${text(href(item.url) || '#')}" ${href(item.url) ? 'target="_blank" rel="noopener noreferrer"' : ''}><div><span class="mini-label">${text(item.type || '')}</span><h3>${text(item.title || '')}</h3></div><p>${text(item.description || '')}</p><span class="text-link">View public experiment ↗</span></a>`).join('');
    setText('publicationNote', research.publicationNote || '');
    const publicationBlock = $('publicationBlock');
    if (publicationBlock) publicationBlock.hidden = !String(research.publicationNote || '').trim();
  };

  const renderMedia = (media = {}) => {
    setText('mediaIntro', media.intro || '');
    const settings = media.settings || {};
    const validItems = (media.items || []).filter(item => C().safeHttpUrl(item.url || '') || C().safeHttpUrl(item.embedUrl || ''));
    const mapped = validItems.map(item => ({ item, info: C().mediaInfo(item) }));
    const kinds = [...new Set(mapped.map(x => x.info.kind).filter(Boolean))];
    const filters = $('mediaFilters');
    if (filters) {
      filters.hidden = settings.showFilters === false;
      filters.innerHTML = `<button class="media-filter active" data-media-filter="all" type="button">All</button>${kinds.map(k => `<button class="media-filter" data-media-filter="${text(k)}" type="button">${text(k.charAt(0).toUpperCase() + k.slice(1))}</button>`).join('')}`;
    }

    if (!mapped.length) {
      $('mediaGrid').innerHTML = `<div class="media-empty"><span>MEDIA</span><h3>No published media is listed yet.</h3><p>Selected videos, audio and presentations will appear here as they are published.</p></div>`;
      return;
    }

    $('mediaGrid').innerHTML = mapped.map(({item, info}, index) => `
      <article class="media-card reveal" data-media-kind="${text(info.kind)}" style="transition-delay:${Math.min(index * .05, .25)}s">
        ${C().renderMediaPlayer(item, info, { lazyEmbeds: Boolean(settings.lazyEmbeds) })}
        <div class="media-card-body"><div class="media-meta">${settings.showProvider === false ? '<span></span>' : `<span class="media-provider">${text(info.provider)}</span>`}${item.date ? `<span>${text(item.date)}</span>` : ''}</div><h3>${text(item.title || 'Published material')}</h3>${item.description ? `<p>${text(item.description)}</p>` : ''}${item.tags?.length ? `<div class="research-tags">${item.tags.map(tag => `<span>${text(tag)}</span>`).join('')}</div>` : ''}<div class="media-card-actions"><span class="media-kind">${text(info.kind)}</span>${settings.showOpenOriginal === false || !(info.originalUrl || info.rawUrl) ? '' : `<a href="${text(info.originalUrl || info.rawUrl)}" target="_blank" rel="noopener noreferrer">Open original ↗</a>`}</div></div>
      </article>`).join('');

    document.querySelectorAll('#mediaFilters .media-filter').forEach(button => button.addEventListener('click', () => {
      document.querySelectorAll('#mediaFilters .media-filter').forEach(b => b.classList.remove('active'));
      button.classList.add('active');
      const filter = button.dataset.mediaFilter;
      document.querySelectorAll('#mediaGrid .media-card').forEach(card => card.classList.toggle('hidden', filter !== 'all' && card.dataset.mediaKind !== filter));
    }));
    C().bindLazyMedia($('mediaGrid'));
  };

  const renderSkills = (items = []) => {
    $('skillsGrid').innerHTML = items.map((group, index) => `<article class="skill-group reveal" style="transition-delay:${Math.min(index * .06, .2)}s"><h3>${text(group.title || '')}</h3><div class="skill-cloud">${(group.items || []).map(skill => `<span class="skill-chip">${text(skill)}</span>`).join('')}</div></article>`).join('');
  };

  const renderCerts = (items = []) => {
    $('certList').innerHTML = items.map((item, index) => `<div class="cert-item"><span class="cert-number">${String(index + 1).padStart(2, '0')}</span><p>${text(typeof item === 'string' ? item : item.title || '')}</p></div>`).join('');
  };

  const showToast = (message) => {
    const toast = $('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    window.setTimeout(() => toast.classList.remove('show'), 1800);
  };

  const renderContact = (contact = {}, profile = {}, section = {}) => {
    const email = contact.email || profile.email || '';
    const links = contact.links || [];
    const headline = contact.headline || section.title || 'Let’s work together.';
    const description = contact.description || section.description || '';
    $('contactContent').innerHTML = `<div class="contact-card reveal"><div><p class="eyebrow">${text(section.eyebrow || 'Contact')}</p><h2>${text(headline)}</h2><p>${text(description)}</p></div><div class="contact-actions">${email ? `<a class="btn btn-light" href="mailto:${text(email)}">Send email ↗</a>${profile.cvUrl ? `<a class="btn btn-ghost-light" href="${text(profile.cvUrl)}" download>Download CV</a>` : ''}<button class="btn btn-ghost-light" id="copyEmail" type="button" data-email="${text(email)}">Copy email</button>` : ''}</div><div class="contact-meta">${email ? `<a href="mailto:${text(email)}">${text(email)}</a>` : ''}<span>${text(contact.location || profile.location || '')}</span></div><div class="footer-links contact-links">${links.filter(l => href(l.url)).map(l => `<a href="${text(href(l.url))}" target="_blank" rel="noopener noreferrer">${text(l.label)}</a>`).join('')}</div></div>`;
    $('copyEmail')?.addEventListener('click', async e => {
      const value = e.currentTarget.dataset.email || '';
      try { await navigator.clipboard.writeText(value); showToast('Email copied to clipboard'); }
      catch { window.location.href = `mailto:${value}`; }
    });
  };

  const renderFooter = (data = {}) => {
    const p = data.profile || {};
    const c = data.contact || {};
    const links = (c.links || []).filter(l => href(l.url));
    $('footerContent').innerHTML = `<div><strong>${text(p.shortName || p.name || '')}</strong><p>${text((p.roles || []).join(' × '))}</p></div><div class="footer-links"><a href="#top">Back to top ↑</a><a href="#research">Research</a><a href="media.html">Media library</a>${links.slice(0,3).map(l => `<a href="${text(href(l.url))}" target="_blank" rel="noopener noreferrer">${text(l.label)}</a>`).join('')}</div><p class="copyright">© <span id="year">${new Date().getFullYear()}</span> ${text(data.site?.copyrightName || p.name || '')}.</p>`;
  };

  const loadGithubStats = async (apiUrl) => {
    if (!C().safeHttpUrl(apiUrl)) return;
    try {
      const response = await fetch(apiUrl, { headers: { Accept: 'application/vnd.github+json' } });
      if (!response.ok) return;
      const g = await response.json();
      if (Number.isFinite(g.public_repos) && $('repoCount')) $('repoCount').textContent = g.public_repos;
      if (Number.isFinite(g.followers) && $('followerCount')) $('followerCount').textContent = g.followers;
    } catch { /* static fallbacks remain */ }
  };

  const renderMeta = (data = {}) => {
    const site = data.site || {};
    const profile = data.profile || {};
    if (site.title) document.title = site.title;
    const description = document.querySelector('meta[name="description"]');
    if (description && site.description) description.content = site.description;
    const ogTitle = document.querySelector('meta[property="og:title"]'); if (ogTitle) ogTitle.content = site.title || document.title;
    const ogDesc = document.querySelector('meta[property="og:description"]'); if (ogDesc) ogDesc.content = site.description || '';
    const theme = document.querySelector('meta[name="theme-color"]'); if (theme && site.themeColor && !data.design?.palette) theme.content = site.themeColor;

    const schema = {
      '@context':'https://schema.org', '@type':'Person', name:profile.name || '', alternateName:profile.shortName || '',
      jobTitle:(profile.roles || []).join(', '), email: profile.email ? `mailto:${profile.email}` : undefined,
      address: profile.location ? {'@type':'PostalAddress','addressLocality':profile.location} : undefined,
      sameAs:[profile.github, profile.linkedin, profile.behance, profile.youtube].filter(Boolean)
    };
    const script = document.createElement('script'); script.type = 'application/ld+json'; script.textContent = JSON.stringify(schema); document.head.appendChild(script);
  };

  const renderAll = (data, closeMenu) => {
    renderMeta(data);
    applySectionLayout(data.site || {});
    renderNavigation(data.site || {}, closeMenu);
    renderHero(data);
    renderFocus(data.site?.focusAreas || []);
    const site = data.site || {};
    const sections = site.sections || {};
    const aboutSection = sectionConfig(site, 'about', sections.about || {}, 'About');
    const experienceSection = sectionConfig(site, 'experience', sections.experience || {}, 'Experience');
    const educationSection = sectionConfig(site, 'education', sections.education || {}, 'Education');
    const workSection = sectionConfig(site, 'work', sections.work || {}, 'Selected work');
    const creativeSection = sectionConfig(site, 'creative', sections.creative || {}, 'Creative practice');
    const researchSection = sectionConfig(site, 'research', sections.research || {}, 'Research & exploration');
    const mediaSection = sectionConfig(site, 'media', sections.media || {}, 'Media & publications');
    const skillsSection = sectionConfig(site, 'skills', sections.skills || {}, 'Capabilities');
    const learningSection = sectionConfig(site, 'learning', sections.learning || {}, 'Learning');
    const contactSection = sectionConfig(site, 'contact', sections.contact || {}, 'Contact');

    renderAbout(data, aboutSection);
    sectionHeading('experienceHeading', experienceSection);
    sectionHeading('educationHeading', educationSection);
    sectionHeading('workHeading', workSection, `<a class="text-link" href="${text(href(data.profile?.github) || '#')}" target="_blank" rel="noopener noreferrer">Browse GitHub ↗</a>`);
    sectionHeading('creativeHeading', creativeSection, href(data.profile?.behance) ? `<a class="text-link" href="${text(href(data.profile.behance))}" target="_blank" rel="noopener noreferrer">View Behance ↗</a>` : '');
    sectionHeading('researchHeading', researchSection, `<a class="text-link" href="research.html">Research page →</a>`);
    sectionHeading('mediaHeading', mediaSection);
    sectionHeading('skillsHeading', skillsSection);
    $('learningHeading').innerHTML = `<p class="eyebrow">${text(learningSection.eyebrow || '')}</p><h2>${text(learningSection.title || '')}</h2>${learningSection.description ? `<p>${text(learningSection.description)}</p>` : ''}`;

    renderExperience(data.experience || []);
    renderEducation(data.education || []);
    renderProjects(data.projects || []);
    renderCreative(data.creative || []);
    renderResearch(data.research || {});
    renderMedia(data.media || {});
    renderSkills(data.skills || []);
    renderCerts(data.certifications || []);
    renderContact(data.contact || {}, data.profile || {}, contactSection);
    renderFooter(data);

    revealObserver?.disconnect?.();
    revealObserver = C().observeReveals(document);
    if (data.profile?.githubApi) loadGithubStats(data.profile.githubApi);
  };

  const showFatalError = (error) => {
    console.error('Portfolio failed to load:', error);
    const hero = $('heroContent');
    if (hero) hero.innerHTML = `<div class="load-error"><p class="eyebrow">Unable to load</p><h1>The portfolio is temporarily unavailable.</h1><p>Please refresh the page or try again shortly.</p></div>`;
  };

  const boot = async () => {
    const closeMenu = initHeaderBehavior();
    try {
      const data = await C().loadContent('data/content.json');
      C().applyDesignSettings(data.design || {});
      renderAll(data, closeMenu);
    } catch (error) { showFatalError(error); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
