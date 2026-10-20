# Boards phase 4 review — Document tables

Date: 2026-10-19. Requested: make Board tables literally match Documents.

## Implemented

- Board tables reuse the actual Document Live Preview table widget and cell editor instead of the simplified Tiptap table and separate Board table menu.
- Shared Document styling, row/column border handles, axis menus, sorting, drag reordering, edge insertion, text selection formatting and fullscreen preview.
- Existing single-click selection and double-click/Enter editing remain. The initial cell follows the edit pointer. Cell Escape closes the cell; Ctrl/Cmd+Enter finishes editing. Structural actions return focus to the visible table surface.
- Changes use Board autosave/history. Portaled axis-menu undo/redo delegates to Board history. Read-only transitions close cell editors and menus; table selection formatting suppresses the overlapping block toolbar.
- Retained existing Board row/column/byte limits and nested attachment ownership checks.

## Persistence and compatibility

No migration. Existing `rows` data renders through an adapter, preserving inline marks and line breaks without an automatic data rewrite. After the first accepted edit, optional `data.table_source` preserves the Document table source and `rows` contains a rectangular source-text projection for existing clipboard/recovery consumers. The server validates a single table using the Document parser, checks matching dimensions, and validates references using the Document inspector. Full rich editing requires this app version. Independent Board objects remain independent.

## Validation

- Targeted `npx vp fmt`: passed.
- Targeted `./vendor/bin/pint --test`: passed.
- `php -l` on both changed PHP services: passed.
- `npm run types:check`: passed (final recheck).
- `npm run lint`: passed after correcting a redundant-spread warning.
- `npm run build`: passed (final recheck). Existing mixed static/dynamic import, large-chunk and plugin-timing warnings remain.
- `git diff --check`: passed, including the report.
- Automated tests were neither written nor run, as instructed. Browser/manual acceptance is pending.

## Manual test checklist

1. Open a Document containing a table and a Board containing an existing table. Hover each table. Expected: matching cell borders, header appearance, row/column handles and edge/fullscreen controls; existing Board text, inline marks and line breaks remain intact.
2. Add a new Board table. Single-click it, then double-click a specific cell and type. Press Tab and Shift+Tab. Expected: single-click selects the object; double-click edits the chosen cell; Tab moves between cells in Document order without moving the Board object.
3. Select some cell text and apply bold, italic, underline, link or text color using the Document selection toolbar. Expected: the Document formatting UI appears and the overlapping Board block toolbar yields; typing and formatting survive leaving and re-entering editing.
4. Click the bottom/right plus controls. Use row and column handles to insert/delete rows, move rows/columns, and sort a column with values `10`, `2`, `1`. Expected: Document menus and drag motion; correct structural changes and numeric sorting; added rows increase block height automatically.
5. After typing and after a structural operation, use the Board Undo/Redo buttons and Ctrl/Cmd+Z / Ctrl/Cmd+Shift+Z. Also try history while an axis menu is focused. Expected: text and structure restore correctly, without creating a second table history or losing a later edit.
6. Open fullscreen table preview, zoom/pan/fit, then close it. Expected: the same Document preview; no editable cell controls in the preview; the Board remains usable afterward.
7. Resize the table width, scale with a corner, and change Board zoom. Enter a long cell paragraph and remove it again. Expected: selection border tracks content height in both directions, horizontal overflow stays reachable, and table controls work without moving the Board object unexpectedly.
8. Finish editing with Ctrl/Cmd+Enter, wait for Saved, and reload. Expected: cell content, formatting and table order persist. Duplicate/copy/paste the table object and reload again; expected: independent copies retain the rich table.
9. On a disposable table, reach 100 rows or 30 columns and try one more addition. Expected: the addition is rejected with the Board table-limit notice; the last valid table remains intact and saves normally. Recheck an ordinary Document table afterward; expected: its normal editing and history behavior remain intact.

## Commits

No commit created. Suggested message:

`feat(boards): reuse document table editing and controls`

## Stop gate

Remain in phase-4 manual review. No later phase started.

## Follow-up — Insert controls only during editing

Requested 2026-10-19: hide Add row and Add column until edit mode. A Board-scoped
CSS rule removes these two controls outside editing, overriding their shared
hover/focus reveal. During editing they keep normal Document table visibility.
Fullscreen preview and ordinary Document tables retain their existing behavior.

Manual checklist:

1. Hover a Board table without editing and single-click to select it. Expected:
   neither Add row nor Add column appears, including with keyboard focus.
2. Double-click a cell or press Enter on the selected table. Hover the table.
   Expected: Add row and Add column appear and insert normally.
3. Finish editing with Ctrl/Cmd+Enter or select another object. Expected: both
   insertion controls disappear again; fullscreen preview remains available.
4. Open a Document table. Expected: its insertion controls behave as before.

Validation: targeted CSS formatting passed; TypeScript, production build and
`git diff --check` passed. The build retains existing chunk/import/timing
warnings. Full `npm run lint` stopped on an unrelated formatting issue in
`board-block-picker.tsx`; that file was left untouched. Targeted `vp check` confirmed CSS formatting,
but its lint stage accepts no CSS files and could not start. No automated tests
written or run.
Suggested commit: `fix(boards): show table insertion controls only while editing`.
