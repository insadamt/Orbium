# Search Master, workspace selector, tabs and navigation

> Current home/workspace/folder override (2026-09-30): the floating workspace brief supersedes older native-selector, sidebar, card/row, and orbital-carousel guidance below for these routes. Render only direct children as compact horizontal objects. Use a custom workspace menu, independent floating top controls, a separate breadcrumb-path island immediately right of the workspace selector, and a centered tab island whose plus button opens workspace home in a new tab. Ancestor breadcrumbs replace the Back button and navigate directly to their hierarchy location. Create items through the empty-space context menu, contextual user menu, or Search Master. Right-click an item for Open, New tab, Rename, and Delete; do not show Move. Click/Enter opens an entity in the current tab; Ctrl+click or Ctrl+Enter opens a new app tab. Space selects a focused item. Empty containers stay visually empty. Document and database pages share these floating top controls; their existing work surfaces sit inside one spacious floating island. See `../reports/05-floating-workspace.md`.

## Inline current-page search

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
