# Phase 5 — Explorer review

The 2026-10-06 [Performance Engine Phase 1, Task 3A report](../reports/05-performance-engine-phase-1-background-highlighting.md) follows user acceptance of Tasks 1 and 2. Incremental syntax highlighting now pauses its scheduler for inactive retained editors and resumes pending work asynchronously. Manual acceptance and CPU comparison are pending; Task 3B has not started.

The 2026-10-06 [Performance Engine Phase 1, Task 2 report](../reports/05-performance-engine-phase-1-editor-activity-controller.md) adds per-editor activity controllers adapted from retained workspace state, preserving separate visibility and interaction activity. Tasks 1 and 2 are now user-accepted; the report records Task 2's original review gate.

The 2026-10-06 [Performance Engine Phase 1, Task 1 report](../reports/05-performance-engine-phase-1-editor-style-runtime.md) globalizes the saved editor-style runtime per authenticated application shell. Runtime counts and style/state acceptance remain pending the user's manual DevTools checklist; no later performance task or product phase was started.

The same-day [warm-tab follow-up](../reports/05-warm-tab-interaction.md) coalesces browser-local persistence, isolates inactive editor updates, and retains selection-toolbar plugins after the user reported a small remaining delay. Timing remains pending manual measurement.

The 2026-10-06 tab performance review retains visited document editors and restores cached tabs locally, while keeping save guards and split-pane freshness. See [the report and manual checklist](../reports/05-tab-switching-performance.md). Runtime latency remains pending user validation. The [document handoff correction](../reports/05-document-tab-handoff.md) fixes the first pass's missing cache registration, transient loading islands, and document fade.

The 2026-10-05 editor performance review removes blocking Mermaid preparation, introduces predictive/lazy previews, and improves save/inspection scheduling. Measurements, rejected native-view experimentation, evidence limits, and the manual acceptance checklist are recorded in `../reports/05-predictive-editor-performance.md`. Remain in Phase 5 for manual review.

The same-day [scroll preparation follow-up](../reports/05-mermaid-scroll-preparation.md) prevents scrolling from starving nearby Mermaid work and mounts prepared previews independently of local render jobs.

The [layout stability follow-up](../reports/05-mermaid-layout-stability.md) reserves prepared diagram dimensions for all copies before SVG mounting, preventing tall prepared previews from pushing following blocks when reached.

The [document scroll follow-up](../reports/05-document-scroll-layout.md) replaces broad embedded-pane CSS searches with explicit frame state and separates SVG writes from subsequent scheduler geometry reads. It records diagnostic limitations and the foreground manual scroll checklist.

The 2026-10-02 cover review adds six cropped cover ratios and per-container Gallery appearance settings to the active floating workspace pass. Existing wide covers and Gallery configurations retain their prior appearance until replaced or edited. Manual review and quality-gate results belong in the phase report; do not start a later phase.

The 2026-10-05 user-approved editor styles addition remains in Phase 5 review: Settings now supports account-wide document block CSS, import/export, independent overrides, and live preview. See [the feature report](../reports/05-editor-styles.md). This explicitly revises the deferred custom-CSS scope without starting Phase 6 or 7.

The 2026-10-06 editor styles UX review implements the approved focused-dialog plan without starting another phase. [The redesign report](../reports/05-editor-styles-redesign.md) records the actual checks, library limits, and replacement manual checklist.

## Current floating workspace pass (2026-09-30)

The workspace selector now includes **Manage workspaces**, which opens the Workspaces section in Settings. Its floating manager offers compact creation, drag reorder, row menus for Rename and Move to Trash, and a collapsible Trash with Restore and permanent deletion. Permanent deletion is reached from a trashed workspace's menu and requires the exact workspace name; the server repeats that check and removes the workspace hierarchy, related records, and attachment directory. Search and document text fields use borderless surfaces without a black native focus frame.

The review also centers the tab island, adds Grid/List/Gallery explorer layouts, and gives folders and databases compact image icon and cover headers. Trash rows have more space between avatar and title. The layout selection is transient per app tab and container; the container media IDs are stored on nodes through a new migration. The 2026-10-01 review fixes view-switcher click interception and list wrapping.

The user replaced the earlier orbital home brief with a continuous, neutral workspace of independent floating controls and compact items. This pass supersedes the carousel/half-orb explorer, while leaving document/database work surfaces and the backend unchanged.

- Independent floating top groups: logo, custom workspace selector, a separate breadcrumb-path island immediately to its right, a centered opened-tabs island whose plus button opens workspace home in a new tab, and settings/account controls. Breadcrumb ancestors open their hierarchy location. Search expands into an inline, current-page field; Ctrl+Space still opens Search Master.
- Show only direct children, in persisted order, without a sidebar, headings, counts, hero, footer, or visible Trash shortcut.
- Click/Enter opens an entity in the current tab; Ctrl+click or Ctrl+Enter opens it in a new app tab. Space can select a focused item. Native drag/drop supports reorder and validated containment. Right-clicking empty explorer space offers document, folder, and database creation; right-clicking an item offers Open, Open in new tab, Rename, and Delete. The item menu does not expose Move.
- Use short CSS transitions and honor reduced motion.
- Review routes, checks, compromises, and manual acceptance are recorded in `../reports/05-floating-workspace.md`.

The floating shell now also wraps document, database, and settings pages. Settings categories sit horizontally inside one floating island. Their editor, database views, and controls sit inside a single spacious island; data behavior remains unchanged. The original 3D tasks below remain suspended. Stop after this explorer review; do not start another phase.

The floating top controls stay fixed at the viewport top while pages scroll. Their space in the page adapts to wrapped rows and the expanded search field so content starts below the controls.

The 2026-10-02 navigation review restores an in-app Back button in the floating top controls at the user's request. It hides on workspace roots or when the active tab has no earlier page; its reveal and removal animate the neighboring controls into place, except under reduced motion. Browser Back and Forward refresh restored Inertia pages from the server so edited document titles, covers, and database properties appear in parent views without a manual refresh.

The 2026-10-01 explorer follow-up enlarges item icons in Grid, List, and Gallery. While dragging an item in a nested folder, a drop area appears above the items; dropping there moves the item to that folder's immediate parent and appends it to that parent's contents.

## Goal

Implement Orbium's signature spatial hierarchy navigator using the stable domain/navigation systems from previous phases.

## Read first

- `docs/05-ui-ux-system.md`
- `docs/09-orbit-3d.md`
- `docs/08-search-navigation.md`

## Unified Trash review enhancement (2026-10-06)

The [permanent deletion ID correction](../reports/05-trash-node-id-fix.md) fixes collection indexes being used as node IDs during subtree previews, attachment lookup, and removal. Use its manual checklist to recheck the reported foreign-key failure; no application data was modified during implementation.

The subsequent [Trash UI redesign report](../reports/05-trash-ui-redesign.md) documents the approved native row/menu presentation, fixed details drawer, scope synchronization, and immediate ordinary recovery. It supplies the current manual UI checklist; visual validation remains pending.

The approved Trash enhancement adds a standalone account-wide page with workspace filtering, grouped container contents, restoration, bulk actions, and permanent subtree deletion. Deletion previews are checked again on the server; workspace deletion requires exact names. Existing separately trashed descendants remain deleted when a parent is restored. See [the report and manual checklist](../reports/05-unified-trash.md). Manual validation remains pending; this is Phase 5 review work.

## Tasks

### 5.1 Scene foundation

Create reusable Orbit canvas/scene with:

- camera;
- lighting;
- dark/light environment;
- quality settings hooks;
- reduced-motion hooks.

**Commit:** `feat(orbit): add spatial scene foundation`

### 5.2 Deterministic layout

Implement tested direct-child orbital layout.

**Commit:** `feat(orbit): add deterministic child layout`

### 5.3 Node visual grammar

Implement central/folder/document/database forms/materials.

No bright type colors.

**Commit:** `feat(orbit): add node visual language`

### 5.4 Interaction

Hover/select/open with keyboard-compatible application actions outside the canvas.

**Commit:** `feat(orbit): add node interactions`

### 5.5 Continuous motion

Use R3F frame loop for restrained drift/rotation.

**Commit:** `feat(orbit): add subtle world motion`

### 5.6 Folder navigation transitions

GSAP enter/parent transitions.

Preserve navigation context.

**Commit:** `feat(orbit): add hierarchy transitions`

### 5.7 Document/database transition integration

Connect Orbit to existing editor/database tabs without duplicating page state.

**Commit:** `feat(orbit): integrate work surfaces`

### 5.8 Database Orbit

Activate the Phase 3 Orbit view using the same engine.

Display configurable limited property metadata.

**Commit:** `feat(databases): enable spatial database view`

### 5.9 Search reveal

Complete `Reveal in Orbit`:

- parent context;
- correct target selection;
- stable camera.

**Commit:** `feat(orbit): add reveal navigation`

### 5.10 Empty and creation states

Create-node visual emergence where tasteful.

**Commit:** `feat(orbit): add empty and creation states`

### 5.11 Performance and quality levels

Low/Balanced/High.

Test large direct-child sets.

**Commit:** `perf(orbit): add adaptive quality controls`

## Expected result

Orbium now has its recognizable identity without sacrificing normal productivity navigation.

## Automated gate

Test:

- layout determinism;
- direct-child-only data;
- node type mapping;
- reduced motion;
- navigation state;
- reveal target resolution.

Playwright can test non-visual state transitions; do not pretend it proves visual quality.

## Manual validation

1. Open workspace root.
   - Expected: central workspace + direct children only.
2. Enter nested folders repeatedly.
   - Expected: smooth context replacement, correct breadcrumbs.
3. Return parent.
   - Expected: reliable previous context.
4. Hover nodes.
   - Expected: targets stabilize and remain easy to click.
5. Open document.
   - Expected: transitions to calm editor.
6. Return/reveal in Orbit.
   - Expected: correct parent/selection.
7. Open database Orbit.
   - Expected: database center + direct document children only.
8. Create cross-folder mention.
   - Expected: **no** line/node from other folder appears in Orbit.
9. Enable reduced motion.
   - Expected: no essential function lost.
10. Test Low/Balanced/High.
11. Test folder with many direct children.
   - Expected: usable; labels/effects degrade before interaction becomes unusable.
12. Try camera drag/zoom.
   - Expected: cannot easily get irrecoverably lost.

## Stop

Produce report and wait.
