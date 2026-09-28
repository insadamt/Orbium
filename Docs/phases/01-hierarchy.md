# Phase 1 — Workspaces and hierarchy

## Goal

Implement Orbium's authoritative structural model: Workspaces, Nodes, parent-child Relations, containment rules, CRUD, moving, ordering, breadcrumbs, and basic workspace management.

No rich editor or 3D Orbit yet.

## Read first

- `docs/02-domain-model.md`
- `docs/04-data-model.md`
- `docs/05-ui-ux-system.md`

## Tasks

### 1.1 Workspace schema/model/policies

Implement:

- workspace migration/model;
- authenticated ownership scope;
- create/rename/delete;
- ordering;
- soft deletion if chosen by schema.

**Commit:** `feat(workspaces): add owned workspace model`

### 1.2 Node schema/model

Implement `nodes` and type handling:

```text
folder
document
database
```

Add indexes and soft deletion.

**Commit:** `feat(hierarchy): add unified node model`

### 1.3 Containment service

Centralize validation for:

- valid parent type;
- same workspace;
- no self-parent;
- no descendant cycle;
- database only accepts documents;
- document accepts no child.

Tests must cover invalid moves.

**Commit:** `feat(hierarchy): enforce containment rules`

### 1.4 Node CRUD actions

Implement create/rename/trash/restore/permanent purge where current phase requires.

Creation must validate parent.

**Commit:** `feat(hierarchy): add node lifecycle actions`

### 1.5 Move and ordering

Implement:

- move between valid parents in same workspace;
- sibling ordering;
- deterministic reorder semantics.

**Commit:** `feat(hierarchy): add move and ordering`

### 1.6 Workspace switcher and management

Build minimal workspace UI:

- switch;
- create;
- rename;
- delete with explicit destructive confirmation.

**Commit:** `feat(workspaces): add workspace management UI`

### 1.7 Hierarchical browser for testing

Before full Navigator/Orbit exists, provide a simple clean hierarchy surface in the main shell so the user can manually test domain behavior.

It may evolve into later Navigator components; do not build throwaway ugly debug routes if reusable UI is easy.

**Commit:** `feat(hierarchy): add initial hierarchy browser`

### 1.8 Breadcrumbs

Implement server/client breadcrumb resolution based on actual parent chain.

**Commit:** `feat(navigation): add hierarchy breadcrumbs`

## Expected result

The user can:

```text
Workspace
├── Folder
│   ├── Folder
│   ├── Document
│   └── Database
│       └── Document
└── Document
```

and Orbium rejects invalid structures.

## Automated gate

Add tests for:

- user isolation;
- root creation;
- each valid containment combination;
- database rejects folder/database;
- document rejects child;
- same-workspace enforcement;
- direct and deep cycle attempts;
- move/reorder;
- soft-delete visibility;
- workspace deletion ownership.

Run full phase gate.

## Manual validation

1. Create Personal and Work workspaces.
   - Expected: switching isolates each hierarchy.
2. In Personal create Folder, Document, Database.
   - Expected: all appear as direct root nodes.
3. Enter Folder and create all three node types.
   - Expected: valid.
4. Enter Database and attempt Folder.
   - Expected: action unavailable or rejected clearly.
5. Create Document inside Database.
   - Expected: valid.
6. Attempt to move a parent folder into its own descendant.
   - Expected: rejected; tree remains correct.
7. Move a document from Folder to Database.
   - Expected: its parent becomes Database.
8. Move it back to Folder.
   - Expected: it becomes a normal folder document again.
9. Rename/reorder/reload.
   - Expected: state persists.
10. Test breadcrumbs.
    - Expected: each segment navigates to the real ancestor.

## Stop

Produce phase report and wait.
