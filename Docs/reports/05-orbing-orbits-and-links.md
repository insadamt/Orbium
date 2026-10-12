# Phase 5 review — Orbing orbit and link correction

Date: 2026-10-12

## Implemented

The user clarified the visual model: nested objects orbit their parent; linked
objects receive lines. The previous prototype incorrectly made the scene static
and drew containment lines. This correction keeps Orbium's type icons and theme
while separating hierarchy motion from contextual connections.

- Folder/database children revolve slowly around their actual parent. Nested
  containers carry their own descendants. Root entities remain independent.
- Containment alone produces no line, including during hover/selection.
- Saved document mentions supply lines between visible workspace nodes, including
  links across folders. Mention targets can be documents, folders, or databases.
- Lines follow both endpoints as they orbit. Reciprocal mentions share one visual
  line. Self mentions are omitted; direction is not drawn with arrows.
- Search and zoom disclosure hide a line whenever either endpoint is hidden.
- Existing type icons, floating controls, labels, navigation, and node actions
  remain. Hover/selection highlights contained context and linked neighbours.
- Motion pauses during hover, selection, keyboard focus, camera dragging, search,
  menus/dialogs, hidden pages, and offscreen scenes. Reduced motion keeps it still.
  Pause/Resume controls return; Resume clears selection before restarting.
- Orbital time is browser-local and written on visibility/page lifecycle events
  and teardown, never per frame. Focus selected uses its live position; folder
  Fit uses the focused entity's live position. No hierarchy data is changed.

## Data and source design

WorkspaceController reads endpoint IDs from the existing mention index after
ownership and hierarchy visibility filtering. Both source and target IDs must be
in the visible current workspace collection. This excludes trashed endpoints,
children beneath hidden/trashed ancestors, and other users/workspaces. No document
bodies or external graph endpoint are loaded. Existing document save transactions
continue to maintain the mention index.

Orbit placement, imperative DOM/SVG frame painting, motion lifecycle, camera,
controls, and entity rendering remain separate modules. No continuous positions
run through React state. DOM entity/line collections are cached per scene effect.
WorkspaceContents props were extracted to keep the source file below 500 lines.
No new dependencies, migrations, editor content, or portability format changes.
The user's explicit correction authorizes these workspace-local mention lines in
2D Orbing; the suspended 3D Orbit and global graph remain unchanged.

Unrelated editor/table changes already in the workspace were not modified.

## Commits

No commit created. Suggestions:

- `fix(orbing): orbit nested entities and draw only mention links`
- `feat(orbing): visualize workspace mentions between orbiting icons`

## Validation

- Targeted frontend formatting: PASS.
- `npm run lint`: PASS, 392 formatted files and 322 linted files, no warnings/errors.
- `npm run types:check`: PASS.
- Targeted Pint formatting and `./vendor/bin/pint --test app/Http/Controllers/WorkspaceController.php`: PASS.
- `php -l app/Http/Controllers/WorkspaceController.php`: PASS.
- `npm run build`: PASS. Existing oversized chunk and ineffective dynamic import
  warnings remain.
- `git diff --check` and new-file whitespace checks: PASS.
- Changed/new Orbing source files and WorkspaceContents are below 500 lines.
- No automated tests were written or run, per the user's instructions.
- Browser/runtime behaviour and visual acceptance remain for the user's manual review.

## Manual validation checklist

Prepare a workspace with Folder A containing a document and a nested folder whose
child is another document; Folder B containing a document; and a populated database.

1. Open Orbing with no document mentions in those objects. Move the pointer to
   blank space and leave it idle for 15 seconds.
   Expected: children revolve around their real folder/database parent; a nested
   folder carries its child system. There are no containment lines. All visible
   entities remain Folder/Database/FileText icons, including when zoomed out.
2. Hover, select, use keyboard focus, drag the canvas, and open a menu/dialog.
   Expected: movement pauses so targets remain usable. Deselect and move to blank
   canvas to resume; Pause stops motion and Resume restarts it.
3. In Folder A's document, insert an actual internal mention of Folder B's
   document using the editor's mention workflow, and wait for saving to complete.
   Return to/reload the workspace explorer and zoom until both documents show.
   Expected: one line joins those two documents; neither document acquires a new
   parent, and neither folder gets a containment line.
4. Resume motion and watch the linked documents while their parents move.
   Expected: the line stays attached to both icons. Hover/select either endpoint.
   Expected: the link and linked neighbour are emphasized.
5. Add a reciprocal mention in Folder B's document and return/reload the explorer.
   Expected: the pair shares one visual line, rather than two overlapping lines.
6. Remove both mentions and save, then return/reload the explorer.
   Expected: the line disappears; orbiting and hierarchy remain unchanged.
7. Add a mention of a folder or database, then return/reload.
   Expected: that explicit document-to-container reference gets a line. Other
   parent-child pairs do not gain lines merely from containment.
8. Search for a direct-child title that excludes one linked branch; then clear it.
   Expected: links with hidden endpoints disappear and return with the branch.
   Zoom out until a linked nested endpoint collapses, then zoom back in.
   Expected: its line hides/reappears with its icon; collapsed containers show counts.
9. Trash a linked target, or its containing folder, then return/reload the workspace.
   Expected: hidden/trashed endpoints and their lines disappear. Restore them and
   reload to see surviving saved references again.
10. Inspect another workspace, and optionally another account.
    Expected: no nodes or mention lines from the first workspace/account appear.
11. Double-click folders/documents/databases, use Ctrl/Cmd opening, Fit, Focus
    selected, context menus, keyboard opening, and Escape.
    Expected: normal routes, tabs, breadcrumbs, actions, and live-position focus
    work; camera movement never changes containment.
12. Pan/select, reload, switch tabs/containers, and use Grid/List/Gallery.
    Expected: camera/selection and orbital phase restore within the current
    browser context; conventional views retain their existing behaviour.
13. Enable reduced motion; hide the tab or scroll the scene offscreen; return.
    Expected: reduced motion keeps the scene still and disables playback controls.
    Hidden/offscreen scenes stop playback and resume when eligible. Light/Dark
    and narrow windows keep type icons, lines, and controls legible.

## Known limitations

Lines represent saved document-body mentions. Generic URL hyperlinks and database
mention-property values are not included. Unsaved references do not produce a
line. The explorer receives fresh mentions through normal page navigation/reload;
there is no live push subscription. Cross-workspace links remain out of scope.
Direction arrows, self-reference loops, node dragging/pinning, label collision
handling, and very-large-workspace tuning are not included. Runtime performance
and visual quality have not been measured or manually verified.

## Stop gate

Remain in Phase 5 review and wait for the user's manual feedback. Do not begin
another phase or extend to a global graph without explicit approval.
