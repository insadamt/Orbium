Summary: Reports Boards V2 Phase-2 native drawing, shapes and transformations, with source evidence, actual static checks and exact manual acceptance/benchmarks. Depends on the committed Stage foundation, canonical Board records and existing geometry; no browser or hardware improvement is claimed.

# Boards V2 — Phase 2 native graphics

2026-11-01. Authorized by the user's “go ahead” after Phase 1. Branch: `feat/boards-konva-native-stage`; initial working tree clean, HEAD `4ec6dff` (`feat(boards): add isolated native Konva Stage foundation`). Existing Konva/V3 ancestry is preserved. Phase 2 is ready for manual review; no Phase-2 commit, push, merge, backend write, migration or dependency change was performed.

## Implemented architecture and important files

| Responsibility | Source and behavior |
|---|---|
| Completed scene | `native-stage/board-native-graphics.ts`, `board-native-object-visual.ts`: canonical shape/drawing records project to stable Groups. Rect, Ellipse and Line primitives cover compatible shapes; shared quadratic geometry covers rounded shapes. Drawings use cached numeric-fragment Path2D geometry and canonical view-box scaling. Native transparent hit rectangles retain rectangular object hit behavior. |
| Live ink | `board-native-drawing.ts`, `board-native-ink-surface.ts`: one independent non-listening input Layer, coalesced pointer collection, bounded chunk/tail preparation, incremental completed-chunk rasterization and bounded tail repair. No React update or record-store transaction per freehand pointer sample. |
| Shared smoothing | `konva/board-streaming-stroke.ts`: adds an optional completed-chunk callback. Existing callers keep their previous behavior. Uses unchanged Off/Light/Strong preparation, 64-sample chunks, numeric output and the existing point budget. |
| Path Pen | `board-native-path.ts`: incremental placed segments, native anchor feedback, hover, 45-degree constraints, close/open completion, draft removal/cancellation and one completed drawing record. |
| Partial eraser | `board-native-eraser.ts`: existing drawing-only spatial index, cached fragments and exact swept-capsule clipping. Dirty-path previews stay outside canonical records; final changes commit once. |
| Shape placement | `board-native-placement.ts`: click defaults, pointer drag in all directions, Shift proportions, Enter placement, preview cancellation and one final record. The normal visible picker still offers only Circle/Rectangle/Triangle; all seven saved kinds are rendered by fixtures/reference copies. |
| Selection/transforms | `board-native-transformations.ts`: native Transformer handles, transient projections and one release commit. Resetting native scale into the geometry keeps shape outline width constant; drawing view-box scaling is preserved. Rotation/flips are disabled. |
| One gesture owner | `board-native-interactions.ts`: Stage event routing, primary-pointer capture, coalesced sample conversion, native drag, tool transitions, Space/middle pan, pinch/cancellation and scoped history/path keys. Geometry services attach no second pointer engine. |
| Existing controls | `board-drawing-controls-model.ts` exposes a presentation-only DTO. Existing drawing/style/eraser/path palettes accept it; their original engine remains structurally compatible. Existing drawing/shape formatting is reused; `showTextLayout` defaults true for existing Boards and is false only in the graphics scratch view. |
| Coordination/UI | `board-native-stage.ts`, `board-native-workspace.tsx`, `board-native-selection-controls.tsx`, `board-native-stage.css`: service lifetime, shared palettes, scratch history/layers, explicit saved-graphics copying, and on-demand diagnostics. |
| Diagnostics | `board-native-diagnostics.ts`: separate graphics/input draw counters, node/object counts, candidate/preview work, cache rasterization/repair counts, projection counts, scene/hit/live-buffer allocation and pending draw state. |

Reviewed installed Konva Transformer event emission, canvas/hit sizing and native drag implementations. Transformer events are observed on the Transformer itself; its non-bubbling transform events cannot be assumed to reach the Stage. Primary guidance: [native transformations](https://konvajs.org/docs/select_and_transform/Basic_demo.html), [stroke sizing](https://konvajs.org/docs/select_and_transform/Ignore_Stroke_On_Transform.html), and [automatic redraw scheduling](https://konvajs.org/docs/performance/Batch_Draw.html). No browser automation was used to inspect them.

## Rendering, data and interaction guarantees from source

- One Stage remains the camera authority. Ordinary camera changes retain graphics nodes and viewport buffer dimensions; no SVG/custom legacy scene mounts underneath it. The existing single-Layer `native-empty` baseline remains unchanged.
- Freehand samples are buffered outside React. The existing stream freezes completed numeric chunks and prepares only the bounded tail. Completed chunks paint into one viewport cache once per unchanged camera/style projection. The working buffer repairs the union of the previous tail, new tail and newly completed chunk bounds. Batches with no accepted new samples request no extra paint.
- The input Layer still clears/composites its viewport on each input paint; **localized cache repair is not a localized Konva Layer repaint**. Highlighter opacity is applied once to the composed opaque mask. A completed stroke becomes one canonical record using the same prepared geometry; no final whole-stroke smoothing pass occurs.
- Path Pen caches placed segments, including temporary pan and brush changes. Removal/settings changes deliberately invalidate its placed cache. Native anchor squares still draw on input paints. Canvas reprojection after actual camera/theme/viewport changes is deliberate work, not scene-node reconstruction.
- Erasure filters candidates spatially, caches original fragments, cuts exact swept capsules and updates only changed drawing paths. Release preserves survivor UUID/frame/layer/view-box/style and prior gaps. Fully erased drawings are deleted. Preview limits or final validation failure restore the whole gesture. Shapes and native blocks are never eraser candidates.
- Native movement/resizing previews do not publish store changes until completion. Cancellation restores canonical geometry before ending the library gesture. Corner resizing preserves drawing proportions; shape proportions are free unless Shift is held. Existing minimum/maximum geometry limits remain authoritative.
- Scratch Undo/Redo uses the existing forty-action history. Drawing, shape creation, formatting, movement, resizing, partial erasure and front/back operations publish completed actions. Path draft Ctrl/Cmd+Z removes an anchor before Board history is considered. Fixture/reference replacement deliberately resets scratch history.
- Current saved Board envelope **9**, content format **1**, drawing `points`/optional `breaks`, shape fields, object IDs, attachment/label data and Document V3 serialization remain unchanged. No Konva node serialization is persisted.

## Retained functionality and deferred integration

The native scratch view now includes Pen, Highlighter, Path Pen, partial eraser, all original widths/colors, Off/Light/Strong smoothing, eraser 8/16/32/64 screen-pixel diameters, shape fill/outline/dashes/rounding, seven saved shape kinds, click/drag/keyboard shape placement, single selection, native movement/resizing, grouped history and front/back layer actions. Existing navigation, grid, theme/fullscreen sizing, diagnostics and stress fixtures remain available.

The normal application renderer/default, saved Boards, rich labels, Documents/V3, native blocks/media, autosave, recovery, conflicts and existing UI remain on their unchanged active paths. The development action **Replace scratch with saved ink and shapes** copies those records into scratch without writing them back. Its interface explicitly says that HTML and rich labels stay in the saved Board. Reference shape label fields remain in scratch records and history; they are not converted to Konva text or erased.

Native HTML/editable labels and exact mixed stacking remain Phase 3's unresolved architecture gate. Full multi-selection, snapping, clipboard, context menus, remaining shortcuts/animations and persistence coordination remain Phase 4; replacement/default adoption remains Phase 5. This is still an unsaved graphical slice, not a claim that the complete Board migration is finished. Refresh/navigation discards scratch changes.

## Actual performance evidence and remaining costs

No browser, device, CPU/GPU, FPS, memory-trend or temperature measurement was performed. Static/source evidence does not establish improvement.

The foundation now owns two viewport scene canvases: completed graphics and input. Only graphics listens for hit testing; the installed Konva implementation keeps the non-listening input hit canvas at zero size. The grid tile remains 256×256. While freehand/Path Pen is active, two additional viewport buffers hold completed live chunks and the repaired composition. Both release to zero dimensions on finish/cancel. These are a bounded pair per active draft, not per-object canvases. Camera/style changes can rerasterize the draft into the same buffers; actual viewport/DPR changes resize them. Diagnostics enumerate these buffers and estimate RGBA bytes; GPU/compositor copies and other application memory remain external measurements.

Memory cost grows with viewport pixels and DPR². These buffers are intentionally exposed for profiling; no claim is made that their peak allocation is acceptable on every high-DPR display. The input scene plane remains allocated while the native foundation is mounted. Completed scene paints still traverse its native nodes. Moving/resizing one object and previewing erasure can redraw that Layer; offscreen graphics nodes are retained. Dirty erased paths reconstruct their changed fragment Path2D; unchanged drawings do not rebuild. Source-level `graphics.created/destroyed` counts graphical Groups, while `totalNodes` reports actual descendant populations.

`ink.preparation` counts raw samples, processed frames, newly completed chunks, accepted strokes/erasures, canceled gestures and eraser sweep/candidate visits. `ink.raster` counts preview frames, completed-chunk paints, tail paints, repaired pixels and full reprojections. At fixed camera/style, continuing a long stroke should add only newly frozen chunks to the completed raster counter. After release, total chunk paints may be lower than preparation count because the last prepared chunks can commit directly to the scene before another preview paint. Layer draws and input-to-scene timing remain mechanism counters, not presentation latency/FPS. DevTools/OS tools are required for actual long tasks, layout, raster, memory trends and hardware activity.

No permanent rendering loop, interval or polling observer is added. Native draw batching owns input preparation and presentation. Source instrumentation runs only in the explicitly selected development/profile experiment. Existing Layer cleanup and registry lifetime remain scoped per Stage. Repeated navigation must still be checked manually for leaks.

## Actual static validation

| Check | Actual result |
|---|---|
| Focused formatter/lint on native Stage and shared changed files | Exit 0: all 26 files formatted correctly; 25 linted source files, no warnings/errors |
| `npm run types:check` | Exit 0 on the final source tree |
| `vp check --no-fmt` | Exit 0: 823 files, no warnings/errors |
| `npm run lint` | Exit 1: same 14 pre-existing unrelated formatting failures as Phase 1; unchanged files left untouched |
| `npm run build` | Exit 0, 18.55s; emitted normal assets/manifest verified to omit native workspace, native-empty selector and registry markers |
| `VITE_BOARD_NATIVE_STAGE=1 npm run build -- --outDir /tmp/orbium-native-stage-phase2-profile-final` | Exit 0, 14.53s; native workspace chunk and `__ORBIUM_NATIVE_STAGES__` registry verified present in this separate profile output |
| `git diff --check`, new/modified source size | Exit 0; all new/substantially modified sources below 500 lines, largest controller 475 lines |
| PHP/Pint/migrations | Not applicable; no PHP/schema changes |
| Automated tests, Playwright, browser/hardware benchmarks | Not written or run, as instructed |

Builds retain the existing large-chunk, three ineffective dynamic-import and plugin-timing notices. Full lint's unchanged formatting failures are listed in the [Phase-1 report](18-boards-konva-native-stage.md); the exact same paths remain unaffected by Phase 2. No formatting cleanup of the V3 editor or navigation was mixed into this work.

Static source review also corrected native Transformer event ownership, excluded Transformer handles from ordinary empty-space selection, and restored changed drag geometry even when Konva's earlier touch-cancel handler had already marked the drag stopped. These corrections passed the final checks above; their browser/device behavior remains in the manual matrix.

## Exact manual acceptance checklist

Start the usual local app and `npm run dev`; open a disposable Board with `?boardRenderer=native-stage` (or use **Dev renderer → Native Stage · scratch**). Save current application work before switching renderers. Every row below is pending user review.

| Done | Action | Expected result |
|---|---|---|
| [ ] | First open `native-empty`, take two snapshots ten seconds apart after settling; then return to native-stage. | Independent one-Layer baseline still works and settles. Native foundation has two attached scene canvases; no `.board-world`, duplicate legacy renderer or active native editors. |
| [ ] | Rectangle/Circle/Triangle: click, Enter while armed, then drag in all four directions; repeat Shift-drag and cancel a placement with Escape/tool change. | Correct default/dragged geometry and equal sides with Shift; one completed action; successful placement selects the shape and returns to Select. Canceled previews create no record. |
| [ ] | Load 10-shape fixture and inspect Circle, Rectangle, Rounded rectangle, Ellipse, Diamond, Triangle and Hexagon. Repeat using a saved representative Board's explicit graphics-copy action. | All seven saved kinds render with their existing geometry. Copy is explicit; HTML/labels are identified as outside this view. Saved Board records remain unchanged. Missing representative data is unavailable evidence, not a pass. |
| [ ] | Change fill/transparent fill, theme/explicit outline color, 1–12 outline width, solid/dashed outlines and supported corner rounding. Undo/Redo each. | Appearance matches the reference renderer; each accepted action is independently reversible. Rounding only appears for supported kinds. Theme color follows appearance; explicit colors persist. |
| [ ] | Click shape/drawing interiors and outlines, drag beyond the canvas edge, release and Undo/Redo. | Native rectangular hit targets select the whole object, movement follows the pointer and commits once. Selected border stays aligned. |
| [ ] | Resize shapes with every side/corner handle, with/without Shift; inspect outlines at 50/100/200/400%. | Free shape dimensions by default, Shift-constrained corners; outline width/dashes do not stretch with the object frame. No rotation or flip handles. |
| [ ] | Resize pen/highlighter/path drawings using sides and corners; then Undo/Redo. | Sides stretch numeric view-box geometry, corners preserve aspect; color/alpha/gaps remain unchanged. One resize gesture is one history action. |
| [ ] | Begin drag/resize and press Escape, blur the window, or trigger pointer cancellation. | Original canonical geometry returns; no partial history action or continuing drag after focus returns. |
| [ ] | Pen: draw a tap, short line, tight handwriting and curved/zigzag strokes using all colors/widths. Repeat Off/Light/Strong and compare the reference renderer. | Round dot/caps, distinct smoothing modes, actual endpoint retained, no release-time whole-stroke beautification. No React-driven pointer lag is asserted without traces. |
| [ ] | Draw a ten-second dense loop at fixed 100% camera; repeat on 100/500/1,000-shape fixtures. Compare before/after diagnostic snapshots and trace intervals. | Input Layer paints during ink; completed Board scene does not repaint for every pointer sample. Newly frozen chunks rasterize once at the unchanged projection; repair work follows the changing tail. Record endpoints/selection draws separately. |
| [ ] | Continue ink until the 6,000-point or 3,900-world-unit span boundary, then release. | Accepted portion remains one valid stroke and the continuation notice appears. Ignored duplicate/limited samples do not request extra preview paints; no invalid partial record is inserted. |
| [ ] | Highlighter: self-crossing loops at every width, then overlap two independent strokes; inspect live/released appearance and chunk joins at 400%. | Width is four times brush width, opacity 0.3 is applied once per stroke, no darker processing seams; independent stroke overlaps retain normal combined alpha. |
| [ ] | Path Pen: add anchors, hover, Shift-constrain, finish with Enter, Finish and double-click; close by returning to the first anchor after three points. | Visible anchors and straight segments; 45-degree constraints; one canonical drawing per completed path; no duplicated last double-click point. |
| [ ] | In a Path draft use Backspace, Ctrl/Cmd+Z, Remove last point and Cancel. Change color/width, hide/reopen the palette, Space/middle pan, then finish. | Draft edits are local; settings/temporary pan retain the intended anchors, path geometry follows the camera, one-point drafts do not commit. Explicit tool changes cancel the draft. |
| [ ] | Erase through pen, highlighter, Path Pen, dot and previously erased drawings using all four eraser diameters. Include moved/nonuniformly resized and overlapping drawings. | Only touched numeric portions disappear; surviving pieces stay one original object with original frame/style/gaps. Shapes are untouched. Cursor diameter is screen-based at gesture start. |
| [ ] | Erase locally in dense ink, then erase an empty distant area. Read candidates and preview counters. | Candidate filtering avoids unrelated drawing work; only dirty paths preview. An untouched eraser sweep creates no history entry. |
| [ ] | Complete a multi-stroke erasure; Undo once, Redo once. Repeat but Escape/blur/lose capture before release. | One completed history action restores/reapplies the whole sweep; canceled previews restore every earlier gap and object. Limit rejection restores atomically. |
| [ ] | Select and format an existing drawing's width/color after erasure and nonuniform resize. | Frame expansion preserves centerlines, breaks, opacity and scale; unsupported oversized width changes are rejected with the existing message. |
| [ ] | Overlap ink and all graphical shapes; use front/back controls and Undo/Redo. | Native graphics follow canonical layer order, including translucent highlighter/fills. One reorder action changes/restores the whole order. This does not validate HTML interleaving. |
| [ ] | Wheel/trackpad/modified-wheel zoom, Hand/Space/middle pan, real touch drawing/pinch, Fit/reset, theme/fullscreen/window resize. | One Stage camera; stable node identity/backing dimensions during ordinary pan/zoom; pinch cancels active ink/placement, then owns camera. Touch hardware unavailable must be marked unavailable. |
| [ ] | After completing/canceling ink, wait two seconds and compare two snapshots ten seconds apart with the pointer outside. Hide/return, navigate away/back ten times. | Draw/work counters settle, pending Layer draws reach zero, both live mask buffers show zero dimensions, registry entries/canvas populations do not accumulate. Visibility return may draw once. |
| [ ] | Refresh or switch back to konva/original/instant and reopen the saved source Board plus a V3 Document. | Scratch edits disappear deliberately; saved graphics, gaps, rich labels, Documents/media, renderer overrides/default and save/history behavior remain intact. |
| [ ] | Run normal production build and request native URLs; then use an explicitly flagged local optimized build. | Normal build has no native selector/registry and uses the current renderer. Only the explicit profile build exposes this experiment. |

## Exact manual performance protocol

1. Use the [Phase-1 baseline protocol](18-boards-konva-native-stage.md) first. Match machine, viewport, DPR, refresh rate, zoom, theme, power/thermal starting state and animated-wallpaper setting. Pause wallpapers through normal appearance controls to isolate Board work, then record a separate wallpaper-enabled run.
2. Serve local production assets built with `VITE_BOARD_NATIVE_STAGE=1 npm run build`, with the development server stopped. Compare native-stage, native-empty, original and konva using the same optimized build. Rebuild normally afterward. The validated separate `/tmp/orbium-native-stage-phase2-profile-final` output does not change the application's normal production assets.
3. Use graphics-only saved representative Boards and the explicit scratch copy to match geometry/ink density to the reference renderers. Rich/mixed Boards are a different workload; never report a graphics-only copy as full mixed-content parity. Record total **and visible** object counts. The fixture spreads over forty columns, so 1,000 total objects is not 1,000 visible.
4. At 10/100/500/1,000 objects, settle 30s and record three ten-second trials each: untouched idle; pointer-only; short pen/dot; long dense loops for each smoothing mode; highlighter self-crossing; Path anchor placement/hover; local/distant erasure; repeated pan/zoom; native drag/resize; idle after completion; hidden-tab return; repeated mount/unmount. Match geometry, camera and wall-clock gesture duration; label limits/cancellation explicitly.
5. Use on-demand snapshots before/after captures. Record `graphicsLayerDraws` versus `inputLayerDraws`; raw/prepared/chunk counters; chunk/tail rasterizations and `repairedPixels`; `fullReprojections`; eraser sweeps/candidates; record transactions; created/destroyed Groups and actual total nodes; canvas dimensions/pixels, live buffers and pending draws. Do not continuously call snapshot inside the measured interval.
6. At fixed camera/style, a long stroke should not repeatedly rasterize already frozen chunks or redraw all completed Board objects. Changing the camera/style deliberately reprojects the draft; separate those trials. The final insert/erase/transform and selection changes legitimately redraw the completed scene. Input Layer clearing/compositing remains viewport work even when cache repair is localized.
7. Use browser Performance for long tasks, JS, style/layout, paint/raster/composite, frame cadence and event-to-presentation latency; use browser/OS tools for CPU/GPU, process/heap/GPU memory and temperature where exposed. Capture heap after repeated gestures and after navigation/GC. Source RGBA estimates exclude GPU copies and are not measured memory usage. Mark uncollected values **pending**, unsupported hardware metrics **unavailable**.
8. Save raw traces and three-trial summaries with build identity, requested/effective renderer, object/point density, visible count, zoom, viewport/DPR, wallpaper and sensor conditions. Require matching behavior and measured improvement before adoption; no build result or counter ratio alone proves thermal resolution.

| Build / scene / renderer / action / trial | Total/visible objects / point density | Graphics/input draws / raster work / pixels | CPU/GPU / frame cadence / input latency | JS / layout / paint / long tasks | Heap/process/GPU memory | Temperature before/during/after | Result |
|---|---|---|---|---|---|---|---|
| Pending manual capture | pending | pending | pending | pending | pending | pending | pending |

## Commit suggestions and stop gate

Preferred: `feat(boards): add native Stage drawing and graphical transforms`

Alternative: `feat(boards): migrate ink shapes and erasing to native Stage`

No Phase-2 commit was created. Keep this phase consolidated after acceptance. Stop for **Phase-2 manual review**. Phase 3 HTML integration, its stacking trade-off and any default/merge change require explicit approval; this continuation did not authorize them.
