# Board drawing smoothing review

User review (2026-10-23): the modes were reported to feel alike. This first pass
did not meet the requested perceptual difference. The follow-up implementation,
latest checks and manual acceptance are in `12-boards-drawing-smoothing-correction.md`.

## Phase and authorization

Board phase 4 — drawing refinement, approved 2026-10-23 with “okey go ahead”
after the proposed smooth curves, light stabilization and smoothing control.

## Implemented

- Added **Smoothing: Off / Light / Strong** to Pen and Highlighter controls,
  with Light as the default. Accessible pressed states and keyboard focus show
  the selected option; compact controls wrap on narrow surfaces.
- Off bypasses stabilization and curve preparation. Light/Strong use a
  distance-adaptive filter: small movements receive correction while larger
  moves catch up faster. Distances use screen pixels at the start-of-stroke zoom.
- Prepared midpoint quadratic curves with pronounced turns retained. Numeric
  curve samples are distributed within the existing 6,000-point limit; sampling
  anticipates later camera zoom when the point budget allows.
- Kept the actual pointer endpoint in the live tail and shared geometry
  preparation between preview and save. Release does not run a separate
  beautification pass. Existing local-coordinate rounding remains unchanged.
- Saved the prepared geometry as ordinary drawing points. Older drawings retain
  their original shape; changing the setting only affects subsequent strokes.
  History, clipboard, erasing, resizing and recovery consume that same geometry.
- Kept pointer sampling and preview work outside React state, with preparation
  and painting once per scheduled frame and one commit on release.
- Updated Board controls help, feature documentation and phase handoff.

## Scope and compatibility

No migration, new data field or format version is needed. Board spatial format
remains **5** and native content format remains **1**. A format-5 client without
the smoothing control can still display/erase the saved numeric geometry.
There is no rewrite or automatic cleanup of existing drawings.

The approved slice does not add shape recognition, pressure, tapered ends,
path-node editing or partial-stroke erasing. Smoothing preferences, like brush
settings, are local to the mounted Board session. The existing byte/geometry
budgets and whole-stroke eraser behavior remain in force.

## Commits

No commit created; the workspace contains earlier unrelated uncommitted work.
Suggested alternatives for this refinement:

- `feat(boards): smooth drawing strokes with adjustable stabilization`
- `feat(boards): add light and strong freehand smoothing`

## Actual validation

- Changed/new frontend files formatted with `vp fmt`: passed.
- `npm run lint`: passed — all 708 files formatted; no warnings/errors in 598 files.
- `npm run types:check`: passed.
- `npm run build`: passed. Existing large-chunk and ineffective dynamic-import
  warnings remain for the crop dialog, database property header and editor loader;
  plugin timing diagnostics are also reported.
- `git diff --check`: passed.
- New smoothing helper: 174 lines; drawing hook: 256; controls: 152. Each is below
  the source-file size limit.
- PHP syntax/formatting and migration execution are not applicable to this
  frontend-only refinement; no PHP/schema file was changed in this turn.
- No automated tests were written or run. No Playwright or other browser tooling
  was used. Manual browser behavior and perceived latency remain unverified.

## Manual test checklist and expected results

Reload the application and use a disposable Board with some existing drawings.
These are acceptance steps for the user, not observed browser results.

1. [ ] Choose **Draw on board**, then **Pen**. Expected: the Smoothing group shows
   **Light** selected. Off/Light/Strong can be reached with Tab and activated
   with Enter/Space; selected and focused states are visible.
2. [ ] Choose **Off** and draw a slowly wobbly line, loops and handwriting. Repeat
   nearby with **Light** and **Strong**, keeping color/width the same. Expected:
   Off follows sampled input; Light gently reduces wobble; Strong applies more
   correction while keeping the intended overall path recognizable.
3. [ ] In Light and Strong, draw long fast sweeps, then tiny slow curves and dots.
   Expected: fast movement stays responsive; slow strokes receive stabilization;
   taps remain dots and short strokes remain visible. Compare mouse/stylus/touch
   where available and note any perceived lag for follow-up tuning.
4. [ ] Draw pointed zigzags, a narrow loop and a handwritten word. Expected:
   smoothing does not turn them into recognized geometric shapes or remove
   pronounced turns. Strong may soften detail more than Light.
5. [ ] End a curved stroke at a recognizable canvas position. Watch the tail while
   drawing and then release. Expected: the visible endpoint remains at the pointer
   and the completed stroke retains the preview's shape, with no late cleanup
   animation or endpoint snap.
6. [ ] Switch to **Highlighter**, choose Amber, then compare the three smoothing
   options over text. Expected: strokes stay translucent, retain chosen width,
   follow the selected smoothing and do not activate the underlying text editor.
7. [ ] Change the smoothing setting after drawing. Expected: existing strokes do
   not change. Finish drawing, wait for save, reload and check again: the saved
   smoothed shape stays intact. The newly mounted session defaults to Light.
8. [ ] Undo/redo several smoothed strokes with both keyboard shortcuts and title
   buttons; copy/paste and duplicate one. Expected: one completed stroke changes
   per history action, and copies retain the exact saved shape and appearance.
9. [ ] Move and resize a smoothed curve, then erase across the visible arc.
   Expected: erasing follows its actual saved segments. Drag through empty space
   within a curved stroke's frame: it should remain. Undo restores erased strokes.
10. [ ] Start a smoothed stroke and press Escape before releasing. Repeat during
    an eraser sweep. Expected: unfinished ink is discarded, pending erased ink
    returns and no preview remains stuck. Escape while idle returns to Select.
11. [ ] Draw at 50%, 100% and 200% zoom. Expected: the same smoothing setting feels
    consistent in screen space; saved strokes stay in position and retain their
    shape when zoomed again. Check fullscreen and a narrow viewport: controls
    remain reachable and usable.
12. [ ] On touch, add a second finger during drawing and pinch/pan. Expected:
    unfinished ink is canceled and existing navigation takes over. Space+drag
    and middle-drag should likewise navigate without adding strokes.
13. [ ] Optional long-stroke check: continue a dense stroke until its existing
    limit is reached. Expected: the accepted portion saves within the budget,
    the limit message appears on release, and another stroke can continue.
    Curves can use a coarser approximation near the point budget.
14. [ ] Repeat representative smoothing, persistence and eraser checks using
    `boardRenderer=original` in the Board URL. Expected: both renderers display
    the same saved geometry.

## Known limitations

Smoothing is heuristic and can soften small details, particularly in Strong.
Point sampling is bounded and can become coarser for very long strokes. The live
endpoint remains unfiltered to preserve pointer placement. Resizing stretches
saved numeric geometry using the existing Board behavior.

No latency, CPU, thermal or visual measurements were taken. Static checks do not
establish the desired drawing feel; manual comparison above is the acceptance
boundary. The prior Board thermal issue has no new measured resolution.

## Issues addressed during review

Reserved one point for the actual endpoint, kept the first point exact, avoided
filtering identical release samples a second time, prepared curve detail for
later zooming and used the same sampled geometry for preview and persistence.

## Stop gate

Stop for manual review within Board phase 4. No later product phase is started.
