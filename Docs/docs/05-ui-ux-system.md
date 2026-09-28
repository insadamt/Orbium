# UI/UX system

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
- no starfield by default.

Light mode:

- soft off-white;
- subtle gray depth;
- no glossy white-on-white overload.

## Glass usage

Good uses:

- Search Master;
- Navigator;
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

The shell must stay visually quiet.

Persistent/available elements:

- breadcrumbs;
- tab strip;
- minimal creation/search/account controls;
- temporary Navigator;
- Search Master overlay.

No permanent heavy Notion-style sidebar.

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

- Navigator toggle;
- breadcrumbs;
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

## Navigator

Temporary left-side frosted panel.

Supports:

- tree expansion/collapse;
- keyboard navigation;
- drag/drop moves;
- context actions;
- tree-only filter;
- reveal current node.

Navigator filter is not Search Master.

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
- Orbit actions must have non-3D alternatives through Search/Navigator;
- 3D must never be the only path to critical content.

## Responsive boundary

v0.1.0 is desktop-first.

Tablet should remain usable with overlay Navigator and scrollable tabs.

Mobile-first optimization is deferred. Do not break mobile unnecessarily, but do not sacrifice desktop signature UX to complete a mobile redesign in v0.1.0.
