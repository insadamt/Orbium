# Orbium product specification

## 1. Product definition

**Orbium** is a self-hosted spatial knowledge workspace.

It combines:

- hierarchical organization through workspaces, folders, documents, and databases;
- free-form Notion-like documents;
- Markdown-first authoring shortcuts;
- structured database documents;
- a minimalist 3D hierarchy visualization;
- fast direct navigation through Search Master;
- conventional hierarchy access through Navigator;
- complete user-data portability between self-hosted installations.

Orbium must be useful as normal productivity software even if the user never interacts heavily with the 3D scene. The 3D layer is a navigation identity, not a gimmick.

## 2. Product philosophy

Three interaction modes define the product:

```text
Explore → 3D Orbit
Work    → Documents and Databases
Jump    → Search Master
```

The supporting deterministic navigation mode is:

```text
Browse hierarchy → Navigator
```

The product must preserve both beauty and speed.

## 3. Ownership philosophy

Orbium is self-hosted:

- users control their own server and data;
- no required vendor cloud exists;
- local server storage is the initial file backend;
- Docker-based deployment should be straightforward;
- portability must allow the user to take the complete portable knowledge snapshot to another Orbium installation.

Self-hosted does **not** mean the v0.1.0 web app must be offline-first. True local-first/offline synchronization is deferred.

## 4. Fundamental hierarchy

```text
User
└── Workspace
    └── Node
        ├── Folder
        ├── Document
        └── Database
```

A node has one parent except a root-level node in a workspace, where `parent_id` is null.

Containment:

```text
Folder
├── Folder
├── Document
└── Database

Database
└── Document

Document
└── no children
```

A document inside a database has the database as its parent. It is not simultaneously parented by a folder.

## 5. Relation vs mention

### Relation

A **relation** is structural containment:

```text
Parent → Child
```

Examples:

- Workspace root → Folder
- Folder → Document
- Folder → Database
- Database → Document

The 3D Orbit visualizes relations.

### Mention

A **mention** is a contextual reference:

```text
Document A → mentions → Node B
```

A mention:

- may reference a document, folder, or database;
- does not change either node's parent;
- may cross folders;
- is not rendered as a connection line in the 3D Orbit;
- may later power a separate 2D knowledge map.

Rule:

> Relations tell Orbium where something lives. Mentions tell Orbium what something refers to.

## 6. Documents

Every document has:

- title;
- optional icon;
- optional cover;
- body;
- parent;
- timestamps;
- trash/deletion state where applicable.

The body uses a Notion-like block editor with Markdown typing behavior.

The editor must support at minimum:

- paragraphs;
- H1/H2/H3;
- bullet lists;
- numbered lists;
- checklist;
- quote;
- callout;
- divider;
- code blocks;
- inline code;
- bold/italic/strike;
- links;
- tables;
- images;
- file attachments;
- Mermaid;
- inline/block math;
- mentions.

Markdown shortcuts include at minimum:

```text
# + Space       → H1
## + Space      → H2
### + Space     → H3
- + Space       → bullet
1. + Space      → numbered list
> + Space       → quote
``` + language  → code block
---             → divider
```

`/` opens the block command menu.

## 7. Databases

A database is a node that:

- defines a structured schema;
- contains document children;
- exposes those documents through structured views.

Core rule:

> Every database entry is a document. A database simply gives its documents shared structure.

A database document therefore has:

```text
Title
Structured properties
Free-form document body
```

Initial property types:

- Text
- Number
- Select
- Multi-select
- Checkbox
- Date
- URL
- Email
- Files
- Mention

The document title is universal and built-in. It is not a deletable custom property.

Initial database views are exactly:

1. Table
2. Gallery
3. Orbit

No required-property feature and no database-template feature in v0.1.0.

## 8. Search Master

Shortcut:

```text
Ctrl + Space
```

Search Master is:

```text
Search + Navigation + Commands
```

It searches within the active workspace by default:

- folders;
- documents;
- databases;
- tags;
- document content;
- searchable database property values;
- mentions/referenced nodes;
- commands.

Ranking should prioritize:

1. exact title match;
2. title prefix;
3. fuzzy title;
4. tags/properties;
5. body content;

then apply contextual boosts such as recent access and current hierarchy proximity.

Opening with an empty query shows recent/pinned content.

## 9. Navigator and tabs

Navigator is a conventional hierarchical tree shown in a temporary frosted panel.

Suggested shortcut:

```text
Ctrl + B
```

Orbium also supports workspace-style tabs. Tabs can hold:

- Orbit locations;
- Documents;
- Databases;
- Settings.

Tab state should survive normal page refresh/reload. Each tab preserves relevant local UI state.

## 10. 3D Orbit

The Orbit shows only:

```text
Current container + direct children
```

It does not show the whole workspace graph at once.

The current workspace/folder/database is the central object. Direct children orbit it.

Entering a folder:

1. camera approaches;
2. siblings fade/drift away;
3. selected folder becomes the new center;
4. new direct children enter their orbital positions.

The layout is deterministic, not physics-based.

Mentions never create lines in the 3D Orbit.

## 11. Visual identity

Identity:

- minimalist 3D;
- monochrome;
- black/white/gray;
- restrained frosted glass;
- subtle depth;
- semantic color only.

Use color for information:

- success/completed;
- warning/pending;
- error/destructive;
- information/selection;
- subdued tag/select categorization.

Do not use a permanent bright brand color.

Avoid:

- galaxy/starfield clichés;
- purple SaaS gradients;
- sci-fi HUD clutter;
- lens flares;
- excessive glow;
- saturated planet colors.

The intended feel is:

> abstract spatial minimalism.

## 12. Settings and onboarding

Initial settings categories:

- Appearance
- Workspace
- Editor
- Search
- Storage
- Portability
- Account

Appearance:

- Light / Dark / System
- Reduce Motion
- 3D Quality: Low / Balanced / High
- interface scale/glass intensity only if implementation remains simple

Editor settings:

- font size
- content width
- line height
- block handles
- code line numbers
- spellcheck

Onboarding should be very short:

1. Orbium identity
2. Explore / Work / Jump concept
3. create first workspace or restore an Orbium archive

Contextual hints should replace a long guided tour.

## 13. Portability

Orbium portability is a first-class product feature.

A portable archive is:

> a versioned, validated, self-contained snapshot of the user's complete portable Orbium knowledge graph.

It includes:

- workspaces;
- full hierarchy;
- documents/content;
- database schema/views/values;
- tags;
- mentions;
- files/images/covers;
- relevant user-domain settings;
- required metadata.

It excludes:

- password hashes;
- sessions;
- reset tokens;
- application keys;
- `.env`;
- server secrets;
- infrastructure configuration.

Details: `docs/10-portability-protocol.md`.

## 14. Product quality bar

Orbium v0.1.0 is complete when:

- hierarchy is reliable;
- writing feels natural;
- structured databases are usable;
- Search Master is fast;
- Orbit feels deliberate rather than decorative;
- the app works without relying on the Orbit for every task;
- portable archives round-trip complete user data safely;
- a fresh self-hosted install can be used without hand-editing application data;
- critical flows are covered by automated and manual verification.
