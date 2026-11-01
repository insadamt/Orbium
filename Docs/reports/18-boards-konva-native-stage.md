Summary: Reports the independent Boards V2 Phase-1 foundation, architectural evidence, validation and exact manual acceptance/benchmark steps. Depends on Konva 10.9.1, existing Board records, the verified Konva/V3 branch and the new phase contract; runtime and hardware results remain pending manual measurement.

# Boards V2 — Phase 1 native Konva foundation

2026-11-01. Implementation is ready for manual review; runtime acceptance and performance measurements have not been performed. No automated tests, browser automation, Playwright or hardware probes were run.

## Branch and preserved work

- Started with a clean working tree on `feat/boards-konva-engine` at `a892f388279d5f439e6d6454e80e79e6475424df`.
- Verified `git ls-remote origin refs/heads/feat/boards-konva-engine` returned that exact SHA. The first restricted-network lookup failed DNS; the permitted network lookup succeeded.
- Created **`feat/boards-konva-native-stage`** directly from that verified local head. Its merge base with `main` is `b0095bfdc1492a6ff73781e44f10139fa04e1bf8`; both `bf2c5aa` hybrid graphics and `a892f38` V3 editor correction remain ancestors.
- No reset, stash, rewrite, merge, push, migration or database write. No commit created while manual acceptance is pending. Keep one consolidated Phase-1 commit after review.

## Architecture implemented

`BoardCanvas` gates the native branch before mounting either `BoardWorkspace` or `BoardResourcePreviews`. The ordinary renderer still uses those unchanged services. The experiment has no old CSS-zoom camera, pointer hooks, hybrid bands, SVG fallback, preview preparation or autosave running underneath it.

| Responsibility / important file | Implementation |
|---|---|
| `board-canvas.tsx`, `native-stage/board-renderer-selector.tsx` | Development-only URL selector with lazy loading; normal production omits the native implementation. Explicit local profiling flag enables optimized assets. Existing original/instant/konva URL/session behavior and actual Konva default are preserved. Older reports claiming Instant Scene is still the default are superseded by the default correction at the top of START_HERE. |
| `board-native-baseline.tsx` | Separate Stage and one empty Layer. No grid, Transformer, record store, editor, graphics adapter or old workspace. Minimal library-native pan and pointer-centered modified-wheel zoom. |
| `board-native-stage.ts` | One Stage and one graphics Layer. Owns viewport/DPR resize handling, theme updates and disposal. Buffers resize only for viewport or density changes. |
| `board-native-camera.ts` | Reads position/scale directly from the Stage; no second camera ref/store. Uses existing Board zoom geometry and 10–400% limits. Fit/reset and centered controls use the same transform. |
| `board-native-grid.ts` | One non-listening Shape and one reusable 256×256 pattern tile; unchanged 32-world-unit dot spacing and constant screen dot radius. Panning reuses the pattern. Zoom updates the tile contents without resizing it. |
| `board-native-graphics.ts` | Native Rect/Ellipse/Line primitives in draggable Groups. Existing UUID/geometry/shape record contracts and a scratch BoardRecordStore own domain state. Completed native drags commit once; cancellation restores records first. No Konva serialization. |
| `board-native-interactions.ts` | Konva hit detection, Stage/Group dragging and selection Transformer. A focused controller owns mode changes, wheel, pinch, cancellation and focus. No parallel legacy pointer owner. |
| `board-native-workspace.tsx`, `board-native-stage.css` | Existing Board button/tooltip/theme styling around the vertical slice; clearly labeled scratch state, navigation and manual fixtures. |
| `board-native-diagnostics.ts` | On-demand counters, attached/offscreen canvas sizes, estimated RGBA bytes, node/object populations, visible count, input-to-scene proxy and pending layer draws. No sampling loop or PerformanceObserver. |

Use direct Konva because this slice needs no additional reconciler: React owns controls/lifetime and performs no state update per pointer sample, while native nodes own hit routing/dragging. Source inspection establishes this integration difference; **no measured React-Konva versus direct timing comparison is claimed**, and no React-Konva dependency was introduced just to benchmark it. Future integration changes still need actual measurements.

Reviewed installed `Stage`, `Layer`, `Node`, `Canvas`, pointer-capture and drag implementations and their types. Primary guidance: [pointer-centered Stage zoom](https://konvajs.org/docs/sandbox/Zooming_Relative_To_Pointer.html) and [Konva performance guidance](https://konvajs.org/docs/performance/All_Performance_Tips.html). Konva owns demand-driven draw batching. This code adds no requestAnimationFrame loop, interval or camera-to-React synchronization cycle.

## Retained and intentionally deferred

All existing saved content, V3 Documents, controls, media, history, autosave, recovery and renderer overrides remain accessible in the unchanged reference implementation. The new scratch canvas supports basic shapes, single native selection, native drag, Select/Hand, wheel pan, Shift-wheel horizontal pan, Ctrl/Cmd-wheel and trackpad zoom, touch pan/pinch, Space/middle drag, arrow camera navigation, +/- zoom, 0 reset, Fit, grid, theme/fullscreen resize and explicit diagnostics.

The scratch canvas does not load or save the current Board. Refresh/navigation discards it. This isolation prevents a partial feature implementation from hiding or mutating existing objects. The prototype uses native outline hit regions for unfilled shapes; click their outlines. Complete legacy rectangular object hit behavior awaits the full interaction review. Pinching cancels active movement; lift all fingers before starting the next one-finger gesture.

Phase 2 drawing, erasure, all legacy shapes, resizing and labels; Phase 3 HTML editors/media; Phase 4 complete shortcuts, multi-selection, snapping, clipboard and persistence coordination; Phase 5 measured optimization/replacement are not started. Rotation remains outside existing product scope. No migration, Board format 9/native content 1 change, archive change, backend change, new package or Document V3 edit.

## Performance evidence and remaining costs

**Source-backed allocation model, not observed browser measurements:** the baseline owns one attached scene canvas, one offscreen hit canvas and Konva's lazy Stage hit buffer. The foundation adds one fixed 65,536-pixel grid tile. Diagnostics enumerate actual buffer dimensions on demand, including the lazy buffer; allocated pixel counts therefore come from the running browser, not an assumed DPR. Estimated RGBA bytes are pixels ×4 and exclude browser/GPU copies, compositor surfaces, paths and other application memory.

Only viewport/DPR handling calls Stage size or scene pixel-ratio setters. Camera operations mutate Stage transforms; they do not rebuild groups, reallocate viewport canvases or edit individual HTML layouts. All ordinary paints currently redraw the single Layer; localized paints remain zero. Moving one shape therefore still traverses/repaints that Layer. Konva's own input/drag code reads container bounds; zero layout work is **not** claimed. Fixtures retain all native nodes, including offscreen nodes; no culling optimization has been claimed before measurement.

Diagnostics collect scene draws, camera attribute changes (not coalesced camera-frame count), viewport/resolution changes, created/destroyed graphical object Groups, record transactions, actual total nodes, canvas allocation and pending library draw state. `sceneRebuilds` is zero after construction because no rebuild path exists; fixture replacement is explicit record replacement. `htmlOverlayUpdates` is zero because HTML has not migrated. `inputToSceneDraw*` measures the latest observed input to a subsequent scene draw; it is neither presentation latency nor frame rate. Heap is browser-specific/page-wide or unavailable. CPU/GPU, memory trends, long tasks, layout, input presentation latency, FPS and temperatures need DevTools/OS measurement. No numerical improvement is reported.

Diagnostics are created only when an explicitly selected experiment mounts. Global `window.__ORBIUM_NATIVE_STAGES__` is a Map keyed by Stage UUID, supporting multiple mounted Board views. Cleanup removes only its own entry and deletes the global when empty. Registry snapshot calls are on demand. Konva may finish one already queued draw after destruction; application observers/listeners/records are released and no recurring frame is scheduled by this code. Check repeated navigation manually rather than assuming this proves leak freedom.

## Future native HTML architecture — review proposal, not approved implementation

A single Stage may own multiple Layers, but **one canvas bitmap cannot sandwich live DOM at arbitrary positions inside its node order**. Synchronizing a top HTML overlay to the camera fixes geometry, not interleaving. Raising the active editor above everything, taking permanent screenshots or silently switching to legacy rendering would change behavior; none is implemented here.

| Required question | Proposed behavior and unresolved cost |
|---|---|
| 1. Arbitrary ordering | Candidate: one authoritative Stage with native Layers for visible contiguous graphics runs, DOM editor slots interleaved as siblings in the same stacking context. Do not create a Stage per run. A compositor must preserve record order and must own DOM/canvas ordering explicitly. Not yet adopted or benchmarked. |
| 2. Interactive editors | Reuse the existing React components and V3/CodeMirror setup in stable DOM slots; keep active/pinned editors mounted. Apply the shared Stage matrix to each retained HTML run root. No per-pan editor reconciliation or second camera. DOM layouts/quality during zoom still require acceptance against existing layout zoom. |
| 3. Partial coverage | A higher graphics run's canvas must visually cover only its opaque/alpha-painted pixels above the DOM slot. Higher HTML covers lower graphics. A one-plane overlay fails this case. |
| 4. Selection/pointers | Canvas elements cannot simply accept all input above HTML: their transparent pixels would block editors. A shared compositor interaction router must compare the same ordered domain objects/hit geometry, delegate graphics hits to Konva and leave uncovered HTML to native input. Fullscreen transparent canvas pointer interception needs a measured implementation; `pointer-events:none` alone also loses native graphics interactions. |
| 5. Editing obscured blocks | Keep the editor at its original z slot; caret, text selection and scrolling remain native within uncovered regions. Higher shapes retain their visual and hit priority. Never raise the entire editor on focus. Keyboard/wheel/IME/portal ownership must stay with the active editor. Cross-boundary drag/text selection needs dedicated manual checks. |
| 6. Extra surfaces | One scene/hit allocation pair per active graphical run, plus any justified input/selection plane, native PDF/media buffers and the small grid tile. Shared transforms do not eliminate these allocations. Additional Layers cannot be presented as free. |
| 7. 500+ objects | Pool retained visible runs, omit purely offscreen inactive content, merge runs only where overlap/order proves it safe, and pin active editors. Worst-case overlapping alternating HTML/graphics still needs O(number of runs) composition surfaces. A fixed plane budget cannot guarantee exact arbitrary order for this case. |
| 8. Remaining performance costs | Native text zoom quality/layout, heavy editor/PDF retention, transparent hit routing, multiple scene/hit buffers, raster/compositor copies and full-layer redraws remain. Measure representative and adversarial scenes before choosing. No claim of bounded allocation with unrestricted exact stacking. |

Alternatives assessed: inactive Konva proxies plus real editing surfaces work only for individually compatible content and still need correct occlusion when editing; universal rasterization loses live media/editor behavior. Geometry-based DOM clipping/masking could reduce planes but must handle transparent graphics, strokes, shadows, text selection and native hit routing; a general solution is not demonstrated. Unlimited graphics bands preserve order but repeat the allocation problem. The previous six-band SVG fallback is preserved only in the reference implementation.

**Architecture gate:** exact arbitrary live HTML stacking, one graphics plane and a fixed allocation bound are incompatible in general. The multi-Layer single-Stage candidate preserves more behavior but its resource bounds and pointer routing are unresolved. Do not commit to it or implement a new stacking rule without a reviewed measured prototype and explicit approval. Phase-1 acceptance does not approve this future trade-off. Stop now before Phase 2; revisit the HTML gate before Phase 3.

## Actual static validation

Final results below were collected on the finished implementation. No automated tests/browser actions are part of these commands.

| Check | Actual result |
|---|---|
| Focused `vp check resources/js/components/boards/board-canvas.tsx resources/js/components/boards/native-stage` | Exit 0: all 11 files correctly formatted; 10 linted files with no warnings/errors |
| `npm run types:check` | Exit 0; initial selector inference error corrected |
| `npm run lint` | Exit 1: 14 pre-existing formatting failures, matching the prior hybrid report; unrelated files left untouched |
| `vp check --no-fmt` | Exit 0: 814 files, no lint warnings/errors; initial unbound-method warning corrected |
| Normal `npm run build` / experiment exclusion | Exit 0, 19.98s; emitted assets/manifest contain no native workspace, native-empty selector or `__ORBIUM_NATIVE_STAGES__` registry |
| `VITE_BOARD_NATIVE_STAGE=1 npm run build -- --outDir /tmp/orbium-native-stage-profile-build` | Exit 0, 16.81s; native workspace chunk and diagnostic registry verified present only in this separate local profile output |
| `git diff --check` / source size | Exit 0; all 10 new source/style files are under 500 lines; largest is the 310-line interaction controller |
| PHP/Pint | Not applicable; no PHP changes |
| Automated tests / Playwright / browser benchmarks | Not written or run, as instructed |

Both builds retain the existing large-chunk, three ineffective dynamic-import and plugin-timing notices. These are build notices, not runtime profiling evidence. The unrelated formatting failures are `resources/css/explorer-views.css`, `resources/css/workspace-navigation.css`; Board `board-keyboard.ts`, `board-properties-panel.tsx`, `board-shape-data.ts`, `board-shapes.css`, `board-toolbar.tsx`, `use-board-tools.ts`; Markdown `columns/columns-widget.ts`; navigation `workspace-navigation-preferences.ts`, `workspace-navigation-settings.tsx`, `workspace-sidebar-tree.tsx`, `workspace-sidebar.tsx`; and `resources/js/layouts/app-layout.tsx`. No changes to these files appear in this phase's working tree.

## Exact manual acceptance checklist

Start the usual local app and `npm run dev`; open a disposable Board. Save any existing work before using **Dev renderer**. A full navigation applies selection so old save/unload guards remain active. Session overrides apply only to existing renderers; native modes deliberately require the URL/development selector.

| Done | Action | Expected result |
|---|---|---|
| [ ] | Select **Empty Stage · baseline**, or open the Board URL with `?boardRenderer=native-empty` (use `&` if needed). | Labeled empty scene, no existing objects. Elements contains one `.konvajs-content` canvas; no `.board-world`, native editors, old grid or old scene overlays. |
| [ ] | Open Baseline diagnostics, click Read snapshot; wait 2s and take another. Leave the pointer outside the canvas during a 10s interval and read again. | One attached canvas; offscreen allocations explicitly listed; `sceneDraws` and `cameraAttributeChanges` stop increasing after settling; `pendingLayerDraws` reaches 0. Snapshot reads do not cause Stage draws. |
| [ ] | Drag and wheel the empty baseline, then Ctrl/Cmd-wheel at a fixed point; stop. | Stage camera values change, buffers retain dimensions, nodes remain unchanged; drawing settles after input. |
| [ ] | Select **Native Stage · scratch** (`boardRenderer=native-stage`). | Empty labeled scratch surface, existing-style controls, 100% camera and dot grid. No saved Board objects loaded or missing-content fallback. |
| [ ] | Click Rectangle, then click canvas. Repeat Circle/Triangle. Tab to a shape tool and press Enter. | Native basic shapes appear; keyboard placement creates one shape near the viewport center. No content/save requests in Network. |
| [ ] | Choose Select; click an outline, drag it at 100% and 200%; release outside the canvas. Click empty space. | One selection border follows the native Group; movement finishes correctly, selection clears on empty click. `graphics.recordTransactions` advances only for the completed drag, not each move. |
| [ ] | Start moving a shape and press Escape; repeat with window blur and pointer cancellation if the device permits. | Original scratch-record position is restored; cancellation creates no movement transaction or ghost drag. |
| [ ] | Hand drag; Select then Space+drag and middle drag, including starting over a shape. Release outside. | Camera moves; the shape's record does not move. Space release/blur restores ordinary selection. Middle input does not start browser autoscroll. |
| [ ] | Wheel/trackpad pan, Shift-wheel horizontally, Ctrl/Cmd-wheel and trackpad pinch around a visible corner; use +/- controls through 10–400%. | Pointer anchor remains stationary during zoom; one authoritative Stage camera; no object/node creation or viewport resize while navigating. |
| [ ] | On a real touch device, pan empty space, drag a shape, then add a second finger and pinch. Lift both and start again. | Pinch cancels object movement without committing it; camera follows pinch center; next touch gesture works. Record unavailable hardware as unavailable. |
| [ ] | Focus canvas; press arrows/Shift+arrows, +/-, 0; use Fit and Reset. | Camera pans in 32/100px steps, zooms within bounds; Reset returns 100%/origin; Fit shows content within limits. Keyboard shortcuts do not act while using diagnostics inputs. |
| [ ] | Toggle grid at multiple zooms; switch light/dark and fullscreen; resize the window or move across monitors with different DPR. | Correct themed grid/shapes, matching camera; canvas buffers resize only with actual viewport/DPR changes, not pan. |
| [ ] | Load scratch fixtures 10, 100, 500, 1,000. At each, pan/zoom, select/drag an outline, Fit, stop and take two snapshots. | Counts match, buffers stay viewport-sized regardless of world extent; no automatic legacy fallback; creation counters stay stable during navigation; idle draws settle. Fit may clip enormous extents at the existing 10% minimum. |
| [ ] | Hide/return to the tab, navigate away/back ten times; inspect registry and browser heap after GC. | No accumulation of Stage instances/canvases/observers/records. Konva may redraw once on visibility return; idle stops again. Registry has one entry per actually mounted native Board and removes entries on unmount. |
| [ ] | Switch to original, instant, konva and no override; reopen an existing mixed Board and a V3 Document. | Previous renderer precedence/default, saved objects, editors, layer order, history and save behavior remain intact. Scratch objects never appear in saved content. |
| [ ] | Build normal production assets; manually request `native-stage`/`native-empty`. | No Dev renderer selector/native registry; ordinary renderer loads. The experiment is included only with the explicit local profiling build flag below. |

## Exact manual performance protocol

1. **Empty baseline first:** use `native-empty` before adding shapes. Use the same app page, viewport, DPR, display refresh, theme, power mode and thermal starting state for comparisons. Disable animated wallpaper through normal appearance controls, verify it is actually paused/absent, then repeat separately with the original wallpaper state. Do not attribute wallpaper GPU activity to the Stage.
2. Use optimized assets for comparable timings: `VITE_BOARD_NATIVE_STAGE=1 npm run build` on a local profiling checkout, then serve the usual app with the Vite dev server stopped. This is an explicit profiling build, not the release default. Rebuild with `npm run build` when done. Keep all three renderer trials on this same optimized asset build.
3. Compare `native-empty`, empty `native-stage` with grid off, empty native with grid on, then the same empty saved Board in `konva` and `original`. Their initial node counts differ by design; record that difference. Match camera zoom/viewport and separate startup from settled idle. Do not call the shape-only scratch scene a mixed-Board parity benchmark.
4. For every mode wait 30s, close diagnostics, record 10s untouched in browser Performance and browser/OS task monitors. Repeat pointer-only movement without pressing, 10s pan, 10s anchored zoom and 10s idle afterward. Repeat three trials. Take on-demand snapshots before/after the trace interval, not continuously during it. Canvas draws should remain flat at settled idle.
5. In native scratch fixtures, repeat at 10/100/500/1,000 total objects. Record `visibleObjects` separately; the fixture spreads across 40 columns, so total is not visible count. Use matching fixed cameras and Fit as separately labeled workloads. Measure one-object dragging, pan, zoom, idle after gesture, 10s hidden/return and ten navigation/remount cycles. Compare native counts only to equally matched reference shape scenes created through ordinary UI, not unrelated mixed or differently dense Boards.
6. Record scene draws, full/local paints, camera attribute changes, object creation/destruction, total/visible nodes, attached/offscreen canvas dimensions and pixels, pending draw state and page heap from snapshots. Use browser traces for long tasks, scripting, style/layout, paint/raster/composite, event-to-presentation latency and frame cadence. Use OS/browser tools for CPU, GPU, process/GPU memory and temperature when available. Unsupported metrics are **unavailable**, uncollected metrics **pending**. Do not translate the input-to-scene proxy or buffer-byte estimate into FPS/GPU improvement.
7. Record representative raw traces plus three-trial summaries, before/during/after temperature, build identity, fixture/camera, actual renderer, viewport and wallpaper state. Require equivalent behavior and measured improvement before adoption. Large Documents, PDFs, long strokes/eraser and mixed stacking are deferred to their integration phases and cannot pass on this scratch scene.

| Build / mode / objects / visible / camera / wallpaper / trial | CPU/GPU | Scene draws / canvas pixels | Frame intervals / long tasks / input latency | JS / style-layout / paint-raster | Heap/process/GPU memory | Temperature | Result |
|---|---|---|---|---|---|---|---|
| Pending manual baseline | pending | pending | pending | pending | pending | pending | pending |

## Commit suggestions and stop gate

Preferred consolidated message: `feat(boards): add isolated native Konva Stage foundation`

Alternative: `feat(boards): introduce native Stage preview and profiling baseline`

Stop for **Phase-1 manual acceptance**. Runtime performance is unmeasured, not passed. Do not start Phase 2, migrate HTML, change the default or merge into main before explicit approval.
