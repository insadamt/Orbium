# Boards phase 4 — Page insertion and @ references

## Implemented

The user requested easier page adding, `@` references while writing and inline
Documents. Native Board writing/list editors now offer a caret-anchored picker
with Mention and Inline Document modes. Arrows select, Enter inserts, Tab switches
modes and Escape dismisses without finishing editing. Pointer choices retain the
editor caret. Search is debounced and canceled when superseded; previous-query
results cannot be inserted during the next query's debounce.

Mention inserts ordinary linked `@Title` text. Preview clicks open the existing
Orbium app-tab navigation, including prepared Instant Scene text. Inline Document
inserts the existing live resource card beside the writing block and removes the
typed query. Document content and attachments retain their original ownership.

Add → Page or inline Document now offers All pages / Documents filters, searchable
keyboard selection and a collapsed Create a Document form. Creation still uses
the original idempotent sibling-creation action, recovery and pending-save guards.
The resource endpoint validates the optional type filter and applies it before
pagination using the existing workspace/live-ancestor scope.

## Persistence and compatibility

No migration or format change. References use existing safe-link marks and resource
objects (spatial format 4, native content format 1). Mentions do not change hierarchy
or add Document mention-index rows. A mention label reflects the insertion-time
title and remains ordinary editable linked text. Inline Documents are independent
canvas cards beside the source, rather than nested editors inside a sentence.

## Commits

No commit created. Suggested messages:

- `feat(boards): add @ page mentions and inline document insertion`
- `feat(boards): simplify page search and document creation`

The working tree already contained Instant Scene/PDF work. Those changes were
preserved; this report covers only the page-insertion enhancement.

## Validation

- `npm run types:check`: passed.
- `npm run lint`: passed (formatting and lint).
- `npm run build`: passed; existing large-chunk, mixed static/dynamic import and
  plugin-timing warnings remain.
- `./vendor/bin/pint --test`: passed.
- `php -l app/Http/Controllers/BoardResourceController.php`: passed.
- `php -l app/Services/Boards/BoardResources.php`: passed.
- `git diff --check`: passed.
- No automated tests, Playwright or browser automation were written or run, per
  user instructions. Browser acceptance remains manual.

## Manual test checklist

Use a workspace with an existing Board, two Documents (including one in a folder),
a Database and another Board. Keep a Document in another workspace and a trashed
Document available for the visibility checks.

1. Open the Board, add Text and double-click it. Type `See @` and part of an existing
   Document title. Expected: a picker appears near the caret with matching live
   pages and parent/type context; typing retains focus in the text.
2. Use Down/Up and Enter to choose a page. Expected: `@Title` replaces the query
   within the sentence, the picker closes and subsequent text is outside the link.
   Repeat with a Database and another Board.
3. Finish editing and click the mention. Expected: the original page opens through
   Orbium's app tabs. Return to the Board; the original hierarchy is unchanged.
4. Create a mention in a heading, quote/callout and list item. Expected: inline
   content, formatting and list structure remain intact. Existing links and
   `person@example.com` do not open the picker while typing.
5. Type a new `@query`, press Escape, then continue ordinary editing. Expected:
   Escape dismisses only the picker; the query remains editable. Search for a
   nonexistent title: the empty-state message appears and Enter inserts nothing.
6. Change the query rapidly and immediately press Enter. Expected: results from
   the previous query cannot be inserted. Wait for current results and select one.
7. Type `@` in another text block and press Tab, or click Inline Document. Expected:
   the mode changes and only Documents appear. Choose one. Expected: the query is
   removed and a live Document card appears to the right, aligned with the source
   block's top edge; existing text remains intact.
8. Double-click the inserted Document and change its content. Wait for its saved
   state, then open the original. Expected: the same original Document contains
   the edit. Removing the Board card leaves that Document in the explorer.
9. Open Add → Page or inline Document. Search by title using both filter choices.
   Expected: All pages includes the supported page types; Documents excludes
   Databases/Boards. Arrow selection stays visible; Enter adds the selected card.
   With more than 40 matching pages, Load more appends further results.
10. Expand Create a Document, enter a unique title and submit. Expected: one new
    Document appears beside the Board in its folder/root and one card is added.
    The form prevents duplicate submissions while creating. If a creation response
    is interrupted, reopening preserves the pending title and retry resolves the
    original request instead of creating another sibling.
11. Search for the trashed Document, a Document under a trashed folder and a page
    from another workspace. Expected: none appears in either picker. Existing
    missing-resource cards retain their ordinary placeholder behavior.
12. Wait for Saved and reload. Expected: mention links and inserted cards persist.
    Exercise Undo/Redo through insertion and query removal. Expected: text/cards
    restore without deleting the referenced Document; card insertion and query
    cleanup currently form separate Board history actions.
13. Zoom, pan and insert near the viewport edge; repeat in optional fullscreen and
    at a narrow window width. Expected: the picker remains usable inside the canvas
    viewport and keeps its normal text size. Repeat with `?boardRenderer=original`:
    mention navigation and insertion behave the same in both renderers.
14. Temporarily disconnect networking and type a fresh query. Expected: a readable
    failure appears, text remains editable and no card is inserted. Reconnect and
    change the query to retry.

## Known limits / stop gate

The quick picker shows up to eight results; narrow the title search or use Add for
full pagination and creation. Titles in text links do not automatically rename.
Native table cells use the Document table editor rather than this native writing
completion. Inline Document placement does not auto-arrange existing neighboring
cards. Visual/focus/touch behavior and runtime performance require manual review.
This remains phase 4; no later product phase was started.
