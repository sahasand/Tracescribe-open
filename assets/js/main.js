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
