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

echo "Done. Demos bundled into ./demos/"
