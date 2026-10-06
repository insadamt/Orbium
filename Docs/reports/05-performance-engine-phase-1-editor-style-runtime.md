# Orbium Performance Engine — Phase 1, Task 1

Date: 2026-10-06. Scope: globalize saved editor styles only. This is the user's Performance Engine Phase 1 within the repository's ongoing Phase 5 review, not the hierarchy Phase 1 or approval to start another product phase.

## Before

Every mounted `DocumentEditor` mounted `DocumentStyles`. Each instance subscribed to Inertia page props, held saved preference state, opened its own account BroadcastChannel, fetched preferences on each notification, normalized/compiled CSS, and conditionally rendered a style element. Retained editors multiplied these subscriptions, fetches, and compilations. Memoization depended on preference object identity rather than normalized contents.

The middleware supplies account preferences as the shared `editorStyles` prop. Settings saves with Inertia, then posts `saved` through a short-lived account BroadcastChannel. Settings draft previews validate independently against `[data-style-preview]`.

## Change

- `AppLayout` mounts one `EditorStyleRuntime`, keyed by account ID. The installed Inertia layout reducer preserves this outer layout across ordinary pages and nested Settings layouts. Retained document surfaces do not mount layouts.
- `DocumentEditor` retains its existing `[data-document-styles]` wrapper but no longer mounts a style runtime. The old `document-styles.tsx` is removed.
- The runtime owns one saved configuration, one Inertia server-success listener, one persistent BroadcastChannel, one abortable preference refresh path, and one identified `<style data-editor-style-runtime>` node. The node remains present with empty CSS for disabled/default/fallback styles.
- Initial preferences come from Inertia, without an initial preference GET. Subsequent successful server visits and BroadcastChannel refreshes update the configuration. Cleanup aborts requests, closes the channel, and unregisters the listener. A new refresh supersedes the preceding request; an aborted response cannot publish styles.
- Cached local tab visits intentionally do not replace the runtime's preferences. Inspection of the installed Inertia client shows `router.push` emits `clientVisit`, whereas successful server responses emit the global `success` event. Old cached page preferences therefore cannot undo a live saved theme when returning to a retained tab. No navigation code changed.
- Normalization produces a stable serialized key in documented block order. One last-result cache, keyed by account and configuration, reuses the CSS across equivalent payload objects and development Strict Mode replay. Disabled styles skip compilation; invalid saved configurations reuse their empty fallback. This is bounded to one result, not a history of themes.
- Existing profiling gains counters in `window.__ORBIUM_PERF__.snapshot().counters`: `editor-styles.active-runtimes`, `editor-styles.active-channels`, `editor-styles.runtime-mounts`, `editor-styles.compilations`, and `editor-styles.preferences-refreshes`. Timed samples use `editor-styles.compile` and `editor-styles.preferences-refresh`. Counters persist across `reset()` so active gauges remain correct; use differences from a captured baseline or hard-reload for a fresh measurement.

`compile-editor-styles.ts`, validation/security restrictions, supported selectors, size limits, override ordering, and public syntax are unchanged. CSS still compiles with `[data-document-styles]`. Settings drafts remain separately scoped and do not publish to documents before Apply. Autosave, dirty guards, editor JSON, undo, selection, and scroll code were not changed. No dependency, migration, or persistent-format change.

## Library decision

Reviewed [React useMemo](https://react.dev/reference/react/useMemo), [Strict Mode](https://react.dev/reference/react/StrictMode), and [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview). React memoization is a performance aid, not a durable cache guarantee; development replay can repeat calculation/effect setup. A single application-owned last-result cache addresses the exact compilation requirement. TanStack Query can manage fetching/caching but introduces a provider/dependency and still needs Orbium-specific broadcast, normalization, and compiler handling. The existing React/native BroadcastChannel solution was recommended to the user; no new library installed. CSSTree remains the existing parser and validator.

## Validation

- Targeted `npx vp fmt resources/js/components/editor/styles/editor-style-runtime.tsx resources/js/components/editor/styles/saved-editor-style-cache.ts resources/js/components/editor/document-editor.tsx resources/js/layouts/app-layout.tsx resources/js/lib/editor-performance.ts`: PASS, five files.
- `npm run types:check`: PASS.
- `npm run lint`: PASS; 262 files formatted, 198 files linted, no warnings/errors.
- `npm run build`: PASS; final build after the account-cleanup guard took 7.92 seconds. Existing large-chunk and ineffective dynamic-import warnings remain.
- `git diff --check` and untracked-file whitespace checks: PASS. Final source search confirms one runtime mount in the authenticated layout and none in document editors.
- Automated tests: neither written nor run. Root `AGENTS.md` and the user's supplied project instructions explicitly require manual testing and override the generic test gates, including the pasted request's test step.
- Browser/manual acceptance and performance measurements have not been performed. No speedup, runtime count observed in Chrome, or benchmark numbers are claimed.

## Runtime verification

Source evidence: the only runtime mount is in `AppLayout`; `DocumentEditor` has none. The runtime effect contains the sole persistent saved-style channel and listener. The settings sender remains short-lived. The last-result cache returns before invoking the unchanged compiler for an equivalent normalized configuration. These establish the intended ownership and code paths, not a measured browser result. Use the checklist below for runtime evidence.

Split panes are separate iframe documents with independent Inertia applications and stylesheets. Each iframe has one runtime of its own; the parent has one. Parent CSS cannot style iframe DOM. The one-runtime requirement applies per application shell/browser document, not across all iframe realms or browser tabs. Opening ordinary retained app tabs adds no shell or channel.

## Exact manual checklist in Chrome DevTools

Use disposable documents, including an ordinary and a database document. Save the current theme or export it before experimenting. Wait for Saved before hard reloading. Use development mode for counters, or a production build explicitly compiled with `VITE_ORBIUM_PROFILE=true`; ordinary production builds omit profiling. Keep the DevTools Console execution context on the top frame unless checking a pane.

1. **One document:** hard-reload an authenticated document with an enabled saved theme, then run:

   ```js
   document.querySelectorAll('style[data-editor-style-runtime]').length
   window.__ORBIUM_PERF__?.snapshot().counters
   window.__ORBIUM_PERF__?.summary().filter(row => row.name.startsWith('editor-styles.'))
   ```

   Expected: one style node; active runtimes `1`; active channels `1` if BroadcastChannel is supported; compilations `1` for enabled styles. Development Strict Mode can report two cumulative runtime mounts because setup/cleanup/setup is intentional; active gauges remain `1` and compilation remains `1`. Disabled styles have zero compilation attempts. In Elements, inspect an editor paragraph/heading's Computed styles and confirm the expected scoped rule.

2. **Five retained documents:** capture the counters, open and visit five ordinary app document tabs, and switch among them. Run the same queries. Expected: one node, one active runtime/channel, and no increase in compilation or preference-refresh counts while the theme is unchanged. Network filtered to `editor-styles/preferences` should show no request just from opening/switching documents. Every document retains its expected styles.

3. **Live change:** keep those tabs open, visit Settings → Editor styles → Customize styles, and change a visible paragraph/heading rule to valid CSS. Draft edits should affect only the preview. Capture counters immediately before Apply, then Apply. Expected: matching retained document blocks update on returning, without reload; compilation increases once for the changed enabled configuration; at most one preference GET per notification in the top frame. Settings preview validation is separate and is not counted as saved-theme compilation. Revisit all five preexisting tabs repeatedly: the changed theme must remain, with no recompilation or reversion to cached preferences.

4. **Equivalent refresh:** in Console run:

   ```js
   const initialPage = JSON.parse(document.querySelector('script[data-page="app"]').textContent)
   const styleNotification = new BroadcastChannel(`orbium-editor-styles-${initialPage.props.auth.user.id}`)
   styleNotification.postMessage('saved')
   styleNotification.close()
   ```

   Expected: exactly one top-frame preference GET, refresh counter increases once, compilation counter stays unchanged because saved preferences are identical. Network Initiator identifies the runtime. Inspect this separately from any iframe requests. Run this after an authenticated hard reload so the initial page contains the current account ID.

5. **Leave and return:** navigate between documents, explorer, databases, and Settings repeatedly. Expected: one style node/runtime/channel with no accumulating mounts in the persistent shell. Sign out after Saved: the authenticated runtime/node is removed. Sign into a different account: only its own preferences appear.

6. **Split/browser-tab updates:** create a split with two Saved documents, apply a style change from another same-origin browser tab, and select each iframe execution context in Console. Expected: each document has one style node/runtime/channel and receives the update; each iframe may fetch/compile once independently. Returning to ordinary retained tabs still shows the current theme. Count per frame rather than aggregating every browser document.

7. **Style/security parity:** import `Docs/examples/editor-theme.css`, add an override, and Apply. Inspect paragraphs, H1/H2/H3, bullet/ordered/checklists, quote, callout, code, tables, images, files, Mermaid, math, and dividers in documents and previews, including light/dark and RTL text. Expected: same scoped appearance and override precedence; settings/chrome unaffected. Try `body { color: red; }`, `.orbium-quote { position: fixed; }`, `@import`, URL values, and `!important` in a draft. Expected: existing validation rejects them. Disable and Apply, then re-enable: default/custom appearance switches without duplicating the runtime.

8. **Editor state:** type a marker, switch while saving, return, select text, scroll, and undo/redo; test a dirty close while offline and Retry after reconnecting. Expected: editing state, saves, selection/scroll, and dirty protection behave as before. Reload after Saved to confirm persistence. Theme changes must not create content revisions or undo entries.

## Risks

- Browser verification remains pending. No improvement is claimed for the large-document cold mount, DOM count, or warm-tab activation latency.
- Styles are now compiled at authenticated shell startup, including pages without editors. This pays one compilation for the shell in exchange for eliminating per-editor copies.
- BroadcastChannel support remains required for cross-document live notifications; unsupported browsers receive preferences through a subsequent successful server visit or reload. A cached local tab switch alone intentionally does not refresh preferences.
- Failed preference requests leave the last current theme and retry on later notifications/server visits. Concurrent account changes are isolated by the keyed runtime and request cleanup.
- The cache retains only the most recent configuration. Reapplying a genuinely different previous theme compiles again; this is intentional.
- HMR, reloads, account changes, and separately loaded iframe shells can add cumulative setup/compile counts. Compare stable per-frame counters without those events.

## Decision

`KEEP` for manual review: the focused lifecycle refactor removes duplicated source work without altering the compiler or editor state. Runtime acceptance is still pending the checklist above. No subsequent Performance Engine task or product phase was started.

## Commit suggestion

`perf(editor): globalize document style runtime`

No commit created. Keep the runtime, removal, instrumentation, and this report together in one logical commit after review.
