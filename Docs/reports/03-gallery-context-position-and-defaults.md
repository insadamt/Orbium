# Gallery context positioning and defaults

## Changes

- Render the database document context menu at the document body. Its fixed anchor previously inherited the database surface's containing block from frosted filtering or transforms, despite using viewport pointer coordinates. The anchor now shares the viewport coordinate space of the menu content. Reopening at a different point remounts the anchor and refreshes focus restoration.
- Use pointer coordinates directly, including zero at viewport edges. Keyboard menus remain anchored beside the focused control.
- Remove Gallery cards' standalone Trash buttons and their reserved title spacing. Trash remains in the context menu, with the existing confirmation; Shift+F10 provides keyboard access.
- Hide properties by default in Gallery rendering and settings. Previously saved explicit Gallery visibility choices remain in effect. Newly created properties no longer append to Gallery visibility lists; Table retains visible-by-default creation.

## Validation

- Pint and PHP syntax: passed.
- Frontend TypeScript, lint, formatting, production build, and diff whitespace checks: passed.
- Production build retains import overlap, chunk size, and plugin timing warnings.
- Full PHP static analysis was not rerun; the previous run reported 63 errors in existing code.

## Manual checklist

1. Enable Frosted appearance. Right-click several Table rows and Gallery cards, including cards well down the page and in both natural/uniform layouts.
   Expected: the menu opens beside the pointer, adjusting only to fit viewport edges.
2. Right-click the same card at different positions, then a different card. Repeat in a split pane and Solid appearance.
   Expected: each menu follows the latest click and actions affect the correct document.
3. Open near all viewport edges. Press Escape, click outside, or scroll/resize the page.
   Expected: the menu fits the viewport, dismisses correctly, and restores focus without scrolling.
4. Focus a Gallery card or Table document link and press Shift+F10.
   Expected: the menu opens beside the focused control. Open, Open in new tab, and Move to Trash remain available.
5. Inspect Gallery cards in both layouts.
   Expected: no standalone delete button and no empty title space reserved for it. Context-menu Trash still asks for confirmation; Cancel preserves the document.
6. Open Gallery on a database without a saved visibility selection; open Gallery settings.
   Expected: cards show no custom properties and all visibility toggles start hidden. Table still displays its properties.
7. Enable one Gallery property, Apply, then reload.
   Expected: only that property appears and remains enabled. Previously saved explicit choices are preserved.
8. Create a new property, including with all Gallery properties hidden.
   Expected: the new property appears in Table but stays hidden in Gallery. Existing visibility, sort/filter, and appearance choices remain intact.

No automated tests written or run, per project instructions. Browser visual and interaction verification remains manual.

Suggested commit: `fix(databases): position context menus and simplify gallery cards`
