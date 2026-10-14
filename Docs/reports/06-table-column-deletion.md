# Editor review — Table column deletion

Date: 2026-10-14. Focused change within the current editor review.

## Changes

Markdown Live Preview table header menus now offer Delete column below the existing sorting actions. Deletion removes the selected header and every body cell in that column, along with its alignment entry. Surviving cells retain their content, formatting, alignment and stored widths. The existing source edit path supplies undo/redo and autosave. The menu closes and focus returns to the document editor.

Deletion is disabled for read-only editors, tables with merged cells, and the last remaining column. This preserves the existing structural editing rules and the requirement for a nonempty rectangular table. Deletion clears the temporary sort indicator; rebuilding table headers clears references to removed header controls.

No dependencies, migrations or persisted format changes. No commit created.

## Validation

- Targeted formatter/linter: passed after fixing the initial formatting finding.
- `npm run lint`: passed, including formatting.
- `npm run types:check`: passed.
- `npm run build`: passed. Existing large-chunk, mixed static/dynamic import and plugin timing warnings remain.
- `git diff --check`: passed.
- No automated tests written or run, as instructed. Browser acceptance remains pending manual testing.

## Manual test checklist

1. Open a Markdown document in Live Preview. Create a table with three columns named A, B and C and two body rows containing distinct values. Open B's header options. Expected: Sort ascending, Sort descending and Delete column appear.
2. Choose Delete column. Expected: B's header and both body cells disappear; A and C retain their values and order, the menu closes, and no table error appears.
3. Press Ctrl+Z (Cmd+Z on macOS), then redo. Expected: undo restores the complete B column; redo removes it again. Wait for Saved and reload. Expected: the deletion persists.
4. Undo to restore the table, then delete its first and last columns in turn, reopening the correct header menu each time. Expected: exactly the chosen column disappears. With only one column remaining, Delete column is disabled. Add a column using the edge Plus button. Expected: deletion becomes available again.
5. Give columns different alignments and cells bold or colored text; use a saved rich table with widths if available. Delete a middle column. Expected: surviving cells retain their formatting, alignment and widths. Edit a surviving cell, sort it, and reopen its menu. Expected: editing and sorting still target the correct column, with no stale sort indicator after deletion.
6. Open an existing table with merged cells and, if available, a read-only document. Expected: Delete column is disabled and content remains intact.
7. Focus a header options button with Tab, open it with Enter, then Tab to Delete column and press Enter. Expected: the same deletion occurs and focus returns to the document editor. Open another menu and press Escape. Expected: dismissal restores focus to its trigger.

## Suggested commit

`feat(editor): add column deletion to table header menus`

Remain in the current editor review; do not start another phase without explicit approval.
