(function () {
  const body = document.body;
  const header = document.querySelector('.site-header');
  const hero = document.querySelector('.hero');
  const navToggle = document.querySelector('.nav-toggle');
  const siteNav = document.getElementById('site-nav');
  const navLinks = Array.from(document.querySelectorAll('.site-nav a[href^="#"]'));
  const revealItems = Array.from(document.querySelectorAll('[data-reveal]'));
  const metricItems = Array.from(document.querySelectorAll('.metric-value[data-count]'));
  const form = document.getElementById('program-form');
  const formMessage = document.getElementById('form-message');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  function updateScrollState() {
    const y = window.scrollY || 0;

    if (header) {
      header.classList.toggle('is-scrolled', y > 24);
    }

    body.style.setProperty('--scroll-shift', y.toFixed(2) + 'px');
  }

  let frameQueued = false;
  function runFrame() {
    updateScrollState();
    frameQueued = false;
  }

  function requestFrame() {
    if (frameQueued) {
      return;
    }

    frameQueued = true;
    window.requestAnimationFrame(runFrame);
  }

  function onScroll() {
    requestFrame();
  }

  function bootPageMotion() {
    if (body.classList.contains('loaded')) {
      return;
    }

    body.classList.add('loaded');
    requestFrame();
  }

  if (document.readyState === 'complete') {
    bootPageMotion();
  } else {
    window.addEventListener('load', bootPageMotion);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', requestFrame);
  window.addEventListener('orientationchange', requestFrame);

  if (navToggle && siteNav) {
    navToggle.addEventListener('click', function () {
      const isOpen = siteNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        siteNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function animateMetric(el) {
    if (el.dataset.animated === 'true') {
      return;
    }

    const target = Number(el.dataset.count || 0);
    const suffix = el.dataset.suffix || '';

    if (reducedMotion) {
      el.textContent = target.toLocaleString() + suffix;
      el.dataset.animated = 'true';
      return;
    }

    const duration = 1200;
    const start = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      el.textContent = current.toLocaleString() + suffix;

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    el.dataset.animated = 'true';
    requestAnimationFrame(step);
  }

  revealItems.forEach(function (item, index) {
    const delay = Math.min((index % 6) * 75, 375);
    item.style.setProperty('--reveal-delay', delay + 'ms');
  });

  const revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.22,
      rootMargin: '0px 0px -8% 0px'
    }
  );

  revealItems.forEach(function (item) {
    revealObserver.observe(item);
  });

  const metricObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateMetric(entry.target);
          metricObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.45
    }
  );

  metricItems.forEach(function (metric) {
    metricObserver.observe(metric);
  });

  const sectionIds = ['leadership', 'services', 'core-laboratory', 'data-strategy', 'quality', 'contact'];
  const sections = sectionIds
    .map(function (id) {
      return document.getElementById(id);
    })
    .filter(Boolean);

  const sectionObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          return;
        }

        const id = entry.target.id;
        navLinks.forEach(function (link) {
          const isMatch = link.getAttribute('href') === '#' + id;
          link.classList.toggle('nav-active', isMatch);
        });
      });
    },
    {
      rootMargin: '-34% 0px -48% 0px',
      threshold: 0.01
    }
  );

  sections.forEach(function (section) {
    sectionObserver.observe(section);
  });

  if (!reducedMotion && finePointer && hero) {
    const maxShift = 14;

    hero.addEventListener('pointermove', function (event) {
      const rect = hero.getBoundingClientRect();
      const xRatio = (event.clientX - rect.left) / rect.width - 0.5;
      const yRatio = (event.clientY - rect.top) / rect.height - 0.5;
      const mx = (xRatio * maxShift).toFixed(2) + 'px';
      const my = (yRatio * maxShift).toFixed(2) + 'px';

      hero.style.setProperty('--mouse-x', mx);
      hero.style.setProperty('--mouse-y', my);
    });

    hero.addEventListener('pointerleave', function () {
      hero.style.setProperty('--mouse-x', '0px');
      hero.style.setProperty('--mouse-y', '0px');
    });
  }

  if (!reducedMotion && finePointer) {
    const magneticButtons = Array.from(document.querySelectorAll('.btn'));

    magneticButtons.forEach(function (btn) {
      btn.addEventListener('pointermove', function (event) {
        const rect = btn.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        btn.style.setProperty('--btn-x', (x * 0.09).toFixed(2) + 'px');
        btn.style.setProperty('--btn-y', (y * 0.12).toFixed(2) + 'px');
      });

      btn.addEventListener('pointerleave', function () {
        btn.style.setProperty('--btn-x', '0px');
        btn.style.setProperty('--btn-y', '0px');
      });
    });

    const tiltCards = Array.from(
      document.querySelectorAll(
        '.metric, .leader-card, .issue-card, .commitment-card, .service-column, .timeline-track li, .region-card, .quality-shell, .contact-form'
      )
    );

    tiltCards.forEach(function (card) {
      card.classList.add('is-tilt');

      card.addEventListener('pointermove', function (event) {
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        const rx = ((0.5 - py) * 6).toFixed(2);
        const ry = ((px - 0.5) * 8).toFixed(2);

        card.style.setProperty('--rx', rx + 'deg');
        card.style.setProperty('--ry', ry + 'deg');
        card.style.setProperty('--lift', '-5px');
      });

      card.addEventListener('pointerleave', function () {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
        card.style.setProperty('--lift', '0px');
      });
    });
  }

  if (form && formMessage) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      formMessage.textContent =
        'Thank you. Our scientific leadership will review your program details and respond within 48 hours.';
      form.reset();
    });
  }
})();
