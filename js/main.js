/* ==========================================================================
   lezzflow. — main.js
   Vanilla JS. Transform/opacity-only motion. IntersectionObserver-driven.
   ========================================================================== */
(() => {
  'use strict';

  /* ------------------------------------------------------------------ *
   * 0. Environment & helpers
   * ------------------------------------------------------------------ */
  const docEl = document.documentElement;
  docEl.classList.add('js');

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointerQuery  = window.matchMedia('(pointer: fine)');
  const DESKTOP_BP = 1024;

  const prefersReduced = () => reduceMotionQuery.matches;
  const pointerFX = () =>
    finePointerQuery.matches && !prefersReduced() && window.innerWidth >= DESKTOP_BP;

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp  = (a, b, t) => a + (b - a) * t;
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  /* ------------------------------------------------------------------ *
   * 1. Preloader — percentage counter + blue curtain lift
   * ------------------------------------------------------------------ */
  const preloader = $('#preloader');

  const finishPreloader = () => {
    if (!preloader || preloader.classList.contains('is-done')) return;
    preloader.classList.add('is-done');
    document.body.classList.add('is-loaded');
    preloader.setAttribute('aria-hidden', 'true');
    window.setTimeout(() => {
      preloader.classList.add('is-gone');
    }, prefersReduced() ? 80 : 950);
  };

  if (preloader) {
    const countEl = $('#preloader-count');
    const fillEl  = $('#preloader-fill');

    if (prefersReduced()) {
      if (countEl) countEl.textContent = '100%';
      if (fillEl) fillEl.style.transform = 'scaleX(1)';
      finishPreloader();
    } else {
      const DURATION = 1500;
      let startTime = null;
      const step = (now) => {
        if (startTime === null) startTime = now;
        const raw = clamp((now - startTime) / DURATION, 0, 1);
        const eased = easeOutCubic(raw);
        if (countEl) countEl.textContent = Math.round(eased * 100) + '%';
        if (fillEl) fillEl.style.transform = 'scaleX(' + eased + ')';
        if (raw < 1) window.requestAnimationFrame(step);
        else finishPreloader();
      };
      window.requestAnimationFrame(step);
      // Safety net — never trap anyone behind the curtain.
      window.setTimeout(finishPreloader, 4200);
    }
  } else {
    document.body.classList.add('is-loaded');
  }

  /* ------------------------------------------------------------------ *
   * 2. Mobile drawer — keyboard-operable, focus-managed
   * ------------------------------------------------------------------ */
  const navToggle = $('#nav-toggle');
  const drawer = $('#mobile-drawer');

  function openDrawer() {
    if (!drawer || !navToggle) return;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    navToggle.classList.add('is-open');
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', 'Close navigation menu');
    document.body.classList.add('no-scroll');
    const firstLink = $('a, button', drawer);
    if (firstLink) firstLink.focus({ preventScroll: true });
  }

  function closeDrawer(returnFocus) {
    if (!drawer || !navToggle || !drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    navToggle.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open navigation menu');
    document.body.classList.remove('no-scroll');
    if (returnFocus) navToggle.focus({ preventScroll: true });
  }

  if (navToggle && drawer) {
    navToggle.addEventListener('click', () => {
      if (drawer.classList.contains('is-open')) closeDrawer(true);
      else openDrawer();
    });

    $$('a', drawer).forEach((link) => {
      link.addEventListener('click', () => closeDrawer(false));
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDrawer(true);
    });

    // Lightweight focus trap while the drawer is open.
    drawer.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || !drawer.classList.contains('is-open')) return;
      const focusables = $$('a[href], button:not([disabled])', drawer);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * 3. Single rAF-throttled passive scroll handler
   *    — scroll progress bar, nav state, back-to-top visibility
   * ------------------------------------------------------------------ */
  const progressBar = $('#scroll-progress');
  const nav = $('#nav');
  const backToTop = $('#back-to-top') || $('[data-back-to-top]');

  let maxScroll = 1;
  const measure = () => {
    maxScroll = Math.max(docEl.scrollHeight - window.innerHeight, 1);
  };
  measure();

  let scrollTicking = false;
  const onScroll = () => {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(() => {
      const y = window.scrollY || 0;
      if (progressBar) {
        progressBar.style.transform = 'scaleX(' + clamp(y / maxScroll, 0, 1) + ')';
      }
      if (nav) nav.classList.toggle('is-scrolled', y > 12);
      if (backToTop) {
        backToTop.classList.toggle('is-visible', y > window.innerHeight * 0.75);
      }
      scrollTicking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReduced() ? 'auto' : 'smooth' });
    });
  }

  /* ------------------------------------------------------------------ *
   * 4. Scroll reveals — IntersectionObserver, CSS transitions do the rest
   * ------------------------------------------------------------------ */
  const revealEls = $$('.reveal, [data-reveal]');
  if (prefersReduced() || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else if (revealEls.length) {
    const revealIO = new IntersectionObserver((entries, io) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el) => revealIO.observe(el));
  }

  /* ------------------------------------------------------------------ *
   * 5. Stats count-up — fires once when the band enters view
   * ------------------------------------------------------------------ */
  const counters = $$('[data-count]');

  const renderCounter = (el, value) => {
    const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    const prefix = el.getAttribute('data-prefix') || '';
    const suffix = el.getAttribute('data-suffix') || '';
    const num = decimals > 0
      ? value.toFixed(decimals)
      : Math.round(value).toLocaleString('en-US');
    el.textContent = prefix + num + suffix;
  };

  const animateCounter = (el) => {
    const target = parseFloat(el.getAttribute('data-count'));
    if (Number.isNaN(target)) return;
    if (prefersReduced()) {
      renderCounter(el, target);
      return;
    }
    const duration = parseInt(el.getAttribute('data-duration') || '1800', 10);
    let t0 = null;
    const step = (now) => {
      if (t0 === null) t0 = now;
      const p = clamp((now - t0) / duration, 0, 1);
      renderCounter(el, target * easeOutCubic(p));
      if (p < 1) window.requestAnimationFrame(step);
      else renderCounter(el, target);
    };
    window.requestAnimationFrame(step);
  };

  if (counters.length) {
    if (!('IntersectionObserver' in window)) {
      counters.forEach(animateCounter);
    } else {
      const countIO = new IntersectionObserver((entries, io) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          io.unobserve(entry.target);
        });
      }, { threshold: 0.4 });
      counters.forEach((el) => countIO.observe(el));
    }
  }

  /* ------------------------------------------------------------------ *
   * 6. Lazy videos — hydrate on approach, play in view, pause off-screen
   * ------------------------------------------------------------------ */
  const videoSet = new Set();
  $$('video[data-src]').forEach((v) => videoSet.add(v));
  $$('video source[data-src]').forEach((s) => {
    const v = s.closest('video');
    if (v) videoSet.add(v);
  });
  const lazyVideos = Array.from(videoSet);

  const hydrateVideo = (video) => {
    if (video.dataset.hydrated === 'true') return;
    video.dataset.hydrated = 'true';
    if (video.getAttribute('data-src')) {
      video.src = video.getAttribute('data-src');
      video.removeAttribute('data-src');
    }
    $$('source[data-src]', video).forEach((source) => {
      source.src = source.getAttribute('data-src');
      source.removeAttribute('data-src');
    });
    video.preload = 'auto';
    video.load();
  };

  const tryPlay = (video) => {
    if (prefersReduced()) return;
    video.muted = true;
    const p = video.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  };

  if (lazyVideos.length) {
    if (prefersReduced()) {
      // No autoplay for reduced motion — hand control to the viewer.
      lazyVideos.forEach((v) => {
        v.removeAttribute('autoplay');
        v.setAttribute('controls', '');
      });
    }

    if ('IntersectionObserver' in window) {
      const loadIO = new IntersectionObserver((entries, io) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          hydrateVideo(entry.target);
          io.unobserve(entry.target);
        });
      }, { rootMargin: '300px 0px', threshold: 0.01 });

      const playIO = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting) {
            if (video.dataset.hydrated === 'true') tryPlay(video);
          } else if (!video.paused) {
            video.pause();
          }
        });
      }, { threshold: 0.25 });

      lazyVideos.forEach((v) => {
        loadIO.observe(v);
        playIO.observe(v);
      });
    } else {
      lazyVideos.forEach((v) => {
        hydrateVideo(v);
        tryPlay(v);
      });
    }
  }

  /* ------------------------------------------------------------------ *
   * 7. Confetti — canvas burst, waitlist submit only
   * ------------------------------------------------------------------ */
  const confettiCanvas = $('#confetti-canvas');
  let confettiRunning = false;

  function burstConfetti(originX, originY) {
    if (!confettiCanvas || prefersReduced() || confettiRunning) return;
    confettiRunning = true;

    const ctx = confettiCanvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    confettiCanvas.width = window.innerWidth * dpr;
    confettiCanvas.height = window.innerHeight * dpr;
    confettiCanvas.classList.add('is-active');

    const COLORS = ['#1f5cff', '#2456ff', '#6f9bff', '#bcd2ff', '#ffffff'];
    const COUNT = window.innerWidth < 640 ? 70 : 130;
    const parts = [];

    for (let i = 0; i < COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (5 + Math.random() * 9) * dpr;
      parts.push({
        x: originX * dpr,
        y: originY * dpr,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 6 * dpr,
        size: (4 + Math.random() * 6) * dpr,
        color: COLORS[i % COLORS.length],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        rect: Math.random() < 0.55,
        life: 1,
        decay: 0.008 + Math.random() * 0.009
      });
    }

    let last = performance.now();
    const frame = (now) => {
      const dt = clamp((now - last) / 16.7, 0.5, 3);
      last = now;
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      let alive = false;

      for (const p of parts) {
        if (p.life <= 0) continue;
        alive = true;
        p.vy += 0.22 * dpr * dt;
        p.vx *= 0.99;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        p.life -= p.decay * dt;

        ctx.save();
        ctx.globalAlpha = clamp(p.life, 0, 1);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.rect) {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.62);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      if (alive) {
        window.requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        confettiCanvas.classList.remove('is-active');
        confettiRunning = false;
      }
    };
    window.requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------------ *
   * 8. Waitlist — role pills, validation, animated success + confetti
   * ------------------------------------------------------------------ */
  const waitlistForm = $('#waitlist-form');

  const rolePills = $$('.role-pill, [data-role-pill]');
  const roleInput = $('#waitlist-role');
  if (rolePills.length)if (rolePills.length) {
    setupRolePills(rolePills);
  } else {
    // Actual markup uses button.role[data-role] — fall back to it.
    setupRolePills($$('button.role[data-role]'));
  }

  function setupRolePills(pills) {
    if (!pills.length || !roleInput) return;
    pills.forEach((pill) => {
      const isActive = pill.classList.contains('is-active');
      pill.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      if (isActive) roleInput.value = pill.getAttribute('data-role') || '';
      pill.addEventListener('click', () => {
        pills.forEach((p) => {
          const current = p === pill;
          p.classList.toggle('is-active', current);
          p.setAttribute('aria-pressed', current ? 'true' : 'false');
        });
        roleInput.value = pill.getAttribute('data-role') || '';
      });
    });
  }

  if (waitlistForm) {
    const emailInput = $('#waitlist-email');
    const feedback = $('#waitlist-feedback');
    const successPanel = $('#waitlist-success');
    const successRole = $('#success-role');
    const resetBtn = $('#waitlist-reset');
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (emailInput) {
      emailInput.addEventListener('input', () => {
        emailInput.removeAttribute('aria-invalid');
        if (feedback) feedback.textContent = '';
      });
    }

    waitlistForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = emailInput ? emailInput.value.trim() : '';

      if (!emailInput || !EMAIL_RE.test(email)) {
        if (feedback) feedback.textContent = 'Please enter a valid email address.';
        if (emailInput) {
          emailInput.setAttribute('aria-invalid', 'true');
          emailInput.focus({ preventScroll: true });
        }
        return;
      }

      emailInput.removeAttribute('aria-invalid');
      if (feedback) feedback.textContent = '';

      const role = (roleInput && roleInput.value) || 'Member';

      try {
        window.localStorage.setItem(
          'lezzflow-waitlist',
          JSON.stringify({ email: email, role: role, at: Date.now() })
        );
      } catch (err) { /* storage unavailable — no-op */ }

      // Confetti origin: form centre, measured once before hiding.
      const rect = waitlistForm.getBoundingClientRect();
      const originX = rect.left + rect.width / 2;
      const originY = clamp(rect.top + rect.height / 2, 40, window.innerHeight - 40);

      waitlistForm.hidden = true;
      if (successPanel) {
        successPanel.hidden = false;
        successPanel.setAttribute('aria-hidden', 'false');
        if (successRole) successRole.textContent = role;
        if (!successPanel.hasAttribute('tabindex')) {
          successPanel.setAttribute('tabindex', '-1');
        }
        successPanel.focus({ preventScroll: true });
      } else if (successRole) {
        successRole.textContent = role;
      }

      burstConfetti(originX, originY);
    });

    if (resetBtn && successPanel) {
      resetBtn.addEventListener('click', () => {
        successPanel.setAttribute('aria-hidden', 'true');
        successPanel.hidden = true;
        waitlistForm.hidden = false;
        waitlistForm.reset();
        if (feedback) feedback.textContent = '';
        if (emailInput) {
          emailInput.removeAttribute('aria-invalid');
          emailInput.focus({ preventScroll: true });
        }
        // Re-sync pills with the hidden input's restored default value.
        const pills = $$('button.role[data-role]');
        if (pills.length && roleInput) {
          const fallback = pills[0];
          const match = pills.filter(
            (p) => p.getAttribute('data-role') === roleInput.value
          )[0] || fallback;
          pills.forEach((p) => {
            const current = p === match;
            p.classList.toggle('is-active', current);
            p.setAttribute('aria-pressed', current ? 'true' : 'false');
          });
          roleInput.value = match.getAttribute('data-role') || '';
        }
      });
    }
  }

  /* ------------------------------------------------------------------ *
   * 9. Magnetic buttons — rAF-batched translate, desktop pointers only
   * ------------------------------------------------------------------ */
  const magneticEls = $$('[data-magnetic]');
  if (magneticEls.length && pointerFX()) {
    magneticEls.forEach((el) => {
      const strength = parseFloat(el.getAttribute('data-magnetic')) || 0.35;
      let targetX = 0;
      let targetY = 0;
      let currentX = 0;
      let currentY = 0;
      let rafId = null;

      const applyMagnet = () => {
        rafId = null;
        currentX = lerp(currentX, targetX, 0.18);
        currentY = lerp(currentY, targetY, 0.18);
        if (Math.abs(currentX) < 0.05 && Math.abs(currentY) < 0.05 &&
            targetX === 0 && targetY === 0) {
          currentX = 0;
          currentY = 0;
          el.style.transform = '';
          return;
        }
        el.style.transform =
          'translate3d(' + currentX.toFixed(2) + 'px, ' + currentY.toFixed(2) + 'px, 0)';
        rafId = window.requestAnimationFrame(applyMagnet);
      };

      const scheduleMagnet = () => {
        if (rafId === null) rafId = window.requestAnimationFrame(applyMagnet);
      };

      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        targetX = (e.clientX - (rect.left + rect.width / 2)) * strength;
        targetY = (e.clientY - (rect.top + rect.height / 2)) * strength;
        scheduleMagnet();
      });

      el.addEventListener('mouseleave', () => {
        targetX = 0;
        targetY = 0;
        scheduleMagnet();
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * 10. Cursor glow — one fixed div, lerped follow, desktop only
   * ------------------------------------------------------------------ */
  if (pointerFX()) {
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    glow.setAttribute('aria-hidden', 'true');
    glow.style.position = 'fixed';
    glow.style.top = '0';
    glow.style.left = '0';
    glow.style.pointerEvents = 'none';
    document.body.appendChild(glow);

    let glowX = window.innerWidth / 2;
    let glowY = window.innerHeight / 2;
    let glowTargetX = glowX;
    let glowTargetY = glowY;
    let glowRaf = null;

    const renderGlow = () => {
      glowRaf = null;
      glowX = lerp(glowX, glowTargetX, 0.16);
      glowY = lerp(glowY, glowTargetY, 0.16);
      glow.style.transform =
        'translate3d(' + glowX.toFixed(1) + 'px, ' + glowY.toFixed(1) + 'px, 0)' +
        ' translate(-50%, -50%)';
      if (Math.abs(glowX - glowTargetX) > 0.1 || Math.abs(glowY - glowTargetY) > 0.1) {
        glowRaf = window.requestAnimationFrame(renderGlow);
      }
    };

    window.addEventListener('mousemove', (e) => {
      glowTargetX = e.clientX;
      glowTargetY = e.clientY;
      glow.classList.add('is-visible');
      if (glowRaf === null) glowRaf = window.requestAnimationFrame(renderGlow);
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      glow.classList.remove('is-visible');
    });
  }

  /* ------------------------------------------------------------------ *
   * 11. Footer year — only when the markup opts in
   * ------------------------------------------------------------------ */
  const yearEl = $('[data-year]');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

})();
