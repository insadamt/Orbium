# Phase 5 review — editor, navigation, and database performance

Date: 2026-10-02

## Scope

Second performance batch, following the user's instruction to continue, extended to database rendering when the user requested further work during implementation. No later project phase was started. The first pass was already committed in the repository at the start of this batch; this report covers only the new changes.

## Implemented

- Autosave now queues immutable ProseMirror document snapshots. Full JSON generation moves from every content update to the start of each save request. The existing 700 ms debounce, one-request-at-a-time behavior, revisions, retry handling, and navigation/unload guards remain in place. A failed older request cannot replace a newer pending snapshot.
- The floating document finder debounces match counting by 150 ms. No count listener is attached when its query is empty. Enter/Shift+Enter still reads the latest content immediately and updates the count. Closing the finder, changing the query, and leaving the document cancel pending count timers.
- Match positions are cached by editor, document snapshot identity, and query. Moving the selection can reuse positions; editing, undo/redo to another snapshot, or changing the query computes fresh positions. Only the latest result per editor is retained in a WeakMap. Backward match navigation no longer copies and reverses the match array.
- Restored split groups do not mount their iframe applications until first activated. Once visited, their frames stay mounted across group switches, preserving editor state, scroll, and pending saves. This reduces startup work for unvisited groups; it does not suspend or reclaim memory from already-visited groups.
- Search Master reuses explorer hierarchy props instead of fetching the same workspace tree again. On document/database pages, its tree request begins when Search Master opens and is canceled on close/context change. Aborted responses cannot overwrite the current context. Existing creation-context readiness guards remain active while the tree loads.
- DOMPurify now loads with Mermaid when a diagram preview is needed. Rendering still waits for the sanitizer, and every preview is sanitized with the same SVG profile. This removes sanitizer code from the initial document page entry without removing any supported editor languages or blocks.

## Library and implementation choice

No packages added or upgraded.

Reviewed [ProseMirror's immutable document model](https://prosemirror.net/docs/guide/) to confirm that holding a snapshot is safe without cloning it. The installed Tiptap `Editor.getJSON()` implementation delegates to `state.doc.toJSON()`, so the wire representation remains the same.

Reviewed [React Activity](https://react.dev/reference/react/Activity). It can retain React state while cleaning up hidden effects, but wrapping the outer iframe component does not selectively pause the independently mounted editor app inside it. Applying effect teardown to autosave indiscriminately would also require a separate lifecycle design. This pass uses a small first-activation gate and keeps visited panes alive.

Reviewed [Lowlight's grammar registration](https://github.com/wooorm/lowlight). Removing the common-language registry would change existing highlighting/auto-detection support. That is not used as a bundle-size shortcut. Larger editor splitting remains a separate task with loading/error-state implications.

## Build-size evidence

Measured the existing production entry files before the changes and the rebuilt entry files afterward. Gzip measurements use Node's `gzipSync` with the same default settings for both; Vite's displayed gzip figures use different settings and should not be mixed with this table.

| Entry | Before minified bytes | After minified bytes | Before gzip bytes | After gzip bytes |
| --- | ---: | ---: | ---: | ---: |
| Document page | 1,085,519 | 1,057,297 | 339,313 | 328,451 |
| App | 599,758 | 600,035 | 187,036 | 187,159 |

The document entry is 28,222 bytes smaller, or 10,862 bytes smaller with this gzip setting. The app entry grows by 277 bytes, or 123 compressed bytes, for navigation lifecycle logic. These are entry-file measurements, not total route transfer size or runtime latency. Diagram pages still download sanitizer code when used. Large-chunk warnings remain.

After the subsequent database changes, the entry byte sizes remain the same. Hash changes in imports slightly change final gzip sizes: document entry 328,438 bytes and app entry 187,171 bytes. The final combined build passes the same checks below.

## Validation

- `npm run types:check`: PASS.
- `npm run lint`: PASS; 191 formatted files and 131 linted files in the configured scope.
- `./vendor/bin/pint --test`: PASS.
- `npm run build`: PASS; existing chunks above 500 kB remain.
- `git diff --check`: PASS.
- Targeted frontend formatting applied.
- Automated tests were neither written nor run, per user instructions.
- No browser performance traces or interactive runtime verification were performed. No FPS, input-latency, or memory reduction is claimed as measured.

## Manual validation

Use disposable documents and wait for Saved before refreshing except where an unload guard is intentionally being checked.

1. In a long document, type quickly for several seconds, stop, and wait for Saved. Refresh. Expected: all edits persist; the save begins after the normal debounce rather than on each keypress. Repeat with paste, undo/redo, tables, images, mentions, and math.
2. With browser Network throttling enabled, start an edit and wait for its PUT request to begin. Continue typing while that request is in flight. Wait for Saved, then refresh. Expected: the latest content persists, with serialized saves and advancing revisions.
3. Go offline, edit a document, and wait for Save failed. Make another edit, reconnect, and choose Retry or press Ctrl+S. Expected: the newest edits save, not only the snapshot from the failed request. Do not refresh while still offline.
4. Edit a document and immediately click a breadcrumb or another app tab. Expected: the existing save guard prevents leaving with pending content, shows its notice, and flushes the save. Navigate again after Saved. Expected: the right document opens and the saved content is retained. Ctrl+S should flush without the normal debounce when no request is in flight.
5. Open the same disposable document in two browser tabs. Save an edit in one, then edit the stale copy in the other. Expected: the existing revision-conflict message appears instead of silently overwriting the newer server revision.
6. Open the floating page finder on a long document, type a repeated word rapidly, and pause. Expected: the count settles after approximately 150 ms. Press Enter before that delay, then Enter/Shift+Enter repeatedly. Expected: current matches are selected immediately, in the right order, including wraparound.
7. With a finder query active, add/remove matching text, then undo/redo. Expected: the count refreshes after settling and navigation uses current match positions. Clear/close the finder or navigate away while counting is pending. Expected: no stale count appears on the new page. Also verify the existing Ctrl+F finder still selects matches.
8. Prepare two split groups and an ordinary app tab, select the ordinary tab, then reload with DevTools Network open. Expected: dormant groups do not load their iframe documents on startup. Activate one group: only that group's frames load. Activate the other group: its frames load on first use. Revisiting either group must not reload its frames merely because it was hidden.
9. In a visited split group, scroll each pane to a different position, edit, then switch groups and return. Expected: scroll and editor state remain intact, pending saves continue, and neither pane resets. Repeat with a split group active during reload; that active group should load normally.
10. In DevTools Network, filter for `/tree`. Open workspace root and folders, then open Search Master. Expected: the navigation component adds no duplicate tree request because it uses the page's existing hierarchy. Search and create commands must use the correct current container.
11. Open a standalone document/database page with Search Master closed. Expected: the navigation component does not fetch `/tree` yet. Open Search Master: the tree loads, and creation remains guarded until context is ready. Close/reopen while throttled, and switch workspaces. Expected: no stale response changes the current context; document/database creation lands in the correct container.
12. Using a production build with a cold browser cache, open a document without Mermaid, then one with a diagram. Expected: ordinary document editing does not require the sanitizer chunk; the Mermaid preview loads and renders safely when needed. Edit invalid Mermaid syntax and fix it. Expected: the existing recoverable error and latest valid preview.
13. Repeat save/search/navigation basics in light/dark mode, reduced motion, and narrow/wide layouts. Expected: the first pass's microanimations and all focus/keyboard behavior remain intact.

## Compatibility and remaining work

No migrations, editor JSON schema changes, persistence-version changes, or dependency changes. No commits were created in this batch.

Remaining: reclaiming/suspending visited inactive iframe work, large database virtualization, more extensive editor splitting, search query-plan analysis, browser profiling, and coordinated layout motion. Save-time JSON serialization is still synchronous; this pass removes repeated typing-time serialization rather than eliminating the cost entirely. The match cache does not change the existing text-node-local matching semantics.

## Database continuation

Following the user's additional `continue` message:

- Added a derived document/property value index, rebuilt only when the server's values array changes. Table cells, Gallery, filters, and sorts share it. This removes a full values-array scan from each cell/filter/sort lookup; the server remains the source of truth.
- Property lookup during filtering uses a map. Sorting reuses an `Intl.Collator` with the existing numeric comparison behavior; tie-breaking by document ID is preserved.
- Split property filtering/sorting from title filtering. Typing a title query now filters the previously sorted result instead of rerunning property comparisons.
- Closed property pickers no longer build mention/select option lists. Existing file lists are reused until an upload actually adds local files. Reference cells resolve only the displayed first label and use the selected-ID count for the existing `+N` indicator.
- Column-resize updates are coalesced to one per animation frame. Pointer release cancels pending work and applies the final width before saving; cancellation/lost capture restores the initial width. Keyboard resize remains immediate.
- Gallery covers use native lazy loading and asynchronous decoding within their existing reserved preview area.
- Database toolbar/icon controls and menus use the same reduced-motion-aware press, highlight, and entry feedback introduced in the first pass. Database menu entry uses opacity only, retaining overlay positioning.

Library decision: native Map, Intl.Collator, requestAnimationFrame, and image loading attributes suffice for these changes. No dependency was added. The previously reviewed TanStack Virtual remains a candidate if browser profiling identifies remaining DOM/scroll bottlenecks; it would require separate editable-cell focus and sizing integration.

### Additional manual checklist

1. Open a database containing every supported property type, including missing/null values, false checkboxes, zero numbers, multi-selects, mentions, and files. Switch Table/Gallery. Expected: the same cell values and reference labels in both views; missing references retain their existing fallback labels.
2. Configure numeric ascending/descending sorts, then a second sort with tied values. Include values such as 2 and 10. Expected: numeric-aware ordering and stable ID tie-breaks match the previous behavior. Rename a document and refresh; title sorting must update.
3. Apply `is`, `is_not`, `contains`, and `is_empty` filters. Type and clear the floating title query. Expected: correct document set and count, with property filters/sorts still applied. Repeat in Gallery with its own configuration.
4. Edit each property type and wait for its partial reload. Expected: values update immediately after the response, and documents enter/leave filtered results or move to their sorted position correctly. Refresh to verify persistence. Simulate an offline property save with disposable data. Expected: the existing error and draft rollback remain available.
5. Open select, multi-select, mention, date, and file pickers using mouse and keyboard. Type in the picker search, select/deselect options, upload a file, and reopen. Expected: full choices appear on opening, search remains correct, selected states persist, and uploaded file labels remain visible. Check property editing inside a database document too.
6. Drag a column edge quickly across its range and release; refresh. Expected: the final width persists within the existing 120–480 px limits. Cancel a touch/pointer drag or lose capture. Expected: the initial width returns without a queued frame restoring the abandoned width. Focus the resize separator and use Left/Right. Expected: keyboard resizing still changes and saves width.
7. Open Gallery with enough cover images to scroll. Expected: covers load near the viewport without changing card height; unavailable images still fall back to body/icon previews. Switch cover/body/none modes and refresh.
8. Open database menus, press toolbar controls, and repeat with reduced motion enabled. Expected: brief feedback normally, no new motion in reduced-motion mode, correct focus and Escape behavior.

All checks were rerun after these database changes and passed. No automated tests, browser benchmark, or real-data runtime verification was run. The table still mounts every matching row; value indexing and deferred picker work do not claim to solve unbounded DOM size. The index adds memory proportional to the current values array.

Additional suggested commits:

- `perf(databases): index property values and reuse sorted results`
- `perf(databases): defer picker work and coalesce column resizing`
- `feat(motion): extend interaction feedback to database controls`

Suggested commits:

- `perf(editor): defer autosave serialization and cache document matches`
- `perf(navigation): defer restored panes and reuse explorer hierarchy`
- `perf(editor): load diagram sanitizer on demand`

Stop for manual review within the current Phase 5 scope.
