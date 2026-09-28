# Phase 6 — Versioned portability

## Goal

Implement production-grade one-file Orbium data portability.

This phase is persistence/security sensitive. Do not shorten the specification into a simple ZIP exporter.

## Read first

- `docs/10-portability-protocol.md`
- `docs/04-data-model.md`
- `docs/11-security-self-hosting.md`
- `docs/12-testing-quality.md`
- `AGENTS.md` backward compatibility section

## Tasks

### 6.1 Freeze archive format 1

Define:

- exact table registry;
- exact columns;
- dependency order;
- manifest fields;
- archive paths;
- portable profile fields;
- excluded authentication fields.

Document the frozen format.

**Commit:** `docs(portability): freeze archive format one`

### 6.2 Portable table registry

Implement version-aware table definitions.

**Commit:** `feat(portability): add versioned table registry`

### 6.3 Streaming archive reader

Implement bounded JSON/NDJSON/hash streaming.

**Commit:** `feat(portability): add bounded archive reader`

### 6.4 Exporter

Implement:

- per-user consistency/write lock;
- PostgreSQL repeatable-read snapshot;
- cursor NDJSON export;
- attachment set capture;
- binary streaming;
- manifest;
- checksums;
- ZIP creation.

**Commit:** `feat(portability): add streaming account exporter`

### 6.5 Archive structural/security validator

Reject:

- non-ZIP;
- path traversal;
- absolute/unsafe paths;
- symlinks;
- duplicates;
- undeclared/missing entries;
- zip bombs/oversize;
- invalid checksums.

**Commit:** `feat(portability): validate archive structure`

### 6.6 Format registry/adapters

Implement format support registry and adapter interface.

Format 1 has no legacy adapter yet, but architecture/tests must prove:

- future format rejects;
- unknown old format rejects;
- adapter path can be registered.

Use a synthetic test format fixture if necessary without pretending it was publicly released.

**Commit:** `feat(portability): add format compatibility framework`

### 6.7 Row/schema validator

Exact columns, IDs, owner scope, counts.

**Commit:** `feat(portability): validate portable row schemas`

### 6.8 Orbium semantic validator

Validate hierarchy, databases, mentions, attachments, embedded editor references.

**Commit:** `feat(portability): validate knowledge graph semantics`

### 6.9 Generated-export self-validation

Exporter returns archive only after validator accepts it.

**Commit:** `feat(portability): verify generated archives`

### 6.10 Pending archive + preview UX

Upload, store pending, validate, preview counts/warnings.

**Commit:** `feat(portability): add restore preview`

### 6.11 Database importer and ID maps

Implement reverse-delete + forward-import with old→new IDs.

**Commit:** `feat(portability): add graph remapping importer`

### 6.12 Editor embedded remapping

Use editor content service to remap mentions/attachments inside JSON.

**Commit:** `feat(portability): remap editor references`

### 6.13 Binary staging/import

Implement chosen safe staging/promotion strategy.

Document atomicity/failure model.

**Commit:** `feat(portability): add staged binary restore`

### 6.14 Fresh restore

Allow onboarding restore before normal workspace creation.

Preserve destination authentication identity.

**Commit:** `feat(portability): add fresh account restore`

### 6.15 Replacement restore + safety export

Require literal confirmation.

Create/validate/store safety archive before mutation.

Acquire write lock.

**Commit:** `feat(portability): add protected replacement restore`

### 6.16 Post-import verification

Counts, graph, files/hashes, references.

**Commit:** `feat(portability): verify restored snapshots`

### 6.17 Compatibility/security regression suite

Build adversarial tests listed in portability spec.

**Commit:** `test(portability): cover archive compatibility and attacks`

## Expected result

A user can:

```text
Server A
→ Export one .orbium.zip
→ Server B
→ Preview
→ Restore
→ recover the same logical Orbium data
```

with new destination IDs but preserved relationships/content/files.

## Automated gate

In addition to normal gate:

- complete graph round trip;
- fresh restore;
- replacement restore;
- restore same archive twice;
- destination auth identity preserved;
- mention embedded ID remap;
- attachment embedded ID remap;
- DB property/file/mention value remap;
- checksum corruption;
- path traversal;
- symlink;
- duplicate ZIP entries;
- undeclared entries;
- ZIP bomb limits;
- malformed NDJSON;
- unexpected/missing columns;
- missing FK;
- hierarchy cycle;
- unsupported future format;
- unadapted old format;
- safety export failure prevents replacement;
- staged file failure cannot leave accepted half-restore;
- DB failure rolls back replacement.

## Manual validation

1. Create rich account:
   - multiple workspaces;
   - nested hierarchy;
   - normal documents;
   - database docs;
   - mentions across folders;
   - images/files;
   - tags;
   - all property types.
2. Export.
   - Expected: one archive.
3. Inspect preview on a clean installation/account.
   - Expected: counts/size/source format correct.
4. Fresh restore.
   - Expected: logical graph identical.
5. Open several files/images.
6. Click mentions.
   - Expected: targets correct despite new DB IDs.
7. Check database values and views.
8. Export restored account again.
   - Expected: valid.
9. Restore same source archive again.
   - Expected: no logical duplicates.
10. Existing-account replacement:
    - Expected: safety archive created before replacement.
11. Download/use safety archive in a controlled test.
    - Expected: prior state recoverable.
12. Try known corrupt/tampered fixture.
    - Expected: clear rejection before mutation.

## Stop

Produce a detailed phase report including archive format 1 contract and wait.
