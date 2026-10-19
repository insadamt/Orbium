# Boards phase 3 — Shared native blocks

Historical initial implementation. The user rejected the fragment model during review. `11-boards-native-correction.md` supersedes the architecture below; do not restore document editors/gutters inside Board objects.

Approved by the user's “next” after phase 2. Read `../docs/24-boards.md`, the editor and Library contracts, and phase 2 before implementation. Do not write or run automated tests.

## Architecture decisions before implementation

- Each spatial object owns a canonical Markdown fragment, including native nested content. Reuse the document editor's dialect, rich widgets, inline formatting, slash templates, media insertion, tables, callouts, code, math, and Mermaid. Only the active object mounts CodeMirror; no object becomes a Document Node. Register the shared block drag resolver with a local-only boundary: nested blocks can reorder within their own fragment but cannot transfer to another editor.
- Spatial format 2 explicitly enables rich `markdown` objects while retaining existing `paragraph` objects. A new migration upgrades existing Board envelopes without rewriting their source or IDs. Old clients reject format 2. The new client explicitly adapts valid format-1 paragraph recovery drafts. Markdown remains content format 2. Limits become 128 KiB per object and 2 MiB total; geometry and object limits remain unchanged.
- Reuse server Markdown inspection and workspace attachment validation before atomic snapshot writes. Page mentions remain rejected until the resource-reference phase defines Board mention indexing; ordinary links and file references are supported. References never create hierarchy.
- Board-scoped upload, metadata, and download endpoints reuse attachment storage and authorization. Files remain workspace Library assets. Include saved Board fragments in Library usage, including Boards in Trash, so referenced files cannot be deleted. Unsaved uploads remain Library assets if insertion fails.
- Rich contexts carry an optional content owner kind, defaulting to Document for compatibility. Board Mermaid uses the existing sanitized client rendering/session lifecycle without writing the document-only persistent preview cache. Inactive previews stay lightweight and are disposed on culling; media controls and editor interactions do not trigger canvas gestures.
- Add native block templates, source/live preview switching, object clipboard copy/cut/paste with an explicit version and workspace boundary, and content-height fitting. Clipboard fragments receive fresh object IDs and preserve relative layout; validate budgets before committing. Editor text clipboard and its native undo remain local to the active editor. Board object actions remain one canvas undo operation.
- Guard active uploads against switching objects, canvas edits, and navigation. Keep the existing revision conflict and session recovery behavior. Preserve existing document editor and split-pane changes.

## Validation and stop gate

Run relevant PHP formatting/syntax, TypeScript, frontend formatting/lint, build, migration SQL inspection/application, and whitespace checks. Provide exact positive and negative manual checks and commit suggestions. Stop for manual review before phase 4 live resource cards or Mind Maps.
