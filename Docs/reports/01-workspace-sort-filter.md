# Workspace and folder sorting and filtering

Phase 1 hierarchy follow-up requested on 2026-10-15.

## Changes

- Review follow-up: filter and sort triggers are icon-only (Filter and ArrowDownAZ), with no visible titles. Menu options retain text, accessible button names include the current choice, and active selections use an accent background.
- Added All types, Folders, Documents, and Databases filters beside explorer view controls.
- Added Manual order, Name A–Z, Name Z–A, and Type sorting.
- Type sorting groups folders, databases, then documents, with names sorted within each group.
- Name sorting ignores letter case and uses natural numeric ordering (Page 2 before Page 10).
- Filter and sort choices apply to Grid, List, and both Gallery layouts, and combine with current-page title search.
- Choices use existing browser-local navigation persistence independently per workspace root or folder; they do not alter server sibling positions.
- Drag actions and Alt+arrow reordering require Manual order. A visible hint explains this when another sort is selected. Opening, selection, and item menus remain available.
- Empty filtered results display a status message. Toolbar controls wrap on narrow screens and are disabled during hierarchy mutations or dragging.
- New selection logic is extracted into a focused hook. No migrations, archive changes, or new dependencies.

## Validation

- `npm run lint`: passed, including formatting and lint checks.
- `npm run types:check`: passed.
- `npm run build`: passed, with warnings about large chunks, mixed static/dynamic imports in existing document modules, and plugin timings.
- `git diff --check`: passed.
- Automated tests were neither added nor run, per repository instructions. Browser behavior awaits user manual validation.

Initial type checking caught overly narrow inferred preference setter types; explicit string types fixed the issue, and the final checks above passed.

## Manual checklist

1. Confirm the toolbar shows a filter icon and an alphabetical-sort icon without visible button titles. Open both menus.
   Expected: readable options and the current selection check appear. Choosing a non-default sort or filter highlights its icon; All types and Manual order clear the respective highlight.
2. Open a workspace with a folder, database, and documents named `Page 2`, `Page 10`, and `Alpha`. Choose Name A–Z.
   Expected: names ascend with Page 2 before Page 10. Choose Name Z–A: names descend, with Page 10 before Page 2.
3. Choose Type and All types.
   Expected: folders appear first, then databases, then documents; each group is ordered by name.
4. Choose each type filter.
   Expected: only direct children of the chosen type appear. All types restores every direct child.
5. With Documents selected, open current-page search and search for `Page`.
   Expected: only matching documents appear, and the search count matches the visible items. Search for an absent name: the empty-results message appears. Clear search: the document filter remains applied.
6. Switch between Grid, List, and Gallery, including natural and uniform Gallery layouts.
   Expected: filtering and ordering stay consistent; menus and page opening continue to work.
7. Choose Name A–Z, then try dragging a card and Alt+arrow reordering.
   Expected: items stay in sorted order, no hierarchy change occurs, and the Manual order hint is visible. Item actions still open.
8. Choose Manual order and All types. Drag a card or use Alt+Left/Right in Grid/Gallery or Alt+Up/Down in List, then reload.
   Expected: manual reordering works and persists. Selecting a name sort and returning to Manual order restores that saved manual sequence.
9. Set a workspace root to Documents and Name Z–A. Open a folder through the sidebar and set it to All types and Type. Switch between them, then reload.
   Expected: each container restores its own choices in the same browser. A different workspace has independent choices.
10. Filter to a type absent from the current folder.
   Expected: a clear empty-results message appears; the filter remains accessible to restore All types.
11. Check at a narrow window width and in light/dark and reduced-motion modes; navigate both menus with keyboard arrows, Enter, and Escape.
    Expected: toolbar controls wrap, selected choices remain visible, and menus follow existing theme, keyboard, and reduced-motion behavior.

## Commit suggestion

`feat(hierarchy): add workspace explorer sorting and type filters`

No commit created. Existing edits to `Docs/reports/01-easier-page-reordering.md` are unrelated and were preserved.
