# Phase 5 review — Remove Orbing view

Date: 2026-10-12

## Implemented

At the user's request, removed the additional Orbing explorer view from workspace
and folder pages. Grid, List, and Gallery remain available. Removed the renderer,
entity layout, camera storage and controls, motion loop, stylesheet and CSS import,
Orbing props, folder view propagation, and the explorer-only mention-link query.
Folder media headers now appear for every remaining explorer view.

The explorer validates restored view selections against Grid, List, and Gallery.
A previously saved Orbing selection renders Grid with its switcher selected.
Choosing another supported view persists through the existing navigation store.
Updated the active phase, UI guidance, domain guidance, and Orbing plan to mark
previous Orbing directions as historical and superseded by this removal.

## Commits

No commit created. Suggested messages:

- `refactor(explorer): remove Orbing view and its runtime`
- `chore(explorer): remove Orbing controls and mention-link loading`

## Persistent format changes

No migrations, document content changes, archive changes, or user-data deletion.
Existing browser-local Orbing camera snapshots are inert; navigation storage
continues to use its existing format. Document mentions and their index remain.

## Validation

- Targeted `vp fmt` on the five changed frontend/CSS files: PASS.
- `npm run lint`: PASS; 390 files formatted correctly, 321 files linted with no
  warnings or errors.
- `npm run types:check`: PASS.
- `./vendor/bin/pint --test app/Http/Controllers/WorkspaceController.php`: PASS.
- `php -l app/Http/Controllers/WorkspaceController.php`: PASS.
- `npm run build`: PASS. Large-chunk and ineffective dynamic-import warnings
  remain, as recorded in earlier reports.
- `git diff --check`: PASS.
- Source search: no Orbing or mentionLinks references remain in resources, app,
  or routes.
- No automated tests were written or run, per the user's instructions.

## Manual test checklist

1. Reload a workspace root and open a nested folder.
   Expected: the explorer switcher offers only Grid, List, and Gallery. No
   Orbing canvas, orbit paths, playback controls, or camera controls appear.
2. If a workspace or folder previously had Orbing selected, reopen it after
   reloading the application.
   Expected: Grid renders immediately and its switcher button is selected;
   the folder title, icon, and configured cover are visible.
3. Switch between Grid, List, and Gallery in the workspace and folder. Select
   List in one container and Gallery in another, then navigate away and back.
   Expected: each layout renders correctly and retains its own supported view.
4. In Gallery, open Gallery appearance, change layout/ratio/fit, save, and reload.
   Expected: the selected appearance persists and covers render correctly.
5. Open a folder, document, and database; use Ctrl/Cmd opening and breadcrumbs
   to return to the parent.
   Expected: existing routes, tabs, and breadcrumbs work and the parent shows
   only its direct children.
6. Search for a direct-child title, then a title that matches nothing, and clear
   the search.
   Expected: matching items appear, an unmatched search displays the no-results
   message, and clearing restores the direct children.
7. Create a temporary item through the empty-space context menu. Rename it,
   reorder it by dragging, move it into a folder and back using the parent drop
   zone, then trash it and restore it from Trash.
   Expected: each action succeeds and hierarchy updates appear normally.
8. Open a document with an existing internal mention, follow it, and return.
   Expected: mention navigation and saved document content still work.
9. Repeat the workspace/folder layout checks with Light/Dark themes and a narrow
   window.
   Expected: remaining controls and layouts remain usable.

## Known limitations and stop gate

Browser interaction has not been manually verified; acceptance belongs to the
user's checklist above. Old Orbing camera snapshots can remain in browser storage
but no runtime reads them. Remain in Phase 5 review; no later phase was started.
