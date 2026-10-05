# Phase 5 review — predictive editor performance

Date: 2026-10-05. Remain in the current Phase 5 review. No later phase started; no commits created.

The [scroll preparation follow-up](05-mermaid-scroll-preparation.md) corrects shared scroll/typing pauses and separates cached/display work from local rendering. Timing and queue descriptions below record the initial performance pass; the follow-up records the current scheduling behavior.

## 1. Result and root causes

The blocking Mermaid import/preparation workflow has been removed. Editor usability no longer depends on finishing diagrams, remote preview lookup, or preview uploads. Mermaid preparation now uses a document-scoped predictive scheduler. The canonical editor JSON and portability format are unchanged.

Measured findings:

- The existing `test` document, node 58 in workspace 1, has 1,854 top-level blocks, 423 headings, 98 native code-language controls, 70 Mermaid views, and eight distinct Mermaid sources. Its PHP-encoded editor JSON is 879,950 bytes. This is substantially larger than the Markdown file size alone suggests.
- The opening/construction/mount path still produces an approximately one-second main-thread task. The native Mermaid NodeView experiment did not materially improve it and was discarded. The existing React controls remain; their preview work now uses the shared scheduler.
- Initialization of 2,000 unnormalized paragraphs generated later long tasks of 2,060 and 1,160 ms. Code inspection found an individual `setNodeMarkup` call for each block. Restoring a single initial replacement reduced the later normalization task to 535 ms. It remains expensive; the change does not promise entirely smooth initialization.
- Markdown parsing plus conversion of the generated stress fixture took a median 6.77 ms under Node. There is no evidence here to justify streaming parsing.
- Actual Mermaid render wall times vary substantially: simple sources mostly took tens of milliseconds, while sources in the existing document included 188–643 ms renders. One active render can still block interaction.
- Full client save payload construction took approximately 9–10 ms on the exact document copy. Request wall time was considerably larger. Serialization was not the dominant save cost in those samples.

Architectural findings, distinguished from measured timing:

- The old cache hook rendered missing sources in document order, awaited uploads, and exposed a full-screen blocking progress overlay.
- Initial page props included every saved SVG and an unnecessary workspace-wide mention list for ordinary documents.
- Saving separately validated the tree, extracted mentions, extracted attachments, extracted plain text, and discovered Mermaid sources for cleanup.
- Tiptap's installed suggestion implementation already supports debounce, abort signals, and rejection of stale results. Its installed `useEditor` implementation also defaults to avoiding React renders on every transaction. Broad memoization was not needed.

## 2. Changes implemented

| Change | Main files | Purpose and expected effect |
| --- | --- | --- |
| Remove import preparation overlay and hook | `document-editor.tsx`; delete `use-mermaid-cache-preparation.ts` | Content insertion does not wait for diagrams or uploads. No replacement blocking state. |
| Predictive preparation and bounded persistence | `mermaid-preview-session.ts`, `mermaid-preview-entry.ts`, `mermaid-viewport.ts`, `mermaid-cache-api.ts` | Reprioritize current/nearby content, reuse identical sources, yield between jobs, and avoid a burst of uploads. |
| Shared renderer warm-up | `mermaid-preview-renderer.ts` | Import and initialize once, after readiness; cache hits do not call local rendering. Suppress Mermaid's external error graphic and retain a recoverable node error. |
| Scheduler-backed existing controls | `mermaid-view.tsx`, `media-nodes.tsx` | Preserve Edit/Preview, source transactions, inherited drag/selection behavior, and React lifecycle. SVG children are updated through a dedicated DOM ref rather than putting SVG content into React state. |
| Lazy persisted preview endpoint | `DocumentController.php`, `MermaidPreviewCache.php`, `routes/web.php` | Retrieve one source hash within an authorized document; remove SVGs from opening props. |
| Lazy editor mentions | `DocumentController.php`, `editor-suggestions.ts` | Ordinary documents no longer receive workspace candidates. Suggestions debounce 180 ms and pass Tiptap's abort signal to fetch. Existing endpoint stays workspace-scoped, ancestor-checked, and limited to 50 results. |
| Preserve database property data | `DocumentController.php`, `pages/documents/show.tsx` | Database-document candidates, values, properties, and owned files remain available. Ordinary document openings skip the database-files query. Breadcrumbs and document headers remain essential data. |
| Adaptive autosave | `autosave-scheduling.ts`, `use-document-autosave.ts` | O(1) complexity signals choose 700/1,300/2,200 ms debounce; bounded idle scheduling; reuse the serialized payload for an unchanged failed snapshot/revision. |
| Consolidated inspection | `DocumentInspectionResult.php`, `EditorContentInspector.php`, `SaveDocument.php`, `MermaidPreviewCache.php` | One inspection pass validates and derives mentions, attachment IDs, plain text, and source hashes. Cleanup reuses hashes. Original extraction APIs remain available to existing callers. |
| Restore efficient initial direction normalization | `automatic-block-direction.ts` | One position-preserving initialization replacement, excluded from undo history. Existing incremental edits and descendant caches remain. |
| Readiness and opt-in profiling | `editor-performance-extension.ts`, `use-editor-readiness.ts`, `lib/editor-performance.ts`, loader/preview/import files | Separate module load, initial view creation, mounted content, initialized/editable readiness, Mermaid work, and save stages. Preserve the opening preview until an editor instance exists. |

No dependency, migration, document schema, block persistence system, worker, generic job framework, or virtualization was added. Existing native code views, incremental highlighting, lazy images, math proximity activation, search, and gutter code were retained.

### Library choices and rejected experiments

Reviewed the installed implementations and primary documentation for [Tiptap JavaScript NodeViews](https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views/javascript), [Mermaid's API](https://mermaid.js.org/config/usage.html), [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver), and [idle callbacks](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback).

- Existing Mermaid and DOMPurify remain the rendering and sanitization libraries. A browser-native scheduler fits this editor-specific workload without another dependency.
- Idle callbacks provide opportunities to yield, not preemption. Timeout/fallback scheduling is necessary; an active Mermaid render cannot be interrupted.
- Native Mermaid views were implemented as a temporary profiling variant, then removed. They produced 2,282.7 and 2,253.4 ms route-to-readiness samples, with 1,064 and 1,174 ms largest tasks. Baseline samples were 2,322.8 and 1,614.7 ms. This does not establish a useful opening improvement, so the existing React controls were retained.
- Generic list virtualization is not adopted. Continuous ProseMirror DOM is still required for selection, composition, tables, dragging, and search. The remaining mount task warrants a separate targeted investigation.
- The preview upload endpoint still scans saved content under the document lock. No persisted source index was added: correctness is retained, and these samples do not justify a schema/index project merely for disposable preview writes.

## 3. Mermaid architecture

```text
initialized, mounted, editable editor
              |
              +--> idle renderer import + initialization (shared promise)
              |
              +--> document-scoped scheduler
                       |
                       +--> visible: priority 0
                       +--> three viewport heights ahead: priority 1
                       +--> nearby behind current scroll direction: priority 2
                       +--> other sources: idle background priority 3
                                  |
                            memory result / in-flight entry
                                  |
                            lazy persisted SVG lookup
                               /              \
                             hit              miss
                              |                |
                         sanitize SVG      one local render
                              |                |
                              +-------+--------+
                                      |
                              prepared session result
                                      |
                      insert SVG for nearby subscribers
                                      |
                         persist asynchronously if needed
```

- One source entry serves identical diagrams. Registration occurs after view mounting; scheduling starts only after readiness. Successful results and in-flight lookups are reused within that editor.
- The observer covers three viewport heights in each direction. Among nearby diagrams, the direction of scrolling determines preference. Resize updates the window. Geometry reads concern pending nearby elements, rather than every document block on each scroll frame.
- Scroll handling uses an 80 ms recalculation throttle. Queue selection is recomputed at execution, so jumps do not leave the next render stuck behind an old ordered list. At most one local render runs; at most four cache lookups and two uploads are in flight.
- Jobs yield between renders, with an 80 ms gap. Noncritical preparation pauses for 140 ms after interaction. Composition, pointer selection, and dragging suspend preparation until their end events. Sources currently being edited are not rendered on each character.
- `requestIdleCallback` has timeouts; the fallback yields through timers. Autosave has its own maximum deadline. These mechanisms cannot prevent a long task already inside Mermaid.
- Distant previews are prepared in memory; SVG insertion is confined to the preparation window. Already inserted previews remain mounted when scrolling away. Cached sanitization and insertion also pass through the scheduler instead of running as a burst of fetch-completion callbacks.
- Each displayed SVG receives unique render IDs, allowing identical sources to share preparation without duplicate DOM IDs.
- A locally rendered diagram displays before its POST completes. An upload failure leaves the SVG visible, does not change document save status, and is eligible for retry after another successful document save or reopening.
- Source changes unregister the old subscriber. Stale completions cannot update an unmounted/replaced source. Destruction disconnects observers/listeners, cancels timers/idle work, aborts requests, and clears entries. The shared module promise retains no document cache. An active Mermaid render may finish, but its result is ignored after destruction.

### Endpoint and security

`GET /workspaces/{workspace}/documents/{node}/mermaid-previews/{sourceHash}?rendererVersion=mermaid-12.0.0-neutral-strict-v1`

Authentication, workspace ownership, document type, and live ancestors are checked through the existing document ownership path. Hash syntax is restricted to 64 lowercase hexadecimal characters; renderer version must match. Response is `{ "preview": null }` on a miss or `{ "preview": { "svg": ..., "renderId": ... } }` on a hit, with `private, no-store` headers.

The cache row is document-scoped evidence of source membership: upload validates the exact source against saved content under the document lock; saving deletes obsolete hashes under that same lock. Retrieval uses the exact document/version/hash key, so another document's cache is never exposed. Unknown or foreign-document hashes are indistinguishable misses. This relies on those existing write/cleanup invariants; any future writer bypassing `SaveDocument` must maintain them. Renderer-version validation remains intact. Browser display sanitizes persisted SVGs before insertion.

## 4. Opening pipeline

Before: response includes SVGs and ordinary-document candidates → opening preview → editor construction → import/cache preparation can show a blocking overlay and work in document order → user waits for preparation.

After: essential route content → opening preview → editor module and ProseMirror mount → initialized, editable editor → user can work → renderer warm-up and predictive preparation run independently.

There is one editable ProseMirror document. The read-only preview is removed when the editor exists. No hidden editor is created, and no overlay waits for all diagrams.

## 5. Measurements and limits

All browser figures used Chrome on local port 8000 with production frontend builds and opt-in profiling. No CPU/network throttling or controlled cache-disable setting was applied. Background activity and caching varied. There was no full DevTools flame graph, FPS trace, or heap-retention analysis. These small samples are diagnostics, not cross-hardware guarantees.

### Matched opening comparison: existing node 58

Both baseline and final marks wait for Tiptap initialization, connected editable DOM, and an animation frame. Baseline also checked the old blocking overlay. Zero is route content availability, not tile click, HTTP request start, or Network Finish.

| Stage | Baseline, two opens | Final, two opens |
| --- | --- | --- |
| Preview mounted after route content | 8.7 / 13.2 ms | 8.8 / 9.4 ms |
| Dynamic module import wall time | 134.1 / 138.5 ms | 128.2 / 279.2 ms |
| Editor interactive after route content | 2,322.8 / 1,614.7 ms | 1,723.2 / 1,505.5 ms |
| Largest recorded main-thread task | 1,058 / 1,050 ms | 1,148 / 1,067 ms |

The final samples are faster in readiness, but the largest task did not improve. The sample count and variance do not justify a large opening-speed claim. Main-thread construction/mount work remains unresolved. The native-view experiment likewise did not establish a useful gain.

In the first final open, `useEditor` initialization was marked at 2,235.9 ms from navigation start, Tiptap construction at 2,359.5 ms, first ProseMirror view availability at 2,466.9 ms, mounted content at 3,315.2 ms, and readiness at 3,771.1 ms. These are distinct lifecycle timestamps, not additive CPU durations. Route content became available at 2,047.9 ms. The browser API did not provide a separate server-response/asset-transfer benchmark.

### Other profiling evidence

| Work | Actual result | Interpretation |
| --- | --- | --- |
| Generated Markdown parse + conversion, Node, 20 runs | p50 6.77 ms; p95 12.20 ms; worst 21.51 ms | Whole-file parsing retained. This is not browser file-import timing. |
| Existing-document inspection, PHP, 100 runs | old p50 10.06 / p95 11.07 ms; new p50 5.58 / p95 5.81 ms | Same decoded content; excludes DB, request handling, and encoding. |
| Initial direction normalization, 2,000 paragraphs | old later tasks 2,060 / 1,160 ms; replacement task 535 ms | Restore the single initialization replacement; a substantial task remains. |
| Simple Mermaid sources, 60 completed renders sampled during investigation | p50 46.1 ms; p95 70.0 ms; worst 193.5 ms | Renderer wall time; no paired speedup claim. |
| Eight distinct sources in exact document copy | p50 198.7 ms; p95/worst 643.3 ms | Actual document sources, including cold diagram-type work. Not synchronous CPU duration alone. |
| Mermaid warm-up, final existing-document opens | 64.4 / 180.5 ms | Happens after readiness, independent of it. |
| Removed persisted preview property | 232,802 PHP-encoded JSON bytes for eight distinct previews | Property size, not measured compressed transfer bytes. Ordinary candidates added 2,446 bytes at the time of inspection. |
| Exact-copy save `toJSON` | 3.7 / 4.1 ms | Two explicit saves during probe/undo. |
| Exact-copy save `JSON.stringify` | 5.0 / 6.0 ms | One construction per snapshot/revision; retry can reuse it. |
| Exact-copy total payload construction | 9.1 / 10.3 ms | Includes profiling overhead. |
| Exact-copy fetch-to-headers | 684.1 / 894.0 ms | Includes request scheduling, network, middleware, and server work. |
| Controller validation/ownership stage | 34.48 / 33.04 ms | From local `Server-Timing`; excludes preceding middleware. |
| Server save action | 168.16 / 149.17 ms | Includes inspection, validation queries, DB write, mentions, and cleanup. |
| Response JSON consumption | 5.3 / 0.6 ms | Separate from fetch-to-headers. |

Large paragraph, code, Mermaid, and structural fixtures were opened during investigation. A 300-code-block fixture retained all 300 native language controls. Some intermediate fixture readiness marks predated the final stricter readiness hook, so they are not mixed into the matched opening table.

### Inspecting performance

Development builds expose `window.__ORBIUM_PERF__`. For a production-shaped profiling build, run `VITE_ORBIUM_PROFILE=true npm run build`, then hard reload. This is an explicit diagnostic build flag; normal `npm run build` disables profiling. A final normal production reload confirmed no profiler DOM output.

```js
window.__ORBIUM_PERF__.reset();
window.__ORBIUM_PERF__.snapshot();
console.table(window.__ORBIUM_PERF__.summary());
```

Marks include route availability, first opening-preview mount, import start/completion, `useEditor` initialization, initial ProseMirror view creation, EditorContent mount, and readiness. Samples separate parser/conversion/content insertion, renderer warm-up, lookup, render, sanitization, SVG insertion, queue wait, upload, serialization, payload construction, request, local server stages, response consumption, and long tasks. The recent sample buffer is capped at 500. No source text/SVG is recorded in measurements and production console logging is not added.

The interactive mark is emitted by `use-editor-readiness.ts` after Tiptap's creation lifecycle finishes, the ProseMirror DOM is connected, the editor is editable, and a browser animation frame runs. Initial direction setup belongs to that lifecycle. It does not await highlighting completion, images, math, mentions, or Mermaid. This availability mark is not a measured first-keystroke latency; successful typing was checked separately on the disposable exact copy.

## 6. TEST.md, fixtures, and data preservation

The raw supplied `TEST.md` file was not found in the repository. The existing saved `test` document was available and was measured separately; do not equate its stored JSON with a verified raw-file import benchmark.

A temporary `/tmp/orbium-stress.md` fixture contains 152,418 bytes, 6,600 lines, 423 headings, 336 fences, 630 table body rows, and 70 distinct Mermaid sources. Its converted JSON is 373,975 bytes. It is smaller than the approximately 163 KB requested reference but reproduces its major structural counts. No generated benchmark fixture/script was committed.

Disposable workspace-1 documents remain for manual review:

| Node | Fixture |
| --- | --- |
| 59 | 2,000 paragraphs |
| 60 | 300 code blocks |
| 61 | 70 distinct Mermaid sources |
| 62 | Converted structural Markdown fixture |
| 63 | Exact copy of the original saved document |
| 64 | Empty document reserved for import |

The browser extension rejected the file chooser (`Not allowed`). Actual browser file-read, parse-versus-conversion, and `setContent` import timings remain unmeasured. Instrumentation is present for the user's file-import run. Enable Chrome Extension “Allow access to file URLs” to use automated file choosing, or import manually through the system chooser.

A later mention probe landed in original node 58 because the application's active tab synchronized between Chrome windows. The probe was removed using the normal revision-checked save action only after auditing that it was the sole content difference. Full content hashing confirmed that original node 58 and disposable node 63 exactly match the pre-work snapshot. Original revision advanced from 10 to 14; it was not rolled back. This incident was disclosed during the work. The original tab was reloaded to the corrected revision. Use a single browser window for these local checks, or separate browser profiles when testing revision conflicts.

## 7. Validation

- `npm run types:check`: passed.
- `npm run lint`: passed; 222 files formatted correctly, 161 files linted without warnings/errors.
- Targeted `vp fmt` and Pint formatting: applied successfully.
- `./vendor/bin/pint --test`: passed.
- `npm run build`: passed; final normal production build completed in 5.33 seconds. Existing chunks above 500 kB still warn.
- Opt-in production profiling builds: passed.
- `php -l` on changed inspector/result/cache/controller files: passed.
- `php artisan route:list --path=mermaid-previews`: passed; authorized GET and existing POST registered.
- `git diff --check`: passed.
- New source files are below 500 lines; scheduler is 487 lines, editor 483, inspector 267.
- Automated tests were neither written nor run, following the repository's manual-validation instruction. Runtime profiling and interactive browser checks are not a substitute for the remaining acceptance checks.

Interactive checks performed: exact-copy typing, explicit save, undo and persisted-content comparison; 70-source preparation; sequential and backward scrolling; bottom jump and destination readiness; valid/invalid/recovered Mermaid with final React controls; cached reopening without local render; production profiling disabled. A large synthetic scroll gesture timed out in the browser API but its destination was subsequently inspected. No numeric scroll FPS or jump-to-diagram latency is claimed.

Not completed: file import in browser, full negative authorization matrix, offline/retry/conflict scenarios, all content/drag/IME regression cases, search-jump profiling, full flame graphs, or memory snapshots. Lazy mention debounce/cancellation is supported by inspected installed code and static checks; a clean end-to-end insertion check remains on the manual list.

## 8. Remaining bottlenecks

- A complete ProseMirror DOM still mounts, including tables, code controls, and React node views. Final opening still has a roughly one-second task. Moving Mermaid controls to native DOM was not an effective fix in the measured comparison.
- Initial direction normalization can still occupy a substantial task on unnormalized content, although thousands of separate steps are removed.
- Mermaid's active render can take hundreds of milliseconds. Scheduling avoids uninterrupted document-order preparation and yields to observed interaction, but cannot preempt the current render. Rapid jumps to unprepared sections may still show a temporary placeholder.
- Cached SVG sanitization/insertion and later layout still have costs. Three viewports is a starting window supported by the observed sequential-scroll checks, not an FPS guarantee on all content/devices.
- Full JSON serialization and full backend writes remain. Client serialization was small in these samples; request and server costs were larger. Cache uploads still validate against the full saved tree.
- Asset size, background appearance work, and layout/reflow need a full Performance trace before attributing every remaining task. There is no memory-leak benchmark; cleanup was inspected and navigation exercised.
- Active-tab synchronization between browser windows complicates concurrent-window manual testing. It was not redesigned in this performance pass.

## 9. Next architecture recommendation

First investigate the remaining construction/mount/initial-normalization task with a controlled Performance trace and the same fixtures. The native Mermaid experiment demonstrates why node-view rewrites should require evidence. Do not introduce generic ProseMirror virtualization on these results.

Stable block IDs, block-level PATCH/delta saves, and partial persistence remain future possibilities if repeated measurements show transfer/write costs dominating sustained editing. They require a dedicated design for revisions, undo, mentions/attachments, validation, export/import compatibility, and conflicts. The measured 9–10 ms client payload construction does not justify that architecture now. Nothing from that design was implemented.

## 10. Exact manual acceptance checklist

Use disposable node 63 for edits to the representative document; leave node 58 alone. Use only one Chrome window for ordinary checks. Wait for **Saved** before reloading unless deliberately testing the guard/failure path. Use separate browser profiles for conflicting-editor checks. Normal build: `npm run build`; profiling build: `VITE_ORBIUM_PROFILE=true npm run build`. Hard reload after changing builds.

1. **Opening:** open `/workspaces/1/documents/63` from workspace home, warm and with browser cache disabled. Expected: title/initial content before editor chunk finishes; one editable document; no preparation overlay. Click/type at the start immediately after readiness, wait for Saved, reload, and verify. Record tile-click-to-successful-input separately from route-to-readiness.
2. **Other document classes:** open nodes 59, 60, 61, and 62. Expected: all content available; 300 native code controls in node 60; highlighting progresses independently; no requirement for all diagrams to finish. Record long tasks through initialization, including direction normalization.
3. **File import:** open empty node 64 and import the actual `TEST.md`, or the temporary stress fixture. Expected: parse/conversion/content-insertion measurements; immediately usable content after insertion, with diagrams preparing independently. Type before all previews complete, save, reload, and check the text. No “34 of 70” blocking screen.
4. **Sequential Mermaid scrolling:** in node 61, scroll one viewport at a time down and back up. Expected: nearby diagrams generally prepared before arrival, unique SVG IDs, no repeated local render for identical sources. Record exceptions and actual render p95 when tuning the three-viewport window.
5. **Fast scrolling and jumps:** rapidly scroll, drag the scrollbar from top to bottom, then reverse. Use Ctrl/Cmd+F to search `Paragraph 69` in node 61 or distant text in node 63. Expected: destination diagrams take next priority after any active job; old distant jobs do not remain at the head of an ordered queue. Typing and selection remain usable.
6. **Mermaid source/editing:** create a new `/Mermaid` block, switch Edit/Preview, modify valid source, enter `this is invalid Mermaid`, then recover it. Expected: correct latest SVG or recoverable node error; source preserved; no external Mermaid error graphic. Undo/redo source changes from the editor, wait for Saved, and reload.
7. **Mermaid identity/lifecycle:** duplicate identical sources, change one copy, delete a copy, delete the last copy, undo/redo, and drag a diagram. Navigate away during preparation, then reopen. Expected: shared preparation with independent SVG IDs, correct selection/dragging, obsolete cache cleanup, no stale results in another document, and no leaked queue/listeners after destruction.
8. **Cache/network:** reopen node 61 with Network filtering `mermaid-previews`. Expected: no opening-response SVG property; one lookup per distinct source in a session; cache hits require no local render. Interrupt POST uploads while online editing remains possible. Expected: rendered diagrams stay visible and source saves remain independent. Reconnect/reopen to refill missing cache.
9. **Cache security:** replay a copied GET/POST logged out, in another account, and with a mismatched workspace/document. Expected: existing authentication/ownership rejection and no SVG leakage. Use an unknown hash in an owned document: clean null miss. Wrong renderer version: validation failure. Upload source absent from saved content: rejection; oversized SVG/source: rejection. Existing matching source/version: cache hit after successful upload.
10. **Core blocks/formatting:** in node 63 verify paragraphs, H1/H2/H3, bold/italic/strike, inline code, block code/highlighting/language/copy, quotes, bullets, ordered/nested lists, tasks, horizontal rules, and tables. Expected: source/structure survives save and reload; Markdown headings above H3 retain the existing importer behavior of clamping to H3.
11. **Media/math:** insert and edit inline/block math, images and file attachments. Resize/align/caption an image; reload. Expected: unchanged persistence, lazy image loading, existing math proximity behavior, valid rendering or recoverable errors, correct downloads and owned attachment validation.
12. **Editing interactions:** type at beginning/middle/end; select across blocks; use arrows, undo/redo, IME composition, block gutter/menu/add-below, drag/drop, and document search. Expected: correct caret, selection, matching, ordering, and no background preparation during active composition/selection/drag.
13. **Direction:** type English and Arabic/Hebrew in paragraphs, nested lists, quotes, and tables; try Auto/LTR/RTL. Expected: first strong-character inference, inherited empty-block direction, explicit modes, unchanged selection, and initial normalization excluded from undo. Reload older/un-normalized content and profile that path separately.
14. **Mentions:** type `@Perf`, change it rapidly to another query, close/reopen, and use arrows/Enter/Escape. Expected: delayed small workspace-scoped results; stale requests cannot replace new results; insertion and persisted mention links remain correct. Normal opening has no workspace-wide candidate payload.
15. **Database documents:** open an existing database child, edit mention/file/select and other properties, upload a file, save/reload. Expected: candidate lists, owned file references, properties/values, header and breadcrumb behavior remain intact.
16. **Adaptive autosave:** on small/medium/large content, type, stop, and inspect PUT timing. Expected: approximately 700/1,300/2,200 ms debounce plus bounded idle time. Continuously type beyond ten seconds: a latest snapshot starts saving within the scheduling deadline when no earlier request is active. Continue typing during an active request: later content saves afterward. Ctrl/Cmd+S bypasses pending debounce/idle delay.
17. **Persistence failures/conflicts/guard:** disconnect, edit, observe Save failed, reconnect and Retry/Ctrl+S; edit again during failure; navigate while unsaved/saving; hard reload only after Saved. In separate profiles, save competing revisions. Expected: latest-content retry, navigation blocked until saving completes, unload warning, and conflict rejection without overwrite.
18. **Production/profile/cleanup:** run normal build and reload; expected no `__ORBIUM_PERF__` output/production logging. Enable profiling, capture a Performance trace while typing/scrolling and jumping, and inspect the stage summary. Switch documents repeatedly and inspect heap/listeners if available. Expected: no previous-document previews, timers, listeners, or cache subscriptions surviving editor destruction.

## 11. Commit suggestions and stop gate

No commits created. Suggested logical groups:

- `perf(editor): prepare Mermaid predictively without blocking editing`
- `perf(editor): fetch diagram previews and mention candidates lazily`
- `perf(editor): schedule large document autosave with bounded idle work`
- `perf(server): consolidate document inspection and cache cleanup`
- `perf(editor): restore single-pass initial direction normalization`
- `perf(editor): instrument opening rendering and save stages`

Review shared-file hunks when staging these groups. Stop for manual review in Phase 5; do not start Phase 6.
