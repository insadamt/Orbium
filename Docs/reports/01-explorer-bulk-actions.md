# Explorer bulk actions completion report

## Scope

Focused hierarchy/explorer enhancement requested on 2026-10-14. No later phase started.

## Implemented

- Ctrl+click and Cmd+click toggle multiple direct-child items in workspace/folder Grid, List, and Gallery views. Space toggles keyboard selection.
- Floating selection toolbar offers Move, Delete, and Clear selection.
- Move dialog lists valid workspace containers with hierarchy paths. Selected folders and their descendants cannot be destinations; databases accept documents only.
- Dragging a selected item moves the visible selection together and preserves original sibling order, including reordering within the current folder.
- Bulk deletion confirms sending selected items and their contents to Trash using existing soft-delete behavior.
- A workspace-owned endpoint validates up to 100 distinct sibling IDs. Workspace locking and an enclosing transaction keep batches atomic. Existing hierarchy actions enforce containment and cycle rules.
- Escape, empty-space click, and Clear selection clear selection. Changing location resets selection; search restricts actions to visible selected items.
- Ctrl+Enter and the New tab menu action remain available for opening another app tab.
- Extracted the Gallery appearance dialog to keep the explorer component under 500 lines.

## Commits

No commit created. Suggested messages:

- `feat(hierarchy): add explorer multi-selection and bulk actions`
- Alternative: `feat(workspaces): move and trash selected explorer items together`

## Persistent changes

No migrations, editor format changes, or archive format changes.

## Validation

- Changed frontend files: `npx vp check --fix …` — passed formatting and lint.
- `./vendor/bin/pint --test` — passed.
- `npm run types:check` — passed.
- `npm run lint` — passed; all 448 checked files formatted, no warnings or lint errors in 366 files.
- `npm run build` — passed; build reported large chunks, ineffective dynamic imports, and plugin timing warnings.
- `git diff --check` — passed.
- Automated tests were neither written nor run, per user instruction. Interactive behavior awaits manual validation.

## Manual checklist

1. At a workspace root, create sibling folders A, B, C, and Destination. Put a document and a nested folder inside A. Ctrl+click A and B.
   - Expected: neither opens; both show selection, and the action strip reads “2 selected”. No new app tab is created.
2. Ctrl+click A again, then select it again. Press Escape; repeat selection and click blank space between items; repeat and use Clear selection.
   - Expected: Ctrl+click toggles one item, and each clearing method removes the action strip.
3. Select A and B, choose Move, then cancel.
   - Expected: nothing moves and selection remains. Choose Move again, select Destination, and confirm.
   - Expected: both folders leave the root. Inside Destination, A precedes B and A retains all its contents. Reload and verify persistence.
4. Inside Destination, select A and B and move them to Workspace root.
   - Expected: both return together; contents remain intact.
5. Select A and B at the root and drag A onto the center of Destination.
   - Expected: both item cards follow the pointer in a centered row with no stationary visible copies; both move into Destination in their original order.
6. Inside Destination, add C and D. Select A and B and drag one after D, then select C and D and drag one before A. Repeat with a nonadjacent selection.
   - Expected: the entire selection reorders together, keeping original relative order. Reload to verify.
7. Select A and B and inspect Move destinations.
   - Expected: A, B, and their descendants are excluded. A database cannot be a destination for folders. Drag a selection containing a folder onto a database or selected folder.
   - Expected: invalid drops have no move effect.
8. Select A and B, choose Delete, and cancel. Repeat and confirm.
   - Expected: cancellation changes nothing; confirmation removes both and clears selection. Open Trash and restore them using its normal actions.
   - Expected: both return with their contents intact.
9. Repeat selection and Move/Delete in Grid, List, and Gallery, at both workspace root and inside a folder.
   - Expected: the same behavior across views and locations. Gallery appearance still opens, cancels, and applies correctly.
10. Select multiple items, search so only one selected item remains visible, and use Move or Delete.
    - Expected: action count and mutation apply only to the visible selected item. Navigate elsewhere and back.
    - Expected: selection resets across locations.
11. Tab to an item, press Space, then focus another item and press Space. Clear selection and press Enter on an item; return and press Ctrl+Enter. Also try the New tab context-menu action.
    - Expected: Space selects without navigation; Enter opens normally; Ctrl+Enter and New tab open another app tab.
12. If checking the endpoint manually with authenticated browser developer tools, submit a batch with a foreign-workspace ID, non-sibling IDs, or an invalid destination (selected node/descendant).
    - Expected: request fails and none of the selected items move or enter Trash. Refresh to confirm unchanged hierarchy.

## Limitations

- Selection operates on visible direct children, up to 100 items per batch.
- Bulk actions are available in Grid, List, and Gallery; the separate Orbing view is unchanged.
- Cross-workspace moves remain unavailable.
- Shift-click range selection is not included.

## Stop gate

Ready for the user's manual review. No additional phase work started.
