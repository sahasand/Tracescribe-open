// Tracescribe Research - JavaScript

/* ============================================
   Scroll State Management
   ============================================ */

const header = document.querySelector('.site-header');

function updateHeaderOnScroll() {
  const scrolled = window.scrollY > 50;
  header.classList.toggle('is-scrolled', scrolled);
}

// Listen to scroll events with passive flag for better performance
window.addEventListener('scroll', updateHeaderOnScroll, { passive: true });

// Initialize on page load
updateHeaderOnScroll();


/* ============================================
   Smooth Scroll Navigation
   ============================================ */

// Smooth scroll for all anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();

    const targetId = this.getAttribute('href');
    const target = document.querySelector(targetId);

    if (target) {
      // Calculate offset for fixed header
      const headerHeight = header.offsetHeight;
      const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });

      // Close mobile menu if open
      const navLinks = document.querySelector('.nav-links');
      if (navLinks.classList.contains('is-open')) {
        navLinks.classList.remove('is-open');
      }
    }
  });
});


/* ============================================
   Mobile Menu Toggle
   ============================================ */

const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle) {
  menuToggle.addEventListener('click', function() {
    navLinks.classList.toggle('is-open');

    // Update aria-expanded for accessibility
    const isOpen = navLinks.classList.contains('is-open');
    this.setAttribute('aria-expanded', isOpen);
  });

  // Close mobile menu when clicking outside
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.main-nav') && navLinks.classList.contains('is-open')) {
      navLinks.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Close mobile menu on escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && navLinks.classList.contains('is-open')) {
      navLinks.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });
}


/* ============================================
   Page Load Animation
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
  // Add loaded class to trigger hero animations
  setTimeout(function() {
    document.body.classList.add('loaded');
  }, 100);
});


/* ============================================
   Counter Animations
   ============================================ */

function animateCounter(element) {
  if (element.dataset.animated === 'true') return;

  const target = parseInt(element.dataset.value);
  const duration = 2000;
  const start = performance.now();
  const isPercentage = element.textContent.includes('%');
  const hasPlusSign = element.textContent.includes('+');

  function update(currentTime) {
    const elapsed = currentTime - start;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function (ease-out cubic)
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(target * eased);

    // Format the number
    let displayValue = current.toLocaleString();
    if (hasPlusSign && progress === 1) displayValue += '+';
    if (isPercentage) displayValue += '%';

    element.textContent = displayValue;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.dataset.animated = 'true';
    }
  }

  requestAnimationFrame(update);
}


/* ============================================
   3D Tilt Effect
   ============================================ */

function add3DTilt(element) {
  element.addEventListener('mousemove', function(e) {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 15;
    const rotateY = (centerX - x) / 15;

    element.style.transform = `
      perspective(1000px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      translateY(-8px)
      scale(1.02)
    `;
  });

  element.addEventListener('mouseleave', function() {
    element.style.transform = '';
  });
}

// Apply tilt to metric cards
document.querySelectorAll('.metric-item').forEach(add3DTilt);


/* ============================================
   Intersection Observer
   ============================================ */

const observerOptions = {
  threshold: 0.2,
  rootMargin: '0px 0px -10% 0px'
};

// Generic reveal observer
const revealObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe all reveal elements
document.querySelectorAll('[data-reveal]').forEach(function(el) {
  revealObserver.observe(el);
});

// Metrics counter observer
const metricsObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      const counters = entry.target.querySelectorAll('[data-counter]');
      counters.forEach(function(counter) {
        animateCounter(counter);
      });
      metricsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

const metricsSection = document.querySelector('.metrics-section');
if (metricsSection) {
  metricsObserver.observe(metricsSection);
}


/* ============================================
   Timeline Animation
   ============================================ */

const timelineTrack = document.querySelector('.timeline-track');
const timelineItems = document.querySelectorAll('.timeline-item');

if (timelineTrack) {
  const timelineObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        // Animate progress bar
        timelineTrack.classList.add('is-visible');

        // Animate nodes sequentially
        timelineItems.forEach(function(item, index) {
          setTimeout(function() {
            item.classList.add('is-visible');
          }, 400 + (index * 150));
        });

        timelineObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  timelineObserver.observe(timelineTrack);
}


/* ============================================
   Performance Optimization
   ============================================ */

// Reduced motion support
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
  // Disable all animations
  const style = document.createElement('style');
  style.textContent = `
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  `;
  document.head.appendChild(style);

  // Show all content immediately
  document.querySelectorAll('[data-reveal]').forEach(function(el) {
    el.classList.add('is-visible');
  });
}
