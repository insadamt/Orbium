# Easier workspace and folder page reordering

## Phase

Focused Phase 1 hierarchy usability review. No next phase started.

## Implemented

- Removed the added six-dot grips following user review. Cards are dragged directly, with their original spacing restored.
- Kept card dragging for moving into valid folders/databases and the existing move-out and Trash actions. Made sibling reorder regions larger around container centers.
- Made the full surface of document cards accept before/after placement instead of rejecting drops in their centers.
- Added nearest-card insertion targeting in gaps within 48 pixels of a sibling. More distant empty space still cancels the drop.
- Made Gallery insertion markers visible inside clipped card edges, with direction-aware horizontal indicators.
- Added proportional vertical edge scrolling during active drags, including when holding the pointer still. Release, Escape, pointer cancellation, blur, and unmount stop scrolling.
- Retained Alt + arrow keyboard movement on focused cards. Corrected keyboard position calculation to use the complete sibling order while search is filtering visible items.

## Commits and compatibility

No commit created. No migrations, server endpoints, editor formats, or archive formats changed. Existing unrelated node-media styles and folder-header report were left untouched.

Suggested commit messages:

- `fix(hierarchy): make workspace and folder page reordering easier`
- `fix(hierarchy): remove explorer reorder grips`

## Validation

After removing the grips: formatting/lint, TypeScript, production build (20.2 seconds), and `git diff --check` all passed. The build retains import overlap, chunk size, and plugin timing warnings. No automated tests run.

Original implementation validation:

- `npm run types:check`: passed.
- `npm run lint`: passed; all 505 files correctly formatted, no warnings or lint errors in 416 files.
- `npm run build`: passed in 11.87 seconds. Build reports dynamic/static import overlap, chunks above 500 kB, and plugin timing warnings.
- `git diff --check`: passed.

No automated tests written or run, as instructed. Manual browser verification is for the user.

## Manual validation checklist

1. Open workspace root and a folder in Grid, List, and Gallery. Expected: no six-dot grips; card spacing matches the original layout.
2. Drag a document card before/after another card or into a nearby gap. Expected: insertion marker appears, order saves, and reload preserves it.
3. In Gallery, repeat with uniform and natural layouts. Expected: insertion markers remain visible within card edges; natural layout retains shortest-column placement.
4. Drag a card near the top/bottom of a long list. Expected: scrolling starts and stops when moving away, releasing, or pressing Escape. Escape leaves saved order unchanged.
5. Focus a card and press Alt + Up/Down in List or Alt + Left/Right in Grid/Gallery. Expected: one-position movement; filtering still uses complete sibling order.
6. Select multiple pages with Ctrl/Command + click and drag one selected card. Expected: group order persists after reload.
7. Drag a document onto the center of a folder or database. Expected: valid nesting still works; folders cannot enter databases.
8. Press Escape during a drag or release farther than 48 pixels from all siblings. Expected: cancellation preserves order. Ordinary click/Enter and overflow actions still work.
9. Repeat a reorder with reduced motion and RTL. Expected: saved order still updates; horizontal indicators match logical direction.

## Known limitations

- Browser interaction and visual checks await the user's manual review.
- Natural Gallery positions follow the existing shortest-column masonry layout; saved sibling order does not define a fixed visual row.
- Edge scrolling is vertical and operates on the nearest scrollable ancestor or the document.

## Stop gate

Await manual feedback without starting another phase.
