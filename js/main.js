/**
 * LEZZFLOW. — Hyperlocal Commerce Platform
 * SIH 2026 Project by Team legezt
 * Interactive Features & Motion Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileMenu();
  initScrollAnimations();
  initStatCounters();
  initWaitlist();
  initCardSpotlight();
  initSmoothScroll();
});

/* --------------------------------------------------------------------------
   01. Sticky Navbar & Active Section Tracking
   -------------------------------------------------------------------------- */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const handleScroll = () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // Scrollspy for active nav link
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const updateActiveLink = () => {
    const scrollPosition = window.scrollY + 120;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPosition >= top && scrollPosition < top + height) {
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  };

  window.addEventListener('scroll', updateActiveLink, { passive: true });
}

/* --------------------------------------------------------------------------
   02. Mobile Navigation Menu
   -------------------------------------------------------------------------- */
function initMobileMenu() {
  const toggleBtn = document.getElementById('nav-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (!toggleBtn || !mobileMenu) return;

  const toggleMenu = () => {
    const isOpen = mobileMenu.classList.contains('open');
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  const openMenu = () => {
    mobileMenu.classList.add('open');
    toggleBtn.classList.add('open');
    toggleBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  const closeMenu = () => {
    mobileMenu.classList.remove('open');
    toggleBtn.classList.remove('open');
    toggleBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  toggleBtn.addEventListener('click', toggleMenu);

  // Close when clicking links
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
      closeMenu();
    }
  });

  // Close on resize > 900px
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900 && mobileMenu.classList.contains('open')) {
      closeMenu();
    }
  });
}

/* --------------------------------------------------------------------------
   03. Reveal on Scroll (IntersectionObserver)
   -------------------------------------------------------------------------- */
function initScrollAnimations() {
  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealElements = document.querySelectorAll('.reveal-item');

  if (isReduced) {
    revealElements.forEach(el => el.classList.add('is-revealed'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          obs.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    }
  );

  revealElements.forEach(el => observer.observe(el));
}

/* --------------------------------------------------------------------------
   04. Animated Stat Counters
   -------------------------------------------------------------------------- */
function initStatCounters() {
  const statNumbers = document.querySelectorAll('.stat-number');
  if (!statNumbers.length) return;

  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const animateCount = (el) => {
    const target = parseFloat(el.getAttribute('data-count'));
    const suffix = el.getAttribute('data-suffix') || '';
    const prefix = el.getAttribute('data-prefix') || '';
    const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);

    if (isReduced) {
      el.textContent = `${prefix}${target.toLocaleString()}${suffix}`;
      return;
    }

    const duration = 2000;
    const startTime = performance.now();

    const updateValue = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic easing
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = target * easeOut;

      const formatted = decimals > 0
        ? currentValue.toFixed(decimals)
        : Math.floor(currentValue).toLocaleString();

      el.textContent = `${prefix}${formatted}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(updateValue);
      } else {
        const finalFormatted = decimals > 0
          ? target.toFixed(decimals)
          : target.toLocaleString();
        el.textContent = `${prefix}${finalFormatted}${suffix}`;
      }
    };

    requestAnimationFrame(updateValue);
  };

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.25 }
  );

  statNumbers.forEach(num => observer.observe(num));
}

/* --------------------------------------------------------------------------
   05. Waitlist System with LocalStorage & Confetti
   -------------------------------------------------------------------------- */
function initWaitlist() {
  const form = document.getElementById('waitlist-form');
  const roleTabs = document.querySelectorAll('.role-tab');
  const successBox = document.getElementById('waitlist-success');
  const queueChip = document.getElementById('queue-number');
  const roleInput = document.getElementById('waitlist-role');
  const emailInput = document.getElementById('waitlist-email');
  const submitBtn = document.getElementById('waitlist-submit-btn');
  const resetBtn = document.getElementById('waitlist-reset-btn');

  if (!form) return;

  // Check LocalStorage on initial load
  const savedData = localStorage.getItem('lezzflow_waitlist');
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData);
      if (parsed && parsed.queueNumber) {
        showSuccessState(parsed.queueNumber, parsed.role);
      }
    } catch (e) {
      console.warn('Invalid waitlist data in localStorage');
    }
  }

  // Role Tab Switching
  roleTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      roleTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const selectedRole = tab.getAttribute('data-role');
      if (roleInput) roleInput.value = selectedRole;
    });
  });

  // Form Submit Handler
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const role = roleInput ? roleInput.value : 'Customer';

    if (!isValidEmail(email)) {
      emailInput.focus();
      emailInput.style.borderColor = '#ef4444';
      setTimeout(() => {
        emailInput.style.borderColor = '';
      }, 2500);
      return;
    }

    // Button loading state
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="btn-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 0.8s linear infinite;">
        <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12" stroke-linecap="round"/>
      </svg>
      <span>Joining...</span>
    `;

    setTimeout(() => {
      // Generate pseudo-random realistic queue number
      const baseQueue = 3480;
      const randomOffset = Math.floor(Math.random() * 85) + 1;
      const queueNumber = `#${baseQueue + randomOffset}`;

      const waitlistEntry = {
        email,
        role,
        queueNumber,
        joinedAt: new Date().toISOString()
      };

      try {
        localStorage.setItem('lezzflow_waitlist', JSON.stringify(waitlistEntry));
      } catch (err) {
        console.warn('LocalStorage save failed', err);
      }

      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;

      showSuccessState(queueNumber, role);
      triggerConfetti();
    }, 700);
  });

  function showSuccessState(queueNum, role) {
    if (queueChip) {
      queueChip.textContent = `Queue Position: ${queueNum}`;
    }
    form.style.display = 'none';
    if (successBox) {
      successBox.classList.add('show');
    }
  }

  // Reset button to allow testing or updating email
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      localStorage.removeItem('lezzflow_waitlist');
      if (successBox) successBox.classList.remove('show');
      form.style.display = 'flex';
      emailInput.value = '';
      emailInput.focus();
    });
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* --------------------------------------------------------------------------
   06. Lightweight High-Performance Confetti Burst
   -------------------------------------------------------------------------- */
function triggerConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);

  const colors = ['#2f7bff', '#66a3ff', '#38bdf8', '#ffffff', '#80b5ff'];
  const particles = [];
  const particleCount = 75;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: window.innerWidth / 2,
      y: window.innerHeight * 0.65,
      radius: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 1.2) * 18 - 4,
      gravity: 0.45,
      friction: 0.96,
      opacity: 1,
      rotation: Math.random() * 360,
      vRotation: (Math.random() - 0.5) * 12
    });
  }

  let animationFrame;

  function render() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    let activeParticles = 0;

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= p.friction;
      p.vy *= p.friction;
      p.opacity -= 0.012;
      p.rotation += p.vRotation;

      if (p.opacity > 0) {
        activeParticles++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
        ctx.restore();
      }
    });

    if (activeParticles > 0) {
      animationFrame = requestAnimationFrame(render);
    } else {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      cancelAnimationFrame(animationFrame);
    }
  }

  render();
}

/* --------------------------------------------------------------------------
   07. Interactive Glass Card Spotlight Tracker
   -------------------------------------------------------------------------- */
function initCardSpotlight() {
  const cards = document.querySelectorAll('.step-card, .team-card, .partner-card, .waitlist-box');
  if (!cards.length) return;

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });
}

/* --------------------------------------------------------------------------
   08. Smooth Scroll with Sticky Navbar Offset
   -------------------------------------------------------------------------- */
function initSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId === '#' || !targetId) return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height') || '76', 10);
        const targetTop = targetEl.getBoundingClientRect().top + window.scrollY - navHeight;

        window.scrollTo({
          top: targetTop,
          behavior: 'smooth'
        });
      }
    });
  });
}

/* --------------------------------------------------------------------------
   09. Graceful Image Error Handling
   -------------------------------------------------------------------------- */
window.handleImageFallback = function(imgElement, context) {
  if (!imgElement) return;

  const parent = imgElement.parentElement;
  if (!parent) return;

  // Title and subtitle mappings for fallback states
  const fallbacks = {
    'hero': {
      title: 'LezzFlow Hyperlocal Experience',
      subtitle: 'Real-time neighborhood commerce interface'
    },
    'how-1': {
      title: 'Discover Local Stores',
      subtitle: 'Live shelf inventory within 2km radius'
    },
    'how-2': {
      title: 'One-Tap Ordering',
      subtitle: 'Transparent neighborhood prices with instant checkout'
    },
    'how-3': {
      title: 'Sub-15 Min Delivery',
      subtitle: 'Direct from corner store to your doorstep'
    },
    'customer-app': {
      title: 'Customer Mobile App',
      subtitle: 'Live inventory, real store prices & instant courier tracking'
    },
    'seller-app': {
      title: 'Merchant Command Center',
      subtitle: 'Predictive restock alerts & zero-tech catalog tools'
    }
  };

  const info = fallbacks[context] || {
    title: 'LezzFlow Interface',
    subtitle: 'Hyperlocal Commerce Platform'
  };

  const placeholder = document.createElement('div');
  placeholder.className = 'img-fallback-container';
  placeholder.innerHTML = `
    <div class="img-fallback-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
        <line x1="8" y1="21" x2="16" y2="21"></line>
        <line x1="12" y1="17" x2="12" y2="21"></line>
      </svg>
    </div>
    <div class="img-fallback-title">${info.title}</div>
    <div class="img-fallback-subtitle">${info.subtitle}</div>
  `;

  imgElement.style.display = 'none';
  parent.appendChild(placeholder);
};
