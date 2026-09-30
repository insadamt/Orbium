# Phase 4 — Search Master, workspace selection, tabs and navigation

## Goal

Make Orbium fast without 3D dependence.

## Read first

- `docs/05-ui-ux-system.md`
- `docs/08-search-navigation.md`
- `docs/03-technical-architecture.md`

## Tasks

### 4.1 Search indexes/service

Enable/use PostgreSQL FTS and `pg_trgm`.

Build unified search service for:

- titles;
- tags;
- document content;
- searchable DB values.

**Commit:** `feat(search): add PostgreSQL workspace search`

### 4.2 Ranking

Implement deterministic ranking with exact/prefix/fuzzy/content priorities and contextual boosts.

**Commit:** `feat(search): add contextual result ranking`

### 4.3 Search Master UI

Implement `Ctrl + Space` panel, grouped results, keyboard navigation, snippets.

**Commit:** `feat(search): add Search Master`

### 4.4 Commands and fast creation

Implement command mode and safe current-context creation.

**Commit:** `feat(search): add command palette actions`

### 4.5 Search filters

Implement useful initial syntax without delaying core search.

**Commit:** `feat(search): add query filters`

### 4.6 Workspace selector

Show the active workspace name in the top bar as a native select. Selecting a workspace opens its root.

**Commit:** `feat(navigation): add native workspace selector`

### 4.7 Workspace explorer drag/drop

Use the Phase 1 move action in the workspace explorer.

**Commit:** `feat(navigation): add explorer drag and drop`

### 4.8 Tabs

Implement tab state/type behavior and reload persistence.

**Commit:** `feat(tabs): add workspace tabs`

### 4.9 Per-tab history

Back/forward and context restoration.

**Commit:** `feat(navigation): add per-tab history`

### 4.10 Reveal actions

- placeholder/contract for Reveal in Orbit, completed visually in Phase 5

**Commit:** `feat(navigation): add reveal actions`

## Expected result

The user can operate Orbium efficiently without 3D:

```text
Ctrl + Space → jump anywhere
Workspace   → switch from the top bar
Tabs         → multitask
```

## Automated gate

- FTS/trigram integration on PostgreSQL;
- exact-match ranking;
- fuzzy ranking;
- workspace isolation;
- Search Master keyboard tests;
- command containment;
- workspace explorer move integration;
- tab persistence;
- history.

## Manual validation

1. Populate 30+ mixed nodes/documents.
2. `Ctrl + Space`, search exact title.
   - Expected: exact title first.
3. Search typo/fuzzy title.
   - Expected: useful target appears.
4. Search phrase found only in body.
   - Expected: content result + snippet.
5. Use keyboard only to open result.
6. Use command mode to create node.
   - Expected: created in valid current parent.
7. Use the workspace selector, then browse/move a node in the explorer.
8. Open several tabs, reload.
   - Expected: tabs restored.
9. Back/forward within a tab.
10. Confirm `Ctrl + Space` still searches the active workspace.

## Stop

Produce report and wait.
