# Statistics — split insights and metric charts

Superseded by [independent insight pages](07-statistics-independent-pages.md).
The current workspace places two separate page surfaces alongside each other;
the nested in-page split described below is historical.

Date: 2026-10-16.
Scope: correction within the current Statistics polish review. This supersedes
modal-drawer behavior in the preceding report; no product-phase advancement.

## Implemented

- Replaced the fixed modal drawer with two in-page columns. At desktop widths
  the layout animates between the full main pane and an equal main/insight split.
  Both sides remain interactive. There is no overlay, portal, body-scroll lock,
  outside-click dismissal, or focus trap.
- Shared scope selection and Refresh remain above the split. The main pane's
  category navigation becomes a compact selector while split. On narrower
  screens, insights stack below the main content and opening scrolls to them.
- Replaced More text buttons with compact split-pane icons in card headers.
  The selected metric has a visual cue; card backgrounds remain static.
  Documents stays out of the top cards and remains under Content.
- Inspect another metric while the pane is open to replace its contents directly.
  Content organization has an inspect control too. Scope changes reset the local
  insight selection; category changes may retain it for comparison.
- The insight region has an explicit accessible heading, current scope, Close
  control, a sticky position, and a scrollable body on desktop. Opening focuses
  the region. Escape inside it or Close returns focus to the originating inspect
  control, or to the main pane if the control belongs to a hidden category.
- Closed content is inert and hidden from accessibility navigation. Reduced
  motion disables the split transition. Mobile uses natural stacked scrolling.

## What each insight displays

| Metric | Headline / supporting values | Chart |
|---|---|---|
| Writing | Words, characters, characters without spaces, words/document where applicable | Non-space character vs space composition |
| Blocks | Total, types used, inline math, blocks/document where applicable, most-used type/share | Ranked horizontal counts with top/all expansion |
| Tasks | Total checklist items and completion percentage | Completed/remaining composition with exact counts |
| Storage | Original bytes, unique uploads, average file size | Images/Files byte composition plus exact count/size table |
| Uploads | Unique count, total bytes, average file size | Images/Files count composition plus exact table |
| Content | Documents/folders/databases, with workspaces counted separately | Horizontal type counts/shares; entries are included in documents |

Composition charts support pointer hover, keyboard-focusable legend controls,
and touch selection. Segment values appear in the center, and each legend keeps
exact counts/sizes and percentages readable independently of the SVG. Block and
content charts also expose values as text. Empty charts use a neutral track;
pending groups show an explicit pending state instead of a fabricated chart.

Charts use current saved summary data only. Inspecting and switching metrics
adds no requests. No history, migrations, API changes, archive changes, new
packages, or database queries are introduced.

## Commits

No commit created. Suggested message:
`feat(statistics): add split insights with interactive metric charts`

## Validation

- `npm exec -- vp fmt` on changed frontend files: passed.
- `npm run types:check`: passed.
- `npm run lint`: passed, including formatting verification.
- `npm run build`: passed; existing large-chunk, mixed static/dynamic import,
  and plugin-timing warnings remain.
- `git diff --check`: passed.
- No automated tests written or run, per the user's instructions.
- No PHP changes, so PHP formatting is not applicable.
- Manual browser/layout verification is pending the user's review; no visual
  or accessibility pass is claimed.

## Exact manual checklist

1. Open Overview on desktop. Expect Words, Blocks, and Storage cards with small
   inspect icons in their headers. Expect no More labels and no card-wide links.
   Click blank card space: expect no action. Documents remains in Content.
2. Inspect Writing. Expect an animated two-column layout with the summary still
   usable on the left and Writing insights on the right. Click a different metric
   while open: expect that same pane to update without closing first.
3. Keep insights open and use scope, Refresh, category selector, and main-page
   controls. Expect no blocked page or overlay. Outside clicks must leave insights
   open. A different scope must clear the old insight selection and old totals.
4. Compare Writing's headline with its card. Characters without spaces plus
   Spaces must equal Characters; legend percentages use that character total.
   Per-document averages appear only for multi-document scopes, with a dash
   when there are no documents.
5. Inspect Blocks. Expect total, used type count, inline math, applicable average,
   and most-used type/share to agree with the saved statistics. Show all types
   includes zero-valued types; chart percentages use all blocks, not only top rows.
6. Inspect Tasks. Expect checked plus remaining to equal total, and the default
   center to show completion percentage. For zero tasks, expect a neutral ring,
   zero counts, and an explicit empty message rather than division errors.
7. Inspect Storage, then Uploads. Storage ring shares must follow original bytes;
   Uploads ring shares must follow unique counts. Exact Images/Files count/size
   rows agree in both panes. Average size is total bytes divided by unique count;
   with no uploads it shows a dash. Zero-byte uploads still appear in count view.
8. Inspect Content on an account/container. Expect document/folder/database bars,
   with workspaces separate. Entries are included in Documents rather than added
   twice. An individual document omits the Content section/inspect control.
9. Hover a composition segment or legend, focus legend buttons with keyboard,
   and tap them on touch. Expect the matching center value and exact legend
   values/shares to remain accessible. All totals stay unchanged by exploration.
10. Open with keyboard Enter/Space. Expect focus in the named insight region.
    Tab may move between panes; it must not be trapped. Escape inside insights
    closes them. Expect focus back on the inspect control; if its category was
    hidden, expect focus in the main pane. Closed insight controls are skipped.
11. Scroll long insight content on desktop. Expect its header/Close to remain
    available and the left side to remain usable. Close and reopen repeatedly:
    expect the layout to expand/collapse without a leftover offset or scroll lock.
12. Check approximately 1024px, a large desktop viewport, and 375px. Desktop
    should split without overlap; small screens should stack, scroll the selected
    insight into view, and avoid horizontal page overflow. Close restores the
    main layout. Large counts and sizes must remain readable.
13. Check Light/Dark, Normal/Frosted, and OS reduced motion. Expect clear selected
    icons, readable chart segments/values, and an immediate split change with
    reduced motion enabled.
14. Inspect empty and pending scopes. Expect zeroes only for available zero
    metrics; unavailable groups must stay pending. Open multiple insight types
    while inspecting Network: expect no new statistics request. Refresh while
    offline: expect retained totals and the existing retry state; reconnect and
    retry to recover both panes consistently.

## Known limitations / stop gate

Historical trends remain deferred; these charts describe current saved content.
Narrow screens stack the panes to preserve readable content. Pane selection is
local and resets when the data scope changes; category selection remains in URL.
Manual review is outstanding. Stop here for the user to inspect this revision.
