# Editor review — Fullscreen table view

Date: 2026-10-12. Current Markdown editor review; manual acceptance pending.

## Changes

A fullscreen icon occupies the bottom inline-end corner between Add column and Add row, using the same hover/focus edge-control visibility. It stays enabled for read-only and spanning tables.

The button closes the active cell and sorting menu, then opens a native modal dialog filling the viewport. The reading view retains rendered text, formatting and sort arrows, with both-axis scrolling for large tables. Editing, sorting and structural controls stay in the original document table. Close and Escape dismiss the view and return keyboard focus to its corner trigger. Destruction removes the dialog. The native modal handles focus containment and makes the background inert.

No dependencies, migrations or content-format changes. No commit created. Unrelated working-tree changes preserved.

## Validation

- Targeted formatting: passed.
- npm run types:check: passed.
- npm run lint: passed, 393 files formatted and 323 linted without warnings/errors.
- npm run build: passed in 9.51 seconds; existing large-chunk, ineffective dynamic-import and plugin-timing warnings remain.
- git diff --check: passed, repeated after report.
- No automated tests written or run, per instruction. Manual/browser verification pending.

## Manual test checklist

1. Reload a document containing a table in Live Preview. Hover it. Expected: fullscreen icon in the corner where the right Add column edge meets the bottom Add row edge (left corner for RTL); no overlap with either Plus control.
2. Click fullscreen. Expected: viewport-sized table reading view with formatted content and a Close button; document controls cannot be interacted with behind it.
3. Open a wide, tall table. Scroll horizontally and vertically. Expected: all cells reachable and Close stays available. Resize the viewport and repeat in a narrow split pane and Light/Dark modes.
4. Close with Close, reopen, then press Escape. Expected: both return to the original table and keyboard focus returns to the fullscreen trigger. Tab around inside the modal: focus stays inside.
5. Edit a cell, type a space and more text, then open fullscreen. Expected: current rendered content appears without a duplicate blank editor row. Close, sort and add rows/columns, reopen: updated content appears.
6. Open a read-only table and a merged table. Expected: fullscreen remains usable while editing and structural restrictions remain unchanged in the original table.
7. Wait for Saved and reload. Expected: document contents preserved; fullscreen state does not persist.

## Suggested commit

feat(editor): add fullscreen table view at edge controls corner

Remain in the current editor review; do not start another phase.
