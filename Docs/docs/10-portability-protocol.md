# Orbium portability protocol

## 1. Definition

An Orbium portable archive is:

> a versioned, validated, self-contained snapshot of the user's complete portable Orbium knowledge graph.

It is **not**:

- a raw PostgreSQL dump;
- a server backup;
- a best-effort import;
- a merge format;
- a Markdown folder export.

Suggested filename:

```text
orbium-account-YYYY-MM-DD-HHMMSS.orbium.zip
```

## 2. Portable archive vs server backup

### Portable archive

Purpose:

> Move/restore the user's Orbium knowledge between compatible Orbium installations.

Includes user-domain data and attachments.

Excludes infrastructure secrets.

### Full server backup

Purpose:

> Restore an exact deployment/server.

May contain:

- database backup/volume;
- application key;
- environment;
- deployment config;
- persistent storage.

A full server backup must never be accepted by the portable-import interface.

## 3. Version model

Two independent versions exist:

```text
source_application_version
archive_format_version
```

Example:

```json
{
  "source_application": "Orbium",
  "source_application_version": "0.4.2",
  "archive_format_version": 3
}
```

Application releases may occur without changing the archive format.

Increment `archive_format_version` only when the portable data contract changes.

### Frozen formats

Once format 1 ships, its:

- tables;
- columns;
- expected files;
- semantics

are frozen.

Future versions add explicit definitions/adapters.

Never reinterpret a previously valid format in place.

## 4. Compatibility

Current Orbium may support a finite list of older archive versions.

Example:

```text
Supported: 1, 2, 3
Current export: 3
```

Rules:

- known old format → explicit adapter;
- unknown old format → reject;
- newer format → reject with "Update Orbium first";
- no implicit best-effort import.

Compatibility must have regression fixtures.

## 5. Archive layout

Initial format concept:

```text
manifest.json
checksums.json

tables/
├── users.ndjson                 # safe portable profile only
├── workspaces.ndjson
├── nodes.ndjson
├── documents.ndjson
├── databases.ndjson
├── database_properties.ndjson
├── database_values.ndjson
├── database_view_settings.ndjson
├── tags.ndjson
├── node_tags.ndjson
├── mentions.ndjson
├── attachments.ndjson
└── user_settings.ndjson

files/
├── <opaque archive key>
├── <opaque archive key>
└── ...
```

Exact format-1 table list must be frozen when implemented.

User-provided filenames are metadata, never archive paths.

## 6. NDJSON

Portable table data uses newline-delimited JSON:

```json
{"id":1,"name":"Personal"}
{"id":2,"name":"Work"}
```

Reasons:

- bounded memory;
- cursor-based export;
- streaming validation;
- streaming import;
- clear row-level errors.

Do not encode all rows of a table into one huge JSON array.

## 7. Portable table registry

Implement a registry conceptually equivalent to:

```text
PortableTableDefinition
- name
- module
- columns
- foreignKeys
- identityColumn
- ownership information
- archive path
```

Registry order is dependency order for import.

Reverse registry order is used for safe deletion.

Registry takes an optional archive format version and returns that format's frozen definitions.

## 8. Export consistency

For PostgreSQL metadata:

- use one database transaction;
- use `REPEATABLE READ`;
- lock the portable user/profile row as appropriate;
- stream each table through a cursor in deterministic order.

Orbium also has filesystem data. Therefore export must coordinate database/file mutation.

Preferred v0.1.0 correctness model:

1. acquire per-user portability/write lock;
2. begin repeatable-read snapshot;
3. determine referenced attachment set;
4. stream metadata to temporary NDJSON files;
5. stream/copy referenced binary files into archive staging;
6. write manifest/checksums;
7. create archive;
8. validate the complete generated archive with the normal import validator;
9. release lock only after snapshot/archive is complete.

Do not allow an attachment to disappear/change halfway through a supposedly consistent snapshot.

## 9. Export streaming

Metadata:

```text
DB cursor
→ normalize portable row
→ JSON encode
→ write NDJSON line
```

Binary files:

- stream/copy by chunks;
- do not `file_get_contents()` multi-gigabyte archives/files into memory;
- calculate SHA-256 during or after bounded streaming.

## 10. Manifest

Format-1 manifest must include at least:

```text
archive_format_version
source_application
source_application_version
created_at UTC
portable user metadata
table_counts
module/entity counts
declared table files
binary attachment count/bytes
```

Exact fields are frozen per format once released.

Avoid putting authentication secrets in the manifest.

## 11. Checksums

`checksums.json` contains SHA-256 digests for:

- `manifest.json`;
- every NDJSON file;
- every binary `files/*` entry.

The checksum file itself does not need to hash itself.

Checksums detect corruption/alteration. They are not signatures and do not prove archive authorship.

## 12. Generated-export validation

The exporter must run the same archive validator against the newly generated archive before download.

If Orbium's live data would create an invalid portable graph, export fails clearly.

Never return an archive that Orbium itself refuses to restore.

## 13. ZIP structural validation

Before trusting archive content:

- archive must be readable;
- compressed size bounded/configured;
- entry count bounded;
- individual entry expanded size bounded;
- total expanded size bounded;
- no duplicate entry names;
- no absolute paths;
- no `..` traversal/dot-segment paths;
- no backslash path tricks;
- no NUL;
- no directory entries where not expected;
- no symlinks;
- only declared/expected entries.

Mitigate ZIP bombs.

For Orbium, metadata limits and binary limits should be separate because attachments may be large.

## 14. Bounded readers

NDJSON reader must enforce:

- maximum line size;
- maximum data-file bytes;
- valid UTF-8/JSON as appropriate;
- non-empty row;
- row must be a JSON object.

Binary reading must enforce declared/allowed sizes while streaming rather than trusting ZIP metadata only.

## 15. Row/schema validation

For the archive's declared format version:

- no unknown columns;
- no missing required columns;
- IDs valid and unique within table;
- one safe user profile row;
- settings singletons not duplicated;
- ownership consistent.

Adapters run before validation when the old format legitimately lacks fields introduced later.

## 16. Semantic validation

Orbium validator must verify at minimum:

### Hierarchy

- all workspaces belong to archive owner;
- each node workspace exists;
- parent exists when non-null;
- parent belongs to same workspace;
- allowed containment type;
- no cycles;
- document has no children;
- database has document children only.

### Documents

- document extension row corresponds to a document node;
- editor content format supported;
- embedded mention/attachment references exist;
- plain text may be re-derived and verified/rebuilt.

### Databases

- database extension row corresponds to database node;
- property belongs to database;
- database document parent is database;
- database value property belongs to same parent database;
- database value shape matches property type.

### Mentions

- source is a document;
- target exists;
- ownership/workspace policy is valid;
- mention index is consistent with editor content, or restore has a deterministic rebuild path.

### Tags

- node and tag belong to same workspace;
- no invalid duplicate normalized tag.

### Attachments

- metadata references existing workspace/node as applicable;
- binary entry exists;
- byte count matches;
- SHA-256 matches;
- embedded document/file property references resolve.

## 17. Archive preview

Upload never restores immediately.

Flow:

```text
upload
→ store pending archive
→ structural validation
→ checksum validation
→ schema/semantic validation
→ preview
→ explicit restore action
```

Preview should show:

```text
created time
source Orbium version
archive format
workspace count
folder count
document count
database count
mention count
tag count
attachment count
total attachment bytes
warnings
```

Warnings:

- changes after archive time are absent;
- restore replaces the current portable snapshot;
- restore does not merge divergent knowledge bases.

## 18. Fresh restore

During first onboarding, allow:

```text
Create normal workspace
OR
Restore Orbium archive
```

Fresh restore preserves destination authentication identity while importing portable domain data.

## 19. Existing-account replacement

Existing restore requires deliberate confirmation, for example literal:

```text
RESTORE
```

Before destructive mutation:

1. export current target account;
2. validate that safety export;
3. retain safety archive;
4. only then proceed.

If safety export creation/storage/validation fails, abort restore before deleting anything.

## 20. Write lock

Restore acquires a per-user operation lock.

Normal account writes should be rejected/paused while restore owns the lock.

Example lock key:

```text
orbium-account-write:{user_id}
```

Exact mechanism may use Laravel Cache lock with a driver available in the default stack. If the default cache driver cannot safely provide the required lock in deployment, use a PostgreSQL advisory-lock strategy rather than introducing Redis solely for this.

## 21. ID remapping

Archive primary keys are relationship keys, not destination IDs.

Never insert source primary keys directly.

Build:

```text
old workspace ID → new workspace ID
old node ID → new node ID
old property ID → new property ID
...
```

Rewrite all foreign keys using these maps.

## 22. Embedded editor reference remapping

Tiptap content may contain:

```text
mention targetNodeId
attachmentId
database file references if represented in body
```

During restore:

```text
EditorContentInspector.remapReferences()
```

must remap old IDs to destination IDs.

Never use regex over serialized JSON.

The mention table and editor content must converge on the same mapped target IDs.

## 23. Restore order

Initial conceptual order:

1. safe user portable profile/settings
2. workspaces
3. nodes
4. documents
5. databases
6. database properties
7. database view settings
8. tags
9. attachments metadata/staging
10. database values
11. node tags
12. mentions
13. user settings if not earlier

Exact order depends on final foreign keys and must be encoded by the format registry.

## 24. Binary restore transaction strategy

Database transactions cannot roll back filesystem writes.

Use staging:

```text
portability/restore-staging/{uuid}/
```

Flow:

1. validate archive completely without extracting arbitrary paths;
2. stream verified binary entries to isolated staging;
3. begin database replacement transaction;
4. import/remap graph;
5. verify database graph;
6. prepare/promote stable storage keys;
7. commit with a strategy that cannot expose half-imported references;
8. clean old unreferenced files only after success;
9. remove staging.

If filesystem promotion can fail after database commit, design compensating safety behavior before implementation. Phase 6 must document the exact chosen atomicity strategy and test its failure paths.

## 25. Replace, do not merge

Portable restore is snapshot replacement.

It never merges two divergent Orbium datasets.

A future separate "import workspace" feature may define merge semantics. Do not overload portability with this problem.

## 26. Post-import verification

Before success:

- restored row counts equal declared counts;
- hierarchy valid;
- no cycles;
- all database values valid;
- mentions resolve;
- all attachment binaries exist;
- attachment size/hash correct;
- editor embedded references resolve.

Any failure rolls back database replacement and preserves/recoverably restores file state.

## 27. Repeated restore

Restoring the same archive twice must produce the same logical graph without duplication.

Destination numeric IDs may differ.

Tests must verify:

- no duplicate documents;
- no duplicate tags;
- no duplicate mentions;
- no duplicate attachment references;
- future inserts continue to work.

## 28. Security exclusions

Never export:

- password hash;
- email verification token/state where tied to destination auth;
- remember token;
- sessions;
- password-reset tokens;
- cache;
- queues;
- app key;
- `.env`;
- DB credentials;
- OAuth/API secrets;
- infrastructure config.

Portable display name/avatar/preferences may be imported if intentionally classified as domain profile data.

## 29. Required test classes

At minimum:

```text
OrbiumArchiveTest
OrbiumArchiveSecurityTest
OrbiumRestoreTest
OrbiumPortabilityWorkflowTest
OrbiumArchiveCompatibilityTest
OrbiumAttachmentPortabilityTest
OrbiumEditorReferencePortabilityTest
```

Coverage must include:

- complete graph round-trip;
- old-format adapter;
- future-format rejection;
- corrupt ZIP;
- checksum failure;
- traversal;
- symlink;
- duplicate/undeclared entries;
- oversized entries/expansion;
- malformed NDJSON;
- missing FK;
- hierarchy cycle;
- invalid database value;
- mention remap;
- attachment remap/hash;
- safety-export failure;
- restore transaction failure;
- repeated restore.
