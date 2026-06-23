# CDISC Workflow Site - HF-1002-CL-101

A single-page static site presenting the full CDISC pipeline (raw EDC → SDTM →
ADaM → TFL, with R double-programming QC at every layer). Reuses the
"clinical instrument" theme (navy/red, IBM Plex, hash-routed tabs) from
`../siteexample`.

## View it

Fonts only load over HTTP (browsers block `file://` font loads), so serve it:

```bash
cd site && python3 -m http.server 8753
# open http://127.0.0.1:8753/
```

Tabs are hash-routed (`#overview`, `#sdtm`, `#adam`, `#datasets`, `#tables`,
`#qc`) and deep-linkable.

## Define & data explorer

The **Define & data** tab (`explorer.js`) lets users browse every SDTM and ADaM
dataset in the browser - toggle between **Data** (the rows, searchable and
paginated) and **Define** (the variable-level metadata, rendered from the
embedded build manifest) - and download the submission-format files (CSV, XPT,
`define.xml`, spec `.xlsx`). The row data is embedded as a `<script>`
(`data/rows.js`), so the explorer works whether you open `index.html` directly
(`file://`) or over HTTP. Only the web fonts need HTTP - over `file://` they fall
back to system fonts.

The **Define (HTML)** links open a standalone, themed `define.html` per layer
(generated from the build manifest + the define.xml codelists) that renders the
dataset and variable definitions and controlled terminology - readable over
`file://`. The raw `define.xml` is also downloadable (`.xml`), but it needs the
CDISC `define2-1.xsl` stylesheet to render, which isn't shipped, so prefer the
HTML view.

## Regenerate

`index.html` is **generated from the real pipeline artifacts** - not
hand-transcribed - so the numbers always match the build:

```bash
python -m sdtm.run_pipeline && python -m adam.run_pipeline && python -m tfl.build_tfl
python site/build_site.py        # rebuilds site/index.html
```

`build_site.py` reads the SDTM/ADaM build manifests, the QC summaries
(`*/qc/qc_summary.csv`), and the generated TFL table text (`tfl_out/txt/*.txt`),
plus sample dataset rows, and emits `index.html`. It also **copies the dataset
artifacts into `site/data/`** (CSV, XPT, `define.xml`, spec `.xlsx`) for the
explorer - that folder is gitignored (regenerable), so the committed site stays
lightweight.

## Files

- `index.html` - generated page (5 tabs: Overview, SDTM, ADaM, Tables, QC)
- `styles.css`, `app.js`, `fonts/` - the theme (copied from `siteexample/`)
- `build_site.py` - the generator
- `*.docx` - the source protocol/SAP/shells, linked from the Overview tab

Content is fictional and synthetic; not for clinical or submission use.
