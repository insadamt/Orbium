# Statistics

Approved 2026-10-15 as one review milestone; no advancement to another product phase.

Future work: [Advanced statistics plan](22-advanced-statistics-plan.md) is
reserved as the final feature before V1. Historical tracking remains unimplemented;
this document describes the current saved-content statistics.

## Opening statistics

The chart button in the floating navigation opens a dedicated Statistics page
in a new app tab, preserving the source editor tab. On a document, folder, or
database it selects This page; on a workspace root or Library it selects that
workspace; elsewhere it selects All workspaces. Embedded/split pages open the
Statistics tab in the parent application, using their own page context.

The scope selector offers the originating page, All workspaces, and owned active
workspaces. Scope selection and originating page context are stored in the URL
and survive reload. Back to the source activates its existing app tab when
available, otherwise it navigates to the source. The sidebar opens `/statistics`
as an account overview. Statistics is absent from item action menus.

## Display structure

Card overview review (2026-10-16) supersedes category navigation. Statistics
shows one compact overview with no vertical tabs, mobile category selector, or
hidden detail panels:

- Words, Blocks, and Storage used cards at the top.
- Content organization for applicable scopes; Documents stays here rather than
  returning to the top cards.
- Compact Tasks and Uploads summary cards.
- A shared expandable counting-rules disclosure.

Each section/card has an inspect icon that opens its detailed insight page.
Detailed values and charts live only in those pages. Scope selection and Refresh
remain above the overview. Redundant descriptions and More labels remain absent.
The former `category` query parameter is ignored and removed when constructing
scope/insight/return navigation URLs, so old category links still reach Overview.

Independent insight pages review (2026-10-16) supersedes the nested split
implementation. The Statistics page and insight page are separate sibling page
surfaces, each with its own header, background, border, padding, and content.
There is no split inside the Statistics card. The workspace layout animates the
whole Statistics page into the left 40% and gives the insight page all of the
remaining width after a 24px gap. The companion page has no narrow fixed width
or inner panel divider. Closing restores the centered Statistics page.

Each inspect icon selects a metric for the right page. Both pages remain usable;
card backgrounds remain static. The insight page has its own Refresh control and
scrolling content. Its Open insights page action opens the real standalone route
`/statistics/insights/{metric}` in an app tab, preserving scope query parameters.
That route can be opened directly or reloaded and uses the existing owner-scoped
statistics data endpoints. Unknown metric slugs return 404.

Below 1024px, inspecting navigates directly to the standalone page, with a
Statistics return control preserving the original scope. If an already
open desktop companion is resized below that width, its surface fills the
workspace until closed. On desktop, Escape inside the companion page or Close
returns to the centered main page and restores focus to the originating control,
or to the main page if that control is hidden. Outside clicks leave it open.
There is no overlay, portal, focus trap, or background scroll lock. Closed page
content is inert. Reduced motion disables the workspace transition. Scope changes close the
companion. Cards adapt to their available page width.

The companion reuses the loaded summary and Refresh updates both pages. A
standalone insight page fetches its own summary. Both expose pending/error/retry
states using the existing request flow. Charts use the available page width;
composition rings grow on wider insight pages.

Insight presentation:

- Writing: word total, characters with/without spaces, applicable words/document
  average, and a character composition ring for non-space characters and spaces.
- Blocks: total, types used, applicable blocks/document average, inline math,
  most-used type/share, and a ranked horizontal distribution chart with top/all
  controls. Full counts remain available including zero types.
- Tasks: total checklist items and a completed/remaining composition ring with
  exact counts and completion percentage. Empty tasks have an explicit state.
- Storage: original byte total, unique uploads, average file size, an Images/Files
  size-composition ring, and the exact count/size table.
- Uploads: unique count, total size, average size, an Images/Files count-composition
  ring, and the exact table. Count and size charts intentionally use different
  denominators; reusing an upload still counts it once.
- Content: document/folder/database counts and shares in a horizontal chart;
  workspaces remain a separate count. Database entries remain included in
  Documents rather than being added as another category.

Composition chart legends expose values and percentages as buttons. Hovering,
touching, or keyboard-focusing a legend shows that segment in the chart center;
values also remain readable without the graphic. Empty charts show zeroes and a
neutral track; unavailable derived metrics remain pending. All charts describe
saved current content; no historical timeline is invented. General counting
rules remain in their shared disclosure.

Documents remains in Content and is omitted from the top cards. Metric columns
adapt to available width, including while the companion page is open.

Blocks initially show up to six used types; Show all block types includes
zeroes. Exact counts are primary, percentages use the complete block total,
and bars scale against the largest displayed count. Average blocks per document
appears for multi-document scopes; inline math is counted separately.
Database entries remain labeled as already included in Documents.

General counting rules are expandable; character and storage details are
available in their insight pages.
Averages with no denominator and incomplete totals show a dash. Loading, retry,
empty, and pending states remain explicit. Refresh retains loaded values and
labels stale totals on a failed refresh; changing scope clears old scope data.
This presentation adds no history, migrations, dependencies, or backend changes.
See [the card overview report](../reports/07-statistics-card-overview.md) and
[the independent pages report](../reports/07-statistics-independent-pages.md).

Statistics describe saved content. Open, change scope, or press Refresh to fetch
current totals. There is no polling, typing listener, or per-keystroke calculation.
Main content counts exclude Trash, trashed workspaces, and all descendants of
trashed ancestors. A folder counts its descendants rather than itself. Database
documents remain documents; database scope also labels their count as entries.

## Writing

Show words, characters with spaces, and characters without spaces. Project text
from the canonical Markdown AST or legacy editor JSON. Do not change search text.
Include code, table text, mention/link labels, image alternative text/captions,
file labels, and math/Mermaid source. Exclude formatting syntax, hidden link
destinations, titles, database properties, and uploaded file contents.

Normalize Unicode whitespace/separators to one ASCII space and trim the result.
Character counts use Unicode code points, not bytes or grapheme clusters. Words
are Unicode letter/number sequences with combining marks and internal ASCII
apostrophes, curly apostrophes, or hyphens. Language-specific segmentation is
deferred; a continuous sequence of CJK letters is one word under this rule.

## Blocks

Each type has its own row: Paragraph, Heading 1, Heading 2, Heading 3, Heading 4,
Heading 5, Heading 6, Bullet list item, Numbered list item, Checklist item, Quote,
Callout, Code, Table, Image, File, Divider, Mermaid, Math block.

- Total blocks is the sum of those rows, including zero-valued types.
- Count list/checklist items separately, including nested items. Their ordinary
  paragraphs and list containers do not add blocks.
- Quote/callout ordinary paragraphs do not add blocks; distinct nested blocks do.
- A table counts once. Rows, cells, and all blocks inside cells do not add blocks.
- Metadata/style wrappers do not count; Mermaid and callout structures are not
  counted again as code and quote blocks. Forced code remains code even if its
  language is Mermaid.
- Exclude empty paragraphs and explicit empty placeholders. Other explicit block
  types still count when empty.
- An image/file-only Markdown paragraph does not add a paragraph block. Repeated
  media placements each count as a block independently of unique upload counts.
- Inline formatting, code, links, and mentions do not add blocks. Inline math has
  a separate usage count outside total blocks, including formulas in tables.
- Show checked and unchecked checklist items; their sum equals checklist items.

## Uploads and storage

Show Images, Files, and Total uploads, each with count and original size. Use
the existing Library image MIME classification, with everything else in Files.
Count distinct attachment IDs; identical binaries uploaded separately remain
separate uploads.

Document scope includes saved body references, page cover/icon references, and
its database Files values. Folder/database scope includes its own page media
and all descendant references. Workspace scope includes every retained upload,
including unused Library items. Account scope also includes retained uploads
in trashed workspaces. Soft-deleted attachment records are excluded, matching
the Library catalog. Content and upload totals intentionally have different
Trash behavior because retained uploads still consume storage.

Reported storage is the sum of attachment metadata sizes. It excludes caches,
thumbnails, application files, database overhead, and filesystem probing. File
availability is still managed in Library details. Extension breakdown and future
PDF/video block categories are deferred.

## Persistence and deployment

An additive migration extends `documents` with `word_count`, `character_count`,
`character_count_without_spaces`, `block_counts` (JSONB),
`checked_checklist_count`, `inline_math_count`, `body_attachment_ids` (JSONB),
and nullable `statistics_version`. No new tables or dependencies are required.

The current statistics version is 1. Both inspectors derive counts using the
already-parsed canonical structure. Accepted saves write statistics in the same
transaction as source/revision changes. Empty documents initialize current zero
statistics; existing document import paths already use the save action.

SQL aggregates stored counts and uses recursive hierarchy queries to exclude
hidden descendants. One read query provides a consistent snapshot. Statistics
requests never parse document bodies or call the Library's content-scanning
usage method. Ancestor totals are not stored, so moves and Trash actions require
no statistics rewrites.

After deploying the code, run:

```bash
php artisan migrate
php artisan statistics:rebuild
```

Optional commands:

```bash
php artisan statistics:rebuild --user=123
php artisan statistics:rebuild --force
```

The rebuild selects documents in batches of 100, including trashed content,
locks and rereads each document, and updates only derived fields. Content,
revision, and edit timestamps remain unchanged. Default execution skips current
statistics, making interruption resumable. `--force` recomputes current rows too.
Failures are logged and counted; failed rows remain incomplete and cause a
nonzero command exit. Correct the cause and rerun to resume.

Incomplete scopes show Updating statistics and suppress writing/block/checklist/
inline-math totals. Item upload totals are also suppressed because unprocessed
body references could undercount them. Account/workspace upload totals and
content counts remain available independently. Refresh never starts a rebuild.

Derived fields are excluded from existing document transfer formats and can be
rebuilt after import. Whole-account portability is separate work. Historical
activity, writing streaks, growth charts, lifetime deleted-content counts,
reading time, and empty-document counts are outside this milestone.

## Read interfaces

- `GET /statistics`: authenticated Inertia page and active workspace choices.
- `GET /statistics/insights/{metric}`: standalone insight page for `words`,
  `blocks`, `storage`, `tasks`, `uploads`, or `organization`; scope is carried
  by the existing query parameters. Other metric slugs return 404.
- `GET /statistics/data`: account summary; optional `workspace_id` selects an
  owned active workspace.
- `GET /workspaces/{workspace}/nodes/{node}/statistics`: visible owned node and
  descendant summary. Unavailable, foreign, or hidden-under-Trash nodes return 404.

JSON responses use private/no-store caching and share PHP/TypeScript types for
scope, applicable content counts, writing, block counts, total blocks, checklist,
inline math, Images/Files/total uploads, and completeness. Incomplete derived
groups are null, not misleading zeroes. Requests are canceled on scope changes
or dialog closure to prevent stale responses replacing the selected scope.
