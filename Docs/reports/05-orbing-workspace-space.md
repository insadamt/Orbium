# Phase 5 — Orbing workspace-space style correction

> Historical: superseded by the [icon-constellation prototype](05-orbing-icon-constellations.md).

Date: 2026-10-12

## User-requested correction

The user rejected the initial visual style and clarified that the workspace should
be the space itself. Documents should float independently; folders should be
entities whose contents orbit them, recursively. This revision implements that
direction within the current Phase 5 review and supersedes the original Milestone
1 direct-child hub design. No later product phase or mention overlay was started.

## Changed behavior

- Removed the workspace central planet and workspace-wide orbit tracks entirely.
- Scattered top-level entities into independent systems, reserving room for folder
  subtrees. Root documents drift gently on their own, without a workspace orbit.
- Added nested folder/database systems. Every contained entity revolves around
  its actual parent; a moving nested folder carries its descendants with it.
- Replaced large labeled planet buttons with smaller neutral entities, restrained
  titles, sparse static stars, faint parent tracks, and compact floating controls.
- Added zoom-dependent detail: children reveal as their parent orbit becomes
  readable; collapsed folders show a child count. Distant document glyphs/titles
  simplify, and offscreen entity controls hide.
- Kept the whole workspace in the scene when opening a folder. The route and
  breadcrumbs update, while the camera focuses that folder's system. Fit view
  frames the focused folder or the whole workspace at its root.
- Added Pause/Resume and automatic pausing during hover, selection, keyboard
  focus, pan, inline search, and menus/dialogs. Deselect/Escape returns focus to
  the canvas. Resume clears selection so motion can actually restart.
- Honored OS/browser reduced motion and stopped frame scheduling when the page
  is hidden, the scene is offscreen, or the scene unmounts. Animation paints DOM
  positions directly; it does not update React state continuously.
- Extended existing node menus to nested entities. Inline search retains its
  direct-child scope and shows matching branches plus their ancestor context.
- Preserved existing document/database opening, tabs, and server-authorized actions.

## Persistence and architecture

The renderer reuses the existing account-owned, trash-filtered hierarchy metadata.
It does not fetch document bodies or database values. No endpoints, migrations,
server data changes, dependencies, or archive/editor format changes were added.

Camera/selection use separate space-v2 browser-local keys, so an obsolete hub
camera cannot misframe the new layout. The settled orbital clock flushes on scene
teardown, pagehide, and backgrounding; there are no storage writes per frame.
State remains scoped by account, tab, workspace, and focused container. Clearing
browser storage resets it. Motion enabled/paused is currently a scene-local choice.

Hierarchy measurement, root placement, camera math/gestures, frame painting,
playback lifecycle, planet presentation, and controls live in separate modules.
New/modified source files stay below 500 lines. The complete hierarchy DOM remains
mounted for unfiltered nodes; offscreen hiding is not full renderer virtualization.

## Validation

- Targeted formatter: PASS.
- `npm run lint` (`vp check`): PASS; formatting and lint checks completed.
- `npm run types:check`: PASS.
- `npm run build`: PASS in 6.92 seconds; build log at `/tmp/orbium-orbing-space-build.log`.
- Build warnings: large chunks and ineffective dynamic imports in existing
  document/database modules, plus a plugin-timing diagnostic. These are warnings,
  not failures.
- `git diff --check` and added-file whitespace checks: PASS.
- New/modified source file size check: PASS; all checked files are below 500 lines.
- PHP checks: not run; no PHP source changed.
- Automated tests: not written or run, per user instructions.
- Visual feel, gesture behavior, and runtime performance: awaiting user testing.

## Manual review checklist

Prepare one workspace with a root document, two folders, documents inside those
folders, a nested folder with a document, and a database with document children.
Also include an empty folder. Refresh the app with the rebuilt assets available.

1. Open workspace root and select **Orbing**. Expected: no workspace planet or
   global ring. The root document is independent; folders/databases form separate
   systems. Grid/List/Gallery remain available.
2. Leave the pointer over the top navigation for 10–15 seconds. Expected: root
   documents drift gently and visible container children travel around their real
   parent. Labels/icons remain upright; there is no whole-workspace rotation.
3. Zoom toward a folder, then its nested folder. Expected: progressively deeper
   children appear with their own parent tracks. The nested folder carries its
   children as it revolves around its parent. Zoom out: deeper detail collapses
   and child counts appear rather than a mass of large labeled buttons.
4. Hover an entity, select it, then move away and use **Deselect** or Escape.
   Expected: interaction stabilizes the scene; it resumes when selection/focus/
   hover no longer block movement. Test Pause and Resume: explicit resume clears
   selection and allows movement, without changing the camera or hierarchy.
5. Click a contained document. Expected: its full title and real parent title
   appear, with a connection to that parent. Click the root document: its parent
   is the workspace, with no invented central planet or connection to one.
6. Drag blank space, zoom near the pointer, and use **Focus selected** and **Fit view**.
   Expected: accurate camera motion and focus on the live entity position. Fit
   recovers the workspace at its root and the focused system on a folder route.
7. Double-click a folder. Expected: its system is framed and breadcrumbs update
   within the workspace space. Pan/zoom out to see other systems. Switch to List:
   that folder's direct children and conventional media header appear normally.
8. Open a document/database, then use app/browser Back. Expected: the existing
   work surface and restored Orbing camera/selection/orbital clock. Open a node
   in another app tab and verify independent cameras. Reload to check persistence.
9. From workspace-root Orbing, right-click a nested entity and rename it. Expected:
   its real node title updates. Trash it: the node and any trashed subtree disappear
   through existing server actions. Restore via Trash and return: correct parentage
   reappears. Blank-space creation uses the breadcrumb container, not a hovered entity.
10. Search for a direct-child folder title. Expected: its branch and ancestor
    context remain; unrelated systems and their old tracks disappear. Search for
    a root document: only the matching branch remains. An unmatched title shows
    no-results. Clear Search: the original geometry returns. Ctrl+Space still works.
11. Use Tab, Space, arrows, Home/End, Enter, and Shift+F10 on visible entities.
    Expected: visible focus, readable target framing, normal opening/actions, and
    no interference with search/menu input. Canvas arrows pan and Home fits.
12. Enable OS/browser reduced motion. Expected: a static scene with all camera and
    node actions working; the motion control indicates reduced motion. Background
    the browser tab or navigate away, then return: no large time jump on resuming.
13. Check Light/Dark, Normal/Frosted, a wallpaper, and a narrow window. Expected:
    readable entities, subdued stars, upright titles, and accessible nonoverlapping
    controls. An empty workspace has a short creation hint and no fake central orb;
    the empty folder remains a normal entity with no child track.

## Known limits

- Large/deep hierarchies can still crowd labels; advanced collision handling,
  reveal hysteresis, and full renderer virtualization are not implemented here.
- Runtime responsiveness and visual timing have not been measured in a browser.
- Orbital geometry is deterministic and kinematic, with no physical simulation.
- Mention links and drag-to-reparent are outside this correction.

## Commits and stop gate

No commits created. Suggested commit messages:

- `feat(orbing): make workspaces free space with nested orbital systems`
- `fix(orbing): replace workspace hub with floating document systems`

Await manual review of this correction. Fix review issues in the current phase;
do not start another product phase automatically.
