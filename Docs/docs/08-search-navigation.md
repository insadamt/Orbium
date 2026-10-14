# Search Master, workspace selector, tabs and navigation

> Current home/workspace/folder override (2026-09-30): the floating workspace brief supersedes older native-selector, sidebar, card/row, and orbital-carousel guidance below for these routes. Render only direct children as compact horizontal objects. Use a custom workspace menu, independent floating top controls, a separate breadcrumb-path island immediately right of the workspace selector, and a centered tab island whose plus button opens workspace home in a new tab. Ancestor breadcrumbs navigate directly to their hierarchy location. The in-app Back button hides at workspace roots and when the current tab has no earlier page. Create items through the empty-space context menu, contextual user menu, or Search Master. Right-click an item for Open, New tab, Rename, and Delete; do not show Move. Click/Enter opens an entity in the current tab; Ctrl+click or Ctrl+Enter opens a new app tab. Space selects a focused item. Empty containers stay visually empty. Document and database pages share these floating top controls; their existing work surfaces sit inside one spacious floating island. See `../reports/05-floating-workspace.md`.

## Inline current-page search

Orbing (revised 2026-10-12) uses the same direct-child title search. Filtering keeps
matching branches and their ancestor context, hiding unrelated systems without
rearranging orbital positions. Search pauses motion; mention lines appear only
when both endpoints are in visible matching branches. Search Master
and normal document/database opening retain their existing behavior. Orbing
folder opening navigates to that folder with the Orbing preference selected;
camera movement alone adds no navigation-history entry.

The floating top Search control expands to a focused inline input. It is separate from Search Master. It filters only direct children on explorer pages, current database document titles, and settings categories. On a document it counts text matches while typing; Enter/Shift+Enter selects the next/previous match. Closing clears the query. Changing routes resets the input. `Ctrl + Space` remains the global Search Master shortcut.



## Search Master

Shortcut:

```text
Ctrl + Space
```

The UI should appear immediately with input focus.

Opening behavior:

- world/content dims slightly;
- Orbit continuous movement pauses/reduces;
- background blur increases;
- panel appears with a short GSAP/CSS transition.

## Empty query

Show:

- recent items;
- favorites/pinned if implemented;
- useful commands.

Do not show arbitrary search results.

## Search result types

- Folder
- Document
- Database
- Database document
- Tag
- Command

Optional workspace result may be shown in workspace switching context.

## Search fields

Search across current workspace:

- node title;
- tag name;
- document plain text;
- selected searchable database values;
- mention targets/context where useful.

## Ranking

Base ranking:

1. exact title;
2. title prefix;
3. fuzzy title;
4. tag/property;
5. body text.

Context boosts:

- recently opened;
- frequently opened if tracked;
- current folder proximity.

Do not allow recency to overwhelm an exact title match.

## Search snippets

Content result example:

```text
API Documentation
Work / Cabek / Backend

"...Bearer tokens are generated..."
```

Opening a body match should jump to the relevant block/position where technically reliable.

## Command mode

Typing `>` should prioritize commands.

Initial commands may include:

```text
New document
New folder
New database
Go to workspace root
Open Settings
Toggle appearance
```

Commands must obey current containment rules.

## Power filters

Initial parser may support:

```text
type:doc
type:folder
type:db
#tag
in:FolderName
```

Do not let query-language implementation delay the basic fast title/content search. The parser can be introduced incrementally inside Phase 4.

## Search result actions

A result can expose:

- Open
- Open in new tab
- Reveal in Orbit
- Favorite
- Copy internal reference/link if defined

## Workspace selection and hierarchy browsing

The workspace name in the top bar is a native select. Selecting a workspace opens its root. Workspace and folder pages show a collapsible folder tree and the hierarchy explorer; explorer drag/drop moves use the same validated server action as other moves.

## Tabs

Tab types:

```text
orbit
document
database
settings
```

Persist enough tab state to survive reload.

Recommended browser-local state:

- tab identity;
- active tab;
- local view state;
- navigation history.

Do not make the database schema depend on tab persistence.

## Default opening behavior

Normal navigation may replace/navigate within the active tab.

Explicit modifier/open-in-new-tab creates a new tab.

This prevents uncontrolled tab growth.

### Visited tab performance (2026-10-06)

Visited app tabs restore their latest session-memory page snapshot through Inertia. Document editors stay mounted while their tab is hidden, preserving undo and editing state and continuing autosave. Hidden editors do not handle active-document shortcuts or schedule new Mermaid preparation. Explorer, database, and settings snapshots refresh after appearing. Unvisited restored tabs still load from the server while outgoing content remains visible; outgoing documents are inactive during that wait. Document response registration and initial tab setup settle before the visible handoff. Document surfaces do not fade from transparent or show an extra generic loading island.

Saved tabs close without waiting for the destination response; editor destruction is deferred until after a frame. Pending document saves block removal and flush the latest snapshot, including hidden documents and split panes. Loaded document tabs keep their existing mounted editor when entering or leaving a split; grid placement changes without an iframe reload. Clicking a native document pane selects its tab for editor shortcuts. Holding an eligible tab prepares its document response/editor or database iframe before drop. Split pages keep natural content height and the same initial responsive top gap as standalone pages. Each pane scrolls independently under the navbar, including its initial top gap. Wheel scrolling over a pane moves only that pane; wheel scrolling outside both panes moves both by the same distance, without a modifier. Each pane stops at its own boundaries. Embedded panes resize to their content and forward wheel input to their containing pane when a nested editor cannot consume it. GSAP moves the companion aside and pops the dropped pane in; ending a split pops the outgoing pane out and centers the selected page. Popup transforms preserve wrapper opacity so frosted surfaces retain their backdrop. Reduced motion applies these changes immediately. Database panes and failed/unprepared document loads still use iframes, with save guards and standalone refetching when those frames are removed. Session caches are cleared across account initialization and are not persistent document storage. Open editor retention increases memory usage; closing tabs releases them.

Navigation UI persistence coalesces the latest snapshot after a frame and timer yield, with synchronous flush on pagehide/backgrounding. Unchanged scroll and metadata do not trigger state updates. Retained editor contexts and empty page-search state stay stable across unrelated shell changes; selection-toolbar plugins remain registered while hidden. These changes preserve the existing navigation storage format and document autosave.

See `../reports/05-tab-switching-performance.md`, `../reports/05-document-tab-handoff.md`, and `../reports/05-warm-tab-interaction.md` for evidence limits and manual acceptance.

## History

Each tab tracks:

```text
Back
Forward
```

Suggested shortcuts:

```text
Alt + Left
Alt + Right
```

## Reveal in Orbit

For a node:

1. navigate to its parent container;
2. restore/open Orbit view;
3. focus/select the target node.

For a root-level node, open workspace root Orbit.

## Direct Search Master jump

Search Master should jump directly to the target rather than animating through every ancestor.

Spatial traversal is for exploration; Search Master is for speed.


## Explorer bulk selection (approved 2026-10-14)

In workspace and folder Grid, List, and Gallery views, Ctrl+click (Cmd+click on macOS) toggles direct-child selection instead of opening a new tab. Space toggles the focused item. Normal click/Enter opens an item; Ctrl+Enter and the New tab menu action still open a new app tab. Escape, empty-space click, and Clear selection clear the selection. Search limits actions to visible selected items; route changes reset selection.

A selection action strip offers Move and Delete for up to 100 items. Move chooses a valid container within the current workspace, excluding selected items and their descendants. Dragging any selected item moves the visible selection together, preserving sibling order. Delete confirms moving the selection and its contents to Trash. Each batch is atomic and uses the existing hierarchy validation and workspace write lock.

Drag visual review (2026-10-14): dragging a selection lifts all selected items into a single horizontal row centered on the pointer. Original cards are invisible while dragging, with their layout slots retained to keep drop targets stable. The browser drag ghost is suppressed. The row scales to fit the viewport for large selections, and disappears on drop, cancellation, or leaving the explorer.

Drag/selection correction (2026-10-14): selected explorer cards show a solid foreground outline and a checkmark badge in Grid, List, and Gallery, including frosted surfaces. Search reveal highlighting uses a separate dashed outline and does not imply selection. The centered row is the native drag image; source cards remain hit-testable and are hidden only after drag initialization. Cover/icon images do not initiate independent image drags.

Stack motion review (2026-10-14, supersedes the drag-row and checkmark guidance above): selected explorer cards use only a solid outline with no checkmark or selection tint. Pointer dragging uses GSAP to lift cards from their individual positions and gather them into one overlapping stack, with a small offset exposing the cards underneath. Releasing or canceling animates each card from the stack back into its layout position; a valid drop then applies the existing atomic move/reorder. Empty-space release keeps the hierarchy unchanged. Reduced motion skips the animated travel. There is no native browser drag ghost.

Stack return correction (2026-10-14): the returning preview matches original card surfaces and layout, then synchronously reveals original cards before removing the preview, with opacity transitions suppressed for the handoff. Overflow buttons retain their layout space but remain hidden inside the drag preview. Originals expose overflow buttons on hover or keyboard-visible focus, not lingering pointer focus after dragging.

Explorer layout motion review (2026-10-14, supersedes reserved-slot drag guidance): lifted cards leave the layout so remaining siblings animate to close the gaps. Releasing/canceling restores their layout slots while the sibling cards animate aside and the stack returns. Grid, List, fixed Gallery, and natural Gallery use GSAP layout transitions. Successful moves/deletions fade and shrink outgoing cards while survivors animate into their new positions; persisted sibling reorders also animate. Single-item explorer deletion uses the atomic batch endpoint with one ID and stays in the current folder. Reduced motion applies layout changes immediately.

Destination drop review (2026-10-14, supersedes returning before valid moves): dropping into a folder/container shrinks and fades the stack directly into the receiving card. The receiver grows briefly to suggest absorption and settles back to its normal size. Parent/root drop zones fade the stack directly at that destination. Source cards stay out of the layout until the move resolves, so successful moves do not reappear or trigger a second fade at their old positions. Successful sibling reorders settle directly into their newly saved slots. Invalid/canceled/rejected drops restore the prior layout and return the cards. Reduced motion skips the travel and receiver pulse.

Reorder timing review (2026-10-14): layout shifts and stack settling use 600 ms with `power2.inOut` easing, replacing the faster 300 ms timing. Gap closing, slot restoration, and saved reorders now move at the same calmer pace.
