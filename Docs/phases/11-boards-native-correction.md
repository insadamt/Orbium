# Boards phase 3 review correction — Independent canvas blocks

The user rejected the document-fragment model and explicitly authorized this correction with “okey fix it”. This remains phase 3; no later feature phase is authorized.

## Decisions before implementation

- Replace live document Markdown fragments with Board-owned typed JSON blocks: text, heading, list, quote, callout, code, table, image, file/media, math, Mermaid and divider. Text uses a constrained inline-rich-text model; list items and table cells are fields within their typed object, never an embedded document with arbitrary block nesting.
- Remove document slash menus, source/preview document modes, six-dot block gutters, internal block merging/reorder and document split registrations from Boards. Use direct canvas selection/dragging, double-click editing, contextual controls and a Board insertion palette. Reuse only lower-level text editing, highlighting, playback, KaTeX and sanitized diagram primitives.
- Text/headings/lists/quotes/dividers have transparent surfaces with no persistent header/border/shadow. Content-specific code/callout/table/media surfaces remain where useful. Selection reveals outlines/resize handles and contextual tools; drag the unedited object's body, with no permanent grip.
- Introduce spatial format 3 and native Board content format 1 through a new migration. Preserve old rows and original Markdown until explicitly saved as native blocks. A versioned compatibility reader splits old top-level content into independent typed objects and retains original source for recovery. Unknown or over-budget conversion must fail visibly with raw snapshot download, never partially discard content. Existing optimistic locks, Library protection, upload guards and drafts remain.
- Keep scope in phase 3. No live resource cards, hierarchy changes, Mind Maps, grouping/merging or additional shapes are introduced.

## Required validation

Do not write or run automated tests. Run formatting, PHP syntax, lint, types, build, migration SQL inspection/application and whitespace checks. Finish with a correction report, exact manual checklist and commit suggestions; stop for user review.
