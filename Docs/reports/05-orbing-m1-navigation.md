# Phase 5 — Orbing Milestone 1 manual review report

Date: 2026-10-12

This original implementation was superseded during user review by the
[workspace-space style correction](05-orbing-workspace-space.md). Use that report's
manual checklist and scope; the original results below remain historical evidence.

## Implemented

- Added **Orbing** beside Grid, List, and Gallery on workspace and folder pages.
- Rendered the current container and its direct children as a stable 2D system.
  Children follow persisted order across concentric orbital tracks. Folders use
  larger planets; databases have a ring accent; documents retain icons and titles.
- Added empty-space dragging, pointer-centered wheel/trackpad zoom, two-pointer
  touch pan/pinch initiated on empty space, zoom buttons, Fit view, and Focus selected.
  Zoom is bounded from 4% to 300%; panning does not change hierarchy or navigation.
- Click selects a planet, draws its parent connection, and shows its full title
  and an Open action. Double-click/Enter opens; Ctrl/Command+click or modified Enter
  uses existing app-tab navigation. Folder opening keeps Orbing selected at the
  destination and updates the normal location/breadcrumbs.
- Reused existing context actions for creating, opening, renaming, and trashing.
  Planet dragging does not move/reorder data; those actions remain in other views.
- Added native focusable planet buttons, keyboard selection/opening, arrow-key
  traversal in sibling order, Home/End traversal, Shift+F10 actions, and Escape
  selection clearing. Arrow keys on empty canvas pan; Home fits the view.
- Stored settled camera and selection in browser-local, versioned state scoped
  by account, app tab, workspace, and container. State flushes on scene teardown,
  pagehide, and backgrounding. Invalid storage falls back safely; missing selected
  nodes clear selection and refit the current system.
- Kept inline search limited to direct-child titles. Filtering hides unmatched
  planets while retaining the unfiltered system's positions. Search Master stays
  available through Ctrl+Space.
- Matched existing theme/surface colors without another animated background.
  Folder media headers stay available in conventional views; Orbing uses its
  central title to keep room for the canvas. No continuous animation is mounted.

## Scope and architecture

This is the first milestone of the [approved plan](../docs/17-orbing-view-plan.md),
within Phase 5 review. It does not implement recursive nested systems, continuous
orbital movement, mention links, a separate database Orbing view, or 3D Orbit.

The existing account-owned explorer payload supplies hierarchy metadata and
already excludes nodes with trashed/missing ancestors. No endpoint was added.
No document bodies or database values are loaded for the scene. SVG draws the
tracks; HTML buttons provide accessible planet interaction. Camera gestures,
layout, persistence, planet rendering, and scene integration use separate files.
All new source files and the modified explorer remain below 500 lines.

## Commits

No commits created. Suggested alternatives for the logical implementation commit:

- `feat(orbing): add spatial explorer navigation`
- `feat(explorer): add zoomable Orbing view with camera restoration`

The earlier planning document is also uncommitted; its suggested separate commit
is `docs(orbing): plan additional spatial explorer view`.

## Migrations / persistent format changes

No migrations, server data changes, dependency additions, editor format changes,
or portable archive changes. The existing browser-local explorer view preference
accepts `orbing`; camera data uses separate browser-local keys and does not enter
portable archives.

## Validation

- Targeted `vp fmt`: PASS.
- `npm run lint` (`vp check`): PASS; 385 files formatted, no lint warnings/errors
  across 316 files.
- `npm run types:check`: PASS.
- `npm run build`: PASS; final build completed in 8.32 seconds.
- Build warnings: chunks over 500 kB and ineffective dynamic imports in existing
  document/database modules. These are warnings, not build failures.
- `git diff --check` and added-file whitespace verification: PASS.
- Source file size check: PASS; every new source file and the modified explorer
  are below 500 lines.
- PHP checks: not run; no PHP source changed.
- Automated tests: not written or run, per user instructions.
- Browser appearance, gestures, tab restoration, and runtime performance:
  awaiting user manual validation. Static checks do not establish visual quality.

## Exact manual checklist

Use an existing workspace with at least two folders, a nested folder, root-level
documents, a database with documents, and an empty folder. Include long titles
and a second workspace. Refresh the application with the rebuilt assets available.

1. Open the workspace root and select the new **Orbing** view switcher option.
   Expected: workspace center, direct children on faint tracks, type-specific
   planets, and accessible camera controls. Descendants of folders/databases are
   absent until their normal location is opened. Grid/List/Gallery still work.
2. Drag empty space in every direction, then scroll near a planet and use the
   zoom buttons. Expected: only the camera changes; wheel zoom stays anchored to
   the pointer, controls remain fixed, and scrolling the canvas does not scroll
   the page beneath it. If touch is available, pinch starting on blank space.
3. Pan until all planets are offscreen and click **Fit view**. Expected: the
   current system returns to a useful frame. Click a planet, then **Focus selected**.
   Expected: its full title appears, its parent connection highlights, and the
   camera centers on it. One normal click does not open the editor.
4. Double-click a folder and repeat for a nested folder. Expected: each opens
   in Orbing with its own center and direct children; breadcrumbs update. Use
   app Back, browser Back, and an ancestor breadcrumb. Expected: correct location
   and saved camera restoration. Switch to List: that location's children appear.
5. Double-click a document. Expected: the existing editor opens normally. Use
   app Back: the previous Orbing camera/selection returns. Repeat with a database:
   its existing database work surface opens without an extra view being added.
6. Ctrl/Command+click a planet, then return to the explorer tab. Expected: normal
   new-tab opening. Open the same explorer location in two app tabs, adjust their
   cameras differently, and alternate between them. Expected: independent cameras.
   Reload: the saved view and camera restore. Switch workspace: state stays scoped.
7. Right-click empty space and create a folder/document. Expected: the focused
   container is the parent, and the new planet appears after the server update.
   Right-click a folder and use Open. Expected: the destination remains Orbing.
   Rename a planet: the label/details update without duplicating the node.
8. Select a planet and delete it using its menu and confirmation. Expected: it
   goes to Trash, selection clears, and the system refits. Open Trash through the
   account/workspace menu, restore it, and return. Expected: it reappears in its
   actual parent; no trashed descendants become visible as orphans.
9. Type a direct-child title in the top inline Search field. Expected: matching
   planets remain at their original orbital positions; unrelated descendants are
   not searched. Try an unmatched title, then clear it. Expected: a no-results
   message, then the original system. Ctrl+Space still opens Search Master.
10. Use Tab to reach a planet, Space to select, arrow keys to traverse siblings,
    Home/End to reach the first/last, and Enter to open. Expected: visible focus,
    camera focus keeps the target readable, and Shift+F10 opens its actions.
    Focus empty canvas and use arrows/Home: pan/fit works. Search and menu typing
    must not be captured by canvas shortcuts.
11. Open the empty folder. Expected: its center and creation hint remain usable,
    Fit view works, and Shift+F10 or right-click can create an item there.
12. Repeat in Light/Dark, Normal/Frosted, with a wallpaper, reduced motion, and
    a narrow window. Expected: readable labels and reachable controls; no automatic
    world motion. Expand/close inline Search: the canvas adapts below the shell.

## Known limitations

- One focused container and its direct children are shown at a time. Simultaneous
  nested systems and progressive detail belong to Milestone 2.
- Planets remain stationary. Optional slow orbital motion belongs to Milestone 3.
- Far zoom and large child counts can crowd labels; advanced collision handling
  and offscreen culling remain Milestone 2 work. Runtime responsiveness is unmeasured.
- Camera restoration is browser-local; clearing browser storage resets it.
- No mention overlay or drag-to-reparent interaction exists in this milestone.

## Stop gate

Await the user's Milestone 1 manual review. Fix reported issues within this
milestone. Start Milestone 2 only after explicit approval.
