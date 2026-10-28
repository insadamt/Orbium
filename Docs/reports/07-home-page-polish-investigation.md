# Home page polish investigation — 2026-10-28

This file records a source review of Orbium’s home/workspace explorer before polishing it. It explains observable implementation gaps, proposed priorities, and manual reproduction steps. It depends on the current floating workspace implementation, `../docs/05-ui-ux-system.md`, `../docs/08-search-navigation.md`, and the polish guidance in `../phases/07-settings-onboarding-polish.md`. Browser appearance and behavior remain unverified.

## Scope and current behavior

**User scope clarification (2026-10-28):** the app targets desktop, uses an English interface, and supports other languages in authored content. The user excluded touch/mobile, screen-reader semantics, and RTL context-menu work from this polish pass and authorized the remaining fixes. Findings 3, 5, and 6 below are historical investigation observations, not the implementation scope. See `07-home-page-polish.md` for completed changes and desktop acceptance steps.

- `/dashboard` opens the first workspace by saved position; without workspaces it renders the dashboard with shell controls and no explorer.
- Workspace roots and folders share `resources/js/pages/dashboard.tsx` and `WorkspaceContents`.
- The current explorer has Grid, List, and Gallery, local title search, remembered sort/type filters, selection, context actions, and drag movement/Trash.
- The old orbital explorer is not the active home page. The UI documentation explicitly records its removal.
- Preserve the approved floating controls, visually empty containers, and removal of focus borders. A visible New button or onboarding content would be a product proposal, not a required bug fix.

## Findings and proposed order

### 1. High: filtered-empty feedback sits after a viewport-height explorer

`workspace-contents.tsx:351` renders the no-results status after the contents section. `floating-workspace.css:344` gives that section `min-height: calc(100dvh - 128px)`, with header and view controls above it. A failed search can leave a large blank area before the explanation, potentially requiring scrolling to see it. There is no adjacent clear-search/filter action.

Proposed polish: render filtered-empty feedback near the start of the explorer and provide a clear search/type-filter action. Keep genuinely empty containers visually empty, as documented.

### 2. High: Reveal does not ensure the target is visible

`workspace-contents.tsx:75` reads `?focus=`, but uses it only for a card’s `revealed` outline. Filtering in `use-explorer-filters.ts` does not account for this target. No target scrolling or focus transfer is implemented in this explorer path. A target can remain below the viewport or be excluded by a remembered type filter.

Proposed polish: ensure an explicit Reveal target is rendered and scrolled into view after layout, including natural Gallery. Define a temporary filter override without silently overwriting saved preferences; respect reduced motion.

### 3. High for touch: ordinary scrolling can become dragging

`explorer-views.css:184` sets `touch-action: none` on every card, including when sorting disables dragging. `use-item-drag.ts` starts a drag after six pixels of movement and has no touch-specific activation policy. A swipe beginning on a card therefore cannot use normal browser panning and can initiate an unintended drag when dragging is enabled.

Proposed polish: separate touch scrolling from intentional dragging, with a deliberate touch activation gesture. This needs device verification before selecting the final gesture.

### 4. Medium: uploaded icons have no failure fallback

`floating-item.tsx:169` renders uploaded icons without an error handler. Gallery cover images already track failures and fall back to a type icon. An unavailable custom icon can instead leave broken-image artwork in Grid, List, and Gallery.

Proposed polish: use a type-icon fallback for failed icon loads and retry when the attachment changes.

### 5. Medium: card semantics combine opening, selection, and nested actions

`floating-item.tsx:71` gives the card `role="button"` and `aria-pressed`, while normal activation opens the page and Space toggles selection. Its overflow button is nested inside that button role. This creates an accessibility concern: opening and selection are described as one toggle button, with another interactive control inside it. The precise screen-reader impact needs manual verification.

Proposed polish: give opening, selection, and overflow actions clear independent semantics while retaining existing keyboard shortcuts and the approved border-free focus styling.

### 6. Medium: contextual menu ignores its supplied RTL direction

Explorer code supplies `position.direction`, but shared `PositionedMenu` hard-codes `dir="ltr"` and does not use the supplied direction when aligning its content. This conflicts with the documented RTL placement correction. Collision avoidance still exists, so actual edge behavior needs browser verification.

Proposed polish: honor the anchor direction and verify pointer and keyboard placement at both edges. This is a shared component; check its other consumers before changing it.

### 7. Lower priority: first-use creation is hard to discover

Creation is available through the empty-space context menu, Account menu, and Search Master, matching the approved design. With no workspace, creation is in the workspace selector. These paths are functional in source, but neither blank home surface explains how to begin.

Optional proposal: a dismissible first-use hint through existing controls. Do not add a permanent empty-state panel or New button without agreeing on the design.

## Performance observation

`WorkspaceController::renderWorkspace` retrieves all active nodes and document media metadata in the workspace, checks ancestor visibility for each node, and includes trashed nodes. The frontend then filters to direct children. Payload size grows with the whole workspace, and ancestor checks grow with hierarchy depth. This is a profiling candidate, not a measured performance defect. Navigation and drag destinations currently depend on hierarchy data; avoid replacing it with a direct-child-only response without tracing those dependencies.

## Manual review checklist

These checks have not been performed. For reported gaps, they define the expected result after a fix.

1. **Failed search:** search for an absent title in a populated workspace. Expected: no-results feedback is visible without scrolling, and clearing search restores items.
2. **Remembered filter:** select Boards, reload a container containing only documents, and inspect the empty result. Expected: the active filter is understandable and can be cleared near the feedback.
3. **Reveal:** in a long List and natural Gallery, open the parent with `?focus=<child-id>` for an item below the fold; repeat with a type filter excluding it. Expected: the intended item becomes visible and is identified without permanently replacing the saved filter.
4. **Touch scrolling:** on a touch device, swipe vertically beginning on cards; repeat with Name A–Z selected. Expected: normal scrolling works without unintended movement or Trash. Verify intentional dragging separately.
5. **Unavailable icon:** temporarily block a custom icon image request in browser developer tools and reload. Expected: a readable type icon appears, with no broken-image artwork; unblock and verify normal loading.
6. **Keyboard/accessibility:** Tab to a card and its overflow action; use Enter, Space, Ctrl/Cmd+Enter, Shift+F10, and Escape. Expected: open, select, new tab, menu, and deselect behaviors remain distinct and usable. Check screen-reader announcements for both controls.
7. **RTL menus:** in RTL content, open item/background menus near both viewport edges and use Shift+F10. Expected: menus open on the appropriate side, remain visible, and return focus on dismissal.
8. **Layout/theme:** inspect 1440, 1024, and 390 px widths, long workspace names, several tabs, and expanded search. Repeat Light/Dark and Normal/Frosted. Expected: controls do not overlap, titles truncate cleanly, menus remain readable, and content clears the fixed header.
9. **Core regression:** create each node type, rename, favorite, change views, reorder in Manual order, move into a folder, cancel a drag, and delete/restore a disposable item. Expected: actions persist after reload; canceled gestures preserve hierarchy.
10. **Empty/first-use:** inspect an empty workspace and an account with no workspaces. Expected: existing creation paths work and genuine empty containers retain the approved minimal presentation.

## Changes and validation

- Added this investigation report only; no application behavior, migration, or persistent format changed.
- No automated tests or browser automation were written or run.
- Formatting/lint/type/build checks were not run because no application code changed.
- Visual findings and interaction outcomes require the manual checks above.
- No commits created. Remain on the home page review before moving to another page.

## Suggested commit messages

For this report: `docs(ui): audit home explorer polish gaps`

For later implementation, grouped by responsibility:

- `fix(explorer): improve empty search feedback and reveal targets`
- `fix(explorer): preserve touch scrolling during card interactions`
- `fix(explorer): improve card semantics and icon fallbacks`
- `fix(menus): respect contextual anchor direction`
