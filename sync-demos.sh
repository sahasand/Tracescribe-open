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
  rm -rf "$2/.git"  # strip any nested git repo so it's a plain directory
  echo "bundled $2/"
}
copy_file() { # $1 src file  $2 dest file
  if [ ! -f "$1" ]; then echo "MISSING file: $1" >&2; return 1; fi
  mkdir -p "$(dirname "$2")"; cp "$1" "$2"; echo "bundled $2"
}

copy_dir  "$SRC/ccs-cdisc-demo/site"                   "demos/cdisc"
copy_dir  "$SRC/ccs-ncdisc-demo/site"                  "demos/ncdisc"
copy_file "$SRC/ccs-timelines/CCS_Clinical_Timeline.html" "demos/timelines.html"
copy_file "$SRC/ccs-monitoring/ccs-monitor-demo.html"  "demos/monitoring.html"

# De-brand: the source projects carry "CCS" / "Cardiovascular Clinical Sciences"
# institutional branding; this showcase must be CCS-free. Re-applied on every sync so
# the bundled copies never reintroduce it. Targeted, case-sensitive substitutions only —
# we touch visitor-facing text + the org name in sample data, never clinical content.
debrand() {
  # timelines: title, eyebrow wordmark, the .ccs CSS class, JS tab-title, and the
  # "CCS" org used as assignee/sponsor throughout the seeded schedule data.
  perl -i -pe '
    s{\Q<title>CCS Clinical Timeline</title>\E}{<title>Clinical Trial Timeline</title>}g;
    s{\Q>CARDIOVASCULAR CLINICAL SCIENCES<\E}{>CRITICAL-PATH SCHEDULING<}g;
    s{\Qclass="ccs"\E}{class="org-tag"}g;
    s{\Q.ccs\E}{.org-tag}g;
    s{\QCCS Timeline \E}{Clinical Timeline }g;
    s{\QSponsor/CCS\E}{Sponsor}g;
    s{\QFountayn / CCS\E}{Fountayn}g;
    s{CCS}{Sponsor}g;
  ' demos/timelines.html
  # monitoring: wordmark in title/header/body/footer + the demo URL.
  perl -i -pe '
    s{\QCCS Monitor\E}{Clinical Monitor}g;
    s{\Qccs-monitor\E}{clinical-monitor}g;
  ' demos/monitoring.html
  # ncdisc bundles its source dev doc (CLAUDE.md) which references CCS and is not part
  # of the runnable demo — drop it.
  rm -f demos/ncdisc/CLAUDE.md
  echo "de-branded demos (CCS -> neutral)"
}
debrand

echo "Done. Demos bundled into ./demos/"
