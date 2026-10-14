# Explorer selection bar removal

Focused change within the current explorer review; no new phase started.

## Implemented

- Removed the bottom Move/Delete/Clear selection bar from workspace and folder explorers.
- Selection outlines, grouped drag moves, and the drag-only Trash target remain available.
- Escape and empty-space click still clear selection. Individual overflow Delete actions still ask for confirmation.
- Updated UI and navigation documentation to supersede the selection bar guidance.

No migrations, persistent format changes, or commit created. The existing bulk-actions component is left unmounted to preserve unrelated work already in progress.

## Validation

- `npm run types:check`: passed (exit 0).
- `npm run lint`: passed; all 454 files formatted, no warnings or lint errors in 371 files.
- `npm run build`: passed (exit 0), 10.37 seconds. Large-chunk and ineffective dynamic-import warnings remain.
- `git diff --check`: passed.
- No automated tests written or run, per user instruction. Visual behavior awaits manual review.

## Manual checklist

1. Open a workspace, Ctrl+click (Cmd+click on macOS) one page, then several pages.
   - Expected: selected cards show outlines; no bottom selection action bar appears.
2. Repeat inside a folder and in Grid, List, and Gallery views.
   - Expected: selecting pages never displays the removed bar.
3. Press Escape; select again and click empty explorer space.
   - Expected: both actions clear selection outlines.
4. Select multiple disposable pages and drag them into a valid folder.
   - Expected: the group moves together; no selection bar appears before or after dragging.
5. Drag disposable pages toward the bottom edge, cancel, then repeat and drop on Trash.
   - Expected: the Trash target appears only during dragging. Cancel preserves the pages; dropping sends them to restorable Trash.
6. Open a page's overflow menu and choose Delete, then cancel.
   - Expected: the existing confirmation dialog appears and cancellation preserves the page.

## Limitations

The removed bar's Move/Delete dialogs and Clear selection button are no longer accessible there. Use drag destinations, the drag-to-Trash target, individual item menus, Escape, or empty-space click.

Suggested commit: `fix(hierarchy): remove bottom explorer selection bar`
