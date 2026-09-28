# Search Master, Navigator, tabs and navigation

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
Open Navigator
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
- Reveal in Navigator
- Favorite
- Copy internal reference/link if defined

## Navigator

Shortcut:

```text
Ctrl + B
```

Temporary left overlay.

Tree actions:

- expand/collapse;
- select;
- open;
- open in new tab;
- rename;
- move;
- duplicate where safe;
- trash;
- create child where parent allows.

Keyboard:

```text
↑ ↓     move selection
→       expand
←       collapse
Enter   open
```

## Navigator drag/drop

Dropping a node changes its `parent_id` and order.

The server action must validate:

- same workspace;
- allowed parent;
- no cycle;
- ownership.

Do not optimistically leave an invalid tree state if the server rejects the move.

## Navigator filter

Tree-local filter only.

Do not confuse it with Search Master.

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
