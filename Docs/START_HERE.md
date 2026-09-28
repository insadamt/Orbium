# Orbium — Codex implementation handoff

This package is the authoritative implementation brief for **Orbium v0.1.0**.

Orbium is a self-hosted spatial knowledge workspace combining:

- hierarchical knowledge organization;
- Notion-like document/database ergonomics;
- Markdown-first writing shortcuts;
- a minimalist 3D orbital navigation model;
- a global Search Master;
- versioned, validated, portable account archives.

## Codex: mandatory workflow

1. Read `AGENTS.md`.
2. Read `docs/00-product-spec.md`, `docs/01-v0.1.0-scope.md`, and `docs/02-domain-model.md`.
3. Read the documentation referenced by the current phase.
4. Start with **Phase 0 only**.
5. Complete tasks in the phase in order unless a dependency requires a documented adjustment.
6. Use one commit per logical task.
7. Run the required validation before each commit.
8. At the end of the phase:
   - run the complete phase quality gate;
   - produce a phase report using `docs/14-phase-report-template.md`;
   - present the manual validation checklist to the user;
   - **STOP**.
9. Do not start the next phase until the user explicitly confirms the current phase.

The user intends to inspect each phase manually before allowing the next one.

## Document precedence

If documents appear to conflict, use this precedence:

1. `AGENTS.md`
2. `docs/01-v0.1.0-scope.md`
3. `docs/02-domain-model.md`
4. feature-specific documentation
5. phase documents
6. implementation convenience

Do not silently invent product behavior to resolve a conflict. Prefer the smallest behavior consistent with the higher-priority documents and record the interpretation in the phase report.

## Phase order

| Phase | Goal |
|---|---|
| 0 | Repository, stack, auth, Docker, quality gates |
| 1 | Workspaces, hierarchy, node CRUD, containment |
| 2 | Document editor, Markdown UX, mentions, attachments |
| 3 | Databases, properties, Table and Gallery |
| 4 | Search Master, Navigator, tabs, navigation history |
| 5 | 3D Orbit and motion system |
| 6 | Versioned portability protocol and restore |
| 7 | Settings, onboarding, resilience, UX polish |
| 8 | v0.1.0 release candidate and release hardening |

See `phases/README.md`.

## Core vocabulary

- **Relation**: structural parent-child containment.
- **Mention**: contextual reference from one document to another node.
- **Orbit**: 3D visualization of relations only.
- **Search Master**: global search/navigation/command interface opened with `Ctrl + Space`.
- **Navigator**: conventional hierarchical tree.
- **Database document**: a normal document whose parent is a database and which additionally has structured property values.

## Absolute product rules

- A node has exactly one parent, except workspace-root nodes whose parent is `null`.
- A folder can contain folders, documents, and databases.
- A database can contain documents only.
- A document cannot contain children.
- Mentions never alter hierarchy.
- Mentions are not rendered as lines in the 3D Orbit.
- The initial database views are only **Table, Gallery, Orbit**.
- Database required-properties and templates are not part of v0.1.0.
- The editor uses Notion-like block interaction plus Markdown typing shortcuts.
- The visual identity is monochrome/minimalist 3D with frosted glass UI surfaces; semantic colors are informational only.
- Orbium portability is a versioned protocol, not a raw database dump.
