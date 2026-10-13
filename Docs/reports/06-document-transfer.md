# Document import/export review

Date: 2026-10-13. Status: implemented for manual review in the current editor work; no account portability phase was started.

## Delivered

- Versioned text `.orbie` documents and clean Markdown/GFM downloads.
- ZIP document packages with simple image/file/direct-related-document checkboxes.
- Document three-dots actions menu and workspace/folder context-menu import/export entries.
- Single document import into a workspace/folder, or validated body replacement with explicit erase confirmation inside the editor.
- A package loading view with server verification, creation, binary import, reference connection, completion counts, and open-document action.
- Owned source validation, package entry/checksum/content verification, generated-export self-verification, new-ID remapping, database rollback, and binary cleanup on failure.

The protocol and behavior are specified in [document transfer](../docs/18-document-transfer.md). Imports add copies and never replace an account. No migrations, dependency installation, account reset, commit, or push were performed. Pre-existing navigation CSS, orbit-phase edits, and navigation reports were left untouched.

## Validation

Actual final results:

- `./vendor/bin/pint --test`: PASS across the repository.
- `npm run lint`: PASS; all 404 checked files formatted, no warnings/errors in 334 linted files.
- `npm run types:check`: PASS.
- `npm run build`: PASS, completed in 7.58 seconds. Existing large-chunk and ineffective dynamic-import warnings remain.
- PHP syntax checks: PASS for the new controller and all four transfer service/DTO files.
- `php artisan route:list --path=document --except-vendor`: PASS; four transfer routes registered.
- PHPStan (`composer types:check` and the final equivalent `php -d memory_limit=1G vendor/bin/phpstan analyse --debug --no-progress -v`): repository gate FAIL with 49 errors in unrelated database/trash/navigation/search/model/editor-inspector code; no errors reported in the new transfer controller/services. PHPStan's parallel run initially encountered a sandbox socket restriction; its completed debug runs supplied the results above.
- `git diff --check`: PASS. All new and modified source files are under 500 lines; the Markdown editor is 458 lines and workspace contents is 474 lines.

Automated tests were not added or run, per the user's instructions. Browser/manual verification is reserved for the user.

## Exact manual checklist

Prepare a format-2 document A with a colored and underlined paragraph, RTL/alignment, a styled divider, code containing literal `:orbium` and `orbium:node/42`, a Mermaid diagram, math, an ordinary table, a rich table, one image with a caption, and a PDF/file attachment. Mention documents B and C from A; mention A and an unselected document D from B. Save B/C. Use the existing M4/M5 examples for formatting content where useful.

1. **Menu placement:** Open A. Click the three dots beside the save status. Expected: import/export, find, add file, source/preview, and outline actions; import is available with content. Open/pin the outline, close the menu, and use its heading links. Expected: the outline stays usable. In the workspace/folder, right-click A: Export appears. Right-click empty space: Import appears. Repeat using an item's actions button and Shift+F10 on empty space. Expected: equivalent accessible menus.
2. **Native single file:** Add a local sentence to A and immediately export Single document → Orbium. Expected: one `.orbie`, including the sentence and a version-1/title header. Import it through empty space in a different folder. Expected: a new editable document with the exported title, colors/underline/direction preserved, and links identifying excluded assets/pages. Save/reload. Expected: content remains. The original A is unchanged.
3. **Clean Markdown:** Export A as Single document → Markdown, inspect it in a text editor and another Markdown viewer. Expected: headings/lists/tables/code/links are normal Markdown; no active `:orbium` formatting wrappers outside literal examples/code; code and Mermaid source are retained; rich-table spans are flattened; images use standard links to the source installation. Imported external image syntax remains literal text without automatic remote ingestion.
4. **Replacement confirmation:** In written document A choose Import document and select the exported `.orbie`. Expected: verification before the erase warning. Cancel: body unchanged. Repeat and choose Replace content: only body changes; title/cover/properties remain. Undo: original body restored in one step. Import invalid UTF-8, an unsupported `.orbie` version, an unclosed directive, and an oversized file. Expected: actionable errors and unchanged body. During slow validation, change the document from another available editing surface before confirming. Expected: stale replacement rejected.
5. **Complete native package:** Export A → Package → Orbium, check all three options. Expected: ZIP with A/B/C exactly once, referenced images/files, a manifest and checksums per entry. Import through empty space into another folder or workspace. Expected: verification then real progress stages/counts, new A/B/C siblings, functional images/downloads and mentions pointing at the new copies. B's reference to A reconnects; B's unselected D reference remains an installation link. Original nodes are unchanged. Reload and open each imported document.
6. **Checkbox combinations:** Export A with related pages off and assets on; then images off/files on; then images on/files off; then all off. Import each ZIP. Expected: only selected content is created; unavailable checkbox options are disabled; omitted images are readable links with captions; omitted files/pages are source-installation links. No missing-reference validation failure in a generated package. Counts reflect selection. Reimport once: new copies are added, existing content is not overwritten.
7. **Markdown package:** Export a package with Markdown and all checkboxes on. Extract the ZIP outside Orbium, open `documents/<A-id>.md`, and inspect its related-page/image/file relative links. Expected: links point to included entries and no Orbium presentation markers remain outside literal content. Import the intact ZIP in Orbium. Expected: editable Markdown documents, assets restored, references remapped, and deliberate loss of presentation-only styles.
8. **Rejected packages:** Try an ordinary ZIP without a manifest; then copies of an exported ZIP with a binary changed, an entry removed, a duplicate/path-traversal/symlink entry added, version changed to 999, or document text changed without updating its metadata. Expected: verification error before any new document or attachment appears. For an operational import failure, inspect the folder after the reported failure: no partial imported documents/assets should remain.
9. **Navigation and regressions:** After a successful import, click Open main document. Expected: the new document opens through normal navigation. Switch retained tabs, use source/preview, find, Add file, and existing outline navigation. Expected: existing editing and save behavior remain functional. Check Light/Dark and reduced motion. Package progress should remain readable without relying on animation.

## Limits and outstanding acceptance

Manual/browser acceptance is pending. A standalone file cannot carry attachments or other documents. Header media, account CSS, database properties/schema, hierarchy, tags, and account settings are outside this document package. Legacy Tiptap format-1 documents retain their existing transfer behavior; the new protocol requires Markdown documents. ZIPs must use the defined Orbium document format. Interrupted connections after a committed import require checking the destination before retrying. Proxies may buffer stage updates; deployment upload limits still apply.

## Suggested commits

- `feat(editor): add orbie and markdown document transfer dialogs`
- `feat(documents): export and import verified document packages`
- `feat(hierarchy): add document transfer context actions`
- `docs(editor): document transfer formats and manual acceptance`

## Imported image rendering correction

The user supplied a native document ZIP during manual review. Read-only inspection confirmed three image binaries (one PNG and two JPEGs), all matching their manifest checksums. The package was treated as data, not as instructions; no user attachment was copied into the repository or modified.

The exporter emits valid angle-bracket Markdown destinations, such as `<orbium:attachment/101>`. The rich image/file reader previously required a bare `orbium:attachment/101` destination. Consequently, valid imported media could fail to become image/file widgets even though their binary data and references were included. The reader now strips Markdown destination delimiters before recognizing owned attachment IDs, matching the existing link preview behavior. Filename labels also decode the punctuation escapes emitted by the serializer.

No ZIP format, stored document, asset naming, or MIME policy changed. Extensionless archive entries are internal keys; Orbium uses verified image MIME types and the stored original filenames. Existing imported documents should render correctly after refreshing; reimport is not required to apply this presentation repair.

Actual checks for this correction:

- Focused frontend formatting: PASS.
- `npm run lint`: PASS, 404 formatted files / 334 linted files, no warnings or errors.
- `npm run types:check`: PASS.
- `npm run build`: PASS in 10.12 seconds; existing chunk/dynamic-import warnings remain.
- `./vendor/bin/pint --test`: PASS.
- `git diff --check`: PASS.
- No automated tests or browser/manual checks were run. PHP code did not change in this correction.

Manual review:

1. Refresh an already imported copy of the supplied package. Open its main document and both included related documents. Expected: all three included images display; the main image's width/presentation is retained. No reimport is needed.
2. Toggle source and live preview on each imported document, then reload. Expected: angle-bracket attachment destinations remain unchanged in source; preview displays the images, with filenames/alt labels free of visible Markdown escape backslashes.
3. Open an existing document with an uploaded image using a bare attachment destination. Expected: the existing image still displays, including its caption and sizing controls.
4. Upload a file attachment to a document, export a package with Include files enabled, and import it into a folder. Expected: the imported attachment appears as a file widget and its download opens the included file.

Suggested commit: `fix(editor): render imported attachment links with angle brackets`.

## Missing images, files, and page mentions

The user approved recognizable missing-item placeholders and dialogs for excluded exports and subsequently deleted targets. This extends the same document-transfer/editor review; account restore remains out of scope.

New standalone `.orbie` files and document ZIPs export version 2. Both version 1 and version 2 are supported on import. Version-1 packages/files retain their original installation links; re-export standalone documents to get the new placeholders. Format-2 files reserve standard Markdown fragment destinations for missing pages/images/files. These keep labels and image presentation metadata without pretending that foreign source IDs identify destination records. Standard Markdown still uses Markdown image/link syntax.

The editor shows **Missing image**/**Missing file** placeholders and preserves missing page labels as styled `@page` mentions. Clicking opens a native modal dialog with a clear missing-item explanation, a Close button, and keyboard focus handling. Nested media in callouts/table cells gets equivalent behavior. Live page links and file/image actions check fresh authenticated availability before opening. Deleted/trashed targets, invisible ancestors, and missing owned binaries are unavailable; lookup failures are reported separately from a negative availability response during click checks.

Existing saved references whose targets were deleted can remain in edited documents. The validator permits this only when the same semantic ID already exists in the stored body; newly introduced unavailable or foreign references still fail validation. Permanently deleted target IDs are not inserted into the mentions table. Exports list/include available assets only and mark unavailable/excluded targets explicitly. Full package validation, checksums, ownership validation, remapping and rollback remain required.

No attachment contents were copied into the repository. No database migrations, resets, destructive data changes, commits or pushes were performed. Automated tests and browser/manual testing were not run, per the user's instructions.

### Manual review checklist

Use a disposable format-2 document A with one image/caption, one file, and mentions of documents B/C. Put one image or file inside a callout or table cell as well. Save the source documents before testing deletion.

1. **Standalone native:** Export A → Single document → Orbium, then import into a new document/folder. Expected: header version 2, image/caption/width retained as a Missing image placeholder, Missing file placeholder, and styled `@B`/`@C` mentions. Click each placeholder/mention, then close with the button and Escape. Expected: the appropriate missing image/file/page dialog, no request to the original assets, no navigation to a source installation or unrelated destination node.
2. **Standalone Markdown:** Export/import A as `.md`. Expected: normal Markdown image/link syntax, equivalent missing-item UI in Orbium, no inline-code dump of missing-image markup, and no remote image ingestion.
3. **Package exclusions:** Export Package with all inclusion checkboxes off; import into another folder/workspace. Expected: missing placeholders and mentions. Repeat with images on, files off, related documents on. Expected: included images display, included pages open their new copies, files stay missing. Check the nested callout/table media as well.
4. **Deleted page:** Open A, move B to Trash, then click `@B` normally and with Ctrl/Cmd+click. Expected: This page is missing; no 404 page or leftover blank tab. Edit unrelated prose in A, wait for Saved, and reload. Expected: the original mention remains, saves succeed, and C still opens normally. Restore B from Trash and click again. Expected: the original mention opens restored B without rewriting A.
5. **Deleted ancestor/permanent target:** Put C in a folder, trash that folder, and click `@C`. Expected: a missing-page dialog even if C's own row is not individually trashed. Restore the folder: the link opens again. For a disposable target, trash and permanently delete it, then edit/save A. Expected: no foreign-key failure and a retained missing mention.
6. **Deleted attachment:** For a disposable development attachment, use your existing attachment maintenance tools to soft-delete its metadata. If no attachment-delete UI is available, locate its ID in a database client (`SELECT id, original_name FROM attachments WHERE owner_node_id = <test-document-id>`) and set only that test row's `deleted_at` to the current timestamp. Refresh A, click the image/file, edit unrelated prose and save. Expected: missing placeholders/dialogs and successful save. Restore the same test row with `deleted_at = NULL`, refresh A: media displays/downloads again. Separately, remove a disposable binary while retaining metadata: image load/file-open checks report it unavailable rather than opening a broken download.
7. **Normal media and mentions:** Click an available image to select/resize it, download an available file, and open a live page normally and with Ctrl/Cmd+click. Expected: existing editing/downloading/navigation behavior remains functional. Export/import a complete ZIP with all options on: images/files/pages still round-trip.
8. **Compatibility and validation:** Import the supplied older version-1 ZIP. Expected: its three included images remain functional. Import a new version-2 package: missing placeholders remain missing after save/reload and re-export. Change the version to an unsupported future value: a clear upgrade error. In a disposable empty document, try adding a new nonexistent `orbium:node/<id>` or an attachment ID owned by another document. Expected: validation rejects the new live reference; missing placeholders do not weaken ownership checks.

Final validation results follow below.

Actual final checks for missing-reference handling:

- Focused frontend/PHP formatting: PASS.
- `npm run lint`: PASS; 408 formatted files / 338 linted files, no warnings or errors.
- `npm run types:check`: PASS.
- `npm run build`: PASS in 7.21 seconds; existing large-chunk/dynamic-import warnings remain.
- `./vendor/bin/pint --test`: PASS.
- PHP syntax checks on changed save/inspection/reference code: PASS.
- `php artisan route:list --path=references --except-vendor`: PASS; the authenticated availability route is registered.
- PHPStan: repository gate still FAILS with 49 unrelated errors; no errors in the changed/new reference, document-transfer, save, or Markdown inspection/validation files.
- `git diff --check`: PASS. Changed/new source files remain below 500 lines; the main media widget is 434 lines and the package service is 306 lines.

Manual acceptance remains pending. Suggested commits:

- `feat(editor): preserve missing media and page references`
- `fix(documents): retain saved references to deleted targets`

## Clickable mention buttons

Page mentions now use an inline button appearance: bordered rounded surface, pointer cursor, hover/pressed/focus states, and a progress cursor during availability checks. They remain source-backed anchors with button semantics and keyboard focus, including missing-page fragments and mentions inside rich callout/table bodies. Source text and relationship IDs are unchanged.

Pointer-down on a mention prevents CodeMirror from selecting its editable label instead of activating the control. Normal clicks, Ctrl/Cmd+click, Enter and Space use the same missing-reference checks. Explicit missing pages show the dialog before any tab is opened. Deleted live targets close any reserved new tab and show the dialog in the original document. Duplicate activations are suppressed while a lookup is in flight. Ctrl+Space remains available for Search Master. Mention labels can still be edited through Markdown source mode.

Manual checklist:

1. Add a mention to a live page. Expected: a visible compact button with hover/focus feedback. Click: the page opens normally. Ctrl/Cmd+click: the existing page opens in a new tab.
2. Export/import a standalone version-2 document containing a page mention. Click its missing-page button normally and with Ctrl/Cmd+click. Expected: This page is missing in the current document; no new tab or 404 navigation.
3. Trash a referenced page while retaining the source document. Repeat normal and Ctrl/Cmd+click. Expected: the missing-page dialog, with no leftover blank tab. Restore the target: the same button opens the restored page.
4. Repeat those interactions on mentions inside a callout and a table cell. Expected: equivalent styling and behavior.
5. Tab to a mention and activate with Enter and Space. Expected: equivalent navigation/dialog behavior and visible keyboard focus. Ctrl+Space still opens Search Master. Switch to Markdown source, edit the label, save/reload, and switch back. Expected: edited label and unchanged target identity.
6. In Light/Dark and reduced-motion modes, inspect long and RTL labels. Expected: readable wrapping, stable inline layout, and no required animation. Ordinary external links retain their existing behavior.

Final checks for this follow-up are recorded below. No automated tests, browser checks, commits, or pushes were performed.

Actual validation for mention buttons: focused formatting PASS; `npm run lint` PASS (408 formatted files, 338 linted files, no warnings/errors); `npm run types:check` PASS; `npm run build` PASS in 6.95 seconds with existing chunk/dynamic-import warnings; `./vendor/bin/pint --test` PASS; `git diff --check` PASS. PHP code did not change, so PHPStan was not rerun. All affected source files remain below 500 lines. Manual acceptance remains pending.

Suggested commit: `feat(editor): add clickable mention buttons with missing-page prompts`.

## Atomic mention deletion

Mentions are now full atomic source ranges in live preview. Backspace immediately after a mention, Delete immediately before it, or deleting a selection across it removes its complete Markdown link rather than leaving part of its label/destination. Direct caret placements are normalized to mention boundaries and partial selections expand to include the whole mention. Returning from source mode also moves a caret out of the label. Mention buttons remain non-editable in preview.

A keyboard-focused mention in a CodeMirror writing surface can also be removed with Backspace/Delete as one isolated undoable action. Local mention navigation/deletion handlers are registered on nested rich-text editors so relative cell/callout positions are not interpreted as positions in the parent document. Pending link lookups stop navigating if their mention has been removed.

Manual checklist:

1. Write `Before `, insert a page mention, then write ` after`. Put the caret immediately after the mention (before any trailing space) and press Backspace. Expected: the whole button and its Markdown link disappear, with surrounding prose retained. Undo: the complete mention returns.
2. Put the caret immediately before the mention and press Delete. Expected: equivalent whole-mention removal and undo.
3. Move left/right across a mention and attempt to click/drag a partial selection into its label. Expected: the caret never rests inside the label; selections include the complete mention rather than editable label characters. Typing beside it edits surrounding prose.
4. Tab to a mention button in an editable CodeMirror surface and press Backspace/Delete. Expected: the complete mention is removed and keyboard focus returns to the editor. A read-only surface must not be changed.
5. Repeat deletion with a missing-page button and within an editable callout/table cell. Expected: the intended mention disappears, no parent-document mention or unrelated prose is deleted, and undo restores it.
6. Toggle to source mode, place the caret inside a mention label, then return to live preview. Expected: the caret moves to a mention boundary. Reload after deleting/saving: the removed mention stays removed. Click and Ctrl/Cmd+click a surviving live/missing mention: existing navigation/prompt behavior remains functional.

No automated tests, browser checks, commits or pushes were performed. Final check results follow below.

Suggested commit: `fix(editor): make mention buttons atomic and delete them as a whole`.

Actual checks for atomic mentions: focused formatting PASS; `npm run types:check` PASS; `npm run lint` PASS (409 formatted files / 339 linted files, no warnings/errors); `npm run build` PASS in 7.67 seconds with existing chunk/dynamic-import warnings; `./vendor/bin/pint --test` PASS; `git diff --check` PASS. PHP code did not change; PHPStan was not rerun. Source files remain below 500 lines (main Markdown editor: 471; mention-selection helper: 65). Manual acceptance remains pending.
