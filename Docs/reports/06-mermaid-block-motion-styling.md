# Editor review — Mermaid appearance during block movement

Date: 2026-10-16. Implemented; manual visual acceptance pending.

## Findings and change

The user accepted the block motion repair, requested a commit, and reported that
Mermaid diagrams appeared to rerender when moved. The accepted motion/handle work
is committed as `9d3ad6c fix(editor): unify block motion and top-align drag handles`.

Source inspection found that animation snapshots remapped SVG element IDs and
attribute fragment references, but left embedded SVG CSS pointing at the original
IDs. Mermaid scopes its typography, node shapes, connectors, and related styling
to the SVG root ID. The animated copy therefore lost those styles, then switched
back to the styled live SVG when motion completed. This explains an apparent
rerender without a new Mermaid layout job. Browser reproduction is not claimed.

Snapshot cloning now parses embedded styles with the existing CSSTree dependency
and remaps CSS ID selectors and fragment URLs using the same identifier map.
Color hashes remain color values; they are not rewritten as IDs. The outgoing,
incoming, and neighbor snapshots share the fix, including nested diagrams.

The existing Mermaid session already reuses sanitized previews by unchanged
source. Its rendering, sanitization, scheduling, and source-change invalidation
remain unchanged. CodeMirror may remount a widget during a reorder; this repair
preserves the diagram's appearance across that transition. No dependency,
migration, API, or persistent-format change. All changed source files remain
under 500 lines. This remains within the current editor review.

## Manual test checklist

1. Reload a disposable Live Preview document with a rendered flowchart between
   paragraphs. Drag it down, then up. Expected: fonts, label sizes, node shapes,
   fills, arrowheads, and connectors match before/during/after the pop sequence,
   with no unstyled diagram flashing before the final preview.
2. Move a paragraph across the flowchart. Expected: the diagram slides as a
   neighbor while retaining its appearance. Repeat with menu Move up/down and
   Alt+Shift+Up/Down.
3. Repeat with a sequence diagram, two identical diagrams, and a diagram nested
   in a container. Expected: styling and SVG references remain intact, with no
   missing arrows, styling borrowed from another copy, or transient error.
4. Repeat in Light/Dark, a scrolled document, and split panes. Interrupt a move.
   Expected: theme styling is retained and all temporary snapshots disappear.
5. Edit the diagram source and return to Preview. Expected: the changed diagram
   still renders normally. Undo/redo a move, wait for Saved, and reload.
   Expected: intact diagram source and correct saved order.
6. Enable reduced motion and move the diagram. Expected: immediate correct order
   without a pop/slide or styling flash.

## Commit message suggestion

`fix(editor): preserve Mermaid SVG styles during block motion`

## Actual verification

- Targeted `npx vp fmt`: PASS.
- `npm run types:check`: PASS.
- `npm run lint`: PASS; 542 files formatted, 449 linted, no warnings/errors.
- `npm run build`: PASS in 12.96s. Existing large-chunk and mixed-import warnings
  remain.
- `git diff --check`: PASS.
- No automated tests written or run, as instructed. PHP checks do not apply.
- Browser visual acceptance remains pending the checklist above.
