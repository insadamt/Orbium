# Explorer stacked drag motion

Focused follow-up to manual review of explorer bulk actions; no additional phase started.

## Implemented

- Replaced native HTML drag gestures with pointer-driven dragging so GSAP can control lift, grouping, following, and release animation.
- Moving at least 6 pixels starts a drag. Ordinary clicks, Ctrl/Cmd selection clicks, context menus, and keyboard opening remain separate.
- Cards animate from their individual screen positions into an overlapping stack under the pointer. Small offsets expose the cards underneath; depth is capped after six cards to keep large selections compact.
- Originals are hidden during the drag with layout slots retained. Clones preserve the card content, including Gallery covers. There is no additional browser ghost.
- Releasing anywhere animates each card back to its individual layout slot. Valid folder/reorder/parent-zone drops then apply the existing hierarchy move. Invalid release or Escape restores positions without mutation.
- Pointer cancellation, window blur, and component unmount clean up listeners and animations.
- Reduced motion switches stack/return positions immediately.
- Removed checkmark badges and selection tint. Selected items retain the solid outline in Grid, List, Gallery, Normal, and Frosted appearance. Search reveal uses its separate dashed outline.
- Click events caused by drag release are suppressed so release does not open a page or clear selection.
- Extracted destination resolution into a focused helper; all changed TypeScript source files remain under 500 lines.

No persisted data or format changes. No commit created.

## Checks

- Targeted formatting/lint: passed after removing an unused Check import identified during the first check.
- `npm run types:check`: passed.
- `npm run lint`: passed; 450 checked files formatted, no warnings or lint errors in 368 files.
- `npm run build`: passed, exit code 0, 11.11 seconds. Existing large-chunk, ineffective dynamic import, and plugin timing warnings remain.
- `git diff --check`: passed.
- No automated tests written or run, per user instructions. Pointer interactions and motion await manual visual review.

## Manual checklist

1. In Grid, Ctrl+click three nonadjacent folders/pages.
   - Expected: only a solid selection outline appears, with no checkmark or selection tint. The selection count is correct.
2. Drag any selected item more than 6 pixels, then move slowly and quickly across the explorer.
   - Expected: each selected card lifts from its own position and gathers smoothly into one overlapping stack under the pointer. Cards underneath peek out slightly. Originals do not remain visible and no grid/row preview appears.
3. Release over empty space.
   - Expected: the stack separates and each card animates back to its own position. Hierarchy and selection remain unchanged, and no page opens.
4. Drag again and press Escape. Repeat while switching to another application/window during dragging.
   - Expected: cards settle back, no move is saved, and another drag works afterward.
5. Drag the selected group into the center of an unselected folder.
   - Expected: the folder highlights. On release, cards settle back, then the full group moves into the folder with contents and original sibling order retained. Reload to verify.
6. Drag selected items before/after an unselected sibling and, inside a folder, onto Move to parent/root.
   - Expected: valid group reorder/move is saved after release; no selected item is left behind.
7. Repeat in List and Gallery, including natural Gallery cards with different cover heights.
   - Expected: the preview is an overlapping stack in every layout, and cards return to their individual sizes and positions on release.
8. Drag one unselected item while others are selected.
   - Expected: only the dragged item lifts and moves; the other selected items remain in place.
9. Enable reduced motion and repeat selection, dragging, valid drop, and cancellation.
   - Expected: the stack follows and returns immediately without animated travel; valid moves still work.
10. Verify ordinary click, Ctrl+click, Space selection, Ctrl+Enter, and overflow menus after several drag/drop operations.
    - Expected: normal navigation and selection still work; drag release never triggers accidental navigation.

## Limitations

The separate Orbing view is unchanged. The stack caps visible offset depth for large selections. Layout slots remain reserved during dragging. Valid drops use the existing server move after the visual return; pending or failed moves retain the normal error feedback.

Suggested commit: `feat(hierarchy): animate explorer drag selections as a stack`
