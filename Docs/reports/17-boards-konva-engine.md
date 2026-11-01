Summary: Reports the opt-in Board Konva implementation, significant development decisions, actual checks, architectural limits and manual acceptance still required. Depends on the source-backed parity inventory, architecture plan and production profiling protocol; it does not claim measured CPU/GPU or thermal improvement.

# Board Konva hybrid engine — implementation review

2026-11-01. Branch: `feat/boards-konva-engine`, initially based on fetched `origin/main` at `02c64ec`; initial working tree was clean. During development, the separately authorized V3 Document restoration fast-forwarded this branch to local `main` at `b0095bf`, preserving in-progress Konva files. See `orbium-v3-konva-branch-integration.md`. Final checks cover the combined tree. No new migration-task commit, push, data reset, migration or API/archive/Board-format change. Current Board envelope remains **9**; native content remains **1**.

## Outcome and evidence boundary

Implemented an experimental renderer selected with **`?boardRenderer=konva`**. The existing Instant Scene default is unchanged. URL selection still precedes a valid `orbium.board.renderer` session value; original/instant overrides remain available. Konva has its own local camera key and retains the original 10–400% range. Save before switching modes and hard-refresh the frontend.

Milestones A–F have source implementations; G has a source parity review and the unchecked manual plan below. **Complete runtime parity and performance acceptance remain pending.** No browser, automated test, hardware benchmark, GPU counter or temperature measurement was run. A successful build is not a thermal resolution.

Read the [feature inventory](17-boards-konva-feature-parity.md) and [architecture contract](../plans/board-konva-engine.md) for source ownership and composition decisions. Significant development history is consolidated below, following the user's latest instruction to avoid a duplicate journal and report.

## Significant development history and lessons

1. Read existing Board phases, source and performance/Instant Scene reports before implementation. Their repeated negative thermal reviews established that source fixes are not measured CPU/GPU improvement. Preserve that evidence boundary.
2. Started from a clean tree and fetched remote `main`. The sandbox first denied `.git/FETCH_HEAD`; the authorized elevated Git command created the requested branch from `02c64ec`. Later integration revealed newer unpushed local `main` history, recorded in step 7.
3. Audited actual rendering/input/store/history/save ownership. Found whole-stroke preview preparation and fragment allocation before eraser candidate rejection. Actual placement offers three shape kinds, while seven validate; preserve code-level compatibility rather than copying stale six-entry picker documentation.
4. Considered and rejected a single background canvas (incorrect stacking), unlimited per-object/alternating planes (unbounded allocations) and screenshot blocks (lost editing). Wrote the architecture contract before renderer code. Inspected installed Konva internals and chose passive standalone Layers to avoid Stage viewport buffers and duplicate input routing.
5. A restricted package metadata query failed with `EAI_AGAIN`; the authorized installation succeeded with MIT Konva 10.9.1, preserving React 19.3.0. An early multi-file patch failed atomically on outdated context and was reapplied in smaller verified edits. Neither failed attempt changed product data.
6. Implemented graphics/input/eraser adapters, then refined them through static review: viewport-intersection crops, spare-plane reuse, dirty-plane deletion invalidation, stable adapter ownership, fallback preview repaint, camera budget re-evaluation, original PDF preparation, canonical deletion feedback and finite graphics motion. Extracted native object-layer presentation to retain the file-size boundary. Bounded smoothing initially over-constrained short tail sampling; the final allocation allows up to 65 vertices per chunk/tail while respecting the global saved-point budget.
7. The separate, user-authorized V3 restoration fast-forwarded this branch to `b0095bf`. Read and preserved its report/journal and START_HERE entry; that report verifies 36/36 then-existing Konva files byte-identical after integration. Re-ran checks on the combined tree. Lesson: latest remote and newest local history can differ; isolate concurrent branch operations where practical.
8. Final integrated-tree checks passed except full repository formatting in 14 unchanged files. Source/build verification leaves runtime parity, local smoothing, high-DPR quality, composition trade-offs and thermal evidence pending. The latest documentation instruction superseded the temporary request for separate chronological journals; this report now contains the significant history without a duplicate migration journal.

## What changed and why

- Added exact-pinned **Konva 10.9.1 (MIT)**. React and React DOM remain the installed **19.3.0**. Direct operations avoid introducing a separate React reconciler for pointer samples. Lockfile adds only Konva; optional server canvas backends were not installed.
- Added a focused graphics scene split across composition, plane lifecycle, geometry, live preview, streaming stroke, finite motion and native bridge modules. No second Board store, camera, history, clipboard or save service.
- Native HTML cards retain all editors, viewers, labels, controls, pointer ownership, focus and selection handles. Konva mode reuses existing Instant Scene HTML/Mermaid/PDF preparation, reader state and pinning rather than losing those features.
- Saved drawings use cached numeric-fragment Path2D geometry; shapes use the existing shared paths for all seven validated kinds. Rich labels remain native. A shape's existing outline width stays independent of nonuniform object resizing.
- Freehand coalesced input stays in refs. Completed 64-sample chunks are prepared once, the bounded tail updates separately, and release materializes/commits its numeric geometry once. There is no completion-time whole-stroke smoothing replacement. Highlighter opacity applies once to the live plane. Path Pen caches placed segments and retains its original SVG anchor controls/animations.
- Eraser sessions build a drawing-only spatial index, cache fragments and reject unrelated segments before existing exact capsule intersections. Large-index entries/query ranges have bounded overflow paths. Only dirty drawings get preview updates; one release action preserves original identity, frame, gaps and history.
- Graphics consume the existing imperative camera and transform paint boundaries, including cancel/rejected-commit restoration. No mutation observer scans card geometry each frame. Scene canvases are cropped to each band's viewport intersection; the input plane is independent of completed graphics.
- Explicit plane invalidation replaces automatic Konva scheduling for these owned layers only. No global Konva settings are changed. Unused hit canvases stay zero-sized; standalone Layers avoid Stage viewport buffers and duplicate input listeners. Unmount/fallback releases planes, paths, listeners and queued frames. Hidden tabs stop pending scene work and return invalidates presentation.
- Existing native CSS/WAAPI presentation remains. Graphics mirror finite WAAPI feedback; drawing style transitions use 160ms easing and stop; outgoing selection/hover outline barriers survive their short fade. Canonical drawing SVG is reconstructed only for inert deletion feedback. Reduced-motion changes stop graphics motion too.
- Development snapshots add `konvaScene` counters, plane/node/pixel counts, effective fallback and queued-frame state. Native object-layer presentation was extracted to keep touched orchestration below 500 lines.

## Composition trade-offs and known limits

1. **Exact ordering has a bounded fallback.** Graphics and native content use the same layer order, with odd graphics/even native z-index slots. HTML blocks, shape labels and visible/fading drawing outlines separate graphics bands. More than **six presented bands**, including retained/offscreen shells, switches the whole presentation to original SVG graphics. The request remains `data-board-renderer="konva"`; inspect `data-board-graphics="original"` and `data-board-graphics-fallback="stacking-budget"`. This preserves ordering/features, but those views are not accelerated by Konva.
2. **Pixel allocation is bounded separately.** A **24-million-scene-pixel** budget includes reserved capacity for one viewport input plane. Pixel ratio is capped at **2**. Over-budget views expose `pixel-budget`; missing canvas geometry support or adapter initialization failure exposes `canvas-unavailable`. About 96MB is the upper scene RGBA estimate, not total browser/GPU/PDF/editor memory. Higher-DPR visual clarity requires review. Pan/zoom redraw cropped graphics bands; its relative cost remains unmeasured.
3. **New smoothing is locally prepared.** Existing drawings are never re-smoothed. New streamed strokes retain the existing profiles, endpoint and saved-point bound, but use local 64-sample chunks and bounded curve sampling. They are not claimed pixel-identical to the previous whole-stroke result. Sparse fast curves, handwriting, zigzags and chunk joins need explicit visual acceptance before adopting a default.
4. **No screenshot replacement.** Native documents, databases/resource cards, CodeMirror, tables, PDF/media, Mind Maps and inline icons remain interactive. Passive Konva nodes deliberately do not replace existing rectangular selection hit targets with stroke-only hit behavior.
5. **Remaining thermal cause is unknown.** Existing app backgrounds, CSS compositing, PDF/media work, layout and observers can still contribute. No production trace ranks their costs or establishes lower temperatures. See the expanded drawing comparison in `../plans/board-performance-profiling.md`.

## Actual validation

| Check | Actual result |
|---|---|
| Focused `vp check` on changed/new TS/TSX/CSS | Passed; 30 correctly formatted files, 29 linted files with no warnings/errors. |
| `npm run types:check` | Passed, exit 0. |
| `npm exec vp -- check --no-fmt` | Passed, exit 0; 804 files with no lint warnings/errors on the integrated V3 tree. |
| `npm run build` | Passed, exit 0; final integrated-tree build **21.57s**. Existing >500kB chunks, three ineffective dynamic-import notices and plugin-timing notices remain. |
| `npm run lint` | **Failed**, exit 1: repository formatting stage reports **14 unchanged files**, listed below. They were not reformatted. |
| `git diff --check` | Passed. |
| Production Board diagnostic API / source size inspection | No `__ORBIUM_BOARD_PERF__` string in built JS assets; all new graphics and touched workspace orchestration files below 500 lines. |
| Automated tests / Playwright / browser automation | Not written or run, as instructed. |
| PHP syntax, migrations/database checks | Not applicable: no PHP/schema/persistence changes. |
| Browser, device, production profiling and temperatures | Not performed; pending manual evidence. |

Unchanged formatting failures: `resources/css/explorer-views.css`, `resources/css/workspace-navigation.css`; Boards `board-keyboard.ts`, `board-properties-panel.tsx`, `board-shape-data.ts`, `board-shapes.css`, `board-toolbar.tsx`, `use-board-tools.ts`; Markdown `columns/columns-widget.ts`; navigation `workspace-navigation-preferences.ts`, `workspace-navigation-settings.tsx`, `workspace-sidebar-tree.tsx`, `workspace-sidebar.tsx`; `resources/js/layouts/app-layout.tsx`. Earlier pre-V3 checks reported 17 files; the final combined-tree result above supersedes that count.

npm install reported 19 dependency-tree vulnerabilities (1 low, 4 moderate, 8 high, 6 critical). No unrelated dependency fixes were attempted; this is an install summary, not a new security audit or attribution to Konva.

## Exact manual checklist

Use disposable Boards and synthetic media. First inspect an existing representative Board in `original`, then repeat on **the same saved Board** in `konva`, matching camera/zoom/theme. Do not switch away from unsaved content. Each row remains unchecked.

| Done | Action | Expected result |
|---|---|---|
| [ ] | Open a small Board with `?boardRenderer=konva` (or `&boardRenderer=konva` if another query exists). Inspect `.board-canvas` in Elements. | `data-board-renderer="konva"`; ordinary small composition has `data-board-graphics="konva"` and an empty fallback reason. UI layout is unchanged. |
| [ ] | Set session renderer to `konva`, open an explicit `original` URL, then `instant`. Remove URL override; finally remove session override and reload. | URL beats session; no overrides restores Instant Scene; original and instant remain usable. |
| [ ] | Draw Pen taps and short/long strokes at 100%, using every brush width and theme/explicit colors. Repeat with a stylus and touch when available. | Round dots and continuous ink reach the pointer; release retains geometry, leaves Draw active and creates one object/action. |
| [ ] | At 100%, draw comparable 3px strokes with 3–5px wiggles in Off, Light and Strong; repeat small writing, sharp zigzags, sparse fast curves and long loops. Zoom to 400% after release. | Modes remain visibly distinct, major corners/details remain useful, joins have no gaps or objectionable flattening, and release/reload does not change the previewed stroke. Record any local-smoothing mismatch. |
| [ ] | Draw Highlighter loops and self-crossings with all widths; compare first/live/released appearance. | Width is four times brush width and opacity remains 0.3 without extra darkness at processing joins. Ordinary independent overlapping strokes retain their normal overlap. |
| [ ] | Create open Path Pen paths via Enter, Finish and double-click; create a closed path by returning to the first anchor. Use Shift while placing. | Straight segments, 45° constraint, unchanged square anchors; one saved drawing, no duplicated double-click endpoint. |
| [ ] | In a path draft, use Backspace, draft Ctrl/Cmd+Z and Remove last point. Change brush color/width, close/reopen the palette, pan with Space/middle drag, then finish. | Correct points disappear and cache updates; remaining draft/anchors survive palette toggling and pan; one-point drafts do not save. |
| [ ] | Start Pen/Path/Highlighter, then Escape, switch tools, lose capture/window focus, navigate away, or introduce a second touch. | Existing cancellation semantics apply; no ghost ink or accidental commit. Pinch takes camera ownership. Space/middle pan preserves a Path Pen draft. |
| [ ] | Erase through the middle of a pen stroke, highlighted stroke, path, dot and previously gapped drawing using all eraser sizes. | Only touched portions disappear; surviving pieces remain one original object with previous gaps. Non-drawing blocks remain untouched. |
| [ ] | Move and nonuniformly resize a drawing, then erase it repeatedly. Cancel one eraser drag, complete another, then Undo/Redo. | World-space erasure follows actual geometry; cancel restores prior gaps; one history action restores/reapplies the whole accepted drag. |
| [ ] | Select a drawing, change color/width (including default theme ink), move/resize/duplicate/copy/delete it; Undo/Redo. | Centerlines remain fixed when width expands the frame; finite formatting feedback remains, identity/gaps/opacity survive, and each action is independently undoable. |
| [ ] | Draw near the point/span limits and erase densely enough to reach the existing preview limit. | The existing limit message appears; oversized erasure cancels atomically; no invalid/partial saved result or interface lock. |
| [ ] | Create Circle, Rectangle and Triangle by click, Enter, and drags in all four directions. Use Shift and cancel a placement. | Actual three-entry picker remains; correct geometry/proportions, one release action and no canceled object. |
| [ ] | Open saved rounded rectangles, ellipses, diamonds and hexagons from an older representative Board. | Every legacy kind remains visible, selectable, editable, saveable and reloadable. If no such Board is available, mark this evidence unavailable rather than passed. |
| [ ] | Change shape fill/outline/dashes/width/rounding, resize it freely and with Shift; edit a rich label with marks, links, icons, alignment and direction. Overflow the label and scroll it. | Shape paths/labels stay aligned; typography/outline semantics are preserved; native editing and label scrolling work, modified wheel still zooms the Board. |
| [ ] | Stack a drawing below a filled shape, below a text/linked Document card, above that card, and across another labeled shape. Use front/back actions repeatedly. | Graphics and rich labels follow global order exactly, including partial overlap and transparent fills. No graphics are permanently placed behind HTML. |
| [ ] | Build at least seven separated graphics runs, e.g. alternating labeled shapes and drawings; inspect canvas attributes. Reduce the runs again. | Whole-presentation `stacking-budget` fallback keeps content/order unchanged; reducing the composition restores Konva. Record fallback transitions during selection/hover. |
| [ ] | Hover/select/deselect overlapping drawings, including a mixed group. Move/resize immediately after insertion or Undo restoration. | Original outlines/handles/fades stay in their correct layer; graphics follow live geometry without a temporary animation snap-back. |
| [ ] | Click, Shift-select and marquee a mixture of graphics/text/media. Drag, resize, snap, Alt-bypass, align and distribute it. Cancel a drag/resize with Escape. | Native hit targets, smart guides and handles remain; selection and graphics stay aligned; cancel restores original geometry and does not save a partial gesture. |
| [ ] | Use Ctrl/Cmd+A/D/C/X/V/Z, Shift+Z/Y as applicable; Delete/Backspace; Enter; arrows, Shift+arrows and Alt+arrows. Repeat inside a native text editor and a portal menu. | Canvas shortcuts preserve their original actions; editor/portal interactions are not intercepted; cut only removes content after clipboard success. |
| [ ] | Edit text/H1–H3, all list kinds/checklists, quote/callout, code language/source, table cells/rows/columns, math, Mermaid and divider. Try inline icon completion and IME composition. | All native features, marks, toolbars, full previews and focus survive. No content is rasterized; unrelated graphics remain steady while typing. |
| [ ] | Upload/reuse/replace an image, file, PDF, video and audio clip. Use crop/fit/captions, native playback, PDF page controls/download/fullscreen. Pan away and return to a pinned PDF. | Native controls and ownership work; original rich lifecycle/PDF view preservation remains available. |
| [ ] | Open/edit/scroll a linked Document, create a sibling Document, interact with an older resource card and an unavailable target. Edit a Mind Map with topics/search/layout/icons/local zoom. | Existing original-Document saves, locks, scroll continuity, missing states and map-local input remain functional. |
| [ ] | At 10%, 50%, 100%, 200% and 400%, overlap a drawing/shape with a text corner. Wheel/pinch around that corner, Hand/Space/middle pan, Fit/reset and resize the window. | No graphics/HTML drift; pointer coordinates, snapping and resize handles remain accurate; settled text/vector/PDF quality is usable. Review high-DPR displays separately. |
| [ ] | Start a Path Pen draft or eraser preview near a fallback boundary; change the viewport or pan so the effective renderer changes, then continue/cancel. | Preview repaints through the existing owner; previous gaps/draft points are preserved, with no double ink or stale native path. |
| [ ] | Switch themes and appearance settings; toggle fullscreen repeatedly; enable reduced motion while an effect is active. | Default ink follows theme, explicit colors stay explicit, existing UI/motion remains; reduced motion stops script effects and no permanent frame loop continues. |
| [ ] | Wait for Saved, refresh, leave/reopen, copy/paste into another same-workspace Board, and switch renderer overrides. | Geometry, drawing points/gaps, shape labels, blocks and attachment references survive without conversion or format changes. |
| [ ] | In a disposable Board, go offline, make a completed edit and reload in the same session; reconnect. In two browser tabs, make conflicting saves. | Existing recoverable draft/error flow remains; stale saves do not overwrite newer content; deliberate reconciliation is required. |
| [ ] | Leave an empty Board idle, then draw/erase and wait for Saved plus one second; hide/return to the tab and navigate between Boards repeatedly. | Additional graphics work settles; return draws correctly; no growing canvas/listener/queued-frame population. Measure using the protocol below. |

## Performance evidence to collect

Use **production frontend assets in both modes** on the same saved scenes and hardware. Follow the extended drawing section of `../plans/board-performance-profiling.md`; do not use development diagnostics as production CPU/FPS evidence. No baseline or after values have been collected.

Run empty idle/pointer, short stroke, long dense stroke, each smoothing mode, repeated drawing/erasing, 10/100/500/1,000 objects, mixed ordering, pan/zoom, drag/resize, idle-after-ink and hidden-tab-return comparisons, three trials each. Record effective fallback as well as requested renderer. Keep validation/autosave enabled. Match display refresh rate, DPR, camera, scene geometry and thermal starting state.

For each trial record CPU/GPU if available, frame intervals/dropped frames, long tasks, JavaScript/style/layout/paint/raster time, heap/process/GPU memory, canvas allocation, save work, and temperature before/during/after. Mark unsupported metrics **unavailable**. Do not infer lower CPU/GPU or temperature from source counters or a faster build.

## Commit suggestions and review gate

No commit was created. Suggested logical split:

- `feat(boards): add opt-in bounded Konva hybrid renderer`
- `perf(boards): stream ink geometry and index partial erasure`
- `docs(boards): record Konva parity review and profiling checklist`

Stop for this migration's manual review. Do not change the default, remove the old renderer or start another product phase before explicit approval.
