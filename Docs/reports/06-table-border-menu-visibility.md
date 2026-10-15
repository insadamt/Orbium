# Editor review — Table border menu visibility

Date: 2026-10-15. Follow-up after the user confirmed the preceding focus adjustment did not resolve the missing row/column options.

## Changes

Replaced the table menu's separate React root and portaled dropdown bridge with synchronous rendering into its existing body-mounted menu element. Clicking a border handle now constructs and positions the menu directly beside that handle. The menu uses the shared app menu styling, entrance animation, and animated hover highlight.

Native buttons run the existing row/column actions. Arrow keys, Home/End, Enter/Space, Escape, and Tab remain available; disabled actions are skipped during arrow navigation. Opening focuses the first enabled item without scrolling. Outside clicks, actual scrolling of the originating table's ancestors, and window resizing dismiss the menu. Queued scroll events with unchanged positions and scrolling inside the menu do not dismiss it. Closing and destruction clean up menu content, highlight effects, and viewport listeners.

Updated the border handles' accessibility metadata to identify their popup as a menu. The earlier live-cell dragging change remains in place. No dependencies, migrations, persistent format changes, or commits. Unrelated database and code-copy work was left in place.

## Validation

- Targeted formatting and lint: passed for both changed menu files.
- `npm run types:check`: passed.
- `npm run build`: passed; existing large chunk, mixed static/dynamic import, and plugin timing warnings remain.
- `npm run lint`: failed on formatting in seven database files being changed separately: `database-card-context-menu.tsx`, `database-empty-state.tsx`, `database-gallery.tsx`, `database-query-controls.tsx`, `database-sort-editor.tsx`, `database-table.tsx`, and `show.tsx`. These files were not reformatted as part of this fix.
- `git diff --check`: passed.
- No automated tests written or run, as instructed. Browser confirmation remains pending; no claim of an observed browser reproduction or verified click interaction.

## Manual test checklist

1. Reload a document containing a Markdown Live Preview table. Click the dash in the middle of a column's top border. Expected: Column options immediately appears beside the handle, including Sort ascending/descending, Move left/right, and Delete column.
2. Click the dash in a row's leading border. Expected: Row options appears with Insert above/below, Move up/down, and Delete row. Switch among different handles. Expected: only the current options menu is visible. Click the same dash twice. Expected: the menu toggles closed.
3. Type in a cell, then click a dash. Expected: the cell editor closes without losing its latest text and options stay visible. Run sorting, insertion, deletion, and move actions on a disposable table. Expected: each action applies to the intended row or column; unavailable boundary actions are disabled.
4. Tab to a dash and press Enter. Use Up/Down, Home/End, and Enter or Space. Expected: enabled actions can be selected and invoked. Press Escape. Expected: the menu closes and focus returns to its handle. Click outside and reopen. Expected: no stale menu remains.
5. Open near the viewport's bottom/right edges and in a narrow pane, with light/dark and reduced motion. Expected: the menu remains within the viewport and matches other app menus. Scroll the document/table or resize. Expected: it closes. Scroll within a long menu if necessary. Expected: the menu remains usable.
6. Drag a row/column and release, then click its dash. Expected: dropping does not accidentally open options, but the following click does. Undo/redo an action, wait for Saved, and reload. Expected: table content and order persist.

## Suggested commit

`fix(editor): render table border menus synchronously`

Remain in the current editor review and await manual feedback.
