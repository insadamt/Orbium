# Explorer destination drop and folder absorption

Focused correction to the ongoing explorer animation review. No additional phase started.

## Implemented

- Successful cross-container drops no longer return the stack to its old positions before fading out.
- Dropping into a folder/container animates the stack into the receiving card, shrinking and fading the cards as the receiver grows to 114% and settles back to its normal size.
- The receiver pulse follows its live layout position and preserves its surface styling. Source and receiver animation clones remain inaccessible to pointer/keyboard interactions.
- Parent/root drop zones fade the stack directly at the destination without a folder pulse.
- Source cards remain lifted until the server request resolves. Successful moves do not restore old slots or trigger a second departure animation.
- Successful sibling reorders settle the stack into the newly persisted slots, rather than restoring the previous ordering first.
- Invalid drops, cancellation, and failed requests restore the layout and return the cards. Existing hierarchy validation and atomic batch behavior remain authoritative.
- Move callbacks now report success so the drag session can distinguish destination completion from recovery.
- Reduced motion skips stack travel and the receiver pulse. Unmount cancels visuals and resolves pending animation cleanup.

No migrations, backend rule changes, editor/archive format changes, or commit created.

## Validation

- Targeted frontend formatting/lint: passed. Initial floating-promise warnings were corrected with explicit handling in drag/keyboard callbacks.
- `npm run types:check`: passed.
- `npm run lint`: passed; all 451 files formatted and no warnings or lint errors in 369 files.
- `npm run build`: passed, exit code 0, 14.43 seconds. Large-chunk and ineffective dynamic import warnings remain.
- `git diff --check`: passed.
- No automated tests written or run, per user instructions. Motion awaits manual visual review.

## Manual checklist

1. Select several sibling folders/pages and drag them into the center of an unselected folder.
   - Expected: other siblings close gaps. On release, the stack shrinks and fades directly into the receiving folder. That folder grows briefly and returns to its normal size. Source cards never reappear in their old positions.
2. Open the receiving folder and reload.
   - Expected: all selected items and their contents are present in their original relative order.
3. Inside a folder, drop a selection onto the parent/root drop zone.
   - Expected: the stack fades at that zone and the source layout stays closed; no return-then-fade occurs.
4. Reorder selected siblings before/after an unselected item.
   - Expected: after the server accepts the reorder, cards settle directly into the new positions. Reload confirms the order.
5. Release over empty space or press Escape before releasing.
   - Expected: original slots reopen and cards animate back without a saved move.
6. If manually simulating a failed request in browser developer tools, block the move endpoint while dropping into a folder.
   - Expected: failure feedback appears and the source items recover rather than remaining hidden or being deleted. Refresh confirms the hierarchy is unchanged.
7. Repeat folder absorption in Grid, List, fixed Gallery, and natural Gallery, with single and multi-item selections.
   - Expected: one synchronized receiver pulse, no duplicate ghost, no blink at the receiver handoff, and source gaps remain closed on success.
8. Enable reduced motion and repeat a valid folder drop and an invalid release.
   - Expected: move/recovery behaves correctly without animated travel or the folder pulse.

## Limitations

The separate Orbing view is unchanged. Folder/container absorption applies to direct drag drops; dialog-based moves retain their existing departure/layout animation. Server failures intentionally restore the items even if the destination visual has already played.

Suggested commit: `feat(hierarchy): absorb dragged selections into destination folders`
