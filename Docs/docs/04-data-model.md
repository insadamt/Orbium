# Proposed PostgreSQL data model

This is the implementation target for v0.1.0. Small naming changes are allowed when Laravel conventions make them clearer, but domain semantics are fixed.

## users

Use Laravel authentication fields plus portable non-secret profile settings.

Portable user-domain fields may include:

- display name;
- timezone;
- non-secret preferences.

Do not treat email/password/session identity as portable account data.

## workspaces

```text
id
user_id
name
icon nullable
position
created_at
updated_at
deleted_at nullable
```

Indexes:

- `user_id`
- `(user_id, position)`

## nodes

```text
id
workspace_id
parent_id nullable -> nodes.id
type enum/string: folder|document|database|board
title
icon nullable
position
is_favorite boolean default false
created_at
updated_at
deleted_at nullable
```

Indexes:

- `workspace_id`
- `parent_id`
- `(workspace_id, parent_id, position)`
- trigram/search index on title

Rules enforced through actions/services:

- same-workspace parent;
- valid parent type;
- no cycles;
- database → document only;
- document/board → no children.

Boards are native leaf Nodes (requested 2026-10-18). The foundation adds no `documents` record or content table for a Board. A new migration extends `nodes_type_check`; its rollback refuses while any Boards remain, including trashed Boards. Subsequent approved Board phases add the spatial tables described below; see `24-boards.md`.

## boards and board_objects (phase 2, approved 2026-10-18)

`boards.node_id` is the primary key and cascades from `nodes.id`. It owns `format_version` (1), optimistic `revision` (starting at 0), and timestamps. Existing Board Nodes, including trashed ones, are backfilled; future Board creation initializes this extension in the hierarchy transaction.

`board_objects` has an internal row ID, `board_node_id` cascading from `boards.node_id`, `object_id` UUID with a unique `(board_node_id, object_id)` pair, `block_type` (initially paragraph), `content_format_version` (2), canonical `markdown`, numeric `x/y/width/height`, integer `layer`, and timestamps. IDs in the canvas/API are stable object UUIDs, never Document/Node identities. Soft-deleting a Board or its container retains these rows; permanent deletion cascades through them.

The snapshot endpoint validates the complete bounded object list, paragraph syntax/links, geometry, IDs and versions, then saves atomically under workspace and Board locks. Concurrent stale revisions return 409. Reads hold a shared Board row lock so object content and revision are consistent. Foreign-key and CHECK constraints protect identity ownership and basic geometry/version invariants. See `24-boards.md` and `../phases/10-boards-canvas.md` for limits and later content boundaries.

Phase 3 upgrades the spatial envelope/default to format **2** using `2026_10_18_000003_enable_board_markdown_blocks.php`; `block_type` now permits legacy `paragraph` and native `markdown` fragments. It preserves stored source/UUIDs and refuses downgrade while objects remain. Canonical Markdown inspection validates native blocks, safe links and workspace-owned attachments before atomic saves. Board page mentions remain rejected until their separate lifecycle is implemented. Limits are 128 KiB per fragment and 2 MiB total, with unchanged object/geometry limits. Library usage derives attachment references from saved Board objects, including Trash. See `../phases/11-boards-blocks.md`.

Boards phase-3 review correction supersedes the envelope above: spatial format **3**, with native Board JSON content format **1** in `board_objects.data`. Native rows have `markdown = null`; preserved legacy paragraph/Markdown rows retain content format 2 until converted and saved. The additive `2026_10_18_000004_add_native_board_blocks.php` leaves legacy source/UUID rows intact and changes the envelope/default/geometry constraints. Old clients reject spatial format 3. Native kinds are text, heading, list, quote, callout, code, table, image, file, math, Mermaid and divider. No arbitrary nested document block arrays are accepted. See `24-boards.md` and `../phases/11-boards-native-correction.md`.


## Board resource references (phase 4, approved 2026-10-18)

`2026_10_18_000005_add_board_resource_cards.php` upgrades the spatial envelope/default to **4**, preserving the native content-format-1 and legacy content-format-2 row contracts. The new `resource` kind stores only a positive safe-integer `target_node_id` in JSON data. Resource titles/previews/source are live reads from the original owned Node/Document, not Board snapshot fields. Self/foreign/folder targets are rejected. New references require visible ancestry; previously saved unavailable targets can remain as placeholders. JSON target IDs have no cascading foreign key, so permanent target deletion preserves the reference and never deletes its Board.

`board_document_creations` contains an internal ID, cascading `board_node_id` FK to `boards.node_id`, UUID `request_id`, 64-character request hash, nullable `document_node_id` FK to Nodes with **SET NULL** on permanent target deletion, result revision and timestamps. `(board_node_id, request_id)` is unique. Creation locks the Board and atomically creates the Document through the hierarchy service, appends its card, validates/saves the complete snapshot and records the receipt. The Document parent is the Board’s current folder/root. Identical retries cannot create duplicates; differing payloads or a later Board revision return 409, removed targets return 410. Rollback refuses while resource objects or creation receipts remain.

Document source/format/revision/mention/attachment records remain owned by the original Document, using existing save actions. Board layout revision does not advance when Document source changes. Card removal, Undo and Board deletion retain original resources; only Board-owned rows/receipts cascade with the Board. See `../phases/12-boards-resource-cards.md`.

## Board performance metadata (2026-10-21)

`2026_10_21_000001_add_board_mutation_metadata.php` adds nullable
`boards.last_mutation_id`, `boards.last_mutation_hash` and
`board_objects.data_bytes`. Byte counts derive from server canonical JSON and
initialize once under the Board lock for preexisting native rows. Full/incremental
saves maintain them. The last mutation receipt supports bounded idempotent replay;
older requests after another write fail revision checking. Metadata never enters
Board object data or full snapshots/recovery/exports. Snapshot format stays 4;
optional `mutation_version: 1` advertises the new PATCH protocol for native,
contiguous Boards. See `../plans/board-performance-architecture.md`.

## Board drawings (requested 2026-10-23)

`2026_10_23_000001_add_board_drawings.php` upgrades the Board envelope/default to
**5**, retaining existing row UUIDs, revisions and native/legacy content versions.
The native row constraint additionally permits `drawing`. Its JSON contains bounded
local point pairs, view-box dimensions, safe ink color, stroke width and opacity;
there is no raw SVG payload or attachment. Full/incremental saves require envelope 5.
Recovery explicitly adapts older local drafts. Rollback refuses while drawing rows
remain, including drawings on trashed Boards. See `24-boards.md`.

### Drawing gaps (2026-10-24 correction)

`2026_10_24_000001_add_board_drawing_gaps.php` upgrades the spatial envelope/default
to **6** without rewriting object JSON, UUIDs or revisions. Drawing data optionally
adds `breaks`: strictly increasing integer indices in `(0, points.length)` that
start disconnected subpaths within one drawing object. Total points remain capped
at 6,000; breaks at 5,999. Empty breaks are omitted. Erasing preserves object
identity/frame; complete erasure removes that object. Full/incremental saves and
sibling Document creation require envelope 6. Existing format-5 snapshots explicitly
adapt; older drafts retain their supported adapters. Older envelopes may not carry
breaks. Downgrade refuses while any drawing has breaks, including trashed Boards.
See `24-boards.md` and `../reports/12-boards-single-drawing-eraser.md`.

## documents


```text
node_id PK/FK -> nodes.id
content jsonb
content_format_version integer
plain_text text
cover_attachment_id nullable
icon_attachment_id nullable -> attachments.id
created_at
updated_at
```

The referenced node must have `type=document`.

`content` is authoritative.

## databases

```text
node_id PK/FK -> nodes.id
created_at
updated_at
```

The referenced node must have `type=database`.

This table exists as a clear extension point even if v0.1.0 has little database-specific metadata beyond properties/views.

## database_properties

```text
id
database_node_id -> nodes.id
name
type
position
config jsonb
created_at
updated_at
```

Types:

```text
text
number
select
multi_select
checkbox
date
url
email
files
mention
```

The database node must be `type=database`.

Title is not represented here; it is the child document's node title.

## database_values

```text
id
document_node_id -> nodes.id
property_id -> database_properties.id
value jsonb
created_at
updated_at
```

Constraint:

```text
UNIQUE(document_node_id, property_id)
```

Semantic validation:

- document's parent must equal property's database;
- value shape must match property type/config.

A JSONB value keeps one table while still allowing type-specific validation.

## database_view_settings

Exactly one settings record per database and view type is sufficient initially.

```text
id
database_node_id
view_type table|gallery|orbit
config jsonb
created_at
updated_at
```

Constraint:

```text
UNIQUE(database_node_id, view_type)
```

Examples:

Table config:

- visible property IDs;
- column order/widths;
- sort clauses;
- filters.

Gallery config:

- preview mode;
- visible property IDs;
- sorting/filters.

Orbit config:

- primary/secondary displayed property;
- optional spatial display preferences;
- sorting/filters.

View configuration never owns documents.

## tags

```text
id
workspace_id
name
normalized_name
color nullable
created_at
updated_at
```

Constraint:

```text
UNIQUE(workspace_id, normalized_name)
```

## node_tags

```text
node_id
tag_id
created_at
```

Composite unique key.

Both must belong to the same workspace.

## mentions

```text
id
source_document_node_id
target_node_id
block_key nullable
display_text nullable
created_at
updated_at
```

Indexes:

- `source_document_node_id`
- `target_node_id`
- unique key may include source + target + block identity depending on editor implementation

Mentions are maintained from editor content.

A folder/database may be the target, never the source unless it is represented through a document in the future.

## attachments

```text
id
workspace_id
owner_node_id nullable
purpose
original_name
mime_type
size_bytes
sha256
storage_key
created_at
updated_at
deleted_at nullable
```

Possible purposes:

```text
document
image
cover
database_file
avatar
other
```

Do not expose `storage_key` as a user-supplied path.

Consider deduplication later; do not make global content deduplication a v0.1.0 requirement.

## user_settings

Either a focused table or safe JSONB preferences:

```text
user_id
appearance
reduced_motion
three_d_quality
editor_preferences jsonb
created_at
updated_at
```

Avoid putting core domain data into generic settings JSON.

## tab/session state

Default implementation may use browser storage because it is transient UI state.

If server-side persistence is implemented, keep it separate from the knowledge domain and do not make portability depend on restoring exact camera/cursor positions.

## Search derivation

Searchable data is derived from canonical domain tables.

Do not introduce a second authoritative document store.

## Soft deletion

Soft-deleted data remains user-owned and should be included in portability unless explicitly permanently purged.

Queries powering normal UI must consistently exclude trashed records except in Trash/restore contexts.

## Migration policy

Once a migration has shipped in a release candidate/stable build:

- do not rewrite it;
- add a new migration;
- add compatibility tests for upgrades.

The initial schema may evolve rapidly before the first RC, but history should stabilize once release testing begins.


## Mind Map blocks (phase 5, authorized 2026-10-24)

`2026_10_24_000002_add_mindmap_blocks.php` upgrades the Board envelope/default to **7** and extends the native content CHECK with `mindmap`, without rewriting previous source/JSON/UUID/revision fields. Native content format remains 1. A map's data contains only `mindmap`, a version-1 flat graph with one `root_id` and a topic list (`id`, nullable `parent_id`, plain `text`, boolean `collapsed`). Shared application validation rejects unknown keys/versions, duplicate/missing IDs, multiple roots, cycles, disconnected nodes, depth over 64 parent links, labels over 500 Unicode code points and serialized maps over 64 KiB. There is no fixed child count. Topic parents are internal graph links, not `nodes.parent_id` or mentions. Existing full/PATCH validation, Board history/revision/idempotency and per-Board byte accounting remain in use. Downgrade refuses while Board Mind Maps exist, including Trash.

Markdown format 2 gains an additive versioned atomic Mind Map directive; legacy format 1 gains a validated Mind Map atom. Each uses the same graph and original Document save/revision ownership. Search text and statistics include labels, never fabricated page/attachment references. No new Document/Node or graph table is created. Formatting-preserving exports retain canonical graph data; plain/office exports intentionally produce a full topic outline. This does not change the account archive protocol. Deploy matching server/client code and reload open editors before using the new block.


Mind Map graph version 2 (approved 2026-10-26) adds optional inline `content` per topic, using validated text/hardBreak nodes and bold/italic/underline/strike/code/link/textColor marks. Its mandatory plain `text` must match the content projection exactly. Version 1 stays supported and literal; accepted rich-label edits upgrade to 2. Existing graph byte/depth/text limits, Board spatial format 7 and Document envelopes remain. Legacy full saves advertise mindmap capability 2 and require capability at least the largest stored graph version, protecting formatted maps from older schemas. No migration is required; deploy matching frontend/server and reload editors. See `../reports/13-mindmap-rich-text-and-sizing.md` for checks and exact manual acceptance.


Mind Map graph version 3 (requested 2026-10-26) adds optional integer topic `width`, bounded to 100–800 map pixels with a default of 180. Width is rejected in earlier graph versions; versions 1/2 remain readable. An accepted resize explicitly upgrades to 3, and rich-text edits preserve that version. Legacy full saves advertise capability 3 and use the stored-graph version guard. Existing byte/text/depth constraints and outer Board/Document formats remain unchanged; no migration is required. See `../reports/13-mindmap-topic-width.md` for checks and manual acceptance.


Mind Map graph version 4 (requested 2026-10-26) adds optional topic `body`, a bounded structured text document. It supports paragraph/H1–H3, bullet/ordered/task lists, quote/callout wrappers and plain code blocks, with existing safe inline marks. `body` and legacy inline `content` are mutually exclusive on the same topic. Mandatory `text` matches the exact recursive plain projection (newline between text blocks/items); search/statistics/plain exports use that projection. The body allows at most 256 block nodes and nesting depth 16; existing 500-code-point topic and 64 KiB graph budgets remain. Versions 1–3 stay supported without interpreting literal labels as markup. Accepted text changes upgrade to 4; resizing preserves 4. Normal/hosted legacy full saves advertise capability 4 and the existing largest-stored-graph guard prevents older clients from dropping structured bodies. Board spatial format 7, native content format 1 and Document envelopes remain unchanged. No migration is needed. See `../reports/13-mindmap-branch-slash-commands.md`.


Mind Map graph version 5 (approved 2026-10-26) adds optional top-level `layout`: `balanced`, `tree-right`, `tree-left`, `hierarchy-down`, `hierarchy-up`, `outline`, `brace`, `fishbone`, `timeline` or `timeline-vertical`. The last two are one template family with an orientation choice. The field is rejected in graph versions 1–4, and unknown/null values are rejected. An omitted layout defaults to balanced; supported older graphs remain readable without mutation. A changed template upgrades the graph to 5 while retaining the entire topic array and its rich text/body/width/collapse data. Subsequent text/width edits preserve 5. Graph limits and Board/Document outer envelopes remain unchanged. Legacy normal/hosted full saves advertise capability 5 and the existing stored-version guard protects template maps from older clients. No migration is needed; deploy matching frontend/server and reload editors. See `../reports/13-mindmap-hierarchy-templates.md`.


Mind Map graph version 6 (approved 2026-10-26) adds optional topic `color` and `icon`. Color is one of `gray`, `red`, `orange`, `amber`, `green`, `teal`, `blue`, `purple`, `pink`; absence inherits the closest ancestor's color or the theme default. `icon` is a name in the canonical local built-in/brand icon catalog, validated by the shared `InlineIconData::isBuiltin`; no custom attachment references are added. Null/unknown values and these keys in earlier graph versions are rejected. Removing a style deletes its optional key. Adding/changing a color or icon upgrades to 6; later layout/body/width edits preserve 6. Decorative icons/colors do not alter required plain topic text, statistics or outline exports; graph-preserving transfers retain them. Legacy normal/hosted saves advertise mindmap capability 6 while preserving inline-icon capability 2. The existing stored-version guard protects newer graphs; no outer envelope/migration change.

Branch reparenting retains IDs and all content/style fields, rejects roots/self/descendant targets, expands the accepted destination ancestry and changes sibling ordering through the existing topic-array order. Original tree/depth/text/byte validation still applies. Reordering and bulk visibility actions do not introduce another format version. Search's ancestor expansion is view-only and never submitted as the saved graph. See `../reports/13-mindmap-organization-tools.md`.


Mind Map graph version 7 (requested 2026-10-26) permits version-1 `inlineIcon` atoms inside structured body paragraphs/headings, including those nested in lists, quotes and callouts. Safe existing text marks also apply to icons. Atoms have `version: 1`, `kind: builtin|custom`, a nonempty label of at most 160 code points without control characters, and either a canonical `name` or a positive JavaScript-safe `attachmentId` (the inactive attribute may be absent/null). Unknown fields/sources/names are rejected; icons in code blocks or graph versions 1–6 are rejected. Emoji remain ordinary text. Required topic `text` projects each atom to its label exactly, retaining the 500-code-point topic, 64 KiB graph and existing body/depth limits. Decorative topic `icon` remains separate graph-6 metadata and does not change plain text.

Accepted body edits now upgrade to 7; style/layout/width mutations preserve newer graph versions. Normal/hosted legacy saves advertise mindmap capability 7 while retaining inline-icons capability 2. Workspace-owned PNG/JPEG/GIF/WebP validation, attachment discovery, usage protection and reference remapping traverse all topic bodies (including collapsed topics) in Board, Markdown and legacy Documents. Native package import remaps IDs; omitted custom icons become marked text labels in standalone/native exports without image assets. Older graph versions remain supported and literal. No database migration or outer envelope change; deploy matching frontend/server and reload open editors. See `../reports/13-mindmap-inline-icons.md`.


## Native Board shapes (2026-10-29)

The additive `2026_10_29_000001_add_board_shapes.php` advances the Board envelope/default to 9, preserving object rows and revisions while permitting native `shape` content-version-1 rows. `data.shape` stores a validated shape kind, fill, stroke, stroke width and stroke style; label inlines, alignment, direction and optional text scale reuse existing Board fields. No new tables or columns are introduced. Full/PATCH saves, byte accounting, revision conflicts and owned label-icon references use existing contracts. Explicit old-snapshot adaptation retains earlier content; stale clients cannot save format 8. Rollback refuses while shapes exist, including in trashed Boards. See `24-boards.md` and `../phases/15-board-shapes.md`.
