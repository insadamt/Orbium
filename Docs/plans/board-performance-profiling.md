# Board performance P0 — manual profiling protocol

Prepared: 2026-10-21. This is the measurement task from
[`board-performance-engine.md`](board-performance-engine.md), inside Board
phase-4 review. The user performs all browser acceptance. No automated tests are
required or authorized. The user's later architecture instruction supersedes the
P0-only implementation gate; this protocol now measures the implemented correction.

## Keep two kinds of recordings separate

**Baseline and before/after comparisons use production frontend assets**, the same
machine/browser/server, scene, viewport, device pixel ratio, browser page zoom,
Board camera/zoom, theme/background, reduced-motion setting and profiling options.
Do not compare a Vite development build against a production build. Keep the same
power mode, charging state, background applications and thermal starting condition.

The optional diagnostics and React Profiler are a **separate development attribution
run**. Development scheduling, Strict Mode, existing editor instrumentation and
DevTools overhead can change timings. Do not report their numbers as production
FPS, CPU utilization or an improvement. Ordinary production builds exclude the
Board diagnostic module and console API; no profile build flag is added.

Use disposable workspace content. The diagnostic result contains counts and
timings, with anonymous per-mount scope names; no titles, object IDs, text, file
names, paths or request bodies are included. Browser traces/HAR/React recordings
can include those details: inspect them before sharing. Never share cookies,
authentication headers, private uploads or a real account export.

## Prepare reproducible scenes

For native-block scenes, use the local-only generator instead of duplicating
blocks by hand:

```bash
php artisan boards:stress 1 --count=1000 --kind=mixed --layout=spread
php artisan boards:stress 1 --count=100 --kind=plain --layout=spread
```

Replace `1` with the destination workspace ID. Each invocation creates a new
root-level Board using ordinary hierarchy creation and Board validation/save;
existing content stays intact. Counts support 1–1,000. Use `--layout=dense` for a
separately labelled overlapping scene. Spread positions are 10 columns at
640 × 600 world-unit spacing, beginning at (80, 80). UUIDs vary between runs;
geometry/content are repeatable for the same options. Trash generated Boards
normally when finished. The command is available only with `APP_ENV=local`.

The native mixed pattern contains two text blocks and one each of list, code,
8 × 4 table, Mermaid, math, heading, quote and callout per ten objects. Code uses
the same small TypeScript sample and Mermaid uses eight nodes. This exercises
native previews, but **does not include media or linked Documents**. Use the
manual rich/media preparation below for that distinct workload; do not compare
the generator's native mix against the ten-kind media mix as equivalent scenes.
The 1,000-object scene cannot insert/duplicate until objects are removed; generate
500 objects when testing those actions without deleting existing blocks.

1. Create disposable Boards at **10, 100, 500 and 1,000 objects**, separately for
   plain text and mixed rich content. Keep the 1,000-object/256 KiB-block/4 MiB-Board
   limits. Wait for Saved after every preparation step.
2. For text, use identical short paragraphs of synthetic text. For mixed content,
   start with ten objects: two text, one list, one code, one table, one Mermaid,
   one math, one image, one PDF and one linked Document. Record table dimensions,
   code/source lengths, PDF page count and sizes, and linked Document block count.
   Use the same synthetic upload/Document when creating copies; separately note
   whether linked cards share a target or reference distinct Documents.
3. Repeat the ten-object selection with canvas Duplicate (Ctrl/Cmd+D). Duplicates
   become the new selection. For larger scenes, selecting all and duplicating
   doubles the object count. Example exact milestones: 10 → 20 → 40 → 80, select
   20 and duplicate → 100; double twice → 400, duplicate 100 → 500; double → 1,000.
   Verify totals in a development diagnostic snapshot or the Board content
   response in Network; do not copy the response's content into the report.
4. Move each copied batch into its own region. The 32-unit default duplication
   offset otherwise stacks content and measures an unrealistic dense viewport.
   Use matching batch positions in both revisions; record reference positions.
   Keep separately named snapshots/Boards at each milestone so no reconstruction
   is needed between comparison runs. Normal Board data remains format 4.
5. Pick a fixed starting camera at 100% showing a representative first region.
   Record visible/mounted counts and viewport dimensions. Pick another region
   beyond the mounting area, and a distant region exceeding recent retention.
   Define a repeatable pan path between these landmarks. Also record a dense
   visible-region case separately; total count alone does not describe a scene.
6. Include a video/audio check on a small separate media Board. Keep playback
   paused during baseline captures; label deliberate playback runs separately.

Expected: eight saved scenes with repeatable geometry, plus an optional small
media scene. Preparation is outside capture windows. Do not raise object limits
or bypass application validation by editing database records or pasting generated
domain snapshots. The local generator uses the normal application services.

## Production baseline

Follow the existing local server setup in `../../README.md`. Stop the Vite dev
server and run `npm run build`; ensure Laravel is serving the built manifest,
with no active/stale `public/hot` pointing to a dev server. Inspect Network:
frontend scripts must come from `/build/assets/`, without `/@vite/client`.
Keep the same backend/database and frontend build settings between revisions.
Do not change server settings or enable public debug output for profiling.

1. In Chrome/Chromium, use an undocked DevTools window to keep app dimensions
   fixed. Set CPU/network throttling to None. Record browser version, OS, CPU,
   RAM, GPU, refresh rate, DPR, viewport size, browser page zoom and Board zoom.
   Record the Git revision and asset manifest/build identity for each run.
2. Let the computer and app settle for 30 seconds. Record a 10-second idle
   Performance trace with screenshots disabled. Keep other pages/media quiet.
   Note Browser Task Manager CPU/memory with its process scope. CPU readings and
   temperature belong in separate columns; neither proves a particular JS cause.
3. Record a cold-open trace with Performance's reload recording. Keep Disable
   cache on for this case and the starting camera fixed. Measure navigation /
   Board request through first readable content, then rich content settling.
   Note whether empty/loading surfaces appear, the first/last preview requests,
   long tasks and scripting/layout/paint/raster time. Stop after content settles.
   Never describe this as a cold OS/PDF cache unless those were also controlled.
4. Turn Disable cache off for warm cases. Reopen the Board without restarting the
   browser/server, let it settle, then record warm return. Returning to an app
   tab may remount the Board; a return pan within the same Board tests retained
   surfaces. Record these separately.
5. Run each scenario below for ten seconds, **three times**, restoring its starting
   geometry/camera/content and waiting for Saved/idle between trials. Keep save
   work in the trace and label it; do not disable autosave, recovery or validation.
   Discard captures interrupted by hidden tabs, unrelated applications or downloads.

| Scenario | Exact action | Expected behavior / record |
|---|---|---|
| Pointer only | Move over empty canvas without a button | No selection, geometry change or content save; distinguish background work from gesture work. |
| New-region pan | Hand-drag along the landmark path into unseen content | Content progresses without input locking; record mount, source fetch, rich initialization, layout and paint cost. |
| Return pan | Immediately reverse the same short path, then repeat after a distant traversal | Recent surfaces should reuse mounted content; distant evictions can rebuild. Record delay/remount/refetch separately. |
| Zoom | 100% → 50% → 100% → 200% → 100%, around the same anchor | Sharp settled text/PDF; record layout, raster and density-refresh work. |
| Single/group drag | Drag one text, then table/PDF/resource, then a group along matching paths | Guides/toolbar follow; release ends at pointer; one final content/history action per gesture. |
| Resize | Side-resize wrapped text/table, then corner-scale; repeat PDF/resource frames | Live border/automatic height or frame tracks correctly; record layout and observer work. |
| Typing | Enter the same text block, add and delete a fixed sentence | IME/selection/marks remain correct; record input latency and unrelated renderer activity. |
| Table | Edit the same cell, insert row/column, undo and redo | Document-style controls and Board history survive; record hidden source view and rich widget work. |
| Linked Document | Scroll, enter editing, change synthetic text, finish and revisit | Original Document saves, scroll/source continuity and editor pinning survive. Separate fetch from rich DOM construction. |
| PDF | Scroll/change page, then zoom and return pan | Native controls work and settled quality stays sharp; record canvases, PDF jobs and raster. |

6. In each trace, select the actual interaction interval. Use Summary, Bottom-up,
   Call tree and the frame/rendering tracks to record: duration; >50ms long task
   count/time; scripting, style/layout, paint/raster; input latency where supported;
   and the names/stacks of the largest costs. Measure frame intervals/gaps from
   the trace. Do not treat a requestAnimationFrame rate as delivered frame rate.
7. In Network, filter the Board content endpoint and `resources/*/document`.
   Record full-Document request counts/concurrency and cached versus new downloads.
   For saves, record PUT payload bytes, request/TTFB/response duration and status;
   distinguish request bytes from compressed response transfer size. Identify
   original Document saves separately. No fetch monkey-patching is needed.
8. If an existing local backend query profiler is available, record query count,
   total SQL time and full-save upsert/delete work for one-object versus multi-object
   changes. Otherwise mark SQL metrics **unavailable**. HTTP duration includes
   network, validation, locks and response processing; it is not SQL duration.
9. After repeating a long pan path three times, sample settled memory/DOM counts.
   Record JS heap separately from browser/GPU/process memory. Do not force GC in
   only one comparison run. The 48-unit retention budget is not a byte cap.
10. Export each trace with scene/scenario/trial/build in its filename. Fill the
    results tables below. Compare matching trials and summarize median, p95 and
    maximum within a defined sample population. With three trial totals, report
    all totals and their median; a three-trial p95 is not robust. Frame/input
    distributions need their sample count and exact capture duration.

## Optional development diagnostics

Start the normal Vite development server separately from the production baseline.
Open a disposable Board. In the browser Console:

```js
sessionStorage.setItem('orbium.board.profile', 'true');
location.reload();
```

After the Board mounts and the lazy diagnostic module loads:

```js
window.__ORBIUM_BOARD_PERF__.list();
```

Select a scope from that list (for example `board-1`; scope numbers change on
remount/Strict Mode and are not persisted Board IDs):

```js
window.__ORBIUM_BOARD_PERF__.snapshot('board-1');
window.__ORBIUM_BOARD_PERF__.scenarios;
window.__ORBIUM_BOARD_PERF__.start('board-1', 'pan-back');
```

Perform the chosen action for ten seconds, then:

```js
window.__ORBIUM_BOARD_PERF__.stop();
copy(JSON.stringify(window.__ORBIUM_BOARD_PERF__.result(), null, 2));
```

`copy` is a DevTools Console helper. Save the result before starting another
capture. Only one capture runs at once; only its latest completed result is kept.
Captures stop automatically after 30 seconds or on hidden-page/pagehide/unmount.
Observers, timers, animation frames and listeners are removed on stop. Leaving
the last Board also clears the API/result and Board timing entries. Changing app
tabs may unmount the Board; use browser Performance recordings for open/return
across mounts rather than expecting the old console scope to survive.

Capture emits `orbium:board:p0:<scope>:<scenario>:start`, `:end` and a duration
measure into the Performance Timings track. Start/end snapshots run outside that
marked interval. No polling of DOM geometry or per-pointer-frame DOM scan occurs.
Long-task data applies to the **whole browser window**, not just the chosen Board;
use trace stacks to attribute it. Unsupported long-task observation reports
`supported: false`. Frame-interval summaries measure the diagnostic rAF callback
cadence, not presentation FPS. Arrays cap at 8,192 frame intervals and 1,024 long
tasks; `droppedSamples` reports overflow. A hidden/interrupted capture is not a
valid steady-state comparison.

Snapshot definitions:

- `countsByKind.total`: all current records, splitting typed PDF/video/audio file
  objects from generic files. Generic files are not MIME-inferred.
- `intersectingViewport`: geometric overlap with the real camera viewport.
  `inMountingRegion`: overlap with published overscan coverage. They are different.
- `mounted`: object cards actually present in the Board DOM. Retained and pinned
  counts are mounted cards outside overscan, with the active editor separated.
  `unmountedInViewport` highlights holes at the sampling instant, including initial
  mounting; repeat after settling before calling a one-frame gap a defect.
- Geometry comes from canonical records, so sample before/after gestures, not in
  the middle of a temporary drag/resize paint. Offscreen app-tab visibility and
  overlap/occlusion are not determined by geometric overlap alone.
- DOM counters cover the chosen canvas. Page element count covers the whole page.
  CodeMirror counts include hidden table source views; native editable views use
  ProseMirror DOM. Ready linked previews/PDF readers/tables/SVG/canvases indicate
  mounted surfaces, not exact in-flight rendering jobs or memory. Mermaid surfaces
  and their SVG elements are counted separately; general SVG also includes icons.
  Canvas pixel count is not total GPU memory. Portaled fullscreen viewers
  are outside the canvas count.
- `boardWorkspaceCommits` counts observed parent effect commits during the capture,
  after lazy registration. It does not count card commits/remounts or measure their
  cost. React Profiler is required for per-component attribution.

Disable diagnostics and verify ordinary development behavior:

```js
window.__ORBIUM_BOARD_PERF__?.clear();
sessionStorage.removeItem('orbium.board.profile');
location.reload();
```

Expected: `window.__ORBIUM_BOARD_PERF__` is undefined. On production assets it must
remain undefined even with the session flag set. Existing `__ORBIUM_PERF__` editor
instrumentation is separate and is not changed by this work.

## React attribution run

Use React DevTools Profiler against the same scenes in development. Enable
render-reason recording if offered, record ten seconds of one-object typing, then
separate drag, table edit and linked-preview runs. Select commits and inspect
BoardWorkspace, the edited BoardObjectCard and unrelated cards/rich children.
Record actual commit counts, component render durations and mount/update phases;
use highlight updates to locate activity, not as timing evidence. Existing memo
declarations do not prove isolation. Capture expensive component names/reasons and
save the profile. Strict Mode development invocations are not production mounts.

## Results worksheet and attribution gate

Repeat these rows for all eight scenes/scenarios. Use **pending** when a metric
has not been collected and **unavailable** when the browser/server cannot supply it.

| Build / scene / scenario / trial | Total / visible / overscan / mounted / retained / pinned by kind | DOM / editor / PDF / canvas counts | Duration / frame median / p95 / max / samples | Long tasks count / time | Script / style-layout / paint-raster | Requests / save bytes / HTTP latency / SQL count-time | CPU / memory / temperature |
|---|---|---|---|---|---|---|---|
| pending | pending | pending | pending | pending | pending | pending | pending |

Only fill the top-three table after inspecting matching production traces and
development component attribution. Source inspection can suggest a candidate;
it cannot assign measured rank or explain a thermal spike by itself.

| Rank | Scenario / scene | Trace interval and stack / component | Exclusive or inclusive cost, units and sample count | Repeatability / confounders | Next logical task |
|---|---|---|---|---|---|
| 1 | pending | pending | pending | pending | pending |
| 2 | pending | pending | pending | pending | pending |
| 3 | pending | pending | pending | pending | pending |

P0 measurement is accepted when the recordings/worksheet identify the dominant
costs and manual behavior checks pass. The later explicit architecture instruction
authorized implementation before those recordings. See the current architecture
report for acceptance; future experiments still require evidence.
