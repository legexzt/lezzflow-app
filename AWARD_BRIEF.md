# LezzFlow Website v2 — AWARD-WINNING Rebuild Brief

## Mission
The current site looks like a generic "AI website". Rebuild it into a genuinely **award-winning** site (Awwwards-level): distinctive art direction, bold typography, surprising-but-tasteful motion, and a design that could NOT be mistaken for a template. Rewrite `index.html`, `css/style.css`, `js/main.js` from scratch. Keep `vercel.json` and `favicon.svg` as-is.

## Brand assets (MUST USE)
- **Real logo**: `assets/images/logo.jpg` — metallic blue 3D "L" with orbit ring on white background.
  - Navbar: logo inside a small rounded-square badge (rounded 12px, white bg, subtle blue glow ring) + wordmark "lezzflow." next to it.
  - Hero: large logo mark floating with slow 3D tilt on mouse move (desktop only).
  - Preloader: logo scales/fades in, then curtain lifts.
  - Footer: logo badge + wordmark.
- Other images (keep, restyle presentation): `assets/images/hero.webp`, `how-1.webp`, `how-2.webp`, `how-3.webp`, `customer-app.webp`, `seller-app.webp`.

## Art direction (be BOLD, not generic)
- Typography: display font "Sora" or "Space Grotesk" (Google Fonts) for huge headlines with tight tracking; "Inter" for body. Use massive fluid type: `clamp(3rem, 10vw, 8rem)` hero. Uppercase micro-labels with letter-spacing for section eyebrows.
- Color: near-black `#05070d` base, electric blue `#2f7bff` accents, ONE warm accent (amber `#ffb224`) used sparingly for highlights/ratings. Film-grain noise overlay via tiny inline SVG (feTurbulence) at 4% opacity.
- Layout: asymmetric, editorial. Oversized numbers for steps ("01 / 02 / 03"), sticky stacking cards for features, full-bleed marquee dividers, generous negative space.
- Signature moments:
  1. **Preloader** — logo reveal + percentage counter, curtain lift.
  2. **Hero** — giant staggered headline reveal (per-line mask slide-up), floating logo with mouse parallax, magnetic CTA buttons, live "scroll" hint.
  3. **Marquee dividers** between sections (store categories / "HYPERLOCAL • 10-MIN •" ticker).
  4. **Sticky stacking cards** for How-it-works (cards stack/pin on scroll, transform-only).
  5. **Horizontal-feel stats band** with count-up numbers triggered on view.
  6. **Tilt-on-hover** 3D cards (customers/sellers) — transform perspective, desktop only.
  7. **Waitlist** — role toggle pills + email field + animated success state with confetti burst (canvas, only on submit).
  8. **Footer** — big "lezzflow." wordmark, huge type.

## PERFORMANCE — butter smooth, zero jank (critical requirement)
The user explicitly demands no lag/stutter. Follow these rules strictly:
- Animate ONLY `transform` and `opacity`. NEVER animate width/height/margin/top/left/box-shadow.
- All scroll effects via **IntersectionObserver** (reveals, counters) — NOT scroll listeners where avoidable.
- Where scroll position is needed (parallax, progress bar): ONE single `requestAnimationFrame`-throttled scroll handler with `{ passive: true }`, reading `scrollY` once per frame, writing only transforms. Cache all DOM refs and element offsets on load/resize (debounced 200ms).
- Reveal animations: CSS classes + transitions (GPU-composited), staggered via `transition-delay`, not JS timeouts per element.
- `content-visibility: auto` + `contain-intrinsic-size` on below-fold sections.
- Images: `loading="lazy"` on all below-fold images, `decoding="async"`, explicit width/height to prevent CLS. Preload hero image.
- Custom cursor glow: single fixed div, moved via rAF lerp, `pointer-events: none`, hidden on touch devices.
- Magnetic buttons: mousemove → rAF-batched transform, reset on mouseleave.
- Respect `prefers-reduced-motion`: disable parallax/cursor/magnetic/marquee animation.
- No external JS libraries. Vanilla only. Keep total JS < 20KB minified-ish (write tight code).
- Debounce resize. Avoid forced synchronous layouts (never read offsetTop in a loop after writes).

## Sections (keep content, elevate design)
Navbar / Hero / Marquee / How it works (sticky stack 01-03) / For Customers (tilt card + customer-app.webp) / For Sellers (tilt card + seller-app.webp) / Delivery partners strip / Stats band (counters) / Waitlist / Team legezt (Mohd Jibraan — Team Leader; Syed Salman Razvi; Muskan Begum; Shaista Naaz; Abdul Rahman Mohd Ghouse) / Footer.

## Honesty constraints (STRICT — no fake claims)
- LezzFlow is PRE-LAUNCH. NEVER invent metrics: no "500+ stores", no "25,000+ orders", no "4.9/5 rating", no "11 min avg delivery", no pin-code counts, no testimonials, no "trusted by" logos.
- Frame everything as vision/promise: "Real-time shelf stock", "Verified local stores", "Minutes, not days". Include one honest line: "LezzFlow is currently in pre-launch — join the waitlist for early access."
- Delivery speed may be described only as a goal ("built for 10-minute neighbourhood delivery"), never as an achieved average.
- Team: Mohd Jibraan — Team Leader (only verified role). Other members (Syed Salman Razvi, Muskan Begum, Shaista Naaz, Abdul Rahman Mohd Ghouse) — names only, NO invented roles/titles.

## Constraints
- English copy only. No emojis in UI (inline SVG icons).
- Semantic HTML, alt text, aria labels, focus-visible styles, keyboard-operable menu.
- Mobile-first responsive: flawless at 360px / 768px / 1440px. Hamburger menu on mobile. Disable heavy effects on small screens.
- All image paths must match files in `assets/images/` exactly.

When done, print a short summary of what changed.
