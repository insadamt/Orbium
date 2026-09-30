# Phase 5 — 3D Orbit

## Compact shell follow-up — 2026-09-30

The user's review found the two stacked navigation rows visually heavy. Orbium now has one 56 px header containing the logo, breadcrumbs, workspace controls, and account menu. Search Master, new tab, and Navigator are direct controls. Back/Forward, open tabs, closing tabs, and Reveal actions are in a compact tab menu. Existing keyboard shortcuts remain in place. Orbit's minimum scene height was increased to use the space recovered from the removed row.

Manual shell check:

1. Open a workspace Orbit, document, database, and settings page. Expected: one navigation row on each page, with readable breadcrumbs and no second tab strip.
2. Open the tab menu. Expected: Back/Forward, all open tabs, tab close, and relevant Reveal actions work. Ctrl+Tab, Ctrl+W, and Alt+Left/Right still work.
3. Use Search, New tab, Navigator, and the account menu from the header. Expected: each opens the same destination or overlay as before.
4. Narrow the window to tablet and mobile widths. Expected: the controls remain reachable, with the logo and account names compacted on narrow screens.

The compact shell requires the user's visual browser review. No automated tests were written or run.

## Orbit scale follow-up — 2026-09-30

The user's next review found the orbital system itself too small inside the expanded page. The first ring now targets a roughly 700–900 px diameter on wide desktop viewports, limited by available height and width. Mesh sizes target a central orb around 180–220 px and direct children around 70–95 px at the default camera position. The camera composition sits slightly right and below center on desktop. Additional rings increase camera distance and scale mesh sizes within a cap.

The default camera storage key moved to `camera.v2` so previously saved, distant camera positions do not hide this change. The existing Reset camera action establishes and saves the new framing. User-adjusted camera positions remain stored afterward.

Manual scale check:

1. Open a workspace with roughly 4–8 direct children at a wide desktop size. Expected: the first orbital system takes most of the central viewing area, with an approximately 700–900 px wide path and large, readable orbs.
2. Select a child, drag and zoom, then click Reset camera. Expected: the camera returns to the larger, slightly offset overview without clipping the ring.
3. Reload and open a folder with more than eight children. Expected: the chosen camera persists; the multi-ring overview remains usable, with child sizes reduced only as needed to fit.
4. Check at a narrower viewport. Expected: the camera pulls back enough to keep the ring and controls reachable.

This is a calculated screen-space target. Exact perceived size and overlap still require the user's browser review.

Checks for this scale follow-up: formatting, lint, TypeScript, production build, PHP formatting, and `git diff --check` passed. The build still reports large chunks. No automated tests were written or run.

## Visual review follow-up — 2026-09-30

The user's manual review found the Orbit visually weak and too confined. The reference image is a mood reference, not an exact layout target.

- Workspace and folder Orbit now occupy the full page area beneath navigation. The context title, view switcher, creation actions, preferences, selection action, and Browse items control float over the scene.
- The 3D scene uses a larger dark focal orb, softer light child objects, directional light from both sides, subtle orbital paths, and a slowly moving light atmosphere. The app background carries restrained light depth into non-Orbit surfaces.
- Reduced-motion settings still stop the new atmosphere animation through the global motion rule. Existing List, Search Master, Navigator, camera controls, and WebGL fallback remain available.
- The visual result needs the user's browser review. No screenshot or hardware performance result is claimed here.

Manual review for this follow-up:

1. Open a populated workspace and a nested folder in Orbit at a desktop width. Expected: the scene spans the page beneath navigation, with no narrow centered card; title and controls remain readable over it.
2. Hover, select, double-click, drag, and zoom several nodes. Expected: labels and controls remain clickable, the focal orb remains visually distinct, and the camera stays bounded.
3. Open Browse items, New, and preferences; switch to List and back. Expected: each overlay remains usable and List retains its normal content layout.
4. Switch Light/Dark/System and enable Reduce motion. Expected: adequate contrast in both themes and no moving light atmosphere with reduced motion.
5. Repeat at a tablet width and with 30 or more children. Expected: controls remain reachable and nodes stay usable without major overlap.

Checks for this follow-up: `npm run types:check`, `npm run lint`, `npm run build`, and `./vendor/bin/pint --test` passed. No automated tests were written or run as instructed.

Implemented on 2026-09-30 after the user approved proceeding from Phase 4. Phase 6 has not started.

## Implemented

- Shared, lazily loaded React Three Fiber / Three.js / Drei scene for workspace roots, folders, and databases.
- Deterministic concentric layout from direct-child ordering and stable IDs. Only the current container and its direct children enter the scene; mentions never add geometry or connections.
- Monochrome materials, matte folder spheres, smaller document spheres, and structured database forms with restrained rings. Light and dark environments follow Appearance, including operating-system theme changes.
- Hover stabilization, selection, double-click opening, Enter opening, and explicit Open actions. Browse items provides a filter and keyboard-accessible controls outside the canvas.
- Frame-loop drift and rotation without React state updates per frame. Search Master and Navigator pause world motion.
- GSAP emergence, entry fades, and camera approach/fade when opening folders or work surfaces. Navigation continues through existing Inertia pages and tab history.
- Constrained rotation/zoom, Reset camera, and camera persistence in the active tab's location state. Returning to a previously visited container can reuse that tab's earlier camera state.
- Workspace/folder Orbit and List selectors. Existing creation, item actions, trash, and restore remain available. Creating from Orbit returns to the parent scene and selects the newly created node.
- Database Orbit uses the existing view filters, sorts, and property visibility/order. Labels show up to two properties on hover/selection. Mention/file values display names.
- Reveal in Orbit from Search Master, Navigator/item actions, and the current page's Orbit icon. Database redirects preserve view/focus parameters. Explicit repeated reveals reselect the target and reopen Orbit.
- A revealed database document remains visible even when view filters exclude it, with an explanatory status message. Saved filters remain intact.
- Low/Balanced/High controls adjust pixel ratio, geometry detail, extra lighting, and label budgets. Browser-local Reduce motion combines with the operating-system preference.
- WebGL failure/context-loss fallback retains the item list, Navigator, and Search.

## Migrations and persisted formats

No new migration, editor format, archive format, or dependency was introduced.

- Browser-local preferences: `orbium.orbit.preferences.v1` (quality and reduced motion).
- Existing account-scoped tab storage now contains Orbit selection and camera values in location view state.
- The node creation request accepts an optional `reveal_in_orbit` boolean. Existing callers keep their normal opening behavior.
- Database property metadata uses the existing `visible_property_ids` configuration.

## Validation

- `npm run check:fix`: PASS (formatting and lint).
- `npm run types:check`: PASS.
- `npm run lint`: PASS.
- `./vendor/bin/pint --test`: PASS.
- `git diff --check`: PASS.
- `npm run build`: PASS. The lazy Orbit scene is approximately 941 kB minified / 251 kB gzip. The build reports chunks over 500 kB, including Orbit and existing editor/diagram bundles.
- `docker compose up -d --build app`: PASS, including the final production build. `docker compose restart nginx`: PASS. Final service status: app running/healthy, PostgreSQL running/healthy, Nginx running.
- Docker dependency installation reports 5 high-severity npm advisories in the existing dependency set, also recorded in Phase 4. No dependency upgrades were made in this phase.
- No automated tests were written or run, as instructed.
- Interactive appearance, keyboard behavior, and hardware performance require the user's manual validation. No browser inspection or FPS measurements are claimed.

## Manual test checklist

Open http://localhost:18082 and hard-refresh after the rebuild.

1. Open a populated workspace root. Expected: workspace in the center, only its root-level children around it; no grandchildren or mention connections. Reload without changing order: positions remain consistent apart from restrained motion.
2. Open a folder containing a nested folder, document, and database. Expected: only that folder's direct children appear, with different forms/sizes and readable labels.
3. Hover a node for several seconds, then click it. Expected: its motion stabilizes, emphasis stays restrained, and an Open button names the selected item. Double-click a folder. Expected: quick camera/fade transition, new center, updated breadcrumbs.
4. Enter two nested folders, then use the parent link, breadcrumbs, and Alt + Left/Right. Expected: each destination is correct; the parent link names the actual parent; history returns to the expected scene.
5. Rotate and zoom a scene, open a document, then use Alt + Left. Switch between app tabs and reload. Expected: the relevant tab restores its Orbit view and camera; document editing still uses the normal editor.
6. Rotate/zoom to both limits, then click Reset camera. Reload. Expected: navigation is bounded, reset returns to a useful overview, and the reset camera persists.
7. Use Tab to reach a scene label and press Enter. Also click a sphere and press Enter while the scene is focused. Expected: the selected item opens. Expand Browse items, filter by title, then select/open using keyboard only. Expected: all matching direct children remain reachable.
8. From a document, click the Orbit icon in the top navigation controls. Expected: its parent scene opens with that document selected. Repeat for a document inside a database. Expected: database Orbit opens and selects it.
9. Press Ctrl + Space, find a deeply nested node, and choose Reveal in Orbit. Switch the destination to List or Table, then reveal the same node again. Expected: Orbit reopens with the correct selection. In Navigator, open an item's actions and choose Reveal in Orbit; expect the same behavior.
10. Open a database's Orbit tab. Configure visible properties and reorder them in view settings. Expected: at most the first two visible properties appear when a document is selected/hovered. Switch to Table/Gallery: values still refer to the same documents.
11. Apply database filters/sorts, then reveal a document excluded by those filters. Expected: the requested document appears selected with a message explaining the filter exception; saved filters remain unchanged. Open the ordinary database URL to return to the normal filtered view.
12. In an empty workspace/folder Orbit, use New to create a folder, document, and database. Expected: creation returns to the parent Orbit and selects the new node; only one node is created per submission. Open each new item. In an empty database, New creates a document only.
13. Open Search Master or Navigator over a scene. Expected: motion pauses and the overlay remains usable. Close the overlay: restrained motion resumes.
14. Turn on Reduce motion in the scene or Appearance settings. Also try the operating-system reduced-motion preference. Expected: drift, rotation, and entry/navigation animations stop or minimize, while selecting, opening, and camera controls still work. Reload: the browser setting persists.
15. Switch Light/Dark/System. For System, change the operating-system theme. Expected: both scene background and UI update with readable labels.
16. Try Low, Balanced, and High with 30 mixed direct children, then a folder containing 100 or more direct children if available. Expected: input remains responsive; label detail decreases before interaction is sacrificed. Use Browse items to find nodes without permanent labels. Record your hardware and any stutter for Phase 5 follow-up.
17. Create a mention to an item in a different folder. Expected: no new Orbit node or line appears. Trash a node or its ancestor using List/Navigator, then revisit/reveal it. Expected: unavailable content does not reappear as a visible orphan.
18. If WebGL is unavailable in your browser, open Orbit. Expected: a concise fallback message appears and Browse items, List, Navigator, and Search still open content.

## Limitations and implementation choices

- Quality and motion preferences are local to this browser. Camera/selection history uses the existing account-scoped browser tab storage.
- All matching direct children are rendered. Permanent labels are limited to 12/24/36 for Low/Balanced/High; hovered/selected nodes expose their labels regardless. No paging, clustering, physics engine, or mention graph was added.
- Large-scene frame rates and visual polish await manual review on the user's hardware.
- Full workspace hierarchy payloads are still used by the existing hierarchy UI; the 3D engine receives only direct children.
- Camera transitions use a short approach/fade and scene emergence. Browser history and breadcrumbs provide immediate reliable navigation between contexts.

## Commits and suggestions

No commits created. Existing uncommitted Phase 3 and Phase 4 work was preserved.

Suggested logical commits after separating that earlier work:

- `feat(orbit): add deterministic spatial hierarchy scenes`
- `feat(orbit): add accessible interactions and motion controls`
- `feat(navigation): connect Orbit reveal and camera history`
- `feat(databases): enable Orbit view with property metadata`

## Stop gate

Await manual review and explicit approval before Phase 6.
