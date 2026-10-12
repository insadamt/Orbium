# Editor review — Table headers, sorting indicator and spaces

Date: 2026-10-12. Current Markdown editor review; manual acceptance pending.

## Changes

Column dots appear on header hover, keyboard focus, or while the menu is open. Touch devices retain visible controls. Header text, sort arrow and dots share a centered flex row. Cell padding increases from 0.4/0.65 rem to 0.55/0.8 rem.

Sorting displays an ascending or descending arrow and accessible aria-sort on the chosen header. It reflects the last sort action in the mounted table and clears when body source changes, including undo or edits. Reload retains saved row order but resets the transient indicator; no sort metadata is added to canonical content.

GFM parsing trims cell-edge whitespace. Previously, parent synchronization could therefore replace a newly typed trailing space with trimmed source. Cells containing leading or trailing whitespace now use the existing rich-table directive representation, which retains the whitespace through editing, autosave and reload. Ordinary GFM tables remain readable. No new dialect fields, dependencies or migrations.

Existing unrelated working-tree changes were preserved. No commit created.

## Validation

- Targeted formatting: passed, four source files.
- npm run types:check: passed.
- npm run lint: passed; 392 files formatted and 322 linted, no warnings/errors.
- npm run build: passed, 14.41 seconds. Existing large-chunk, ineffective dynamic-import and plugin-timing warnings remain.
- git diff --check: passed; repeated after this report.
- No automated tests written or run, as instructed. Browser/manual verification remains pending.

## Manual test checklist

1. Reload and open a disposable Markdown table in Live Preview. Move the pointer outside it: dots hide. Hover each header: its dots appear. Tab into a header: controls remain reachable and visible. Open the menu and move away: its trigger stays visible until dismissal.
2. Use body values Item 10, Item 2, Item 1 with distinct neighboring values. Sort ascending: Item 1, Item 2, Item 10, with an upward arrow on that header. Sort descending: reverse order and a downward arrow. Sort another column: only its arrow remains. Whole rows move and the header stays fixed.
3. Edit a header and body cell. At the end of a word press Space once, wait a second, then type another word. Expected: exactly one separating space, no second press needed. Repeat at the beginning and middle, and in an empty cell; check multiple consecutive spaces and formatted text.
4. Leave the cell, wait for Saved and reload. Expected: text, row order and spaces persist. The transient sort arrow resets on reload. Undo/redo typing and sorting: contents restore and no stale arrow claims the previous sort after a body change.
5. Check short, wrapped and empty headers in Light/Dark, Normal/Frosted and a narrow split pane. Expected: text, arrow and dots align vertically; slightly roomier padding; no control overlap. Try right-aligned and RTL content.
6. Navigate cells with Tab/Shift+Tab and Escape, apply text formatting, and add rows/columns with edge Plus buttons. Expected: existing editing and additions still work. Read-only and merged tables retain disabled sorting.

## Commit suggestions

- fix(editor): preserve table cell spaces during markdown synchronization
- feat(editor): polish table headers and show sort direction

Remain in the current editor review; do not begin another phase.
