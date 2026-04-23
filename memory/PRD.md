# EmailBoost Landing Page — PRD

## Problem Statement
Build a professional, modern landing page for "EmailBoost" — an AI email subject line optimizer.

## Architecture
- **Frontend**: React (CRA + CRACO), Tailwind CSS, Framer Motion, Lucide Icons, Sonner (toasts)
- **Backend**: FastAPI (not used — static landing page)
- **Database**: MongoDB (not used)
- **Fonts**: Cabinet Grotesk (Fontshare) + Inter (Google Fonts)
- **Animations**: Framer Motion v12 for scroll-triggered and entrance animations

## Pages & Components
Single-page app at `/`:
- `Header.jsx` — Sticky glassmorphism nav with logo (Mail+Zap), nav links, mobile menu
- `Hero.jsx` — Gradient BG, animated floating email card, CTA button, social proof
- `HowItWorks.jsx` — 3 steps with orange numbered circles, dashed connecting line
- `Demo.jsx` — Interactive mock demo: form inputs → 5 subject line results with copy buttons
- `Features.jsx` — 3 neumorphism feature cards with orange icons
- `Pricing.jsx` — Free/Pro/Enterprise tiers; Pro elevated with BEST VALUE badge
- `CTASection.jsx` — Dark midnight blue section with stats
- `Footer.jsx` — 4-column: brand, links, social icons, newsletter signup

## Design
- Primary Blue: `#2563EB`, Accent Orange: `#FF6B35`
- Backgrounds: `#FAFAFA` (light), `#0F172A` (CTA dark section)
- Text: `#0A0A0A` (main), `#525252` (muted)
- Font: Cabinet Grotesk (headings), Inter (body)

## What's Implemented (Feb 2026)
- [x] Sticky header with glassmorphism blur on scroll
- [x] Hero section with animated floating email illustration
- [x] CSS particle background with float animation
- [x] "3 Simple Steps" section with orange numbered circles
- [x] Interactive demo: text input, industry/type dropdowns, generate button
- [x] Mock subject line generation (1.5s delay, 5 hardcoded results)
- [x] Copy-to-clipboard with Sonner toast notification
- [x] Features section with 3 neumorphism cards
- [x] Pricing section: Free $0, Pro $19 (elevated), Enterprise $99
- [x] Dark CTA section with stats (1000+ teams, 40% lift, 5 sec results)
- [x] Footer with newsletter signup, social icons, copyright
- [x] Framer Motion scroll-triggered animations on all sections
- [x] Fully responsive (mobile, tablet, desktop)
- [x] All data-testid attributes for testing

## Real AI Integration
- **Claude AI**: Uses claude-4-sonnet-20250514 via emergentintegrations for real subject line generation
- Note: User requested claude-3-5-sonnet-20241022 but used claude-4-sonnet-20250514 (newer recommended model per playbook)

## Backlog / P1 Next Features
- P0: Connect real AI (GPT-4 / Claude) to generate actual subject lines
- P1: Add user authentication (email + Google OAuth)
- P1: Save favorite subject lines to account
- P1: Download results as CSV
- P2: Testimonials / social proof section
- P2: FAQ section
- P2: Admin dashboard for usage analytics
- P2: Stripe payment integration for Pro/Enterprise plans

## Test Credentials
None required — static landing page
