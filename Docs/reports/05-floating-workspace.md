# Phase 5 — Floating workspace review

## Split theme and grouped tab reorder correction (2026-10-02)

Appearance changes now reach the already mounted split page frames through the browser's same-origin storage event, so their UI updates without refreshing. Grouped split tabs are sortable by dragging either title. Reordering moves both underlying tabs as one unit, keeps their left/right pane placement, and persists the order in the existing browser-local navigation state. Ordinary tabs can also move around a grouped tab without separating its members.

The installed [dnd-kit sortable hook](https://dndkit.com/legacy/presets/sortable/use-sortable/) supports multiple drag activators on one sortable item, and its [horizontal sorting strategy and overlay](https://dndkit.com/legacy/presets/sortable/overview/) already serve this tab strip. Its limitation is that it does not understand Orbium's paired tab state or pin boundaries; the local navigation store handles those rules. No new package or storage format was needed. The storage event updates other same-origin page contexts; browsers do not send it back to the page that wrote the preference, so that page still applies the theme directly.

Manual check: split two documents, switch Light → Dark → Light in Appearance, and confirm both visible panes change immediately without losing scroll or edits. Repeat while the split group is hidden behind another tab, then return to it. Set Appearance to System and change the operating-system theme; both panes should follow. Make two split groups plus ordinary tabs, drag either title of a grouped tab before and after another tab or group, then refresh. Each pair should remain together, retain its left/right placement, and appear in the saved order. Drag an ordinary tab across a group, then end that split; its two tabs should remain adjacent. Keyboard: focus a grouped title, press Space, Left/Right, then Space; the whole group should move. Dragging by touch requires the existing brief hold gesture.

## Multiple independent split groups (2026-10-02)

Split state is now a list of disjoint document/database tab pairs instead of one replaceable pair. Creating another split appends a group; the tab strip shows one compact grouped tab for each pair. All groups retain their own two mounted page frames, so switching between groups preserves each page's scroll and loaded state. Ending or closing one group removes only that pair. The browser-local restore path accepts the previous saved single-pair shape and writes the new list format on the next state change; it validates that each pair has two distinct eligible pages and that a tab belongs to at most one group. There is no application limit on the number of pairs, though each retained pair consumes two page runtimes and memory.

The existing [dnd-kit sortable/overlay primitives](https://dndkit.com/legacy/presets/sortable/overview/) continue to handle dragging inside the one tab strip; its multiple-container pattern does not help with independent saved pairs. [Zustand persist](https://zustand.docs.pmnd.rs/reference/middlewares/persist.html) offers versioned migration but would replace the store's existing user-scoped restore and validation flow. A small local normalizer handles the old shape without adding a library or changing storage keys.

Manual check: open four distinct documents/databases in four app tabs. Split A+B, activate C, then split C+D. Expect two grouped navigation tabs, each showing its own titles and side placement. Scroll both sides of each group, switch repeatedly between groups and a Settings tab, and expect no page reload or Loading label on return. Refresh while Settings is selected; both groups should still appear. End only A+B; C+D must stay split and A/B must become separate tabs. Try pairing a page with itself, a folder, or a tab already in another group; no new pair should form.

## Persistent split pages and Settings tabs (2026-10-02)

The two split page frames now stay mounted at their left and right positions while another app tab is active. The hidden pair sits outside the viewport at its normal split size, so returning to the grouped tab reveals the already loaded pages and preserves their independent scroll positions. The grouped tab becomes visible immediately on activation while Inertia updates the parent route. The current-page search provider now resets its fields when the route path changes instead of remounting the entire content tree. A saved split is restored even if a different tab was active when the browser was refreshed. Initial split creation and a full browser refresh still load the pages from the server; hidden split pages also use memory while their group exists.

Settings entry points now create a new app tab, including the top Settings button, Manage workspaces, fallback account menu, and Search Master command. The category links inside Settings continue navigating within that Settings tab. Existing dnd-kit, React, and Inertia behavior is sufficient. [React Activity](https://react.dev/reference/react/Activity) can retain component state but cleans up Effects while hidden and has special caveats for iframes; [react-activation](https://github.com/CJY0208/react-activation) documents StrictMode and createRoot limitations. Keeping the existing same-origin frames mounted with CSS avoids another dependency and keeps their page runtime alive.

Manual check: split two different document/database tabs, scroll and edit each side, open a normal document or Settings tab, and return to the grouped tab. Both split pages should appear immediately at the same positions and scroll offsets, without a Loading label. Repeat several times and then refresh while an ordinary tab is selected; the grouped tab should still restore. Open Settings from the top button, Manage workspaces, and Search Master; each should add a Settings app tab without replacing the current document or split group. Change Settings categories and confirm they stay within that Settings tab. End the split and confirm both document/database tabs remain independently available.

## Split motion and edge preview refinement (2026-10-02)

Removed the pane-wide scale and fade that exposed an iframe before its page had painted. Each split page stays transparent and hidden until its load event; a small text status appears over the shared wallpaper while it loads. Once ready, it appears without an opacity transition. The left and right drag targets are slim edge cues; reaching the 88px trigger shows a light outlined half-pane and a placement label without expanding the target width. Reduced-motion settings disable these effects.

When a split is already visible, clicking either title in its grouped navigation tab focuses that pane and updates the selected title without another Inertia visit. This keeps both page frames mounted while moving attention between the two visible pages. No new library was added. The installed dnd-kit still supplies drag sensing and overlay, while CSS handles these short state changes. GSAP is installed but would require animation lifecycle cleanup for no additional behavior here.

Manual check: drag a document tab across the screen, pause near both edges, and confirm each cue expands into a light half-pane outline with no dark screen overlay. Release and confirm both pages are aligned and appear without a black flash. Click the two titles in the grouped tab repeatedly: the visible pages should remain in place without loading again, with focus and title emphasis moving immediately. Open a third tab, return to the grouped tab, and confirm the split persists without loading again. Repeat in reduced-motion mode and at a narrow viewport.

## Two-tab split view (2026-10-02)

Dragging a document or database tab freely across the viewport and releasing it at the left or right edge opens it beside a different active document or database. Folder, workspace, settings, and same-page pairs do not split. The pair appears as one normal-height tab showing `icon title | icon title`, with a small control to end the split. Split placement is saved with user-scoped browser tab state and restored on reload. The grouped tab remains in navigation while another tab is active; returning to either member restores the split.

The installed dnd-kit handles pickup and tab reordering. [DragOverlay](https://dndkit.com/legacy/api-documentation/draggable/drag-overlay/) renders outside the scrollable tab strip; removing the strip modifier for eligible pairs allows viewport-wide movement. A pointer edge check selects the half-screen preview without changing sortable collisions. The split uses CSS grid and short CSS keyframe animations; the installed GSAP would add lifecycle management for a one-time entrance, and [GSAP matchMedia](https://gsap.com/docs/v3/GSAP/gsap.matchMedia%28%29/) would be needed to respect reduced motion. The companion page runs in a same-origin iframe because Inertia has one top-level page context. Its document background is transparent so the parent wallpaper shows behind both normal document/database islands. The iframe otherwise applies responsive rules based on its narrower viewport, so split mode explicitly gives both islands the same top margin and padding to align their cards and covers. The second page runtime does not show global top controls or Search Master; its page content and links remain usable. Each side scrolls independently with its scrollbars hidden. The center divider and its scrolling behavior are removed. Browser confirmation is pending.

Manual review: open two different documents or databases, drag one tab away from the strip and hover at each viewport edge. Confirm the light half-screen outline, release, and confirm the correct side placement without a black flash. Confirm both card top edges, cover edges, and content insets align at desktop width and after narrowing the window. Both halves should keep the same document/database card styling and wallpaper behind them, with no opaque rectangle around the companion pane. The nav should show one compact tab with two icon/title sections; short titles should not leave a large blank width. Clicking either title focuses that side, and its close control restores two separate tabs. Open or create another tab, then return to the grouped tab and confirm the split remains. Scroll each side independently and confirm no scrollbars appear; confirm no line or scroll control appears between the pages. Try splitting a folder, workspace, settings tab, or two tabs on the same document/database and confirm no split occurs. Navigate inside the companion pane, reload, and confirm its location and split return. Reorder ordinary tabs and check reduced-motion mode.

## Per-container view memory (2026-10-01)

Explorer Grid/List/Gallery selection now follows each workspace root or folder, and database Table/Gallery selection follows each database across app tabs, navigation, and reloads in the same browser. Existing saved tab-entry views are used to initialize the new container preferences. Preferences stay in the user-scoped browser navigation storage and are not synchronized between devices. The installed Zustand store and existing localStorage handling suffice; Zustand's persist middleware would duplicate the store's dynamic per-user hydration and migration path for this small preference map. Browser storage can be cleared, unavailable, or full, so the fallback remains Grid for explorers and Table for databases.

Manual review: choose List in folder A and Gallery in folder B, leave and reopen each through another app tab, then reload; each should retain its own view. Set a workspace root to Grid and confirm neither folder changes. Choose Gallery in database A and Table in database B, switch tabs and reload, and confirm each opens in its own last selected view.

## Database surface alignment (2026-10-01)

The database work island now uses the document island width and its full-width cover. Its header uses the document-sized icon and title, with the document/property count aligned to the right of the title. At narrow widths, the count wraps below the title. Folder headers retain their compact treatment. This uses the existing header component and CSS; no new library is needed for static layout, and CSS alone does not guarantee identical text wrapping for every user title length.

Manual review: open a document and database with covers and icons at the same viewport width. Confirm their islands and covers line up; confirm the database count sits at the right of the title. Narrow the viewport and check that the count wraps without clipping. Switch between Table and Gallery and confirm the contents still fit within the island.

## Explorer icon and parent drop follow-up (2026-10-01)

Item icons are larger in Grid, List, and Gallery, including uploaded images, emoji, and type fallbacks. During a drag inside a folder, an area above its items accepts a drop and moves the item to that folder's immediate parent, appending it there. Workspace root has no parent area. The existing native drag implementation and move endpoint are reused; touch drag availability still depends on the browser. The installed dnd-kit library offers sortable contexts and drag overlays, but adopting it for this small addition would require replacing the explorer's existing drop resolution and containment handling.

Manual review exposed a drag failure inside folders: mounting the parent drop area in the item flow moved the drag source as soon as dragging started. The area now overlays reserved space above the items, so its appearance does not shift the source or sibling targets.

Manual review: open a nested folder, drag a child, and check that a labeled area appears above the items. Drop there, then open the parent and confirm the item appears at the end. Repeat from a top-level folder and confirm the item moves to workspace root. Cancel a drag and confirm the area disappears. Check Grid, List, and Gallery icons for default type icons, uploaded images, and emoji.

## Tab ordering, pinning, and icons (2026-10-01)

Follow-up: tab dragging clamps the dragged tab to the visible horizontal strip. A dnd-kit DragOverlay renders the dragged tab outside the scrollable list, while its original slot remains in place. The preview keeps the source tab's measured width and disables horizontal scaling. Pickup and drop pop animations were removed at the user's request. This removes scroll-width changes from the dragged tab's transform and makes movement smooth as the list scrolls underneath it. Edge scrolling runs at a faster frame-matched rate and is allowed only on the tab list; native left and right bounds stop it at the first or last tab. The surrounding page cannot be auto-scrolled by tab dragging. Manual check: create enough tabs to overflow, drag a visible tab toward each edge, and confirm that its width stays fixed and more tabs come into view smoothly until the true first or last tab. Release it and confirm that no pop animation plays.

Correction after manual feedback: the first preview used a different padded glass layout and could use a 160px fallback when dnd-kit had not supplied an initial rectangle. The preview now measures the rendered tab element and mirrors its icon, title, pin or close affordance, and selected state. The measured width remains on the overlay during release. Browser confirmation is pending.

Scrollbars use one app-wide native CSS treatment: thin neutral thumbs and transparent tracks in both themes. This includes page, menu, editor, and table scrolling. Breadcrumbs no longer hide their scrollbar when overflowing. After the user showed that the horizontal tab thumb covers the bottom of the tabs, the tab list became a focused exception: its scrollbar is visually hidden, while native scrolling remains active and small edge buttons appear only when more tabs are available in that direction. The buttons scroll the native list and honor reduced motion. Standard `scrollbar-width` and `scrollbar-color` preserve browser scrolling and platform behavior elsewhere; a `::-webkit-scrollbar` fallback styles older engines. These CSS APIs allow limited control over exact thumb dimensions, so the final width varies by browser and operating system. SimpleBar and Radix Scroll Area were considered; wrapping every scroll region would add DOM and lifecycle work, and SimpleBar explicitly excludes body scrolling. See [MDN scrollbar-width](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scrollbar-width), [SimpleBar limitations](https://github.com/Grsmto/simplebar), and [Radix Scroll Area](https://www.radix-ui.com/primitives/docs/components/scroll-area). Manual check: scroll a long page, dropdown, and document table in light and dark modes; thumbs should stay narrow and visible. Open enough tabs to overflow, confirm no bar crosses the tabs, and use the edge buttons and touchpad to reach both ends.

Layout correction: the center tab island is capped at 720px, with the tab list shrinking inside it and scrolling horizontally. The plus button stays outside that scroll area. The top controls move the tabs to their own centered row below 1500px, leaving room for workspace and account controls. The active tab scrolls into view when opened or selected. Mouse and Touch sensors replace the Pointer sensor so a touch swipe can scroll the strip while a brief hold starts dragging. No new library is needed; CSS supplies the width and scrolling while the existing dnd-kit modifier bounds the drag and its built-in `canScroll` option limits auto-scroll to the tab list. Touch dragging requires a short hold and may vary in iOS Safari because touch scrolling and drag activation share the same gesture. See the [dnd-kit Pointer Sensor guidance](https://dndkit.com/legacy/api-documentation/sensors/pointer/) and [Touch Sensor guidance](https://dndkit.com/legacy/api-documentation/sensors/touch/). Manual check: open many tabs at widths above and below 1500px; the tab island should remain within its grid area and never cover the workspace or account buttons. Scroll to both ends of the strip, activate a hidden tab, and drag visible tabs to each edge; scrolling should stop at the actual content ends while dragging can reach hidden tabs. On touch, swipe to scroll and hold a tab briefly before dragging it.

The shared tab strip lets users drag a tab by its icon or title. Drag movement stays horizontal; there is no six-dot handle. Mouse, touch, and keyboard sorting use the project's installed `@dnd-kit` packages; tab order persists in the existing browser-local navigation state. Right-clicking a tab opens a context menu with Pin/Unpin. Pinned tabs move to the start, cannot close until unpinned, and retain their pin state after reload. Sorting stays within the pinned or unpinned group. The current page's uploaded icon or legacy emoji appears in its tab, falling back to the page-type icon. Document icon changes update the active tab immediately; folder and database header saves already reload the page.

Library choice: `@dnd-kit/sortable` is already installed and used by workspace management. Its horizontal strategy, keyboard sensor, and recommended DragOverlay fit this scrollable strip without adding a dependency. A small local modifier locks visual movement to the strip's horizontal bounds; adding `@dnd-kit/modifiers` for this focused rule would add a package. The explorer's focused context-menu pattern provides pointer placement and keyboard dismissal without installing Radix Context Menu. Its limitation is that long-press touch does not open the menu; keyboard Shift+F10 does. Orbium still decides pin boundaries and persistence in the navigation store. See the [sortable preset](https://dndkit.com/legacy/presets/sortable/overview/), [DragOverlay guidance](https://dndkit.com/legacy/api-documentation/draggable/drag-overlay/), [modifiers](https://dndkit.com/legacy/api-documentation/modifiers/), and [Radix Context Menu](https://www.radix-ui.com/primitives/docs/components/context-menu).

Manual review: open at least three tabs, drag a tab by its icon/title to reorder, then refresh; the order should remain and the drag preview should move only horizontally. No six-dot handles should appear. Focus a tab, press Space, Left or Right, then Space to drop; the order should change. Right-click a tab and select Pin; it should move to the front and have no Close button. Press Shift+F10 on another focused tab; its Pin action should work too. Try dragging a pinned tab across another pinned tab, then across an unpinned tab; only the first move should apply. Right-click and Unpin; the tab should move after the pinned group and become closable. Open a document, folder, and database with uploaded icons, plus one with an emoji icon; the matching icons should appear in their tabs. Change and remove a document icon; its active tab should update immediately. Refresh and confirm icons and pins remain. Repeat at narrow widths and in light and dark modes.

## Explorer view correction (2026-10-01)

Removed the explorer switcher's negative bottom margin because the following contents section overlapped its buttons and could intercept clicks. The List layout also now prevents column wrapping so rows stay full width. Folder headers use a 62px icon and smaller title, with the document cover crop ratio at a smaller display width. Database headers originally shared that compact layout; the database surface alignment update above brings them to document size. Manual confirmation is still required.

Validation: `./vendor/bin/pint --test`, `npm run types:check`, `npm run lint`, `npm run build`, and `git diff --check` passed on 2026-10-01. The build still reports chunks over 500 kB. Automated and browser tests were not run, per the user's manual-testing instruction. To verify: click each explorer view button and confirm its pressed state and layout change; refresh and revisit the folder to check view retention; inspect folder and database covers/icons beside a document at desktop and phone widths.

## Explorer and container media follow-up (2026-09-30)

Centered the opened-tabs island using balanced outer grid columns. Added Grid, List, and Gallery controls to workspace and folder explorers; Gallery shows a node cover image when available. The selected layout is kept per open app tab and container. Folder and database pages now support image icons and covers through the same menu and crop dialog used by documents. A new node migration stores media attachment IDs, while JSON endpoints validate attachment ownership and serve only visible container images. Trash workspace rows have a 15px avatar/name gap.

The existing Radix Toggle Group gives the three-view control keyboard and selection behavior without another dependency. Its limitation is that Orbium still supplies the responsive layout and accessible labels. Reusing the existing crop dialog avoids adding react-easy-crop; that library provides richer gestures but would add a second crop implementation and more modal sizing work. No automated tests were written or run, per the user's instruction.

Checks for this follow-up: `./vendor/bin/pint --test`, `npm run types:check`, `npm run lint`, `npm run build`, and `git diff --check` passed. Build emitted its existing warning for chunks over 500 kB. Manual browser validation remains pending.

Migration status could not be checked because the configured PostgreSQL instance at `127.0.0.1:54329` was unavailable. Once it is running, apply `php artisan migrate` before checking folder or database media.

Manual review for this follow-up:

1. Open Settings → Workspaces → Trash with a trashed workspace. Its avatar and title should have visible separation at desktop and phone widths.
2. Open a workspace at desktop width. The opened-tabs island should sit at the horizontal center of the viewport; resize below 1000px and confirm it stays centered on its own row.
3. Create a folder, database, and document. Switch the workspace explorer between Grid, List, and Gallery. Items should remain clickable, with List using full-width rows and Gallery using cover previews or a type icon.
4. Open a folder and switch its view. Return to the workspace root and back to the folder. Each container should keep its own view within the open app tab.
5. From a folder or database header, add an icon and cover using PNG or JPEG files. Crop an image when prompted. Refresh and confirm the header and explorer item retain the images; Gallery should show the cover.
6. Change and remove both images. Confirm the header and explorer update after refresh and the default folder/database icon returns. Edit the title and confirm the breadcrumb and explorer title update.
7. In List view, drag an item near the top or bottom of another row and use Alt+Up/Down while focused. The order should persist after refresh. Verify context menus, opening items, and nested containment still work.
8. Repeat in light and dark mode at desktop and phone widths. Confirm no header controls overlap and the three view buttons remain usable with keyboard focus.

## Workspace management follow-up (2026-09-30)

The workspace selector exposes Manage workspaces and routes to a dedicated Workspaces section in Settings. The page now uses a compact expanding create form, floating workspace rows with handle-based drag reordering and Radix overflow menus, and a collapsible Trash. Permanent deletion is available from each trashed row's overflow menu. Its warning dialog requires an exact-name confirmation, verified again on the server. It removes active and trashed nodes, document and database records, tags, mentions, and the workspace attachment directory; browser tabs pointing to the deleted workspace are discarded. Search fields, the document title, and the editor no longer show a native black input border or focus frame.

This follow-up has not been manually tested. Follow the manual checklist in the response before approving the phase.

## Result and scope

Replaced the active home/workspace/folder orbital explorer with a neutral, continuous open workspace. Independent control groups float above compact icon/name items. The workspace and user name controls each have a subtle surface, border, and elevation. A separate breadcrumb-path island sits immediately to the right of the workspace selector and replaces the Back button. On the explorer there is no sidebar, hero, content panel, heading, count, instructional copy, footer, or main-screen Trash shortcut. Search expands into an inline current-page input. Document, database, and settings bodies each sit in one spacious island below the same controls. Empty workspaces retain only the controls.

The working tree already contained a substantial uncommitted explorer redesign. Those changes were preserved; this report lists only files authored or modified during this pass. No commit was created and no later phase was started.

## Files and responsibilities

Created:

- `resources/js/components/hierarchy/floating-top-controls.tsx`: isolated logo, Radix workspace selector, breadcrumb island, tab island/home-tab button, Search, settings/account menu, workspace creation/management dialogs, and workspace-root drop target.
- `resources/js/components/navigation/floating-breadcrumbs.tsx`: compact accessible path with clickable ancestor links and the current page label.
- `resources/js/components/navigation/floating-navigation-buttons.tsx`: the expanding current-page Search input.
- `resources/js/components/navigation/page-search.tsx`: route-local search state shared by the top input and current page.
- `resources/js/components/hierarchy/workspace-contents.tsx`: current direct children, server moves, keyboard selection, opening entities in the current or a new tab, and creation/rename/delete dialogs.
- `resources/js/components/hierarchy/explorer-context-menu.tsx`: pointer-positioned empty-space and item menus with keyboard focus, dismissal, and viewport clamping.
- `resources/js/components/hierarchy/floating-item.tsx`: compact item visuals, click/keyboard opening, selection, and keyboard reorder, hover actions.
- `resources/js/components/hierarchy/use-item-drag.ts`: drop-zone resolution, containment/cycle rejection, drag preview, destination order calculation.
- `resources/css/floating-workspace.css`: neutral light/dark surfaces, responsive layout, drop states, reduced-motion-aware transitions.
- `Docs/reports/05-floating-workspace.md`: this report.

Modified:

- `resources/js/pages/dashboard.tsx`: renders explorer contents beneath the shared floating shell.
- `resources/js/components/navigation/navigation-tab-strip.tsx`: optional floating presentation and folder icons; existing work-surface presentation remains available.
- `resources/js/components/navigation/navigation-events.tsx`: lets focused-item reorder shortcuts take precedence over global history shortcuts.
- `resources/js/layouts/app-layout.tsx`: shares the floating controls and route-local search provider across explorer, document, database, and settings pages.
- `resources/js/pages/documents/show.tsx`: contains the existing document editor, cover/icon, title, and properties in a floating island.
- `resources/js/pages/databases/show.tsx`: contains existing database title, views, controls, and table/gallery in a floating island; current documents filter through the top input.
- `resources/js/layouts/settings/layout.tsx`: replaces the sidebar with horizontal category links inside a floating island and filters categories through the top input.
- `resources/js/components/editor/document-editor.tsx` and `resources/js/components/editor/editor-controls.tsx`: reuse Tiptap document match scanning for the inline finder and match count.
- `resources/css/app.css`: imports the new scoped stylesheet.
- `Docs/phases/05-orbit.md`: records the user-approved replacement brief within the current phase.
- `Docs/docs/05-ui-ux-system.md` and `Docs/docs/08-search-navigation.md`: record the current explorer override.

## Library decision

Reviewed dnd-kit's official sensor/accessibility documentation and Radix Dropdown Menu/Toolbar documentation. Asked the user whether to adopt dnd-kit or extend existing native drag/drop; proceeded with the recommended existing implementation after leaving time for a preference.

- Radix Dropdown Menu is already installed and handles custom-menu focus, keyboard navigation, dismissal, and portalling. Orbium supplies its visual styling.
- dnd-kit offers pointer/touch and keyboard sensors, but still requires application-specific collision zones and hierarchy validation. It would add a dependency and replace the existing native drag integration.
- Radix Toolbar provides managed keyboard focus for a cohesive toolbar, but these floating controls are independent objects. Existing button semantics and CSS avoid a new dependency. The top search is a small controlled React field with page-specific filtering; global Search Master remains on `Ctrl + Space`.

Reviewed shadcn/ui Breadcrumb for the path island. It offers composable separators, links, and collapsed paths, but would add generated component code for a small display. The local semantic `nav`/list and existing Inertia links fit the established shell. Long paths scroll horizontally; this avoids hiding intermediate hierarchy levels behind an unrequested dropdown.
- Reviewed mark.js for arbitrary DOM text highlighting and Radix Collapsible for input expansion. mark.js wraps rendered text nodes, which is a poor fit for Tiptap's controlled editable DOM; Radix Collapsible is designed for disclosure content rather than a compact input. Existing Tiptap match scanning and React/CSS are used instead. No search dependency was added.
- This desktop prototype extends native drag/drop. Touch drag behavior remains browser-dependent; keyboard reorder remains available. The explorer item menu intentionally omits Move. No dependency, backend, migration, or persisted-format change was introduced in this pass.

For the new right-click menus, reviewed Radix Context Menu: it handles pointer placement, keyboard navigation, touch long-press, and collision well, but adds a package. Installation could not complete with this workspace's restricted network, so the focused local menu uses existing React and dialog primitives. Its limitation is that it has no touch long-press gesture; the item's visible actions button provides touch access.

References: https://ui.shadcn.com/docs/components/radix/breadcrumb, https://www.radix-ui.com/primitives/docs/components/context-menu, https://www.radix-ui.com/primitives/docs/components/dropdown-menu, https://www.radix-ui.com/primitives/docs/components/toolbar, https://www.radix-ui.com/primitives/docs/components/collapsible, https://markjs.io/, and https://dndkit.com/react/guides/sensors/.

## Drag/drop and hierarchy

All child types share the same persisted ordering. The outer left/right edges (or top/bottom strips) signal before/after placement with a slim line. The center signals containment only for a valid folder or database. Original opacity drops during drag; the browser carries a compact icon/name preview. Invalid centers do not highlight or accept drops.

A folder accepts all three entity types; a database accepts documents only; documents never accept children. Client validation walks ancestors with a visited set to reject cycles. Drops only use known nodes from the current workspace. In a nested folder, dropping on the logo moves an item back to workspace root.

Writes continue through `PATCH /workspaces/{workspace}/nodes/{node}/move`. Existing `ManageHierarchy` scopes parents to the workspace, rejects self/descendant and trashed destinations, validates containment, locks the workspace in a transaction, normalizes sibling positions, and handles database property values when documents change parents. Server failures surface as toasts. No optimistic hierarchy copy is stored in Zustand.

## Tabs and motion

- Clicking an item or pressing Enter opens it in the current tab. Ctrl+click or Ctrl+Enter creates a new app tab through the existing navigation service. Space selects the focused item without opening it.
- Activate, close, persisted tabs/history, and horizontal overflow remain available. The last remaining tab cannot be closed, matching existing behavior.
- Workspace switching uses existing SPA navigation and retains the existing global tab/history model. The breadcrumb island shows workspace, ancestor folders, and the current folder/document/database; clicking an ancestor navigates directly to it. Settings shows workspace, Settings, and the current category. Top Search expands into a route-local field on all four page types. Global Search Master remains on `Ctrl + Space` where a workspace is active.
- The rightmost plus control stays inside the island and outside the scroll area. It opens workspace home in a new tab. The user menu and Search Master provide item creation in the current container.
- The document and database bodies use a neutral border, background, and soft elevation; title/editor/table layouts remain intact. Their islands fade in without transforming descendants, so positioned editor/database overlays stay anchored.
- Items hover upward by 2px; selection and drop surfaces transition in 180ms. New container contents fade/shift in 220ms; menus enter in 180ms. Reduced motion disables these effects.

## Validation

- `npm run types:check`: PASS.
- `npm run lint` (formatting and lint): PASS.
- `./vendor/bin/pint --test`: PASS.
- `npm run build`: PASS; existing large-chunk warning remains (chunks above 500 kB).
- `git diff --check`: PASS.
- Automated tests: neither written nor run, as instructed.
- Browser screenshots and interactive visual verification: not performed; exact routes/states below are for user review.

## Manual checklist

Use real workspace/node IDs from the URL. Create test content through the user menu or Search Master if needed.

1. Open `/dashboard`, which redirects to `/workspaces/{workspace}` for an account with content. Expected: four detached top groups and only direct-child icon/name items; no stars, orbs, sidebar, headings, item counts, footer, or main Trash shortcut.
2. Open the workspace-name menu with mouse and keyboard. Expected: current workspace is marked; long names truncate; Escape/outside click dismisses. Choose another workspace: its name and root items update through SPA navigation.
3. Choose “New workspace” from the workspace selector, enter a name, and submit. Expected: new workspace opens with an empty canvas and usable controls. Repeat with an account with no workspaces: the selector still allows creation.
4. Use the user menu or Search Master to create a folder, document, and database. Expected: each appears in the current container with only icon/name at rest. Repeat inside a folder; new nodes belong to that folder.
5. Click a folder, document, and database normally. Expected: each opens on the first click in the current tab; a folder navigates to `/workspaces/{workspace}/nodes/{folder}` and shows only its children. Documents/databases open their existing work surfaces. Use tab history or browser Back to return.
6. Ctrl+click a folder, document, or database (Cmd+click on macOS). Expected: each opens in a new app tab while preserving the original tab. Press “+” from a nested folder: a new workspace-root tab opens immediately. Open enough items to overflow the island; tabs scroll while “+” remains visible. Activate/close tabs, then refresh: tab persistence still works.
7. Drag an item to the left/right edge of another item, including mixed folder/document/database order and across wrapped rows. Expected: a slim insertion line appears; dropping updates order. Refresh to confirm persistence. Drag onto itself or cancel with Escape: no move.
8. Drag a document onto the center of a folder, then another document onto a database. Expected: valid target strengthens; drop removes the child from the old container and places it in the destination. Open destination to confirm.
9. Drag a folder/database onto a database center, or any item onto a document center. Expected: no containment highlight or move. Edges still permit sibling reorder.
10. Inside a folder, drag an item onto the logo. Expected: logo highlights and the item moves to workspace root. Click logo and verify it is present.
11. Right-click empty space in a workspace root and a nested folder. Expected: New document, New folder, and New database appear; creating each places it in that exact container. Press Shift+F10 while the empty explorer area is focused for the same menu.
12. Right-click an item or use its actions button. Expected: Open, Open in new tab, Rename, and Delete appear; Move does not. Rename the item and refresh; the name persists. Delete a test item; confirmation explains that it goes to Trash.
13. Tab to an item: Space selects, Enter opens in the current tab, Ctrl+Enter opens in a new tab, Alt+Left/Right reorders one position, and Shift+F10 opens actions. Expected: visible focus; menu arrows and Escape work; reorder does not navigate browser/tab history.
14. Open account menu → Trash and restore the deleted test item. Expected: Trash remains available contextually. Check account appearance controls and settings link.
15. Open a nested folder, document, database, and a settings category. Expected: the separate path island immediately right of the workspace selector shows the full current path, with the last item as the current label. Click an ancestor: its location opens in the current tab. The old Back button is absent. For a long path, scroll within the island to reveal earlier levels. Click top Search in a folder, type part of a child title, and close it: only matching direct children appear while typing, then all return.
16. Open a document with a cover, icon, database properties, and rich editor content. Expected: all content sits inside one floating island beneath the shared top controls. Type a known body word in top Search: the match count updates; Enter/Shift+Enter moves through matches. Edit title/body, use the image menu, and inspect a long document: content saves and overlays remain positioned correctly.
17. Open a database in Table and Gallery views. Expected: title, controls, table/gallery, filtering, sorting, property editor, and creation remain functional inside one island. Type a document title in top Search: both views filter the current documents. Open a child document and click the database ancestor in the path to return.
18. Open Settings → Profile, Security, and Appearance. Expected: the same floating top controls and one settings island with horizontal categories. Type “password” in top Search: only Security remains as a category. Choose it: the new route resets the search; verify forms and appearance controls still work.
19. Press `Ctrl + Space` from a workspace page. Expected: global Search Master still opens separately from the top inline field.
20. Inspect light and dark modes at 1440px, 1024px, 768px, and 375px widths, including long workspace/user/item names and a deep path. Expected: no control overlap or horizontal page overflow; tabs move below the controls at smaller widths, with a separate mobile row for account controls; the path stays in its island and scrolls horizontally; items wrap and remain compact.
21. Enable OS/browser reduced motion, then switch folders, hover, and open menus. Expected: transitions are removed while all actions work.
22. Use browser network throttling/offline mode for a move and restore connectivity. Expected: no speculative hierarchy move is committed; errors remain visible and subsequent navigation shows server-authoritative data.

## Compromises and limits

- Native drag previews/touch support vary by browser; dedicated touch dragging is not implemented.
- Tab drag reorder is not implemented. Existing tab activation, close, persistence, and history are preserved.
- Container transitions animate arrival; there is no delayed outgoing-page animation. Reorder placement updates after the server responds rather than using a choreographed layout animation.
- Existing orbital components/styles remain in the working tree but are not mounted as the home explorer. Existing contextual Trash UI retains its older appearance; document and database internals keep their established controls. The top document finder counts matches while typing and selects them on Enter; it does not highlight every occurrence at once.
- Browser feel, responsive layout, and input behavior await manual review.

## Suggested commits

- `feat(workspace): introduce minimal floating home and tab island`
- `feat(hierarchy): add floating item reorder and containment drops`
- `feat(shell): extend floating controls and surfaces to work pages`
- `feat(search): add inline page search and floating settings layout`
- `fix(navigation): make floating back open the hierarchy parent`
- `feat(explorer): add scoped right-click creation and item menus`
- `feat(navigation): replace floating back with breadcrumb island`

Stop here for Phase 5 manual review.
