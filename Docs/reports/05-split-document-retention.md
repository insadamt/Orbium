# Phase 5 review — preserve loaded documents when splitting

Date: 2026-10-09.

## Layout correction after manual rejection

The user reported blank space with both documents clipped beneath the navbar. Inspection of the existing split found the 48 px navbar spacer compressed to 3 px, a content-sized grid row of 898 px, and 14 px of remaining outer-page scroll. The first implementation passed static checks but failed the user's manual review.

The navbar spacer now cannot shrink. The split grid uses a bounded `minmax(0, 1fr)` row and clips overflow at its own boundary, leaving scrolling inside the panes. Split document islands no longer reserve a second navbar gap. Entering a split resets outer-page scroll, and leaving a native split restores the saved tab offset rather than reading a scroll container after its styles have changed.

Targeted formatting, TypeScript, lint, build, and `git diff --check` passed after this correction. The build completed in 9.43 seconds with the existing chunk/import warnings. No automated tests were written or run. Browser inspection stopped at the user's request; the corrected layout has not been visually verified.

Focused manual recheck: reload the assets, load two documents, and split left/right. Both panes should fill the space below the navbar, show document content, and scroll independently without moving the navbar. End the split and check that the selected document expands and retains its position.

Suggested correction commit: `fix(navigation): constrain split panes below the navbar`

## Problem and change

Splitting removed both retained document surfaces and created two iframe applications. Even documents already loaded in other app tabs loaded again, losing their mounted editor and undo state.

Loaded document surfaces now remain keyed siblings in the retained workspace. Entering a split changes their grid placement and scroll container rather than moving them into a different React parent. The dragged document occupies the requested side; its companion occupies the opposite side. The iframe workspace renders only panes without a matching retained document snapshot.

Pointer or keyboard focus selects the native document pane before interacting with its editor. Editor shortcuts and search follow that selected tab. Native pane scroll positions are retained, including when switching away from a split group. Ending a native document split or closing its companion keeps the retained editor instead of clearing its cache and refetching it. Splitting and ending a split do not block on native document autosave because these actions retain the editor and its save controller. Actual tab closing continues to use the existing save guard.

## Library choice and limitations

This is a repair to the existing React/Inertia/Zustand retention flow. No dependency was added or upgraded. A layout or drag library would not preserve state when the existing implementation removes an editor and boots an iframe; preserving the mounted component is the necessary fix. Existing dnd-kit still handles dragging, and CSS grid handles placement.

The no-reload path applies to document tabs loaded in this page session, including database child documents. Database view tabs and restored document tabs that have not loaded this session still use iframe loading. Database views depend on their own Inertia mutation/reload context; retaining those views requires a separate change to that context. This fix does not claim instant first loads or measured latency. Retaining open editors continues to consume memory until tabs close.

## Validation

- Targeted formatting: PASS.
- `npm run types:check`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS; existing large-chunk and ineffective dynamic-import warnings remain.
- `git diff --check`: PASS.
- No automated tests were written or run, per user instructions.
- Browser/manual validation remains pending. No backend code, migrations, persisted document formats, or dependencies changed. No commit was created.

## Manual checklist

Hard-reload once to load the new assets. Use two disposable documents A and B, visit both, and wait until their editors are ready.

1. Select A. Open DevTools Network, clear its entries, and drag B's app tab to the right split edge. Expected: A stays on the left, B appears on the right, neither document shows the split loading overlay, and there are no new document-page GET requests or iframe document loads. Normal autosave requests may occur.
2. End the split and drag B to the left edge. Expected: B appears on the left and A on the right, again without document-page requests. Repeat by dragging the active tab to an edge; that tab occupies the chosen side.
3. Before splitting, add distinct text to both documents and use Undo once in each. Split them, click each editor, and exercise Undo/Redo. Expected: each editor retains its own history and text; editing one pane does not affect the other. Try splitting while autosave is pending. Expected: native document splitting proceeds and saving continues.
4. Click each pane and use Ctrl+F and Ctrl+S. Also select each half of the split tab with the keyboard. Expected: the selected pane receives interaction; search and save target that document rather than both documents. The split tab highlights the selected half.
5. Scroll A and B to different locations, switch to an ordinary app tab, and return to the split. Expected: both pane scroll positions remain. End the split with each document selected in turn. Expected: the selected document expands without an editor reload and keeps its position and undo history.
6. Close an inactive document tab belonging to the active split, then repeat with the selected document. Expected: the surviving loaded document retains its editor. If a document is still saving, actual closing remains guarded; retry after Saved. Verify saved content after a full reload.
7. Create two split groups and switch between them. Resize below 700 px. Expected: each group keeps its document state; narrow screens stack left above right without duplicate or missing panes.
8. Reload with a split persisted, and separately split a document with a database view. Expected: panes with no retained document snapshot and database views can show their existing iframe loading state; loaded native document companions stay mounted. End these splits after saving and verify the standalone content.

Suggested commit: `fix(navigation): preserve loaded document editors when splitting tabs`

Remain in Phase 5 for manual review.
