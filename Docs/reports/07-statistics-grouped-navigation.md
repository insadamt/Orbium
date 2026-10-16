# Statistics — grouped vertical navigation

Superseded by [the split insights review](07-statistics-split-insights.md).
The current UI uses an in-page split and icon controls; the earlier drawer and
More-button behavior below is historical.

Date: 2026-10-16.
Scope: approved Statistics UI review within the current polish milestone.

Later review: [details drawer](07-statistics-details-drawer.md) adds separate More
buttons to overview cards and summaries. It supersedes the display-only controls
and shortcut instructions below; card backgrounds remain static.

## Implemented

- Three grouped categories: Overview, Writing & content, and Storage.
- Desktop sticky vertical tabs with icons, labels, selected/focus
  background cues, roving tab focus, Arrow Up/Down, Home, and End navigation.
- Below 768px, the shared app selector replaces the desktop tabs.
- Overview contains three display-only metric cards (Words, Blocks, Storage used), applicable content organization,
  and compact task/upload summaries. Document scopes omit organization counts.
- Writing & content groups word/character totals, averages, tasks, block usage,
  and inline math. Writing and tasks share a row on wide screens.
- Storage retains the upload count/size breakdown and expandable details.
- Scope and Refresh remain shared above all categories. Counting rules remain
  in a shared disclosure below the category area.
- Category is stored in the URL; missing/invalid categories use Overview.
  Local Inertia navigation preserves loaded totals. Scope changes keep the
  selected category while fetching the new scope's data.
- Inactive panels stay mounted and hidden, retaining expanded details when
  switching categories.
- Category switches return to the category area's top only when it is above
  the viewport. Natural page scrolling remains; no nested scroll regions.
- Short panel transitions respect system reduced motion.

## Review correction — reduced text and visual weight

The user rejected the initial design as text-heavy. Removed the page subtitle,
decorative title icon, scope prompt, category descriptions, duplicate Overview
heading/introduction, metric footnotes, section-question subtitles, and repeated
counting hints. Smaller cards, tighter spacing, and a simple sidebar divider
replace the heavier navigation container. Numerical values and essential state
messages remain; counting explanations are available in the collapsed rules.

Additional manual review:

1. Open Statistics: expect only the title and scope selector in the header,
   compact icon/label tabs, and metric labels/values without descriptive footnotes.
2. Visit each category: expect section headings without question subtitles;
   verify totals, character disclosure, block expansion, and storage details.
3. At 375px and on desktop, check spacing, keyboard tab selection, reload
   persistence, and Light/Dark themes. Expect readable controls and no overflow.

## Review correction — display-only cards

Removed metric and summary card click actions, navigation arrows, button
semantics, and hover treatments. Categories change only through the navigation.
No commit created. Suggested follow-up message:
`refactor(statistics): make overview cards display-only`

## Review correction — top metrics

Removed Documents from the top cards; its count remains in Content for applicable
scopes. The three remaining cards share a row from 640px and stack below it.
Manual check: open Overview on desktop and mobile; expect only Words, Blocks,
and Storage used at the top, and Documents in Content for container/account scopes.
Suggested commit: `refactor(statistics): remove documents from overview metrics`

## Commits

No commit created. Suggested message:
`feat(statistics): group details into vertical category tabs`

## Migrations / persistent format changes

None. The optional `category` query parameter is presentation state. No API,
statistics definitions, storage data, dependencies, or historical tracking change.

## Validation

- `npm exec -- vp fmt` on changed TSX/CSS files: passed.
- `npm run types:check`: passed.
- `npm run lint`: passed (formatting and lint).
- `npm run build`: passed; existing mixed static/dynamic import, large chunk,
  and plugin timing warnings remain.
- `git diff --check`: passed.
- No automated tests written or run, per repository instructions.
- PHP formatting is not applicable: no PHP changes.
- Browser/manual checks are pending the user's review; no visual pass claimed.

## Exact manual checklist

1. Open `/statistics` on desktop. Expect Overview selected, three vertical
   categories on the left, and only Overview content visible. Scope, Refresh,
   and the counting-rules disclosure remain available.
2. Select Writing & content. Expect writing, characters, tasks, blocks, and
   inline math in this category, with no full storage table or organization
   section. On a wide screen, Writing and Tasks share a row.
3. Select Storage. Expect original file sizes, Images/Files counts and shares,
   total uploads, and expandable details; no writing/block sections.
4. Return to Overview. Click the metric cards and task/upload summaries.
   Expect no navigation or URL change, no arrow icons or interactive hover cues.
   Press Tab: expect cards to be skipped; change categories using navigation.
5. Expand character counts and Show all block types, switch to Storage, then
   back. Expect expanded choices preserved and all block counts unchanged.
6. Select Storage, reload, then change scope to another workspace. Expect
   Storage to remain selected, old scope totals to clear while loading, then
   only the new workspace totals. Inspect the URL for `category=storage`.
7. Open `/statistics?category=unknown`. Expect Overview. Change categories,
   use browser Back/Forward and the app's navigation history. Expect the
   category to match the URL. Switch to another app tab and return; expect
   the Statistics category to match its saved location.
8. Open Statistics from a document, folder, and database. Expect originating
   page scope and Back to source to still work after category/scope changes.
   Individual documents omit organization counts and per-document averages.
9. Tab to the selected desktop category; use Arrow Up/Down, Home, and End.
   Expect selection/focus to move between categories, with wrapping arrow
   navigation. Press Tab: expect to enter the selected panel, skipping hidden
   panel controls. Scroll down, then choose a sticky tab: expect the next
   panel's top visible rather than remaining far down the page.
10. At approximately 375px width, expect a category selector instead of the
    sidebar, readable cards and storage rows, and no horizontal page overflow.
    Switch categories with touch and keyboard.
11. Check Light/Dark, Normal/Frosted, and system reduced motion. Expect readable
    surfaces, clear active/hover/focus cues, and no category animation when
    reduced motion is enabled.
12. Check an empty scope and a scope awaiting statistics rebuild. Expect explicit
    empty/pending messages; unavailable values show a dash, not invented zeroes.
    With loaded totals, go offline and press Refresh: expect the retry message
    and retained totals; switching categories still works. Reconnect and retry:
    expect current values. In the Network panel, switch categories without
    changing scope: expect no new statistics data request.

## Known limitations / stop gate

Writing & content can still scroll when all block types are expanded; grouping
reduces the default page length without hiding access to detailed metrics.
Manual layout, interaction, and accessibility verification remains with the user.
Historical Trends remains deferred. Stop here for this UI review.
