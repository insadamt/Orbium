# Phase 5 review — visible Orbing circles

Date: 2026-10-12

## Implemented

The user requested visible orbit circle lines. Each nested entity now has a faint
dashed circular path at its exact orbital radius, centered on its parent's live
position. A moving nested folder carries its child circles with it. Hovering or
selecting an entity/parent strengthens the corresponding circles slightly.

Paths hide when search or zoom disclosure hides the child or its parent. Root
entities have no workspace orbit. Solid mention connections remain separate;
there are no straight containment connections. Paths draw beneath the icons and
do not intercept pointer input. Pan, zoom, pause, and reduced motion retain the
existing behaviour. No dependencies, migrations, or persistence changes.

## Validation

- Targeted formatting: PASS.
- `npm run lint`: PASS, 392 formatted files and 322 linted files, no errors/warnings.
- `npm run types:check`: PASS.
- `npm run build`: PASS; existing chunk-size and ineffective dynamic import warnings remain.
- `git diff --check` and new-file whitespace checks: PASS.
- Changed source files remain below 500 lines.
- No automated tests written or run. Visual/runtime review is pending the user's manual checks.

## Manual checklist

1. Open Orbing with a populated folder or database and zoom until children appear.
   Expected: each child follows a faint dashed circular path around its parent.
   Root entities have no path around an artificial workspace object.
2. Observe a nested folder while motion is enabled.
   Expected: its child circles remain centered on the moving folder, and icons
   stay on their respective circles.
3. Hover/select a child or its parent, then deselect and move to blank canvas.
   Expected: the relevant circles become slightly stronger and movement pauses;
   normal faint circles and movement return after interaction.
4. Pan/zoom, collapse deeper children by zooming out, and filter through search.
   Expected: circle centers/radii follow the camera; hidden branches lose their
   circles, and clearing search/zooming in reveals them again.
5. Display a saved mention between two entities.
   Expected: a solid connection joins the linked icons, distinguishable from
   dashed orbit paths. Containment alone adds no straight line.
6. Pause motion and enable reduced motion; check Light/Dark mode.
   Expected: circles remain visible around still icons and remain legible in
   both themes. Clicking, context menus, and canvas panning work through paths.

## Known limitations

Variable orbital distances mean a parent may show several concentric paths.
Dense-workspace appearance and performance remain unmeasured. No automatic path
merging or extra display preference is added in this focused correction.

## Commits and stop gate

No commit created. Suggested commit: `feat(orbing): show circular orbit paths`.
Remain in Phase 5 review and wait for manual feedback before further scope.
