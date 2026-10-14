# Explorer bottom drag-to-Trash target

Focused extension to the current explorer review. No additional phase started.

## Implemented

- Added a fixed bottom-center delete drop target shown while dragging an item or selection.
- GSAP slides/fades the target into view and animates a red ambient glow beneath the center of the viewport. Hovering intensifies and expands the glow.
- Labels show the dragged count, release instruction, and pending Trash status.
- Dropping directly shrinks/fades the stack into the target and sends exactly the dragged IDs to restorable Trash through the existing atomic batch endpoint.
- Source layout remains collapsed on success. Failed requests restore the source cards and selection/layout normally.
- Hide the selection action toolbar while dragging to keep the target unobstructed. Normal toolbar and overflow Delete actions still confirm.
- Scoped portal drop detection to the active workspace. The target remains viewport anchored during page scrolling.
- Reduced motion switches without animated travel/glow transitions. Component cleanup stops target tweens.
- Extracted a named Trash mutation helper reused by drag deletion and the existing single-item confirmation dialog. New source files remain below 500 lines.

No migrations, backend-rule changes, persistent format changes, or commit created.

## Validation

- Targeted formatting/lint: passed.
- `npm run types:check`: passed.
- `npm run lint`: passed; 454 files formatted and no warnings or lint errors in 371 files.
- `npm run build`: passed, exit code 0, 11.64 seconds. Large-chunk and ineffective dynamic import warnings remain.
- `git diff --check`: passed.
- No automated tests written or run, per user instructions. Interactive animation awaits manual review.

## Manual checklist

1. Ctrl+click multiple sibling pages/folders and start dragging.
   - Expected: a delete target animates into the bottom center with a red glow. It shows the correct group count, and the normal selection toolbar is hidden.
2. Move the stack into and out of that target without releasing.
   - Expected: the glow grows/brights on entry and dims on exit. The label switches between drop and release instructions; no items are deleted by hovering alone.
3. Drop on the target.
   - Expected: the stack shrinks/fades into the bottom target without returning to source positions. Items go to Trash immediately with pending/success feedback; remaining siblings keep their compact layout, and the target animates away.
4. Open Trash and restore the deleted items.
   - Expected: every dragged item and its contents can be recovered.
5. Drag an unselected item while other items are selected and drop it on the target.
   - Expected: only the actually dragged item goes to Trash. Other selected items remain intact.
6. Hover the delete target, move away, and release on empty space; repeat with Escape.
   - Expected: nothing is deleted, cards return, and the target disappears.
7. Repeat in Grid, List, fixed Gallery, natural Gallery, and inside a folder. Scroll the page before dragging.
   - Expected: the target remains fixed at the viewport bottom center and works consistently. Existing folder absorption, reordering, and parent/root drops still work.
8. If manually blocking the Trash request in browser developer tools, drop on the target.
   - Expected: failure feedback appears; cards and layout recover, and refresh confirms that content is intact.
9. Enable reduced motion and repeat hover/drop/cancel.
   - Expected: the same deletion/recovery behavior without animated travel or glow transitions.
10. Use ordinary toolbar/overflow deletion and keyboard navigation.
    - Expected: existing confirmation and keyboard actions remain usable.

## Limitations

The target sends content to Trash, not permanent deletion. Drag-to-Trash applies to Grid/List/Gallery explorer views; Orbing is unchanged. Keyboard users retain the existing Delete toolbar/menu actions.

Suggested commit: `feat(hierarchy): add animated bottom drag-to-trash target`
