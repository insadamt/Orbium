# Editor review — Reveal added table columns

Date: 2026-10-14. Focused change within the current editor review.

## Changes

Adding a column with the table's edge Plus button now scrolls the table horizontally to reveal the new column. The request's vertical scrolling wording is interpreted as revealing the added column along the table's horizontal overflow axis.

After a successful source edit, CodeMirror measures the rendered last header cell against the table scroller's visible bounds. The scroller moves only as far as necessary to reveal that cell, supporting both LTR and RTL layouts. Scrolling is immediate, including with reduced motion enabled. The scroll operation changes only the table's horizontal offset.

Failed or disabled edits do not request scrolling. Adding rows, ordinary edits, sorting and initial document rendering do not trigger this reveal behavior. Existing undo/redo and autosave paths remain in use. No dependencies, migrations or persistent format changes. No commit created.

## Validation

- `npm run lint`: passed, including formatting; 435 files formatted correctly, 354 files linted without warnings or errors.
- `npm run types:check`: passed.
- `npm run build`: passed; existing build warnings remain.
- `git diff --check`: passed.
- No automated tests written or run, as instructed. Browser acceptance remains pending manual testing.

## Manual test checklist

1. Open a Markdown table in Live Preview in a narrow document pane. Add enough columns with the edge Plus button to overflow its width. Expected: each new column is revealed automatically as soon as it renders.
2. Scroll an overflowing table back to its beginning, then add a column. Expected: the table scrolls to reveal its new final column; the page retains its vertical position.
3. Repeat with a short table that still fits completely in the pane. Expected: the new column appears without unnecessary horizontal scrolling.
4. Repeat in an RTL table and in either side of a split view. Expected: the new column is revealed on the correct side, and the other pane is unaffected.
5. Add several columns quickly. Expected: the last added column becomes visible and each click adds exactly one column. Edit the new column, undo/redo, wait for Saved and reload. Expected: table content and structure remain correct.
6. Manually scroll back to the beginning, edit a cell, sort, and add a row. Expected: none triggers the new column-reveal behavior. Check an existing merged table or read-only editor. Expected: disabled Add column controls leave structure and scrolling unchanged.
7. Enable reduced motion and add a column to a wide table. Expected: the new column is revealed immediately, with no scrolling animation.

## Suggested commit

`fix(editor): scroll newly added table columns into view`

Remain in the current editor review; do not start another phase without explicit approval.
