/**
 * LEZZFLOW. v2 — Hyperlocal Commerce Platform
 * Award-Winning Rebuild Controller
 * Pure Vanilla JS • Zero Dependencies • Butter-Smooth Performance
 */

(() => {
  'use strict';

  // Environment & Accessibility Capabilities
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = window.matchMedia('(hover: none) or (pointer: coarse)').matches;

  // DOM Content Loaded Bootstrapper
  document.addEventListener('DOMContentLoaded', () => {
    initPreloader();
    initScrollEngine();
    initRevealObserver();
    initStatCounters();
    initMobileMenu();
    initWaitlist();
    initAnchorScrolling();

    // Desktop-only motion enhancements
    if (!isTouchDevice && !prefersReducedMotion) {
      initCursorGlow();
      initHeroLogoParallax();
      initCard3DTilt();
      initMagneticButtons();
    }
  });

  /* ==========================================================================
     01. SIGNATURE MOMENT 1: PRELOADER (Logo Reveal + Counter + Curtain Lift)
     ========================================================================== */
  function initPreloader() {
    const preloader = document.getElementById('preloader');
    const fillBar = document.getElementById('preloader-fill');
    const counterText = document.getElementById('preloader-number');
    const heroSection = document.getElementById('hero');

    if (!preloader) return;

    if (prefersReducedMotion) {
      preloader.style.display = 'none';
      if (heroSection) heroSection.classList.add('is-revealed');
      return;
    }

    let progress = 0;
    const duration = 650; // ms
    const startTime = performance.now();

    const updateLoader = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Quad ease-out
      progress = Math.floor(t * (2 - t) * 100);

      if (fillBar) {
        fillBar.style.transform = `scaleX(${progress / 100})`;
      }
      if (counterText) {
        counterText.textContent = `${progress}%`;
      }

      if (t < 1) {
        requestAnimationFrame(updateLoader);
      } else {
        // Complete - lift curtain
        setTimeout(() => {
          preloader.classList.add('is-loaded');
          if (heroSection) {
            heroSection.classList.add('is-revealed');
          }

          // Clean up DOM after curtain lift animation completes
          setTimeout(() => {
            preloader.style.display = 'none';
            preloader.setAttribute('aria-hidden', 'true');
          }, 850);
        }, 120);
      }
    };

    requestAnimationFrame(updateLoader);
  }

  /* ==========================================================================
     02. PERFORMANCE ENGINE: SINGLE rAF SCROLL HANDLER (Passive, Cached Measurements)
     ========================================================================== */
  function initScrollEngine() {
    const progressBar = document.getElementById('scroll-progress');
    const navbar = document.getElementById('navbar');
    const stackingCards = document.querySelectorAll('.stack-card');
    const backToTopBtn = document.getElementById('back-to-top-btn');

    let isTicking = false;
    let cachedMaxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    let cachedScrollY = window.scrollY;
    let isNavbarScrolled = false;

    // Cache metrics on load and debounced resize
    const updateMetrics = () => {
      cachedMaxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    };

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateMetrics, 200);
    }, { passive: true });

    // Single rAF Frame Execution
    const onFrame = () => {
      // 1. Scroll Progress Bar (scaleX transform only)
      if (progressBar) {
        const ratio = Math.min(1, Math.max(0, cachedScrollY / cachedMaxScroll));
        progressBar.style.transform = `scaleX(${ratio})`;
      }

      // 2. Compact Glass Navbar Toggle
      if (navbar) {
        if (cachedScrollY > 35 && !isNavbarScrolled) {
          navbar.classList.add('scrolled');
          isNavbarScrolled = true;
        } else if (cachedScrollY <= 35 && isNavbarScrolled) {
          navbar.classList.remove('scrolled');
          isNavbarScrolled = false;
        }
      }

      // 3. Subtle GPU Transform for Sticky Stacking Deck
      if (stackingCards.length > 1 && !prefersReducedMotion) {
        const viewportHeight = window.innerHeight;
        stackingCards.forEach((card, idx) => {
          const rect = card.getBoundingClientRect();
          // If card is pinned near top, subtly compress previous cards
          if (rect.top <= 140 && idx < stackingCards.length - 1) {
            card.style.transform = 'scale(0.985)';
            card.style.opacity = '0.92';
          } else {
            card.style.transform = 'scale(1)';
            card.style.opacity = '1';
          }
        });
      }

      isTicking = false;
    };

    // Passive Window Scroll Listener
    window.addEventListener('scroll', () => {
      cachedScrollY = window.scrollY;
      if (!isTicking) {
        requestAnimationFrame(onFrame);
        isTicking = true;
      }
    }, { passive: true });

    // Initial pass
    onFrame();

    // Back to top click handler
    if (backToTopBtn) {
      backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  /* ==========================================================================
     03. GPU REVEAL SYSTEM: IntersectionObserver
     ========================================================================== */
  function initRevealObserver() {
    const revealItems = document.querySelectorAll('.reveal-item');
    if (!revealItems.length) return;

    if (prefersReducedMotion) {
      revealItems.forEach(el => el.classList.add('is-revealed'));
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    revealItems.forEach(item => observer.observe(item));
  }

  /* ==========================================================================
     04. SIGNATURE MOMENT 5: STAT COUNTERS (Count-Up Animation on View)
     ========================================================================== */
  function initStatCounters() {
    const counterElements = document.querySelectorAll('.stat-number');
    if (!counterElements.length) return;

    const animateNumber = (element) => {
      const targetVal = parseFloat(element.getAttribute('data-target') || '0');
      const suffix = element.getAttribute('data-suffix') || '';
      const prefix = element.getAttribute('data-prefix') || '';
      const decimals = parseInt(element.getAttribute('data-decimals') || '0', 10);

      if (prefersReducedMotion) {
        const formatted = decimals > 0 ? targetVal.toFixed(decimals) : targetVal.toString();
        element.textContent = `${prefix}${formatted}${suffix}`;
        return;
      }

      const duration = 1800; // ms
      const startTime = performance.now();

      const tick = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Cubic ease out
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = targetVal * ease;

        const valString = decimals > 0 ? current.toFixed(decimals) : Math.floor(current).toString();
        element.textContent = `${prefix}${valString}${suffix}`;

        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          const finalString = decimals > 0 ? targetVal.toFixed(decimals) : targetVal.toString();
          element.textContent = `${prefix}${finalString}${suffix}`;
        }
      };

      requestAnimationFrame(tick);
    };

    const counterObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateNumber(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });

    counterElements.forEach(el => counterObserver.observe(el));
  }

  /* ==========================================================================
     05. SIGNATURE MOMENT: CUSTOM CURSOR GLOW (Desktop Only, Lerp rAF)
     ========================================================================== */
  function initCursorGlow() {
    const cursor = document.getElementById('cursor-glow');
    if (!cursor) return;

    let targetX = -500;
    let targetY = -500;
    let currentX = -500;
    let currentY = -500;
    let isMoving = false;

    window.addEventListener('pointermove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!isMoving) {
        cursor.classList.add('is-active');
        isMoving = true;
      }
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      cursor.classList.remove('is-active');
    });

    const render = () => {
      // Lerp smoothing factor
      currentX += (targetX - currentX) * 0.14;
      currentY += (targetY - currentY) * 0.14;

      cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
  }

  /* ==========================================================================
     06. SIGNATURE MOMENT 2: HERO 3D EMBLEM LOGO TILT (Desktop Parallax)
     ========================================================================== */
  function initHeroLogoParallax() {
    const heroEmblem = document.getElementById('hero-emblem');
    const heroVisual = document.getElementById('hero-media-card');
    if (!heroEmblem || !heroVisual) return;

    let targetRotX = 0;
    let targetRotY = 0;
    let targetTransX = 0;
    let targetTransY = 0;

    let currRotX = 0;
    let currRotY = 0;
    let currTransX = 0;
    let currTransY = 0;

    heroVisual.addEventListener('pointermove', (e) => {
      const rect = heroVisual.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1; // -1 to 1
      const normY = ((e.clientY - rect.top) / rect.height) * 2 - 1; // -1 to 1

      targetRotX = -normY * 14;
      targetRotY = normX * 14;
      targetTransX = normX * 18;
      targetTransY = normY * 14;
    }, { passive: true });

    heroVisual.addEventListener('pointerleave', () => {
      targetRotX = 0;
      targetRotY = 0;
      targetTransX = 0;
      targetTransY = 0;
    });

    const loop = () => {
      currRotX += (targetRotX - currRotX) * 0.1;
      currRotY += (targetRotY - currRotY) * 0.1;
      currTransX += (targetTransX - currTransX) * 0.1;
      currTransY += (targetTransY - currTransY) * 0.1;

      heroEmblem.style.transform = `translate3d(${currTransX}px, ${currTransY}px, 0) rotateX(${currRotX}deg) rotateY(${currRotY}deg)`;
      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  /* ==========================================================================
     07. SIGNATURE MOMENT 6: 3D TILT CARDS (Customers & Sellers)
     ========================================================================== */
  function initCard3DTilt() {
    const tiltCards = document.querySelectorAll('[data-tilt]');
    if (!tiltCards.length) return;

    tiltCards.forEach(card => {
      const cardInner = card.querySelector('.tilt-card-inner');
      if (!cardInner) return;

      let rect = card.getBoundingClientRect();

      card.addEventListener('pointerenter', () => {
        rect = card.getBoundingClientRect();
      }, { passive: true });

      card.addEventListener('pointermove', (e) => {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const normX = (x / rect.width) * 2 - 1;
        const normY = (y / rect.height) * 2 - 1;

        const rotX = -normY * 8;
        const rotY = normX * 8;

        cardInner.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.015, 1.015, 1.015)`;
        card.style.setProperty('--glare-x', `${(x / rect.width) * 100}%`);
        card.style.setProperty('--glare-y', `${(y / rect.height) * 100}%`);
      }, { passive: true });

      card.addEventListener('pointerleave', () => {
        cardInner.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      });
    });
  }

  /* ==========================================================================
     08. MAGNETIC CTA BUTTONS (Mouse Tracking with Clamped Translation)
     ========================================================================== */
  function initMagneticButtons() {
    const magneticBtns = document.querySelectorAll('.btn-magnetic');
    if (!magneticBtns.length) return;

    magneticBtns.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = Math.max(-14, Math.min(14, (e.clientX - centerX) * 0.35));
        const deltaY = Math.max(-14, Math.min(14, (e.clientY - centerY) * 0.35));

        btn.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate3d(0, 0, 0)';
      });
    });
  }

  /* ==========================================================================
     09. MOBILE NAVIGATION MENU DRAWER
     ========================================================================== */
  function initMobileMenu() {
    const navToggle = document.getElementById('nav-toggle');
    const drawer = document.getElementById('mobile-drawer');
    if (!navToggle || !drawer) return;

    const toggle = (isOpen) => {
      const openState = typeof isOpen === 'boolean' ? isOpen : !drawer.classList.contains('is-open');
      drawer.classList.toggle('is-open', openState);
      navToggle.classList.toggle('is-open', openState);
      navToggle.setAttribute('aria-expanded', openState ? 'true' : 'false');
      drawer.setAttribute('aria-hidden', openState ? 'false' : 'true');
      document.body.style.overflow = openState ? 'hidden' : '';
    };

    navToggle.addEventListener('click', () => toggle());

    // Close when clicking any nav link
    drawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => toggle(false));
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
        toggle(false);
      }
    });
  }

  /* ==========================================================================
     10. SIGNATURE MOMENT 7: WAITLIST SYSTEM & CONFETTI BURST
     ========================================================================== */
  function initWaitlist() {
    const form = document.getElementById('waitlist-form');
    const emailInput = document.getElementById('waitlist-email-input');
    const roleInput = document.getElementById('waitlist-role-input');
    const rolePills = document.querySelectorAll('.role-pill');
    const successCard = document.getElementById('waitlist-success');
    const queueChip = document.getElementById('success-queue-chip');
    const roleChip = document.getElementById('success-role-chip');
    const feedback = document.getElementById('form-feedback');
    const resetBtn = document.getElementById('waitlist-reset-btn');
    const submitBtn = document.getElementById('waitlist-submit-btn');

    if (!form) return;

    // Check LocalStorage on initial load
    try {
      const savedData = localStorage.getItem('lezzflow_waitlist');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed && parsed.queueNumber) {
          renderSuccess(parsed.queueNumber, parsed.role || 'Shopper');
        }
      }
    } catch (e) {
      console.warn('LocalStorage access note:', e);
    }

    // Role selection pills
    rolePills.forEach(pill => {
      pill.addEventListener('click', () => {
        rolePills.forEach(p => {
          p.classList.remove('active');
          p.setAttribute('aria-pressed', 'false');
        });
        pill.classList.add('active');
        pill.setAttribute('aria-pressed', 'true');
        const role = pill.getAttribute('data-role');
        if (roleInput) roleInput.value = role;
      });
    });

    // Email validation
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const email = emailInput.value.trim();
      const role = roleInput ? roleInput.value : 'Customer';

      if (!isValidEmail(email)) {
        if (feedback) {
          feedback.className = 'form-feedback error';
          feedback.textContent = 'Please provide a valid email address.';
        }
        emailInput.focus();
        return;
      }

      if (feedback) feedback.textContent = '';

      // Button loading indicator
      const originalHtml = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Securing spot...</span>`;

      setTimeout(() => {
        // Generate pseudo-random realistic queue number
        const baseQueue = 3480;
        const randomOffset = Math.floor(Math.random() * 85) + 12;
        const queueNumber = `#${baseQueue + randomOffset}`;

        const entry = {
          email,
          role,
          queueNumber,
          joinedAt: new Date().toISOString()
        };

        try {
          localStorage.setItem('lezzflow_waitlist', JSON.stringify(entry));
        } catch (err) {
          console.warn('LocalStorage save error:', err);
        }

        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHtml;

        renderSuccess(queueNumber, role);
        triggerConfetti();
      }, 550);
    });

    function renderSuccess(queueNum, userRole) {
      if (queueChip) queueChip.textContent = `Queue Position: ${queueNum}`;
      if (roleChip) roleChip.textContent = `Role: ${userRole}`;
      form.style.display = 'none';
      if (successCard) {
        successCard.classList.add('is-visible');
        successCard.setAttribute('aria-hidden', 'false');
      }
    }

    // Reset button
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        try {
          localStorage.removeItem('lezzflow_waitlist');
        } catch (err) {
          console.warn(err);
        }
        if (successCard) {
          successCard.classList.remove('is-visible');
          successCard.setAttribute('aria-hidden', 'true');
        }
        form.style.display = 'block';
        if (emailInput) {
          emailInput.value = '';
          emailInput.focus();
        }
      });
    }
  }

  /* ==========================================================================
     11. HIGH-PERFORMANCE CONFETTI (Triggered Only on Submit, Canvas Physics)
     ========================================================================== */
  function triggerConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);

    const colors = ['#2f7bff', '#5e9bff', '#ffb224', '#ffffff', '#38bdf8'];
    const particles = [];
    const count = 80;

    const originX = window.innerWidth / 2;
    const originY = window.innerHeight * 0.55;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: originX,
        y: originY,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 1.25) * 18 - 4,
        size: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        gravity: 0.42,
        drag: 0.965,
        opacity: 1,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 14
      });
    }

    let animId;

    const render = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      let alive = 0;

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.opacity -= 0.012;
        p.rotation += p.rotSpeed;

        if (p.opacity > 0) {
          alive++;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillRect(-p.size, -p.size, p.size * 2, p.size * 2);
          ctx.restore();
        }
      });

      if (alive > 0) {
        animId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        cancelAnimationFrame(animId);
      }
    };

    render();
  }

  /* ==========================================================================
     12. SMOOTH ANCHOR SCROLLING WITH NAVBAR OFFSET
     ========================================================================== */
  function initAnchorScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        if (targetId === '#' || !targetId) return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height') || '80', 10);
          const top = targetElement.getBoundingClientRect().top + window.scrollY - navHeight;

          window.scrollTo({
            top,
            behavior: 'smooth'
          });
        }
      });
    });
  }

})();
