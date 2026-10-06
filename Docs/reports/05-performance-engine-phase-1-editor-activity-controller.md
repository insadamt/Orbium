# Orbium Performance Engine — Phase 1, Task 2

Date: 2026-10-06. Task 1 was accepted by the user. Scope: editor activity infrastructure only, within the ongoing product Phase 5 review. Task 3 and later product phases have not started.

## Implementation

The retained workspace remains authoritative: it already computes `active` and `visible` for each document surface. Its memoized per-tab context now carries both values. Normal cached documents are active/visible; hidden retained documents are inactive/invisible. During an uncached handoff, the outgoing surface can be visible but inactive. Background means `!active`, including that read-only handoff; it is derived rather than stored. Browser-window focus and browser-tab visibility are not part of this navigation activity model.

`EditorActivityController` owns one immutable snapshot and a subscriber set per mounted `DocumentEditor`. Its constructor has no diagnostic side effects. The tab adapter creates it once with lazy React state, registers diagnostics on layout-effect mount, and publishes committed activity in a layout effect before paint. Equivalent state updates retain snapshot identity and emit no notification or transition. Cleanup releases gauges and clears subscribers. Mount/cleanup can replay on the same controller in development Strict Mode without leaking gauges.

The stable API is `getSnapshot()`, `subscribe(listener)` (returning an unsubscribe function), and `setActivity({ active, visible })`. Only the navigation adapter writes activity. Non-React plugins can synchronously read and subscribe without a React render; subscribers must unregister when their plugin is destroyed. `useEditorActivity(controller)` offers a navigation-independent React consumer using `useSyncExternalStore`. It is available for future consumers; the whole editor does not add an external-store subscription in this task. The existing adapter returns `activityController` alongside tab metadata.

Mermaid now reads the controller through a subscription, applies the initial active value, and updates only when `active` changes. Visibility-only transitions do not cancel/reschedule its work. Its renderer, cache, scheduling, observers, and existing active/inactive behavior are otherwise unchanged. No new subsystem pauses were implemented.

Activity changes do not enter the extension dependency array, the `useEditor` dependencies, document keys, or autosave code. They neither dispatch editor transactions nor toggle editor editability. Existing DOM inert handling remains responsible for blocking interaction on outgoing surfaces. Autosave, dirty tracking, serialized saves, revision handling, retry, close guards, and unload protection retain their existing lifecycle.

Fan-out stays local: memoized retained tabs receive their own activity context, and each controller only notifies its own subscribers. Unrelated retained tabs do not receive a new context value solely because another tab becomes active. Existing shared search or other contexts can still cause their own renders; this task does not claim to eliminate every editor render.

## Split panes

Each iframe is its own document/application context. Its document provider explicitly supplies `active: true, visible: true`, preserving current usable-pane semantics independently of which parent tab has keyboard focus. Counts are per frame. Parent-hidden visited split groups still retain their frames; the iframe continues to report its existing local activity because the parent currently sends no activity signal. This task adds no cross-frame coordination or hidden-group suspension. Ending splits retains existing save guards and standalone refresh behavior.

## Library decision

Reviewed [Zustand vanilla createStore](https://github.com/pmndrs/zustand/blob/main/docs/reference/apis/create-store.md) and [React useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore). Zustand is already installed and supports non-React state access/subscriptions, but editor lifecycle cleanup and instrumentation would still need an application wrapper. React's API supports the same narrow external-store contract, requiring stable snapshots and unsubscribe cleanup. The user explicitly selected the small editor-local controller. No dependency added or upgraded. This controller is deliberately limited to editor activity; it does not provide general store middleware, persistence, selectors, or cross-frame state.

## Diagnostics

Existing profiling exposes these per-frame counters through `window.__ORBIUM_PERF__.snapshot().counters`:

- `editor-activity.controllers`: current mounted controllers.
- `editor-activity.active-editors`: current active editors.
- `editor-activity.visible-editors`: current locally visible editors.
- `editor-activity.transitions`: cumulative changed activity snapshots, excluding mount/unmount and equal updates.

Counters are updated only on lifecycle/state changes; snapshot reads emit no samples. Existing performance `reset()` preserves counters, including these gauges and cumulative transitions. In development or a build with `VITE_ORBIUM_PROFILE=true`, editor wrappers also expose boolean `data-editor-activity-active` and `data-editor-activity-visible` attributes. Ordinary production omits those attributes and counter updates. No content, document titles, or identifiers are added to diagnostics.

## Validation

- Targeted `npx vp fmt`: PASS, seven changed/new source files; controller formatting repeated after initializing the transition counter to zero.
- `npm run types:check`: PASS.
- `npm run lint`: PASS; 264 formatted files, 200 linted files, no lint errors/warnings.
- `npm run build`: PASS. Existing large-chunk and ineffective dynamic-import warnings remain for document helpers.
- `git diff --check`: PASS; new files also checked for whitespace.
- Automated tests: neither written nor run, per the user's instructions.
- Browser/manual validation and performance measurement: not performed; pending the checklist below. No runtime speedup or observed editor count is claimed.

No migrations, persistent-format changes, backend changes, or commits created. New source files are below 100 lines; `DocumentEditor` remains below 500 lines.

## Exact manual checklist

Use disposable documents. Hard-reload after loading the new assets. Use development mode or a profiling-enabled build for diagnostics. Keep Console on the top frame for ordinary retained tabs, and wait for Saved before reloading except when deliberately checking unload protection.

1. **Five retained documents:** open and visit five ordinary document tabs, including a database document. Wait for each editor to load. In Console run:

   ```js
   window.__ORBIUM_PERF__.snapshot().counters
   Array.from(document.querySelectorAll('[data-editor-activity-active]'), element => ({
     active: element.dataset.editorActivityActive,
     visible: element.dataset.editorActivityVisible,
   }))
   ```

   Expected after navigation settles: controllers `5`, active editors `1`, visible editors `1`; one row true/true and four false/false. Switch repeatedly: controllers remain `5`; transitions increase only for changed editors. Switching to explorer or Settings should leave the retained editors with active/visible counts `0` once the handoff settles.

2. **Stable editor and controller:** while A is active, run `window.activityEditorA = document.querySelector('[data-editor-activity-active="true"] .tiptap').editor`. Record `window.__ORBIUM_PERF__.snapshot().marks` and construction sample count. In React DevTools select A's `DocumentEditor` and inspect its `EditorActivityController` hook state; store that object as a Console temporary variable if desired. Switch A→B→A. Run `activityEditorA === document.querySelector('[data-editor-activity-active="true"] .tiptap').editor` and `activityEditorA.isDestroyed`. Expected: `true` and `false`; construction marks/sample count for already-visited editors do not change solely on switching. The controller object remains the same and its `getSnapshot()` reads current activity. Set caret/selection, scroll, edit, switch, and return; verify scroll and undo/redo history survive.

3. **Subscription isolation:** with five editors retained, use React DevTools profiling while switching only A↔B. Expected: the three unrelated inactive editors do not rerender solely from activity changes. If a controller was stored as a temporary variable, use `const stopActivityLog = temp1.subscribe(() => console.log(temp1.getSnapshot()))`, switch its tab away/back, then call `stopActivityLog()`. Expected: notifications reflect that editor's changes only and stop after unsubscribe. Snapshot objects contain only active/visible booleans.

4. **Visible inactive handoff:** reload with restored tabs, visit A, throttle Network, then select an unvisited document B. Expected while loading: outgoing A can report false/true, accepts no editing, and active count can temporarily be `0`. Once B loads: B true/true and A false/false. No permanently blank document or extra blink; visible and active are not forced equal.

5. **Save immediately before hiding:** throttle Network, type a unique marker in A and immediately switch to visited B. Expected: A becomes inactive/invisible but its queued/in-flight save completes. Return, wait for Saved, reload, and verify the marker. Repeat with an unvisited destination. Activity must not discard or defer the queued save indefinitely.

6. **Failure and protections:** go offline, edit A, switch to B, and attempt to close dirty A. Expected: existing close protection prevents discarding it; attempted reload has the existing unload warning. Cancel reload, reconnect, return to A, and Retry. Expected: latest edits save and a subsequent reload preserves them. Repeat a stale-revision conflict using separate browser profiles: existing conflict handling remains.

7. **Mermaid and controls:** visit a diagram document, switch away during preparation, then return and edit a diagram. Expected: existing inactive scheduling behavior and reusable previews remain; no new suspension behavior, duplicate results, or stuck preparation. Verify Ctrl/Cmd+F, Ctrl/Cmd+S, slash/mention menus, and selection toolbar in B respond only to B; return to A and verify they still work.

8. **Close and cleanup:** after Saved, close inactive documents one at a time. Allow deferred cache cleanup to settle. Expected: controller count decreases once per destroyed editor; active count remains `1` while one active document exists. Closing the active Saved tab selects its replacement with correct settled gauges. Reopen a closed document: one new controller/editor, no old subscriptions. Sign out after Saved: top-frame controller/active/visible gauges become `0`. Development effect replay must not leave negative or doubled gauges.

9. **Splits:** split two Saved documents. In each iframe's Console context repeat the counter/attribute query. Expected: each usable pane reports one local active/visible controller and keeps editing/saving normally. Switch parent groups and return: existing retained frame state remains. Dormant parent-hidden frames keep local true/true under existing semantics. End split after saving: fresh standalone content, correct top-frame gauges, and no stale standalone writer.

## Commit suggestion and stop gate

`feat(editor): add retained editor activity controller`

Stop after Task 2 for manual review. Do not begin Task 3 or another product phase without explicit user approval.
