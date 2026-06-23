# Clinical Projects by San — Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pure static, offline-capable HTML site titled "Clinical Projects by San" that showcases 4 clinical software projects, each with a real, in-browser live demo opened in a new tab.

**Architecture:** Zero-build static site (HTML + one CSS file + one small JS file). Each project's existing self-contained static artifact is *bundled* into `demos/` so the whole folder is shareable and works from `file://`. A shared design-system stylesheet (TraceScribe system from `mydesign.md`) styles every page; project metadata is inlined in HTML (no runtime `fetch`).

**Tech Stack:** HTML5, hand-authored CSS (design tokens reproduced from `mydesign.md`), vanilla JS (theme toggle + animations), locally-bundled woff2 fonts, inline Lucide SVG icons. No framework, no bundler, no backend.

## Global Constraints

Every task implicitly includes these:

- **Site title (verbatim):** `Clinical Projects by San`
- **No build step, no framework, no runtime `fetch()`** — must work by double-clicking `index.html` (`file://`) and via `python3 -m http.server`.
- **Design system = `mydesign.md` (TraceScribe).** Primary teal `#0D9488` / `hsl(168 76% 32%)`; accent coral `#F97316` / `hsl(25 95% 53%)`; warm off-white bg `hsl(30 20% 98%)`; deep-charcoal dark surfaces; fonts **Plus Jakarta Sans** (UI) + **JetBrains Mono** (labels/data); base radius **10px** (cards `16px`, buttons `8px`, badges pill); shadows `shadow-card` → `shadow-card-hover` on hover, `shadow-glow` on primary CTAs; transitions 200–300ms `ease-out`; hover lift `translateY(-2px)`; **light + dark mode**.
- **Demos open in a new tab:** `target="_blank" rel="noopener"`.
- **Demos are bundled & never edited.** `sync-demos.sh` is the ONLY thing that reads from sibling `../ccs-*` folders, and only at author time.
- **Fonts bundled locally** (downloaded once from fontsource jsDelivr) — site renders correctly offline.
- **Lucide icons inline as SVG** (no icon CDN at runtime).
- **Git:** commit after every task. Author `San <san.saha@gmail.com>`. End each commit message with:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- **Working directory:** `/Users/sanman/Documents/Tracescribe-open` (already a git repo).

### Verification convention (this is a static site, not a unit-tested library)

Each task's "test" is a concrete, runnable check: a structural assertion (`test -f`, `grep`)
and/or a browser load via the `mcp__claude-in-chrome__*` tools against a local server.
Start the server once per verification with:
`python3 -m http.server 8000 --directory /Users/sanman/Documents/Tracescribe-open` (run in background),
then navigate to `http://localhost:8000/...`. "Verify it fails first" = confirm the file/route
does not yet render the expected content before building it.

---

### Task 1: Design-system foundation (fonts + `styles.css` + `main.js`)

**Files:**
- Create: `assets/fonts/` (9 woff2 files, downloaded)
- Create: `assets/css/styles.css`
- Create: `assets/js/main.js`
- Temp (not committed): `_smoke.html`

**Interfaces:**
- Produces (consumed by every later page):
  - CSS classes: `.site-header`, `.brand`, `.brand-mark`, `.theme-toggle`, `.container`,
    `.hero`, `.hero-eyebrow`, `.hero-title`, `.accent` (gradient text), `.intro`,
    `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-lg`, `.card-grid`, `.stagger`,
    `.bento`, `.bento-icon`, `.badge`, `.badge-row`, `.status-pill`, `.breadcrumb`,
    `.project-head`, `.shot`, `.shot-strip`, `.site-footer`, `.bg-grid`, `.glow`.
  - JS behaviors (auto-run on `DOMContentLoaded`): theme toggle wired to any
    `[data-theme-toggle]` button (persists to `localStorage["cpbs-theme"]`, default light);
    stamps current year into any `[data-year]` element; adds in-view stagger animation to
    `.stagger > *`.
  - Theme is set via `document.documentElement.dataset.theme = "light" | "dark"`.

- [ ] **Step 1: Create directory structure**

```bash
cd /Users/sanman/Documents/Tracescribe-open
mkdir -p assets/css assets/js assets/fonts assets/img projects demos
```

- [ ] **Step 2: Download and bundle fonts (run once, online)**

```bash
cd /Users/sanman/Documents/Tracescribe-open/assets/fonts
base="https://cdn.jsdelivr.net/fontsource/fonts"
for w in 400 500 600 700 800; do
  curl -fsSL "$base/plus-jakarta-sans@latest/latin-$w-normal.woff2" -o "jakarta-$w.woff2"
done
for w in 400 500 600 700; do
  curl -fsSL "$base/jetbrains-mono@latest/latin-$w-normal.woff2" -o "mono-$w.woff2"
done
ls -l
```

- [ ] **Step 3: Verify fonts downloaded (must fail before Step 2, pass after)**

Run:
```bash
cd /Users/sanman/Documents/Tracescribe-open
ls assets/fonts/jakarta-400.woff2 assets/fonts/jakarta-700.woff2 assets/fonts/jakarta-800.woff2 \
   assets/fonts/mono-500.woff2 assets/fonts/mono-700.woff2 && \
find assets/fonts -name '*.woff2' -size -1k -print  # should print NOTHING (no truncated files)
```
Expected: the 5 files listed exist; the `find` prints nothing (every woff2 is ≥1KB).

- [ ] **Step 4: Write `assets/css/styles.css`**

```css
/* ===== Fonts (bundled, offline) ===== */
@font-face{font-family:'Plus Jakarta Sans';font-weight:400;font-display:swap;src:url('../fonts/jakarta-400.woff2') format('woff2');}
@font-face{font-family:'Plus Jakarta Sans';font-weight:500;font-display:swap;src:url('../fonts/jakarta-500.woff2') format('woff2');}
@font-face{font-family:'Plus Jakarta Sans';font-weight:600;font-display:swap;src:url('../fonts/jakarta-600.woff2') format('woff2');}
@font-face{font-family:'Plus Jakarta Sans';font-weight:700;font-display:swap;src:url('../fonts/jakarta-700.woff2') format('woff2');}
@font-face{font-family:'Plus Jakarta Sans';font-weight:800;font-display:swap;src:url('../fonts/jakarta-800.woff2') format('woff2');}
@font-face{font-family:'JetBrains Mono';font-weight:400;font-display:swap;src:url('../fonts/mono-400.woff2') format('woff2');}
@font-face{font-family:'JetBrains Mono';font-weight:500;font-display:swap;src:url('../fonts/mono-500.woff2') format('woff2');}
@font-face{font-family:'JetBrains Mono';font-weight:600;font-display:swap;src:url('../fonts/mono-600.woff2') format('woff2');}
@font-face{font-family:'JetBrains Mono';font-weight:700;font-display:swap;src:url('../fonts/mono-700.woff2') format('woff2');}

/* ===== Tokens ===== */
:root{
  --font:'Plus Jakarta Sans',system-ui,sans-serif;
  --mono:'JetBrains Mono',ui-monospace,monospace;
  --bg:hsl(30 20% 98%); --card:hsl(0 0% 100%); --muted:hsl(220 14% 96%);
  --fg:hsl(222 47% 11%); --muted-fg:hsl(220 9% 46%);
  --primary:hsl(168 76% 32%); --accent:hsl(25 95% 53%);
  --border:hsl(220 13% 91%); --ring:hsl(168 76% 32%);
  --radius:10px;
  --shadow-card:0 1px 3px 0 rgb(0 0 0/.1),0 1px 2px -1px rgb(0 0 0/.1);
  --shadow-hover:0 10px 15px -3px rgb(0 0 0/.1),0 4px 6px -4px rgb(0 0 0/.1);
  --shadow-glow:0 0 24px -6px hsl(168 76% 32%/.45);
  --grid-line:hsl(220 13% 91%);
}
:root[data-theme="dark"]{
  --bg:hsl(222 47% 6%); --card:hsl(222 47% 9%); --muted:hsl(217 33% 17%);
  --fg:hsl(210 40% 98%); --muted-fg:hsl(215 20% 65%);
  --primary:hsl(168 76% 58%); --accent:hsl(25 95% 63%);
  --border:hsl(217 33% 20%); --grid-line:hsl(217 33% 16%);
  --shadow-card:0 1px 3px 0 rgb(0 0 0/.5);
  --shadow-hover:0 12px 20px -6px rgb(0 0 0/.6);
}

/* ===== Base ===== */
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:var(--font);font-weight:500;background:var(--bg);color:var(--fg);
  line-height:1.6;-webkit-font-smoothing:antialiased;transition:background .2s,color .2s}
a{color:inherit;text-decoration:none}
.container{max-width:1120px;margin:0 auto;padding:0 24px}

/* ===== Grid background + glow (decorative) ===== */
.bg-grid{background-image:
  linear-gradient(to right,var(--grid-line) 1px,transparent 1px),
  linear-gradient(to bottom,var(--grid-line) 1px,transparent 1px);
  background-size:24px 24px;
  -webkit-mask-image:radial-gradient(ellipse 80% 60% at 50% 0%,#000 40%,transparent 100%);
          mask-image:radial-gradient(ellipse 80% 60% at 50% 0%,#000 40%,transparent 100%);}
.glow{position:absolute;top:-120px;left:50%;transform:translateX(-50%);
  width:620px;height:620px;border-radius:50%;
  background:radial-gradient(circle,hsl(168 76% 40%/.18),transparent 60%);
  filter:blur(40px);pointer-events:none;z-index:0}

/* ===== Header ===== */
.site-header{position:sticky;top:0;z-index:50;backdrop-filter:blur(12px);
  background:hsl(0 0% 100%/.7);border-bottom:1px solid var(--border)}
:root[data-theme="dark"] .site-header{background:hsl(222 47% 9%/.7)}
.site-header .container{display:flex;align-items:center;justify-content:space-between;height:64px}
.brand{display:flex;align-items:center;gap:12px;font-weight:800;letter-spacing:-.01em}
.brand-mark{width:32px;height:32px;border-radius:8px;
  background:linear-gradient(135deg,var(--primary),var(--accent))}
.theme-toggle{display:inline-flex;align-items:center;justify-content:center;
  width:40px;height:40px;border-radius:8px;border:1px solid var(--border);
  background:var(--card);cursor:pointer;color:var(--fg);transition:background .2s}
.theme-toggle:hover{background:var(--muted)}
.theme-toggle svg{width:18px;height:18px}

/* ===== Typography helpers ===== */
.eyebrow,.hero-eyebrow{font-family:var(--mono);font-weight:600;text-transform:uppercase;
  letter-spacing:.18em;font-size:11px;color:var(--primary)}
.accent{background:linear-gradient(90deg,var(--primary),var(--accent));
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}

/* ===== Hero ===== */
.hero{position:relative;overflow:hidden;text-align:center;padding:96px 0 72px}
.hero .container{position:relative;z-index:1;max-width:820px}
.hero-title{font-size:clamp(2.6rem,6vw,3.75rem);font-weight:800;letter-spacing:-.02em;
  line-height:1.05;margin:16px 0}
.intro{font-size:clamp(1rem,2.4vw,1.2rem);color:var(--muted-fg);max-width:620px;margin:0 auto 32px}

/* ===== Buttons ===== */
.btn{display:inline-flex;align-items:center;gap:8px;font-family:var(--font);font-weight:600;
  font-size:14px;border-radius:8px;padding:10px 18px;cursor:pointer;border:1px solid transparent;
  transition:transform .2s,box-shadow .2s,background .2s}
.btn svg{width:16px;height:16px}
.btn-lg{padding:13px 28px;font-size:15px}
.btn-primary{background:var(--primary);color:#fff;box-shadow:var(--shadow-glow)}
.btn-primary:hover{transform:translateY(-2px)}
.btn-ghost{background:transparent;color:var(--fg);border-color:var(--border)}
.btn-ghost:hover{background:var(--muted)}

/* ===== Badges / status ===== */
.badge-row{display:flex;flex-wrap:wrap;gap:8px}
.badge{font-family:var(--mono);font-size:11px;font-weight:600;padding:3px 10px;border-radius:999px;
  background:var(--muted);color:var(--muted-fg)}
.status-pill{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;
  padding:4px 11px;border-radius:999px;background:hsl(160 84% 39%/.12);color:hsl(160 84% 32%)}
:root[data-theme="dark"] .status-pill{color:hsl(160 70% 60%)}
.status-pill::before{content:"";width:7px;height:7px;border-radius:50%;background:currentColor}

/* ===== Card grid / bento ===== */
.card-grid{display:grid;grid-template-columns:1fr;gap:24px;padding:8px 0 96px}
@media(min-width:680px){.card-grid{grid-template-columns:repeat(2,1fr)}}
@media(min-width:1000px){.card-grid{grid-template-columns:repeat(3,1fr)}}
.bento{position:relative;display:flex;flex-direction:column;gap:12px;background:var(--card);
  border:1px solid var(--border);border-radius:16px;padding:24px;box-shadow:var(--shadow-card);
  transition:transform .3s,box-shadow .3s}
.bento:hover{transform:translateY(-2px);box-shadow:var(--shadow-hover)}
.bento h3{font-size:20px;font-weight:700;letter-spacing:-.01em}
.bento p{color:var(--muted-fg);font-size:15px;flex:1}
.bento-icon{width:48px;height:48px;border-radius:10px;display:flex;align-items:center;justify-content:center;
  background:linear-gradient(135deg,hsl(168 76% 32%/.12),hsl(25 95% 53%/.12));color:var(--primary)}
.bento-icon svg{width:24px;height:24px}
.bento .more{font-family:var(--mono);font-size:12px;font-weight:600;color:var(--primary);
  display:inline-flex;align-items:center;gap:4px}
.bento::after{content:"";position:absolute;inset:0;border-radius:16px;pointer-events:none}

/* ===== Section header ===== */
.section-head{padding:8px 0 24px}
.section-head h2{font-size:clamp(1.6rem,3.5vw,2.2rem);font-weight:800;letter-spacing:-.015em}

/* ===== Project detail ===== */
.breadcrumb{font-family:var(--mono);font-size:12px;color:var(--muted-fg);
  display:inline-flex;align-items:center;gap:6px;padding:28px 0 0}
.breadcrumb:hover{color:var(--primary)}
.project-head{padding:20px 0 8px;max-width:760px}
.project-head h1{font-size:clamp(2rem,5vw,3rem);font-weight:800;letter-spacing:-.02em;margin:12px 0}
.project-head .lede{font-size:1.15rem;color:var(--muted-fg)}
.detail-actions{display:flex;flex-wrap:wrap;gap:12px;align-items:center;padding:20px 0 8px}
.detail-body{display:grid;gap:14px;max-width:760px;padding:28px 0;color:var(--fg)}
.detail-body h2{font-size:1.25rem;font-weight:700;margin-top:12px}
.detail-body ul{padding-left:20px;color:var(--muted-fg);display:grid;gap:6px}
.shot-strip{padding:8px 0 80px}
.shot{width:100%;border-radius:16px;border:1px solid var(--border);box-shadow:var(--shadow-card)}

/* ===== Footer ===== */
.site-footer{border-top:1px solid var(--border);padding:40px 0;color:var(--muted-fg);font-size:14px}
.site-footer .container{display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px}

/* ===== Animations ===== */
@keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.stagger > *{opacity:0}
.stagger.in > *{animation:fadeInUp .5s ease-out forwards}
.stagger.in > *:nth-child(1){animation-delay:0ms}
.stagger.in > *:nth-child(2){animation-delay:60ms}
.stagger.in > *:nth-child(3){animation-delay:120ms}
.stagger.in > *:nth-child(4){animation-delay:180ms}
@media(prefers-reduced-motion:reduce){.stagger > *{opacity:1;animation:none}}
```

- [ ] **Step 5: Write `assets/js/main.js`**

```js
(function () {
  var KEY = "cpbs-theme";
  var root = document.documentElement;

  function applyTheme(t) {
    root.dataset.theme = t;
    document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
      btn.setAttribute("aria-label", t === "dark" ? "Switch to light mode" : "Switch to dark mode");
      btn.querySelectorAll("svg").forEach(function (svg) {
        svg.style.display = svg.dataset.icon === t ? "none" : "block";
      });
    });
  }

  function init() {
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    applyTheme(saved === "dark" ? "dark" : "light");

    document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var next = root.dataset.theme === "dark" ? "light" : "dark";
        applyTheme(next);
        try { localStorage.setItem(KEY, next); } catch (e) {}
      });
    });

    var y = String(new Date().getFullYear());
    document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = y; });

    var staggers = document.querySelectorAll(".stagger");
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
      }, { threshold: 0.12 });
      staggers.forEach(function (s) { io.observe(s); });
    } else {
      staggers.forEach(function (s) { s.classList.add("in"); });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
```

> **DRY note for later tasks:** the theme toggle button + its two icons are reused on every
> page. The canonical markup (copy verbatim into each page's header) is:
> ```html
> <button class="theme-toggle" data-theme-toggle aria-label="Toggle theme">
>   <svg data-icon="dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
>   <svg data-icon="light" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>
> </button>
> ```
> (`main.js` shows the sun in light mode and the moon in dark mode automatically.)

- [ ] **Step 6: Write a temporary smoke page `_smoke.html` to eyeball the system**

```html
<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>smoke</title><link rel="stylesheet" href="assets/css/styles.css"></head>
<body>
<header class="site-header"><div class="container">
  <a class="brand"><span class="brand-mark"></span>Clinical Projects by San</a>
  <button class="theme-toggle" data-theme-toggle aria-label="Toggle theme">
    <svg data-icon="dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
    <svg data-icon="light" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>
  </button>
</div></header>
<section class="hero"><div class="bg-grid" style="position:absolute;inset:0"></div><div class="glow"></div>
  <div class="container"><span class="hero-eyebrow">Smoke test</span>
  <h1 class="hero-title">Teal, coral, <span class="accent">and the type scale.</span></h1>
  <p class="intro">If this is Plus Jakarta Sans with a teal→coral gradient word, tokens load.</p>
  <a class="btn btn-primary btn-lg">Primary CTA</a></div></section>
<script src="assets/js/main.js"></script></body></html>
```

- [ ] **Step 7: Verify in browser (must look unstyled/serif before Step 4, correct after)**

Start a background server, then load the smoke page with the browser tools:
```bash
python3 -m http.server 8000 --directory /Users/sanman/Documents/Tracescribe-open
```
Navigate to `http://localhost:8000/_smoke.html`. Confirm: Plus Jakarta Sans renders; the
accent word shows a teal→coral gradient; the primary button has a teal glow; clicking the
toggle flips to dark mode (charcoal bg, brighter teal) and the icon swaps. Capture a
light-mode and a dark-mode screenshot as evidence.

- [ ] **Step 8: Delete the smoke page and commit the foundation**

```bash
cd /Users/sanman/Documents/Tracescribe-open
rm _smoke.html
git add assets/
git -c user.name="San" -c user.email="san.saha@gmail.com" commit -m "Add TraceScribe design-system foundation (fonts, styles.css, main.js)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Sync script + bundle the four live demos

**Files:**
- Create: `sync-demos.sh`
- Create (generated): `demos/cdisc/`, `demos/ncdisc/`, `demos/timelines.html`, `demos/monitoring.html`

**Interfaces:**
- Produces (consumed by detail pages in Tasks 4–5): bundled artifacts at exactly
  `demos/cdisc/index.html`, `demos/ncdisc/index.html`, `demos/timelines.html`,
  `demos/monitoring.html`.

- [ ] **Step 1: Write `sync-demos.sh`**

```bash
#!/usr/bin/env bash
# Copies each clinical project's self-contained static demo into ./demos/.
# This is the ONLY script that reads from the sibling ../ccs-* folders. Re-run when a
# source project changes. Safe & idempotent.
set -euo pipefail
cd "$(dirname "$0")"
SRC=".."

copy_dir() { # $1 src dir  $2 dest dir
  if [ ! -d "$1" ]; then echo "MISSING dir: $1" >&2; return 1; fi
  rm -rf "$2"; mkdir -p "$2"; cp -R "$1"/. "$2"/; echo "bundled $2/"
}
copy_file() { # $1 src file  $2 dest file
  if [ ! -f "$1" ]; then echo "MISSING file: $1" >&2; return 1; fi
  mkdir -p "$(dirname "$2")"; cp "$1" "$2"; echo "bundled $2"
}

copy_dir  "$SRC/ccs-cdisc-demo/site"                   "demos/cdisc"
copy_dir  "$SRC/ccs-ncdisc-demo/site"                  "demos/ncdisc"
copy_file "$SRC/ccs-timelines/CCS_Clinical_Timeline.html" "demos/timelines.html"
copy_file "$SRC/ccs-monitoring/ccs-monitor-demo.html"  "demos/monitoring.html"

echo "Done. Demos bundled into ./demos/"
```

- [ ] **Step 2: Run it**

```bash
cd /Users/sanman/Documents/Tracescribe-open
chmod +x sync-demos.sh
./sync-demos.sh
```
Expected: four `bundled ...` lines, ending `Done.`

- [ ] **Step 3: Verify artifacts present and non-empty (fails before Step 2, passes after)**

```bash
cd /Users/sanman/Documents/Tracescribe-open
ls -l demos/cdisc/index.html demos/ncdisc/index.html demos/timelines.html demos/monitoring.html
```
Expected: all four exist, each > 0 bytes.

- [ ] **Step 4: Verify each demo loads & is interactive (browser)**

With the server running, navigate to each and confirm it renders real content (not a blank
page / error):
- `http://localhost:8000/demos/cdisc/index.html`
- `http://localhost:8000/demos/ncdisc/index.html`
- `http://localhost:8000/demos/timelines.html`
- `http://localhost:8000/demos/monitoring.html`

- [ ] **Step 5: Commit**

```bash
cd /Users/sanman/Documents/Tracescribe-open
git add sync-demos.sh demos/
git -c user.name="San" -c user.email="san.saha@gmail.com" commit -m "Add sync-demos.sh and bundle the four live demo artifacts

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Capture demo screenshots

**Files:**
- Create: `assets/img/cdisc.png`, `assets/img/ncdisc.png`, `assets/img/timelines.png`, `assets/img/monitoring.png`

**Interfaces:**
- Produces (consumed by detail pages): one screenshot per project at the paths above.

- [ ] **Step 1: Capture each demo at a 1280×800 viewport**

With the server running and the browser tools, for each of the four demo URLs from Task 2
Step 4: resize the window to ~1280×800, navigate, let it settle, and save a screenshot to the
corresponding `assets/img/<name>.png` (`cdisc`, `ncdisc`, `timelines`, `monitoring`). Capture
the most representative above-the-fold view of each demo.

- [ ] **Step 2: Verify screenshots exist and are real images (fails before, passes after)**

```bash
cd /Users/sanman/Documents/Tracescribe-open
ls -l assets/img/{cdisc,ncdisc,timelines,monitoring}.png
find assets/img -name '*.png' -size -5k -print   # should print nothing (no tiny/blank shots)
```
Expected: four PNGs, each ≥ 5KB.

- [ ] **Step 3: Commit**

```bash
cd /Users/sanman/Documents/Tracescribe-open
git add assets/img/
git -c user.name="San" -c user.email="san.saha@gmail.com" commit -m "Add demo screenshots for project detail pages

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Detail-page template + CDISC detail page (vertical slice)

**Files:**
- Create: `projects/cdisc.html`

**Interfaces:**
- Consumes: `../assets/css/styles.css`, `../assets/js/main.js`, `../assets/img/cdisc.png`,
  demo at `../demos/cdisc/index.html`.
- Produces: the **canonical detail-page template** reused verbatim in Task 5 (only the
  per-project content block changes).

- [ ] **Step 1: Write `projects/cdisc.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>CDISC Submission Pipeline — Clinical Projects by San</title>
  <link rel="stylesheet" href="../assets/css/styles.css">
</head>
<body>
  <header class="site-header"><div class="container">
    <a class="brand" href="../index.html"><span class="brand-mark"></span>Clinical Projects by San</a>
    <button class="theme-toggle" data-theme-toggle aria-label="Toggle theme">
      <svg data-icon="dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
      <svg data-icon="light" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>
    </button>
  </div></header>

  <main class="container">
    <a class="breadcrumb" href="../index.html">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
      All projects
    </a>

    <section class="project-head">
      <span class="eyebrow">CDISC · SUBMISSION PIPELINE</span>
      <h1>CDISC Submission Pipeline</h1>
      <p class="lede">Raw EDC → SDTM → ADaM → TFL for a fictional Phase 1 heart-failure study, with every layer independently double-programmed in R and QC'd to zero differences.</p>
    </section>

    <div class="detail-actions">
      <a class="btn btn-primary btn-lg" href="../demos/cdisc/index.html" target="_blank" rel="noopener">
        Launch live demo
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg>
      </a>
      <span class="status-pill">Runs in your browser</span>
    </div>

    <section class="detail-body">
      <h2>What it does</h2>
      <p>Transforms raw EDC extracts through the standard clinical submission layers and produces define.xml, specs, and a coding dictionary at each stage.</p>
      <h2>How it works</h2>
      <ul>
        <li>Python builds SDTM, ADaM, and 16 TFL tables from the raw EDC.</li>
        <li>An independent R re-implementation re-derives every output and compares it (diffdf for datasets, cell-by-cell for tables).</li>
        <li>The QC target is always zero differences; a negative-control mode proves the QC catches injected errors.</li>
      </ul>
      <div class="badge-row" style="margin-top:8px">
        <span class="badge">Python</span><span class="badge">R</span>
        <span class="badge">CDISC</span><span class="badge">define.xml</span><span class="badge">Double programming</span>
      </div>
    </section>

    <section class="shot-strip">
      <img class="shot" src="../assets/img/cdisc.png" alt="Screenshot of the CDISC pipeline demo site">
    </section>
  </main>

  <footer class="site-footer"><div class="container">
    <span>Clinical Projects by San</span><span>© <span data-year></span></span>
  </div></footer>
  <script src="../assets/js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verify in browser (fails before Step 1 — 404, passes after)**

Navigate to `http://localhost:8000/projects/cdisc.html`. Confirm: header/brand link, the
title and lede render in the design system; clicking **Launch live demo** opens
`demos/cdisc/index.html` in a NEW tab; the screenshot shows; the theme toggle works; the
breadcrumb "All projects" points home. Capture a screenshot.

- [ ] **Step 3: Commit**

```bash
cd /Users/sanman/Documents/Tracescribe-open
git add projects/cdisc.html
git -c user.name="San" -c user.email="san.saha@gmail.com" commit -m "Add CDISC project detail page (detail-page template)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Remaining three detail pages (ncdisc, timelines, monitoring)

**Files:**
- Create: `projects/ncdisc.html`, `projects/timelines.html`, `projects/monitoring.html`

**Interfaces:**
- Consumes: same shared assets as Task 4, plus screenshots `ncdisc.png`, `timelines.png`,
  `monitoring.png`, and demos `../demos/ncdisc/index.html`, `../demos/timelines.html`,
  `../demos/monitoring.html`.

For each page below: **copy `projects/cdisc.html` verbatim**, then change the `<title>`, the
`<section class="project-head">` block, the **Launch** link `href`, the `detail-body`
content + badges, and the screenshot `src` + `alt` per this table. Everything else (header,
footer, breadcrumb, scripts, classes) stays identical.

| Field | ncdisc.html | timelines.html | monitoring.html |
|---|---|---|---|
| `<title>` | `Non-CDISC Analysis Pipeline — Clinical Projects by San` | `Clinical Trial Timeline — Clinical Projects by San` | `Clinical Monitoring — Clinical Projects by San` |
| eyebrow | `NON-CDISC · ANALYSIS PIPELINE` | `SCHEDULING · CRITICAL PATH` | `OVERSIGHT · RISK-BASED MONITORING` |
| `<h1>` | `Non-CDISC Analysis Pipeline` | `Clinical Trial Timeline` | `Clinical Monitoring` |
| lede | `Analysis datasets and a full TFL package built directly from raw EDC, with an end-to-end QC closure trail.` | `A validated critical-path (CPM) engine that turns a study's visit schedule into an editable timeline and milestone rail.` | `Risk-based monitoring views over trial conduct, data quality, and site performance for the HF-1002 study.` |
| Launch `href` | `../demos/ncdisc/index.html` | `../demos/timelines.html` | `../demos/monitoring.html` |
| "What it does" | `Derives analysis-ready datasets and the final tables/figures/listings package from raw EDC without the CDISC intermediate layers.` | `Computes the full study schedule server-side from study parameters and renders it as an on-brand, inline-editable spreadsheet plus milestone rail.` | `Surfaces the signals a monitor needs — enrollment, query burden, protocol deviations, and site KPIs — in one clinical brief.` |
| "How it works" (`<ul>` items) | `<li>Builds analysis datasets, then generates populated tables.</li><li>Codes adverse events to MedDRA SOC/PT.</li><li>Ships a QC closure memo documenting the review trail.</li>` | `<li>A Python CPM engine is the single source of truth for the schedule.</li><li>The timeline renders as an editable spreadsheet with an xlsx round-trip.</li><li>This single-file prototype is the design/behavior reference for the productionized app.</li>` | `<li>Aggregates trial-conduct metrics into monitor-facing views.</li><li>Highlights risk indicators and site outliers.</li><li>Presents a concise, on-brand clinical monitoring brief.</li>` |
| badges | `Python` `TFL` `MedDRA` `QC closure` | `CPM engine` `Scheduling` `xlsx` `Interactive` | `Monitoring` `Risk-based` `Dashboard` |
| screenshot `src` | `../assets/img/ncdisc.png` | `../assets/img/timelines.png` | `../assets/img/monitoring.png` |
| screenshot `alt` | `Screenshot of the non-CDISC analysis pipeline demo` | `Screenshot of the clinical trial timeline demo` | `Screenshot of the clinical monitoring demo` |

- [ ] **Step 1: Create `projects/ncdisc.html`** from the template + the ncdisc column above.
- [ ] **Step 2: Create `projects/timelines.html`** from the template + the timelines column above.
- [ ] **Step 3: Create `projects/monitoring.html`** from the template + the monitoring column above.

- [ ] **Step 4: Verify all three in browser (fails before — 404s, passes after)**

Navigate to each (`/projects/ncdisc.html`, `/projects/timelines.html`,
`/projects/monitoring.html`). For each confirm: correct title/lede/badges; **Launch live
demo** opens the matching demo in a new tab; screenshot renders; toggle + breadcrumb work.

- [ ] **Step 5: Commit**

```bash
cd /Users/sanman/Documents/Tracescribe-open
git add projects/ncdisc.html projects/timelines.html projects/monitoring.html
git -c user.name="San" -c user.email="san.saha@gmail.com" commit -m "Add ncdisc, timelines, and monitoring detail pages

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Landing page (`index.html`)

**Files:**
- Create: `index.html`

**Interfaces:**
- Consumes: `assets/css/styles.css`, `assets/js/main.js`, and links to
  `projects/{cdisc,ncdisc,timelines,monitoring}.html` (all exist after Task 5).

- [ ] **Step 1: Write `index.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Clinical Projects by San</title>
  <meta name="description" content="A working showcase of clinical-trial software — CDISC pipelines, schedule engines, and monitoring — each running live in your browser.">
  <link rel="stylesheet" href="assets/css/styles.css">
</head>
<body>
  <header class="site-header"><div class="container">
    <a class="brand" href="index.html"><span class="brand-mark"></span>Clinical Projects by San</a>
    <button class="theme-toggle" data-theme-toggle aria-label="Toggle theme">
      <svg data-icon="dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
      <svg data-icon="light" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>
    </button>
  </div></header>

  <section class="hero">
    <div class="bg-grid" style="position:absolute;inset:0"></div>
    <div class="glow"></div>
    <div class="container">
      <span class="hero-eyebrow">◢ Clinical software portfolio</span>
      <h1 class="hero-title">Clinical-trial tooling, <span class="accent">built to submit.</span></h1>
      <p class="intro">A working showcase of clinical software I've built — CDISC pipelines with independent QC, a critical-path schedule engine, and risk-based monitoring. Every project below runs live in your browser.</p>
      <a class="btn btn-primary btn-lg" href="#projects">Explore projects
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
      </a>
    </div>
  </section>

  <main class="container" id="projects">
    <div class="section-head"><h2>Projects</h2></div>
    <div class="card-grid stagger">

      <a class="bento" href="projects/cdisc.html">
        <span class="bento-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l9 5-9 5-9-5 9-5z"/><path d="M3 12l9 5 9-5"/><path d="M3 17l9 5 9-5"/></svg></span>
        <h3>CDISC Submission Pipeline</h3>
        <p>Raw EDC → SDTM → ADaM → TFL, with every layer independently double-programmed in R.</p>
        <div class="badge-row"><span class="badge">Python</span><span class="badge">R</span><span class="badge">CDISC</span></div>
        <span class="more">View →</span>
      </a>

      <a class="bento" href="projects/ncdisc.html">
        <span class="bento-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v18H3z"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg></span>
        <h3>Non-CDISC Analysis Pipeline</h3>
        <p>Analysis datasets and a full TFL package from raw EDC, with a complete QC closure trail.</p>
        <div class="badge-row"><span class="badge">Python</span><span class="badge">TFL</span><span class="badge">QC</span></div>
        <span class="more">View →</span>
      </a>

      <a class="bento" href="projects/timelines.html">
        <span class="bento-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></span>
        <h3>Clinical Trial Timeline</h3>
        <p>A critical-path schedule engine rendered as an editable timeline and milestone rail.</p>
        <div class="badge-row"><span class="badge">CPM engine</span><span class="badge">Scheduling</span><span class="badge">Interactive</span></div>
        <span class="more">View →</span>
      </a>

      <a class="bento" href="projects/monitoring.html">
        <span class="bento-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l3 8 4-16 3 8h4"/></svg></span>
        <h3>Clinical Monitoring</h3>
        <p>Risk-based monitoring views over trial conduct, data quality, and site performance.</p>
        <div class="badge-row"><span class="badge">Monitoring</span><span class="badge">Risk-based</span><span class="badge">Dashboard</span></div>
        <span class="more">View →</span>
      </a>

    </div>
  </main>

  <footer class="site-footer"><div class="container">
    <span>Clinical Projects by San</span><span>© <span data-year></span></span>
  </div></footer>
  <script src="assets/js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verify in browser (fails before Step 1, passes after)**

Navigate to `http://localhost:8000/` (and also open `index.html` directly via `file://` to
confirm zero-server use works). Confirm: hero with gradient accent word, grid + glow; four
cards in a responsive grid; cards fade in (stagger) and lift on hover; each card opens its
detail page; theme toggle persists across navigation (toggle to dark, click into a project,
confirm still dark). Capture light + dark screenshots of the landing page.

- [ ] **Step 3: Commit**

```bash
cd /Users/sanman/Documents/Tracescribe-open
git add index.html
git -c user.name="San" -c user.email="san.saha@gmail.com" commit -m "Add landing page with hero and project card grid

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: README + final end-to-end verification

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write `README.md`**

```markdown
# Clinical Projects by San

A static showcase of clinical-trial software, each project running live in your browser.

## View it

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```
(Opening `index.html` directly via `file://` also works — there is no build step and no
server requirement.)

## Structure

- `index.html` — landing page (hero + project cards)
- `projects/*.html` — one detail page per project, each with a "Launch live demo" button
- `demos/` — the bundled, self-contained live demos (copied in by `sync-demos.sh`)
- `assets/` — design system (`css`, `js`), bundled `fonts`, and `img` screenshots
- `mydesign.md` — the TraceScribe design system this site is built on

## Updating the demos

The demos are copies of the sibling project folders. To refresh them after a source
project changes:

```bash
./sync-demos.sh
```

## Adding a project

1. Add its self-contained artifact to `demos/` (and a line in `sync-demos.sh`).
2. Copy an existing page in `projects/` and edit the content block + Launch link + screenshot.
3. Add a card to the grid in `index.html`.
```

- [ ] **Step 2: Full click-through verification (browser)**

With the server running, walk the whole flow and capture screenshots as evidence:
1. Load `/` — landing renders, 4 cards, light + dark both correct.
2. Click each of the 4 cards → its detail page renders correctly.
3. On each detail page, click **Launch live demo** → the correct demo opens in a new tab and
   is interactive.
4. Toggle dark mode, navigate between pages → preference persists.
5. Narrow the viewport to ~390px → grid collapses to one column, header still usable.

Confirm there are NO broken links and NO console errors. If anything fails, fix it and re-verify
before committing.

- [ ] **Step 3: Commit**

```bash
cd /Users/sanman/Documents/Tracescribe-open
git add README.md
git -c user.name="San" -c user.email="san.saha@gmail.com" commit -m "Add README and finalize showcase

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Plan self-review

- **Spec coverage:** architecture/structure → Tasks 1,2,6; design system → Task 1; bundled
  demos + sync → Task 2; new-tab launch → Tasks 4,5; landing + detail pages → Tasks 4,5,6;
  screenshots/inline preview → Task 3; offline fonts → Task 1; edge-case "demo unavailable" /
  non-self-contained fallback → not built (all 4 POC demos are self-contained; documented in
  spec as future-only — no task needed for the POC); verification → Task 7. ✔ All POC
  requirements map to a task.
- **Placeholder scan:** no TBD/TODO; all code and per-project content is concrete (Task 5
  table gives exact strings). ✔
- **Type/name consistency:** CSS class names, `data-theme-toggle`, `data-year`, `localStorage`
  key `cpbs-theme`, and demo paths (`demos/cdisc/index.html`, `demos/ncdisc/index.html`,
  `demos/timelines.html`, `demos/monitoring.html`) are used identically across Tasks 1–7. ✔
```
