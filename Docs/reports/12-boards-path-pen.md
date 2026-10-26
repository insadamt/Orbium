# Board phase 4 review — Point-by-point Path Pen

Date: 2026-10-24. User requested the pen/path tool shown in the supplied image.
Implemented the straight connected-corner construction visible in that reference,
inside the current Board phase-4 drawing review. No later phase started.

## Result

Draw → Path Pen builds a path by clicking/tapping its corner points. It uses a
small original SVG pen/path illustration in the existing minimal drawing palette,
shared ink/width controls and ordinary app buttons. Smoothing is hidden in this
mode so corners remain exact.

Square markers show placed corners and fill the latest anchor. A frame-scheduled
hover preview shows the next segment; Shift constrains its angle to 45° increments.
Markers use inverse-zoom dimensions to remain readable as the camera changes.
Ink/width changes update the complete unfinished path preview.

Enter, double-click or Finish commits an open path. Clicking within 8 screen pixels
of the first anchor after at least three anchors closes/commits the outline.
Consecutive clicks under 3 screen pixels do not add a duplicate double-click
endpoint. Backspace, draft Ctrl/Cmd+Z and Remove last point remove one anchor.
Escape or Cancel clears the unfinished path; another idle Escape exits drawing.
One-point drafts are discarded on finish. Finish/Remove/Cancel provide explicit
pointer/touch access. Completed paths leave Path Pen active for another path.

Hiding/reopening the Draw palette retains the path draft. Clicking the already
active Path Pen item does not reset it. Switching tools, blur, pointer cancellation,
two-finger pinch startup, normal Board history actions or leaving the mounted
Board discard unfinished construction. Space/middle-button panning preserves it.
The pointer cancellation result now includes a multi-click draft even between
presses, so Escape cancels that draft before leaving the drawing tool.

Completed paths reuse the native drawing pipeline as one object. Selection,
movement, resizing, duplication, clipboard, partial erasing, Undo/Redo and autosave
retain their existing behavior. Erasing cuts gaps inside the same drawing block.
Hover/anchor construction stays in refs/DOM, outside canonical records, until one
completed-path commit. A rejected commit preserves its editable draft.

## Implementation

- `use-board-path-drawing.ts`: bounded multi-click draft, frame preview, markers,
  snapping, finish/close, draft keyboard actions and native hover lifetime.
- `board-path-controls.tsx`: pointer/touch Finish, Remove point and Cancel actions.
- `board-drawing-preview.tsx`: extracted SVG preview surfaces for freehand/path.
- Existing drawing lifecycle/pointer input, palette/type guards, illustration,
  controls/CSS and help integrate the tool. Workspace orchestration stays below
  500 lines after extracting the preview component; all changed/new sources are
  below 500 lines.

No new persisted type, field, API, schema, backend, migration or dependency.
Board spatial format remains **6**. The transient `path` tool creates ordinary
`drawing` data containing existing numeric points and style. Existing saved ink
is unchanged. Existing 6,000-point, 3,900-unit input-span, coordinate, object-byte
and aggregate Board budgets apply.

Unrelated pre-existing working changes were preserved. No commit was created.

## Actual checks

- Focused formatter: passed.
- `npm run types:check`: passed (exit 0).
- `npm run lint`: passed (exit 0); 720 correctly formatted files and no warnings/
  lint errors in 607 analyzed files.
- `npm run build`: passed (exit 0), 17.99 seconds. Existing large-chunk,
  ineffective-dynamic-import and plugin-timing warnings remain.
- `git diff --check`: passed.
- No automated tests written/run; no Playwright or browser automation used.
- No PHP/backend or migration changes in this task; those checks do not apply.
- Browser appearance, pointer/touch feel and runtime performance remain unverified.

## Limits

This implements the reference's straight-segment creation. Bézier drag handles,
filled polygons and post-save vertex editing are not included. Anchor markers are
construction controls only; completed paths use ordinary drawing selection.
Unfinished paths are transient and not autosaved/recovered: finish them before
switching tools, leaving the Board or triggering cancellation. Existing partial-
eraser cap-clearance behavior on nonuniformly stretched drawings still applies.

## Manual test checklist

Reload the frontend and use a disposable Board at 100% zoom.

1. **Open path:** Draw → Path Pen. Click four different corners. Expect square
   markers, the latest filled, connected straight segments and a live next-segment
   preview. Press Enter. Expect the markers/hover segment gone and one saved
   drawing containing the four anchors' connected segments.
2. **Finish methods:** repeat with Finish, then with double-click at the final
   endpoint. Expect one drawing per finished path and no duplicate final segment
   or stray extra block. A one-point draft should not become a saved path.
3. **Closed path:** place three or more corners and click the first marker.
   Expect an unfilled closed outline saved as one drawing. No extra joining line
   should appear when subsequently moving it.
4. **Constrained angles:** add one corner, hold Shift and place another while
   moving diagonally. Expect a segment constrained to a multiple of 45°. Release
   Shift and place another: expect free placement. Smoothing must be hidden for
   Path Pen, with ordinary Pen/Highlighter smoothing still available.
5. **Edit the draft:** add several corners, press Backspace once and Ctrl/Cmd+Z
   once. Expect one anchor removed per action without undoing earlier saved Board
   content. Use Remove last point to repeat without a keyboard. Escape should
   discard the remaining draft while keeping Path Pen active; idle Escape exits.
6. **Brush/settings:** change ink and width with a draft active. Expect the whole
   unfinished path preview to update. Hide/reopen the drawing palette with the
   dock's Draw button: expect the same draft and Path Pen retained. Click the
   already-active Path Pen choice: expect no reset. Finish and draw another path.
7. **One block/history:** finish a multi-segment path, choose Select and click any
   segment. Expect one selection frame. Move/resize it: expect all segments to
   follow together. Undo/Redo should remove/restore the completed path in one step.
8. **Partial erasing:** cut through several segments using different eraser sizes.
   Expect only touched ink removed and all survivors still in one block. Undo
   once restores one eraser drag; previous path data/gaps remain correct.
9. **Clipboard/save:** copy/paste or duplicate a finished path, move the copy and
   wait for Saved. Reload. Expect original/copy geometry and any erased gaps
   retained. Each copy should remain one drawing block.
10. **Pan/cancel:** during construction, Space+drag or middle-drag to pan, then
    continue adding corners. Expect the draft retained and correct new world
    positions. Switch tools, cancel a pointer or blur the window: expect the
    unfinished draft discarded with no saved path/history action. Starting a
    two-finger pinch cancels the unfinished path before camera navigation.
11. **Responsive/accessibility:** try light/dark modes, fullscreen, different zoom
    levels and a narrow coarse-pointer surface. Expect readable square anchors,
    opaque palette surfaces and reachable Finish/Remove/Cancel controls with
    42px coarse targets. Keyboard focus must remain visible. No continuous
    animation is added; check reduced-motion appearance as well.
12. **Other tools/limits:** verify ordinary freehand Pen, Highlighter and Eraser
    still work. Try an anchor more than 3,900 world units beyond the existing
    draft span: expect a limit message and the current draft retained, allowing
    point removal or finish rather than creating invalid geometry.

## Commit suggestions

- `feat(boards): add point-by-point Path Pen drawing`
- `feat(boards): create open and closed paths from corner points`
