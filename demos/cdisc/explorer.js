/* =============================================================================
   Define & Data explorer - vanilla JS, no dependencies.
   Reads window.DATASETS (embedded metadata) and fetches CSV row data on demand.
   ============================================================================= */
(function () {
  'use strict';
  var DATA = window.DATASETS || { sdtm: [], adam: [] };
  var PAGE = 50;

  var sel, meta, search, tableEl, pager, btnData, btnDefine;
  var current = null, view = 'data', page = 1, query = '';
  var cache = {};            // "layer:NAME" -> parsed rows (array of arrays)

  function key(ds) { return ds._layer + ':' + ds.name; }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ---- RFC4180-ish CSV parser (handles quoted fields, commas, newlines) ---- */
  function parseCSV(text) {
    var rows = [], row = [], field = '', i = 0, q = false, c;
    while (i < text.length) {
      c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
        else field += c;
      } else if (c === '"') { q = true; }
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') { /* skip */ }
      else field += c;
      i++;
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  /* ---- population of the dataset picker ----------------------------------- */
  function fill() {
    [['sdtm', 'SDTM'], ['adam', 'ADaM']].forEach(function (g) {
      var list = DATA[g[0]] || [];
      if (!list.length) return;
      var og = document.createElement('optgroup');
      og.label = g[1] + ' (' + list.length + ')';
      list.forEach(function (ds) {
        ds._layer = g[0];
        var o = document.createElement('option');
        o.value = key(ds);
        o.textContent = ds.name + ' - ' + ds.label;
        og.appendChild(o);
      });
      sel.appendChild(og);
    });
  }

  function find(val) {
    var p = val.split(':');
    return (DATA[p[0]] || []).filter(function (d) { return d.name === p[1]; })[0];
  }

  /* ---- rendering ---------------------------------------------------------- */
  function renderMeta() {
    var d = current;
    meta.innerHTML =
      '<div class="exp-title"><span class="exp-code">' + esc(d.name) + '</span>' +
      '<span class="exp-name">' + esc(d.label) + '</span></div>' +
      '<div class="exp-facts"><span>' + esc(d.dclass) + '</span>' +
      '<span>' + d.rows + ' rows × ' + d.cols + ' vars</span>' +
      (d.keys && d.keys.length ? '<span>key: ' + esc(d.keys.join(', ')) + '</span>' : '') +
      '</div>' +
      '<div class="exp-dls"><a class="dl sm" href="' + d.csv + '" download>CSV</a>' +
      '<a class="dl sm" href="' + d.xpt + '" download>XPT</a></div>';
  }

  function rowsMatching(rows) {
    if (!query) return rows;
    var q = query.toLowerCase();
    return rows.filter(function (r) {
      return r.some(function (c) { return c.toLowerCase().indexOf(q) >= 0; });
    });
  }

  function renderData() {
    search.style.display = '';
    var ck = key(current);
    if (!cache[ck]) {
      // Primary: embedded rows (data/rows.js) - works over file:// and http.
      if (window.DATASET_ROWS && window.DATASET_ROWS[ck] != null) {
        cache[ck] = parseCSV(window.DATASET_ROWS[ck]);
      } else {
        // Fallback: fetch the CSV (only works when served over http).
        tableEl.innerHTML = '<p class="exp-msg">Loading…</p>';
        fetch(current.csv).then(function (r) {
          if (!r.ok) throw new Error(r.status); return r.text();
        }).then(function (t) {
          cache[ck] = parseCSV(t); if (current && key(current) === ck) renderData();
        }).catch(function () {
          tableEl.innerHTML = '<p class="exp-msg">Row data unavailable. Run ' +
            '<code>python site/build_site.py</code> to generate <code>data/rows.js</code>, ' +
            'or serve the site over HTTP.</p>';
          pager.innerHTML = '';
        });
        return;
      }
    }
    var all = cache[ck], header = all[0], body = all.slice(1);
    var filtered = rowsMatching(body);
    var pages = Math.max(1, Math.ceil(filtered.length / PAGE));
    if (page > pages) page = pages;
    var slice = filtered.slice((page - 1) * PAGE, page * PAGE);
    var h = '<table class="data"><thead><tr>';
    header.forEach(function (c) { h += '<th>' + esc(c) + '</th>'; });
    h += '</tr></thead><tbody>';
    slice.forEach(function (r) {
      h += '<tr>';
      r.forEach(function (c) { h += '<td>' + esc(c) + '</td>'; });
      h += '</tr>';
    });
    h += '</tbody></table>';
    tableEl.innerHTML = h;
    renderPager(filtered.length, pages);
  }

  function renderPager(nFiltered, pages) {
    pager.innerHTML =
      '<button type="button" class="tt" id="exp-prev"' + (page <= 1 ? ' disabled' : '') + '>‹ Prev</button>' +
      '<span class="exp-pg">Page ' + page + ' of ' + pages +
      ' · ' + nFiltered + (query ? ' matched' : '') + ' rows</span>' +
      '<button type="button" class="tt" id="exp-next"' + (page >= pages ? ' disabled' : '') + '>Next ›</button>';
    var p = document.getElementById('exp-prev'), n = document.getElementById('exp-next');
    if (p) p.onclick = function () { if (page > 1) { page--; renderData(); } };
    if (n) n.onclick = function () { if (page < pages) { page++; renderData(); } };
  }

  function renderDefine() {
    search.style.display = 'none';
    pager.innerHTML = '';
    var keys = current.keys || [];
    var h = '<table class="data"><thead><tr><th>#</th><th>Variable</th><th>Label</th>' +
            '<th>Type</th><th>Len</th><th>Origin</th><th>Key</th></tr></thead><tbody>';
    current.vars.forEach(function (v, i) {
      var isKey = keys.indexOf(v.name) >= 0;
      h += '<tr' + (isKey ? ' class="hl"' : '') + '><td>' + (i + 1) + '</td>' +
        '<td>' + esc(v.name) + '</td><td>' + esc(v.label) + '</td>' +
        '<td>' + esc(v.type) + '</td><td>' + esc(v.length) + '</td>' +
        '<td>' + esc(v.origin) + '</td><td>' + (isKey ? (keys.indexOf(v.name) + 1) : '') + '</td></tr>';
    });
    h += '</tbody></table>';
    tableEl.innerHTML = h;
  }

  function render() { (view === 'data' ? renderData : renderDefine)(); }

  function selectDS(val) {
    current = find(val); if (!current) return;
    page = 1; query = ''; search.value = '';
    renderMeta(); render();
  }

  function setView(v) {
    view = v; page = 1;
    btnData.classList.toggle('on', v === 'data');
    btnDefine.classList.toggle('on', v === 'define');
    btnData.setAttribute('aria-pressed', v === 'data');
    btnDefine.setAttribute('aria-pressed', v === 'define');
    render();
  }

  function init() {
    sel = document.getElementById('exp-select');
    meta = document.getElementById('exp-meta');
    search = document.getElementById('exp-search');
    tableEl = document.getElementById('exp-table');
    pager = document.getElementById('exp-pager');
    btnData = document.getElementById('exp-view-data');
    btnDefine = document.getElementById('exp-view-define');
    if (!sel) return;
    fill();
    sel.onchange = function () { selectDS(sel.value); };
    search.oninput = function () { query = search.value.trim(); page = 1; if (view === 'data') renderData(); };
    btnData.onclick = function () { setView('data'); };
    btnDefine.onclick = function () { setView('define'); };
    if (sel.options.length) { sel.selectedIndex = 0; selectDS(sel.value); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
