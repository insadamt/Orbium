# Phase 5 — 3D Orbit

> Suspended on 2026-09-30 after the user requested a fresh home and spatial UI. The 3D and 2.5D implementations have been removed. Do not resume the tasks below without a new user-approved design.

## Goal

Implement Orbium's signature spatial hierarchy navigator using the stable domain/navigation systems from previous phases.

## Read first

- `docs/05-ui-ux-system.md`
- `docs/09-orbit-3d.md`
- `docs/08-search-navigation.md`

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

### 5.9 Search/Navigator reveal

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
