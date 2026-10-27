# MuseOne Pharma: public site design

## Brief
- **Subject:** MuseOne Pharma, a billing and stock system for retail chemists. It runs in the browser, works offline, and is set up per pharmacy by MuseOne.
- **Audience:** owners of 1 to 3 counter chemist shops in Mumbai. They are practical, short on time, often reading on a phone, and comfortable with English product words (GST, batch, expiry, HSN).
- **Job:** get a demo request (name, shop, mobile, area).
- **Assumptions to confirm:** prices (taken from docs/MARKET-RESEARCH.md), production domain, business contact address, and whether to add Hindi/Marathi copy.

## Concept card
```
Idea:        The bill is the product: show the exact bill a chemist must hand over, and that MuseOne prints it right every time.
Metaphor:    an 80 mm thermal receipt roll
Signature:   the hero receipt (the real <Receipt> component, live text) feeds out of a printer slot on first view
Emotion:     "that's my counter"; recognition, then relief
Motion verb: feed like paper from a receipt printer (one direction, quick start, soft stop)
Screenshot:  the hero, with the receipt carrying batch, expiry, HSN, DL No and the CGST/SGST split
Anchor:      Indian pharmacy bills must carry batch, expiry, drug licence number and GST details, and Schedule H1 sales need a register
```
Concepts I considered and dropped: the green pharmacy cross as a grid system (portable to any pharmacy brand), and a "day at the counter" timeline (good, but weaker on first view than the bill itself).

## System
- **Palette:** ground #f6f5f1 (warm off-white), ink #1c1f1d, muted #5d645f, line #dcdad2, accent #0f5e4b (the pharmacy green, used once per section), paper #fffdf7 (receipt only).
- **Type:** IBM Plex Sans (UI and display, 600, tracking -0.02em at display sizes) and IBM Plex Mono (receipt, prices, keys), the same faces as the product, so the site and the app feel like one thing.
- **Grid:** 12 columns, max 72rem, 16px gutters on phone. Every section uses a different layout family: hero split 7/5, till full-bleed image with a key strip, offline 4/8 with a timeline, stock image over text, compliance two-column table, pricing two plans, form 5/7.
- **Shape:** one radius, 6px (`rounded-ui`). Sections are separated by space and a 1px line, never by shadows.
- **Motion:** CSS only. The receipt feed runs once at about 1.4s on `cubic-bezier(.2,.7,.2,1)`. Buttons nudge 1px on hover and press in on `:active`. The page is still at rest; that is a deliberate choice, because this audience needs to read and act, not watch. There are no GSAP or Lenis dependencies, since one animation doesn't need an engine. Under reduced motion the receipt is simply there.

## Genericness test
- A generic model would have built a centered hero with a laptop mockup and three feature cards. Changed to a real bill, and to real screenshots from the product's own capture script (`pnpm screens`).
- A generic model would have built a 3-tier pricing table. Changed to two plans, matching the market research.
