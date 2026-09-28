# Orbium v0.1.0 implementation package

This directory is designed to be copied into the Orbium repository before implementation starts.

## Quick entry points

- `START_HERE.md` — Codex workflow and document precedence
- `AGENTS.md` — mandatory repository instructions
- `docs/00-product-spec.md` — complete product definition
- `docs/01-v0.1.0-scope.md` — what is and is not in the first release
- `docs/02-domain-model.md` — hierarchy, relations, mentions, documents, databases
- `docs/03-technical-architecture.md` — target stack and application architecture
- `docs/04-data-model.md` — proposed PostgreSQL schema and invariants
- `docs/05-ui-ux-system.md` — visual language and global shell
- `docs/06-document-editor.md` — editor behavior
- `docs/07-databases.md` — database behavior
- `docs/08-search-navigation.md` — Search Master, Navigator, tabs
- `docs/09-orbit-3d.md` — spatial navigation
- `docs/10-portability-protocol.md` — export/import specification
- `docs/11-security-self-hosting.md` — self-hosted/security boundaries
- `docs/12-testing-quality.md` — test strategy
- `docs/13-manual-acceptance.md` — global manual acceptance matrix
- `docs/14-phase-report-template.md` — report Codex must produce after each phase
- `docs/15-deferred-features.md` — explicit non-goals
- `docs/16-decision-log.md` — product decisions that should not be reopened casually
- `phases/` — implementation phases and task-level gates

## Intended workflow

```text
Implement Phase N
      ↓
Automated verification
      ↓
Codex phase report
      ↓
User manually tests result
      ↓
User reports issues OR approves
      ↓
Fix current phase if needed
      ↓
Only after approval → Phase N+1
```

The package intentionally prevents a "build everything and reveal it at the end" workflow.
