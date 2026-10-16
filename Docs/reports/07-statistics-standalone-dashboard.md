# Statistics standalone dashboard

Date: 2026-10-16. Phase 7 Statistics review milestone; no new phase started.

## Implemented

- Replaced the Statistics dialog with a dedicated page opened in a new app tab.
  Source editors remain in their existing tabs. Embedded/split page buttons
  open the new tab in the parent app.
- Preserved originating page/workspace scope, URL-based selection, and a Back
  link that activates the source tab if it still exists.
- Added Lucide icons, four headline metrics, secondary character counts,
  content and block bar charts, an upload-size ring, and checklist progress.
- Show the six most-used nonzero block types initially; allow expanding all
  types including zeroes. Exact values accompany charts. Charts use theme-aware
  monochrome styling and do not rely on animation or color alone.
- Kept workspace count, database entries, inline math, unique uploads, and
  counting rules available. Rules use an expandable section.
- Retained loading, retry, empty, incomplete statistics, and request cancellation.
  No new dependencies, backend changes, migrations, or content format changes
  were introduced by this UI change. Existing uncommitted statistics work was
  preserved.

## Validation

- Targeted formatting/lint: passed.
- `npm run types:check`: passed.
- `npm run lint`: passed (formatting and lint).
- `npm run build`: passed; warnings about existing large chunks, ineffective
  dynamic imports, and plugin timing remain.
- `git diff --check`: passed.
- No automated tests written or run, per repository/user instructions.
- Browser appearance and interactions await the user's manual review.

## Exact manual checklist

1. Open a document and click the chart icon. Expect a new Statistics app tab,
   no dialog, This page selected, and that document's saved counts. Return using
   Back to the document: expect its existing tab and editor state.
2. Repeat from a folder and a database. Expect the originating container's
   descendant totals. Repeat from workspace root and Library: expect that
   workspace. Open from Settings: expect All workspaces.
3. Select All workspaces, a different workspace, then This page. Expect matching
   totals each time, with the originating page still available. Reload at each
   scope: expect the selected scope to persist. Open `/statistics` directly:
   expect the account overview; selecting any workspace must work after reload.
4. Use a workspace containing folders, documents, a database, and uploads.
   Expect headline counts and content bars to match saved items; database
   entries must not be double-counted as additional documents.
5. Save a document containing two paragraphs, one heading, checked/unchecked
   tasks, and inline math. Open its Statistics page. Expect matching exact
   block counts, checklist percentage and counts, and separate inline math.
   Expand Show all block types: expect zero types too. Collapse: expect only
   the six most-used nonzero types (or fewer when fewer types are used).
6. Use a scope with both image and non-image uploads. Expect ring segments
   proportional to original byte sizes, with exact category sizes and counts.
   Reuse an upload twice: expect unique uploads counted once. Use only files,
   only images, and no uploads: expect full appropriate rings or a neutral empty
   ring with 0 B, without invalid chart geometry.
7. Open an empty workspace/document. Expect explicit empty messages, zero counts
   for complete statistics, and no misleading bars. If pending documents exist,
   expect Updating statistics, dashes for unavailable metrics, and explanatory
   chart placeholders. Refresh must not start a rebuild.
8. Save content in the source tab, return to Statistics, and press Refresh.
   Expect updated saved totals. Switch scopes rapidly using browser throttling:
   expect only the latest scope's result. Use DevTools Offline and Refresh:
   expect an error with Try again; restore network and retry successfully.
9. In split view, click each pane's chart button. Expect each pane's own source
   page selected in a Statistics tab in the parent app.
10. Check desktop and approximately 375px mobile width in Light/Dark and
    Normal/Frosted modes. Expect readable icons, values, legends, and controls;
    stacked sections on narrow screens; no horizontal page overflow. Use keyboard
    navigation for scope selection, Refresh, block expansion, counting rules,
    and Back. Expect all controls to operate.
11. Expand How these numbers are counted. Expect scope-appropriate upload rules,
    Trash exclusions, block rules, and original-file-only storage explanation.

## Limitations and commits

Charts describe current saved content; history is outside this milestone.
No browser checks were run. No commit was created.

Suggested commit: `feat(statistics): add standalone dashboard with icons and charts`

Stop for manual review within the current milestone.
