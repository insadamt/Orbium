# Phase 5 review — remove Opening after a split document is ready

Date: 2026-10-18.

## Problem and change

The screenshot shows an Opening surface above an already-rendered document. SplitWorkspace subscribed to the page cache but discarded the returned snapshot, then read readiness imperatively through hasRetainedDocument inside its tab render loop. The document workspace used the actual snapshot and mounted the editor, while memoized split output could retain the old loading component.

SplitWorkspace now uses the subscribed pages snapshot directly to decide whether each tab's matching document URL is ready. The loading component independently subscribes to the same tab/URL readiness, cancels its preparation effect on readiness, and renders nothing once that document exists. Loading content is therefore removed even if a caller has reused a previously constructed child tree. Cache entries for a different URL do not suppress genuine loading, and failed loads retain Retry.

This is a rendering-state fix; no CSS hiding or timeout workaround was added. No document/editor remount, persistence, dependency, backend, migration, or content-format changes. No commit created. Existing undo/redo work in the working tree was preserved.

## Validation

- `npm run types:check`: PASS.
- `npm run lint`: PASS; 559 files correctly formatted and 465 files linted without warnings or errors.
- `npm run build`: PASS (13.84 seconds), with large-chunk, ineffective dynamic-import, and plugin-timing warnings.
- `git diff --check`: PASS.
- No automated tests were written or run, per user instructions. Browser handoff acceptance remains pending manual review.

## Manual checklist

1. Hard-refresh with the pictured split saved. Expected: Opening appears only while its document is unavailable, then disappears completely when that document renders. There is no additional island above its cover/title.
2. Open a previously unvisited document in a split. Repeat left and right placement. Expected: the native document replaces its loading placeholder once, without leaving duplicate pane content.
3. Switch between several split groups and hover between their editors while loading completes. Expected: no stuck Opening state, duplicate loading surface, or unexpected editor reset.
4. In DevTools, throttle the network and reload a split. Expected: loading is visible during preparation and disappears after success. Temporarily go offline before loading: expected the existing failure message and Retry; restore access and retry, then verify the placeholder disappears.
5. Navigate a pane to a different document while its earlier document is being prepared. Expected: an old cache entry cannot remove the new document's loading state or leave the old Opening title above it.
6. Edit both documents, scroll each independently and use their TOCs. Move a block and undo/redo. Expected: this loading fix does not reset editors or alter existing split interactions.

Suggested commit: `fix(navigation): remove stale split document loading placeholders`

Remain in Phase 5 for manual review.
