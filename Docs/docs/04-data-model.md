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
type enum/string: folder|document|database
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
- document → no children.

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
