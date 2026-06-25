(function () {
  var KEY = "cpbs-theme";
  var JKEY = "cpbs-journey";
  var root = document.documentElement;

  // Follow-the-trial journey: the canonical ordered walk through every demo as one HFrEF
  // Phase 3 trial, narrated with HF-001 as the story's protagonist. HF-001 is the narration's
  // through-line only; it is NOT a real ID in any demo (the demos use their own subject
  // schemes), so no stop ever tells you to "find HF-001" in a demo. `showsSubjects` flags the
  // demos that render subject-level records and only drives an honest note. This array is the
  // single source for the journey ORDER; the homepage pills are stamped from it at runtime.
  var JOURNEY = [
    { href: "projects/feasibility.html", phase: "Feasibility", phaseNum: 1, title: "Feasibility Workbench",
      narr: "Before HF-001 can enroll, can the trial enroll at all? Size the eligible pool and model the enrollment curve." },
    { href: "projects/clinical-intelligence.html", phase: "Feasibility", phaseNum: 1, title: "Clinical Intelligence",
      narr: "Scan ClinicalTrials.gov: who else is recruiting the patients HF-001 will come from?" },
    { href: "projects/icf.html", phase: "Design & start-up", phaseNum: 2, title: "ICF Generation",
      narr: "The protocol is locked. Generate the consent form HF-001 signs before any procedure." },
    { href: "projects/sites.html", phase: "Design & start-up", phaseNum: 2, title: "Site Activation Tracker",
      narr: "Stand up the sites. HF-001 will enroll at one of them once it clears activation." },
    { href: "projects/rtsm-irt.html", phase: "Randomize & supply", phaseNum: 3, title: "Randomization & Trial Supply",
      narr: "HF-001 is screened, eligible, and randomized to active 100 mg, and a kit is dispensed.", showsSubjects: true },
    { href: "projects/edc-capture.html", phase: "Capture & manage", phaseNum: 4, title: "EDC Data Capture",
      narr: "HF-001's visit data is entered on the eCRF, with live branching and validation.", showsSubjects: true },
    { href: "projects/dm-dashboard.html", phase: "Capture & manage", phaseNum: 4, title: "Data Management Dashboard",
      narr: "HF-001's site sits in the data-management queue: open queries, lock readiness." },
    { href: "projects/data-reconciliation.html", phase: "Capture & manage", phaseNum: 4, title: "Data Reconciliation",
      narr: "HF-001's local labs are reconciled against the central-lab feed.", showsSubjects: true },
    { href: "projects/medical-coding.html", phase: "Capture & manage", phaseNum: 4, title: "Medical Coding",
      narr: "HF-001 reports an adverse event; the verbatim term is coded to MedDRA.", showsSubjects: true },
    { href: "projects/monitoring.html", phase: "Monitor & safety", phaseNum: 5, title: "Clinical Monitoring",
      narr: "A monitor reviews HF-001's site for protocol deviations and source-data verification." },
    { href: "projects/safety-pv.html", phase: "Monitor & safety", phaseNum: 5, title: "Pharmacovigilance",
      narr: "HF-001's serious adverse event becomes an ICSR on the expedited reporting clock.", showsSubjects: true },
    { href: "projects/cdisc.html", phase: "Analyze", phaseNum: 6, title: "CDISC Pipeline",
      narr: "HF-001's collected data is standardized into CDISC SDTM." },
    { href: "projects/biometrics-pipeline.html", phase: "Analyze", phaseNum: 6, title: "ADaM & TLF Pipeline",
      narr: "HF-001's SDTM records derive into ADaM and roll up into the TLF tables that go in the CSR.", showsSubjects: true },
    { href: "projects/ncdisc.html", phase: "Analyze", phaseNum: 6, title: "Non-CDISC Pipeline",
      narr: "The same standardization for HF-001's data, the non-CDISC route." },
    { href: "projects/biostats.html", phase: "Analyze", phaseNum: 6, title: "Clinical Trial Analytics",
      narr: "HF-001's outcomes feed the trial-level analytics." },
    { href: "projects/pk-analysis.html", phase: "Analyze", phaseNum: 6, title: "PK Analysis",
      narr: "HF-001's drug concentrations feed the PK and NCA analysis." },
    { href: "projects/ectd.html", phase: "Submit", phaseNum: 7, title: "CSR eCTD Publishing",
      narr: "The trial is done. HF-001's contribution is packaged into the eCTD dossier for the regulator." }
  ];

  function applyTheme(t) {
    root.dataset.theme = t;
    document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
      btn.setAttribute("aria-label", t === "dark" ? "Switch to light mode" : "Switch to dark mode");
      btn.querySelectorAll("svg").forEach(function (svg) {
        svg.style.display = svg.dataset.icon === t ? "none" : "block";
      });
    });
  }

  // Inline-embed the demo when served over http(s). On file:// browsers block local-file
  // iframes, so there we keep the static preview + new-tab launch instead.
  function embedDemoIfOnline() {
    if (location.protocol === "file:") return;
    var link = document.querySelector(".shot-strip .shot-link");
    if (!link) return;
    var href = link.getAttribute("href");
    if (!href) return;
    var box = document.createElement("div");
    box.className = "demo-embed";
    var bar = document.createElement("div");
    bar.className = "demo-embed-bar";
    bar.innerHTML = '<span>Live demo</span><a href="' + href + '">Open full screen ↗</a>';
    var frame = document.createElement("iframe");
    frame.src = href;
    frame.title = "Live demo";
    frame.loading = "lazy";
    box.appendChild(bar);
    box.appendChild(frame);
    link.parentNode.replaceChild(box, link);
  }

  // Which journey stop is this page? Matches the root-relative "projects/X.html" against the
  // tail of location.pathname, which works on file://, GitHub Pages (/Tracescribe-open/...),
  // and local http alike; the shared "projects/" prefix keeps endsWith collision-safe.
  function journeyIndex() {
    var p = location.pathname;
    for (var i = 0; i < JOURNEY.length; i++) {
      if (p.length >= JOURNEY[i].href.length && p.slice(-JOURNEY[i].href.length) === JOURNEY[i].href) return i;
    }
    return -1;
  }
  function pageRel(href) { return href.replace(/^projects\//, ""); } // a link FROM inside projects/
  function recordProgress(n) {
    try { var f = parseInt(localStorage.getItem(JKEY) || "0", 10) || 0; if (n > f) localStorage.setItem(JKEY, String(n)); } catch (e) {}
  }

  // Detail page: inject the journey nav strip after the breadcrumb. No-op on pages not in the
  // journey (cro.html / etmf.html have a breadcrumb but are not stops, so journeyIndex is -1).
  function buildDetailJourney() {
    var i = journeyIndex();
    if (i < 0) return;
    var bc = document.querySelector(".breadcrumb");
    if (!bc) return;
    var stop = JOURNEY[i], total = JOURNEY.length, n = i + 1;
    recordProgress(n);
    var prev = i > 0
      ? '<a class="journey-btn prev" href="' + pageRel(JOURNEY[i - 1].href) + '"><span class="ar">&larr;</span> ' + JOURNEY[i - 1].title + '</a>'
      : '<span class="journey-btn ghost">Trial start</span>';
    var next = i < total - 1
      ? '<a class="journey-btn next" href="' + pageRel(JOURNEY[i + 1].href) + '">' + JOURNEY[i + 1].title + ' <span class="ar">&rarr;</span></a>'
      : '<a class="journey-btn next finish" href="../index.html#projects">Finish the trial &check;</a>';
    var chip = stop.showsSubjects ? ' <span class="journey-chip">shows subject-level records</span>' : '';
    var nav = document.createElement("nav");
    nav.className = "journey-nav";
    nav.setAttribute("aria-label", "Trial journey");
    nav.innerHTML =
      '<div class="journey-track"><i style="width:' + Math.round(n / total * 100) + '%"></i></div>' +
      '<div class="journey-row">' +
        '<div class="journey-meta">' +
          '<span class="journey-step">Stop ' + n + ' of ' + total + '</span>' +
          '<span class="journey-phase">Phase ' + stop.phaseNum + ' of 7 &middot; ' + stop.phase + '</span>' +
        '</div>' +
        '<p class="journey-narr">' + stop.narr + chip + '</p>' +
        '<div class="journey-ctrls">' + prev + next + '</div>' +
      '</div>';
    bc.insertAdjacentElement("afterend", nav);
  }

  // Homepage: inject the "Start the trial journey" CTA, stamp each lifecycle pill with its stop
  // number (so the walk order is visible and the number-to-demo mapping cannot drift), and warn
  // both ways if the hand-authored pills and the JOURNEY array fall out of sync.
  function buildHomeJourney() {
    var flow = document.querySelector(".lc-flow");
    if (!flow) return;
    var hero = document.querySelector(".lc-hero");
    if (hero) {
      var resume = "";
      try {
        var f = parseInt(localStorage.getItem(JKEY) || "0", 10) || 0;
        if (f > 1 && f <= JOURNEY.length) {
          resume = '<a class="lc-journey-resume" href="' + JOURNEY[f - 1].href + '">Resume at stop ' + f + ' &middot; ' + JOURNEY[f - 1].title + '</a>';
        }
      } catch (e) {}
      var cta = document.createElement("div");
      cta.className = "lc-journey-cta";
      cta.innerHTML = '<a class="btn btn-primary" href="' + JOURNEY[0].href + '"><span class="ar">&#9654;</span> Start the trial journey</a>' + resume;
      hero.appendChild(cta);
    }
    var seen = {};
    JOURNEY.forEach(function (s) { seen[s.href] = false; });
    document.querySelectorAll(".lc-pill").forEach(function (pill) {
      var h = pill.getAttribute("href");
      var idx = -1;
      for (var i = 0; i < JOURNEY.length; i++) { if (JOURNEY[i].href === h) { idx = i; break; } }
      if (idx >= 0) {
        seen[h] = true;
        var b = document.createElement("span");
        b.className = "lc-pill-stop";
        b.textContent = idx + 1;
        pill.insertBefore(b, pill.firstChild);
      } else {
        console.warn("[journey] homepage pill not in JOURNEY:", h);
      }
    });
    JOURNEY.forEach(function (s) { if (!seen[s.href]) console.warn("[journey] JOURNEY stop has no homepage pill:", s.href); });
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

    embedDemoIfOnline();
    buildHomeJourney();
    buildDetailJourney();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
