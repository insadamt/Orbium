# Statistics

Approved 2026-10-15 as one review milestone; no advancement to another product phase.

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

Approved simplification (2026-10-16) supersedes the earlier composition chart,
asymmetric chart grid, storage ring, and Count/Share and Size/Count controls.
The page uses a single reading order with clear section headings and icons:

1. Scope: selector, selected scope name/type, and Refresh.
2. Overview: Documents, Words, Blocks, Storage used.
3. Writing: total words, plus average words per document for container/account
   scopes. Character counts expand under Character counts.
4. Content: compact icon/count rows for applicable documents, folders, databases,
   and workspaces. Database entries are labeled as already included in Documents.
   This entire section is omitted for individual documents.
5. Blocks: one sorted horizontal chart, initially showing up to six used types.
   Show all block types expands all types including zeroes. Exact counts are
   primary; small percentages use the complete block total. Bars scale against
   the largest displayed count. Average blocks per document appears here for
   multi-document scopes; inline math appears separately beneath the chart.
6. Tasks: one progress bar and a readable checked-of-total statement, remaining
   count, and completion percentage. No tasks has an explicit empty state.
7. Storage: total original size, a simple proportional Images/Files bar, and a
   table of category counts/sizes. Storage details expands the average unique
   upload size and the scope's inclusion rules.

Character counts, storage details, and general counting rules are expandable.
Averages with no denominator and incomplete totals show a dash. Loading, retry,
empty, and pending states remain explicit. Refresh retains loaded values and
labels stale totals on a failed refresh; changing scope clears old scope data.
This presentation adds no history, migrations, dependencies, or backend changes.
See [the simplified layout report](../reports/07-statistics-simplified-layout.md).

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
- `GET /statistics/data`: account summary; optional `workspace_id` selects an
  owned active workspace.
- `GET /workspaces/{workspace}/nodes/{node}/statistics`: visible owned node and
  descendant summary. Unavailable, foreign, or hidden-under-Trash nodes return 404.

JSON responses use private/no-store caching and share PHP/TypeScript types for
scope, applicable content counts, writing, block counts, total blocks, checklist,
inline math, Images/Files/total uploads, and completeness. Incomplete derived
groups are null, not misleading zeroes. Requests are canceled on scope changes
or dialog closure to prevent stale responses replacing the selected scope.
