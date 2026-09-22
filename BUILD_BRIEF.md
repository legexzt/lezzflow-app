# LezzFlow Website — Build Brief for Antigravity

## What is LezzFlow
LezzFlow is a hyperlocal commerce platform (SIH 2026 project by Team legezt) that connects customers with nearby local stores — kirana shops, pharmacies, etc. Tagline ideas: "Your neighbourhood stores, now one tap away."

## Brand
- Name styled as **lezzflow.** (lowercase with trailing dot)
- Colors: deep dark background (near-black #05070f), metallic/electric blue (#2f7bff → #66a3ff gradient), white text, subtle glassmorphism
- Font: modern geometric sans (Inter / Plus Jakarta Sans via Google Fonts)
- Logo concept: glowing blue 3D "L" with orbit ring (images will be provided in assets/images/)

## Deliverable
A single-page, crazy-good, Awwwards-level marketing website. Pure HTML + CSS + JS (no build step, no frameworks) so it deploys on Vercel as a static site.

Files to create:
- `index.html` — all sections
- `css/style.css` — all styling
- `js/main.js` — all interactivity
- `vercel.json` — static config (optional)
- `favicon.svg` — simple glowing blue "L"

## Sections (in order)
1. **Navbar** — glassy sticky nav: logo "lezzflow.", links (How it works, For Customers, For Sellers, Team), CTA button "Join Waitlist"
2. **Hero** — huge headline like "Your neighbourhood, delivered in minutes.", subtext, two CTAs (Join waitlist / For sellers), hero visual placeholder `<img src="assets/images/hero.png">`, floating stat chips (e.g. "10-min avg delivery", "500+ stores"), animated gradient orbs background
3. **Logos/trust strip** — "Built for local commerce" marquee of store categories (Kirana • Pharmacy • Bakery • Dairy • Stationery…)
4. **How it works** — 3 steps with numbered cards: 1) Discover nearby stores, 2) Order in one tap, 3) Doorstep delivery. Use `<img src="assets/images/how-1.png">` etc. (3 images)
5. **For Customers** — split section: bullet benefits (live stock, real prices, distance shown, fast delivery) + `<img src="assets/images/customer-app.png">` (phone mockup)
6. **For Sellers** — split section: smart restock alerts ("This item may run out before the weekend"), demand insights, zero-tech onboarding + `<img src="assets/images/seller-app.png">`
7. **Delivery Partners** — compact strip: flexible earnings, smart routes
8. **Stats band** — animated counters (stores, orders, avg delivery time)
9. **Waitlist** — email input + button (fake submit → success animation, store in localStorage)
10. **Team** — Team legezt: Mohd Jibraan (Team Leader), Syed Salman Razvi, Muskan Begum, Shaista Naaz, Abdul Rahman Mohd Ghouse — card grid with initials avatars
11. **Footer** — logo, tagline, "Made by Team legezt for SIH 2026", copyright © 2026 lezzflow.

## Requirements
- **Fully responsive**: mobile-first, perfect at 360px, 768px, 1440px. Hamburger menu on mobile.
- **Motion**: reveal-on-scroll animations (IntersectionObserver), smooth scrolling, hover lifts, animated gradient orbs, counter animations. Respect `prefers-reduced-motion`.
- **No emojis in UI** — use inline SVG icons only.
- **Accessibility**: semantic HTML, alt text on images, labels on inputs, focus styles, color contrast.
- **Performance**: no heavy libraries; vanilla JS only.
- Images in `assets/images/` may not exist yet — use graceful `onerror` fallbacks or gradient placeholders so the page never looks broken.
- All copy in English.

## Quality bar
This should look like a funded startup's launch page. Generous whitespace, big typography (clamp() fluid type), glass cards, glow effects on the blue accents. Mobile must feel like a native app landing page.
