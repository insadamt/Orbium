# Statistics implementation report

Date: 2026-10-15. Status: implemented for manual review as one feature milestone.
No subsequent phase was started. No automated tests were written or run.

## Implemented

- Account/workspace Statistics page with scope selection, loading, empty,
  incomplete, retry, and Refresh states.
- Shared document/folder/database statistics dialogs through the standalone
  chart button above the page, with page/workspace/account scope selection.
  See [the button placement review](07-statistics-button-scope.md).
- Unicode writing counts, every supported block type separately, total blocks,
  checklist completion, and inline math usage outside total blocks.
- Images, Files, and combined unique upload counts and original sizes, respecting
  shared attachment reuse and the existing Library image classification.
- Stored per-document derivation for Markdown and legacy JSON, transactional
  saves, empty-document initialization, and existing import integration.
- One SQL aggregate query per summary with recursive visibility/descendant
  selection. Statistics reads do not parse content or scan the filesystem.
- Resumable, user-filterable rebuild with bounded batches, document row locks,
  failure logging, and preservation of source, revision, and edit timestamps.
- Product scope and [feature/deployment documentation](../docs/21-statistics.md).

## Commits

No commits were created. Suggested logical commits:

1. `feat(statistics): derive and persist document counts`
2. `feat(statistics): aggregate scoped content and upload totals`
3. `feat(statistics): add overview page and item dialogs`

## Persistent changes and local deployment

Applied `2026_10_15_000001_add_statistics_to_documents.php` locally. It adds
derived columns to `documents`; it creates no tables and changes no historical
migration, canonical content format, or document transfer format.

Ran `php artisan statistics:rebuild`: **13 documents rebuilt; 0 failures**.
Other installations need `php artisan migrate` followed by
`php artisan statistics:rebuild`. `--user=<id>` filters ownership and `--force`
recalculates current rows. The default skips current rows and resumes incomplete
ones. Derived changes deliberately do not update edit timestamps or revisions.

## Validation results

| Check | Actual result |
|---|---|
| `./vendor/bin/pint --test` | Passed |
| `composer run types:check` | Failed: 63 pre-existing PHPStan findings |
| `npm run types:check` | Passed |
| `npm run lint` | Passed |
| `npm run build` | Passed; large-chunk and ineffective-dynamic-import warnings |
| `git diff --check` | Passed |
| PostgreSQL `EXPLAIN` | Account and item statistics SQL accepted; data queries were not executed |

PHP analysis was compared with an isolated copy of the original HEAD source.
The baseline also reports 63 findings; the statistics change introduces no new
findings. Existing findings concern older array/model types, including database,
Trash, Library, and editor inspection code. They were left outside this feature.

Browser behavior and performance acceptance remain for the user's manual review.
No PHP, Vitest, or browser test suite was run.

## Exact manual acceptance checklist

Use a disposable workspace called **Statistics review** for changes involving
Trash, imports, or file deletion. Wait for **Saved** before comparing results.
Statistics always read saved content; press Refresh after changes.

1. **Find the feature.** Open a document, folder, or database and click the chart
   button above the page. Expect a Statistics dialog defaulting to This page.
   Select Account and then Statistics review's Workspace option: expect the
   corresponding totals without navigating away. Return to This page, then close
   and reopen: expect This page again. Expect no Statistics action in three-dot
   or item context menus. The sidebar Statistics link still opens the dedicated
   overview, defaulting to All workspaces.

2. **Empty document and basic writing.** Create an empty document and open its
   Statistics. Expect 0 words, 0 characters, and 0 blocks. Save a single plain
   paragraph containing exactly `Alpha beta`. Refresh its statistics. Expect
   **2 words, 10 characters with spaces, 9 without spaces, 1 paragraph, 1 total
   block**. Change only the title; expect those writing/block counts unchanged.
   Add extra spaces/newlines between the same words; expect normalized writing
   counts unchanged, provided they remain the same paragraph.

3. **Individual block rows.** In a fresh document, insert one each of Paragraph,
   Heading 1, Heading 2, Heading 3, bullet item, numbered item, checklist item,
   quote, callout, code, table, image, file, divider, Mermaid, and math block.
   Use slash commands and Library uploads for media. Remove leftover empty
   placeholders. Expect **16 total blocks**, one in each of those rows, with
   Heading 4–6 at zero. Add `#### Four`, `##### Five`, and `###### Six` as separate
   Markdown headings in source mode; expect each corresponding row at one and
   **19 total blocks**. Distinct headings must never be grouped together.

4. **Nested structures and styling.** Add a nested bullet item: expect one more
   bullet item and one more total block, without an extra paragraph/list-wrapper
   block. Add rows/cells to a table: expect its table count and total blocks
   unchanged. Add ordinary paragraphs inside a quote/callout: expect no extra
   paragraph blocks. Change color, direction, alignment, image width, or divider
   appearance: expect the same block counts. Mermaid must not also increase code,
   and callouts must not also increase quotes.

5. **Inline math and checklists.** Add two inline formulas inside an existing
   paragraph. Expect inline math +2 and unchanged total blocks. Add three
   checklist items, check two, and save. Expect checklist +3, checked +2,
   unchecked +1. Toggle another item and Refresh: expect checked/unchecked to
   change while checklist and total block counts remain unchanged.

6. **Shared uploads.** Upload one image and one non-image file into Library. In
   one document, insert the same Library image three times and the file once.
   Expect three image blocks, one file block, one unique image upload, one unique
   file upload, and two total uploads. The original sizes shown in Library details
   must match the two size categories. Reuse the image as a cover and icon: expect
   no additional unique upload and no additional body block.

7. **Scope and unused uploads.** Reference the same uploads in a second document
   in a nested folder. Expect folder/database/workspace upload totals to count
   each attachment ID once. Add a new unused Library upload: expect workspace and
   account upload/storage totals to increase, while document/folder/database
   reference totals remain unchanged. Add a database Files property reference:
   expect it to affect upload totals without adding a file body block or words.

8. **Hierarchy aggregation.** Create a folder containing a nested folder,
   documents, and a database with two entries. Compare individual document,
   database, folder, workspace, and account summaries. Expect database entries
   to count as documents; the selected folder/database does not count itself as
   a descendant. Move a document between folders or into a database and Refresh:
   expect only the affected scope memberships to change, with stable writing
   counts for that document.

9. **Trash and retained storage.** Trash the outer folder. Expect its complete
   subtree to disappear from main content/writing/block totals, including any
   descendants not individually marked deleted. Previously recorded item
   statistics URLs beneath that folder must return 404. Expect workspace/account
   upload storage to remain because uploads are retained in Library. Restore the
   folder and expect content totals to return. Trash a disposable workspace:
   expect its content excluded from account totals but retained uploads included
   in account storage. Permanently remove only disposable content when checking
   permanent deletion; never remove an important workspace for this review.

10. **Rebuild and compatibility.** Note edit dates/revisions for existing Markdown
    and legacy JSON documents. Run `php artisan statistics:rebuild --force` and
    expect counts to populate without content/revision/edit-date changes. Run
    the default command again: expect zero documents rebuilt when all are current.
    Export/import a disposable document package and expect imported content and
    newly derived statistics to agree. On an installation with older unprocessed
    rows, open Statistics before running rebuild: expect Updating statistics,
    hidden derived totals, available content counts, and no rebuild triggered by
    the read. Run rebuild and Refresh: expect complete totals. A malformed legacy
    row, if already available on a disposable installation, must be logged as a
    failure and remain incomplete; do not corrupt production content to test it.

11. **Saved state, failures, and stale requests.** Disconnect the browser, edit a
    disposable document, and attempt to save. After reconnecting, inspect saved
    statistics: expect the last accepted version until saving succeeds. Open the
    same document in two tabs and provoke the existing revision conflict: expect
    rejected changes not to alter statistics. In DevTools, throttle requests and
    switch workspace scopes quickly: expect no late response from an old scope
    to overwrite the selected one. Block a statistics request, press Refresh,
    then unblock and Try again: expect an error followed by recovery. Close a
    dialog while loading: expect no lingering overlay or stale reopened result.

12. **Ownership, performance, and presentation.** Sign in to another account and
    open previously copied statistics data URLs using an owned item ID from the
    first account: expect 404. Open a large document, clear DevTools Network, and
    type: expect no statistics requests caused by typing. Open Statistics:
    expect one completed summary request, with another on Refresh/scope changes
    (development StrictMode may show an extra canceled request).
    Check Light/Dark, Normal/Frosted, reduced motion, a narrow viewport, keyboard
    menu navigation, Escape dismissal, retained tabs, and split document panes.
    Expect readable surfaces, scrollable dialogs, correct scope, and usable
    editor focus after closing the dialog.

## Limits and stop gate

This version reports current saved content, not lifetime activity. Reading time,
empty-document counts, extension breakdown, new PDF/video blocks, historical
charts, and streaks are deferred. Counts are not refreshed continuously. Storage
is original attachment metadata size, not a physical disk usage audit. Word
segmentation is intentionally language-independent.

Stop here for manual review. Fix review defects within this milestone; do not
start another phase until explicitly approved.
