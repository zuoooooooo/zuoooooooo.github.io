(() => {
  const root = document.documentElement;
  const themeToggle = document.querySelector('.theme-toggle');
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  let manualTheme = false;
  try { manualTheme = ['light', 'dark'].includes(localStorage.getItem('yhzuo-theme')); } catch {}
  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    const dark = theme === 'dark';
    const label = dark ? 'Switch to light mode' : 'Switch to dark mode';
    themeToggle?.setAttribute('aria-label', label);
    themeToggle?.setAttribute('title', label);
    themeToggle?.setAttribute('aria-pressed', String(dark));
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#1b1e1a' : '#f5f2e9');
  };
  applyTheme(root.dataset.theme || (systemTheme.matches ? 'dark' : 'light'));
  themeToggle?.addEventListener('click', () => {
    const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    manualTheme = true;
    applyTheme(theme);
    try { localStorage.setItem('yhzuo-theme', theme); } catch {}
  });
  systemTheme.addEventListener('change', (event) => {
    if (!manualTheme) applyTheme(event.matches ? 'dark' : 'light');
  });
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
  const closeMenu = () => {
    toggle?.setAttribute('aria-expanded', 'false');
    nav?.classList.remove('is-open');
  };
  toggle?.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(isOpen));
    nav.classList.toggle('is-open', isOpen);
  });
  nav?.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      toggle.focus();
    }
  });
  const sectionLinks = Array.from(document.querySelectorAll('.site-nav a[href*="#"]'));
  const pageSections = Array.from(document.querySelectorAll('main .page-section'));
  const setActiveSection = (id) => {
    sectionLinks.forEach((link) => {
      if (link.hash === `#${id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  let sectionFrame = 0;
  // Use one line below the sticky header, rather than a partial observer batch.
  const syncActiveSection = () => {
    sectionFrame = 0;
    if (root.dataset.sectionTransition) return;
    const activationLine = (parseFloat(getComputedStyle(root).scrollPaddingTop) || 0) + 2;
    let active = pageSections[0];
    for (const section of pageSections) {
      if (section.getBoundingClientRect().top > activationLine) break;
      active = section;
    }
    setActiveSection(active?.id);
  };
  const scheduleActiveSection = () => {
    if (!sectionFrame) sectionFrame = requestAnimationFrame(syncActiveSection);
  };
  window.addEventListener('scroll', scheduleActiveSection, { passive: true });
  window.addEventListener('resize', scheduleActiveSection);
  window.addEventListener('hashchange', scheduleActiveSection);
  window.addEventListener('load', scheduleActiveSection);
  document.fonts?.ready.then(scheduleActiveSection);
  syncActiveSection();
  // A short crossfade connects chapters; masked titles lead the arrival.
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const main = document.querySelector('main');
  const navigationAnimations = new Set();
  let navigationVersion = 0;
  const cancelNavigation = () => {
    navigationVersion++;
    navigationAnimations.forEach((animation) => animation.cancel());
    navigationAnimations.clear();
    delete root.dataset.sectionTransition;
    scheduleActiveSection();
  };
  const playNavigation = (element, frames, options) => {
    const animation = element.animate(frames, options);
    navigationAnimations.add(animation);
    animation.finished.catch(() => {});
    return animation;
  };
  // Visitors can interrupt a transition and continue scrolling immediately.
  window.addEventListener('wheel', cancelNavigation, { passive: true });
  window.addEventListener('touchstart', cancelNavigation, { passive: true });
  window.addEventListener('popstate', cancelNavigation);
  document.addEventListener('keydown', (event) => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) cancelNavigation();
  });
  document.addEventListener('click', async (event) => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey ||
        event.ctrlKey || event.shiftKey || event.altKey || link.hasAttribute('download') ||
        (link.target && link.target !== '_self')) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname ||
        url.search !== location.search || !url.hash) return;
    let target;
    try { target = document.getElementById(decodeURIComponent(url.hash.slice(1))); }
    catch { return; }
    if (!target?.matches('.page-section, .photo-series')) return;
    event.preventDefault();
    cancelNavigation();
    closeMenu();
    setActiveSection(target.closest('.page-section')?.id);
    const version = navigationVersion;
    const heading = target.querySelector('h2, h3');
    const offset = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
    const destination = Math.max(0, target.getBoundingClientRect().top + scrollY - offset);
    const update = () => {
      target.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
      if (location.hash !== url.hash) history.pushState(null, '', url.hash);
      window.scrollTo({ top: destination, behavior: 'instant' });
    };
    if (target.classList.contains('photo-series') && !reducedMotion.matches) {
      if (location.hash !== url.hash) history.pushState(null, '', url.hash);
      window.scrollTo({ top: destination, behavior: 'smooth' });
      heading?.focus({ preventScroll: true });
      return;
    }
    if (reducedMotion.matches || !main?.animate || Math.abs(destination - scrollY) < 12) {
      update();
      heading?.focus({ preventScroll: true });
      return;
    }
    try {
      root.dataset.sectionTransition = 'leaving';
      const outgoing = playNavigation(main, [{ opacity: 1 }, { opacity: 0 }], {
        duration: 140, easing: 'ease-in', fill: 'forwards'
      });
      await outgoing.finished.catch(() => {});
      if (version !== navigationVersion) return;
      update();
      root.dataset.sectionTransition = 'entering';
      const incoming = playNavigation(main, [{ opacity: 0 }, { opacity: 1 }], {
        duration: 220, easing: 'ease-out', fill: 'both'
      });
      outgoing.cancel();
      const arrivals = [incoming];
      if (heading) arrivals.push(playNavigation(heading, [
        { opacity: 0, transform: 'translateY(18px)', clipPath: 'inset(0 0 100% 0)' },
        { opacity: 1, transform: 'translateY(0)', clipPath: 'inset(0 0 0 0)' }
      ], { duration: 520, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' }));
      const details = Array.from(target.querySelectorAll('.prose > p, .research-item, .teaching-materials > div, .photo-series-index, .photo-series-heading, .contact-email, .contact-section > p'))
        .filter((element) => {
          const bounds = element.getBoundingClientRect();
          return bounds.top < innerHeight && bounds.bottom > offset;
        }).slice(0, 5);
      details.forEach((element, index) => arrivals.push(playNavigation(element, [
        { opacity: 0, transform: 'translateY(14px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 420, delay: 60 + index * 45, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' })));
      await Promise.all(arrivals.map((animation) => animation.finished.catch(() => {})));
    } catch {
      if (version === navigationVersion) update();
    } finally {
      if (version === navigationVersion) {
        navigationAnimations.forEach((animation) => animation.cancel());
        navigationAnimations.clear();
        delete root.dataset.sectionTransition;
        syncActiveSection();
        heading?.focus({ preventScroll: true });
      }
    }
  });
  const photos = Array.from(document.querySelectorAll('.photo-open'));
  const lightbox = document.querySelector('.photo-lightbox');
  if (lightbox && typeof lightbox.showModal === 'function') {
    const viewer = lightbox.querySelector('.lightbox-content');
    const fullscreenButton = lightbox.querySelector('.photo-fullscreen');
    const isFullscreen = () => document.fullscreenElement === viewer || lightbox.classList.contains('is-expanded');
    const updateFullscreenButton = () => {
      const active = isFullscreen();
      const label = active ? 'Exit fullscreen' : 'Fullscreen';
      fullscreenButton.querySelector('span').textContent = label;
      fullscreenButton.setAttribute('aria-label', active ? 'Exit fullscreen' : 'View photograph fullscreen');
      fullscreenButton.setAttribute('aria-pressed', String(active));
    };
    const exitFullscreen = async () => {
      lightbox.classList.remove('is-expanded');
      if (document.fullscreenElement === viewer) {
        try { await document.exitFullscreen(); } catch {}
      }
      updateFullscreenButton();
    };
    fullscreenButton.addEventListener('click', async () => {
      if (isFullscreen()) { await exitFullscreen(); return; }
      try {
        if (!document.fullscreenEnabled || !viewer.requestFullscreen) throw new Error('Fullscreen unavailable');
        await viewer.requestFullscreen();
      } catch {
        // Browsers without native fullscreen still offer an edge-to-edge viewer.
        if (lightbox.open) lightbox.classList.add('is-expanded');
      }
      updateFullscreenButton();
    });
    document.addEventListener('fullscreenchange', updateFullscreenButton);
    lightbox.addEventListener('cancel', (event) => {
      if (isFullscreen()) { event.preventDefault(); exitFullscreen(); }
    });
    let currentPhoto = 0;
    const showPhoto = (index) => {
      currentPhoto = (index + photos.length) % photos.length;
      const photo = photos[currentPhoto].dataset;
      const image = lightbox.querySelector('.lightbox-image');
      image.src = photo.photoSrc;
      image.alt = photo.photoAlt;
      lightbox.querySelector('.lightbox-caption').textContent = photo.photoCaption;
      lightbox.querySelector('.photo-counter').textContent = `${currentPhoto + 1} / ${photos.length}`;
    };
    photos.forEach((button, index) => button.addEventListener('click', () => {
      showPhoto(index);
      lightbox.showModal();
      document.body.classList.add('gallery-open');
    }));
    lightbox.querySelector('.photo-close').addEventListener('click', () => lightbox.close());
    lightbox.querySelector('.photo-prev').addEventListener('click', () => showPhoto(currentPhoto - 1));
    lightbox.querySelector('.photo-next').addEventListener('click', () => showPhoto(currentPhoto + 1));
    lightbox.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        showPhoto(currentPhoto + (event.key === 'ArrowRight' ? 1 : -1));
      }
    });
    lightbox.addEventListener('close', () => {
      exitFullscreen();
      document.body.classList.remove('gallery-open');
      photos[currentPhoto].focus();
    });
    lightbox.addEventListener('click', (event) => {
      const bounds = lightbox.getBoundingClientRect();
      if (event.target === lightbox && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) lightbox.close();
    });
  }
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.section-heading, .research-item, .teaching-panel, .contact-grid').forEach((element) => {
      element.classList.add('reveal');
      observer.observe(element);
    });
  }
})();
