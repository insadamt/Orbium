# Explorer drag and selection correction

Follow-up to user review: dragging stopped working after the group preview change, and selected pages were difficult to distinguish. No additional phase started.

## Changes

- Replaced the custom DOM pointer-following row and transparent canvas ghost with a single centered native drag image containing the full selected row.
- Source items stay hit-testable. Hiding them is deferred until the animation frame after native drag initialization, avoiding immediate source mutation during dragstart.
- Drag identity is stored immediately in a ref so drop validation does not depend on the deferred React render.
- Pending initialization frames and preview elements are cleaned up on completion, cancellation, and component unmount.
- Cover and icon images have native image dragging disabled so the item owns drag gestures.
- Selected cards show a solid foreground outline and a contrasting checkmark badge across Grid, List, Gallery, and frosted surfaces.
- Search-revealed items use a separate dashed outline; reveal highlighting no longer marks an item selected in its accessibility or bulk action state.

No migrations or persistent format changes. No commit created.

## Checks

- Targeted formatting and lint: passed.
- `npm run types:check`: passed.
- `npm run lint`: passed, all 449 files formatted; no warnings or lint errors in 367 files.
- `npm run build`: passed, exit code 0, 14.42 seconds. Large chunk, ineffective dynamic import, and plugin timing warnings remain.
- `git diff --check`: passed.
- No automated tests written or run, per user instructions. Native browser dragging and visual appearance await manual confirmation.

## Manual checklist

1. Refresh the workspace. Ctrl+click two folders and a page in Grid.
   - Expected: only selected cards have a solid outline and checkmark; action count reads 3 selected. Ctrl+click one again removes its badge/outline and reduces count to 2.
2. Drag one selected item from its icon or title into the center of an unselected folder.
   - Expected: one centered row represents the selected items; originals are invisible during drag. The destination highlights and all selected items move together on drop.
3. Drag a single unselected item into another folder.
   - Expected: only that item moves, even if other items are selected.
4. Select two sibling items and drop before/after an unselected sibling.
   - Expected: both reorder together in original relative order; reload preserves the new order.
5. Drag a selection, press Escape, then start another drag. Also release a drag over invalid empty space.
   - Expected: source cards reappear, no preview remains, canceled/invalid drops do not move anything, and another drag works immediately.
6. Repeat in List and Gallery, dragging directly from a Gallery cover and an uploaded icon.
   - Expected: the group drag works instead of dragging only the image; each selected Gallery cover has a visible checkmark and outline.
7. Repeat selection in Light/Dark and Normal/Frosted appearance.
   - Expected: checkmarks and solid outlines remain visible in each combination.
8. Open a search-revealed item in its explorer context.
   - Expected: the reveal cue is dashed with no checkmark or bulk selection count until explicitly selected.
9. Inside a folder, select several children and drop into the Move to parent/root zone.
   - Expected: all selected children move up together and retain their contents.

## Limitations

Browser controls the native drag image's appearance. Large selections scale down to fit the viewport. Source layout slots remain empty during the drag to keep destinations stable. Orbing is unchanged.

Suggested commit: `fix(hierarchy): restore group dragging and clarify item selection`
