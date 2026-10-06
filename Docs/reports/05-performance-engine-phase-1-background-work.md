# Orbium Performance Engine — Phase 1, Task 3

Date: 2026-10-06. Tasks 1, 2, and 3A are accepted. This completes the remaining Task 3 implementation within product Phase 5 review. Phase 2 performance work has not started.

## Decision and evidence

**KEEP**, provisionally for manual acceptance. Source-level suspension and lifecycle checks are complete; actual Chrome CPU, long-task, listener, heap, typing, and scroll measurements remain **pending user measurement**. No measured performance improvement or proven absence of runtime leaks is claimed.

The starting working tree was clean. The implementation is one logical change: `perf(editor): suspend inactive editor background work`.

## Scope and library decision

Audited incremental highlighting, Mermaid session/NodeViews/shared render queue/cache/proximity/prediction, local document search and shared current-page search, Search Master boundaries, gutter/hover/drag/block menus, table controls, selection toolbar/text-color picker, slash/mention suggestions, math/image/file/callout/code NodeViews, editor readiness, autosave, activity subscriptions, native editor observation, global profiling, and split iframe activity.

Reviewed [React Activity](https://react.dev/reference/react/Activity), [Tiptap BubbleMenu](https://tiptap.dev/docs/editor/extensions/functionality/bubble-menu), and [ProseMirror PluginView lifecycle](https://prosemirror.net/docs/ref/#state.PluginView), alongside installed Tiptap/ProseMirror implementations. Activity removes hidden effects; applying it around the editor would require separating autosave and editor lifecycles. BubbleMenu's display predicate does not detach global listeners or stop its resize scheduling. ProseMirror provides lifecycle hooks but no Orbium activity semantics.

The existing controller and native scheduling were recommended, and the user was offered the library alternative. With no alternate selection received during implementation, used the scoped existing-controller solution consistent with the request to avoid dependencies. No package added or upgraded. It selectively pauses optional work; it is not an automatic suspension framework and does not propagate parent activity into iframes.

## Task 3A — KEEP

The accepted [background syntax-highlighting implementation](05-performance-engine-phase-1-background-highlighting.md), queue mapping, incremental invalidation, batch scheduling, decoration preservation, and diagnostics remain intact. `incremental-code-highlighting.ts` and `schedule-editor-idle-work.ts` are unchanged. All new consumers use the same stable controller identity. Changing activity booleans never enter the extensions or `useEditor` dependency arrays.

## Mermaid

- Session activity subscription now updates in a layout effect, using `active`, including an outgoing visible/inactive handoff.
- Extracted `MermaidSessionViewport`: inactive sessions disconnect their IntersectionObserver and all scroll/resize/pointer/editor interaction listeners. Warming timer/idle work is canceled, stale observer deliveries check generation and activity, and viewport callbacks have activity guards.
- Session deactivation cancels preparation, delayed viewport scheduling, preview-layout animation frames, and asynchronous resume work. Composition/drag transient flags reset so hiding mid-interaction cannot leave preparation permanently blocked.
- Resume runs through the existing idle scheduler. It reconnects proximity observation and resumes current work asynchronously. Nearby entries qualify for preparation; rank-three distant entries no longer render just because the nearby queue emptied. Returning to TEST does not synchronously drain its diagrams.
- Nearby observer callbacks use an element-to-entry map rather than scanning every source for every observed block. This avoids the previous nested scan when many observer entries arrive together.
- Shared render-chain callbacks check session activity and current entry immediately before invoking Mermaid. A queued inactive job is skipped and retained for later. The dependency-warming completion also checks eligibility before initializing Mermaid.
- An already-executing Mermaid render cannot be preempted. Its returned SVG is retained in memory while inactive; optional sanitation, dimensions, mounting, and new persistence work wait. Sanitation checks eligibility after its dynamic import. SVG is sanitized before any dimensions inspection, display, or cache write.
- Existing displayed SVGs, dimensions, reusable cache entries, and browser results are preserved. In-flight cache requests may finish; they do not start a hidden continuation chain. Document-save notifications still occur, but new optional preview persistence is activity-gated and retried when active. This does not gate document autosave.
- Preparation remains limited to four lookups, one local render, one cached preparation, and two cache writes per session. SVG mounting remains one copy per scheduled frame. No diagram memory eviction introduced.

Observer reconnection still visits registered elements, and ranking traverses pending entries. Those operations are asynchronous on resume but are not constant-time. Arbitrarily complex individual Mermaid calls can still exceed 50 ms; validate with the real TEST trace.

## Search

Extracted `useEditorSearch` from DocumentEditor. Local query/open state survives hiding. Local match-count refresh now debounces and updates when document content changes. Hidden local UI is not mounted; it cannot scan or steal focus.

URL `find` selection, local counting, shared page-finder counting, and page-finder next/previous actions are scheduled after 150 ms and check activity at execution. Pending timers cancel immediately through controller subscriptions and clean up on effect teardown. Reactivation only schedules relevant search; applied URL selections and finder steps are not replayed on every return. The existing weak document/query cache is retained. No search-decoration plugin exists here: matching uses cached text positions and user-requested selection.

Search Master workspace queries are unchanged. The shared page finder retains its existing route-based query reset; document-local query state is separate. Explicit local Enter navigation still computes immediately when needed for a visible result. Background document changes retain normal editor state processing without search scanning.

## UI helpers and previews

- Gutter reads activity from the controller. Hover callbacks recheck it before geometry; inactive cleanup cancels its frame and removes hover listeners. Hiding resets block menus/drag/drop/hover state and hides controls.
- Fixed the block-menu effect's missing `active` dependency, so outside-click/scroll/resize listeners actually clean up on deactivation.
- Table controls disconnect their ResizeObserver, editor update/selection subscriptions, and window scroll/resize listeners while inactive. Queued callbacks check current activity before DOM measurement. Last width styling remains for continuity; activation refreshes geometry.
- Selection toolbar has one stable ProseMirror plugin. `ActivityBubbleMenu` pauses the installed BubbleMenuView's floating UI listeners by destroying that optional view, and recreates only that view when active. It never unregisters the plugin on tab changes, recreates Tiptap, or replaces EditorState/history. Its per-view predicate invalidates old debounce callbacks so they cannot reshow a retired view. Upstream timer callbacks already scheduled can finish as bounded no-ops; no geometry runs while hidden.
- Text-color picker closes and removes document listeners when inactive.
- Slash/mention suggestions have explicit stable plugin keys and controller predicates. An open suggestion exits through a metadata-only transaction on deactivation, allowing the installed suggestion request manager to cancel debounce/fetch work. Renderer callbacks check activity before reading geometry; plugins remain registered. Suggestions work again on subsequent active input.
- Math proximity observers disconnect while inactive. KaTeX work moves out of React render into cancellable idle work, checks activity, and caches the last rendered source/output. Previously rendered output remains; unchanged math does not rerender on every activation. Inline-math outside-click listeners pause and its floating input hides while inactive. Existing activated math with a changed source resumes asynchronously.
- Image controls hide while inactive; resize sessions reset and handlers check activity. Native `loading="lazy"` and `decoding="async"` stay intact; no image unloading or resource interception. File and callout views have no generation/prediction scheduler to pause.

All optional processing uses `active`; no new `visible` exception was introduced. A visible/inactive handoff retains prior previews and table width while processing pauses.

## Observers, listeners, and lifecycle audit

| Owner | Hidden lifecycle | Destruction / finding |
| --- | --- | --- |
| Mermaid viewport | Observer and global/local listeners detached; timers canceled | Session destruction pauses viewport, aborts requests, clears entry maps |
| Table controls | ResizeObserver and scroll/resize/editor subscriptions detached | Effect cleanup paired with setup |
| Math activation | IntersectionObservers detached until active and relevant | Observer disconnected, stale callback guarded |
| Gutter/block menu | Hover frame canceled; listeners detached | Missing activity dependency fixed; transient state reset |
| Selection toolbar | Floating UI listeners detached; plugin retained | Controller subscription ends with plugin view; old callbacks invalidated |
| Text-color/inline-math picker | Document listeners detached | Cleanup owns exact callback references |
| Slash/mention | Debounced requests aborted for open suggestions | Installed request manager handles exit/destroy; controller subscription removed |
| Code NodeView | DOM-bound click/change listeners need no background computation | AbortController explicitly removes listeners on destroy; clipboard completion cannot create a post-destroy timer |
| Highlighting | Accepted Task 3A pause unchanged | Existing plugin unsubscribe/cancel unchanged |
| Autosave/retry/conflict/guards | Continue | Existing effect/router/window cleanup unchanged |
| ProseMirror native DOM observer/selection listener | Retained for editor correctness | Editor destruction owns cleanup; do not tamper with private DOM observer machinery |
| PerformanceObserver / scroll profiler | App-level, profiling builds only | One module instance per frame, not one per retained editor |
| Saved style runtime | Accepted global runtime | One shell runtime; not recreated per retained document |

Code inspection found unnecessary retained listeners, not proof of a monotonic listener leak. One concrete post-destroy timer race existed: code-block Copy awaited Clipboard before scheduling its status reset, so destroy could run first. A destroyed flag now prevents that continuation; DOM listeners also explicitly abort. Ordinary detached DOM listeners are not by themselves proof of a leak. The ~11,000 Phase 0 count may include native editor, React, node controls, and retained DOM; it must be observed with comparable content and garbage collection.

Subscriptions are consumer-owned and unsubscribe on plugin/effect destruction; controller disposal retains the accepted Task 3A behavior needed for Tiptap's delayed destruction/development replay. Search timer subscriptions also unsubscribe on execution or cancellation, rather than waiting for a subsequent render. Controller subscription diagnostics allow checking all consumers, including React external-store hooks. Counts legitimately differ with mounted math/image NodeViews and live search timers; they should stabilize for the same document content after settling.

## Autosave safety

`use-document-autosave.ts`, save scheduling, dirty guards, revisions, retry/conflict handling, close guards, and unload protection are unchanged. `onUpdate` still queues document snapshots irrespective of activity. Optional suggestion exits are metadata-only and do not create document changes. Hidden legitimate document transactions still apply and queue autosave. A queued/in-flight save can complete after immediate switching. Only optional Mermaid preview cache writes are postponed; document saves are never activity-gated.

## Split-pane and other limits

Independent iframe contexts still report local activity. Parent-hidden retained split groups receive no parent activity signal and may continue local optional work. No cross-frame protocol introduced. Benchmark ordinary tabs separately and inspect each frame's own diagnostics.

Cold mount, huge editable DOM/layout, warm-tab payload cost, autosave serialization, memory eviction, and virtualization remain deferred. Native image/network completions, in-flight cache requests, already-running synchronous rendering, correctness-required editor state work, and application-wide background effects are not preempted. A trace's whole-page CPU is not identical to hidden-editor CPU.

## Instrumentation

Existing `window.__ORBIUM_PERF__` infrastructure; development or `VITE_ORBIUM_PROFILE=true` only:

- `editor-activity.subscriptions`: current registered controller subscribers.
- `mermaid.pauses` / `mermaid.resumes`: cumulative changed session activity.
- `mermaid.active-jobs`: in-flight render requests, including a dependency/queue wait; not exclusively synchronous CPU execution.
- `mermaid.active-observers`: connected session IntersectionObservers.
- `editor-search.pending-jobs`: queued search timers.
- `editor-search.pauses`: cumulative editor deactivations (even if no query).
- `editor-ui.active-observers`: connected table-control ResizeObservers.
- `preview.active-observers`: connected math activation observers.
- `editor-search.scan` and `math.preview`: actual scan/render duration samples.

Retained all Task 3A counters and existing Mermaid/table timings. Gauges update only at lifecycle/scheduling boundaries; no new polling loop. Counters are per frame and `reset()` preserves them. Samples are bounded to 500, so saved Chrome traces remain the benchmark authority.

## Files changed

All source paths below are under `resources/js/components/editor/`:

- Mermaid: `mermaid-preview-session.ts`, new `mermaid-session-viewport.ts`, `mermaid-preview-renderer.ts`, `mermaid-preparation-priority.ts`, `use-editor-tab-activity.ts`.
- Search: new `use-editor-search.ts`, `document-editor.tsx`, `editor-controls.tsx`.
- UI: new `activity-bubble-menu.tsx`, `editor-block-gutter.tsx`, `table-controls.tsx`, `editor-suggestions.ts`, `text-color-picker.tsx`.
- Previews: new `use-math-preview.ts`, `use-preview-activation.ts`, `math-block-view.tsx`, `math-inline-view.tsx`, `image-view.tsx`, `media-nodes.tsx`.
- Lifecycle/diagnostics: `code-block-node-view.ts`, `editor-activity-controller.ts`.
- Documentation: this report and `Docs/phases/05-orbit.md`.

New source files are below 200 lines; modified source files remain below 500 lines. No backend, migrations, persistence-format, dependency, tab-navigation, or virtualization changes.

## Validation

- `npx vp fmt resources/js/components/editor`: PASS; 66 source files checked/formatted. Final touched source files were formatted again after lifecycle review. Markdown paths passed to the formatter are not supported source inputs; report whitespace was checked separately.
- `npm run types:check`: PASS on final source tree.
- `npm run lint`: PASS; 268 files correctly formatted, 204 linted, zero warnings/errors.
- `./vendor/bin/pint --test`: PASS.
- `npm run build`: PASS; final production build completed in 7.85 seconds. Existing >500 kB chunk and ineffective dynamic-import warnings remain.
- `git diff --check`: PASS; new source/report files also checked for whitespace.
- Automated tests: neither written nor run, per user instructions.
- Browser functional checks and performance benchmarks: not executed; exact user procedures follow. All new numerical runtime results remain pending.

## Exact manual functional checklist

Use disposable documents for edits. Hard reload to load new assets, use the same TEST content, and wait for Saved before refreshing except for deliberate guard checks.

1. Open TEST and a small document, previsit both. Store `window.testEditor = document.querySelector('[data-editor-activity-active="true"] .tiptap').editor` while TEST is active in a profiling build. Place caret/selection, scroll, type a marker, then switch away/back. Expected: same editor object, `isDestroyed === false`, scroll/selection and undo/redo preserved; construction marks do not repeat on warm switching.
2. Open a local finder using the editor Search button, type a query, press Enter/Shift+Enter, edit matching text, and wait 150 ms. Hide TEST with the finder open; use the shared page finder in the small document. Return. Expected: only active document scans/selects; local query preserved and count refreshes asynchronously; no old shared step repeats solely on activation. Close finder: no further search timers. Use Ctrl+Space: global Search Master still searches workspace content. Open a result with `find`: active destination selects it asynchronously.
3. Switch away before code coloring and diagrams complete. While hidden, scroll/type in the small document. Return without editing TEST. Expected: highlighting resumes asynchronously; already-rendered SVGs stay reusable; nearby diagrams resume and distant diagrams wait until approached. Revisit cached diagrams, duplicate a source, edit one copy, switch Edit/Preview, and delete/undo. Correct unique SVGs and latest source. An invalid diagram finishing while hidden shows its error on return/approach.
4. Select a table cell, hover the gutter, open block/text-color/slash/mention controls, and switch away in each case. Expected: no hidden portals or geometry; counts settle with one table observer, one Mermaid observer per started active editor, and only unactivated active math observers. Return: table add-row/column, hover, drag/drop, selection formatting/color, slash, and mention work. Slow Network during mention requests: switching cancels pending suggestion work without an old menu appearing in the destination.
5. Scroll to block/inline math, edit valid/invalid source, and switch while preview work is pending. Expected: cached output remains, active preview updates after idle work, hidden math does not render; inline popover does not overlay the destination. Select, resize/align/caption an image; switch mid-resize and return. Expected: resize state resets without an unintended save; image loading remains lazy, saved attributes persist. File download still works.
6. Throttle Network, type a unique marker and switch immediately to a previsited small document, then repeat with an unvisited destination. Expected: outgoing editor pauses even during `active=false, visible=true`, autosave completes, returning/reloading after Saved preserves markers. Go offline, edit/hide, try closing dirty tab and reload (cancel warning). Reconnect, Retry, wait for Saved, reload. Expected: no lost edits; close/unload guards remain. Check a competing revision in another profile: existing conflict protection.
7. After Saved close inactive TEST, let deferred destruction settle, then reopen/close three times. Expected: controller/highlighting/subscription/observer gauges rise only for actual new retained owners and fall on destruction; no callbacks from destroyed owners, negative gauges, or stale preview result. Clear `window.testEditor` before heap comparison; Console references retain objects. Repeat development effect replay if Strict Mode is enabled.
8. Open splits and inspect each iframe Console. Expected: editing/saving and local previews work. Hide parent group: documented local-activity limitation may remain. End split after Saved: fresh standalone state, no extra stale writer.

## Controlled Chrome DevTools benchmark for final Phase 1 acceptance

Compare the accepted **Task 3A revision** against this Task 3 revision. Use separate checkouts/build assets if comparing both. Build with `VITE_ORBIUM_PROFILE=true npm run build`, serve using the normal Orbium server, and ensure Vite dev assets are not overriding production assets. Also sanity-check an ordinary production build afterward. Keep Chrome/device, TEST content/cache warmth, appearance/background, viewport, extensions, power mode, and CPU throttling identical. Prefer no CPU throttling for the primary run; record any fixed slowdown as a separate experiment. Do not mix cold-cache baseline with warmed after results.

Open DevTools → More tools → Performance monitor; enable CPU, JS heap, DOM nodes, and JS event listeners. In Performance enable Memory. Let content/save/initial jobs settle. Record each case three times and save traces as `phase1-before-A-1` / `phase1-after-A-1` etc. Run Console snapshots **outside** the ten-second measured interval:

```js
window.__ORBIUM_PERF__.snapshot().counters
window.__ORBIUM_PERF__.summary()
Array.from(document.querySelectorAll('[data-editor-activity-active]'), element => ({
  active: element.dataset.editorActivityActive,
  visible: element.dataset.editorActivityVisible,
}))
```

Use `window.__ORBIUM_PERF__.reset()` before each recording after saving any needed sample output. It resets samples/marks, not counters. Record counter values at both boundaries. Do not install console polling or scan all DOM listeners during a trace.

1. **A — active TEST idle:** with TEST active and untouched after settling, record exactly ten seconds. Select that ten-second interval; read Summary scripting/rendering/painting/idle totals, inspect Main long tasks and Bottom-up/Call tree. Note recurring Mermaid/highlighting/search/geometry/preview jobs, CPU, and tasks above 50 ms. Record legitimate active preview preparation separately from fully settled idle.
2. **B — hidden TEST idle:** previsit a code/diagram/math-free small document. Leave a local query open in TEST for one run, closed for another. Switch to the small document, wait for pending saves/in-flight work to finish, then record ten seconds. Verify TEST wrapper is inactive. Expected: no hidden TEST highlighting, Mermaid ranking/rendering/preparation, local scans, table/gutter/floating geometry, or math preview work. Hidden processed-block count stays fixed; no hidden recurring >50 ms optional editor task. Active small-document table/geometry and global application/browser work can still appear. Compare CPU/main-thread busy totals with A and attribute call stacks rather than declaring every page task a hidden editor task.
3. **C — five retained editors:** open/previsit roughly five documents including TEST, leave the same small document active, settle, record ten seconds. Expected: one active controller in the top frame; editor-owned observer counts track active owners, not five hidden sets. Compare idle CPU/busy time against a separate small-document-only run and B. Five retained editors should add no recurring optional idle work; report actual differences and noise.
4. **D — switching/lifecycle:** after all five documents settle, note controller/subscription/observer/scheduler gauges plus Performance monitor listeners/heap. Record 20 alternating A→B switches (ten round trips) without editing. Finish on the same tab and wait five seconds. Note counts again. Expected: controller count unchanged, settled subscription/observer/scheduler gauges return to the same values, no monotonic listener growth. Repeat 20 times editing one existing paragraph per cycle, then wait Saved/settled. Use Memory → Collect garbage before comparable heap snapshots; don't force GC during idle traces. Account for undo history and newly added NodeViews. Then close saved tabs, settle, collect garbage, and compare retained paths if counts do not decline. Inspect global listener owners with DevTools `getEventListeners(window)` / `getEventListeners(document)` only outside recordings. Compare named Orbium callbacks; aggregate listeners alone cannot prove a leak.
5. **E — typing:** use a disposable TEST copy with the same paragraph, text sequence, pace and background as Phase 0. Record typing about 108 input events; keep document-local search closed unless it was open in the baseline. In Main inspect `Event: input` handler durations, use the same duration definition as the baseline, export trace, calculate median/p95/max and number above 16 ms. Do not substitute INP or keydown latency for input-handler durations. Phase 0: median ≈14.7 ms, p95 ≈28.2 ms, max ≈76.6 ms, 45/108 >16 ms. Save final content and verify undo/reload. Report new numbers even if unchanged/worse; Task 3 is not a full typing redesign.
6. **F — scrolling:** repeat the Phase 0 path, distance, speed, appearance and viewport in TEST; record ten seconds of continuous scrolling. Select interval and calculate busy percentage from non-overlapping main-thread work relative to interval, not summed nested call frames. Note DOM nodes, style/layout/paint time, long tasks, and existing `scroll.*` samples. Phase 0: main-thread busy ≈53.8%, DOM nodes ≈47k+. Compare the same path with hidden TEST while scrolling the small document to isolate background interference. No virtualization-level reduction is expected.

| Case | Baseline | After | Acceptance evidence |
| --- | --- | --- | --- |
| A active idle CPU / busy / >50 ms tasks | Pending | Pending | Saved ten-second traces |
| B hidden TEST optional CPU / jobs | Pending | Pending | Near zero attributable optional work after settling |
| C five retained versus one CPU | Pending | Pending | No substantial recurring idle overhead |
| D listeners / subscriptions / observers / heap | Pending | Pending | Stable same-state counts after 20 switches; cleanup after close |
| E input median / p95 / max / >16 ms | 14.7 / 28.2 / 76.6 ms; 45/108 | Pending | Same event-duration definition |
| F scrolling busy / DOM nodes | 53.8%; ~47k+ | Pending | Same scroll path and settings |

**Stop gate:** present this Task 3 change for manual review. Do not begin Performance Engine Phase 2, virtualization, navigation changes, or Hot/Warm/Cold lifecycle.
