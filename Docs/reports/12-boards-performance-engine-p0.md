# Board performance engine P0 — diagnostics and profiling handoff

Historical P0 report: the later user instruction authorizes the architecture without
waiting for recordings. See [the current implementation report](12-boards-performance-architecture.md).
Its manual expectations supersede the old inactive-table source-view counts below.

Date: 2026-10-21. Scope: the existing Boards phase-4 manual-review correction.

## Outcome and stop gate

The user requested implementation of the optimization plan. Its immediate handoff
explicitly says **“Start P0 only”** and requires manual measurements before later
refactoring. P0 diagnostic tooling and the reproducible manual protocol are
implemented. Actual browser measurements and attribution remain pending user
execution. P0 performance acceptance is therefore **pending**; no CPU, temperature,
frame-rate or input-latency improvement is claimed.

Read the [profiling protocol](../plans/board-performance-profiling.md) for scene
preparation, exact browser actions, console commands and the results worksheet.
Do not begin P1 record isolation or subsequent tasks before results and approval.

## Implemented

- A development-only, session-opt-in console API:
  `window.__ORBIUM_BOARD_PERF__`. It lazy-loads after a Board mounts only if
  `sessionStorage['orbium.board.profile']` is `true`. Normal development and
  production do not start its observers, scans, timers or sampling.
- On-demand counts by object kind, including typed PDF/video/audio: total,
  actual viewport overlap, overscan-region overlap, mounted, retained outside
  overscan, pinned active editors outside overscan and visible unmounted objects.
  Counts use canonical geometry and actual mounted object DOM; they do not
  collect content or persistent identifiers.
- On-demand Board/page DOM counts, CodeMirror and hidden table source views,
  editable native views, linked Document editors/previews, PDF readers, Mermaid
  surfaces/SVG, tables, SVG, canvases and canvas pixel totals. These are DOM
  indicators, not an exact registry of internal renderer sessions/jobs or memory.
- Explicit ten-second manual capture workflow, with a 30-second automatic cap,
  bounded rAF/long-task samples, median/p95/max/count summaries and dropped-sample
  reporting. Window-wide long tasks and diagnostic frame callback intervals are
  labeled separately from actual Board CPU and presented FPS.
- Start/end User Timing marks, one duration measure per scope/scenario and
  observed BoardWorkspace effect-commit counts. Per-card render attribution and
  mount detection remain React Profiler work; parent commit count cannot prove
  that unrelated cards are isolated.
- Stop/hidden-page/pagehide/unmount cleanup, single active capture, one retained
  result and anonymous per-mount scope names. Removing the last Board clears
  its API, results and Board User Timing entries. Optional module-load failure
  does not interfere with editing.
- A manual production-build protocol covering 10/100/500/1,000-object text/mixed
  scenes, idle/cold/warm/pan/zoom/drag/resize/typing/table/Document/PDF scenarios,
  three repeat trials, DevTools stack attribution, React commits, network/save
  payloads, SQL metrics where available, memory and hardware/thermal controls.
- Updated plan/handoff status to distinguish implemented P0 tooling from pending
  measurement and unstarted P1–P5 work.

## Cost attribution: source candidates, not measured top three

No Performance traces or React profiles were supplied or recorded in this task.
The following source mechanisms are confirmed, but their relative cost and their
relationship to the reported thermal spikes are **unmeasured**. Row order is not
a performance ranking.

| Candidate | Confirmed source mechanism | Evidence needed to attribute cost |
|---|---|---|
| One-object editing and collection publication | `use-board-block-editing.ts` maps the collection; `use-board-objects.ts` validates/commits and publishes a full array. `board-canvas.tsx` owns the rendered object mapping. | Production typing trace plus React Profiler counts/cost of edited and unrelated cards, across increasing scene sizes. Mapping alone does not prove heavy child rerenders. |
| Rich surface construction and lifecycle | `board-table-block.tsx` creates hidden CodeMirror/Mermaid/table machinery on mount. `board-document-preview.tsx` constructs full rich content; source caching does not retain evicted DOM. | New/return-pan and cold-open stacks, mount phases, hidden table view/DOM counts and source request counts. Separate fetch waiting, synchronous rich construction, async Mermaid/PDF jobs and browser layout/raster. |
| Full-snapshot persistence | `board-api.ts` validates/serializes a full snapshot; `board-recovery.ts` serializes into sessionStorage. `SaveBoard.php` validates the snapshot and deletes/upserts rows under a revision transaction. | Save/recovery CPU stacks, payload bytes and HTTP timings; backend SQL count/time if available. A long HTTP request is not proof of SQL or render cost. |

The actual top-three table in the protocol is intentionally pending. Current
overscan, guard bounds, retention/cache budgets and optimized pointer/camera
painting remain as specified in the plan; no new speculative tuning is introduced.

## Persistence and compatibility

No migrations, dependencies, public endpoints, recovery-key changes, schema,
ownership or format changes. Board snapshot format remains 4 and native content
format remains 1. Save/conflict/recovery, history and active-editor behavior use
the existing implementation. No state, spatial-index or renderer refactor is part
of this task.

## Checks

Final results are recorded below after the last implementation changes.

- Focused source formatting: PASS.
- `npm run types:check`: PASS, exit 0.
- `npm run lint`: PASS, exit 0; all 671 checked files correctly formatted,
  no warnings or lint errors in 563 linted files.
- `npm run build`: PASS, exit 0; final build completed in 15.18 seconds.
  Existing warnings remain for chunks above 500 kB and mixed static/dynamic imports
  of `document-image-crop-dialog`, `database-property-header` and
  `document-editor-loader`. These are build warnings, not runtime measurements.
- Production asset inspection: PASS; no Board diagnostic module entry in the
  generated manifest and no diagnostic API/flag/capture-marker strings in its
  referenced production scripts. The preceding build also had no such references.
- `git diff --check`: PASS. An introduced Markdown trailing space was corrected
  during verification; no source/type/lint failures remained.
- No automated tests were written or run, as required by the root/user instructions.
- PHP formatting/syntax and migration checks are not applicable; no PHP or
  migration files changed.
- Browser/manual profiling, real render attribution and thermal acceptance:
  pending user execution. Static checks cannot establish those outcomes.

## Exact manual acceptance checklist

Use the detailed protocol for commands; all data should be disposable.

1. **Default off:** open a Board with `npm run dev` and no session opt-in. Check
   `window.__ORBIUM_BOARD_PERF__`. Expected: undefined; normal Board UI works and
   no Board diagnostic chunk is requested. Existing editor diagnostics are separate.
2. **Opt-in and scene counts:** set `orbium.board.profile` to `true` in sessionStorage,
   reload, call `list()`, then `snapshot(scope)` for a ten-object scene. Expected:
   correct totals/kinds, zoom/DPR/viewport, and actual mounted DOM counts. A table
   contributes a hidden CodeMirror source view; a loaded PDF contributes reader/
   canvas indicators. No document text, title or stored object/Board ID appears.
3. **Viewport versus retention:** save, pan a short distance away/back, then beyond
   retention and back; sample after each gesture settles. Expected: viewport and
   overscan counts differ, recent offscreen surfaces are counted independently,
   and longer traversal can evict them. A hosted editor panned outside coverage
   stays mounted and is counted as pinned; it preserves draft and selection.
4. **Capture:** call `start(scope, 'pan-back')`, perform ten seconds of pan and
   call `stop()`, then `result()`. Expected: scenario, start/end snapshots,
   commit count, interval summaries, long-task capability/results and dropped
   counts. Performance's Timings track contains matching `orbium:board:p0:` marks.
   A second simultaneous `start()` or invalid scenario is rejected clearly.
5. **Bounded lifecycle:** start and leave idle for 30 seconds. Repeat with a hidden
   browser tab, then navigate cleanly away during another capture. Expected:
   timeout/hidden termination, no continuing sampler after stop and no error from
   Board unmount. Leaving the last Board removes the global API/result/marks.
   Save any desired result before leaving. Do not treat interrupted runs as valid.
6. **Disable/production isolation:** remove the session flag and reload development;
   then use production frontend assets and set the flag again. Expected: API
   undefined in both cases, production scripts from `/build/assets/`, no Board
   diagnostic module requested. Flagging production never enables diagnostics.
7. **Record baseline:** prepare all eight text/mixed scenes, then follow the
   production protocol for idle/open/pan/zoom/drag/resize/typing/table/Document/PDF.
   Expected: three repeatable traces per scenario, matching scene/build metadata,
   measured network/save costs and a completed top-three attribution table. Record
   missing facilities as unavailable. No specific performance gain is assumed.
8. **Editing and interaction smoke check:** type/select/format, use IME, edit a
   table and linked original Document, group-drag with guides/Alt, resize/scale,
   undo/redo and save/reload. Exercise PDF/media controls at 50/100/200%, fullscreen,
   narrow viewport, keyboard focus and reduced motion. Expected: existing content,
   geometry, focus, editor pinning and sharp settled rendering remain correct.
9. **Failure protection:** on a disposable Board, go offline, edit, retry online,
   then exercise the dirty-leave guard and a stale-revision conflict using a second
   browser tab. Reload a pending session draft. Expected: edits remain recoverable,
   Saved survives reload, a stale write shows conflict controls and never silently
   overwrites the newer Board. Diagnostics do not add content writes.

## Commits and suggestion

No commits created. Suggested single logical commit:

`chore(boards): add P0 performance diagnostics and profiling guide`

Stop at this handoff for manual measurements/review; do not start P1 yet.
