# Boards interface simplification

## Phase

Boards phase 4 — manual review refinement, approved by “okey go ahead” after the interface simplification proposal on 2026-10-19. No later phase started.

## Implemented

- Combined creation and history into one dock: Select, Hand, Text, Add, undo and redo. History stays visible during editing while placement controls hide.
- Moved image placement and linked-page/new-Document insertion under Add. Replaced large block sample cards with a smaller two-column menu containing labels and descriptions. All existing block choices remain available; the menu has a viewport-constrained scrolling area.
- Reduced the header to Back, title and Board options. Details and favorite actions now live in that menu.
- Reduced selected-block controls to identity/text style, Edit/Done, contextual editor formatting and More. More contains properties, duplicate, layers and delete; multi-selection adds an Arrange submenu with the existing selection-count restrictions. Mutating selection actions remain absent during editing.
- Removed the permanent block count, redundant Editing label, empty-board slogan and shortcut text, and unused styles for removed elements. Kept the contextual placement/cancel hint and a single empty-board instruction.
- Softened panel shadows and unified panel corners. Kept compact zoom/view controls in the bottom corner and the existing narrow-screen separation between docks.
- Preserved placement keyboard focus, transferred focus to resource/details/properties surfaces when opened from menus, and restored details focus to the persistent Board options trigger when dismissed.

## Commits

No commit created. Suggested messages:

- `refactor(boards): simplify canvas toolbar and contextual actions`
- `docs(boards): record interface simplification and manual review`

The workspace already contained substantial uncommitted Board/editor work. This pass edits only Board presentation components/styles and its documentation; existing unrelated edits are preserved.

## Migrations / persistent format changes

None. No endpoint, Board schema, resource ownership, content format or archive changes.

## Validation

- Targeted `vp fmt`: PASS on the 11 changed source/style files.
- `npm run types:check`: PASS.
- `npm run lint`: PASS; all 639 checked files formatted, no warnings or lint errors across 536 linted files.
- `npm run build`: PASS, with warnings about chunks exceeding 500 kB, ineffective dynamic imports in the existing Document modules, and plugin timing.
- `git diff --check`: PASS.
- Changed source files remain below 500 lines; Board canvas is 441 lines.
- No automated tests written or run, per user instructions. PHP checks are not relevant to this frontend-only change.

## Manual validation for the user

Use a disposable Board with several block kinds and an existing Document in the same workspace.

1. Open an empty Board. Expected: Back, title and one Board options trigger at the top; Select/Hand/Text/Add and grouped history below; zoom/view in the corner; one sentence explaining placement; no block count or separate history panel.
2. Choose Text and click the canvas. Type content, finish editing and wait for Saved. Expected: ordinary select/edit behavior and persistence after reload. Placement tools hide while editing, but history remains available.
3. Open Add and choose Image. Click to place it and use upload or Library. Repeat for Heading, List, Quote, Callout, Table, File, Code, Math, Diagram and Divider. Expected: each choice remains available, active placement is indicated, and media/editor behavior is retained.
4. Focus Add with Tab, open it, use arrow keys/typeahead to choose a block and press Enter. Press Enter again on the canvas. Expected: selection closes the menu, the canvas retains focus, and the block is placed at the center. Choose another tool and press Escape before placement: no block is created.
5. Open Add → Link page or create Document. Link an existing Document, then create a sibling Document through the same picker. Expected: focus enters the picker, cards appear, existing Document editing saves to its original page, and new Documents retain their normal parent.
6. Open Board options → Board details. Edit the title/media, close the dialog, then use Board options to toggle favorite and reload. Expected: details are editable, closing returns focus to Board options, and the chosen favorite state persists. Check Back returns through existing navigation/parent fallback.
7. Select a writing block. Expected: text style, Edit and More appear; duplicate, layers and properties are inside More. Double-click or use Edit, then select text: relevant formatting remains available and Done exits editing.
8. Open More → Properties, adjust width or position, then close with Escape or the close button. Expected: focus enters the panel, changes apply, and focus returns to More or the canvas. Automatic content height and corner scaling keep their existing behavior.
9. Use More → Duplicate selection; undo and redo with dock buttons and keyboard shortcuts. Expected: one duplicate, reversible changes, and correctly disabled history buttons when unavailable. Also undo/redo a native text edit while its editor stays open.
10. Select two blocks and open More → Arrange selection. Align them, then select three and distribute them. Expected: alignment requires at least two and distribution at least three; one history action per arrangement. Bring a block forward/back and confirm the layer changes.
11. Select a resource card and choose More → Remove from board (keep pages). Expected: the card disappears and its original page remains. Undo restores the card. Ordinary blocks retain Delete selection.
12. Use zoom out/in, Fit all, View options → Fit selection, Reset to 100%, grid, snap, guides and Canvas controls. Expected: existing camera/settings/help behavior remains accessible.
13. Repeat at 1440px, 768px and 360px widths, in light/dark and Normal/Frosted appearance, and with reduced motion. Expected: readable menus, no dock overlap, scrollable Add menu on short screens, usable touch targets and visible keyboard focus. Verify Properties can be opened/closed on narrow screens where it hides the selection toolbar.
14. On the disposable Board, disable the network and make an edit. Expected: explicit unsaved/error feedback and recovery actions remain available. Restore the network and retry where offered; wait for Saved and reload to confirm persistence. Confirm error recovery still protects unsaved linked-Document work.

## Known limits

Interactive/manual acceptance remains pending. Desktop inspection was attempted through Computer Use, but screenshot capture failed across GNOME/portal/fallback methods and no browser window was exposed in the accessible application list. Static checks establish compilation and lint correctness, not visual or interaction acceptance. Existing build warnings remain.

## Verification refinements

- Retained history while editing when combining docks, avoiding a loss of the previous editor-time undo/redo controls.
- Suppressed menu focus restoration when another surface is opening, so keyboard placement and dialog/panel focus are not pulled back into the dock.
- Kept properties available during editing while preserving the existing restrictions on duplication/layers/removal in that state.

## Stop gate

Remain in the current phase-4 review. Await manual feedback before any further phase.
