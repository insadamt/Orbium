# Board preview continuity — manual review

User review: unchanged loading/CPU/temperature was reported after this correction.
This report describes implementation, not accepted performance. Follow
`12-boards-cpu-followup.md`; thermal behavior remains unresolved.

2026-10-21. Follow-up to the user's rendering/loading complaint, within the existing
Board phase-4 correction. No later product phase or storage/API changes.

## Findings and changes

- Native diagrams created a new Document-style Mermaid session after surface
  eviction. Board fragments have no persisted Document preview endpoint, so that
  path repeated local rendering and idle scheduling. Native diagrams now render
  directly through the Board queue; its render slot awaits rendering/sanitization.
- Sanitized Mermaid results survive block unmount in a Board-scoped cache, bounded
  to 128 entries and 4 MiB estimated string storage, keyed by owner kind/node/source.
  Native hits reattach before paint with current colors and fresh SVG instance IDs.
  Fullscreen controls use the same prepared result. Completed uninterruptible work
  can populate the cache after culling without modifying the removed surface.
- Board table/linked Document sessions also seed from the prepared cache. Original
  Document ownership/server cache behavior remains in its existing session path.
- Math cache previously belonged to a disposable rich context. Board surfaces now
  share a scope across remounts, limited to 128 entries/4 MiB estimated string
  storage. Native prepared math attaches before paint. Default Document contexts
  remain independent, with the same new byte bound added to their existing count
  bound. KaTeX trust restrictions remain.
- Document refresh previously reset the current snapshot to null. It now leaves
  the same target's readable content visible until replacement arrives. Failure
  displays its error while preserving that content. Different targets and missing
  or unavailable resources cannot inherit it.
- Canceled queues and obsolete native render callbacks cannot overwrite a new
  source/edit mode. Queued cold work still yields to input. No live DOM/editor
  retention budgets were increased and no all-Board eager render was introduced.

## Verification

- `vp fmt`: passed on changed frontend files.
- `npm run lint`: passed; 680 files formatted, 572 files linted, zero warnings/errors.
- `npm run types:check`: passed (exit 0).
- `npm run build`: passed (21.98 seconds). Existing large-chunk,
  mixed-static/dynamic-import and plugin-timing warnings remain.
- `git diff --check`: passed.
- New source files stay below 500 lines; the native source block remains below
  500 lines as well.
- No automated tests written/run. Browser/performance/thermal acceptance remains
  manual; no timing improvement has been measured or claimed.

## Exact manual checklist

1. Reload [the local stress Board](http://localhost:8000/workspaces/1/boards/154).
   At 100%, pan right to the first Mermaid/math blocks and let them finish once.
   Pan far enough down to evict their live surfaces, then return to the same row.
   Expect prepared diagram/equation output to reappear without another native
   compilation/loading cycle while it is in the bounded cache. Record any flash.
2. Open a diagram's fullscreen control after returning; close it, change theme and
   revisit. Expect valid SVG, current colors and working controls. Duplicate a
   diagram on a smaller Board; expect independent SVG IDs/controls in both copies.
3. Edit a diagram source, finish, and pan away while it renders. Return; expect
   only the new source's result, no obsolete callback overwriting it. Undo/redo the
   change; expect each exact source to display its own prepared result when cached.
4. Repeat with a formula. Try invalid Mermaid/LaTeX, then correct it. Expect a
   readable error and successful corrected rendering; no stale error/preview.
5. In a Board with a linked Document, refresh its card on a throttled connection.
   Expect existing text to remain visible until the replacement arrives. Repeat
   offline; expect an error alongside the retained text. Reconnect/refresh; expect
   the original Document's current content. Its attachments/links retain ownership.
6. Remove/trash the linked target and refresh its metadata. Expect the existing
   unavailable-resource placeholder rather than retained source content. Repoint
   a card, if supported by the normal UI; it must not show the old target's source.
7. Use rich table cells/linked Document Mermaid and math. Edit/finish, pan away and
   return. Expect source-matched previews, ordinary cell tools, fullscreen and
   scroll continuity. Check a standalone Document too; editing and previews should
   retain their normal behavior.
8. Type, drag, resize, undo/redo, wait for Saved, and reload. Expect ordinary Board
   persistence and history. Reopening or exhausting the prepared cache can require
   rendering again; first-time cold loading is still possible.

## Commit suggestion

`perf(boards): reuse prepared previews and preserve content during refresh`
