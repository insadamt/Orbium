# Product decision log

## 2026-09-30 — Workspace home redesign

The user approved a dark, three-area workspace layout inspired by a file management reference: a narrow navigation rail, collapsible folder tree, and primary content area. Workspace and folder pages show folders as cards and documents/databases as a compact list. Items open with a single click. The sidebar may be hidden to give the explorer more room. The editor and database work surfaces keep the compact top shell. This approval replaces the earlier no-sidebar decision for workspace and folder pages; the spatial UI remains suspended.

## 2026-09-30 — Home and spatial UI reset

The user requested a fresh start for the home page and removal of both the 3D and 2.5D implementations. The existing Orbit scene, Orbit views, related controls, and home page hero were removed. Workspace and database list/table/gallery flows remain available. The earlier Orbit and visual identity decisions below describe the original plan; they are suspended until the user approves a new design.

## 2026-09-30 — File explorer home

The workspace home and folder pages use a file explorer grid. Dragging to a tile edge reorders items; dragging to a folder center moves an item into that folder. Breadcrumbs accept drops to move an item to an ancestor. Database nodes are opened as work surfaces and are not drag destinations in the explorer, because moving documents into or out of a database resets structured values. The existing native drag implementation in Navigator is reused, with the Move action available for non-pointer input.

These decisions were made during product planning and should not be reopened casually during implementation.

## Name

**Orbium**

## Core mental model

- Folders = unstructured organization by location.
- Databases = structured organization by schema.
- Every database entry is a document.
- A database adds shared structured properties above a normal free-form body.

## Hierarchy

- One parent per node.
- Folder contains Folder/Document/Database.
- Database contains Document only.
- Document contains nothing.

## Terminology

- Parent-child = **Relation**
- Contextual cross-node reference = **Mention**

## Orbit

- visualizes Relations only;
- direct children only;
- no mention links;
- future mention graph is separate and 2D.

## Editor

- Notion-like block UX;
- Markdown typing syntax/shortcuts;
- not a raw Markdown textarea;
- code blocks display programming-language icons.

## Database views

Exactly:

- Table
- Gallery
- Orbit

for v0.1.0.

Removed from v0.1.0:

- required properties;
- database templates.

## Search

`Ctrl + Space` = Search Master.

Search Master combines:

- search;
- navigation;
- commands.

## Visual identity

- minimalist 3D;
- frosted glass controls;
- white/black/grayscale identity;
- semantic color only;
- no decorative brand color.

## Stack

- Laravel 13 / PHP 8.4
- Inertia
- React 19 / TypeScript
- Vite 8
- Tailwind 4
- PostgreSQL
- Tiptap/ProseMirror
- Three.js / React Three Fiber / Drei
- GSAP
- Zustand
- PostgreSQL FTS + pg_trgm

## Motion ownership

- CSS = microstates
- GSAP = deliberate transitions
- Three.js/R3F frame loop = continuous world motion

## Portability

- one file carries the complete portable user dataset;
- versioned archive format independent of app version;
- NDJSON for streaming;
- SHA-256 checksums;
- strict validation;
- explicit backward adapters;
- reject future unsupported formats;
- old-to-new ID remapping;
- safety archive before destructive replacement;
- no merge semantics.

## Development workflow

- phases;
- automated verification;
- manual user review;
- explicit approval;
- only then next phase.

## Git

- one logical commit per task;
- format/lint/type/build/test before commit;
- no temporary commits intended for later squash.

## 2026-10-05 — Account-wide editor block themes

The user approved Settings-based Custom CSS for all documents: import/write one base stylesheet, customize each block type independently, preview drafts, and export one shareable CSS file. This replaces the prior deferral for document block CSS only; global application themes and a marketplace remain deferred. Persist preferences on the authenticated user, keep editor content unchanged, expose stable `.orbium-*` selectors, and restrict styles to appearance properties. Use CodeMirror for editing and CSSTree for parsing/validation; Orbium provides scoping and restrictions. Stay in Phase 5 for manual review.
