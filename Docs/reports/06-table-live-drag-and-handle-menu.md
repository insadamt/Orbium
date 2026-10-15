# Editor review — Live table dragging and border menu interaction

Date: 2026-10-15. Fixes within the current editor review.

## Changes

- Row and column dragging now transforms the actual table cells. Removed the cloned table overlay and faint source cells, so the original space becomes empty as the cells move. Neighbors still slide aside, and the moving cells settle before the normal reorder writes to the document.
- Movement stays within the original table bounds. Existing cell dimensions, formatting, direction, and interface scaling come from the live DOM. Cancellation restores the original inline styles.
- Border handle mouse presses preserve the active cell's focus until opening options or starting a drag explicitly closes its editor. Pointer presses now reach document-level menu dismissal listeners. Opening the menu closes the active cell editor before rendering options.
- Updated the table interaction specification.

No dependencies, migrations, or persistent format changes. No commit created. Existing unrelated code-copy changes were left in place. Changed source files remain below 500 lines.

## Validation

- Targeted `npx vp fmt`: passed.
- `npm run lint`: passed; 482 files formatted correctly, 397 files linted without warnings or errors.
- `npm run types:check`: passed.
- `npm run build`: passed in 12.27 seconds. Large chunk, mixed static/dynamic import, and plugin timing warnings remain.
- `git diff --check`: passed.
- No automated tests written or run, as instructed. Browser interaction and visual acceptance remain pending manual verification, including confirmation that the reported border-menu failure is resolved.

## Manual test checklist

1. Reload a document in Markdown Live Preview with a table containing at least three rows and three columns with distinct labels. Drag the middle column slowly left and right, then drop it in a new position. Expected: the actual cells and their handle move together, the original slot becomes empty without a faint duplicate, neighbors move aside, and the new order commits on release. Repeat vertically with a row.
2. Drag beyond each table edge, then return to the starting slot. Expected: cells stay within the table bounds; releasing in the original position leaves the order unchanged. Drag again and press Escape. Expected: all cells return with no leftover transforms.
3. Click a top-border dash and a leading row-border dash without dragging. Expected: the appropriate column or row options open. Repeat while editing a cell, after typing new content. Expected: the editor closes, the latest content remains, and the options remain usable. Select Sort, Insert, Delete, and Move actions on a disposable table. Expected: each enabled action changes the intended row or column.
4. Dismiss options with Escape and an outside click, reopen them, and switch between different row/column handles. Expected: one usable menu appears for the selected handle. Drag and release, then click the handle again. Expected: dropping does not open options accidentally, and a subsequent click does.
5. Move unequal-width columns and multiline rows in light/dark themes, RTL, a narrow split pane, and a non-default interface scale. Expected: cell sizes and content remain intact, cells follow the pointer along the correct axis, and options work in the visible pane.
6. Cancel a drag by scrolling, resizing, or switching windows. Repeat with reduced motion enabled. Expected: cancellation restores cells without changing source; reduced motion retains direct dragging and immediate positioning. Move from an options menu as well. Expected: the live cells move and the result commits.
7. Complete a move, undo and redo it, wait for Saved, then reload. Expected: content and final order persist. Edit cells and insert/delete rows afterward. Expected: no stale transforms or broken controls. Merged/read-only tables should retain their structural restrictions.

## Known limitations

Automatic edge scrolling is not added. Live cells remain clipped by the table's existing scroll container. Manual confirmation of the menu fix and drag appearance is required.

## Suggested commit

`fix(editor): move live table cells and preserve border menu interaction`

Remain in the current editor review; await manual feedback before starting another phase.
