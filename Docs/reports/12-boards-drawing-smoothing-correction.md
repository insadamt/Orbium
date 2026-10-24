# Board drawing smoothing correction

## Phase and review finding

Board phase 4 — repair during manual review, 2026-10-23. The user reports that
Off, Light and Strong feel alike. The initial smoothing pass did not meet the
requested perceptual difference; its static checks did not establish drawing feel.

Source review found that the previous filter could displace a sample by only
about 1.1 px in Light and 2.9 px in Strong. Curve preparation also retained
almost all dense samples, including their small wobble, and restored the pointer
tail in both modes. The settings were wired, but their geometric effect was too
subtle. No browser reproduction or latency measurement was performed.

## Implemented

- Added geometric path cleanup before forming smoothed curves. Light uses a
  1.5-screen-pixel scale; Strong uses 6 px. These values are converted through
  the start-of-stroke zoom so zoomed-out drawing does not lose more screen detail.
- Increased distance-adaptive stabilization strengths from 3/8 to 6/18 px.
  These strength values govern the filter response, not a fixed pointer lag.
- Nearby-point reduction and iterative segment simplification remove small
  deviations. Prominent shape changes remain as curve controls. Strong therefore
  intentionally softens more small details than Light; Off bypasses all cleanup.
- Bounded segment comparisons to 24 times the reduced point count per pass.
  On pathological paths, remaining detail is retained once that budget is spent.
  The algorithm is iterative and does not recurse through the input.
- Added a visible toolbar description: Direct input / Gentle wobble cleanup /
  Stronger cleanup, with a notice that Strong softens small details.
- Preserved the live/raw endpoint, preview/save geometry agreement, native
  numeric-point persistence and existing 6,000-point/byte/geometry budgets.
- Updated handoff, feature/phase docs and marked the earlier report as awaiting
  the correction's manual acceptance.

## Scope, compatibility and commits

No migration, PHP change, new persistent field or format bump. Board format
remains 5. Existing drawings keep their shape; only new strokes use the revised
settings. Clipboard, history, resize, whole-stroke eraser and draft recovery keep
using the saved numeric geometry. No shape recognition or extra product phase.

No commit was created. Suggested alternatives:

- `fix(boards): make drawing smoothing levels visibly distinct`
- `fix(boards): remove stroke wobble before curve smoothing`

The workspace contains earlier unrelated changes; they were preserved.

## Actual checks

- Changed/new TypeScript and TSX formatting: passed.
- `npm run types:check`: passed.
- `npm run lint`: passed — all 709 files formatted; no warnings/errors in 599 files.
- `npm run build`: passed. Existing large-chunk and ineffective dynamic-import
  warnings remain (crop dialog/property header/editor loader).
- `git diff --check`: passed.
- PHP syntax/formatting and migrations: not applicable to this frontend repair.
- No automated tests were written or run; no Playwright or other browser tooling
  was used, per user instructions. Browser feel remains unverified.

## Exact manual checklist

Reload the application. Use a disposable Board at **100% zoom**, **Pen**, and a
thin **1 px or 3 px** stroke so the ink width does not hide small differences.
Each numbered check requires drawing a new stroke; changing the setting does not
reprocess existing ink.

1. [ ] Choose **Off**. Expected: the toolbar says **Direct input**. Draw a long
   horizontal stroke with deliberate little up/down wiggles, roughly 3–5 screen
   pixels high. Expected: those wiggles remain visible in the released stroke.
2. [ ] Choose **Light**, then draw another similar wobbly line. Expected: the
   toolbar says **Gentle wobble cleanup**; tiny irregularities are reduced while
   more of the deliberate wave/detail remains than with Strong.
3. [ ] Choose **Strong**, then draw another similar wobbly line. Expected:
   **Stronger cleanup · small details soften** appears. Small wiggles should be
   removed more clearly, producing a cleaner, straighter path than Off/Light.
   This is the primary perceptual acceptance check.
4. [ ] Draw a large wave, broad loop and handwritten word with Light and Strong.
   Expected: the overall path remains recognizable; Strong can soften tiny
   details. Large intentional turns should not be reduced to a straight line.
5. [ ] Make a slow wobbly line and a fast sweep in each mode. Expected: the
   difference is evident in small irregularities; fast sweeping remains usable.
   Straight clean input may naturally produce similar-looking results.
6. [ ] Finish a curved stroke at a chosen canvas point and release. Expected:
   its endpoint stays at the pointer and saved ink matches the preview, without
   a release-time snap or separate late cleanup animation.
7. [ ] Repeat the wobbly-line comparison at 50% and 200% zoom, and with a stylus
   or touch if available. Expected: the mode difference remains comparable in
   screen space. Repeat with Highlighter; it retains width and translucency.
8. [ ] Draw with Strong, then undo/redo, copy/paste, move and resize. Erase across
   the visible curve and undo. Expected: all operations retain or restore its
   saved shape; erasing follows its actual visible segments.
9. [ ] Start ink and press Escape while held; repeat during an eraser sweep.
   Expected: unfinished ink disappears or pending erasures return. No preview
   remains after release. Space/middle-drag and two-finger navigation still work.
10. [ ] Wait for saving, reload and revisit older drawings. Expected: new ink
    retains its cleanup, old ink is unchanged, and the new session defaults to
    Light. Switching settings affects subsequent strokes only.
11. [ ] Optional long-stroke check: draw a dense, highly irregular stroke near the
    existing limit. Expected: work remains bounded; retaining extra detail on a
    pathological path is allowed. The accepted part still saves, and another
    stroke can continue.

## Known limitations and stop gate

Strong intentionally removes more small details and is unsuitable when those
wiggles are desired; use Light or Off for fine tracing. Cleanup is heuristic,
not shape recognition. A comparison-budget fallback preserves extra detail.
No measured latency, CPU/thermal or browser visual result is claimed. User
comparison of the three new strokes is the acceptance boundary.

Stop within Board phase 4 for manual review. No later phase is started.
