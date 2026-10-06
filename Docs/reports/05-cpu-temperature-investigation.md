# Phase 5 — CPU temperature and document navigation investigation

Date: 2026-10-06. Investigation only; no application code or dependencies changed and no later phase started.

The user reports CPU temperature reaching 88°C, mainly while switching app tabs or opening documents. The selected wallpaper, browser/GPU configuration, document sizes, and process CPU readings have not been established.

## Conclusion and evidence limits

The strongest leads for the reported trigger are large-document construction/layout, full-page browser-history processing on cached tab activation, and optional work that remains attached to hidden editors. Animated wallpapers and frosted surfaces can add rendering load while these operations run, but the user's clarification does not establish them as the main cause.

Source inspection confirms the work described below. It does not establish each operation's share of CPU time or explain a specific temperature. Browser connection failed with `Browser is not available: iab`; no current foreground trace, GPU measurement, heap capture, or temperature measurement was obtained. Earlier project measurements are labeled historical. Build success would not establish lower CPU usage.

## Findings, ordered for document opening and switching

| Priority | Finding | Evidence and limitation | Proposed solution |
| --- | --- | --- | --- |
| 1 | First opens still construct the complete large editor. | `document-editor.tsx:190` passes the complete JSON to Tiptap. Retention helps subsequent visits, not the first construction. Historical profiling recorded approximately one-second construction/mount tasks and expensive initial direction normalization. | Profile construction and normalization separately. Defer unnecessary offscreen block UI and presentation work while preserving the continuous editable document. Avoid repeated whole-document transformations when content is already normalized. |
| 1 | Warm switches still process the complete page through browser history. | `tab-navigation.ts:256` restores cached pages through `router.push` with `props: page.props`. The installed Inertia source explicitly invokes `structuredClone(page.props)` before native history storage. CPU cost has not been measured here. | Instrument history work independently. If dominant, design a supported lightweight document-route/history representation that restores content from the live session or server. Preserve Back/Forward, reload, auth isolation, and fresh server navigation. Do not patch dependency internals or directly rewrite history as a shortcut. |
| 1 | Switching visibility can require layout of a large retained DOM. | `retained-document-workspace.tsx:51` toggles `hidden` on a complete mounted document. All visited ordinary document editors remain mounted until closed/replaced. | Measure style/layout work and retained DOM counts. Reduce expensive presentation subtrees, cache stable dimensions, and prototype browser rendering containment on suitable non-editable wrappers. Validate caret, selection, scroll, tables, search, and dragging before adoption. |
| 2 | Inactive code-highlighting jobs are not suspended. | `incremental-code-highlighting.ts:159` schedules work until its pending queue empties; it only checks destruction and pending work. Its 6 ms/16-block budget is checked after highlighting a block, so one expensive block can exceed that budget. | Pass document activity to the highlighting scheduler; cancel/defer optional jobs while inactive and resume on activation. Preserve document saves. Prioritize visible/nearby blocks and profile language autodetection. |
| 2 | Hidden split panes are explicitly treated as active documents. | `split-workspace.tsx:44` retains visited iframe pairs. `.is-dormant` hides/moves them offscreen. `pages/documents/show.tsx:15` always provides `active: true` inside the iframe; no split-group activity signal reaches the editor. | Send authenticated same-origin pane activity messages, validate their sender, and update the iframe's document activity. Suspend optional preview/highlighting work in dormant groups. Continue pending saves and unload/close guards. |
| 2 | Enabled account-wide editor CSS can be compiled separately in every retained editor. | `styles/document-styles.tsx:6` subscribes directly to global Inertia page props and recompiles when the received style object changes identity. Every retained editor owns this component, stylesheet, and BroadcastChannel listener. Memoization of the parent tab does not stop a child's context subscription. Impact depends on styles being enabled, their size, and retained tab count. | Compile the saved theme once per browser document, use one shared subscription/style element, and update it only when theme content changes. Each split iframe needs its own single instance. Keep draft preview styles scoped separately. |
| 2 | Mermaid preparation can compete with newly activated documents. | Regular hidden tabs already call `setActive(false)` and stop scheduling new preparation. Existing local rendering is serialized, but an already-started Mermaid render is not preemptible. Readiness starts renderer warming, including for a session that may have become inactive. | Check activity at job execution and warm-up boundaries. Bound speculative distant work and prioritize current content. Do not claim idle callbacks can interrupt Mermaid rendering. |
| 3 | Wallpaper and frosted-glass work can increase total load. | Silk uses `frameloop="always"`; many OGL effects render every animation frame. Liquid Ether defaults to 32 pressure iterations per simulation frame with auto-demo enabled. Hyperspeed uses scene, bloom, and SMAA passes. Frosted surfaces apply 18–26 px backdrop blur to multiple surfaces. | Compare identical navigation with static/animated backgrounds and Normal/Frosted surfaces. Then standardize render caps, resolution, simulation budgets, visibility lifecycle, and resource cleanup across effects if they materially contribute. |

### Historical measurements, not rerun today

[The predictive editor report](05-predictive-editor-performance.md) records:

- A stress document with 1,854 top-level blocks, 98 code-language controls, 70 Mermaid views, and 879,950 bytes of PHP-encoded editor JSON.
- Approximately one-second main-thread construction/mount tasks.
- A normalization example reduced to 535 ms after removing repeated per-block markup transactions; it remained expensive.
- Individual Mermaid render wall times reaching 188–643 ms in the sampled document.
- Save payload construction around 9–10 ms in that sample, which was not its dominant save cost.

These measurements support investigating construction and heavy previews. They do not establish today's browser performance, a thermal cause, or a regression in the current uncommitted warm-tab changes.

### Follow-up: three test tabs and delayed document-creation popup

The user reports that opening three test tabs makes the app feel laggy and raises CPU temperature into the 80s. The latest message also appears to report a delay before the New Document popup appears. This strengthens the retained-document scaling lead; the precise popup trigger and measured timing remain unconfirmed.

Additional source findings:

- The ordinary New Document form performs its creation POST only on submit (`create-node-form.tsx:23`). Opening the form does not fetch document data. Search Master has its own search request, so its surrounding flow must be distinguished from opening the form directly.
- The shared dialog overlay uses full-viewport backdrop blur (`navigation-dialog.tsx`). The installed Radix modal path uses scroll locking and `hideOthers` for accessibility. Its installed `aria-hidden` dependency queries the whole body for `[aria-live], script`; this includes retained hidden document DOM. Every retained editor has a save-status live region. Modal setup therefore has some work that scales with the retained document tree even though the form itself is small.
- Scroll locking measures scrollbar space and writes body styles. Layout, accessibility setup, blur compositing, and a main thread already occupied by editor jobs are candidates for popup delay. No current trace establishes their individual cost. Opening a dialog does not itself prove all editors rerender.

Recommended addition to the plan: profile the popup click with one short document, one large document, and three visited large documents. Separate click-handler time, accessibility/scroll-lock setup, layout, and compositing. Evaluate a simple dim overlay without backdrop blur while retaining focus trapping and keyboard/screen-reader behavior. Keep the existing [Radix dialog](https://www.radix-ui.com/primitives/docs/components/dialog); changing UI libraries would not solve retained document size or editor jobs by itself.

If three saved inactive editors still cause material overhead after optional work is suspended, design a bounded retained-editor policy. Keep only a measured number of recent editor views mounted, with inactive document state managed separately. Eviction must preserve edits, revision, selection/scroll, and the promised undo behavior; it cannot simply destroy a Tiptap instance and assume all state survives. Reopening an evicted view adds construction cost, so this is an architectural tradeoff requiring a focused prototype and manual review.

Additional manual steps:

1. Open New Document directly, cancel, and repeat five times before and after visiting three large test tabs. Record click-to-visible/focused-input time and Network. Expected: no creation POST before submitting; any increasing popup cost is frontend work rather than waiting for document creation.
2. Close the extra saved test tabs and repeat without reloading. Expected: determine whether releasing their editor DOM reduces popup delay. Allow time for garbage collection; temperature will not necessarily fall immediately.
3. After any popup optimization, open it with three large tabs retained and use Tab, Shift+Tab, Escape, Cancel, and Create. Expected: prompt appearance/input focus, focus contained in the modal, reliable dismissal/focus return, and correct creation. Background documents must retain edits and save guards.

### What is already optimized

- Visited ordinary document editors are retained instead of rebuilt on every cached switch.
- Navigation localStorage persistence is coalesced; that is separate from Inertia browser-history processing.
- Regular inactive tabs suspend new Mermaid preparation, active-document search, shortcuts, and hover handling.
- Tiptap's installed `useEditor` defaults to avoiding React rerenders on every transaction; simply adding that option again would not fix this issue.
- The opening preview is limited to 18 blocks; the full preview is not the identified construction bottleneck.
- Global Pause animated wallpapers and system reduced motion prevent animated app-background components from mounting. The wallpaper dialog also removes the full-screen renderer while its preview is open. There is no evidence that all wallpapers render simultaneously.
- Embedded split pages do not mount another AppBackground.

Retention improves repeated opening latency but trades it for memory. The page cache has no budget for still-open tabs. Blindly evicting those editors would lose undo/selection state and could endanger pending saves; this requires an explicit retention policy, not an immediate generic cache limit.

## Recommended fix sequence within Phase 5

1. **Capture a production-build baseline.** Separate first open, warm switch, close, and split activation; use short and large documents. Record the browser process doing the work, click-to-paint, long tasks, layout, retained memory, and optional-work activity. Compare the same interactions with a static background/Normal surfaces. Keep diagnostics off for the thermal baseline; use a separate profiling run when needed.
2. **Remove redundant work without changing data or tab behavior.** Share saved-theme compilation, suspend inactive highlighting and Mermaid warm-up, and propagate split-pane activity. Keep autosave, dirty-tab protection, undo, and scroll restoration intact.
3. **Address the measured large-document bottleneck.** If history dominates, redesign its document payload through supported integration points. If layout/construction dominates, reduce offscreen presentation work and costly normalization. Treat either as a focused change with its own manual review.
4. **Budget appearance rendering if its comparison warrants it.** Proposed balanced starting point: a 30-render-per-second ceiling and conservative pixel count; 15 fps/lower resolution for a low-power option. These are tuning proposals, not measured optima. A rate cap must govern actual rendering/simulation, not only the visual animation speed. Some current effects already cap FPS or DPR; adapt the others without stacking duplicate loops. A static option remains the lowest-work choice.
5. **Compare again on the same device.** Judge CPU process load and responsiveness as well as temperature. Temperature takes time to settle and is not a browser performance counter; a smooth high FPS result can still consume substantial power.

Do not replace the editor, add a worker for DOM-dependent Mermaid rendering, install a generic list virtualizer around ProseMirror blocks, or evict dirty editors as an unmeasured shortcut. The previous native Mermaid NodeView experiment did not establish an opening improvement.

## Library research and recommendation

No library installed or upgraded. Recommend application-owned activity, scheduling, and shared-style services using existing React, Zustand, Inertia, Tiptap, css-tree, and rendering libraries. These services should remain small and split by responsibility. The user should review any proposed new dependency before implementation.

| Option | What it helps with | Limitation for this app | Recommendation |
| --- | --- | --- | --- |
| Existing native scheduling and Page Visibility APIs | Cancel optional jobs and gate work by activity/visibility. | Idle callbacks do not preempt synchronous work. CSS-hiding an iframe does not give it independent page-hidden state. | Use with explicit app-tab and split-pane activity. [Page Visibility documentation](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API). |
| React Activity, already available in the React generation used here | Preserve UI state while hiding content and cleaning up effects. | Effect cleanup conflicts with the current effect-owned editor and autosave lifecycle; first-open DOM work remains. | No blanket wrapping of retained editors without lifecycle redesign. [React documentation](https://react.dev/reference/react/Activity). |
| react-freeze, new dependency | Suspend React subtree rendering while retaining state. | Does not cancel highlighting, Mermaid, iframe work, or browser-history serialization. | Do not add for this pass. [Project documentation](https://github.com/software-mansion/react-freeze). |
| Existing React Three Fiber demand rendering | Stop rendering an R3F canvas when no frame is needed. | Continuous animation still requires scheduled frames; it does not control OGL or raw Three.js effects. | Use for Silk where appropriate, with explicit render scheduling. [R3F documentation](https://r3f.docs.pmnd.rs/advanced/scaling-performance). |
| Drei PerformanceMonitor / AdaptiveDpr, new dependency | Adapt an R3F scene's quality using frame-rate feedback. | R3F-only, not CPU/temperature measurement, and does not impose a power budget on the other wallpaper implementations. | Consider only if R3F-specific measurements justify it. [PerformanceMonitor](https://drei.docs.pmnd.rs/performances/performance-monitor), [AdaptiveDpr](https://drei.docs.pmnd.rs/performances/adaptive-dpr). |
| TanStack Virtual, new dependency | Reduce mounted rows/items in large database/explorer lists. | Does not preserve ProseMirror's continuous editing DOM automatically; focus, selection, drag/drop, and variable-height content require integration. | Separate database/explorer decision after measurement, not the document fix. [Documentation](https://tanstack.com/virtual/latest/docs/introduction). |

Web research was checked on 2026-10-06. Library integration limits above combine official behavior with inference from Orbium's current lifecycle. [Tiptap's performance guide](https://tiptap.dev/docs/guides/performance) supports isolating editor updates, which the current code already partly does. [Three.js disposal guidance](https://threejs.org/manual/pages/how-to-dispose-of-objects.html) supports auditing resource cleanup; DarkVeil's cleanup currently cancels its loop/listener without explicitly releasing its program/geometry. A growing resource leak has not been measured.

## Manual investigation checklist

Use disposable document copies, wait for Saved before reloading, and keep browser, window size, power mode, and other applications consistent. Record which wallpaper and surface style are selected. Compare equal-duration runs after the machine has settled; avoid interpreting one instantaneous temperature reading as a comparison.

1. **Establish the process responsible.** Open the browser task manager and the operating-system process monitor. Leave one short document idle for two minutes, then open a large document and switch between them 20 times. Record Orbium's tab/renderer and the browser GPU process; if self-hosted locally, also record PHP/Vite/Docker processes. Expected: identify where utilization rises rather than assuming every spike is React or the server.
2. **Separate first open from warm switches.** After a reload, record one first document open in DevTools Performance and Network. Visit both documents, wait for Saved/preparation to settle, then record ten warm switches. Expected today: first opens may fetch/build the editor; cached ordinary document switches should have no document GET or reconstruction. Inspect history and style/layout tasks even when no request occurs. Unexpected repeated construction is a distinct bug to fix.
3. **Compare document sizes.** Repeat with two short documents and then two large copies, at top and deep scroll positions. Expected: determine whether the problem scales with document DOM/content size and saved scroll restoration. Record main-thread time and long tasks, not just perceived speed.
4. **Check retained-tab scaling.** Repeat the same two-tab interaction with additional large visited tabs open, then close the extras after Saved. Inspect heap/DOM counts and inactive work. Expected: mounted editors are released after closing; garbage collection may occur later. CPU should not grow merely because saved inactive tabs exist. A measured increase directs work toward retained subscriptions, styles, or optional jobs.
5. **Check dormant splits.** Visit a split group containing code and Mermaid, activate an ordinary short document, then return to the split. Expected today: panes stay mounted and their context remains active, a confirmed lifecycle gap. After the proposed fix: no new optional preparation/highlighting in a dormant group; pending saves continue; return retains content and scroll.
6. **Isolate appearance.** Repeat an equal-duration navigation run with Pause animated wallpapers enabled and Normal surfaces; compare with the original appearance. If both changed the result, repeat with only one setting changed at a time. Expected: establish whether wallpaper rendering, blur, or neither materially adds to the navigation load. This is a diagnostic comparison, not proof that disabling appearance alone fixes opening.
7. **Isolate saved editor styles.** With an enabled custom theme and several retained tabs, record navigation; disable the theme and repeat. Expected: establish the style compiler's contribution. After sharing it: an unchanged saved theme should not compile once per hidden editor on every switch; changed themes should still reach ordinary documents and both split panes.
8. **Verify core state after any fix.** Type a marker, switch away while saving, return, undo/redo, use Ctrl+F and Ctrl+S, close a dirty hidden tab, end a split, use Back/Forward, and reload after Saved. Expected: edits persist, guards remain, undo/caret/scroll work, the right document and URL appear, and no blank/blink regression returns.

For detailed stage profiling in development, `window.__ORBIUM_PERF__?.summary()` exposes existing editor measurements. A normal production build disables these diagnostics unless explicitly built with profiling enabled. Profile-disabled production runs remain the thermal baseline.

## Validation actually performed

- Read project phase and relevant editor/navigation/appearance reports; inspected source and installed Inertia/Tiptap implementations.
- Reviewed primary documentation for the library alternatives above.
- Browser setup attempted; unavailable. No runtime or thermal measurements performed.
- `git diff --check`: PASS for existing tracked changes. The new report was additionally checked with `git diff --no-index --check /dev/null Docs/reports/05-cpu-temperature-investigation.md`.
- Formatting/lint/type/build checks: not run; this investigation changes documentation only. No passing application checks are claimed.
- Automated tests: neither written nor run, per user instructions.

Existing uncommitted application changes were preserved. No migration, persistent-format change, dependency change, or commit created.

## Commit suggestions

For this investigation: `docs(performance): investigate document navigation CPU hotspots`

For future fixes, only after their actual implementation and validation:

- `perf(editor): share saved theme compilation across retained documents`
- `perf(editor): suspend optional work in inactive tabs and split panes`
- `perf(navigation): reduce measured document activation overhead`
- `perf(appearance): apply consistent wallpaper rendering budgets`

Remain in Phase 5. This report proposes fixes; it does not claim they have been implemented or that 88°C has been resolved.
