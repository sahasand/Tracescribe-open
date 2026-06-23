# Clinical Projects by San — Showcase (POC) Design

**Date:** 2026-06-23
**Status:** Approved (brainstorming) — pending spec review
**Owner:** San

## Summary

A static HTML website titled **"Clinical Projects by San"** that showcases a curated
set of clinical software demos. The proof of concept features **four** projects, each
presented on a polished, on-brand detail page with a **"Launch live demo →"** button
that opens the project's existing self-contained static artifact in a **new browser
tab**. The site is pure static HTML/CSS/JS — no build step, no framework, no backend —
and is fully self-contained so the whole folder can be opened locally or shared as-is.

It is designed to extend trivially to the rest of San's clinical projects later (add a
card + detail page + bundled artifact).

## Goals

- Present 4 clinical projects as a coherent, premium body of work.
- Each project offers a **real, interactive in-browser demo** (not just screenshots).
- Single deployable/shareable artifact; works locally with zero servers.
- Faithfully apply the **TraceScribe design system** (`mydesign.md`).

## Non-goals (YAGNI)

- No CMS, no React/framework, no bundler/build step.
- No backend, no Docker, no Supabase, no live API calls.
- No search/filtering, tagging, or pagination.
- No about/contact page for the POC.
- No hosting/deployment work — **local-only for now** (hosting decided later).

## POC projects

| Project | Source folder (sibling) | Bundled demo artifact |
|---|---|---|
| **CDISC pipeline** | `../ccs-cdisc-demo/` | `site/` (built static site) |
| **Non-CDISC pipeline** | `../ccs-ncdisc-demo/` | `site/` (built static site) |
| **Clinical Timelines** | `../ccs-timelines/` | `CCS_Clinical_Timeline.html` (single file) |
| **Clinical Monitoring** | `../ccs-monitoring/` | `ccs-monitor-demo.html` (single file) |

All four artifacts were verified self-contained: no `fetch`/`axios`/`localhost`/backend
calls. They reference only Google Fonts + a CDN library, which degrade gracefully.

## Architecture

A pure static site in the current directory (`Tracescribe-open/`). It **bundles** each
project's existing static demo so the site never depends on the sibling folders at
runtime.

```
Tracescribe-open/
├── index.html                 # Landing: hero + project card grid
├── projects/
│   ├── cdisc.html
│   ├── ncdisc.html
│   ├── timelines.html
│   └── monitoring.html
├── demos/                     # Bundled, self-contained live demos
│   ├── cdisc/                 # ← copied from ../ccs-cdisc-demo/site/
│   ├── ncdisc/                # ← copied from ../ccs-ncdisc-demo/site/
│   ├── timelines.html         # ← copied from ../ccs-timelines/CCS_Clinical_Timeline.html
│   └── monitoring.html        # ← copied from ../ccs-monitoring/ccs-monitor-demo.html
├── assets/
│   ├── css/styles.css         # TraceScribe design tokens + components
│   ├── js/main.js             # theme toggle, stagger animations
│   ├── fonts/                 # bundled Plus Jakarta Sans + JetBrains Mono (offline)
│   └── img/                   # screenshots, favicon, logo, og image
├── sync-demos.sh              # re-copies artifacts from ../ccs-* when they change
└── docs/superpowers/specs/    # this design doc
```

### Component boundaries

- **`assets/css/styles.css`** — single source of truth for the design system (tokens +
  component classes: cards, buttons, badges, header/footer, grid background, glows).
  Consumed by every page; pages do not define bespoke styles.
- **`assets/js/main.js`** — small, dependency-free: dark/light toggle (persisted to
  `localStorage`), stagger-in animations, year stamp. Shared by all pages.
- **`index.html`** — landing page only; renders the card grid. Project metadata is
  inlined as HTML (no data fetch).
- **`projects/*.html`** — one self-contained detail page per project; identical
  header/footer/shell, project-specific content in the middle.
- **`demos/*`** — opaque, bundled third-party artifacts; never edited by the showcase.
- **`sync-demos.sh`** — the only thing that touches the sibling project folders, and
  only at author time (not runtime).

## Design system (from `mydesign.md` — TraceScribe)

- **Type:** Plus Jakarta Sans (UI/headings), JetBrains Mono (labels/code/data).
  Bold `tracking-tight` headlines; `gradient-text` (teal→coral) for accent words.
- **Color:** primary teal `#0D9488`, accent coral `#F97316`, warm off-white background
  `hsl(30 20% 98%)`, deep-charcoal dark surfaces, full **light + dark mode**.
- **Shape/depth:** 10px base radius (cards `rounded-2xl`/16px, buttons `rounded-md`,
  badges pill), `shadow-card` resting → `shadow-card-hover` on hover, `shadow-glow` on
  primary CTAs. 200–300ms `ease-out` transitions; hover lift `-translate-y-0.5`.
- **Texture:** subtle `bg-grid` (24px) and a soft teal radial glow behind the hero.
- **Icons:** Lucide (inline SVG to stay offline-safe).
- **Implementation note:** the guide is expressed in Tailwind utility classes; the POC
  reproduces the needed tokens/utilities in a hand-authored `styles.css` so the site
  stays a zero-build, offline-capable static bundle (no Tailwind CDN dependency).

## Pages

### Landing (`index.html`)
Sticky header (wordmark "Clinical Projects by San" + dark-mode toggle). Hero: bold
headline with one gradient accent word, one-line intro, teal radial glow + grid
background. Below: a **bento card grid** (`1 / md:2 / lg:3` columns, `stagger-children`
fade-in-up) — one card per project: gradient icon box, title, one-line description, tech
badges, status pill, "View →". Card hover lifts + deepens shadow. Footer with year +
attribution.

### Project detail (`projects/*.html`)
Breadcrumb (← back to all projects), project title + summary, a short "what it does /
how it works / the QC story" writeup, a screenshot strip, tech-stack badges, and a
prominent **"Launch live demo →"** button (`target="_blank"`, `shadow-glow`) pointing at
the bundled `demos/...` artifact. Shared header/footer.

## Demo launch & data flow

- **Author time:** `sync-demos.sh` copies each artifact into `demos/`. Idempotent;
  re-run when a source project changes.
- **Runtime:** "Launch live demo" opens the bundled artifact in a **new tab**. Chosen
  over inline `<iframe>` because local-file iframes are blocked in some browsers; new-tab
  is the most robust on `file://`. Inline **screenshots** on the detail page provide a
  live preview without launching.
- **No `fetch()`** anywhere in the showcase — all metadata is inlined — so the site works
  by double-clicking `index.html`. A local static server
  (`python3 -m http.server`) is the recommended way to view but is not required.

## Edge cases & fallbacks

- **Non-self-contained future project** (needs a backend) → its card/detail page shows
  screenshots + a "requires its backend — code available" note instead of a launch
  button. None of the 4 POC projects need this.
- **Offline** → fonts are bundled locally; the showcase renders correctly with no
  internet. The bundled demos' own external font/CDN calls degrade gracefully.
- **Missing/broken artifact** → detail page renders a tidy "demo unavailable" state, not
  a dead link.

## Verification

After build, serve locally and confirm by clicking through:
1. Landing renders; all 4 cards present, hover/animations work.
2. Each card → its detail page (4 pages).
3. Each detail page → **launch** opens the correct bundled demo in a new tab and the demo
   is interactive (4 demos).
4. Light/dark toggle works and persists.
5. Responsive at mobile + desktop widths.

Capture screenshots as evidence of the above.

## Future extension

Adding a project later = (1) add its artifact to `demos/` (and to `sync-demos.sh`),
(2) add a detail page in `projects/`, (3) add a card to the landing grid. No structural
changes required.
