# Product decision log

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
