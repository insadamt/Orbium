# Statistics simplified layout

Date: 2026-10-16. Phase 7 Statistics review milestone; no new phase started.

## Changes

Implemented the structure agreed with the user, giving writing and workspace
management equal emphasis:

- Scope controls and the active scope name/type appear before the totals.
- Overview has four metrics: Documents, Words, Blocks, Storage used.
- Writing owns total words and words/document. Character counts expand here.
- Content uses compact icon/count rows. Individual documents omit this section.
  Database entries are explicitly included in the Documents count.
- Blocks uses one sorted horizontal chart. Counts are primary; small percentages
  use all blocks as the denominator. Expand all types to include zeroes.
  Average blocks/document and separate inline math counts stay in this section.
- Tasks reads X of Y completed, with a single progress bar and remaining count.
- Storage uses a simple proportional Images/Files bar and a category table with
  exact counts and sizes. Average upload size lives in expandable Storage details.
- Removed composition chart, separate averages cards, chart measure switches,
  selectable storage ring, and asymmetric grid. Deleted their unused components.
- A narrower single-column page preserves reading order on all screen sizes.
- Existing scope navigation, source tab return, refresh, saved-data semantics,
  incomplete statistics, and request cancellation remain in place.
- No backend changes, dependencies, migrations, or persistence changes.

## Validation

- Targeted formatting/lint: passed.
- `npm run types:check`: passed.
- `npm run lint`: passed.
- `npm run build`: passed, with existing large chunk and ineffective dynamic
  import warnings.
- `git diff --check`: passed.
- No automated tests were written or run, following the user's instructions.
- Visual layout and interactions await manual browser review.

## Manual checklist

1. Open Statistics from a workspace with saved content. Expect this order:
   scope/Refresh, Overview, Writing, Content, Blocks, Tasks, Storage, counting
   rules. Expect no composition chart or chart measure switches.
2. In Overview, expect Documents, Words, Blocks, Storage used. In Writing,
   expect total words and average words/document. Expand Character counts:
   expect with-spaces and without-spaces values. Collapse: expect them hidden.
3. Open Statistics from a single document. Expect that document's scope, no
   Content section, and no words/document or blocks/document averages. Return
   to its source: expect the original editor tab. From a database, expect
   database entries clearly marked as included in Documents.
4. Use a scope with at least seven nonzero block types. Expect the six most-used
   types initially, sorted by count. Each row shows an icon, count, percentage,
   and bar. Percentages use all blocks, not just the visible six. Expand Show all
   block types: expect every type including zeroes. Collapse: expect top six.
   Inline math must remain below the chart and outside the block total.
5. Use a document with three checklist items, two checked. Expect 2 of 3
   completed, 1 remaining, 67% complete, and a bar filled about two-thirds.
   A document with no tasks should show an explicit empty message.
6. Use a scope with images and other files. Expect one proportional size bar
   with a matching two-category table, exact unique counts, original sizes,
   shares, and totals. Expand Storage details: expect average upload size and
   inclusion rules. Reused uploads must count once. With no uploads, expect
   0 B, zero counts, an empty bar, and a no-uploads message.
7. Switch page, workspace, and account scopes and reload. Expect the selected
   scope to persist and source navigation to work. On a slow connection, Refresh
   keeps current totals visible. A failed refresh identifies last-loaded values
   and offers retry. Rapid scope changes must only display the latest response.
8. Check an empty workspace and, if available, a pending-statistics scope.
   Expect zeroes for complete empty totals, dashes/placeholders for unavailable
   totals, and no invalid percentages or averages. Refresh must not save the
   source editor or start a rebuild.
9. Check desktop and approximately 375px mobile width, Light/Dark, and
   Normal/Frosted. Expect the same reading order, readable rows/tables, and no
   horizontal page overflow. Use keyboard navigation and Enter/Space for scope,
   Refresh, Character counts, block expansion, Storage details, and counting rules.

## Commits and limitations

No commit was created. No browser checks were run. Historical charts and new
statistics are outside this presentation change.

Suggested commit:
`refactor(statistics): simplify sections and chart presentation`

Stop for manual review within the current milestone.
