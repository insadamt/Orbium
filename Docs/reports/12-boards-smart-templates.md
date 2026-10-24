> Historical report: the user rejected recognition quality and requested removal.
> Superseded by `12-boards-drawing-toolbar.md`; recognition source and UI are removed.

# Local smart drawing templates

## Phase and authorization

Board phase 4 — drawing refinement, 2026-10-23. After clarifying that Strong
should recognize numbers, letters, signs and shapes, the user chose “free and
define templates”. This authorizes local template recognition and established
free drawing/recognition libraries within the current Board review.

## Implemented

- Strong **Pen** now recognizes an isolated shape or character after a one-second
  pause. Off draws direct ink; Light smooths. Highlighter stays ink in all modes.
- Integrated `perfect-freehand` **1.2.3** (MIT), pinned in package/lock, using its
  `getStrokePoints` API instead of the homemade per-sample streamlining filter.
  The existing bounded geometry adapter still prepares persistent numeric paths.
- Vendored a TypeScript adaptation of the original BSD **$P Point-Cloud Recognizer**,
  preserving its normalization/greedy matching algorithm and license. Added ranked
  results and guards for degenerate input; removed the original demo templates/API.
- Defined **63 classes / 72 variants**, split into focused source catalogs:

| Category | Supported templates |
| --- | --- |
| Shapes | Circle, ellipse, square, rectangle, triangle, diamond, star, horizontal line, vertical line |
| Signs | +, −, ×, ÷, =, ≠, <, >, ≤, ≥, ✓, √, →, ←, ↑, ↓, !, ? |
| Numbers | 0–9; additional variants for 1, 4, 5, 7 |
| Letters | Uppercase Latin A–Z; additional I and O variants |

- Added Auto/category filters, **Templates** gallery with stroke examples,
  **Recognize now**, candidate choices and **Keep ink**. Ambiguous examples such as
  0/O/circle, 1/I/line and ×/X can be resolved by choosing a candidate/category.
- Groups at most eight nearby strokes / 6,000 points per recognition. The grouping
  margin supports disconnected crossbars/stems, including H, + and 4. Add those
  strokes before the one-second pause; pause between isolated characters.
- Recognition uses unsmoothed sampled input; completed source ink is saved first.
  A clear match converts automatically; weak/ambiguous matches retain ink and offer
  up to four choices. The score is an uncalibrated matching heuristic, not a
  probability or measured accuracy guarantee.
- Text-like results become native editable Text objects with the ink color and
  approximate drawn size/location. Shape results become clean drawing vectors;
  circles/squares use equal proportions. All use existing Board save formats.
- Conversion has a separate history entry: one Undo restores the source strokes,
  Redo reapplies conversion. Existing session-history limits still apply.
- Pending recognition is canceled by tool/assist/brush/category changes, opening
  Templates, gesture cancellation, window blur and edits/history changes to source
  objects. Unmount clears the timer; hidden/locked surfaces are checked before
  conversion. Already committed ink remains when recognition is canceled.
- Preserved snapshots, autosave, conflict handling, clipboard, bounds and recovery.
  Matching runs locally after a pause/button, outside pointer-move painting.

## Scope and persistent format

No PHP change, migration, backend endpoint, cloud API, account or recognition
service. Board envelope stays **5**, native content stays **1**. Conversion stores
ordinary native text/drawing objects; no unsupported recognition fields enter JSON.
Existing drawings retain their saved geometry. Undo/raw source retention uses the
existing bounded local session history and does not survive a full reload.

This is a fixed vocabulary for isolated characters and shapes, not general word
transcription, lowercase/Arabic recognition, per-user template training or shape
node editing. Converted text uses ordinary editing/selection/Delete; the drawing
eraser only erases drawing strokes. Large glyph size is bounded by the existing
text-scale limit. Recognition accuracy requires manual review.

## Dependencies and attribution

- perfect-freehand: https://github.com/steveruizok/perfect-freehand — MIT.
- $P: https://depts.washington.edu/acelab/proj/dollar/pdollar.html — New BSD.
- Downloaded original source: https://depts.washington.edu/acelab/proj/dollar/pdollar.js
- Original download SHA-256:
  `a36ee4b844171de940cb46dde3f3998a8424c68b570a42ed490992aea2ae1654`.
- Original copyright/conditions/disclaimer retained in the vendored source and
  adjacent LICENSE; both dependencies are documented in `THIRD_PARTY_NOTICES.md`
  and distributed at `public/third-party/board-drawing-licenses.txt`.
- `npm install perfect-freehand@1.2.3 --save-exact --ignore-scripts --no-audit --no-fund`
  added one package. No package lifecycle scripts or automated tests were run.

## Commits

No commit created; earlier unrelated uncommitted changes were preserved.
Suggested alternatives:

- `feat(boards): recognize local drawing templates with undoable conversion`
- `feat(boards): add smart pen recognition with free drawing libraries`

## Actual validation

- Changed/new frontend and dependency files formatted with `vp fmt`: passed.
- Explicit formatting check of drawing/recognition files and notices: passed.
- `npm run lint`: passed — all 720 files formatted; no warnings/errors in 609 files.
- `npm run types:check`: passed.
- `npm run build`: passed — final build completed in 53.56 s. Existing large-chunk,
  ineffective dynamic-import (crop dialog/property header/editor loader) and plugin
  timing warnings remain.
- `git diff --check`: passed.
- All new/modified drawing source files remain below 500 lines; the largest new
  catalog is the 378-line uppercase letter catalog.
- PHP syntax/formatting/migration execution: not applicable to this frontend task.
- No automated tests were written or run. No Playwright, browser automation,
  screenshots or runtime recognition accuracy/latency measurements were performed.

## Exact manual validation checklist

Reload the application and use a disposable Board. Start at **100% zoom**, choose
**Draw → Pen → Strong**, and use a 1 px or 3 px pen. Draw reasonably large isolated
marks (at least 12 screen pixels). These are acceptance steps, not browser-observed
claims. For uncertain results, a candidate choice is expected rather than a forced
conversion; compare the stroke examples in Templates.

1. [ ] Confirm Strong reveals **Recognize**, **Templates**, **Recognize now** and
   a status hint. Expected: Auto is available alongside Shapes, Signs, Numbers and
   Letters A–Z; Recognize now starts disabled until ink is pending.
2. [ ] Open Templates. Expected: the four categories display their defined stroke
   examples and isolated-character instructions in a scrollable panel. Existing
   ink stays; opening the panel stops pending conversion. Close it and draw again.
3. [ ] Choose **Shapes**, draw a closed rough circle and pause one second.
   Expected: a clear match becomes a clean Circle; if choices appear, choose
   Circle and confirm clean vector geometry replaces the rough ink. Repeat with
   a rectangle, triangle and star using the gallery examples.
4. [ ] Choose **Numbers**, draw **5** and pause. Expected: 5 converts or is offered
   as a candidate; selecting it produces native Text with value 5. Finish drawing,
   double-click the text and edit it to 6: ordinary Board text editing should work.
   Repeat with 0, 1, 4 and 7, including their shown variants.
5. [ ] Choose **Letters A–Z**, draw **A** with two legs and a crossbar, adding each
   stroke within one second. Expected: the strokes form one recognition group;
   A converts or is offered as a choice. Repeat with disconnected H/I strokes.
6. [ ] Choose **Signs**, draw **+** with horizontal then vertical strokes within
   one second. Expected: the second stroke joins the group despite starting
   outside the horizontal stroke's thin frame; a recognized + becomes Text.
   Repeat with ✓, = and a right arrow following the gallery.
7. [ ] Choose **Auto** and draw a circular O-like mark. Expected: lookalikes such
   as Circle and O can be offered without forced conversion. Choose the intended
   result. Repeat with a vertical line; category selection should narrow the
   1/I/line ambiguity. Candidate scores are not displayed as probabilities.
8. [ ] When choices appear, choose **Keep ink**. Expected: the original source
   strokes remain and no delayed conversion appears. Draw an unsupported scribble:
   a weak/unclear match should remain ink. Report incorrect automatic conversions
   with the drawn example; the heuristic thresholds may require tuning.
9. [ ] Draw a recognized multi-stroke character, wait for conversion, then Undo
   once. Expected: all source strokes return together. Redo reapplies conversion
   without duplicating objects. Compare color and position before/after.
10. [ ] Draw a mark and immediately switch to Light, change brush/category, press
    Escape or choose another tool before the pause ends. Expected: the committed
    ink stays and does not convert later. Undo pending ink before the timer fires:
    expected removed ink is not resurrected by recognition.
11. [ ] Start another stroke in a pending character and hold it longer than a
    second before releasing. Expected: recognition waits for release and the next
    pause; it does not convert earlier strokes mid-gesture. Recognize now should
    be disabled while this stroke is incomplete.
12. [ ] In Highlighter, choose Strong and draw an A/circle. Expected: highlighted
    ink stays ink; recognition controls are hidden and the hint explains that.
    In Pen Light/Off, draw the same marks: they should also stay ink.
13. [ ] Move/resize/copy/paste a recognized shape. Erase its visible stroke and
    Undo: expected the exact shape returns. For recognized text, use normal text
    selection, editing and Delete rather than the stroke-only eraser.
14. [ ] Wait for saving and reload. Expected: converted text/vector geometry is
    retained; older freehand strokes stay intact. Recognition/brush preferences
    are session-local. Undo history resets on full reload as it already did.
15. [ ] Repeat representative Shapes/Numbers/Letters checks at 50% and 200% zoom,
    then with touch/stylus if available. Expected: recognition preserves position
    and approximate size; source strokes stay available for immediate Undo.
16. [ ] During a pending pause, switch away from the window or hide the browser
    tab, or start a linked Document edit/upload. Expected: hidden/busy checks
    prevent delayed conversion; saved ink is retained. After finishing, a fresh
    smart stroke should recognize again.
17. [ ] Optional local-only check: after loading the app/assets, disconnect the
    network on this disposable Board and draw a template. Expected: recognition
    still works locally; ordinary server autosave reports its existing connection
    problem and keeps recovery data. Reconnect before testing persistence.
18. [ ] Open a narrow viewport/fullscreen and navigate controls/candidates with
    Tab and Enter/Space. Expected: controls wrap, gallery scrolls and focus/pressed
    states remain visible; native Select/Hand/zoom/history still work.

## Issues found during verification

The initial build passed but spent 5m33s in transformation. The recognition hook’s
mutable timer/store orchestration now explicitly opts out of compiler memoization;
its state only changes at stroke boundaries. The final build passed substantially
faster. These are observed build runs, not a runtime recognition benchmark.

The build strips dependency source comments, so a public notices file now carries
both complete dependency licenses alongside the source-level notices.

## Known limitations / stop gate

Templates represent a limited vocabulary and several writing variants, not a
trained general handwriting engine. Ambiguity and missed matches are expected;
category filters, candidate choice, Keep ink and Undo are the correction paths.
Pause between isolated characters. Very small marks, groups over eight strokes
or 6,000 points, and existing Board data/geometry limits retain ordinary ink.

No measured recognition accuracy, perceived pen quality, CPU/thermal or latency
result is claimed. The earlier thermal issue remains unresolved by evidence.
Stop here for manual acceptance within Board phase 4; no later phase is started.
