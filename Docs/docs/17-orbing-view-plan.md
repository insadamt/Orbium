# Orbing View — orbiting hierarchy and mention connections

Date: 2026-10-12

## Current approved direction

Orbing remains an additional view beside Grid, List, and Gallery. After reviewing
both orbital presentations, the user requested Orbium's own visual style rather
than an Obsidian copy, accepted the constellation prototype, and explicitly asked
for folder, database, and document reference icons instead of dots.

The user's follow-up corrects the model: contained objects orbit their parent,
while lines represent linked objects. Implement links through the existing saved
mention index, scoped to visible entities in the current workspace. This explicitly
revises the prototype's static-motion and no-mention restrictions within Phase 5.
See [the orbit-circle follow-up](../reports/05-orbing-orbit-circles.md) and
[the current correction report](../reports/05-orbing-orbits-and-links.md). The earlier
[workspace-space report](../reports/05-orbing-workspace-space.md) and
[first milestone report](../reports/05-orbing-m1-navigation.md) are historical.
See [the historical prototype report](../reports/05-orbing-icon-constellations.md).

## Visual model

- Workspace: the navigable canvas, with no central workspace entity.
- Document: a recognizable FileText icon; independent at the workspace root.
- Folder: a Folder icon with children revolving around it.
- Database: a Database icon with its documents revolving around it.
- Nested containers: smaller constellations revealed progressively by zoom.

Use Orbium's theme, monochrome typography, and floating controls. Icons stay
recognizable at every visible zoom level; they never become dots. In this view,
type reference icons take precedence over custom node emoji/image icons, without
changing saved media or conventional views. Remove planetary shading, database
rings and decorative stars. Show faint dashed circular orbit paths at each
visible child's exact orbital radius, centered on its moving parent. Containment
has no straight parent-child line. Thin lines show saved document mentions to another
visible node. Root entities have no artificial connection to the workspace.

## Layout and interaction

Use deterministic, variable-distance cluster placement with space reserved for
subtrees. Children rotate slowly at their assigned distances around their real parent;
nested containers carry their descendants. Roots remain independent fixed anchors.
Use an imperative animation loop; do not update React state every frame. Pause on
hover, selection, keyboard focus, camera dragging, search, dialogs/menus, hidden
pages, and offscreen views. Pause/Resume is explicit; reduced motion keeps entities
still. Persist orbital time on lifecycle events, never on every frame. There is
no physics engine or extra dependency. Layout
quality for deep or dense hierarchies needs manual review; advanced label
collision handling is deferred.

- Drag empty space to pan; pointer-anchored wheel and touch pinch zoom.
- Click selects; double-click or Enter opens; modified opening uses app tabs.
- Hover/selection brightens immediate connections and softens unrelated nodes.
- Labels become quiet at distant zoom and reappear on hover/focus/selection.
- Child counts mark containers whose descendants have collapsed at wide zoom.
- Folder opening retains Orbing and updates existing routes/breadcrumbs.
- Fit frames the current workspace/container; Focus selected centers its entity.
- Existing keyboard navigation, context menus, creation, rename, and trash remain.
- Inline search retains direct-child title matching with matching branches and
  ancestors. Ctrl+Space remains Search Master.
- Camera changes never write hierarchy or navigate on their own.

Keep small camera controls and the selection-only details island. Load only
mention endpoint IDs whose source and target are both in the authenticated
workspace's visible hierarchy. Exclude trashed nodes and hidden descendants.
Do not fetch document bodies. Draw links only when both endpoints survive search
and zoom disclosure. Reciprocal mentions share one visual line, without arrows;
self mentions do not draw a line. Cross-workspace links and generic URL hyperlinks
are not represented. Saved document-body mentions supply the lines; database
mention-property values are not added to this index.

## Persistence and review boundary

Camera and selection remain local to account, app tab, workspace, and focused
container. Use constellation-v3 keys so old planetary layouts do not restore an
inappropriate camera. No migrations, document formats, or archive changes.

This is a working prototype within the current explorer review, not visual
acceptance or approval to start another phase. Do not write/run automated tests.
Run formatting, lint, types, build, and whitespace checks; provide exact manual
steps and commit suggestions. Further layout tuning depends on the user's review.
