# Database inline adding report

## Implemented

- Added Inline adding to Table view settings, disabled by default and persisted per database.
- Enabled Table creation stays on the database and focuses a blank title input.
- Enter or blur saves the title through the existing node update endpoint.
- Escape or an empty title keeps the new document as Untitled.
- Temporarily include the new document even if search or filters exclude it; after naming, normal filtering/sorting applies.
- Existing row Rename and Open document actions remain available.
- Gallery creation continues opening the document.
- Creation failures display an error and release the busy state.

## Persistence

Optional boolean `inline_adding` in existing Table view config. No migration or editor format change. Missing preferences preserve the existing behavior.

## Validation

- Frontend formatting: PASS.
- npm run types:check: PASS.
- npm run lint: PASS after correcting an unhandled promise warning.
- npm run build: PASS with chunk size and mixed static/dynamic import warnings.
- PHP Pint for DatabaseController: PASS.
- PHP syntax check for DatabaseController: PASS.
- git diff --check: PASS.
- Automated tests were not written or run, per user instructions.
- Manual interaction verification is pending user review.

## Manual checklist

1. Open a database in Table, open View settings, enable Inline adding, and Apply changes. Reload and reopen settings. Expected: the checkbox remains enabled.
2. Click the toolbar New button. Expected: remain on the database; exactly one row is added and its title input receives focus with Untitled as placeholder.
3. Type a title and press Enter. Expected: the title saves inline; reload preserves it. Click its title. Expected: the normal document editor opens with that title.
4. Return to Table and click New document below the rows. Type a title and click another cell. Expected: the title saves on blur and properties can be edited normally.
5. Create another row, type a title, and press Escape. Expected: the created row remains Untitled. Use its options > Rename and save a title. Expected: renaming still works after cancellation.
6. Add an active filter or title search that excludes Untitled, then create a document. Expected: the new row remains visible during naming; after saving it follows the active search, filters, and sort order. Clear them to find excluded rows.
7. Disable Inline adding and Apply changes, then create a document. Expected: the editor opens immediately. Switch to Gallery and create a document. Expected: the editor opens regardless of the Table preference.
8. Open another database's Table settings. Expected: its preference is independent.

## Commits

No commit created. Suggested message: `feat(databases): add persistent inline document creation setting`.

## Scope

Focused database change only. Existing unrelated working-tree changes were preserved. Stop for manual review.
