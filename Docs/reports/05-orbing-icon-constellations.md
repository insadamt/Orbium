# Phase 5 review — Orbing icon-constellation prototype

> Historical: superseded by the [orbit and link correction](05-orbing-orbits-and-links.md).

Date: 2026-10-12

## Implemented

The user asked to keep Orbium's own style, accepted a constellation prototype,
and specified reference folder/database/document icons instead of dots. This
working prototype replaces the previous revolving-planet presentation in the
existing Orbing explorer view.

- Existing Lucide Folder, Database, and FileText icons identify every visible
  entity, including distant documents. Custom node images/emoji are not used in
  this view; saved media and other explorer views are unchanged.
- Workspace remains the canvas with independently placed root entities.
- Container children form deterministic, variable-distance clusters; nested
  branches retain their own reserved footprint and progressive zoom disclosure.
- Thin lines show real parent-child relationships. Root entities have no
  artificial workspace connection. Search and zoom hide irrelevant connections.
- Hover/selection emphasizes nearby nodes and connections; distant document
  labels hide while icons stay recognizable. Selected labels remain visible even
  when hovering another entity. Collapsed containers show child counts.
- Planet shading, orbit tracks, database rings, decorative stars, continuous
  motion, animation observers, and orbital clock writes have been removed.
- Existing pan, wheel/pinch zoom, Fit, Focus selected, keyboard navigation,
  app-tab opening, folder routes, menus, and creation remain connected.
- Existing floating controls and light/dark theme tokens are reused.
- Entity terminology replaces planetary terminology in the source modules.

## Scope and implementation

No force engine, new dependency, mention edges, migrations, document format,
archive changes, or hierarchy writes are introduced. Layout remains deterministic
and static so the user can review the visual direction first. Camera/selection
use account/tab/workspace/container-scoped constellation-v3 browser keys, avoiding
restoration of cameras from old orbital geometry.

Focused modules separate metadata layout, entity presentation, camera lifecycle,
DOM/SVG projection, and controls. Source files are below 500 lines. Projection
runs on scene state changes rather than an animation loop. The existing
WorkspaceContents integration remains below 500 lines.

Unrelated editor/table work present in the workspace was left untouched.

## Commits

No commit created. Suggestions:

- `feat(orbing): add icon constellation explorer prototype`
- `fix(orbing): replace planets with type icons and hierarchy connections`

## Validation

- Targeted formatter: PASS.
- `npm run lint`: PASS, 390 formatted files and 320 linted files, no errors/warnings.
- `npm run types:check`: PASS.
- `npm run build`: PASS; build warnings remain for oversized chunks, ineffective
  dynamic imports in document/database modules, and plugin timing diagnostics.
- `git diff --check` plus new Orbing file whitespace checks: PASS.
- Automated tests were neither written nor run, per the user's instructions.
- Browser/runtime and visual acceptance have not been performed; the user tests
  manually. Static checks do not establish visual quality or interaction correctness.

## Manual validation checklist

Use a workspace with a root document, folder, nested folder/document, and a
populated database. A second independent folder helps evaluate cluster separation.

1. Choose Orbing from a workspace root.
   Expected: the workspace is the canvas; Folder/Database/FileText icons identify
   entities. There is no central workspace object, planet shading, starfield,
   orbit ring, or Pause/Resume control.
2. Inspect visible folder/database children.
   Expected: thin lines join children to their actual parents. Root documents
   have no artificial lines. Separate root systems remain distinct.
3. Leave the scene idle for 20 seconds.
   Expected: entities remain still and are easy to target.
4. Hover a folder, document, and database, then move onto blank canvas.
   Expected: their nearby relationships become clearer; unrelated nodes soften.
   Blank-canvas hover restores selection emphasis, or the neutral scene if none
   is selected. Hidden labels reveal on hover.
5. Select a document, then hover a different branch; press Escape.
   Expected: selection shows its title/path/actions and keeps its label visible.
   Escape clears selection and returns keyboard focus to the canvas.
6. Zoom out, then zoom toward a nested folder.
   Expected: visible entities remain type icons rather than dots; deeper children
   and labels reveal progressively. Collapsed parents show a child count. Lines
   disappear with collapsed or filtered children.
7. Drag blank canvas, use wheel zoom near the pointer, and use touch pinch if available.
   Expected: pan/zoom remains responsive and does not change breadcrumbs or parents.
   Fit restores the current context; Focus selected centers the selected entity.
8. Double-click a nested folder; return through breadcrumbs.
   Expected: Orbing remains selected and frames the folder's constellation;
   breadcrumbs/routes update normally, and the root space is reachable again.
9. Open a document/database; use Ctrl/Cmd opening and the item context menu.
   Expected: existing editor/database surfaces and app tabs work. Rename updates
   titles; trash removes the entity and corresponding lines without stale targets.
10. Search a direct-child title; clear the query.
    Expected: matching branches and ancestor context appear, with no unrelated
    lines. No match shows the existing message. Clearing restores the space.
11. Right-click blank space or focus the canvas and press Shift+F10; create an entity.
    Expected: existing creation actions use the route's current container and
    the new entity appears with the correct reference icon.
12. Use Tab/arrows, Enter, Space, Shift+F10, and Escape.
    Expected: visible entities can be selected/opened, focus is visible, and menus
    remain accessible. Empty-canvas arrows pan and Home fits.
13. Check Light/Dark, Normal/Frosted surfaces, a narrow window, and reduced motion.
    Expected: icons, labels, connections, and controls remain legible; panels fit
    within the viewport. Reduced motion suppresses icon hover transitions.
14. Pan/select, reload, switch app tabs, then switch to Grid/List/Gallery.
    Expected: the Orbing camera/selection restore in the correct context;
    conventional views retain custom media, direct-child browsing, and ordering.

## Known limitations

This is a visual prototype awaiting review. It does not implement a force layout,
node dragging/pinning, label collision avoidance, or smooth folder camera
transitions. Very dense/deep hierarchies may need spacing/reveal tuning. Hidden
nodes still have mounted DOM elements; large-workspace performance is unmeasured.
Containment lines are not mention connections. No optional continuous motion is
provided in this pass.

## Stop gate

Remain in Phase 5 review. Wait for the user's visual feedback before extending
this prototype; do not start another product phase.
