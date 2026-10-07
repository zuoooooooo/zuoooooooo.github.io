(() => {
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
  // Turn an inert copy of the current view above the destination section.
  // Reduced motion keeps ordinary anchor navigation.
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let activeTransition = null;
  let navigationVersion = 0;
  document.addEventListener('click', async (event) => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey ||
        event.ctrlKey || event.shiftKey || event.altKey || link.hasAttribute('download') ||
        (link.target && link.target !== '_self')) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname ||
        url.search !== location.search || !url.hash || reducedMotion.matches) return;
    const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (target?.classList.contains('photo-series')) {
      event.preventDefault();
      if (location.hash !== url.hash) history.pushState(null, '', url.hash);
      const offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      window.scrollTo({ top: Math.max(0, target.getBoundingClientRect().top + scrollY - offset), behavior: 'smooth' });
      target.querySelector('h3')?.focus({ preventScroll: true });
      return;
    }
    if (!target?.classList.contains('page-section')) return;
    event.preventDefault();
    closeMenu();
    const version = ++navigationVersion;
    if (activeTransition) {
      activeTransition.skipTransition();
      await activeTransition.finished.catch(() => {});
      if (version !== navigationVersion) return;
    }
    const root = document.documentElement;
    const offset = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
    const destination = Math.max(0, target.getBoundingClientRect().top + scrollY - offset);
    const heading = target.querySelector('h2');
    const update = () => {
      target.classList.add('transition-arrival');
      target.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
      if (location.hash !== url.hash) history.pushState(null, '', url.hash);
      window.scrollTo({ top: destination, behavior: 'auto' });
    };
    if (Math.abs(destination - scrollY) < 12) {
      if (location.hash !== url.hash) history.pushState(null, '', url.hash);
      heading?.focus({ preventScroll: true });
      return;
    }
    root.dataset.pageTurn = destination > scrollY ? 'forward' : 'backward';
    let overlay = null;
    try {
      const main = document.querySelector('main');
      overlay = document.createElement('div');
      overlay.className = 'page-turn-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.inert = true;
      const sheet = document.createElement('div');
      sheet.className = 'page-turn-sheet';
      const copy = main.cloneNode(true);
      copy.className = 'page-turn-content';
      copy.removeAttribute('id');
      copy.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
      copy.querySelectorAll('dialog').forEach((element) => element.remove());
      copy.style.transform = `translateY(${main.getBoundingClientRect().top}px)`;
      sheet.append(copy);
      overlay.append(sheet);
      document.body.append(overlay);
      const forward = root.dataset.pageTurn === 'forward';
      sheet.style.transformOrigin = forward ? 'left center' : 'right center';
      update();
      const animation = sheet.animate([
        { transform: 'perspective(1800px) rotateY(0deg)', opacity: 1, filter: 'brightness(1)' },
        { opacity: 1, offset: 0.7 },
        { transform: `perspective(1800px) rotateY(${forward ? -105 : 105}deg)`, opacity: 0, filter: 'brightness(.85)' }
      ], { duration: 780, easing: 'cubic-bezier(.3,.05,.2,1)', fill: 'both' });
      activeTransition = {
        skipTransition: () => animation.cancel(),
        finished: animation.finished.catch(() => {}).finally(() => overlay.remove())
      };
      await activeTransition.finished;
    } catch {
      update();
    } finally {
      overlay?.remove();
      target.classList.remove('transition-arrival');
      if (version === navigationVersion) {
        activeTransition = null;
        heading?.focus({ preventScroll: true });
        window.scrollTo({ top: destination, behavior: 'auto' });
        delete root.dataset.pageTurn;
      }
    }
  });
  const sectionLinks = Array.from(document.querySelectorAll('.site-nav a[href*="#"]'));
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries.find((entry) => entry.isIntersecting);
      if (!visible) return;
      sectionLinks.forEach((link) => {
        if (link.hash === `#${visible.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-105px 0px -55% 0px', threshold: 0 });
    sectionLinks.forEach((link) => {
      const section = document.querySelector(link.hash);
      if (section) sectionObserver.observe(section);
    });
  }
  const photos = Array.from(document.querySelectorAll('.photo-open'));
  const lightbox = document.querySelector('.photo-lightbox');
  if (lightbox && typeof lightbox.showModal === 'function') {
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
