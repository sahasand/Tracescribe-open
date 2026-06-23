#!/usr/bin/env bash
# Copies each clinical project's self-contained static demo into ./demos/.
# This is the ONLY script that reads from the sibling ../ccs-* folders. Re-run when a
# source project changes. Safe & idempotent.
set -euo pipefail
cd "$(dirname "$0")"
SRC=".."

copy_dir() { # $1 src dir  $2 dest dir
  if [ ! -d "$1" ]; then echo "MISSING dir: $1" >&2; return 1; fi
  rm -rf "$2"; mkdir -p "$2"; cp -R "$1"/. "$2"/
  rm -rf "$2/.git" "$2/.gitignore"  # bundles are plain static dirs, not git repos
  find "$2" -name .DS_Store -delete 2>/dev/null || true  # strip macOS cruft
  echo "bundled $2/"
}
copy_file() { # $1 src file  $2 dest file
  if [ ! -f "$1" ]; then echo "MISSING file: $1" >&2; return 1; fi
  mkdir -p "$(dirname "$2")"; cp "$1" "$2"; echo "bundled $2"
}

copy_dir  "$SRC/ccs-cdisc-demo/site"                   "demos/cdisc"
copy_dir  "$SRC/ccs-ncdisc-demo/site"                  "demos/ncdisc"
copy_file "$SRC/ccs-monitoring/ccs-monitor-demo.html"  "demos/monitoring.html"
copy_dir  "$SRC/dashboard-biostats"                    "demos/biostats"
copy_dir  "$SRC/cro-website"                           "demos/cro"
# NOTE: demos/icf.html, demos/ectd.html, and demos/sites.html are hand-authored (in-repo recreations of
# features from large backend apps that are NOT bundled: TraceScribe2's ICF generation, CSR Publishing's
# eCTD packaging, site-tracker's site activation). This script never manages them.

# De-brand: the source projects carry "CCS" / "Cardiovascular Clinical Sciences"
# institutional branding; this showcase must be CCS-free. Re-applied on every sync so
# the bundled copies never reintroduce it. Targeted, case-sensitive substitutions only -
# we touch visitor-facing text + the org name in sample data, never clinical content.
debrand() {
  # monitoring: wordmark in title/header/body/footer + the demo URL.
  perl -i -pe '
    s{\QCCS Monitor\E}{Clinical Monitor}g;
    s{\Qccs-monitor\E}{clinical-monitor}g;
  ' demos/monitoring.html
  # ncdisc bundles its source dev doc (CLAUDE.md) which references CCS and is not part
  # of the runnable demo - drop it.
  rm -f demos/ncdisc/CLAUDE.md
  echo "de-branded demos (CCS -> neutral)"
}
debrand

# Trim non-website dev scaffolding from the cro bundle. cro-website keeps its source at the
# repo root (no build/ dir), so a plain copy drags in dev files that are NOT part of the
# rendered site. Removing them leaves the website (index.html, theme3-warm.html, 2/, 5/, 6/
# and their css/js) byte-for-byte unchanged.
rm -rf demos/cro/CLAUDE.md demos/cro/design.md demos/cro/.claude demos/cro/docs \
       demos/cro/2/CLAUDE.md demos/cro/5/website-copy.md demos/cro/5/website-copy-revised.md
echo "trimmed cro dev scaffolding (website unchanged)"

# House style (CLAUDE.md rule 3: no em dashes). Bundles are re-copied from source on every sync,
# so strip em dashes (U+2014) here to keep everything committed in this repo em-dash-free.
find demos -type f \( -name '*.html' -o -name '*.css' -o -name '*.js' -o -name '*.md' \
       -o -name '*.csv' -o -name '*.json' -o -name '*.svg' -o -name '*.txt' \
       -o -name '*.py' -o -name '*.xml' \) -print0 \
  | xargs -0 perl -i -pe 's/\xe2\x80\x94/-/g'
echo "stripped em dashes from bundled demos (rule 3)"

echo "Done. Demos bundled into ./demos/"
