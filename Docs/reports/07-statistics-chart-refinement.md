# Statistics chart presentation refinement

Date: 2026-10-16. Current Phase 7 Statistics milestone; no phase advancement.

## Changes

- Larger headline values with restrained surface shading and icon treatments.
- Responsive layout with full-width block composition, wider block usage, and
  supporting storage/content/checklist panels.
- Bar charts include scales, exact counts, percentage labels, and Count/Share
  controls. The percentage denominator includes all types, even when only the
  top six are visible. The active scale is explained below each chart.
- Added grouped block composition: Text, Structure, Lists & tasks, Media,
  Technical. All 19 block types belong to exactly one group. Counts, shares,
  and expandable group definitions accompany the stacked chart.
- Storage ring switches between byte size and unique upload count. Selecting
  an Images/Files legend entry shows its value and share in the ring center.
- Added words/document, blocks/document, and average original upload size.
  These use existing totals; zero denominators and unavailable totals show —.
- Refresh retains charts and their selected controls while fetching. A failed
  refresh explicitly marks displayed totals as the last loaded values.
  Initial loads and scope changes retain clear loading/error states.
- No dependencies, backend code, migration, or persistence changes.

## Checks

- Targeted formatting and lint: passed.
- `npm run types:check`: passed.
- `npm run lint`: passed.
- `npm run build`: passed with existing large chunk and ineffective dynamic
  import warnings.
- `git diff --check`: passed.
- No automated tests written or run, per user instructions. Browser review
  remains manual.

## Manual checklist

1. Open Statistics on desktop. Expect headline values, secondary character
   counts, three averages, and a full-width composition chart. Expect wider
   block usage beside storage, then content beside checklist progress.
2. Switch a bar chart from Count to Share. Expect the scale to change from
   0–largest count to 0–100%; counts stay unchanged and shares match the complete
   total. The explanatory scale caption changes. Switch back: expect the largest
   count to fill the track again.
3. Use more than six nonzero block types. Expect the top six shares to use all
   blocks as their denominator. Expand all block types: expect additional used
   types plus zero counts. Collapse: expect the top six again.
4. For a complete document, compare composition category counts to its block
   totals. Expect their sum to equal total blocks, with each type assigned once.
   Open What is in each group: expect readable definitions. Inline math must
   remain outside the composition total. Empty documents show no filled chart.
5. With image and file uploads of different sizes, switch the storage chart
   between Size and Count. Expect segment proportions and percentages to follow
   the chosen measure. Select Images, then Files: expect the ring center to show
   that category's value/share. Select the active category again: expect total.
   The legend must always retain exact upload counts and original byte sizes.
6. Compare averages against saved totals: words/documents, blocks/documents,
   upload bytes/unique uploads. Expect rounding for display only. No documents,
   no uploads, or unavailable source totals must show — rather than invalid
   division or invented values.
7. Throttle the network and press Refresh after selecting Share and an upload
   category. Expect existing charts/controls to stay visible and a refresh status
   message. Set Offline and refresh: expect an error, retry control, and a label
   identifying totals as last loaded. Restore network and retry: expect success.
8. Switch scope during slow loading. Expect old scope values to disappear and
   only the latest response to display. Recheck This page, workspace, account,
   reload persistence, split panes, and return-to-source navigation.
9. At approximately 375px width, expect single-column charts, wrapping average
   cards, and readable labels without horizontal page overflow. Check Light/Dark
   and Normal/Frosted. Use Tab and Enter/Space for Count/Share, Size/Count,
   category selection, and disclosure controls: expect all to operate.

## Ideas for a later extension

- Workspace comparison: words, documents, and storage by workspace. Requires an
  account-scoped grouped endpoint; no history tracking is needed.
- Document length histogram and longest documents: requires document-level
  summary queries and links to the corresponding documents.
- Storage ranking and referenced/unused split: requires scoped attachment usage
  aggregation; avoid scanning all document bodies on each Statistics request.
- Creation calendar: can summarize existing creation timestamps, clearly labeled
  as documents created rather than writing activity.
- Actual writing heatmap, growth trends, streaks: require deliberate event or
  snapshot retention. Existing current totals and updated timestamps cannot
  reconstruct reliable past word counts or writing sessions.

No commit was created. Suggested message:
`feat(statistics): refine chart presentation and add content composition`

Stop for manual review within the existing milestone.
