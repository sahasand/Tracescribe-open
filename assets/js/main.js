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
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
