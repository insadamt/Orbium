# Phase 8 — v0.1.0 release hardening

## Goal

Turn the approved product into a verified v0.1.0 release candidate, manually validate it, then promote only after explicit approval.

## Read first

All docs, especially:

- `AGENTS.md`
- `docs/01-v0.1.0-scope.md`
- `docs/12-testing-quality.md`
- `docs/13-manual-acceptance.md`

## Tasks

### 8.1 Scope audit

Compare implementation to v0.1.0 must-ship/deferred lists.

Remove accidental scope creep or document approved changes.

**Commit:** only if changes needed.

### 8.2 Persistence compatibility audit

Review:

- migrations;
- editor content version;
- portability format 1;
- Docker volumes/config;
- auth identity.

No released contract may be silently rewritten.

### 8.3 Security audit

Review:

- authorization;
- files;
- XSS/editor output;
- Mermaid;
- URLs;
- archive upload;
- restore;
- secrets/logging.

### 8.4 Fresh install acceptance

Build clean Docker environment from zero.

Test:

- installation;
- migration;
- auth;
- workspace creation;
- persistent restart.

### 8.5 Upgrade acceptance

If pre-RC test installations exist, test the supported upgrade path to the RC.

### 8.6 Full automated source gate

Run every automated test/check.

Record exact results.

### 8.7 Full manual acceptance matrix

Use `docs/13-manual-acceptance.md`.

### 8.8 Documentation

Create/update:

- README;
- self-hosting guide;
- user guide;
- portability guide;
- release notes.

### 8.9 v0.1.0-rc.1

Tag/build a release candidate according to the repository release process.

Do not immediately call it stable.

### 8.10 User RC validation

User manually validates the release candidate.

Fix defects with focused commits and produce another RC if necessary.

### 8.11 Stable promotion

Only after explicit user approval:

```text
v0.1.0
```

## Expected result

A reproducible self-hosted Orbium release whose persistent-data and portability contracts are known and tested.

## Release notes structure

```markdown
Orbium v0.1.0 introduces a self-hosted spatial knowledge workspace.

## Added

- ...

## Changed

- ...

## Fixed

- ...
```

Only include applicable sections.

## Stop rule

Never promote the RC to stable without explicit user confirmation.
