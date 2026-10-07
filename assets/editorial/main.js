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
