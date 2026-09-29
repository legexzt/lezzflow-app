/* ==========================================================================
   lezzflow. — main.js  (FIXED BUILD)
   Vanilla JS. Transform/opacity-only motion. IntersectionObserver-driven.
   --------------------------------------------------------------------------
   FIX LOG (class-name audit — every class JS toggles now has matching CSS):
   • .reveal / [data-reveal] ......... 'is-visible' (was already 'is-visible';
                                       CSS unified to .reveal.is-visible)
   • body scroll lock ................ 'is-locked'  (was 'no-scroll' — had NO
                                       matching CSS rule; drawer never locked
                                       scroll. FIXED.)
   • preloader ....................... 'is-done' → 'is-gone', body 'is-loaded'
   • preloader wordmark letters ...... '.preloader__letter' spans w/ delays
   • drawer / nav toggle ............. 'is-open' + aria-expanded sync
   • nav scrolled state .............. 'is-scrolled'
   • waitlist feedback ............... 'is-error' / 'is-ok' (now actually set)
   • role pills ...................... 'is-active' + aria-pressed sync
   • confetti canvas ................. 'is-active'
   • cursor glow ..................... 'is-visible'
   • back-to-top ..................... 'is-visible'
   • lazy videos ..................... data-hydrated="true"
   NEW: 2500ms reveal failsafe — force-reveals anything IO missed.
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
  const NAV_BP = 900;

  const prefersReduced = () => reduceMotionQuery.matches;
  const pointerFX = () =>
    finePointerQuery.matches && !prefersReduced() && window.innerWidth >= DESKTOP_BP;

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp  = (a, b, t) => a + (b - a) * t;
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  // Deliberate, premium progress easing — quick start, long confident settle.
  const easePreloader = (t) => (t < 0.55
    ? 2.4 * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2);

  /* ------------------------------------------------------------------ *
   * 1. Preloader — orbiting badge, staggered wordmark, eased progress,
   *    sequenced exit (inner rises → curtain lifts). Never traps anyone.
   * ------------------------------------------------------------------ */
  const preloader = $('#preloader');

  const finishPreloader = () => {
    if (!preloader || preloader.classList.contains('is-done')) return;
    preloader.classList.add('is-done');           // CSS: inner fades, curtain lifts (delayed)
    preloader.setAttribute('aria-hidden', 'true');
    document.body.classList.add('is-loaded');      // releases hero mask-lines
    window.setTimeout(() => {
      preloader.classList.add('is-gone');          // CSS: display:none / visibility
    }, prefersReduced() ? 120 : 1500);
  };

  if (preloader) {
    const countEl = $('#preloader-count');
    const fillEl  = $('#preloader-fill');
    const wordEl  = $('.preloader__word', preloader);

    // Split wordmark into per-letter spans for the staggered rise-in.
    if (wordEl) {
      const text = (wordEl.textContent || '').trim() || 'lezzflow.';
      wordEl.setAttribute('aria-label', text);
      wordEl.textContent = '';
      const frag = document.createDocumentFragment();
      Array.from(text).forEach((ch, i) => {
        const s = document.createElement('span');
        s.className = 'preloader__letter' + (ch === '.' ? ' dot' : '');
        s.textContent = ch;
        s.setAttribute('aria-hidden', 'true');
        s.style.transitionDelay = (0.35 + i * 0.055).toFixed(3) + 's';
        frag.appendChild(s);
      });
      wordEl.appendChild(frag);
    }

    const setProgress = (eased) => {
      if (countEl) countEl.textContent = Math.round(eased * 100) + '%';
      if (fillEl) fillEl.style.transform = 'scaleX(' + eased + ')';
    };

    // FAILSAFE A — hard cap: never hold anyone past 4s, whatever happens.
    const forceTimer = window.setTimeout(finishPreloader, 4000);
    const safeFinish = () => {
      window.clearTimeout(forceTimer);
      setProgress(1);
      finishPreloader();
    };

    // FAILSAFE B — if window load already fired (cached page / late script),
    // complete immediately instead of replaying the whole sequence.
    if (document.readyState === 'complete') {
      safeFinish();
    } else if (prefersReduced()) {
      setProgress(1);
      window.setTimeout(safeFinish, 150);
    } else {
      const DURATION = 2250; // ~2.2s — deliberate, premium, not rushed
      let startTime = null;
      const step = (now) => {
        if (startTime === null) startTime = now;
        const raw = clamp((now - startTime) / DURATION, 0, 1);
        setProgress(easePreloader(raw));
        if (raw < 1) window.requestAnimationFrame(step);
        else safeFinish();
      };
      window.requestAnimationFrame(step);
      // FAILSAFE C — if load stalls the rAF loop somehow, load event nudges us.
      window.addEventListener('load', () => {
        window.setTimeout(() => {
          if (!preloader.classList.contains('is-done')) safeFinish();
        }, 1200);
      }, { once: true });
    }
  } else {
    document.body.classList.add('is-loaded');
  }

  /* ------------------------------------------------------------------ *
   * 2. Mobile drawer — toggle, ESC, backdrop(outside) click, link click,
   *    body scroll lock ('is-locked'), focus management + light trap.
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
    document.body.classList.add('is-locked');
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
    document.body.classList.remove('is-locked');
    if (returnFocus) navToggle.focus({ preventScroll: true });
  }

  if (navToggle && drawer) {
    navToggle.addEventListener('click', () => {
      if (drawer.classList.contains('is-open')) closeDrawer(true);
      else openDrawer();
    });

    // Close on any drawer link click.
    $$('a', drawer).forEach((link) => {
      link.addEventListener('click', () => closeDrawer(false));
    });

    // Close on ESC (global).
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDrawer(true);
    });

    // Close on backdrop / outside click.
    document.addEventListener('click', (e) => {
      if (!drawer.classList.contains('is-open')) return;
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (!drawer.contains(t) && !navToggle.contains(t)) closeDrawer(false);
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

    // Safety: resizing up to desktop must never leave the drawer stuck open.
    window.addEventListener('resize', () => {
      if (window.innerWidth > NAV_BP) closeDrawer(false);
    }, { passive: true });
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
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('load', measure, { once: true });

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
   * 4. Scroll reveals — IntersectionObserver adds 'is-visible'.
   *    FAILSAFE: after 2500ms force-reveal anything IO missed.
   * ------------------------------------------------------------------ */
  const revealEls = $$('.reveal, [data-reveal]');
  const forceReveal = (el) => el.classList.add('is-visible');

  if (prefersReduced() || !('IntersectionObserver' in window)) {
    revealEls.forEach(forceReveal);
  } else if (revealEls.length) {
    const revealIO = new IntersectionObserver((entries, io) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        forceReveal(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el) => revealIO.observe(el));

    // Failsafe — no element may ever stay invisible because IO misbehaved.
    window.setTimeout(() => {
      revealEls.forEach((el) => {
        if (!el.classList.contains('is-visible')) forceReveal(el);
      });
    }, 2500);
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

      // Failsafe for counters as well — never leave a "0" behind.
      window.setTimeout(() => {
        counters.forEach((el) => {
          if (el.textContent === '0' || el.textContent === '0.0') {
            const target = parseFloat(el.getAttribute('data-count'));
            if (!Number.isNaN(target)) renderCounter(el, target);
          }
        });
      }, 4000);
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
    if (video.dataset.userUnmuted !== 'true') video.muted = true;
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
   * 6b. Phone video sound toggle — unmute on tap (user gesture = allowed)
   * ------------------------------------------------------------------ */
  const phoneVideo = document.querySelector('.phone__video');
  const phoneSoundBtn = document.getElementById('phone-sound');
  if (phoneVideo && phoneSoundBtn) {
    const SVG_MUTED = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
    const SVG_LIVE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
    phoneSoundBtn.innerHTML = SVG_MUTED;
    phoneSoundBtn.addEventListener('click', () => {
      const unmuting = phoneVideo.muted;
      phoneVideo.muted = !unmuting;
      phoneVideo.dataset.userUnmuted = String(unmuting);
      phoneSoundBtn.setAttribute('aria-pressed', String(unmuting));
      phoneSoundBtn.setAttribute('aria-label', unmuting ? 'Mute video' : 'Unmute video');
      phoneSoundBtn.innerHTML = unmuting ? SVG_LIVE : SVG_MUTED;
      phoneSoundBtn.classList.toggle('is-live', unmuting);
      if (unmuting) {
        const p = phoneVideo.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      }
    });
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
  const roleInput = $('#waitlist-role');

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
  setupRolePills($$('button.role[data-role]'));

  if (waitlistForm) {
    const emailInput = $('#waitlist-email');
    const feedback = $('#waitlist-feedback');
    const successPanel = $('#waitlist-success');
    const successRole = $('#success-role');
    const resetBtn = $('#waitlist-reset');
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const setFeedback = (msg, kind) => {
      if (!feedback) return;
      feedback.textContent = msg;
      feedback.classList.toggle('is-error', kind === 'error');
      feedback.classList.toggle('is-ok', kind === 'ok');
    };

    if (emailInput) {
      emailInput.addEventListener('input', () => {
        emailInput.removeAttribute('aria-invalid');
        setFeedback('', '');
      });
    }

    waitlistForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = emailInput ? emailInput.value.trim() : '';

      if (!emailInput || !EMAIL_RE.test(email)) {
        setFeedback('Please enter a valid email address.', 'error');
        if (emailInput) {
          emailInput.setAttribute('aria-invalid', 'true');
          emailInput.focus({ preventScroll: true });
        }
        return;
      }

      emailInput.removeAttribute('aria-invalid');
      setFeedback('', '');

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
      waitlistForm.classList.add('is-hidden');
      if (successPanel) {
        successPanel.hidden = false;
        successPanel.setAttribute('aria-hidden', 'false');
        successPanel.classList.add('is-visible');
        if (successRole) successRole.textContent = role;
        if (!successPanel.hasAttribute('tabindex')) {
          successPanel.setAttribute('tabindex', '-1');
        }
        successPanel.focus({ preventScroll: true });
      }

      burstConfetti(originX, originY);
    });

    if (resetBtn && successPanel) {
      resetBtn.addEventListener('click', () => {
        successPanel.setAttribute('aria-hidden', 'true');
        successPanel.classList.remove('is-visible');
        successPanel.hidden = true;
        waitlistForm.hidden = false;
        waitlistForm.classList.remove('is-hidden');
        waitlistForm.reset();
        setFeedback('', '');
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