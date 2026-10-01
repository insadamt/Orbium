# UI/UX system

> Current home/workspace/folder override (2026-09-30): the floating workspace brief supersedes older native-selector, sidebar, card/row, and orbital-carousel guidance below for these routes. Render only direct children as compact horizontal objects. Use a custom workspace menu, independent floating top controls, a separate breadcrumb-path island immediately right of the workspace selector, and a centered tab island whose plus button opens workspace home in a new tab. Ancestor breadcrumbs replace the Back button. Create items through the empty-space context menu, contextual user menu, or Search Master. Right-click an item for Open, New tab, Rename, and Delete; do not show Move. Click/Enter opens an entity in the current tab; Ctrl+click or Ctrl+Enter opens a new app tab. Space selects a focused item. Empty containers stay visually empty. Document and database pages share these floating top controls; their existing work surfaces sit inside one spacious floating island. See `../reports/05-floating-workspace.md`.

> Latest shell update (2026-09-30): Settings also uses the floating controls and one content island with horizontal category links. The top Search button expands into an inline current-page field; it filters the current explorer container, database documents, or settings categories, and finds matches within the open document. `Ctrl + Space` remains Search Master.

> Workspace management update (2026-09-30): Manage workspaces in the workspace menu navigates to Settings → Workspaces. The dedicated page uses floating rows, a compact create action, drag reordering, overflow menus for Rename and Move to Trash, and a collapsible Trash with Restore. Permanent deletion starts from a trashed workspace's overflow menu and ends in a typed-name confirmation dialog.

> Explorer review update (2026-10-01): The opened-tabs island is centered in the viewport. Workspace and folder explorers offer Grid, List, and Gallery layouts, with the selected layout kept per open app tab and container. Gallery displays a node's cover when present. Folders and databases use compact image icon and cover headers, managed like document media. Trash rows keep clear space between their avatar and name.

> Backgrounds update (2026-10-01): Appearance offers the original background, Ghost Fibers, Molten Metal, and a user image. The selected background sits behind app surfaces on all authenticated pages. Both animations expose their effect parameters, pause for reduced motion, and fall back to the original surface if WebGL 2 is unavailable. This first pass stores the selection and uploaded image in the current browser.

> Surface and appearance update (2026-10-01): Appearance offers Normal solid surfaces and Frosted glass panels. Theme, surface, and background changes reveal from a centered expanding circle when same-document View Transitions are available; reduced motion and unsupported browsers switch immediately. Surface style is stored in this browser.

> Expanded backgrounds update (2026-10-01): Appearance also offers 17 React Bits animated wallpapers, each with saved effect controls and Reset. The selected effect loads on demand, including after a page refresh. Animated wallpapers keep their own colors across Light/Dark mode. Reduce Motion pauses effects that expose a pause control; the remaining upstream effects still need a source-level motion adaptation.


## Design direction

Orbium is:

> minimalist 3D + restrained frosted glass + monochrome identity.

Primary identity:

- black;
- white;
- neutral gray;
- transparent/frosted surfaces;
- subtle material/light variation.

Color is reserved for semantic meaning, not decoration.

## Background

Dark mode:

- near-black rather than absolute black where depth benefits;
- extremely subtle radial illumination;
- restrained noise/grain if it improves material depth;
- sparse, subdued star points on the spatial explorer only.

Light mode:

- soft off-white;
- subtle gray depth;
- no glossy white-on-white overload.

## Glass usage

Good uses:

- Search Master;
- tabs/top controls;
- context menus;
- property dropdowns;
- slash menu;
- selection toolbar;
- dialogs.

Avoid turning the document body itself into a glass card.

Rule:

```text
Content = calm
Controls = glass
```

## Semantic colors

Examples:

- green → success/completed;
- amber → warning/pending;
- red → destructive/error;
- blue → information/selection;
- low-saturation category/tag colors.

The same semantic meaning should use the same color role across views.

## Global shell

### Spatial explorer direction (2026-09-30)

The workspace and folder explorer is a spacious, dark spatial view. Large workspace orbs are selected horizontally. Entering one reveals a half orb at the left edge with direct children arranged along a circular path. Small floating controls expose essential actions without persistent bars. This direction currently applies to the explorer; document and database surfaces keep their existing shell until reviewed separately.

Pointer, touch, wheel, and keyboard navigation must reach the same content. The user can disable motion through the browser's reduced-motion preference. Search Master remains available with `Ctrl + Space`.

The shell must stay visually quiet.

Persistent/available elements:

- workspace name selector with the tab strip beside it;
- account controls;
- Search Master overlay.

Workspace and folder pages have a narrow navigation rail and a collapsible folder sidebar. Document and database work surfaces retain the compact top shell so their content has room.

## Breadcrumbs

Examples:

```text
Orbium / Work / Projects
Orbium / Work / Projects / Architecture
```

Behavior:

- each segment clickable;
- truncate middle segments intelligently;
- breadcrumb belongs to active tab/context;
- deterministic escape from 3D navigation.

## Top controls

Keep only essential actions.

Potential controls:

- workspace selector;
- tabs;
- Search;
- Create;
- Account.

Do not add a large formatting/navigation toolbar.

## Create menu

Global create:

```text
New Document
New Folder
New Database
```

Default parent:

- current Orbit container;
- current database where valid;
- current document's parent when invoked from a document.

Never create a folder/database inside a database.

## Workspace switcher

Displays current workspace and allows:

- switching;
- create workspace;
- manage workspaces.

Switching changes the current hierarchy context cleanly.

## Hierarchy browsing

Workspace and folder pages show a folder tree beside a file explorer. The explorer shows folders as cards and documents/databases as rows. A single click opens an item; drag/drop and the item action menu provide moves. Search Master provides direct jumps.

## Tabs

Tabs may represent:

- Orbit context;
- Document;
- Database;
- Settings.

Behavior:

- activate;
- close;
- open new;
- `Ctrl + W`;
- `Ctrl + Tab`;
- `Ctrl + Shift + Tab`;
- optionally middle-click close.

Normal navigation may reuse the current tab to avoid tab explosion. Explicit modified action opens a new tab.

Tabs should restore after normal reload.

## Navigation history

Each tab has back/forward history.

Recommended shortcuts:

```text
Alt + Left
Alt + Right
```

A document can expose `Reveal in Orbit`, which opens/selects its parent context.

## Empty states

Empty Folder/Workspace Orbit:

```text
Nothing here yet.

+ Document   + Folder   + Database
```

Empty Database:

```text
No documents yet.

+ Create document
```

No-result Search Master:

```text
No results for "..."
```

Optionally offer a valid creation command.

## Error UX

Prefer compact, specific status:

```text
Saving…
Saved
Couldn't save changes. Retrying…
```

Destructive failures may use a dialog/toast where needed.

Do not use large red modals for recoverable background failures.

## Accessibility

- all menus keyboard reachable;
- visible focus states;
- adequate contrast on glass surfaces;
- reduced motion honored;
- semantic HTML outside the canvas;
- Orbit actions must have non-3D alternatives through Search and the workspace explorer;
- 3D must never be the only path to critical content.

## Responsive boundary

v0.1.0 is desktop-first.

Tablet should remain usable with the collapsible folder sidebar and scrollable tabs.

Mobile-first optimization is deferred. Do not break mobile unnecessarily, but do not sacrifice desktop signature UX to complete a mobile redesign in v0.1.0.
