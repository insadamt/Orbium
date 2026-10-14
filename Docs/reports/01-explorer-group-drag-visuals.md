# Explorer group drag visual review

Focused follow-up to explorer bulk actions; no additional phase started.

## Changes

Dragging a selected card now gathers all selected visible cards into one horizontal row centered on the pointer. The original cards become invisible without shifting surrounding drop targets. A transparent native drag image prevents a second browser ghost. The row uses compact icon/name cards across Grid, List, and Gallery, retains sibling order, and scales down to fit the viewport for large selections. Listeners and preview elements are removed on drop, drag cancellation, and component unmount.

No changes to persisted data, batch endpoints, or move validation. No commit created.

## Checks

- Targeted formatting/lint: passed.
- `npm run types:check`: passed.
- `npm run lint`: passed, 449 files formatted and no warnings or lint errors in 367 files.
- `npm run build`: completed successfully in 13.80 seconds; reported large chunks, ineffective dynamic imports, and plugin timing warnings.
- `git diff --check`: passed.
- No automated tests written or run, per user instructions. Visual behavior needs user manual review.

## Manual test checklist

1. In Grid, Ctrl+click three sibling folders, then drag any one.
   - Expected: all three icon/name cards form one row centered under the pointer, in their original sibling order. None remains visibly fixed in its original slot, and no extra browser ghost appears.
2. Move the pointer across empty space and over a valid unselected folder.
   - Expected: the row follows together without blocking the destination's drop highlight. Drop in its center; all three move into that folder with their contents and order intact.
3. Select several cards, drag, then press Escape. Repeat and release over invalid empty space.
   - Expected: the row disappears, original cards become visible again, selection remains, and nothing moves.
4. Repeat with a single item, a nonadjacent selection, and enough selected items to exceed the viewport width.
   - Expected: the row remains centered; larger selections scale to fit horizontally and all selected cards are represented.
5. Repeat in List and Gallery. Drop before/after an unselected sibling and into the parent-folder drop zone when available.
   - Expected: group visual works in each view; valid moves/reorders apply to the full group. Reload to confirm persistence.
6. After dropping or canceling, drag another item immediately.
   - Expected: no old row remains and no duplicate preview appears.

## Limitations

Empty layout slots are intentionally retained during dragging to keep drop targets stable. Large selections may have small preview labels because the full row scales to fit the viewport. The separate Orbing view is unchanged.

Suggested commit: `fix(hierarchy): lift selected items into a centered drag row`
