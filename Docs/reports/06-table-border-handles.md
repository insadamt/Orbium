# Editor review — Table border handles and row actions

Date: 2026-10-14. Focused enhancement within the current editor review.

## Implemented

- Replaced header three-dot buttons with horizontal dash handles centered on column top borders. Rows have vertical dash handles on their leading borders. Handles appear on table hover, keyboard focus and touch devices. Space inside the table scroller keeps the handles accessible without clipping them at the border.
- Clicking a handle opens options and highlights its entire column or row. Column options retain sorting and deletion and add Move left/right. Row options offer Insert above, Insert below, Move up, Move down and Delete row. Boundary move actions and deletion of the last row or column are disabled.
- Dragging a column horizontally or a row vertically highlights the destination, then moves the complete column or row on release. The drag threshold separates clicks from moves. A completed drag suppresses the menu click. Escape, pointer cancellation, window blur, a structural rebuild or widget destruction clears pending drag state and temporary highlighting.
- Column movement carries all cell content, formatting, stored widths and alignment together. New rows inherit column alignment and stored widths. Markdown tables maintain a first header row after row insertion, movement or deletion; rich tables retain explicit header metadata.
- Structural changes reuse undo/redo and autosave. Read-only editors and tables with merged cells retain disabled structural operations. Existing edge Plus controls and automatic reveal after adding a column remain available. Fullscreen previews omit the new handles along with other editing buttons.
- Split table mutation and pointer-drag behavior into focused modules. Each new or modified source file remains below 500 lines. Updated the editor specification to record the requested controls.

## Commits and persistence

No commit created. No dependencies, migrations or persistent-format changes.

## Validation

- Targeted formatting and lint: passed.
- `npm run lint`: passed; all 437 checked files correctly formatted, 356 files linted without warnings or errors.
- `npm run types:check`: passed.
- `npm run build`: passed in 11.06 seconds. Existing large-chunk, mixed static/dynamic import and plugin timing warnings remain.
- `git diff --check`: passed.
- No automated tests written or run, as instructed. Browser interaction and visual acceptance remain pending manual verification.

## Manual test checklist

1. Reload a Markdown document in Live Preview. Create columns A, B and C with at least three distinct body rows. Hover the table. Expected: horizontal dash handles on the top borders and vertical dash handles on row leading borders; the old three-dot buttons are absent. Handles remain inside the scrollable frame.
2. Click B's top handle. Expected: the complete column is highlighted and its menu offers Sort ascending, Sort descending, Move left, Move right and Delete column. Escape dismisses the menu and returns focus to the handle; outside clicks and scrolling dismiss it and remove highlighting.
3. Drag B's handle toward C, then release. Expected: the destination column is highlighted during dragging; order becomes A, C, B with body values moving with their header. No options menu opens after release. Drag B back left. Expected: A, B, C returns.
4. Click B's handle and choose Move left, then reopen its new handle and choose Move right. Expected: each action moves the entire column by one position. At the first and last visual columns, the corresponding outward move action is disabled. Check Sort ascending/descending and Delete column still affect the chosen column.
5. Click the leading handle of a middle body row. Expected: the entire row is highlighted and its menu includes Insert above/below, Move up/down and Delete row. Insert above, type a recognizable value into the new row, then insert below another row. Expected: exactly one blank row appears in the requested position each time, with the same column widths and alignments.
6. Drag a body row's handle down onto the last row, then up onto another row. Expected: complete rows move together, the destination is highlighted during dragging and no menu opens after release. Repeat using Move up/down from the row menu. Expected: moves stop at the first/last row boundaries.
7. Start dragging a column or row, then press Escape. Repeat by releasing over its original position. Expected: content remains unchanged and all drag highlighting clears. Click that handle afterward. Expected: the menu still opens normally.
8. In a plain Markdown table, insert above the first row, move a body row into the first position, then delete the first row. Expected: each operation leaves a valid table whose first row is the header and retains surviving content. Reduce a table to one row and one column. Expected: deleting either final axis is disabled.
9. Use formatted cells, different column alignments and an existing rich table with stored widths. Move columns and rows, then insert a row. Expected: surviving formatting and column widths remain intact, the inserted row matches the widths, and no rectangular-grid validation error appears.
10. Undo/redo a drag, a menu move, row insertion and row deletion separately. Wait for Saved and reload. Expected: each operation can be reversed and reapplied, and the final content and order persist.
11. Repeat in RTL, narrow split panes, light/dark and Normal/Frosted appearances. Expected: handles and menus remain readable, row handles use the leading edge, column Move left/right follows visual direction, and each pane changes independently. Tab to handles, open with Enter/Space and activate actions with the keyboard. Expected: the same operations work without dragging.
12. Add a column to an overflowing table. Expected: the new column is revealed as before. Open fullscreen preview. Expected: the preview contains no dash handles. Open an existing merged table or read-only document. Expected: structural menu actions are disabled and dragging makes no change.

## Known limits

Merged-cell structural editing remains disabled. Dragging targets rows and columns by their rendered positions; automatic scrolling while holding a drag at a viewport edge is not included. Menu move actions remain available for moving through long tables. This enhancement applies to Markdown Live Preview table blocks.

## Suggested commit

`feat(editor): add table border handles and row actions`

Remain in the current editor review; do not start another phase without explicit approval.
