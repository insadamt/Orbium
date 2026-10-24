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
