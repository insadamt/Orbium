# Orbium Instant Scene — milestone 1 implementation report

2026-10-23. Board phase-4 experimental performance correction. First working
milestone implemented; browser acceptance and performance comparison pending.

## Branch and repository state

- Fetched `origin/codex/boards`; both local and remote base were `ca15212`
  (`perf(boards): remove repeated parsing and preview scheduling work`).
- Created and switched to `codex/instant-scene-engine` from that remote base.
- The starting working tree was clean. No user changes were discarded.
- No commits or pushes created. The implementation remains available for review
  in the working tree; neither base branch nor main was merged or changed.
- No migration, database change, new dependency, server protocol or archive/content
  format change. The existing 1,000-object limit remains.

## Observations and supporting evidence

Inspected camera/visibility/retention, canvas/card, normalized store, scheduler,
Document preview, table/source blocks, resource provider, Board CSS, PDF density,
Mermaid rendering, diagnostics and the documented stress-scene generator.

| Confirmed source behavior | Implication; not a measured ranking |
|---|---|
| Original `use-board-camera.ts` changes layout zoom with every changed zoom paint | Layout/density work is a candidate during zoom. Pan already uses translation; this is not evidence that React dominates. |
| `use-board-rendered-objects.ts` retains 48 weighted units beyond overscan, then destroys old cards | Returning after eviction recreates presentation. Current caches already avoid some source fetches and Mermaid/math compilation. |
| `board-document-preview.tsx` reconstructs rich DOM from retained/fetched source | Source caching alone does not retain rendered Document sections. That block remains a fallback in this milestone. |
| Native inactive tables already avoid full editors; rich source/cell paths still initialize shared renderers | Replacing native editors across all records would add work and risk parity. |
| Card height observation uses ResizeObserver and may publish derived geometry | Text templates do not eliminate intrinsic layout/observation cost. |
| Provider metadata refresh still has its existing 30-second interval; media/app backgrounds can animate | A stationary scene is not proof that all browser activity is zero. |
| Existing diagnostic capture deliberately samples rAF only during an opted-in capture | Capture cadence is not delivered FPS and the idle capture itself introduces callbacks. |
| `public/hot` exists locally | Running a build alone does not make the ordinary dev server a production-assets baseline. |

Browser style/layout, paint/raster, compositing/GPU cost, actual rich initialization
duration, React commits and foreground idle CPU have **not** been profiled here.
The available shell can build and inspect HTTP assets, but no interactive browser
profiling was performed. No Playwright/browser automation or automated tests were
written or run. CPU, power and temperatures are unmeasured; the thermal complaint
remains unresolved.

## Architecture and delivered behavior

Read the [architecture contract](../plans/board-instant-scene-architecture.md)
for reasoning, budgets, security, lifetime and alternatives.

- An explicit original/instant adapter uses real Board records. Instant Scene is
  now the default on this experimental branch following the user's review
  request; original remains the explicitly selectable functional reference.
- Eligible native text/heading/list/quote/callout has a detached reusable DOM
  template. A finite Board-scoped preparation pipeline also prepares offscreen
  eligible records, separately from card lifetime.
- Native Mermaid uses shared strict rendering/sanitization and per-object prepared
  SVG references. Warm copies need no Mermaid session and receive unique IDs,
  current theme variables and full-preview controls. Shared source reuse remains.
- Canonical record changes invalidate only affected representation revisions.
  Geometry and layers remain controlled by the current subscribed object card.
  Deletion/undo/redo/conversion/reset follow the same store notification path.
- Native editors activate through existing double-click/Enter/Edit paths. Finishing
  uses the current record to prepare the preview. The existing pinned editor rule
  preserves the active session outside the viewport. Checklist actions use the
  same validated content/history write path.
- Instant Scene keeps layout density steady while scaling a zoom gesture, then
  commits native sharp density at settling. Wheel/touch anchors clamp before their
  position calculation. Its camera range is 50–200%, with a separate saved view.
- Preparation has entry/estimated-byte/node/concurrency/batch bounds, hidden-tab
  suspension, queued cancellation and stale-result guards. No permanent scene
  animation loop was added. Oversized SVG falls back to native rendering.
- Development opt-in diagnostics now include renderer mode, scene hit/miss/cache
  and preparation counters, shared Mermaid counts, queue activity and camera
  density-change counts. Existing frame/long-task/DOM capture remains available.

Implemented coverage is intentionally limited to those native prepared kinds.
Tables, code, math, images, media/PDF, linked Documents and navigation cards keep
their current complete implementation. Persistent assets, worker tasks, spatial
tiling, adaptive quality, hard global rich-renderer caps and production migration
are planned only. Canvas/OffscreenCanvas/WebGL were evaluated in the architecture
document; none is needed to demonstrate this DOM/vector slice.

## Files

New files under `resources/js/components/boards/instant-scene/`:

| File | Responsibility |
|---|---|
| `board-renderer-mode.ts` | Explicit opt-in and experimental budgets |
| `board-instant-scene.ts` | Record-driven preparation, prioritization and cancellation |
| `board-scene-assets.ts` | Bounded prepared assets and visual revision matching |
| `prepare-board-text.ts` | Safe native templates using existing link/color validators |
| `board-prepared-surface.tsx` | Lightweight presentation and checklist/native fallback behavior |
| `use-board-instant-scene.ts` | Board/provider lifetime integration |
| `paint-board-camera-surface.ts` | Original/hybrid camera surface painting |

Modified Board files: `board-canvas.tsx`, `board-object-card.tsx`,
`board-record-store.ts`, `use-board-camera.ts`, `use-board-pointer.ts`,
`board-prepared-previews.ts`, `board-work-scheduler.ts`,
`board-performance-scene.ts`. Documentation: this report, the architecture contract,
`Docs/START_HERE.md` and `Docs/docs/24-boards.md`.

## Baseline and comparison environment

Before source changes, `npm run build` passed in **14.55s**, transforming 5,503
modules, on base `ca15212`. Baseline manifest SHA-256:
`fa49a5bfe2a54df79c45982c82407ffdb9f9366feca428314ab144534d3f56bd`.
This is a build baseline, **not** a browser performance measurement.

A temporary comparison server was started at
[built frontend login](http://localhost:8001/login), using the same local backend
and data. HTTP inspection returned 200 and `/build/assets/` links without a Vite
client. The ordinary server, `.env` and `public/hot` were preserved. This is a local
backend with production frontend assets, not a production backend deployment.
The server/router are temporary and are not part of the committed application.

Restart from the repository root if needed, while the temporary file still exists:

```bash
php -S 127.0.0.1:8001 -t public /tmp/orbium-instant-built-router.php
```

The router overrides Vite's hot-file lookup only inside that server after provider
bootstrap. Alternatively stop the Vite server normally, run `npm run build`, and
follow the existing [built-asset protocol](../plans/board-performance-profiling.md).
Verify Network script URLs before recording either engine.

## Actual validation — initial milestone build

- Changed-source `vp fmt`: PASS. Final repository `npm run lint`: PASS, 687
  correctly formatted files, no warnings/errors in 579 linted files.
- Final `npm run types:check`: PASS, exit 0.
- Final `npm run build`: PASS, exit 0, **17.12s**, 5,510 modules transformed.
  Existing large-chunk, mixed static/dynamic import and plugin-timing warnings
  remain. These times are build observations, not runtime benchmark results.
- Final production manifest SHA-256:
  `e2d437f21b10703e8c15af12c45129c21c782f90798f8282788cdb390e8ab9e7`.
- Production manifest/JavaScript inspection: no Board diagnostic module, console
  API or capture-marker strings in shipped referenced scripts.
- `./vendor/bin/pint --test`: PASS, repository formatting check.
- Temporary comparison router `php -l`: PASS. Login HTTP/asset inspection: 200,
  built asset URLs. This does not establish authenticated Board behavior.
- `git diff --check`: PASS. All new/modified source stays under 500 lines; the
  largest modified file is the existing pointer hook at 498 lines, canvas 484;
  new scene engine 310 lines, other new source files 165 lines or fewer.
- Early lint found one unused import and a formatting issue after a rename;
  both were corrected before the final passing lint run.

No automated tests are authorized. Pint's `--test` is a formatting check, not an
application test run. No PHP application source changed.

## Exact manual acceptance checklist

Use disposable content, finish saving before changing flags/reloading, and use
one engine at a time. Sign in on port 8001 if needed. Keep viewport/browser page
zoom/DPR/theme/background and Board camera identical for comparisons.

1. **Reference and flag:** open a saved Board with `?boardRenderer=original`, then
   with `?boardRenderer=instant`. In Console inspect
   `document.querySelector('.board-canvas').dataset.boardRenderer`.
   Expect the corresponding name, the same content/design/controls, original
   10–400% zoom and instant 50–200%. Remove the query and session flag, then reopen:
   expect instant. URL selection must override an opposite session value.
2. **Empty/idle:** create an empty Board and choose instant. Wait until settled,
   then record ten seconds with Performance, screenshots disabled. Expect no
   recurring scene frame/preparation loop. App background effects are separate.
3. **Repeatable scenes:** run these manually, replacing workspace `1` as needed:

   ```bash
   php artisan boards:stress 1 --count=1000 --kind=plain --layout=spread
   php artisan boards:stress 1 --count=1000 --kind=mixed --layout=spread
   php artisan boards:stress 1 --count=1000 --kind=mixed --layout=dense
   ```

   Expect three separate disposable Board URLs and normal validation/1,000-object
   limits. These commands do not create PDFs, media or linked Documents. Prepare
   a separate smaller Board with those kinds through the ordinary UI.
4. **Cold/warm return:** on text and mixed scenes, start at 100%, pan to another
   row, return, then travel well beyond card retention and return. Expect warm
   prepared native content without a loading state or diagram compilation.
   Cold diagrams can show their source until prepared. Eviction from both bounded
   caches can require preparation; note that separately from a warm hit.
5. **Read fidelity:** compare headings, quote/callout, list indentation/numbering,
   checklists, hard breaks, bold/italic/underline/strike/code, safe links, preset
   and custom colors, alignment and RTL. Expect the reference appearance and
   working link/keyboard actions. Toggle a checklist, undo/redo, wait for Saved,
   reload and pan back: expect the chosen checked state to persist.
6. **Text activation:** double-click and Enter on writing/list blocks; type,
   select/format text, use slash conversion, IME and keyboard finish. Expect
   existing native controls/history and no unrelated rich preview replacement.
   Finish, undo/redo, save/reload: expect the current prepared content, not an old
   template. Change Text → Heading → List and back; expect correct classes/content.
7. **Mermaid:** enter a valid diagram, finish, open full preview and pan back after
   card eviction. Expect the prepared diagram/fullscreen controls and unique SVG
   IDs. Edit source, finish, undo/redo and switch theme: expect current source and
   correct colors. Try invalid source, then repair: expect an error and recovery,
   with no endless preparation loop. Warm unchanged diagrams must not recompile.
8. **Geometry:** select one/multiple blocks, drag, resize width and corner-scale,
   use snapping/guides/Alt bypass, arrangement and layers. Expect tight content
   height/borders, correct overlap, anchored corners and one logical history step.
   Add/delete/reorder/duplicate/paste; save/reload; expect no ghost or stale assets.
   At 1,000 objects, insertion/duplication must still reject excess content.
9. **Zoom:** Ctrl/Cmd-wheel around a recognizable word, touch pinch if available,
   and use toolbar/Fit/reset at 50/100/200%, including attempts beyond both limits.
   Expect the anchor to stay fixed, correct grid/handles/toolbars, sharp settled
   text/vector/PDF and no settle jump or blank surface. Inspect `.board-world`:
   zoom should remain steady within a gesture, scale vary, then scale return to 1.
   Compare original: its established layout zoom/range must remain available.
10. **Editor pinning:** start a long text/list or original linked Document edit,
    scroll/select/compose, pan it offscreen with Hand/Space and return. Expect the
    same live editing session, draft, selection and scroll; finish/save normally.
11. **Fallback parity:** on the smaller mixed Board edit table cells/rows/columns,
    code/language/copy, math, image crop/caption, audio/video and PDF pages/zoom/full
    preview. Edit a linked original Document and open its normal page. Expect
    native actions, sharp settled output, original ownership/save status and no
    new prepared approximation replacing these kinds. Remove a card: original
    Document/files must remain. Inactive tables must have no source CodeMirror.
12. **Visibility and cleanup:** while preparation is pending switch browser tabs,
    return, then navigate between Boards several times. Expect queued preparation
    to pause/resume, no stale visual attached to another Board, no accumulating
    detached scene caches, and no stuck preview. In-flight work may complete hidden.
13. **Layout/accessibility:** resize the window, enter/exit Board fullscreen, use
    narrow layout, reduced motion, Tab/Enter/Escape and text selection. Expect the
    existing app shell/toolbars, focus/actions and geometry to remain usable.
14. **Save/recovery/conflict:** on disposable content go offline, edit, verify
    Not saved and recovery download, reconnect/Retry and reload after Saved.
    Save from a second browser tab to trigger 409 in the stale first tab; confirm
    Load latest. Expect the existing complete draft, guards, original revision
    checks and confirmed replacement. Prepared assets must not bypass writes or
    silently resolve conflicts. Repeat the relevant checklist in the existing
    [persistence report](12-boards-performance-architecture.md).

## Exact performance comparison and result worksheet

1. Use the same production build and saved Board for both flags. Record OS/CPU,
   GPU, RAM, browser/version, refresh rate, DPR, viewport, power mode, thermal
   starting state, manifest hash and flags. Restore each engine's separate camera
   to the same landmark at 100%. Keep media paused and no unsaved edits initially.
2. For empty, 1,000 plain, mixed spread and dense scenes, record cold reload,
   initial readable/fully prepared readiness, ten-second foreground idle,
   ten-second new-region pan, ten-second warm return, and 100→50→100→200→100 zoom.
   Run each three times in alternating engine order; wait for settling between
   trials. Repeat a small real Document/PDF/media scene separately.
3. Inspect Performance Summary/Bottom-up, main/thread rendering tracks and frame
   intervals. Record sample counts, median/p95, long tasks (>50ms), style/layout,
   paint/raster and compositing evidence. Use Network for cold/warm fetch counts.
   Inspect DOM/memory before/after three identical traversals, after settling;
   distinguish JS heap, process memory and GPU/pixel estimates.
4. Measure CPU/power/temperature separately using browser/system process monitors
   and available hardware tools. Record scope/units. Frame cadence cannot supply
   these values. Compare actual rendering work rather than attributing all costs
   to React or using build time as a runtime benchmark.
5. For a **separate development attribution run**, use the existing Vite server.
   Set `sessionStorage.setItem('orbium.board.profile', 'true')`, reload with the
   chosen renderer, obtain a scope using `window.__ORBIUM_BOARD_PERF__.list()`.
   Use `snapshot(scope)` before/after a route, or `start(scope, 'pan-back')`,
   gesture ten seconds, `stop()` and `result()`. Full API instructions are in
   [the profiling protocol](../plans/board-performance-profiling.md).
6. Inspect `instantScene`, `preparedPreviews`, `workScheduler` and `cameraWork`.
   Expect prepared-text/diagram-init counters to stabilize on warm returns while
   presentation attachment/hit counts may rise. After preparation/settling expect
   pending/active work zero, timer false and stable camera-paint counts. The first
   preparation drain time is not full Board readiness; fallback surfaces are
   separate. Bytes are estimates. Cache lookups are not unique object counts.
   Initialization counters count starts/attempts, not delivered frames.
   `preparationMs` includes async waits; it is not main-thread CPU time.
7. Use React DevTools Profiler for actual card commits/mounts and editor isolation.
   Existing workspace commit counts are only parent effects. Diagnostic rAF
   captures alter idle behavior: stop capture when measuring absence of callback
   activity. Production diagnostics must stay absent even with the profile flag.

| Metric | Original production | Instant production |
|---|---|---|
| Initial readable / rich readiness | Pending manual recording | Pending manual recording |
| Cold / warm navigation latency | Pending | Pending |
| Frame interval median / p95 / sample count | Pending | Pending |
| Long tasks / style-layout / paint-raster / compositing | Pending | Pending |
| React commits / mounts (separate development run) | Pending | Pending |
| DOM count / requests / cache hits-misses / initialization | Pending | Pending |
| Repeated-navigation memory / foreground idle CPU | Pending | Pending |
| System power / temperature | Unmeasured | Unmeasured |

The p95 target near 16.7ms at 60Hz remains a target, not a result. No CPU or thermal
improvement is claimed. Save trace files with scene/engine/scenario/trial/build in
their names and retain raw trial totals before calculating comparisons.

## Known limits and review gate

- Cold arbitrary rich content is not instant. Caches are mounted-Board-local;
  reopening/reloading can prepare again. Evictions are deliberate and bounded.
- Template copies and SVG insertion still incur DOM/layout/paint costs. A single
  unusually large operation can exceed the preparation batch's soft time bound.
- Dense visible rich fallback content can still be expensive. No new global
  Document/PDF/media instance or decoded-image memory cap is delivered.
- Transient scaling may soften text during zoom; settled fidelity, cursor anchors,
  fullscreen, native editing and scrolling require the manual checks above.
- Byte/node budgets are not a browser heap/GPU guarantee. Original resource
  polling, players and animated application backgrounds remain.
- Browser functionality and frame/CPU/thermal acceptance are pending; static
  validation does not establish regression freedom or resolve the reported heat.

Suggested commit messages:

- `feat(boards): prototype reversible Instant Scene preparation and presentation`
- `perf(boards): add hybrid scene zoom and comparison diagnostics`
- `docs(boards): document Instant Scene budgets and manual profiling`

Next proposed milestone, after review: collect matching production traces, choose
the largest remaining rich preparation cost and design its reusable representation
and instance/memory budget. Do not start persistent caching, workers, tiling,
adaptive fidelity, full parity, migration or another product phase automatically.

## Default renderer review correction — 2026-10-23

The user requested that Instant Scene load directly on this experimental branch.
`board-renderer-mode.ts` now defaults to `instant`, including its server-side
fallback and unavailable/invalid browser storage. Explicit URL and valid session
overrides still select either engine, with URL precedence. Original remains
available through `?boardRenderer=original`; removing overrides returns to Instant
Scene. Existing mounted Boards select their renderer once, so save and refresh
after this change to activate the new default. No later milestone was started.

This correction changes the default only. It does not establish a CPU, frame-time
or temperature improvement. All prototype limits above still apply. Previous
uncommitted work was preserved; no commit or push was created.

Actual checks for this correction:

- Focused `vp fmt`: PASS.
- `npm run lint`: PASS; 687 formatted files, 579 linted files, no warnings/errors.
- `npm run types:check`: PASS, exit 0.
- `npm run build`: PASS, exit 0, 17.86s. Existing chunk-size, mixed-import and
  plugin-timing warnings remain.
- Updated production manifest SHA-256:
  `4f9fd470ff7f9e5f5603288b7c22d936693922d444995ce9012a88c6dc2ca532`.
- `git diff --check`: PASS. No PHP source changed; no automated tests or
  Playwright were written or run. Browser acceptance remains manual.

Manual checklist:

1. Save current work, open a normal Board URL without a renderer query/session
   override, and refresh. Expected: Instant Scene loads directly with 50–200%
   zoom. Optional Console confirmation:
   `document.querySelector('.board-canvas')?.dataset.boardRenderer` returns
   `"instant"`.
2. Pan away/back, edit a text or checklist block, finish, wait for Saved and
   reload. Expected: normal interactions and the saved content persist under
   the default Instant Scene adapter.
3. Open the same Board with `?boardRenderer=original`. Expected: original renderer
   and its 10–400% zoom. Remove the query and any explicit session override, then
   refresh: expected Instant Scene again.

Suggested commit:
`fix(boards): default to Instant Scene on the experimental branch`
