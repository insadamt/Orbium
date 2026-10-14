# Explorer bottom Move out drag action

Focused hierarchy explorer correction; no next phase started.

## Implemented

- Replaced the above-content “Move to…” zone with bottom-edge Delete and Move out targets displayed side by side during folder dragging.
- Move out sends the dragged item or visible selected group up exactly one hierarchy level, appending to the destination siblings. Top-level folders move children to workspace root; nested folders move children to their containing folder.
- Separate target hit detection, hover feedback, pending labels, and red Delete / neutral Move out ambient effects.
- Workspace root displays only Delete. Existing Trash recovery, stack destination motion, cancel/error recovery, and reduced motion remain supported.
- Renamed the drop-target component to reflect both actions and documented the approved behavior.

No migrations, persistent format changes, or commits created. Existing unrelated explorer-views CSS and gallery-spacing report changes were left intact.

## Validation

- Targeted formatting/lint: passed.
- `npm run types:check`: passed.
- `npm run lint`: passed; 455 files correctly formatted, no warnings or lint errors in 372 files.
- `npm run build`: passed in 13.29 seconds. Existing large-chunk and ineffective dynamic-import warnings remain.
- `git diff --check`: passed.
- No automated tests written or run, per user instructions. Interaction/visual behavior awaits manual testing.

## Manual checklist

1. Open a folder containing items and drag one item.
   - Expected: Delete and Move out appear side by side at the bottom; no Move to target appears above the contents.
2. Hover each target without releasing.
   - Expected: only the hovered action shows its release instruction and stronger glow; no hierarchy change occurs.
3. Inside a nested folder, drop an item on Move out, navigate to its containing folder, and refresh.
   - Expected: the item disappears from the source and persists at the end of the containing folder's children.
4. Inside a top-level folder, Ctrl/Cmd+click several children and drop the group on Move out. Open workspace root and refresh.
   - Expected: every dragged item moves to root together with sibling order preserved.
5. Drop an item/group on Delete, then restore it from Trash.
   - Expected: only the dragged items move to recoverable Trash and can be restored.
6. Start dragging at workspace root.
   - Expected: only Delete appears.
7. Hover Move out and press Escape; repeat by releasing on empty space.
   - Expected: items return, targets disappear, and nothing moves or deletes.
8. Repeat in Grid, List, fixed/natural Gallery, Light/Dark, after scrolling, and with reduced motion enabled.
   - Expected: consistent viewport-edge targets; reduced motion skips animated travel and glow motion.
9. Block the move request in browser developer tools and drop on Move out.
   - Expected: failure feedback appears, source items return, and refresh confirms the hierarchy is unchanged.

Suggested commit: `feat(hierarchy): place move-out beside bottom delete drop target`
