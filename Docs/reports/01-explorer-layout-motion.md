# Explorer gap closing and lifecycle motion

Focused continuation of the user's explorer review. No additional phase started.

## Implemented

- Lifted cards leave the layout. Remaining cards animate into the vacated positions instead of retaining empty slots.
- Releasing or canceling restores the slots while the other cards animate aside and the stacked cards return. The existing synchronous handoff avoids a second fade.
- Added GSAP layout motion for persisted sibling reorders, removal, and moves out of the current container. Departing cards fade/shrink while remaining siblings animate into their new positions.
- Layout motion works in Grid, List, fixed Gallery, and natural Gallery.
- Natural Gallery excludes lifted IDs from its masonry placement calculations while keeping source elements mounted for return animation. Hidden cards do not overwrite measured heights with zero.
- Single-item explorer deletion uses the existing atomic bulk endpoint with one ID so the current folder remains visible and its layout can animate.
- Departure effects reflect successful server updates; failed requests retain the original hierarchy.
- Reduced motion applies the changes immediately. Animation elements and tweens are cleaned up on unmount; departure clones do not enter keyboard navigation.

No migrations, persisted schema changes, or archive/editor format changes. No commit created.

## Validation

- Targeted formatting/lint: passed.
- `npm run types:check`: passed.
- `npm run lint`: passed; 451 files formatted, no warnings or lint errors in 369 files.
- `npm run build`: passed, exit code 0, 9.98 seconds. Large-chunk and ineffective dynamic import warnings remain.
- `git diff --check`: passed.
- No automated tests written or run, per user instructions. Layout motion awaits visual manual review.

## Manual checklist

1. Create at least eight sibling folders/pages and select three nonadjacent items near the beginning.
   - Expected: only borders identify selection.
2. Drag one selected item into the stack.
   - Expected: all selected items lift, remaining siblings slide into the vacated positions, and no blank slots remain between them.
3. Release over empty space, then repeat using Escape.
   - Expected: siblings slide aside while the selected cards return to their positions. No blink, lost selection, accidental navigation, or hierarchy change occurs.
4. Repeat dragging/releasing quickly while previous layout motion is still finishing.
   - Expected: cards move from their current visible positions without abrupt position jumps or leftover previews.
5. Drag the selection before/after an unselected sibling.
   - Expected: the group return and the persisted reorder both animate; selected items keep relative order. Reload confirms the new order.
6. Drag selected items into another folder or the parent/root drop zone. Also use the bulk Move dialog.
   - Expected: the entire group moves; outgoing cards fade/shrink and remaining cards close the gaps smoothly. Open the destination and verify contents/order.
7. Delete a selection using the confirmed bulk action, then delete one item using its overflow menu.
   - Expected: successful deletions animate out, survivors close gaps, and the current folder stays open. Restore the items from Trash and verify their contents.
8. Repeat steps 2–7 in Grid, List, fixed Gallery, and natural Gallery with covers of different heights.
   - Expected: no retained gaps while lifted; masonry positions recalculate and animate; short Gallery cards keep their size during departure.
9. Hover returned cards, move the pointer away, and navigate to overflow buttons using Tab.
   - Expected: three dots appear only on hover or keyboard-visible focus; selection remains border-only.
10. Enable reduced motion and repeat drag cancellation, reorder, move, and delete.
    - Expected: identical hierarchy behavior with immediate layout changes and no animated travel.

## Limitations

The separate Orbing view is unchanged. Move/deletion departure animations start when the server update succeeds. The stack's small offset depth remains capped for large selections.

Suggested commits:

- `feat(hierarchy): animate explorer gap closing and item lifecycle`
- Alternative: `feat(workspaces): animate layout changes during group drag and removal`
