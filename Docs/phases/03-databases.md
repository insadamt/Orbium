# Phase 3 — Databases

## Goal

Implement structured database documents, schema properties, Table, Gallery, filtering/sorting, and database-document property header.

The final 3D Orbit view is completed in Phase 5; this phase implements its data/config contract so Phase 5 can attach the shared spatial renderer.

## Read first

- `docs/02-domain-model.md`
- `docs/04-data-model.md`
- `docs/07-databases.md`

## Tasks

### 3.1 Database extension/schema

Add database extension and property/view-settings tables.

**Commit:** `feat(databases): add database schema persistence`

### 3.2 Property types and validation

Implement all v0.1.0 property types and value validation.

**Commit:** `feat(databases): add typed property validation`

### 3.3 Database value persistence

Add values with invariant:

```text
document parent database == property database
```

**Commit:** `feat(databases): add structured document values`

### 3.4 Property management UI

Create/reorder/edit/delete properties.

No required flag. No templates.

**Commit:** `feat(databases): add property schema editor`

### 3.5 Database document property header

When opening database child document:

- collapsible properties above body;
- inline edit;
- same normal editor below.

**Commit:** `feat(databases): add document property header`

### 3.6 Table view

Implement title column, property columns, inline edits, sizing/order/visibility.

**Commit:** `feat(databases): add table view`

### 3.7 Filters and multi-sort

Shared query/config semantics.

**Commit:** `feat(databases): add filters and sorting`

### 3.8 Gallery view

Implement preview and visible-property configuration.

**Commit:** `feat(databases): add gallery view`

### 3.9 Orbit view contract

Expose Orbit tab/config and data required by the spatial renderer.

Until Phase 5, it may render an honest "Spatial view will be enabled in the Orbit phase" state rather than a fake 2D substitute.

**Commit:** `feat(databases): add orbit view contract`

### 3.10 Mention/files properties

Wire property values to existing Node mention and attachment systems.

**Commit:** `feat(databases): integrate mention and file properties`

## Expected result

Table and Gallery are production-usable structured views.

Opening any database row opens a real document with the same editor from Phase 2.

## Automated gate

Cover:

- every property type;
- invalid value shapes;
- cross-database property misuse;
- non-child document value attempt;
- property delete cleanup;
- filter semantics;
- multi-sort order;
- mention/file ownership;
- Table/Gallery same record set.

## Manual validation

1. Create Projects database.
2. Add Status, Priority, Deadline, Spec Mention, Files.
3. Create documents from Table.
4. Edit cells inline.
5. Open row.
   - Expected: same values above normal document body.
6. Edit in document header, return to Table.
   - Expected: Table reflects changes.
7. Configure Gallery.
   - Expected: same documents, visual cards.
8. Filter/sort Table then Gallery.
   - Expected: semantics are consistent.
9. Mention a node via Mention property.
   - Expected: reference works without changing hierarchy.
10. Confirm no Required/Templates controls exist.

## Stop

Produce report and wait.
