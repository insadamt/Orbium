# 3D Orbit specification

## Purpose

The Orbit visualizes **hierarchical containment**, not arbitrary knowledge links.

It answers:

> Where does this node live?

Mentions answer a different question and are not rendered in this scene.

## Scene scope

Render:

```text
Current container
+
Direct children only
```

Never recursively render the entire subtree.

This is both a UX and performance invariant.

## Valid central nodes

- Workspace root
- Folder
- Database (when viewing its Orbit)

A document is opened as a work surface, not promoted to a central planet.

## Visual grammar

Suggested, not decorative:

### Current container

- largest central orb/form;
- monochrome material;
- subtle controlled illumination;
- minimal surface detail;
- slow restrained rotation.

### Folder

- smaller moon/sphere;
- matte or slightly rough material;
- more visual weight than a document.

### Document

- smaller, smoother/minimal orb/node;
- lower visual weight.

### Database

- distinct structured form;
- recommended subtle ring/geometric accent;
- avoid exaggerated Saturn imagery.

Differentiate types primarily by form/material rather than saturated colors.

## Labels

Default:

```text
Node Name
```

Hover may add:

```text
type
item count
small useful metadata
```

Avoid permanent large info cards.

## Layout

Use a deterministic layout algorithm based on:

- child count;
- stable ordering;
- available rings/radii;
- viewport.

Requirements:

- same hierarchy/order should produce stable positions;
- no physics simulation;
- no chaotic collisions;
- avoid perfect sterile symmetry when slight deterministic variation improves natural feel.

## Continuous motion

Very slow orbital drift.

Rules:

- users never chase moving targets;
- hover/selection stabilizes the relevant node;
- reduce/pause motion when Search Master opens;
- reduced-motion setting disables or minimizes drift.

## Hover

Subtle:

- slight scale increase;
- rim/light emphasis;
- label clarity;
- nearby scene may slightly de-emphasize.

Avoid large jumps.

## Select/open

Single click:

- select/focus;
- slight camera bias;
- show tiny contextual actions if useful.

Double-click/Enter:

- Folder → enter
- Document → open editor
- Database → open database; Orbit can be selected/remembered

Touch behavior can use single selection + explicit Open.

## Enter folder transition

GSAP timeline concept:

```text
selected child stabilizes
siblings fade/drift
camera approaches selected child
old central object retreats
selected child becomes new center
new direct children enter/stagger
```

Keep transition quick enough for repeated daily navigation.

Suggested target duration around 0.7–0.9 seconds, adjusted by testing.

## Document transition

Do not turn a document into a planet.

Concept:

```text
document node focus
camera approaches
scene fades/recedes
editor surface appears
```

Returning should restore the previous Orbit context/camera state when possible.

## Database Orbit

Uses the same scene engine.

Central = database.

Children = database document nodes.

Optional labels:

- one primary property;
- one secondary property;
- tiny semantic status marker.

No mention lines.

## Camera

Desktop interactions:

- subtle pointer parallax;
- constrained drag/rotation;
- limited zoom;
- click focus.

Do not allow unrestricted 3D navigation that can strand the camera behind/inside objects.

Breadcrumbs/Navigator/Search remain deterministic escape routes.

## Background

Avoid stars by default.

Use:

- near-black/off-white base;
- subtle radial depth;
- optional restrained grain;
- depth fog where useful.

No literal galaxy scene.

## Performance

- render only direct children;
- cap expensive effects by 3D quality setting;
- avoid React state writes per frame;
- use instancing only if child counts justify it;
- test folders with large direct-child counts;
- degrade labels/effects before degrading input responsiveness.

## Large child counts

v0.1.0 may use pragmatic handling:

- search/filter current container;
- adaptive ring spacing;
- label reduction;
- optional paging/clustering only if testing proves necessary.

Do not redesign the hierarchy model for a rare extreme case.

## Accessibility

Everything accessible through Orbit must also be reachable through:

- Navigator;
- Search Master;
- breadcrumbs.

Reduced motion must preserve all functions.
