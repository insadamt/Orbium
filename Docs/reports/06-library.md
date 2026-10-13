# Workspace Library implementation report

Date: 2026-10-13. User-approved addition during the current review; no phase advancement.

## Result

Implemented a workspace Library with thumbnails and file details, filename search, image/file filtering, sorting, upload, preview/download, rename, saved usage links, single unused-file deletion, and confirmed bulk deletion of up to 100 unused files.

- Open Library using the new button beside Settings or the workspace sidebar.
- Document image/file commands offer Choose from Library and Upload a new image/file. Legacy editor commands also support reuse. Drag/drop and paste retain upload behavior.
- Document, folder, and database cover/icon menus offer Choose from Library; existing Change actions retain upload/crop behavior.
- Database Files properties offer files from the workspace Library.
- Existing uploads appear without migration or duplication. Reuse preserves the attachment ID and binary.
- Removing one reference does not delete the file. Permanent page deletion retains uploads in Library; permanent workspace deletion still removes workspace files.
- Server usage checks include Markdown, legacy body content, covers, icons, database file values, and content in Trash. A mixed bulk request fails completely if any file is still used. Workspace write locks coordinate reference saves and Library deletion.
- New document ZIP manifests use version 3 for shared assets, with each binary emitted once. Imports preserve shared references. Versions 1/2 remain supported with their original ownership rules. Native `.orbie` headers remain version 2.
- Binary deletion happens after database commit. Cleanup failures are logged for administrator attention.

Documentation: `Docs/docs/19-library.md`, approved scope/domain/editor updates, and an appended transfer compatibility section. Pre-existing AI skills/settings edits were preserved.

## Actual checks

- `./vendor/bin/pint --test`: passed.
- PHP syntax checks for every changed PHP source: passed.
- `npm run types:check`: passed. Log: `/tmp/orbium-library-types.log`.
- `npm run lint`: passed; all 421 files formatted and no warnings/errors in 346 linted files. Log: `/tmp/orbium-library-lint.log`.
- `npm run build`: passed. Existing large-chunk and ineffective-dynamic-import warnings remain. Log: `/tmp/orbium-library-build.log`.
- `php artisan route:list --path=library`: passed; six Library routes registered.
- `git diff --check`: passed.
- No automated tests written or run, per user instructions. Browser/manual acceptance has not been performed; the checklist below is for the user.

## Exact manual checklist

Use disposable files and two documents, A and B, in one workspace. Wait for the editor's Saved status after content changes.

1. Open the workspace and click Library beside Settings. Expected: the workspace name appears, earlier uploaded files are listed, images have thumbnails, and details include size/type/date. Try a workspace with no uploads: an empty state appears. Refresh the browser: Library stays accessible and its tab title is Library.
2. Upload a PNG and a PDF from Library. Expected: both appear after upload with correct details. Preview the PNG and download both files. Expected: the image opens safely and downloads use their filenames. Cancel the file picker: no change.
3. Search for a filename, choose Images and Files filters, and try every sort option. Expected: matching items and order update correctly; a nonexistent filename shows No matching files. Clear the search and filters to recover the complete collection.
4. Open document A. Type `/image`, choose the uploaded PNG from Library, and wait for Saved. Insert the PDF through `/file`. Repeat in B using the same files. Expected: both documents render correctly after refresh, Library still has one entry per original file, and each entry shows A and B in its usage. Click a usage link: the correct page opens.
5. In a document, folder, and database, use cover Edit → Choose from Library and icon Edit → Choose from Library. Expected: only supported images appear; the chosen image persists after refresh. Reused covers use 11:3. Reset media on one page: other pages retain their images. Try Change cover/icon: the existing upload/crop dialog still works.
6. Create a Files property on a database, choose an existing Library file on a row, and save. Expected: the value persists and Library counts that document as a use. Clear the property: that use disappears after Library Refresh.
7. Rename the PNG in Library and refresh. Expected: the new name persists and downloads use it; already-written Markdown labels/captions remain unchanged. Cancel rename: no change. Try an empty name or `/` in the name: saving is disabled or shows validation feedback.
8. Select a used file and an unused upload. Expected: Delete selected is disabled and explains that the selection contains a used file. Single Delete is disabled for the used file. Selecting only unused uploads enables deletion.
9. Upload two disposable unused files, select both, and click Delete selected. Expected: confirmation lists the files. Cancel: both remain. Confirm again: both disappear, including after refresh; their old preview/download URLs no longer serve them. Repeat with a single unused file.
10. Open Library in two browser windows. In the first, select two unused files and open deletion confirmation. In the second, insert one of them into a document and wait for Saved. Confirm deletion in the first window. Expected: the server rejects the entire request with a readable usage message; both files remain after Refresh.
11. Trash A and then trash a folder containing B. Expected: Library still counts their saved usage and marks usage links as Trash. Restore them: files still render. Permanently delete A through Trash while B still uses its files. Expected: B remains intact and the files remain in Library. Remove all remaining uses, wait for Saved, and Refresh Library: the files become eligible for deletion.
12. Switch workspaces and open Library. Expected: only that workspace's files appear; pickers cannot select files from the first workspace. Log in as a different user and paste the first user's Library URL and file URL. Expected: access is denied; no file metadata or content is exposed.
13. Have A mention B and have both reference the same PNG/PDF. Export a Whole package containing both documents and their files. Import it into a disposable workspace. Expected: both documents/files render, and the imported Library has one copy of each included binary with both documents listed as users. Repeat with an older version-1/2 package: supported packages still import. Older Orbium versions should reject a newly exported version-3 ZIP with an upgrade message.
14. Use Tab/Enter/Escape to open Library pickers, select a file, cancel, and return to writing. Expected: focus remains usable and Escape leaves content unchanged. Check narrow windows plus light/dark appearances: controls remain readable and file cards do not overflow.

## Limits

- Library is workspace scoped; cross-workspace reuse is excluded.
- Saved references determine usage. Unsaved drafts do not reserve files; wait for Saved before deletion.
- Reused cover binaries use 11:3 presentation without a new crop editor; Change cover retains upload/crop support.
- Library lists the current workspace collection and inspects saved content on demand; server pagination and a persisted usage index are not implemented.
- Whole-account archive work remains in its separate portability scope. Document ZIP exports include selected referenced files, not all unused Library uploads.
- Favorites, duplicate detection, collections/tags, and bulk rename/download were not added.

## Commit suggestions

No commits created.

- `feat(library): add workspace upload management and bulk deletion`
- `feat(media): reuse library attachments across workspace pages`
- `feat(transfer): preserve shared library assets in document packages`
