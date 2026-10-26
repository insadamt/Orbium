# Board phase 4 review — Partial erasing and eraser sizes

Date: 2026-10-24. User requested fixing whole-drawing deletion and adding eraser
sizes during Board phase-4 manual review. This supersedes the whole-stroke eraser
in previous drawing reports. No later phase started.

## Result

- Eraser cuts touched sections from strokes, retaining the remaining ink. Dragging
  previews the actual gaps rather than dimming the whole source stroke.
- Added Fine / Regular / Broad / Large sizes: 8 / 16 / 32 / 64 screen pixels in
  diameter, default 16. The mouse cursor shows a matching dual-outline circle.
  The selected screen size is converted through camera zoom at gesture start.
- Size is separate from pen/highlighter width and persists for the mounted Board
  session, including palette hiding and tool switching. Tooltips/pressed states
  identify the selected size. Existing coarse-pointer targets remain in effect.
- Capsule clipping covers the complete swept segment between pointer samples,
  including sparse straight strokes, taps, curves and fast pointer movement.
- Survivors retain the source geometry scale, color, stroke width and opacity.
  Their frames shrink within the existing minimum dimensions. Relative layer order
  is preserved; the first survivor keeps the source UUID and later survivors get
  new UUIDs. Each survivor is an ordinary independently selectable drawing object.
- Preview uses transient fragments and SVG path updates outside React records;
  changed paths paint once per frame. Release commits all replacements/deletions
  in one validated transaction, giving one Undo/Redo step for the entire drag.
- Escape, pointer cancellation/lost capture, blur and existing interaction
  cancellation restore original paths without saving an unfinished erasure.
  Whole-stroke deletion remains possible by covering the entire stroke.
- Removed obsolete whole-stroke hit testing, fade styling and labels. Updated
  help, scope, active-phase docs and handoff.

## Files and compatibility

New focused modules:

- `board-eraser-geometry.ts`: swept clipping and surviving drawing construction.
- `board-eraser-session.ts`: transient gesture preview, restoration and cursor.
- `board-eraser-controls.tsx`: four accessible size presets.

Drawing lifecycle, palette, CSS and help integrate these modules. New/changed
source files remain under 500 lines. No backend, migration, dependency, API or
persisted-field changes. Spatial format remains **5**. Existing drawings remain
unchanged until explicitly erased; saved fragments render in existing format-5
clients. Autosave, mutation validation, recovery and clipboard retain their normal
contracts. Other Board object types cannot be erased by this tool.

Unrelated pre-existing work was preserved. No commit was made.

## Actual checks

- Focused formatting: passed.
- `npm run types:check`: passed (exit 0).
- `npm run lint`: passed (exit 0), 717 files formatted, no warnings/errors in
  604 analyzed files.
- `npm run build`: passed (exit 0), 16.45 seconds. Existing large-chunk,
  ineffective-dynamic-import and plugin-timing warnings remain.
- `git diff --check`: passed.
- Source search: no obsolete whole-stroke eraser references remain in current
  Board frontend code.
- No automated tests written/run. No Playwright or browser automation used.
  Browser behavior and performance remain manually unverified.
- No PHP changes/migrations; PHP checks do not apply to this frontend change.

An initial redundant narrowed-type comparison was caught by TypeScript, removed,
and the final type check above passed.

## Limits

This cuts vector paths into pieces, rather than persisting a pixel mask or shaving
one side of a thick stroke. Round-cap clearance uses the larger scale when a
stroke is stretched nonuniformly, so those strokes can be cut conservatively.
Survivors are separately selectable objects. Repeated cuts can increase object
count/data size; the existing Board budgets still apply. A rejected final commit
restores original ink and displays the existing data-limit message.

A gesture exceeding 120,000 surviving preview points across touched strokes or
6,000 fragments from one source is canceled as a whole with a smaller-area message.
This is an allocation bound, not a measured browser performance guarantee. Mouse
cursor appearance/size and browser/touch feel require manual review. Touch uses
normal platform pointer behavior rather than a persistent hover cursor.

## Exact manual checklist

Use a disposable Board, reload the frontend and begin at 100% zoom.

1. **Middle cut:** Draw → Pen, Blue, Regular (3px), Smoothing Off. Draw one long
   straight stroke. Choose Eraser, Regular (16px) and cross only its middle.
   Expect a live gap under the eraser; both ends remain after release. The entire
   stroke must not disappear.
2. **Size controls:** undo that cut. Choose Fine (8px), repeat, then undo and repeat
   with Broad (32px) and Large (64px). Expect the visible mouse circle and erased
   area to grow with the selected size. Selected preset and numeric Size match.
3. **Multiple cuts in one drag:** draw a long loop/zigzag and erase through several
   sections without releasing. Expect only touched sections removed. Undo once:
   expect the complete original stroke restored. Redo once: expect all cuts back.
4. **Sparse and fast input:** with Smoothing Off, draw a fast straight line and
   quickly sweep the eraser diagonally through it. Expect a continuous gap along
   the sweep even between sparse stroke/pointer samples. Tap on a line and on a
   dot: expect local removal, with a fully covered dot disappearing.
5. **Highlighter and color:** draw colored pen/highlighter strokes crossing text.
   Erase one part of each. Expect surviving color/thickness/transparency retained,
   and the text unchanged. Pen width should remain unchanged after selecting an
   eraser size and returning to Pen.
6. **Transforms:** Select a stroke, move it, resize with corners and stretch a side.
   Erase through its new visible position. Expect cuts at the transformed location;
   remaining ink should not shift or change thickness. Check the conservative
   cap-clearance behavior on highly stretched strokes.
7. **Zoom:** compare Fine/Regular at 50%, 100% and 200%. Expect the cursor diameter
   and local erased footprint to remain screen-sized; the world-space gap scales
   with zoom. Check both normal and fullscreen canvas layouts.
8. **Cancel:** begin erasing, observe the live gap and press Escape before release.
   Expect the original ink restored with no new history step. Repeat using window
   blur and pointer cancellation where available. Start a new erase afterward:
   expect the tool to remain usable.
9. **Palette toggle:** choose Eraser and Large, click the active Draw dock button
   to hide settings, then erase. Expect partial erasing at Large size. Reopen:
   expect Eraser/Large retained. Select or idle Escape should exit drawing mode.
10. **Object actions:** after a cut, Select one surviving piece and move, resize,
    copy/paste and erase it again. Expect other pieces unchanged. Undo those
    actions; the original erase should still undo as one drag.
11. **Save/reload:** erase portions of several strokes, wait for Saved and reload.
    Expect the gaps, surviving color/thickness/position and relative layers retained.
    Eraser size returns to its session default after a full Board remount.
12. **No-op and full erase:** erase empty canvas/text only; expect no ink change or
    new history action. Cover a complete stroke; expect that stroke removed.
    Undo should restore it. Check all size controls by keyboard and on a narrow
    coarse-pointer layout; expect visible focus and reachable 42px targets.

## Commit message suggestions

- `fix(boards): erase stroke sections instead of entire drawings`
- `feat(boards): add partial erasing with adjustable eraser sizes`


## Superseded grouping behavior — 2026-10-24

The user clarified that partial erasing must retain one block. Separate survivors
and the format-5 implementation described above are superseded by internal gaps
in the original drawing with envelope 6. See
`12-boards-single-drawing-eraser.md` for the current implementation, migration,
actual checks and manual acceptance. Already-split saved blocks are not inferred
or merged automatically.
