# Database document context menus

## Changes

Added right-click actions to Table document rows and Gallery document cards in natural and uniform layouts. Both reuse the shared animated PositionedMenu with document-specific Open document, Open in new tab, and Move to Trash actions. New tab uses Orbium app navigation, and Trash keeps its existing confirmation.

Shift+F10 and the context-menu key open actions from focused document controls. Native text-editing context menus are preserved for inputs, textareas, and editable content. Escape, outside interaction, page scroll, and resizing dismiss the menu; focus restoration uses an existing document control. Existing overflow/Trash buttons remain available.

No backend, persistence, dependency, or document-format changes. No automated tests written or run, as instructed. Manual browser review remains pending.

## Validation

- Frontend TypeScript: passed.
- Lint and formatting: passed (490 formatted files; no warnings or lint errors in 404 files).
- Production build: passed, with existing import overlap, chunk size, and plugin timing warnings.
- `git diff --check`: passed.

## Manual checklist

1. Right-click a Table document title, a non-editable cell, and unused space in the same row.
   Expected: the menu names the correct document and offers Open document, Open in new tab, and Move to Trash without navigating first.
2. Use Open document, then return and use Open in new tab.
   Expected: the first opens that document normally; the second creates an Orbium app tab while preserving the database tab.
3. Select Move to Trash, then Cancel. Repeat and confirm using a disposable document.
   Expected: cancel preserves the row; confirmation removes the correct document and permits restoration from workspace Trash.
4. Repeat these actions on Gallery cards in natural and uniform layouts, including cover/title/property areas.
   Expected: identical document actions and confirmation; opening the menu does not open the card.
5. Focus a Table document link or Gallery card, then press Shift+F10 or the context-menu key.
   Expected: the menu opens near the focused control. Arrow keys navigate, Enter activates, and Escape dismisses with focus restored.
6. Right-click inside a title rename input or editable text/number cell.
   Expected: the browser's native text-editing menu remains available.
7. Open a context menu near the viewport edges, then click outside, scroll, or resize.
   Expected: menu stays on screen and dismisses as appropriate without changing data.
8. Confirm normal left clicks, property editing, Table overflow actions, and Gallery Trash buttons still work.
   Expected: existing interactions remain available.
9. Enable reduced motion and repeat opening the menu.
   Expected: the shared menu respects reduced motion, with usable keyboard actions.

Suggested commit: `feat(databases): add document context menus to table and gallery`
