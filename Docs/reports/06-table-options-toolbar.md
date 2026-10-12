# Editor review — Compact table toolbar

Date: 2026-10-10. Implemented for manual review within the current editor phase.

## Changes

The table options bar now matches the text toolbar's 16 px icons, button padding, spacing, rounded surface, and normal/frosted appearance. Row/column actions, header toggle, merge, and split use icon buttons with accessible names and native title tooltips. Alignment and column width remain compact fields. A Close button and Escape dismiss the toolbar.

The toolbar mounts on the document body so ancestor glass surfaces do not limit its blur. It floats above the table, uses a below-table fallback when necessary, and clamps to the viewport. CodeMirror requestMeasure separates geometry reads and writes; scroll/resize listeners and ResizeObserver run only while it is open and are removed on close/destruction. Toolbar clicks retain the selected cell and do not trigger outside dismissal. Edge controls remain visible while table options are open.

This supersedes the inline secondary-actions layout described in `06-table-edge-controls-visibility.md`. The previous edge-control hover fix remains included. Existing DOM controls, icon rendering, shared toolbar CSS, and installed CodeMirror measurement API are sufficient for this presentation correction; no dependencies were added. No migrations or persistent-format changes. No commit was created.

## Validation

- Targeted `npx vp fmt`: passed for all five changed source files.
- `npm run types:check`: passed.
- `npm run lint`: passed; 369 files formatted correctly, 302 linted without warnings or errors.
- `npm run build`: passed in 7.86 seconds; chunk-size, mixed-import, and plugin-timing warnings remain.
- `git diff --check`: passed; repeated after adding this report.
- Automated tests were not written or run. Browser/manual acceptance remains pending.

## Manual test checklist

1. Reload and open a document table in Live Preview. Click a cell, then Table options. Expected: a compact icon toolbar floats above the table without shifting the table or text below it; button size and surface match the text toolbar.
2. Hover each icon. Expected: its action name appears. Use Add/Delete row and column, Toggle header, alignment, and column width on a disposable table. Expected: each applies to the selected cell/row/column as before. Merge right, then Split cell; expected: merged cells retain content and structural actions remain disabled until splitting.
3. Keep options open, select another cell, and change its alignment or header. Expected: the toolbar uses the newly selected cell. Clicking toolbar controls does not dismiss it or lose the target.
4. Scroll and resize, open near the top of the viewport, and try a narrow split pane. Expected: the toolbar follows the table, stays within the viewport, and wraps on narrow screens; edge Plus controls remain visible while options are open.
5. Compare Light/Dark and Normal/Frosted appearance against the text toolbar. Expected: matching surface treatment, readable icons and compact fields.
6. Close with the Close button, Escape while a toolbar field/button is focused, outside click, tab switch, and Source mode. Expected: no orphan toolbar or stale controls. Reopening still works.
7. Undo/redo edits, wait for Saved, and reload. Expected: table structure, content and formatting persist. Repeat the hover-to-edge-button checks from the preceding report.

## Suggested commit

`fix(editor): match table options to the text toolbar`

Remain in the current editor review phase; await manual feedback before proceeding to another phase.
