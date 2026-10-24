# Board drawing review report

## Phase and authorization

Board phase 4 — drawing extension, requested 2026-10-23 with “add drawing system
to the board”. This request authorizes this focused drawing extension during the
current review. It does not start another product phase.

## Implemented

- Added Draw beside Text in the title toolbar, with persistent Pen, Highlighter
  and whole-stroke Eraser modes, six ink choices and four brush widths. Ink follows
  the current theme; other colors remain fixed. Highlighter uses 30% opacity.
- Mouse, pen and touch input create vector strokes; a tap creates a dot. Live
  points use refs and once-per-frame SVG paint rather than React state updates
  or saves on every move. Each released stroke becomes one native Board object.
- Eraser follows actual segments, including resized/moved drawings. Touched
  strokes fade before release; release deletes the touched set as one history
  action. Other Board objects cannot be erased. Escape discards pending changes.
- Native selection, moving, resizing, arrangement, layer order, duplication,
  deletion, clipboard, undo/redo, autosave, conflicts and draft recovery apply to
  strokes. Strokes have no text-editor state.
- Preserved middle/Space panning and two-finger navigation. Window blur, lost
  pointer capture and pointer cancellation discard unfinished strokes/erasures.
  History actions cancel active previews before changing saved objects.
- Bounded sampling to 6,000 points and 3,900 world units of point span per axis.
  When exceeded, accepted points remain and a message asks for another stroke.
  Existing per-object/Board byte and geometry budgets remain enforced.
- Added strict client/server validation for numeric point pairs, view boxes,
  color, width and opacity. Rendering generates SVG paths from numeric data;
  raw SVG/HTML is not accepted.
- Split the Board entry/validation boundary from workspace orchestration, and
  extracted Space-pan shortcut handling, to keep modified source files under
  500 lines. Drawing data/geometry, input, controls and rendering have focused files.
- Updated current Board, phase, scope, data-model and handoff documentation.
  Existing uncommitted work was preserved.

## Explicitly not implemented

Pressure-sensitive brush widths, editable path nodes, geometric shape tools,
partial-stroke erasing, drawing groups, block-attached annotations and drawing
export are outside this freehand implementation. Whole-account portability and
Mind Maps remain outside the current phase authorization.

## Commits

No commit was created. Suggested alternatives for one logical feature commit:

- `feat(boards): add freehand drawing and stroke erasing`
- `feat(boards): persist pen and highlighter strokes with board history`

The working tree already contained substantial unrelated changes; review/stage
this feature deliberately before committing.

## Migrations / persistent format changes

`database/migrations/2026_10_23_000001_add_board_drawings.php` was inspected with
`migrate --pretend` and applied locally in **23.81 ms**. `migrate:status` confirms
batch 19 is applied. No rollback was run.

The spatial envelope/default is now **5**. Native content format stays **1** and
preserved legacy rows retain content format 2. Existing UUIDs, content and Board
revisions are retained. The row constraint adds `drawing`. Data stores local
point pairs, view-box width/height, ink color, stroke width and opacity; corner
resizing can also retain the existing presentation `text_scale` field.

Full saves and PATCH mutations require format 5. Local recovery explicitly
adapts supported formats 1–4; it rejects drawings claiming an older envelope.
Older clients reject format 5. Deploy backend, frontend and migration together,
and reload open browser clients. Downgrade refuses while drawings remain,
including in trashed Boards. New installations receive the same additive migration.

## Actual validation

- Frontend formatter: passed for changed/new Board TypeScript, TSX and drawing CSS.
- `npm run lint`: passed — all 707 files formatted; no warnings/errors in 597 files.
- `npm run types:check`: passed.
- `vendor/bin/pint --test`: passed across the repository.
- PHP syntax: passed for BoardDrawingData, BoardBlockData, BoardContent,
  BoardSaveRules, BoardContentController and the drawing migration.
- `npm run build`: passed. It reports large chunks, existing ineffective dynamic
  imports for the crop dialog/property header/editor loader, and plugin timing
  warnings. These warnings are not a drawing-runtime performance measurement.
- `git diff --check`: passed.
- Migration SQL inspection, application and final migration status: passed.
  Initial sandboxed database access failed; approved local database access succeeded.
- Automated tests: neither written nor run, per user instructions. No Playwright
  or other browser automation was used. Browser/manual behavior remains unverified.

## Manual validation checklist

Use a disposable Board; reload the app first so its client understands format 5.
Each checkbox describes a manual check, not a claim of observed behavior.

1. [ ] Open a Board with existing text, a linked page and media. Hover the pencil
   beside Text and click **Draw on board**. Expected: existing objects remain;
   a compact drawing toolbar opens and Draw shows its active state.
2. [ ] With **Pen**, draw a curve, a zigzag and a single tap. Expected: ink follows
   the pointer; release retains each stroke/dot; drawing mode remains active.
   The release position should match the live preview without a jump.
3. [ ] Pick **Blue ink**, select 6 px and draw; then pick **Highlighter**,
   **Amber ink** and draw across text. Expected: the blue stroke is thicker,
   highlighter is translucent, text remains visible and no block editor opens.
4. [ ] Undo once, then redo using both title buttons and Ctrl/Cmd+Z / Shift+Z.
   Expected: one completed stroke changes per action; color/width/opacity return
   exactly. History also works while drawing mode remains active.
5. [ ] Select **Erase whole strokes**; sweep across several strokes and release.
   Expected: touched strokes fade while held and disappear together on release;
   text/media/page cards remain. One Undo restores the erased set.
6. [ ] Draw a large curved stroke. Erase through empty space inside its rectangular
   selection frame, away from its actual line. Expected: the stroke stays. Cross
   its line: it fades and is removed on release.
7. [ ] Start a new stroke, press Escape while still holding, then release.
   Expected: the unfinished stroke disappears and is not saved. Repeat during an
   eraser sweep: faded strokes return. Escape again while idle returns to Select.
   Switching away from the browser while holding should also discard the gesture.
8. [ ] Click **Finish drawing**; select a stroke and drag it. Resize with a corner,
   then a side handle. Expected: movement preserves shape; corners scale in
   proportion; sides stretch the vector. Erase the moved/resized line afterward:
   expected hit testing follows its visible position. Double-click/Enter should
   not open a text editor for a stroke.
9. [ ] Select strokes with Shift+click or marquee; duplicate with Ctrl/Cmd+D,
   copy/paste within the workspace, change layers with More/right-click, and delete.
   Expected: ordinary Board actions affect only the chosen objects; pasted strokes
   retain ink and shape; Undo restores the previous state.
10. [ ] In drawing mode, Space+drag and middle-drag, then zoom using Ctrl/Cmd+wheel.
    Expected: these gestures navigate without adding strokes; new strokes land
    under the pointer after zoom. Fit all includes drawings.
11. [ ] On a touch device, draw with one finger, then add a second finger before
    release and pinch/pan. Expected: the unfinished stroke is discarded and
    navigation takes over; subsequent single-finger drawing works again. If a
    stylus is available, verify its stroke placement and fast curves as well.
12. [ ] Draw, wait until Board saving settles, reload, and navigate away/back.
    Expected: strokes retain position, shape, ink, thickness and stacking order.
    Confirm the same with a moved/resized stroke and an erased stroke.
13. [ ] Toggle fullscreen, pan drawings offscreen/back and switch Light/Dark.
    Expected: drawings persist through view changes; Ink follows the theme while
    explicit colors stay fixed. Repeat key drawing/eraser/resize checks with
    `boardRenderer=original` in the Board URL to check the reference renderer.
14. [ ] Edit a linked Document or start a media upload, then inspect Draw.
    Expected: tool switching respects the Board’s existing edit/busy locks;
    finishing/saving permits drawing again without altering the Document itself.
15. [ ] Open the same Board in two browser tabs, save a stroke in one and then
    change the other. Expected: the stale tab uses the existing conflict/recovery
    UI and retains its draft rather than overwriting the newer Board. Download
    its draft before choosing to load latest.
16. [ ] Optional boundary check: make a very long continuous stroke or exceed a
    3,900-unit span at low zoom. Expected: accepted ink remains, release shows the
    limit message, and a new stroke can continue without breaking saving.

## Known limitations and acceptance boundary

Eraser removes whole strokes. Drawings are independent Board objects and do not
follow underlying blocks when those blocks move. Brush settings are local to the
mounted Board session; each saved stroke retains its own appearance. Ink changes
with the theme. Strokes are bounded by existing object/Board data budgets.

No browser trace, visual inspection, latency, CPU or thermal measurement was
performed. Drawing feel, touch/stylus handling and interaction with representative
large Boards require the checks above. The prior Board thermal issue remains
unresolved by evidence; this change makes no claim to fix it.

## Verification fixes

Source review corrected the Add button’s active state during drawing, disabled
text editing for strokes, prevented double scaling of SVG surfaces, restored
pending erasures on cancellation, canceled previews before history changes and
kept the active touch position current before transition to pinch navigation.

## Stop gate

Stop here for manual review of the requested drawing extension. Do not start a
later product phase without explicit user approval.
