# Phase 5 review — prevent active-tab split dragging

Date: 2026-10-17.

## Change

The active tab previously qualified for edge splitting whenever another compatible tab existed. Both drag preparation and the navigation store selected that other tab automatically. The active tab could therefore leave the strip and create an unintended split.

Active tabs now use the existing drag constraint to stay within the tab strip and remain reorderable. They do not show split targets or prepare a companion. The navigation store also rejects splitting the active tab, including after asynchronous preparation. Drop handling requires current split eligibility before using an edge target. Eligible inactive tabs still split beside the active tab on the selected side.

This supersedes earlier manual instructions allowing active-tab edge splitting. No dependencies, migrations, persisted formats, or backend behavior changed. No commit was created.

## Validation

- `npm run types:check`: PASS.
- `npm run lint`: PASS, including formatting of 549 files and lint of 455 files.
- `npm run build`: PASS (13.09 seconds). Warnings reported large chunks, ineffective dynamic imports, and plugin timing.
- `git diff --check`: PASS.
- No automated tests were written or run, per user instructions.
- Browser interaction remains pending the user's manual review.

## Manual checklist

Hard-refresh to load the updated assets. Open two different document tabs A and B.

1. Select A and drag its tab toward the left and right viewport edges, then release. Expected: the dragged preview stays within the tab strip, no split targets appear, and A stays a single page.
2. Drag active A horizontally over B within the strip. Expected: tab order changes normally; A remains selected and no split is created.
3. With A selected, drag inactive B to the right edge. Expected: split targets appear; dropping puts A on the left and B on the right, each once.
4. End the split, select A, and drag inactive B to the left edge. Expected: B appears on the left and A on the right. Both documents remain editable. End the split again.
5. Select B and try dragging B to either edge. Expected: B now stays constrained to the strip and cannot create a split. Drag inactive A to an edge instead. Expected: splitting works.
6. Leave only one tab open and drag it toward either edge. Expected: no split targets or duplicate pane appear.
7. Repeat active/inactive dragging with a document and a database tab, and with reduced motion enabled. Expected: the active tab remains constrained; the inactive eligible tab still creates the requested split.

Suggested commit: `fix(navigation): prevent active tabs from dragging into splits`

Remain in Phase 5 for manual review.
