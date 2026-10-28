# UI/UX system

Home explorer polish (2026-10-28): the user scoped this review to desktop with an
English interface; authored text can use other languages. This pass excludes
touch/mobile, screen-reader semantics, and RTL menu changes. Filtered-empty
feedback uses a large centered icon, No matching pages heading, short guidance,
and a labeled Clear search and filters action in the explorer’s empty area.
Reveal feedback stays compact beside the toolbar because cards remain visible.
Explicit Reveal requests scroll their target into view and temporarily include
it when current filters would hide it, without rewriting saved preferences.
Return to filters or changing the search/type filter ends that exception.
Unavailable uploaded card icons use the existing emoji/type fallback. Truly
empty containers retain the approved blank presentation. See
`../reports/07-home-page-polish.md` for checks and manual acceptance.

App checkbox review (2026-10-14): native inputs, shared Radix checkboxes,
menu checkbox items and editor tasks share a 200 ms checkmark reveal and subtle
hover/press scaling. Completed task text has no animated strike. Indeterminate
states, native form events and existing editor transactions remain supported.
OS reduced motion makes checkbox transitions immediate. See [the report and
manual checklist](../reports/07-app-animated-checkboxes.md).

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

Drag-to-Trash target (approved 2026-10-14): while dragging explorer items, show a fixed bottom-center drop target with a red ambient glow. GSAP animates its arrival/removal and intensifies the glow when the pointer enters the target. Dropping there directly sends the dragged group to restorable Trash through the existing atomic batch endpoint, fading/shrinking the stack into the target. Hide the selection toolbar during dragging so the target remains unobstructed. Canceled or failed drops restore the items; ordinary Delete toolbar/menu actions keep their confirmation dialogs. Reduced motion skips animated travel and glow transitions.

Rearrangement timing adjustment (2026-10-14): layout shifts and stack settling now use 420 ms with `power2.inOut` easing, replacing the 600 ms timing after manual review.

Trash edge integration review (2026-10-14): the drag-to-Trash target is flush with the bottom viewport edge, with an unboxed icon/label and no rounded panel, border, or detached background. Its broad red gradient originates below the bottom edge and fades into the screen. Arrival/removal fades in place; hovering intensifies the gradient from its bottom origin.


Explorer selection bar removal (2026-10-14): selecting pages in workspace and folder Grid, List, and Gallery views no longer displays the bottom Move/Delete/Clear selection action bar. Selection outlines and group dragging remain. Escape or empty-space click clears selection; dragging to a container moves the group, and the bottom Trash target appears only during dragging. Individual overflow Delete actions retain confirmation. This supersedes the selection action strip guidance above.

Trash glow motion review (2026-10-14): remove the short rectangular clipping region and blend three independently blurred red light layers directly into the viewport edge. Idle motion slowly breathes and drifts; hovering strengthens the glow and runs a quicker expanding pulse. GSAP controls the layers without React frame updates, and reduced motion uses a still glow with immediate hover intensity changes.


Folder drag actions review (2026-10-14): while dragging inside a folder, show Delete and Move out side by side at the bottom viewport edge. Move out replaces the above-content parent destination and moves the dragged item or selection up one level (to the containing folder or workspace root). Each target has independent hover feedback; workspace root shows Delete only. Existing restorable Trash, group movement, cancellation, failure recovery, and reduced-motion behavior remain.


Animated menu review (2026-10-14): action dropdowns, context menus and shared
selection controls use the installed Animate UI Radix dropdown components with
one frosted surface, 200 ms fade/scale motion, animated item highlights and
Lucide action icons. Editor block formatting uses submenus. Completion lists
retain their listbox semantics with matching entrance motion. OS reduced motion
removes menu/highlight travel. See [the implementation report and manual checklist](../reports/07-animated-app-menus.md).

Animated menu stability correction (2026-10-14): each menu now owns one persistent
hover bar; row transitions do not crossfade between separate highlight elements.
Slash/mention suggestions share this bar, surface dimensions and action icons.
Selection marks are static checks with reserved space, with no shared radio-dot
animation. Controlled open state applies immediately. See [the repair report and
manual checklist](../reports/07-animated-menu-stability.md).

Slash reveal correction (2026-10-14): slash/mention popup geometry stays stable
during CodeMirror placement. Reveal uses a 140 ms opacity fade after the first
successful positioning callback, with no container scale; reduced motion reveals
immediately after placement. Filtering does not restart entrance motion. See
[the reveal report](../reports/07-slash-menu-reveal.md).

Contents menu animation (2026-10-14): the outline popup shares the slash popup's
140 ms fade with stable geometry and uses the shared moving bar for heading
hover, keyboard focus and the current reading location. Floating rail placement
runs before paint. Pinning, navigation and pane ownership retain their existing
behavior. This replaces the popup's earlier slide/scale transition. See
[the Contents report and manual checklist](../reports/07-toc-menu-reveal.md).

Editor toolbar review correction (2026-10-15): restored the original text and
image button padding, corners, colors and active backgrounds at the user's
request. Toolbar reveal now starts after visibility/placement instead of at DOM
creation; hover movement still uses Select's shared highlight. The text color
picker uses compact labeled choices with small color dots, a selection check and
a separate custom-color footer. OS reduced motion disables reveal and highlight
travel. See [the correction report](../reports/07-editor-toolbar-review-correction.md).

Color picker and alignment review (2026-10-15): replaced the labeled color list
with a saturation/brightness plane, hue slider, editable hex value, compact preset
swatches and Default action. Image toolbar buttons and download links share the
same 28px hit area. Explicit text/block and image alignment commands animate
horizontal travel over 260 ms in both editor formats; reduced motion applies the
final position immediately. See [the report and manual checklist](../reports/07-color-spectrum-alignment-motion.md).

Color picker background correction (2026-10-15): the text color picker uses an
opaque theme-aware popover background in both Normal and Frosted appearances.
This picker-specific override prevents document content and wallpaper from
showing through its controls. Other toolbar/menu surfaces retain their styling.
See [the correction report](../reports/07-color-picker-opaque-background.md).

Color picker drag correction (2026-10-15): applying hue, spectrum or hex changes
while keeping the picker open no longer focuses the Markdown editor. Focus stays
inside the picker, avoiding outside-focus dismissal and interrupted slider drags.
The hue input disables touch panning; outside-click, Escape and preset dismissal
retain their existing behavior. See [the repair report](../reports/07-color-picker-slider-focus.md).

Image width motion (2026-10-15): Fill available width, keyboard sizing and
undo/redo width changes ease the image figure's width over 260 ms in both editor
formats. Height follows the image's natural aspect ratio; caption, controls and
following content move with layout. Corner dragging bypasses the transition and
starts from the current displayed width. OS reduced motion makes sizing immediate.
See [the report and manual checklist](../reports/07-image-width-motion.md).

Image size toggle and direction motion (2026-10-15): Fill available width becomes
Restore image size at maximum width, with a shrink icon. It restores the smaller
width remembered by the mounted image; without one, Reduce image size uses about
60% of the available width, subject to existing size limits. Both transitions
reuse width motion. Button state tracks editor width changes. Explicit LTR/RTL/
Auto direction commands now share alignment movement in both directions when
they change visible position. Reduced motion remains immediate. See
[the report and manual checklist](../reports/07-image-size-toggle-direction-motion.md).

Direction history motion correction (2026-10-15): undo and redo of direction or
alignment now reuse the 260 ms horizontal transition in Markdown and legacy JSON
editors. History handling captures the old layout before applying the existing
transaction and animates only restored layout changes, without extra document
edits or undo entries. Ordinary typing undo remains unchanged. This supersedes
earlier notes that direction/alignment undo renders immediately. OS reduced motion
still skips transitions. See [the report and manual checklist](../reports/07-direction-history-motion.md).

Explorer reordering usability (2026-10-15): workspace roots and folders support
larger sibling reorder regions in Grid, List, and Gallery. Drag cards directly;
card centers retain moving into valid folders/databases and the existing move-out
and Trash targets. Document cards accept before/after placement across their
whole surface; nearby gaps snap to sibling insertion points. Gallery insertion
markers render inside the card to avoid clipping. Long containers scroll when
dragging near the viewport or scroll container edges. Focused cards retain Alt
+ arrow keys for one-position movement, including while filtering the explorer.
Review correction: the added six-dot grips were removed at the user's request.
See [the report and manual checklist](../reports/01-easier-page-reordering.md).

Workspace sort/filter follow-up (2026-10-15): workspace roots and folders offer
Manual order, Name A–Z, Name Z–A, and Type sorting plus an All types / Folders /
Documents / Databases filter. Choices combine with title search across Grid,
List, and Gallery and persist per container in the browser. Type groups folders,
databases, then documents. Sorting leaves saved sibling positions intact; drag
actions and Alt+arrow reordering require Manual order, explained by a toolbar
hint. Review follow-up: sort and filter triggers show icons only; their menus
retain option text, accessible names announce the current choice, and active
choices highlight the trigger. See [the report and manual checklist](../reports/01-workspace-sort-filter.md).

Tooltip pointer correction (2026-10-19): the user requested removal of the diamond-shaped tooltip pointer. Shared `TooltipContent` now renders only its content surface; Board tooltips and other consumers inherit this appearance. Labels, shortcuts, placement and opening/closing behavior remain. See `../reports/12-boards-tooltip-pointer.md` for actual checks and manual acceptance.
