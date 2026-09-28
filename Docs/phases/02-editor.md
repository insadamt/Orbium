# Phase 2 — Document editor, mentions and attachments

## Goal

Turn Document nodes into Orbium's full writing surface.

## Read first

- `docs/02-domain-model.md`
- `docs/04-data-model.md`
- `docs/06-document-editor.md`
- `docs/11-security-self-hosting.md`

## Tasks

### 2.1 Document persistence

Add `documents` extension table/model.

Persist:

- content JSONB;
- content format version;
- derived plain text;
- optional cover reference.

Every document node must have a document extension record.

**Commit:** `feat(documents): add document content persistence`

### 2.2 Editor content service

Implement a central service for:

- content validation;
- plain text extraction;
- mention extraction;
- attachment reference extraction;
- future reference remapping.

Cover with unit tests.

**Commit:** `feat(editor): add structured content inspection`

### 2.3 Tiptap base editor

Implement:

- paragraphs;
- H1/H2/H3;
- bullet/number/check lists;
- quote;
- callout if extension chosen;
- divider;
- inline formatting;
- links;
- tables.

**Commit:** `feat(editor): add block editing foundation`

### 2.4 Markdown shortcuts

Implement agreed shortcuts and test them.

**Commit:** `feat(editor): add markdown typing shortcuts`

### 2.5 Slash menu and block UX

Implement:

- `/` command picker;
- filtering;
- keyboard navigation;
- block add/drag/menu;
- selection toolbar.

**Commit:** `feat(editor): add slash and block controls`

### 2.6 Autosave

Implement reliable debounced autosave and status.

Persist content/plain text/derived references transactionally.

**Commit:** `feat(editor): add autosave workflow`

### 2.7 Code blocks

Add:

- syntax highlighting;
- language selector;
- language icon;
- copy;
- optional line numbers.

**Commit:** `feat(editor): enhance code blocks`

### 2.8 Mermaid and math

Implement safe Mermaid and math blocks.

**Commit:** `feat(editor): add diagrams and math`

### 2.9 Attachment storage

Add attachment model/storage service and authorized upload/download.

Server-generated storage keys only.

**Commit:** `feat(files): add document attachment storage`

### 2.10 Image/file blocks

Implement paste/drag/upload images and file attachment blocks.

**Commit:** `feat(editor): add image and file blocks`

### 2.11 Mentions

Add mention data model/index.

Implement `@` picker for Document/Folder/Database.

Saving updates mention index from content.

**Commit:** `feat(mentions): add cross-node document mentions`

### 2.12 Document header/cover/icon

Implement title, optional icon, optional cover without making them visually mandatory.

**Commit:** `feat(documents): add document header presentation`

### 2.13 Current-document search

Implement `Ctrl + F` behavior appropriate to editor.

**Commit:** `feat(editor): add in-document search`

## Expected result

A normal document is now a high-quality writing tool independent of databases/3D.

The user can type Markdown naturally while receiving structured Notion-like editing.

## Automated gate

Tests:

- document ownership;
- content save/reload;
- plain text derivation;
- mention extraction/index synchronization;
- attachment reference extraction;
- invalid mention target;
- upload authorization;
- unsafe file/path behavior;
- editor component keyboard commands;
- autosave race behavior;
- Mermaid unsafe/error behavior where testable.

Playwright:

- create document;
- type Markdown shortcuts;
- reload;
- mention another node;
- upload image/file.

## Manual validation

1. Open normal document.
   - Expected: calm editor, no permanent toolbar.
2. Type each Markdown shortcut.
   - Expected: converts to expected block.
3. Open `/` and use keyboard only.
   - Expected: commands filter/select correctly.
4. Drag/reorder/duplicate/delete blocks.
   - Expected: content remains stable.
5. Create code block and switch among PHP/TS/Python.
   - Expected: syntax + correct language icon/label.
6. Add Mermaid valid and invalid source.
   - Expected: valid renders; invalid shows safe error and source survives.
7. Add inline/block math.
   - Expected: renders.
8. Paste image and upload file.
   - Expected: persists after reload.
9. Type `@` and mention a folder/document/database.
   - Expected: mention renders and opens correct target.
10. Edit mention away.
    - Expected: mention index no longer reports stale reference.
11. Type continuously while autosave occurs.
    - Expected: no lost/latest-state regression.

## Stop

Produce report and wait.
