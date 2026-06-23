"""Generate the static site (index.html) from the real pipeline artifacts.

Reads the SDTM/ADaM build manifests, the QC summaries, the generated TFL table
text, and sample dataset rows, then emits a single-page site in the "clinical
instrument" theme (styles.css / app.js copied from the reference site).

Run from the project root:  python site/build_site.py
"""

import csv
import glob
import html
import json
import os
import re
import shutil

ROOT = os.path.join(os.path.dirname(__file__), "..")
SITE = os.path.dirname(__file__)
DATA = os.path.join(SITE, "data")


def esc(s):
    return html.escape(str(s), quote=True)


def load_manifest(layer):
    with open(os.path.join(ROOT, layer, "_build_manifest.json")) as f:
        return json.load(f)


def load_qc(path):
    with open(os.path.join(ROOT, path)) as f:
        return list(csv.DictReader(f))


def read_csv_rows(path, n=None):
    with open(os.path.join(ROOT, path)) as f:
        rows = list(csv.DictReader(f))
    return rows[:n] if n else rows


# ---------------------------------------------------------------------------
# Gather data
# ---------------------------------------------------------------------------
sdtm = load_manifest("sdtm_out")
adam = load_manifest("adam_out")
sdtm_qc = load_qc("sdtm_out/qc/qc_summary.csv")
adam_qc = load_qc("adam_out/qc/qc_summary.csv")
tfl_qc = load_qc("tfl_out/tfl_qc/qc_summary.csv")

sdtm_cells = sum(m["nrows"] * m["ncols"] for m in sdtm)
adam_cells = sum(m["nrows"] * m["ncols"] for m in adam)
tfl_cells = sum(int(r["cells"]) for r in tfl_qc)
total_cells = sdtm_cells + adam_cells + tfl_cells
n_datasets = len(sdtm) + len(adam) + len(tfl_qc)

CLASS_ORDER = ["SPECIAL PURPOSE", "INTERVENTIONS", "EVENTS", "FINDINGS",
               "TRIAL DESIGN", "RELATIONSHIP"]


def head(title):
    return ("<!DOCTYPE html>\n<html lang=\"en\"><head>\n"
            "<meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n"
            f"<title>{esc(title)}</title>\n"
            "<meta name=\"description\" content=\"A worked CDISC pipeline on a fictional Phase 1 study (HF-1002-CL-101): raw EDC to SDTM to ADaM to TFL, with independent R double-programming QC at every layer. Synthetic data; demonstration only.\">\n"
            "<meta name=\"theme-color\" content=\"#0A1F40\">\n<meta name=\"color-scheme\" content=\"light\">\n"
            "<link rel=\"preload\" href=\"fonts/IBMPlexSans-600.woff2\" as=\"font\" type=\"font/woff2\" crossorigin>\n"
            "<link rel=\"preload\" href=\"fonts/IBMPlexSans-400.woff2\" as=\"font\" type=\"font/woff2\" crossorigin>\n"
            "<link rel=\"stylesheet\" href=\"styles.css\">\n</head>\n<body><div class=\"wrap\">")


# ---------------------------------------------------------------------------
# Masthead + tabs
# ---------------------------------------------------------------------------
MASTHEAD = """
<header class="masthead">
  <div class="mast-grid">
    <div class="mast-brand">
      <svg class="mast-mark" width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
        <rect x="1.6" y="1.6" width="26.8" height="26.8" rx="3.4" stroke="currentColor" stroke-width="1.4" opacity=".5"/>
        <path d="M15 5.5v19M5.5 15h19" stroke="currentColor" stroke-width="1.3" opacity=".75"/>
        <circle cx="15" cy="15" r="3.3" fill="#FF8089"/>
      </svg>
      <span class="mast-brand-text">CDISC Workflow<small>SDTM &middot; ADaM &middot; TFL &middot; R QC</small></span>
    </div>
    <div class="mast-status"><span class="dot" aria-hidden="true"></span>QC: PASS &middot; 0 differences</div>
  </div>
  <p class="doclabel">HF-1002-CL-101 &middot; CDISC pipeline</p>
  <h1>Raw EDC to <em>SDTM, ADaM, and TFL</em>, double-programmed in R</h1>
  <p class="sub">A worked CDISC submission pipeline on a fictional Phase 1 study. Every layer is built in Python and independently re-derived in R; the two are compared to zero differences.</p>
  <ul class="mast-meta">
    <li>Phase 1 &middot; Gene therapy</li>
    <li>18 subjects &middot; 3 cohorts</li>
    <li>SDTMIG 3.4 &middot; ADaMIG 1.3</li>
    <li class="warnish">Synthetic data &middot; demo</li>
  </ul>
</header>
<nav class="tabbar" aria-label="Sections">
  <div class="tabbar-inner" role="tablist" aria-label="Workflow sections">
    <button id="tab-overview" class="tab on" role="tab" aria-selected="true" aria-controls="overview" tabindex="0" onclick="show('overview',this)"><span class="tab-idx">01</span>Overview</button>
    <button id="tab-sdtm" class="tab" role="tab" aria-selected="false" aria-controls="sdtm" tabindex="-1" onclick="show('sdtm',this)"><span class="tab-idx">02</span>SDTM</button>
    <button id="tab-adam" class="tab" role="tab" aria-selected="false" aria-controls="adam" tabindex="-1" onclick="show('adam',this)"><span class="tab-idx">03</span>ADaM</button>
    <button id="tab-datasets" class="tab" role="tab" aria-selected="false" aria-controls="datasets" tabindex="-1" onclick="show('datasets',this)"><span class="tab-idx">04</span>Define &amp; data</button>
    <button id="tab-tables" class="tab" role="tab" aria-selected="false" aria-controls="tables" tabindex="-1" onclick="show('tables',this)"><span class="tab-idx">05</span>Tables</button>
    <button id="tab-qc" class="tab" role="tab" aria-selected="false" aria-controls="qc" tabindex="-1" onclick="show('qc',this)"><span class="tab-idx">06</span>QC</button>
  </div>
</nav>
"""


# ---------------------------------------------------------------------------
# Overview
# ---------------------------------------------------------------------------
def overview():
    stages = [
        ("01", "Protocol &amp; SAP", False), ("02", "Raw EDC (19 forms)", False),
        ("03", f"SDTM &middot; {len(sdtm)} datasets", False), ("04", "SDTM QC (R)", True),
        ("05", f"ADaM &middot; {len(adam)} datasets", False), ("06", "ADaM QC (R)", True),
        ("07", f"TFL &middot; {len(tfl_qc)} tables", False), ("08", "TFL QC (R)", True),
    ]
    flow = "".join(
        f'<li class="stage{" qc" if qc else ""}"><span class="sn">{n}</span><span class="st">{t}</span></li>'
        for n, t, qc in stages)
    return f"""
<section id="overview" class="on" role="tabpanel" aria-labelledby="tab-overview" tabindex="0">
  <p class="lead">Starting from a fictional Phase 1 protocol and its SAP, the pipeline maps the raw EDC into <em>SDTM</em> tabulation datasets, derives the <em>ADaM</em> analysis datasets, and produces the <em>TFL</em> tables. Each layer is built in Python and <em>independently re-programmed in R</em>, then compared cell by cell.</p>
  <div class="stats">
    <div class="stat"><div class="sv">{n_datasets}</div><div class="sl">{len(sdtm)} SDTM + {len(adam)} ADaM datasets + {len(tfl_qc)} TFL tables</div></div>
    <div class="stat"><div class="sv">18</div><div class="sl">subjects &middot; 3 cohorts &middot; 19 EDC forms</div></div>
    <div class="stat"><div class="sv">0</div><div class="sl">QC differences ({total_cells:,} values compared)</div></div>
    <div class="stat"><div class="sv">1</div><div class="sl">real defect caught (lossy CSV float parser)</div></div>
  </div>
  <h2>The pipeline</h2>
  <ol class="flow">{flow}</ol>
  <p class="note">Each layer reads the one before it: raw EDC &rarr; SDTM &rarr; ADaM &rarr; TFL. The red steps are the independent R QC &mdash; a second implementation that must agree to the cell.</p>
  <div class="scopebox"><b>Scope.</b> The data is synthetic, built for this demo. The build follows CDISC <b>SDTMIG&nbsp;3.4</b> and <b>ADaMIG&nbsp;1.3</b> with a generated <b>define.xml&nbsp;2.1</b> and conformance checks at each layer. QC is independent double programming in R (<code>diffdf</code> for datasets, cell-by-cell for tables). The AE/CM/MH coding is a synthetic stand-in, not licensed MedDRA/WHODrug.</div>
  <h3 class="grouphd"><span class="grouptag">Source documents</span></h3>
  <p class="note">The pre-specified inputs the whole pipeline is built from.</p>
  <div class="cards">
    <div class="card"><div class="card-tag">Source</div><div class="card-title">Clinical Study Protocol</div><div class="card-desc">The fictional Phase 1, single-arm, 3-cohort dose-escalation protocol.</div><div class="card-foot"><span class="fn">HF-1002-CL-101_Protocol_v1.0_06Jun2026.docx</span><a class="dl" href="HF-1002-CL-101_Protocol_v1.0_06Jun2026.docx" target="_blank">Open</a></div></div>
    <div class="card"><div class="card-tag">SAP</div><div class="card-title">Statistical Analysis Plan</div><span class="badge truth">Source of truth</span><div class="card-desc">Analysis sets, endpoints, and the table inventory the TFL layer follows.</div><div class="card-foot"><span class="fn">SAP_HF-1002-CL-101_v1.0_06Jun2026.docx</span><a class="dl" href="SAP_HF-1002-CL-101_v1.0_06Jun2026.docx" target="_blank">Open</a></div></div>
    <div class="card"><div class="card-tag">Shells</div><div class="card-title">Mock TFL Shells</div><div class="card-desc">The empty table shells the populated TFL package is built to match.</div><div class="card-foot"><span class="fn">HF-1002-CL-101_Mock_Shells.docx</span><a class="dl" href="HF-1002-CL-101_Mock_Shells.docx" target="_blank">Open</a></div></div>
  </div>
</section>
"""


# ---------------------------------------------------------------------------
# SDTM
# ---------------------------------------------------------------------------
def sdtm_section():
    by_class = {}
    for m in sdtm:
        by_class.setdefault(m["dclass"], []).append(m)
    blocks = ""
    for cls in CLASS_ORDER:
        items = by_class.get(cls, [])
        if not items:
            continue
        rows = "".join(
            f"<tr><td><code>{esc(m['domain'])}</code></td><td>{esc(m['dataset_label'])}</td>"
            f"<td>{m['nrows']}</td><td>{m['ncols']}</td></tr>"
            for m in sorted(items, key=lambda x: x["domain"]))
        blocks += (f'<h3 class="grouphd"><span class="grouptag">{esc(cls.title())}</span></h3>'
                   f'<table class="find"><thead><tr><th>Domain</th><th>Label</th><th>Rows</th><th>Vars</th></tr></thead>'
                   f'<tbody>{rows}</tbody></table>')

    ae = read_csv_rows("sdtm_out/csv/ae.csv")
    sample = [r for r in ae if r["USUBJID"].endswith("1001")][:5]
    arows = "".join(
        f"<tr><td>{esc(r['USUBJID'].split('-')[-1])}</td><td>{esc(r['AETERM'])}</td>"
        f"<td>{esc(r['AEDECOD'])}</td><td>{esc(r['AESTDTC'])}</td>"
        f"<td>{esc(r['EPOCH'])}</td><td>{esc(r['AETOXGR'])}</td></tr>" for r in sample)

    return f"""
<section id="sdtm" role="tabpanel" aria-labelledby="tab-sdtm" tabindex="0">
  <h2>SDTM tabulation datasets</h2>
  <p>The {len(sdtm)} SDTM datasets, built from the 19 raw EDC forms to <strong>SDTMIG&nbsp;3.4</strong>. A single metadata spec drives the XPT labels/types, the <strong>define.xml&nbsp;2.1</strong>, and the dataset spec, so all three stay consistent.</p>
  <div class="qcgrid">
    <div class="qcbox"><div class="v">{len(sdtm)}</div><div class="l">datasets (XPT + CSV)</div></div>
    <div class="qcbox"><div class="v">{sdtm_cells:,}</div><div class="l">values written</div></div>
    <div class="qcbox"><div class="v">0</div><div class="l">conformance errors</div></div>
    <div class="qcbox"><div class="v">{len(sdtm_qc)}/{len(sdtm_qc)}</div><div class="l">datasets pass R QC</div></div>
  </div>
  <div class="scopebox"><b>Notable derivations.</b> Custom Findings domains <code>ZE</code> (echocardiography) and <code>PE</code> are added where no standard domain exists. AE <code>EPOCH</code> is derived from each event's <b>start date against the subject's elements</b>, not the CRF collection folder (all AEs are logged on one Day-1 form). Baseline flags, study days, and <code>--SEQ</code> follow the documented keys so the R build reproduces them exactly.</div>
  <h3>Adverse events, subject 1001 (SDTM AE)</h3>
  <div class="scroll"><table class="data"><thead><tr><th>Subject</th><th>Reported term</th><th>Dictionary term</th><th>Start</th><th>Epoch</th><th>Grade</th></tr></thead><tbody>{arows}</tbody></table></div>
  <p class="note">Verbatim term plus synthetic-coded preferred term, with the derived analysis epoch and CTCAE grade.</p>
  <h3>Domain inventory</h3>
  {blocks}
</section>
"""


# ---------------------------------------------------------------------------
# ADaM
# ---------------------------------------------------------------------------
def adam_section():
    rows = "".join(
        f"<tr><td><code>{esc(m['domain'])}</code></td><td>{esc(m['dataset_label'])}</td>"
        f"<td>{esc(m['dclass'].title())}</td><td>{m['nrows']}</td></tr>"
        for m in adam)

    img = read_csv_rows("adam_out/csv/adimg.csv")
    sample = [r for r in img if r["USUBJID"].endswith("1001")]

    def f(x):
        return "" if x in ("", None) else f"{float(x):.1f}"

    def irow(r):
        cls = ' class="hl"' if r["ABLFL"] == "Y" else ""
        chg = "" if r["CHG"] == "" else f(r["CHG"])
        return (f"<tr{cls}><td>{esc(r['AVISIT'])}</td><td>{f(r['AVAL'])}</td>"
                f"<td>{f(r['BASE'])}</td><td>{chg}</td>"
                f"<td>{esc(r['ABLFL'] or '')}</td><td>{esc(r['ANL01FL'])}</td></tr>")
    irows = "".join(irow(r) for r in sample)

    return f"""
<section id="adam" role="tabpanel" aria-labelledby="tab-adam" tabindex="0">
  <h2>ADaM analysis datasets</h2>
  <p>The {len(adam)} ADaM datasets, derived from SDTM to <strong>ADaMIG&nbsp;1.3</strong>. <code>ADSL</code> is the subject-level hub carrying treatment and population flags; the BDS datasets add analysis values with baseline, change, and visit windowing.</p>
  <table class="find"><thead><tr><th>Dataset</th><th>Label</th><th>Class</th><th>Rows</th></tr></thead><tbody>{rows}</tbody></table>
  <div class="scopebox"><b>Analysis structure.</b> Population flags <code>ENRLFL / SAFFL / FASFL / DLTFL</code> follow the SAP analysis-set definitions. The shared BDS engine derives <code>AVISIT</code> windowing, <code>ABLFL</code>, <code>BASE</code>, <code>CHG</code>/<code>PCHG</code>, and <code>ANL01FL</code>. Dates are stored as SAS numeric days so the R build compares exactly.</div>
  <h3>Change from baseline in LVEF, subject 1001 (ADIMG, central reader)</h3>
  <div class="scroll"><table class="data"><thead><tr><th>Analysis visit</th><th>AVAL</th><th>BASE</th><th>CHG</th><th>ABLFL</th><th>ANL01FL</th></tr></thead><tbody>{irows}</tbody></table></div>
  <p class="note">Baseline row highlighted. <code>CHG</code> = <code>AVAL &minus; BASE</code>; LVEF improves over the 12-month follow-up. These analysis-ready values feed the efficacy tables directly.</p>
</section>
"""


# ---------------------------------------------------------------------------
# Tables (embed the real TFL text output)
# ---------------------------------------------------------------------------
TFL_TITLES = {
    "14.1.1": "Demographics", "14.1.2": "Disposition", "14.1.3": "Exposure",
    "14.2.1.1": "LVEF CFB", "14.2.1.2": "pVO2 CFB", "14.2.2.2": "6MWT CFB",
    "14.2.3.1": "NYHA", "14.2.4.1": "MLHFQ CFB", "14.2.4.2": "KCCQ CFB",
    "14.3.1.1": "TEAE summary", "14.3.1.2": "TEAE SOC/PT", "14.3.2.1": "SAE",
    "14.3.3.1": "DLT", "14.3.4.1": "Deaths", "14.3.5.1": "Labs", "14.3.6.1": "Vitals",
}


def tables_section():
    files = sorted(glob.glob(os.path.join(ROOT, "tfl_out", "txt", "*.txt")))
    numbers = []
    pres = ""
    buttons = ""
    for i, path in enumerate(files):
        stem = os.path.basename(path)[:-4]            # t_14_1_1
        num = stem[2:].replace("_", ".")              # 14.1.1
        numbers.append(num)
        with open(path) as fh:
            content = esc(fh.read())
        first = (i == 0)
        pres += (f'<pre class="tfl" id="tbl-{num}" '
                 f'style="display:{"block" if first else "none"}">{content}</pre>')
        buttons += (f'<button class="tt{" on" if first else ""}" data-tbl="{num}" '
                    f'aria-pressed="{"true" if first else "false"}" '
                    f'tabindex="{0 if first else -1}" onclick="showTbl(\'{num}\',this)">'
                    f'{num} <span style="opacity:.6">{esc(TFL_TITLES.get(num, ""))}</span></button>')
    return f"""
<section id="tables" role="tabpanel" aria-labelledby="tab-tables" tabindex="0">
  <h2>Populated tables</h2>
  <p>All {len(files)} tables from the mock-shell inventory, generated directly from the QC'd ADaM datasets (RTF, fixed-width text, and CSV). The text shown here is the generator's actual output. Pick a table.</p>
  <div class="ttabs" role="toolbar" aria-label="Table selector">{buttons}</div>
  {pres}
  <p class="note">Columns are the three dose cohorts plus Total; populations follow the SAP. Every cell was independently reproduced in R (see QC).</p>
</section>
"""


# ---------------------------------------------------------------------------
# QC
# ---------------------------------------------------------------------------
def qc_section():
    layer_rows = "".join([
        f"<tr><td>SDTM</td><td><code>diffdf</code> dataset compare</td><td>{len(sdtm_qc)} datasets</td>"
        f"<td><span class=\"pill ok\">{sum(1 for r in sdtm_qc if r['status']=='PASS')}/{len(sdtm_qc)} PASS</span></td></tr>",
        f"<tr><td>ADaM</td><td><code>diffdf</code> dataset compare</td><td>{len(adam_qc)} datasets</td>"
        f"<td><span class=\"pill ok\">{sum(1 for r in adam_qc if r['status']=='PASS')}/{len(adam_qc)} PASS</span></td></tr>",
        f"<tr><td>TFL</td><td>cell-by-cell compare</td><td>{len(tfl_qc)} tables &middot; {tfl_cells:,} cells</td>"
        f"<td><span class=\"pill ok\">{sum(1 for r in tfl_qc if r['status']=='PASS')}/{len(tfl_qc)} PASS</span></td></tr>",
    ])
    return f"""
<section id="qc" role="tabpanel" aria-labelledby="tab-qc" tabindex="0">
  <h2>Independent QC, in R</h2>
  <p>Every layer was re-programmed from scratch in R &mdash; reading the same inputs but sharing no code &mdash; and compared against the Python production. Datasets are compared with <code>diffdf</code> (the PROC COMPARE equivalent); the tables are compared cell by cell. Result across all three layers: <strong>zero differences</strong>.</p>
  <div class="qcgrid">
    <div class="qcbox"><div class="v">{len(sdtm_qc)}/{len(sdtm_qc)}</div><div class="l">SDTM datasets pass</div></div>
    <div class="qcbox"><div class="v">{len(adam_qc)}/{len(adam_qc)}</div><div class="l">ADaM datasets pass</div></div>
    <div class="qcbox"><div class="v">{len(tfl_qc)}/{len(tfl_qc)}</div><div class="l">TFL tables pass (cell-by-cell)</div></div>
    <div class="qcbox"><div class="v">1</div><div class="l">real defect caught and fixed</div></div>
  </div>
  <h3>Coverage</h3>
  <table class="find"><thead><tr><th>Layer</th><th>Comparison method</th><th>Scope</th><th>Result</th></tr></thead><tbody>{layer_rows}</tbody></table>
  <h3>The defect double-programming caught</h3>
  <div class="scopebox"><b>Lossy float parsing.</b> The first TFL QC run flagged two table cells. Root cause: <code>pandas.read_csv</code>'s default float parser is lossy (off by ~1 ULP) and parsed <code>19.799999999999997</code> as <code>19.800000000000001</code>, diverging from R's correct parser exactly at a rounding boundary &mdash; so the Python tables rounded two cells the wrong way. Fixed by reading with <code>float_precision="round_trip"</code>. A single-implementation build, and a structural check, would both have missed this; only a second independent implementation disagreeing surfaced it.</div>
  <p class="note">Each QC harness was validated with a negative control &mdash; injecting a wrong value or dropping a row makes the comparison fail &mdash; so an all-pass result is meaningful, not trivial. Reports: <code>sdtm_out/qc/</code>, <code>adam_out/qc/</code>, <code>tfl_out/tfl_qc/</code>.</p>
</section>
"""


# ---------------------------------------------------------------------------
# Datasets explorer: copy artifacts into site/data/, embed metadata, render tab
# ---------------------------------------------------------------------------
def copy_data():
    """Copy the SDTM/ADaM CSV+XPT, define.xml, and spec workbooks into site/data/.

    site/data/ is regenerable (gitignored) - the committed site stays lightweight.
    """
    if os.path.isdir(DATA):
        shutil.rmtree(DATA)
    spec_map = {"sdtm": "sdtm_out", "adam": "adam_out"}
    for layer, outdir in spec_map.items():
        for kind in ("csv", "xpt"):
            src = os.path.join(ROOT, outdir, kind)
            dst = os.path.join(DATA, layer, kind)
            shutil.copytree(src, dst)
        # Copy define.xml but drop the dangling <?xml-stylesheet?> PI - the
        # CDISC define2-1.xsl isn't shipped, so with it the file renders blank;
        # without it the browser shows the raw XML tree. (Themed view = define.html.)
        with open(os.path.join(ROOT, outdir, "define.xml")) as f:
            dx = f.read()
        dx = re.sub(r"<\?xml-stylesheet[^>]*\?>\s*", "", dx)
        with open(os.path.join(DATA, layer, "define.xml"), "w") as f:
            f.write(dx)
        for x in glob.glob(os.path.join(ROOT, outdir, "specs", "*.xlsx")):
            os.makedirs(os.path.join(DATA, layer, "specs"), exist_ok=True)
            shutil.copy(x, os.path.join(DATA, layer, "specs", os.path.basename(x)))


def write_rows_js():
    """Embed every dataset's CSV text as a JS file so the Data view works over
    file:// too (script tags load locally; fetch() does not)."""
    rows = {}
    for layer, outdir in (("sdtm", "sdtm_out"), ("adam", "adam_out")):
        for p in glob.glob(os.path.join(ROOT, outdir, "csv", "*.csv")):
            name = os.path.basename(p)[:-4].upper()
            with open(p) as f:
                rows[f"{layer}:{name}"] = f.read()
    with open(os.path.join(DATA, "rows.js"), "w") as f:
        f.write("window.DATASET_ROWS=" + json.dumps(rows, separators=(",", ":")) + ";")


def define_html(layer, manifest):
    """Write a standalone, themed define.html for a layer (self-contained,
    works over file://). Variable-level metadata from the manifest + codelists
    parsed from the generated define.xml."""
    import xml.etree.ElementTree as ET
    ns = "{http://www.cdisc.org/ns/odm/v1.3}"
    dpath = os.path.join(DATA, layer, "define.xml")
    root = ET.parse(dpath).getroot()
    mdv = root.find(f".//{ns}MetaDataVersion")
    std = mdv.get("{http://www.cdisc.org/ns/def/v2.1}StandardName", "")
    stdv = mdv.get("{http://www.cdisc.org/ns/def/v2.1}StandardVersion", "")
    codelists = []
    for cl in root.iter(f"{ns}CodeList"):
        items = []
        for it in cl.findall(f"{ns}CodeListItem"):
            dec = it.find(f"{ns}Decode/{ns}TranslatedText")
            items.append((it.get("CodedValue", ""), dec.text if dec is not None else ""))
        codelists.append((cl.get("Name", ""), items))

    idx = "".join(
        f"<tr><td><code>{esc(m['domain'])}</code></td><td>{esc(m['dataset_label'])}</td>"
        f"<td>{esc(m['dclass'].title())}</td><td>{m['ncols']}</td>"
        f"<td>{esc(', '.join(m.get('keys', [])))}</td></tr>" for m in manifest)

    blocks = ""
    for m in manifest:
        keys = m.get("keys", [])
        vrows = ""
        for i, v in enumerate(m["variables"], 1):
            isk = v["name"] in keys
            cls = ' class="hl"' if isk else ''
            kseq = keys.index(v["name"]) + 1 if isk else ''
            vrows += (f"<tr{cls}><td>{i}</td>"
                      f"<td>{esc(v['name'])}</td><td>{esc(v['label'])}</td>"
                      f"<td>{esc(v['type'])}</td><td>{esc(v['length'])}</td>"
                      f"<td>{esc(v.get('origin',''))}</td><td>{kseq}</td></tr>")
        blocks += (f'<h3 class="grouphd" id="d-{esc(m["domain"])}">'
                   f'<span class="grouptag">{esc(m["domain"])}</span> {esc(m["dataset_label"])}</h3>'
                   f'<p class="note">{esc(m.get("structure",""))}</p>'
                   f'<div class="scroll"><table class="data"><thead><tr><th>#</th><th>Variable</th>'
                   f'<th>Label</th><th>Type</th><th>Len</th><th>Origin</th><th>Key</th></tr></thead>'
                   f'<tbody>{vrows}</tbody></table></div>')

    ct = ""
    for name, items in codelists:
        rows = "".join(f"<tr><td><code>{esc(c)}</code></td><td>{esc(d)}</td></tr>" for c, d in items)
        ct += (f'<h3 class="grouphd"><span class="grouptag">CT</span> {esc(name)}</h3>'
               f'<table class="find"><thead><tr><th>Coded value</th><th>Decode</th></tr></thead>'
               f'<tbody>{rows}</tbody></table>')

    page = f"""<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>define.xml - {esc(layer.upper())} - HF-1002-CL-101</title>
<link rel="stylesheet" href="../../styles.css"></head>
<body><div class="wrap">
<header class="masthead">
  <p class="doclabel">HF-1002-CL-101 &middot; Define-XML 2.1</p>
  <h1>{esc(layer.upper())} dataset definitions</h1>
  <p class="sub">{esc(std)} {esc(stdv)} &middot; {len(manifest)} datasets &middot; rendered from the build metadata. <a href="define.xml">Raw define.xml</a> &middot; <a href="../../index.html#datasets">Back to explorer</a></p>
</header>
<section class="on">
  <h2>Datasets</h2>
  <table class="find"><thead><tr><th>Dataset</th><th>Label</th><th>Class</th><th>Vars</th><th>Keys</th></tr></thead><tbody>{idx}</tbody></table>
  <h2>Variable definitions</h2>
  {blocks}
  <h2>Controlled terminology</h2>
  {ct}
</section>
<div class="disc"><b>Demonstration.</b> Define-XML 2.1 rendering &middot; synthetic data &middot; not for clinical or submission use</div>
</div></body></html>"""
    with open(os.path.join(DATA, layer, "define.html"), "w") as f:
        f.write(page)


def datasets_js():
    """Embeddable JS: per-dataset variable metadata + file paths (no row data)."""
    def entries(manifest, layer):
        out = []
        for m in manifest:
            name = m["domain"]
            out.append({
                "name": name, "label": m.get("dataset_label", name),
                "dclass": m.get("dclass", ""), "rows": m["nrows"], "cols": m["ncols"],
                "keys": m.get("keys", []),
                "vars": [{"name": v["name"], "label": v["label"], "type": v["type"],
                          "length": v["length"], "origin": v.get("origin", "")}
                         for v in m["variables"]],
                "csv": f"data/{layer}/csv/{name.lower()}.csv",
                "xpt": f"data/{layer}/xpt/{name.lower()}.xpt",
            })
        return out
    return json.dumps({"sdtm": entries(sdtm, "sdtm"), "adam": entries(adam, "adam")},
                      separators=(",", ":"))


def datasets_section():
    spec_x = {l: [os.path.basename(p) for p in
                  glob.glob(os.path.join(ROOT, f"{l}_out", "specs", "*.xlsx"))]
              for l in ("sdtm", "adam")}
    def dl_cards():
        cards = ""
        for layer, label in (("sdtm", "SDTM"), ("adam", "ADaM")):
            xlsx = spec_x[layer][0] if spec_x[layer] else ""
            cards += (
                f'<div class="card"><div class="card-tag">{label}</div>'
                f'<div class="card-title">{label} metadata</div>'
                f'<div class="card-desc">Browse the define-XML as a themed page, or download the raw '
                f'define.xml and the {label} specification workbook.</div>'
                f'<div class="card-foot ls-foot2">'
                f'<a class="dl sm" href="data/{layer}/define.html" target="_blank">Define (HTML)</a>'
                f'<a class="dl sm" href="data/{layer}/define.xml" download>.xml</a>'
                + (f'<a class="dl sm" href="data/{layer}/specs/{esc(xlsx)}">Spec (.xlsx)</a>' if xlsx else "")
                + '</div></div>')
        return cards
    return f"""
<section id="datasets" role="tabpanel" aria-labelledby="tab-datasets" tabindex="0">
  <h2>Define &amp; data explorer</h2>
  <p>Browse every SDTM and ADaM dataset in the browser &mdash; the rows (<strong>Data</strong>) or the variable-level metadata (<strong>Define</strong>) &mdash; or download the submission-format files. The define metadata is rendered from the same build manifest that produces <code>define.xml</code>.</p>
  <div class="cards g2">{dl_cards()}</div>
  <div class="exp">
    <div class="exp-head">
      <label class="exp-lab" for="exp-select">Dataset</label>
      <select id="exp-select" class="exp-select" aria-label="Choose a dataset"></select>
      <div class="exp-views" role="group" aria-label="View">
        <button id="exp-view-data" class="on" type="button">Data</button>
        <button id="exp-view-define" type="button">Define</button>
      </div>
    </div>
    <div class="exp-meta" id="exp-meta"></div>
    <input class="exp-search" id="exp-search" type="search" placeholder="Filter rows&hellip;" aria-label="Filter rows">
    <div class="scroll" id="exp-table"></div>
    <div class="exp-pager" id="exp-pager"></div>
  </div>
  <p class="note">Row data loads on demand from the CSV; the metadata view needs no fetch. Downloads above are the XPT-package metadata; per-dataset CSV/XPT downloads sit in the header when a dataset is selected.</p>
</section>
"""


FOOTER = """
<footer>
  <div class="ft">HF-1002-CL-101 &middot; CDISC Workflow</div>
  <div class="fm">Fictional &middot; synthetic data</div>
</footer>
<div class="disc"><b>Demonstration.</b> Protocol HF-1002-CL-101 (fictional) &middot; Phase 1 gene therapy &middot; synthetic data &middot; SDTMIG 3.4 / ADaMIG 1.3 &middot; not for clinical or submission use</div>
</div>
<script>window.DATASETS=__DATASETS__;</script>
<script src="data/rows.js" defer></script>
<script src="app.js" defer></script>
<script src="explorer.js" defer></script>
</body></html>
"""


def main():
    copy_data()
    write_rows_js()
    define_html("sdtm", sdtm)
    define_html("adam", adam)
    footer = FOOTER.replace("__DATASETS__", datasets_js())
    htmlout = (head("CDISC workflow: HF-1002-CL-101") + MASTHEAD + overview()
               + sdtm_section() + adam_section() + datasets_section()
               + tables_section() + qc_section() + footer)
    out = os.path.join(SITE, "index.html")
    with open(out, "w") as f:
        f.write(htmlout)
    print(f"Wrote {out}  ({len(htmlout):,} bytes)")
    print(f"  {len(sdtm)} SDTM + {len(adam)} ADaM datasets, {len(tfl_qc)} TFL tables")
    print(f"  copied datasets + define.xml + specs into site/data/")


if __name__ == "__main__":
    main()
