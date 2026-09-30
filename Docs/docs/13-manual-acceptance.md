# Global manual acceptance matrix

This document supplements the specific phase checklists.

## Visual

- no accidental bright brand color;
- frosted glass is restrained and readable;
- text contrast is sufficient;
- dark mode feels intentional;
- light mode does not become washed out;
- semantic colors communicate state consistently;
- controls do not overwhelm content.

## Navigation

- Search Master opens globally with `Ctrl + Space`;
- the native workspace selector is keyboard usable;
- breadcrumbs always provide deterministic location;
- browser/tab navigation does not strand the user;
- opening documents/databases behaves consistently;
- reveal-in-Orbit returns to the correct parent.

## Hierarchy

- folders nest correctly;
- databases reject folder/database children;
- documents reject children;
- moving cannot create cycle;
- same node never appears to have two parents;
- deleting/restoring parent does not orphan children.

## Editor

- Markdown shortcuts feel natural;
- slash menu is fast;
- block controls are unobtrusive;
- autosave status is trustworthy;
- reload preserves saved content;
- code language/icon matches selection;
- Mermaid failures preserve source;
- math renders;
- image/file upload works;
- mentions resolve and navigate.

## Database

- title always exists;
- property edits persist;
- values remain attached after reload;
- Table/Gallery show same underlying documents;
- filters/sorts behave consistently;
- opening database document exposes properties + normal body;
- Orbit only shows database's direct child documents.

## Search Master

- title search is fast;
- content results show useful snippet;
- result opens right target;
- current hierarchy proximity improves useful ranking without breaking exact match;
- commands obey parent containment rules;
- empty search shows useful recent content.

## Orbit

- current container is visually clear;
- direct children only;
- no mention lines;
- folder entry transition is natural;
- document open transition is natural;
- hover target does not move away;
- camera cannot easily become unusable;
- reduced motion is functional;
- equivalent navigation exists through Search and the workspace explorer.

## Portability

- export yields one archive;
- generated archive validates;
- preview counts are believable;
- restoring to a fresh account reconstructs the graph;
- restoring over existing data creates safety archive first;
- existing auth credentials remain destination credentials;
- attachments open after restore;
- mentions still target the correct new IDs;
- database values still match their documents/properties;
- restoring same archive again does not duplicate logical data.

## Self-host

- fresh Docker install starts cleanly;
- persistent database/files survive container restart;
- application reports a clear error if PostgreSQL/storage is unavailable;
- no extra infrastructure is required for core functionality.

## Approval rule

A phase is approved only when the user explicitly communicates approval after reviewing its manual checklist.

Until then, Codex remains on the current phase.
