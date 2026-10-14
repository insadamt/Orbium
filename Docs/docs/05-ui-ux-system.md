# UI/UX system

Viewport background review (2026-10-14): Default, image, and animated backgrounds
share one fixed viewport layer across authenticated and authentication pages.
The default gradients are sized to the viewport rather than page content.
Split documents remain transparent over their parent page's background.
The Frosted utility rule excludes the page shell so backdrop filtering cannot
turn the shell into a containing block for the fixed wallpaper.
See [the review report](../reports/07-fixed-viewport-background.md).

Unified frosted review (2026-10-13): At the user's request, app surfaces now
share one frosted treatment: light `rgb(250 250 251 / 61%)`, dark
`rgb(3 6 9 / 53%)`, with 26px blur and 140% saturation. Panel, raised, inset,
Settings, Library, text-background, menu, dialog and toolbar variations are
superseded by this shared treatment. Portaled surfaces use the root preference.
Hover/selection still has an accent cue; primary/destructive actions and authored
media retain their meaning. Missing-blur and reduced-transparency fallbacks use
the same shared tokens. See [the unification report](../reports/07-unified-frosted-glass.md).

Text background review (2026-10-13): At the user's request, visible app text
must sit on a background surface. Existing document, database, settings, Trash,
authentication, menu, and dialog surfaces provide their shared text background.
Folder titles/details, explorer feedback/drop targets, Library headings/status/
filenames/empty states, page-media controls, and split loading/placement labels
now also have neutral theme-aware backgrounds. Normal explorer cards and view
controls are solid. Review correction: the user rejected the increased opacity;
the subsequent unified frosted review above uses the original panel transparency
throughout. Existing reduced-transparency and missing-blur
fallbacks remain. See
[the text background report](../reports/07-text-backgrounds.md).

Orbing removal (2026-10-12): At the user’s request, the Orbing explorer view
has been removed. Workspace and folder explorers offer Grid, List, and Gallery;
saved Orbing selections fall back to Grid. Its renderer, camera/motion controls,
styles, and explorer-only mention-link query are removed. Earlier Orbing entries
below are historical and superseded. See [the removal report](../reports/05-orbing-removal.md).


> Focus styling review (2026-10-12): At the user's request, app controls no longer
> draw focus outlines, rings, or focus-only border changes. This supersedes earlier
> guidance requiring visible keyboard focus borders. Keyboard navigation, focus
> management, existing background/text cues, ordinary borders, selection indicators,
> and validation-error styling remain. See [the review report](../reports/06-focus-border-removal.md).

Orbit-circle follow-up (2026-10-12): the user requested visible orbit circle lines.
Faint dashed circles now trace visible children's exact paths around their moving
parents. Solid mention links remain separate; no straight containment links are
added. See [the follow-up report](../reports/05-orbing-orbit-circles.md).


The latest Orbing correction (2026-10-12) restores recursive orbital motion for
contained entities while removing containment lines. Lines now represent saved
document mentions between visible nodes in the owned current workspace. Type
icons and Orbium's own styling remain. Interaction/reduced motion pauses movement.
This user-requested correction supersedes the static icon prototype and its
no-mention restriction. See [the correction report](../reports/05-orbing-orbits-and-links.md).


> Orbing icon-constellation prototype (2026-10-12): The user requested Orbium's own
> style and reference Folder, Database, and FileText icons instead of dots. Loose,
> static clusters and thin parent-child connections replace revolving planets,
> rings, and stars. Icons remain recognizable while labels/deeper branches reveal
> with zoom. Hover/selection highlights nearby relationships. Existing floating
> controls, themes, navigation, and menus remain. This supersedes earlier Orbing
> styling and motion descriptions below. See [the prototype report](../reports/05-orbing-icon-constellations.md).


> Orbing style correction (2026-10-12): The workspace is the space, with no central
> workspace planet. Root documents float independently; folders and databases are
> entities with their children in orbit, including nested systems. Compact planets,
> quiet titles, faint tracks, sparse static stars, and small camera controls replace
> the original hub. Hover/selection, keyboard interaction, panning, search, and
> menus/dialogs pause motion; reduced motion keeps the scene static. Opening a
> folder focuses its system within the workspace space. This user-requested correction
> supersedes the direct-child hub description below. See [the current report](../reports/05-orbing-workspace-space.md).

> Original Orbing Milestone 1 (2026-10-12): Workspace and folder explorers now offer Orbing
> beside Grid, List, and Gallery. It shows the current container and direct
> children in a stable 2D solar-system layout. Click selects; double-click or Enter
> opens, and modified opening uses existing app tabs. Folder opening retains
> Orbing and updates the location/breadcrumbs. Pan/zoom alone does not navigate.
> Camera and selection restore per account/tab/workspace/container in this browser.
> Orbing presents the folder title in its center instead of the media header;
> other views retain their existing headers. See the [manual review report](../reports/05-orbing-m1-navigation.md).

> Default page media review (2026-10-13): Every document, folder and database/table page displays a default neutral 11:3 cover and type icon when custom images are absent. The icon overlaps the cover with a transparent cutout. Per-image Edit controls appear on hover/focus and remain visible on touch; Change and Reset to default replace the three-dot image menu. Defaults are display fallbacks, with no persisted attachments.

> Cover and Gallery review (2026-10-02): Documents, folders, and databases can crop a cover to 11:3 (the default), 16:9, 5:2, 9:16, 3:2, 4:3, 1:1, or 4:5. Opened document, folder and database pages display covers in a full-width 11:3 frame with centered fill cropping, including older covers. Workspace-root and folder Galleries have persisted appearance settings for natural masonry or uniform cards. Uniform cards offer all eight ratios and whole-image or fill cropping. These settings change previews only, never child cover data.

> Current home/workspace/folder override (2026-09-30): the floating workspace brief supersedes older native-selector, sidebar, card/row, and orbital-carousel guidance below for these routes. Render only direct children as compact horizontal objects. Use a custom workspace menu, independent floating top controls, a separate breadcrumb-path island immediately right of the workspace selector, and a centered tab island whose plus button opens workspace home in a new tab. Ancestor breadcrumbs navigate directly to their hierarchy location. The in-app Back button hides at workspace roots and when the current tab has no earlier page. Create items through the empty-space context menu, contextual user menu, or Search Master. Right-click an item for Open, New tab, Rename, and Delete; do not show Move. Click/Enter opens an entity in the current tab; Ctrl+click or Ctrl+Enter opens a new app tab. Space selects a focused item. Empty containers stay visually empty. Document and database pages share these floating top controls; their existing work surfaces sit inside one spacious floating island. See `../reports/05-floating-workspace.md`.

> Latest shell update (2026-09-30): Settings also uses the floating controls and one content island with horizontal category links. The top Search button expands into an inline current-page field; it filters the current explorer container, database documents, or settings categories, and finds matches within the open document. `Ctrl + Space` remains Search Master.

> Workspace management update (2026-09-30): Manage workspaces in the workspace menu navigates to Settings → Workspaces. The dedicated page uses floating rows, a compact create action, drag reordering, overflow menus for Rename and Move to Trash, and a collapsible Trash with Restore. Permanent deletion starts from a trashed workspace's overflow menu and ends in a typed-name confirmation dialog.

> Explorer review update (2026-10-01): The opened-tabs island is centered in the viewport. Workspace and folder explorers offer Grid, List, and Gallery layouts, with the selected layout remembered per workspace root or folder across tabs and reloads in the current browser. Gallery displays a node's cover when present. Folders and databases use image icon and cover headers, managed like document media. Trash rows keep clear space between their avatar and name.

> Backgrounds update (2026-10-01): Appearance offers the original background, Ghost Fibers, Molten Metal, and a user image. The selected background sits behind app surfaces on all authenticated pages. Both animations expose their effect parameters, pause for reduced motion, and fall back to the original surface if WebGL 2 is unavailable. This first pass stores the selection and uploaded image in the current browser.

> Surface and appearance update (2026-10-01): Appearance offers Normal solid surfaces and Frosted glass panels. Theme, surface, and background changes reveal from a centered expanding circle when same-document View Transitions are available; reduced motion and unsupported browsers switch immediately. Surface style is stored in this browser.

> Expanded backgrounds update (2026-10-01): Appearance also offers 17 React Bits animated wallpapers, each with saved effect controls and Reset. The selected effect loads on demand, including after a page refresh. Animated wallpapers keep their own colors across Light/Dark mode. Reduce Motion pauses effects that expose a pause control; the remaining upstream effects still need a source-level motion adaptation.

> Appearance selection update (2026-10-01): Backgrounds are grouped into still and animated choices with static palette previews and a visible loading state. Common React Bits controls remain visible; advanced controls are disclosed on demand. An explicit browser-local Pause animated wallpapers preference and the operating system's reduced-motion preference show a still color background instead of mounting animated renderers. Slider changes remain live and browser storage writes settle after interaction.

> Appearance review correction (2026-10-01): The settings island gives Appearance the full content width. Background options use compact rows with small palette swatches, while the selected controls occupy a separate readable column. Controls use the same neutral surface and focus colors as the rest of the app. Image actions sit with the image choice; Frosted settings surfaces use a stronger tint so wallpapers do not overwhelm the form.

> Frosted contrast review (2026-10-02): Frosted surfaces keep their existing opacity, blur, saturation, borders, and shadows. Only the light and dark color values, including foreground, secondary text, and table metadata, change for better readability. Reduced transparency and missing backdrop blur retain their existing fallback behavior.

> Frosted border review (2026-10-02): Nested frosted cards and controls no longer draw visible outlines. Their backgrounds and spacing distinguish them, while table separators and keyboard focus indicators remain visible.

> Gallery image review (2026-10-02): Explorer and database Gallery cards show cover images without an outer border or image-to-label divider in either surface style. Keyboard focus remains visible.

> Wallpaper dialog update (2026-10-01): Every Settings category now uses the same island width. Appearance has one Wallpaper control that opens a searchable gallery with image upload. Wallpaper miniatures animate on hover or keyboard focus, with only one live thumbnail renderer active at a time. Selecting a wallpaper opens draft controls on the left and a live preview on the right. Apply commits the selection and settings; closing the dialog discards drafts. The dialog uses restrained entry, exit, hover, and preview motion, all disabled for reduced motion.

> Wallpaper gallery autoplay update (2026-10-01): Animated miniatures start automatically when visible in the dialog; scrolling out stops their renderer, and scrolling back restarts it. Hover and keyboard focus are no longer required. Where supported, miniature renderers use lower resolution and frame rate than the full editor preview. Reduced motion and the Pause animated wallpapers preference keep them still.

> Wallpaper gallery simplification (2026-10-01): The Wallpaper control and searchable gallery show text choices without miniature images or animation. A selected choice is marked Current. Selecting a choice opens its controls and one large live preview; Apply still commits the draft. This supersedes the thumbnail behavior described above.


> Editor styles redesign (2026-10-06): Settings → Editor styles uses a compact saved-theme summary and Customize styles dialog. The dialog has grouped block navigation, persistent CSS editor state, focused/full previews, source-linked errors, and always-visible draft status/Apply controls. Width adapts to the dialog container, including split panes. Use neutral surfaces, visible focus, theme-aware syntax colors, and reduced-motion behavior. See `../reports/05-editor-styles-redesign.md`.

## Design direction

### App select controls (2026-10-02)

Use the shared `AppSelect` component for new single-choice controls. It gives options the same neutral popover surface, focus treatment, and keyboard behavior across editor, database, navigation, and appearance screens. Empty values appear as placeholders; choices passed to the component must have nonempty string values. Use a searchable control only when the interaction requires searching a large option set.

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

> Unified Trash update (2026-10-06): Trash is a standalone floating content island at `/trash`. The account menu provides All Trash and a workspace-scoped entry from the explorer. Use search, workspace/type filters, sorting, grouped container details, and an on-selection action strip. Permanent deletion previews exact scope and affected item/file totals; deleted workspaces require typed-name confirmation. Empty Trash is explicit about workspace/account scope and ignores search/type filters. See `../reports/05-unified-trash.md`.

> Trash UI correction (2026-10-06): Use workspace-manager-style rows with avatars, compact dates, one Restore action, and overflow menus. Use the floating shell search; keep workspace scope visible and place type/sort in a compact menu. Details opens in a fixed drawer without reflowing the list. Ordinary recovery is immediate; ancestor recovery and permanent deletion retain confirmation. See `../reports/05-trash-ui-redesign.md`.


## Library Gallery review (2026-10-13)

Library uses natural borderless masonry, image proportions, quiet filenames, and three-dot image actions. Keep metadata and saved usage on the dedicated file detail page. Use a compact search/type/sort/action toolbar, explicit selection mode with a floating action bar, and centered rename/deletion dialogs. Reuse pickers share the visual cards with an explicit Use image/file confirmation. Touch keeps overflow controls visible; keyboard focus uses the existing background/text cue policy. Detail previews preserve the full image and support fit/zoom; metadata stacks below the preview in narrow panes. See `19-library.md` and `../reports/06-library-gallery.md`.
