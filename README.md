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
