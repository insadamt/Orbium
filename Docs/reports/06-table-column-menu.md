# Editor review — Sorting-only table menu and cell formatting repair

Date: 2026-10-12. Current editor review only. This report replaces the broader implementation report after the user clarified the requested scope.

## Changes

Markdown Live Preview tables retain compact grid styling. First-row column menus now contain only Sort ascending and Sort descending. Statistics, autosize, pin/unpin, hiding, and Show all columns were removed. The Table options button and floating structural/formatting toolbar are no longer mounted. Existing edge Plus controls still add rows and columns.

Sorting preserves the first row and moves complete body rows using natural, case-insensitive source text ordering. Sorting uses the existing autosave/undo workflow and is disabled for merged tables and read-only editors. Existing saved widths and merged cell data remain readable.

Cell text formatting failed because the table's document-level pointer handler considered the body-mounted text selection toolbar an outside click. It destroyed the active cell editor before toolbar actions could apply. Text toolbar roots now record their owning editor in a WeakMap; the active cell recognizes only its own formatting toolbar, including its nested color picker. True outside clicks still close the cell. Bold, italic, underline, strike, inline code, links and color use the existing formatting and serialization paths.

No dependencies, migrations, or persisted format changes. No commit created. Unrelated existing Orbing changes were preserved. Legacy JSON editor and database tables are outside this change.

## Validation

- Targeted formatting: passed on six changed source files.
- `npm run types:check`: passed.
- `npm run lint`: passed; 391 files correctly formatted, 321 linted without warnings or errors.
- `npm run build`: passed in 9.14 seconds. Chunk-size and mixed static/dynamic import warnings remain.
- `git diff --check`: passed.
- No automated tests written or run, as instructed. Manual acceptance is pending; the formatting repair was verified by code inspection and static/build checks only.

## Manual test checklist

1. Reload a Markdown table in Live Preview and click a first-row menu button. Expected: only ascending and descending sorting options; no Table options button or table toolbar when editing cells.
2. Use body values `Item 10`, `Item 2`, `Item 1` with distinct adjacent values. Sort both directions. Expected: natural ordering, complete rows move together, and first row stays fixed. Undo/redo, wait for Saved, reload: row order persists.
3. Edit a body cell and select a word. Apply Bold, Italic, Underline, Strike and Inline code separately from the text toolbar. Expected: each applies to that word without closing the cell prematurely. Click another cell: formatting remains visible.
4. Select a word in a header and body cell. Open Text color, select a preset, then a custom color and Default text color. Expected: picker clicks preserve the target; color applies or clears. Add a link using the text toolbar: link renders after leaving the cell.
5. Apply formatting to two different cells in succession. Expected: each action affects its own selected text. Click a paragraph outside the table: the cell editor and its toolbar close normally.
6. Wait for Saved and reload. Expected: cell text and all chosen formatting survive. Check undo/redo while editing a cell.
7. Add a row and column with the edge Plus controls; edit cells with Tab/Shift+Tab and Escape. Expected: additions and keyboard editing continue working, without a table toolbar appearing.
8. Test Light/Dark, Normal/Frosted and a narrow split pane. Open sorting near a viewport edge; dismiss with Escape, outside click, scroll and resize. Expected: readable menu, viewport clamping, reliable dismissal, no orphan controls.
9. Open an existing table with merged cells. Expected: content survives and sorting/structural edge additions remain disabled.

## Suggested commits

- `fix(editor): preserve table cell selection during text formatting`
- `feat(editor): simplify table controls to column sorting`

Remain in editor review; do not begin another phase without explicit approval.
