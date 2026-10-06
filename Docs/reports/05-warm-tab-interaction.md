# Phase 5 review — remaining warm-tab interaction work

Date: 2026-10-06. Follow-up to `05-document-tab-handoff.md`.

## Changes and rationale

The user confirmed the blank/blinking regression was fixed but reported a small remaining delay. Source inspection found avoidable work still attached to warm switches:

- Scroll capture, activation, and page metadata recording each synchronously serialized the browser navigation snapshot and wrote localStorage.
- Unchanged scroll/metadata updates rebuilt the tabs array and notified subscribers.
- Retained tab providers supplied new context objects on workspace renders. Each editor also subscribed directly to Inertia's page URL, so route changes could update editors unrelated to the active switch.
- The page-search provider recreated its context and callbacks; an already-empty route search reset still created a new search-step object.
- The selection toolbar was removed/recreated on each activation, causing Tiptap's BubbleMenu plugin to unregister/register against the retained editor.

Navigation persistence now coalesces the latest immutable UI snapshot behind a frame and timer yield. The in-memory state changes immediately; browser storage follows after the first frame. `pagehide` and background visibility changes capture current scroll and synchronously flush pending persistence. The existing per-account key and stored format are unchanged. Unchanged activation, scroll, and page metadata are skipped.

Each retained tab has a memoized boundary and stable document context. Editors read their own document URL from that context; embedded document routes provide it too. Inactive editors no longer subscribe directly to Inertia's changing page URL. The shared search context and actions remain stable when its search state has not changed, and resetting an already-empty search retains its existing step object.

Selection toolbars stay registered for the lifetime of their editor. Their DOM is hidden while inactive and their stable `shouldShow` callback checks current tab activity before inspecting the selection. This preserves hidden-toolbar isolation without repeated editor plugin reconfiguration.

No browser-history implementation was replaced. Inertia still restores its page and serializes history. Large-document layout, the visible editor's own updates, and already-running synchronous work can still take time.

## Library choice

No dependency added or upgraded. Existing React `memo`, `useMemo`, and `useCallback` handle rendering boundaries; native frame/timer scheduling handles the small browser-local UI snapshot. The previously reviewed Activity/react-freeze alternatives do not remove the specific persistence or Tiptap plugin work identified here. This continues the existing application-owned solution.

## Validation

- Targeted `npx vp fmt`: PASS.
- `npm run types:check`: PASS.
- `npm run lint`: PASS; 250 formatted files, 187 linted files; no lint warnings/errors.
- `./vendor/bin/pint --test`: PASS.
- `npm run build`: PASS, final build 8.09 seconds. Existing large chunks and the document-helper static/dynamic import warnings remain.
- `git diff --check`: PASS.
- Automated tests were neither written nor run, per user instructions.
- The in-app Browser was unavailable. No timing, visual, render-count, or storage-write-count measurement was performed. The changes remove identified source work; a measured milliseconds improvement remains unverified.

No migration, canonical editor content change, browser navigation format change, or commit created. Deferred persistence covers tab UI only, not document autosave.

## Manual checklist

Hard-reload once to load the rebuilt assets. Use disposable document copies for edits.

1. Open a huge `test` copy and a short document in separate app tabs; visit both once and switch repeatedly. Expected: no blank/blink/loading regression; correct selected document, URL, and breadcrumbs. Record click-to-next-paint in a foreground DevTools Performance trace if comparing milliseconds.
2. Repeat with several additional huge document tabs open. Expected: unrelated hidden editors retain their state; only the outgoing/destination tab activity changes. If using React DevTools profiling, inspect renders to check inactive `DocumentEditor` components do not rerender solely because the Inertia page URL changed. Small style subscribers can still receive page-context updates.
3. Scroll two documents to different positions, switch, and immediately reload or close/reopen the browser page. Expected: the latest active tab and its scroll restore; pending browser-local navigation writes are flushed on leaving. Also switch to another browser tab/background the window, return, and reload.
4. Pin, reorder, close, and split Saved tabs; select an explorer/database view; reload. Expected: the same tab ordering, pinning, split state, and view restoration as before. Work only in the current account and confirm another account does not restore its tabs.
5. Select formatted text, use bold/link/color controls, switch to another document, then return. Expected: no toolbar floats over an inactive document; formatting controls still work after returning. Repeat with empty selections, code blocks, and a selection across many blocks.
6. Use the floating document finder with a query and Enter/Shift+Enter, clear it, then switch documents. Expected: current counts and matching remain correct; route changes clear the floating query. Open a body-search result containing a `find` query and repeat inside a split pane. Expected: the correct document receives the search term.
7. Edit a disposable document, switch away while saving, return, wait for Saved, and reload. Expected: edits persist; close/unload guards and failed-save retry remain available. Navigation persistence scheduling must not change document-save timing or content.

Suggested commit: `perf(navigation): reduce warm tab persistence and editor updates`

Remain in Phase 5 for manual review. No zero-latency guarantee is claimed.
