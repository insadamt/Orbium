# Editor review — Reuse math previews during block moves

Date: 2026-10-16. Implemented; manual visual acceptance pending.

## Findings and change

Math widgets previously retained their rendered formula only within a mounted
controller. Reordering can remount the widget, resetting its local source guard.
Every remount replaced the output with “Rendering equation…” and scheduled KaTeX
again, even for an unchanged formula. Source inspection confirms this mount path;
browser reproduction is not claimed.

A focused math-preview module now caches prepared markup per editor context,
keyed by exact formula and display/inline mode. Math widgets immediately apply a
prepared result on remount, preserving the preview for incoming motion snapshots.
Uncached formulas retain idle scheduling. Nested rich-body math uses the same
cache. Invalid formulas reuse their readable error result; editing to a valid
formula still renders normally.

The cache uses weak editor-context ownership and a 128-result bound. It stores
markup, not live DOM or editor views. Evicted formulas may render again. Existing
KaTeX `trust: false`, expansion/size limits, error behavior, source formats,
undo/redo, and autosave are retained. No dependencies, migrations, API, or
persistent-format changes. Changed source files remain below 500 lines. This is
part of the current editor review; no next phase started.

## Manual test checklist

1. Reload a disposable Markdown document containing a display equation between
   paragraphs. Wait for its first render, drag it down, then up. Expected: the
   complete rendered equation participates in pop out → neighbor slide → pop in,
   without “Rendering equation…” or a second formula appearance after motion.
2. Repeat with block-menu Move up/down and Alt+Shift+Up/Down. Move neighboring
   paragraphs across the equation. Expected: stable formula and block height.
3. Move a wrapped paragraph containing inline math and a container holding a
   display equation. Include the same formula once inline and once as display
   math. Expected: each retains the correct mode and appearance after movement.
4. Edit the formula, return to Preview, and move it again. Expected: changed math
   renders once and then remains stable across moves. Enter invalid LaTeX, move
   the block, then repair it: expected readable error, preserved source, and
   successful recovery without stale cached output.
5. Repeat in Light/Dark, at 80%/125% zoom, in a scrolled document and split panes.
   Interrupt a move by clicking or typing. Expected: intact equations, no loading
   flash for prepared formulas, no lingering snapshot or invisible content.
6. Undo/redo a move, wait for Saved, and reload. Expected: correct saved source and
   order. Enable reduced motion: expected immediate reorder without animation.
   First rendering after a fresh editor context or cache eviction is still allowed.

## Commit message suggestion

`fix(editor): reuse prepared math previews when blocks move`

## Actual verification

- Targeted `npx vp fmt`: PASS, three source files.
- `npm run types:check`: PASS.
- `npm run lint`: PASS; 543 formatted files, 450 linted, no errors/warnings.
- `npm run build`: PASS in 13.38s, with existing large-chunk and mixed-import
  warnings.
- `git diff --check`: PASS.
- No automated tests written or run, as instructed. PHP checks are not applicable.
- Browser visual acceptance remains pending the checklist above.
