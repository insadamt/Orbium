# Orbium Performance Engine — Phase 1, Task 3A

Date: 2026-10-06. Tasks 1 and 2 are user-accepted. Scope: incremental syntax-highlighting activity suspension only, within the ongoing product Phase 5 review. Task 3B has not started.

## Before

The application retains visited document editors. The custom Lowlight plugin queued initial/changed code blocks and kept scheduling idle batches until its queue emptied, irrespective of editor activity. A hidden retained document could therefore continue highlighting and dispatching decoration-only transactions while another document was being used.

Selection-only transactions already reused decorations. Changed-range invalidation, mapped decorations, fragment/language caching, and incremental batching already existed and remain intact.

## Change

`DocumentEditor` initializes its existing tab activity adapter before building extensions and passes the stable `EditorActivityController` into `IncrementalCodeBlockLowlight.configure`. Only the controller identity enters the memo dependencies; active/visible booleans do not. Activity transitions do not recreate extensions, plugins, editor state, or Tiptap.

The plugin synchronously reads `getSnapshot().active` before scheduling and before executing highlighting. It uses active rather than visible, including outgoing visible/inactive handoffs. Initial controller activity governs cold opening; active editors immediately schedule their existing pending queue. An extension without a controller retains its previous always-active behavior.

Scheduling remains `scheduleEditorIdleWork`: `requestIdleCallback` with a 250 ms timeout, or a 16 ms timer fallback. Batches remain capped at 16 blocks with a six-millisecond cooperative budget checked between blocks. Reactivation schedules asynchronous work; it does not synchronously drain the queue.

No dependency, content-format, autosave, history, revision, selection, language-selection, navigation, or Mermaid scheduling changes were introduced. Completed batches still dispatch only non-history decoration metadata.

## Library decision

Reviewed the existing [Tiptap CodeBlock Lowlight integration](https://tiptap.dev/docs/editor/extensions/nodes/code-block-lowlight) and [ProseMirror PluginView lifecycle](https://prosemirror.net/docs/ref/#state.PluginView), alongside installed source. Existing libraries provide highlighting and view update/destruction hooks, but the installed Lowlight plugin does not implement Orbium's editor activity contract. Its whole-document behavior was already replaced by the incremental plugin.

Retained the application-owned incremental scheduler and existing Lowlight engine, following the request to add no dependencies. Another highlighting engine or scheduling library would still require controller integration and lifecycle ownership. The inherited `lowlight$` plugin-key filtering remains an integration point to revisit on Tiptap upgrades. A single huge code block still performs synchronous Lowlight work; cooperative batching cannot interrupt that call.

## Lifecycle

Each plugin view subscribes once to its controller. Activity-only transitions publish no editor transaction. Inactivity cancels the pending callback and retains plugin state, pending block nodes/positions, caches, and current decorations. Existing document transactions still invalidate/map/enqueue while inactive, but view updates cannot schedule highlighting then. Reactivation resumes the current queue without requiring an edit.

On destruction the plugin unsubscribes, cancels scheduled work, clears its unsubscribe handle, and releases its mutable view/controller references. Cleanup is idempotent. A canceled callback cannot process the destroyed view.

The controller's `dispose()` still releases mounted activity gauges, but no longer clears consumer subscriptions. Consumers own their unsubscribe cleanup. This small supporting correction is necessary because installed Tiptap deliberately defers destruction and can preserve its editor through React development effect replay; clearing subscriptions during the adapter's layout cleanup would silently disconnect a surviving plugin. Mermaid's existing effect and the React external-store hook already own their unsubscribe cleanup. Plugin destruction now removes its own activity subscription and updates the matching gauge.

## Race handling

- **Scheduled then inactive:** cancellation invalidates the scheduled-work identity before canceling its idle/timer handle. A callback delivered despite cancellation returns without processing or rescheduling. The execution boundary also checks current activity.
- **Document change while inactive:** normal plugin state application retains changed-range invalidation and queue mapping. Scheduling remains blocked until activation, when the current queue is read.
- **Rapid inactive/active/inactive:** each scheduling request checks for an existing job. Each callback must match the current job identity before clearing it, preventing an old canceled callback from consuming a newer job. A batch's transaction can trigger plugin `update`; the following explicit scheduling call sees that job and cannot duplicate it.
- **Destruction while pending:** destruction marks the view destroyed before unsubscribing/canceling. Canceled identities and the destroyed flag prevent work afterward.
- **Visibility-only changes:** ignored for pause/resume; only changes in active state affect scheduling.

Browser JavaScript runs these callbacks and activity notifications on the main thread. A tab switch cannot interrupt an already-running synchronous Lowlight call; cancellation takes effect when the activity notification executes.

## Split panes

Each iframe retains its existing local controller and pane activity semantics. No cross-frame coordination was added. Counters and timing samples are local to each frame.

> Hidden retained split-group iframes may still perform highlighting because parent-to-iframe background activity propagation is not yet implemented.

## Instrumentation

Existing Orbium profiling exposes:

| Diagnostic | Meaning |
| --- | --- |
| `code-highlight.active-schedulers` | Number of pending idle/timer callbacks in this frame; each editor has at most one. Decremented on callback entry or cancellation. |
| `code-highlight.activity-subscriptions` | Current highlighting plugin activity subscriptions; one per configured live plugin view, zero after destruction. |
| `code-highlight.pauses` | Cumulative active-to-inactive transitions, including transitions with an empty queue. |
| `code-highlight.resumes` | Cumulative inactive-to-active transitions, including transitions with an empty queue. |
| `code-highlight.processed-blocks` | Cumulative queue entries processed, aggregated once per batch; cached blocks also count. |
| `code-highlight.batch` | One duration sample/User Timing measure per executed batch, including decoration publication. |

Counters use `adjustEditorPerformanceCounter`; timing uses `measureEditorWork`. No per-block diagnostic event or separate publication infrastructure was added. Profiling is enabled in development or with `VITE_ORBIUM_PROFILE=true`; ordinary production skips diagnostics. Existing performance reset preserves counters, so compare snapshots/deltas instead of expecting zero cumulative counts after reset. The scheduler gauge counts pending callbacks, not an executing synchronous batch.

## Files changed

- `resources/js/components/editor/incremental-code-highlighting.ts`: typed controller option, one subscription, guarded scheduling/cancellation/resume, cleanup, batch diagnostics; 321 lines.
- `resources/js/components/editor/document-editor.tsx`: earlier activity adapter initialization and stable controller configuration; narrow wiring change in an existing approximately 500-line file.
- `resources/js/components/editor/editor-activity-controller.ts`: consumer-owned unsubscribe across effect replay.
- `Docs/phases/05-orbit.md`: current review status/link.
- This report.

## Validation

- `npx vp fmt resources/js/components/editor/incremental-code-highlighting.ts resources/js/components/editor/document-editor.tsx resources/js/components/editor/editor-activity-controller.ts`: PASS, three files.
- `npm run types:check`: PASS.
- `npm run lint`: PASS; all 264 configured files formatted, 200 linted files, no warnings/errors.
- `./vendor/bin/pint --test`: PASS (PHP formatting check, not an automated test suite).
- `npm run build`: PASS in 7.28 seconds. Existing >500 kB chunk warnings and ineffective dynamic imports remain for document image crop, media menu, database property header, and editor loader.
- `git diff --check`: PASS. New report checked with `git diff --no-index --check /dev/null Docs/reports/05-performance-engine-phase-1-background-highlighting.md`: no whitespace diagnostics (exit 1 denotes the new-file difference).
- Automated tests: neither written nor run, per user instructions.
- Browser/manual validation: pending user execution. No CPU savings or latency improvement has been measured.

## Manual benchmark and acceptance checklist

Use the same Chrome version/device, document content, background appearance, viewport, and CPU throttling for before/after recordings. Use the accepted Task 2 revision in a separate checkout for the baseline and this change for the after run. Keep the two sets of assets separate. Build both with `VITE_ORBIUM_PROFILE=true npm run build` and serve production assets through the usual Orbium server. Ensure a running Vite development server is not overriding production assets. This implementation's normal production build was validated without the profiling flag; profiling-build comparison remains manual.

Use `TEST`, preferably a disposable copy if editing. Previsit a small document A containing no code blocks so its highlighting cannot confuse aggregate counts. Avoid split groups during the main comparison. Save all edits before reload/close except when intentionally testing guards.

1. **Capture the baseline:** open DevTools → Performance, choose a fixed CPU slowdown (for example 6×) and keep it identical for both runs. Start recording, hard reload, open `TEST`, and switch immediately to the already-visited A while code coloring is still progressing. Leave A idle for five seconds, return to `TEST`, wait for coloring, then stop and save the trace. Select the hidden interval in Main and inspect Bottom-up/Call tree for repeated idle callbacks and Lowlight/highlight/decoration work. The baseline has no new highlighting counters or batch measures; identify it by its call stacks. If all code colors finished before switching, repeat with greater throttling or more code blocks: an already-empty queue is not evidence of suspension.

2. **Capture the after run:** repeat exactly on this change. In Console read `window.__ORBIUM_PERF__.snapshot().counters`. Start the Performance recording before opening `TEST`; switch to A before coloring completes, sample counters immediately after hiding, wait five seconds, and sample again. Expected: `code-highlight.pauses` increases, `code-highlight.active-schedulers` becomes `0`, and `code-highlight.processed-blocks` does not increase during the settled hidden interval. Main has no recurring highlighting call stacks or `orbium:code-highlight.batch` measures while `TEST` is inactive. Other subsystems may still run. Confirm `TEST` is inactive using its wrapper's `data-editor-activity-active="false"` attribute in Elements.

   Snapshot command (run manually at each boundary; do not install a polling interval):

   ```js
   window.__ORBIUM_PERF__.snapshot().counters
   ```

3. **Resume:** while recording, return to `TEST` without editing. Expected: activation remains responsive; `code-highlight.resumes` increases and processed-blocks starts increasing again if the queue was pending. Subsequent idle batches appear and colors eventually complete, with no synchronous whole-queue activation task. The scheduler gauge reaches `0` when drained. Select the activation interval and inspect Main for the size of individual batches; a single large Lowlight call can exceed the cooperative six-millisecond budget. If no new blocks process, repeat ensuring unfinished work existed before hiding. Compare the saved before/after hidden intervals' highlighting CPU time; record actual results below.

4. **Editing correctness:** edit one active code block, change its language, try an unspecified language and Plaintext, insert/delete a block above it, and duplicate/move identical blocks. Undo/redo each content change. Expected: correct eventual colors and positions, unchanged source text/selection/history semantics. Hold arrow keys after the queue drains: no new highlighting batches or processed-block increments from selection-only transactions.

5. **Save independence:** throttle Network, type a unique marker inside a code block, and immediately switch to A. Expected: hidden highlighting stops while the queued/in-flight save still completes. Return, wait for Saved, hard reload, and verify the marker. Highlight-only batches must create no content-save request or revision change. Undo/redo remains functional.

6. **Rapid switching and identity:** switch `TEST → A → TEST → A → TEST` repeatedly before the queue drains. Expected: no exceptions or duplicate loops; subscription gauge stays equal to the number of retained document editors; the frame's scheduler gauge stays `0` or `1` with only one active document. Controller/editor counts do not rise merely from switching. Through React DevTools, compare the controller, extension array, and editor instance stored from `DocumentEditor` before/after switching: identities and undo history persist.

7. **Close/destruction and development replay:** reopen `TEST` with work pending, hide it, then close it after Saved. Allow deferred retained-editor destruction to settle. Expected: activity-subscriptions decreases by one; schedulers remain `0`; processed-blocks stays unchanged on code-free A. Reopen and repeat several times: subscriptions rise only for newly retained editors and fall on destruction, without negative/doubled counts. Repeat in development with Strict Mode effect replay enabled, if available; a surviving editor must keep receiving pause/resume events. After closing all document editors or signing out, both highlighting gauges settle at `0`.

8. **Inactive document transactions (optional diagnostic on disposable content):** in React DevTools locate the Tiptap editor value in `DocumentEditor` hooks and store that instance as a temporary Console variable. Hide its document, then invoke its `commands.insertContent` with a disposable text marker at its existing code-block selection. Expected: normal document update/autosave behavior but no highlighting batch or processed-block increase until reactivation. Return and verify eventual highlighting, undo, and persisted marker after Saved/reload. Do not call editor commands after destroying the editor.

9. **Cold open, handoff, and split behavior:** hard reload directly into `TEST`: colors must start without editing. With Network throttled, switch to an uncached document: outgoing `active=false, visible=true` must pause highlighting. Open a split group and inspect each iframe's own Console context: locally active editors highlight normally. A parent-hidden split iframe may continue work under the documented limitation. Ordinary autosave and split editing must remain intact.

| Measurement | Before | After |
| --- | --- | --- |
| Hidden-interval highlighting CPU time | Pending | Pending |
| Hidden-interval recurring highlighting batches | Pending | Pending |
| Activation responsiveness / individual batch durations | Pending | Pending |
| Subscription stability after switching/closing | Pending | Pending |

## Decision

**KEEP**, provisionally for manual acceptance. Static checks pass and the change is limited to controller-aware highlighting scheduling plus necessary subscription ownership. Browser correctness, lifecycle observations, and actual runtime savings remain pending; this is not a measured benchmark claim.

Suggested single logical commit: `perf(editor): pause syntax highlighting in hidden tabs`.

No commit created. Stop at Task 3A for manual acceptance; do not begin Task 3B or another product phase.
