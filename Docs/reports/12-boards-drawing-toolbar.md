# Board drawing toolbar and recognition removal

## Phase and authorization

Board phase 4 manual review, 2026-10-23. The user reported poor recognition quality
and explicitly requested removing recognition for now, redesigning the drawing
toolbar to match Orbium styling and animation, and improving UX. This supersedes
`12-boards-smart-templates.md`; no later product phase is started.

## Implemented

- Removed the recognition hook, pending-stroke timer/grouping, $P adaptation,
  template catalogs, candidate/conversion actions and template gallery. Strong now
  applies extra freehand smoothing for both Pen and Highlighter. Stroke release
  creates one drawing object, with no delayed recognition history/save action.
- Retained perfect-freehand 1.2.3 for streamlining, existing bounded simplification
  and sampled curves. Retained its MIT notice in source/distributed notices;
  removed notices describing the deleted $P dependency.
- Replaced the crowded top-left controls with a compact lower-left glass palette,
  above the zoom controls and away from top-left save feedback/fullscreen headings.
  The panel wraps on narrow Boards and scrolls within short working surfaces.
- Reused shared Board tool buttons/tooltips, hover-highlight motion and `AppSelect`.
  Labeled Pen, Highlighter and Eraser improve discoverability. Done returns to
  Select. Visible pressed states and ink checkmarks identify active settings.
- Replaced the native width select with four visual presets and exact width labels.
  Highlighter labels show the existing four-times width. A brush sample updates
  with ink, width and 30% highlighter opacity. Theme ink follows app appearance.
- Named Off/Light/Strong explicitly as direct/gentle/extra smoothing. Eraser hides
  brush settings and explains that it removes whole strokes and supports Undo.
  The footer keeps pan/Escape guidance nearby.
- Added an eased 180 ms entrance and 100 ms noninteractive exit on the live panel
  using CSS discrete display transitions. Unsupported browsers immediately hide
  controls. Reduced motion disables these transitions and swatch/width motion.
  Coarse-pointer buttons and the smoothing select have 42 px minimum targets.
- Updated current Board/scope/phase documentation, help and handoff. The previous
  recognition report remains available as superseded implementation history.

## Persistence and compatibility

No migration, backend change, API, new persisted field or format bump. Spatial
format remains 5. Existing drawings and previously recognized Text/shape objects
retain their normal saved content and editing/selection behavior. Previously
converted content cannot be reconstructed as raw ink without existing session
history; removal does not rewrite user content. Brush/smoothing choices remain
local to the mounted Board session and affect new strokes.

## Files

- `resources/js/components/boards/board-drawing-controls.tsx`: palette shell/tools.
- `resources/js/components/boards/board-drawing-style-controls.tsx`: ink, width,
  smoothing and brush preview.
- `resources/js/components/boards/board-drawing.css`: layout, states and motion.
- `resources/js/components/boards/use-board-drawing.ts`: direct drawing lifecycle.
- `resources/js/components/boards/recognition/`: removed in full.
- `resources/js/components/boards/board-help-dialog.tsx`: current drawing guidance.
- `THIRD_PARTY_NOTICES.md`, `public/third-party/board-drawing-licenses.txt`: retained
  smoothing attribution; removed recognizer attribution.

All new/changed drawing source files stay below 500 lines. Unrelated existing
workspace changes were preserved.

## Actual validation

- Focused formatter: passed.
- `npm run types:check`: passed (exit 0).
- `npm run lint`: passed; 711 files formatted, no warnings/errors in 600 files.
- `npm run build`: passed (exit 0), built in 49.72 seconds. Existing large-chunk,
  ineffective dynamic-import and plugin-timing warnings remain.
- `git diff --check`: passed.
- Source search for recognition imports/controllers/actions/$P references in
  current frontend/drawing notices: no remaining references found.
- No automated tests written or run, per user instruction. No Playwright, browser
  automation, screenshots or browser manual testing performed.
- No PHP changes in this task; no PHP checks or migrations required.

## Manual test checklist

Use a disposable Board and reload the app frontend before checking.

1. Open a Board and click **Draw** in the title toolbar. Expect the glass palette
   above the bottom zoom lane, with labeled tools, Done and app-style controls.
   Save feedback and fullscreen heading controls should remain usable.
2. Switch between **Pen**, **Highlighter** and **Eraser**. Expect clear active
   states and shared hover/tooltips. Eraser should show whole-stroke guidance
   instead of color/width/smoothing controls.
3. In Pen, choose **Blue**, then each width preset. Expect the selected swatch
   check, numeric width and brush preview to update. Draw each stroke; new ink
   should use the selected color/width. Existing strokes should be unchanged.
4. Choose **Highlighter**. Expect width labels 4/12/24/48 px and a translucent
   brush preview. Draw over text/ink; highlights should remain at 30% opacity.
5. Compare **Smoothing → Off / Light / Strong** on slow wavy lines. Expect direct
   input, gentle cleanup and stronger cleanup respectively. Check feel manually;
   no accuracy or latency measurement is claimed.
6. With Strong, draw numbers, letters and shapes, then pause for more than two
   seconds. Expect all marks to remain freehand ink, no candidate/gallery controls,
   conversion toast, delayed text conversion or second history action.
7. Draw two strokes and use **Ctrl/Cmd+Z**, then **Ctrl/Cmd+Shift+Z**. Expect one
   stroke removed/restored per history step. No recognition/conversion step exists.
8. With Eraser, drag across several strokes. Expect touched strokes to fade and
   disappear on release; Undo restores them together. Unrelated text/cards remain.
   Start another erasure and press Escape before release; expect it to cancel.
9. Start a stroke and press Escape before release. Expect only that gesture to be
   discarded. Press Escape again while idle, or click Done; expect Select mode
   and the palette to close without an invisible panel intercepting the canvas.
10. Pan with **Space + drag** while the canvas is focused, use the zoom controls,
    and try two-finger pan/zoom on touch. Expect existing navigation behavior,
    with no accidental ink when panning and a reachable zoom lane.
11. Select a saved drawing, then move/resize/copy/paste it. Wait for **Saved** and
    reload. Expect the resulting ink geometry and colors to remain. Open a Board
    containing previously converted Text; expect it to remain normally editable.
12. Toggle light/dark appearance and select Theme ink. Expect the theme swatch,
    checkmark and ink to remain visible; colored swatches remain identifiable.
13. Narrow the app/split pane and try a short-height/fullscreen Board. Expect
    palette rows to wrap/scroll without horizontal overflow; tools, Done and zoom
    must remain reachable. On touch, expect controls of at least 42 px.
14. Use Tab/Shift+Tab to reach controls and Enter/Space to activate them. Open the
    smoothing menu, use arrows to select and Escape to dismiss. Expect visible
    focus, labeled selected values and menu Escape to leave drawing mode active.
15. With ordinary motion, open/close Draw and hover between tools. Expect a brief
    eased panel transition and shared hover motion. Enable OS reduced motion and
    repeat; expect immediate panel visibility and no swatch/width transitions.

## Known limitations

- Browser appearance, short-height layout, input feel and animation still require
  the manual checks above. Static checks do not establish visual acceptance.
- Smoothing may remove small detail in Strong mode. It does not understand text,
  shapes or symbols. Brush preview illustrates appearance rather than simulating
  handwriting or the smoothing algorithm.
- Existing whole-stroke eraser, geometry/byte budgets and session-only history
  limits remain. No performance/thermal measurements or improvements are claimed.

## Commits and stop gate

No commit created or files staged. Suggested messages:

- `refactor(boards): remove drawing recognition and retain freehand smoothing`
- `feat(boards): redesign drawing controls with app styling and motion`

Stop for the user's manual review within Board phase 4.
