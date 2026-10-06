# Phase 5 review — retained document tabs

Date: 2026-10-06. Remain in Phase 5 for manual review.

The same-day [document handoff correction](05-document-tab-handoff.md) supersedes this report's generic loading-state behavior for uncached tabs. It fixes blank document opening and preserves visible content during handoff. Use that follow-up checklist for opening, switching, and closing visual acceptance.

## Finding and implementation

Normal app-tab activation previously made an Inertia GET before selecting the destination. Document pages then constructed another editor. Closing an active tab waited for the destination GET as well. These code paths put network latency and large-document construction on repeated tab interactions.

Visited tabs now retain their last Inertia page snapshot in session memory. Activation restores that snapshot with the existing Inertia `router.push` API and restores the recorded scroll position. The page cache is scoped to tab identity and URL, is cleared when navigation initializes for a different account, and is never written to localStorage. Laravel remains authoritative for persistence. Cache misses still use the authenticated server route, with immediate tab selection and a lightweight loading state.

Document pages mount in a persistent workspace keyed by app-tab ID and page generation. Hiding a document preserves its Tiptap editor, content, selection, undo history, and local header state. Switching back avoids editor construction. Fresh server document responses and navigation to another URL replace that editor normally. Explorer/database/settings snapshots appear first and then refresh from the server; their component trees are not retained editors.

Hidden documents continue autosaving and retain browser-unload protection. They do not intercept document keyboard shortcuts, run the shared page finder, or schedule new Mermaid preparation. Editor menus, formatting controls, property popovers, and crop portals are limited to the visible document. An asynchronous icon save updates its owning tab rather than whichever tab happens to be active afterward.

Saved tabs close without waiting for a destination request. Closed page snapshots and document editors are released after a frame and timer yield so destination painting can precede expensive editor destruction. Pending/failed/in-flight document saves block tab removal and flush the latest snapshot, with a visible notice. This protection includes inactive documents and same-origin split-pane editors.

Split panes keep their existing visited iframe lifecycle. Creating a split checks both documents before replacing ordinary editors with frames; ending a split checks both panes and refetches the standalone page rather than restoring a stale pre-split editor. Closing one member also invalidates the companion's pre-split snapshot before returning to it.

## Library decision

No packages added or upgraded.

- Reviewed [React Activity](https://react.dev/reference/react/Activity). It preserves state but cleans up hidden effects. Applying that directly here would interfere with effect-owned editor/autosave lifecycles without a separate redesign.
- Reviewed [react-freeze](https://github.com/software-mansion/react-freeze). It preserves mounted views while suspending renders, but does not provide Inertia page caching, save guards, or selective background-work control. It would not replace the lifecycle work needed here.
- Chose existing React, Zustand, Inertia, and native scheduling. Inspected the installed Inertia client-visit implementation and types: `router.push` changes page/history without a GET, while `router.reload` preserves state and scroll. This keeps routing under Inertia rather than directly rewriting browser history.

Tradeoff: retaining large open editors increases memory usage. Closing tabs releases those editors; no automatic eviction of open documents was introduced because it would discard editing state and require a separate policy for unsaved work.

## Validation

- Targeted `npx vp fmt`: PASS.
- `npm run types:check`: PASS.
- `npm run lint`: PASS; 248 formatted files, 185 linted files, no warnings/errors.
- `./vendor/bin/pint --test`: PASS.
- `npm run build`: PASS; final build 6.91 seconds. Existing chunks above 500 kB still warn.
- `git diff --check`: PASS.
- Automated tests were neither written nor run, per user instructions.
- Interactive browser verification and latency measurements were not performed. The required in-app Browser was unavailable in this session. No instant-switch timing or memory benchmark is claimed.

No migrations, persisted document format changes, backend changes, or commits were created.

## Exact manual checklist

Hard-reload once to load the rebuilt assets. Use one browser window and disposable copies for edits, including a copy of the huge `test` document. Do not modify the original stress document. Wait for Saved before any hard reload except when deliberately checking the unload warning.

1. **Warm document switching:** open a copy of `test` in one app tab and a short document in another. Visit both once, scroll each to a different position, place the caret, and switch repeatedly using the tab strip. Expected: correct document, title, tab selection, and URL; returning retains scroll and editor state without a document GET or an opening preview. Record actual click-to-paint latency in DevTools Performance; this report does not establish a numerical target was met.
2. **Undo and editing:** type a unique marker in the large copy, wait for Saved, switch away/back, then undo/redo and edit near the end. Expected: undo history and text survive warm switches; the visible editor receives input. Save, reload, and verify the final marker.
3. **Saved close:** with both documents visited and Saved, close the large active tab. Expected: it disappears without waiting for a destination GET, the other document becomes visible at its recorded position, and the closed editor is eventually removed from the DOM. Also close an inactive saved large document. Expected: active document stays unchanged.
4. **Unvisited restored tab:** reload with several existing tabs and visit one that has not loaded in this page session. Expected: selection responds immediately, a loading state is allowed, then the authenticated page loads. Close a Saved tab whose destination is such an unvisited tab. Expected: the closing tab disappears before that destination request completes. A first document load still constructs its editor.
5. **Saving while hidden:** throttle the Network, type in the large copy, and immediately switch to the already-visited short document. Expected: switch proceeds; the large copy continues its serialized autosave in the background. Switch back after completion, then reload after Saved. Expected: newest edits persist. Also activate an unvisited tab while saving and verify the same retained-source behavior.
6. **Dirty close/failure:** type and immediately close the active tab, then repeat for a dirty inactive tab. Expected: close is blocked with a save notice; retry closing after Saved succeeds. Repeat offline: edit, switch away, try closing the dirty hidden tab, reconnect, return, and Retry. Expected: failed content is retained; closing does not silently discard it. Hard reload while it remains dirty should show the browser's existing unload protection.
7. **Shortcut and popup isolation:** in document A open slash/mention suggestions, a block menu, or selection formatting; switch to B. Try Ctrl/Cmd+F and Ctrl/Cmd+S in B. Expected: only B responds and A's portals do not overlay it. Repeat with a database-document property picker and a cover crop dialog where tab activation is possible. Return to A: editing controls remain usable.
8. **Mermaid lifecycle:** visit diagrams in the large copy, switch away during preparation, and return. Expected: no new hidden-session preparation jobs; prepared previews remain reusable and nearby preparation resumes on return. Close while preparation is running and reopen the document. Expected: no previous editor's results appear in the new instance. An already-running Mermaid render may finish.
9. **Parent freshness and non-document tabs:** rename a disposable document, switch to an already-visited explorer tab, then a database tab and Settings. Expected: cached surfaces appear followed by server refresh; current titles/properties become visible. Switch quickly while a refresh is loading. Expected: the final selected tab and URL agree and no old response replaces the selected document. Repeat a database property save and a settings change.
10. **Split transitions:** split two Saved documents, edit a pane, then attempt End split or removal before Saved. Expected: the operation waits for saving. End the split after Saved. Expected: a fresh standalone document includes the pane edits; no hidden stale standalone editor also saves that document. Repeat closing the inactive member while its companion is active, then switch among visited split groups and ordinary tabs. Expected: correct standalone destination and preserved visited frames while their group remains open.
11. **History/restoration:** navigate within a document tab, use in-app Back/Forward and browser Back/Forward, then reload. Expected: correct per-tab entries, fresh server-backed history restoration, and restored tab identities. Pin a tab and try closing it; try closing the last tab. Expected: existing protections remain.
12. **Conflict and account isolation:** use separate browser profiles to edit the same disposable document at competing revisions. Expected: the existing conflict rejection remains. After Saved, sign out and sign into another account. Expected: no previous account's retained document is rendered. With multiple huge documents open, inspect memory and compare after closing them. Expected: retained editors add memory while open, and closed documents lose their mounted editors; do not expect immediate garbage collection.

## Limits

- Browser-level instant latency is the target, not a verified result. Browser-history serialization, React updates, layout, and any currently executing synchronous render still have costs.
- First opens, unvisited restored tabs, fresh history restoration, and ending a split still load from the server and may construct large editors.
- Cached documents remain live editing sessions. External edits are not proactively synchronized; revision conflicts still protect writes.
- Large databases still mount their matching rows. Their refresh/rendering costs were not redesigned in this pass.
- Hidden code highlighting and other existing non-Mermaid idle jobs were not fully suspended. Mermaid work already executing cannot be preempted.
- Open editors consume memory. No open-tab eviction or durable offline-save queue was added.

## Commit suggestions and stop gate

Suggested message: `perf(navigation): retain document editors for fast tab switching and closing`

Optional separate follow-up grouping: `fix(navigation): guard split transitions and isolate hidden editor controls`

Shared-file changes overlap; review hunks if using separate commits. Stop for manual review in Phase 5; do not start Phase 6.
