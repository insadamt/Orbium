# Boards phase 4 — Inline Documents and self-mention exclusion

## Implemented

The user's clarification separates editable inline canvas content from contextual
mentions. Add → Inline Document now searches Documents only, with no All pages
filter. The browse endpoint enforces that restriction. Newly inserted Document
cards enter editing automatically and retain original-document save/ownership
behavior. New non-Document resource-object writes are rejected, including copied
objects with new identities; existing Database/Board cards remain readable,
movable and removable without rewriting their stored content.

Mention mode supports folders, Documents, Databases and Boards within the visible
workspace, excluding the source Node. Board text, Markdown and legacy Document
completion use the shared source-aware candidate request; the server validates the
source and excludes it before limiting results. Generic page URLs support folder
navigation through the normal app tabs.

Server-side self-target checks cover Markdown references (including package
imports through the normal save action), legacy JSON mentions, canonical native
Board page links, Board table-source mentions and database mention-property
writes. Property pickers exclude the owning Document, including in database rows
and the Document property header. Hosted Document editors use the original
Document as source, so they exclude that Document and may reference the host Board.

## Compatibility / commits

No migration or spatial/content-format change. Deploy the frontend/backend
together: mention candidate requests now require `source_id`. Previously saved
self-mentions are not silently rewritten; remove the self-reference before saving.
Existing non-Document cards can still be moved or removed, but cannot be duplicated
as new inline content. Existing byte budgets and removal of the Board block-count
cap remain in effect. No unrelated Instant Scene/PDF or concurrently added drawing work was discarded.

No commit created. Suggested messages:

- `fix(boards): restrict inline content insertion to documents`
- `fix(mentions): exclude and reject self references across editors`

## Actual checks

- Frontend formatting: passed for changed TypeScript files.
- `npm run types:check`: passed on the latest repeat. An intermediate repeat
  encountered concurrent drawing integration errors that were subsequently
  resolved in the shared workspace.
- `npm run lint`: passed on the latest repeat (707 formatted files, no warnings
  or lint errors in 597 files). An intermediate repeat encountered formatting
  issues in concurrently added drawing files, subsequently resolved in the shared
  workspace. Targeted `vp fmt --check` and `vp lint` also passed for all 13
  TypeScript files touched by this correction.
- `npm run build`: passed; existing chunk-size, mixed static/dynamic import and
  plugin-timing warnings remain.
- `./vendor/bin/pint --test`: passed.
- PHP syntax: passed for the new SelfMentionGuard, MarkdownReferenceValidator,
  SaveDocument, ManageDatabase, DocumentController, MentionCandidateController,
  BoardContent, BoardResourceReferences, BoardResourceController and BoardResources.
- `git diff --check`: passed.
- No automated tests, Playwright or browser automation were written or run.

## Manual test checklist

Prepare one Board, a second Board, a folder, a Database and two Documents in the
same workspace. Give pages distinct titles for precise searches.

1. Open Add → Inline Document. Expected: only Documents appear, including after
   searching a folder/Database/Board title; there is no All pages option. Select a
   Document: its content opens for editing on the canvas. Change content, wait for
   Saved and open the original: the edit appears in that same Document.
2. Create a new Document from that dialog. Expected: exactly one sibling Document
   and one editable card appear; existing retry protection remains.
3. Edit native Board text and type `@`. Search for each supported page type.
   Expected: folder, Document, Database and other Board references can be inserted.
   Search the current Board's unique title: it does not appear. Identical titles
   on other Nodes remain eligible because exclusion is by identity.
4. Choose Inline Document inside the `@` picker. Expected: only Documents appear;
   selection removes the query and inserts an editable Document card beside the
   writing block. Switch back to Mention: other supported page types reappear.
5. Finish native editing and click a folder mention. Expected: the folder opens
   through the ordinary app tabs. Repeat for Document, Database and Board links.
6. Open a normal Markdown Document. Type `@` and search its own title, then another
   page's title. Expected: its own ID is excluded, while other page types remain
   available. Insert a valid mention, wait for Saved and reload: it persists.
7. In a disposable Markdown Document, paste `[@Self](orbium:node/<its-node-id>)`.
   Expected: saving reports that a page cannot mention itself; the draft is kept.
   Remove that reference: saving succeeds again.
8. Repeat completion and self-target checks in an existing legacy JSON Document.
   Expected: its own page is absent from completion; a self-target JSON mention
   submitted through the save request is rejected. No automatic format conversion
   or content deletion is introduced.
9. Edit Document A inside a Board. Expected: A is excluded from its mention picker,
   Document B and the host Board remain eligible, and valid mentions save into A's
   original content. This matches opening A as an ordinary Document.
10. Open a database mention-property picker for Document A in both its table row
    and Document property header. Expected: A is absent and other supported Nodes
    remain available. Attempt to save A's own ID in the property through DevTools:
    expected 422 with a self-mention message; stored values remain unchanged.
11. On a disposable Board, use DevTools to attempt a resource insertion targeting
    a Database/Board, or a native linked-text save pointing to the current Board's
    canonical page URL. Expected: the server rejects the new non-Document inline
    object or self-mention. Valid Document insertion and other-page mentions save.
12. If older Database/Board cards exist, move one and save/reload. Expected: it
    remains intact and removable. Creating a copy with a new identity is rejected
    under the Document-only insertion rule.
13. Search for trashed pages, descendants of a trashed folder and pages from another
    workspace. Expected: they do not appear in mention completion or inline search.
14. Exercise arrows/Enter, Escape, Tab mode switching, zoom/fullscreen placement and
    Undo/Redo. Expected: selection/focus remain usable, valid insertions persist
    after saving/reloading, and the earlier 1,000-block cap does not return.

## Limits / stop gate

Browser/manual acceptance remains pending. Mention availability stays within the
owned workspace. This correction changes mention/insertion behavior during the
current phase-4 review and does not start another product phase.
