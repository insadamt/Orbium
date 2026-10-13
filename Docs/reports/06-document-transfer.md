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
