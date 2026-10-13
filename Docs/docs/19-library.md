# Workspace Library

Approved 2026-10-13 during the current review; no phase advancement.

Library provides a workspace-owned collection of existing uploads and new files. Open it through the Library button beside Settings or the workspace sidebar. It is separate from the node hierarchy.

## First version

- Browse uploaded files and images, including earlier uploads and files whose original page was removed.
- Search filenames, filter images/files, and sort newest, name, or largest first.
- Show image thumbnails, filename, MIME type, size, upload date, storage availability, and saved usage links.
- Upload, preview, download, rename, and permanently delete unused files.
- Select up to 100 files and delete them together after confirmation. Selection includes used files, but deletion is disabled until only unused files remain.
- Reuse an existing upload from document image/file insertion, document/folder/database cover and icon menus, and database Files property choices. In Markdown, slash image/file commands open a Library picker with an Upload a new image/file action. Drag/drop and paste uploads retain their existing flow.

Reuse references the original attachment ID and binary. It does not copy the file or move its original upload provenance. Ownership and authorization are workspace scoped. `owner_node_id` records optional upload provenance, not an exclusive access boundary. Renaming changes the Library name/download filename; persisted captions and Markdown labels remain as written.

Page media menus retain Change cover/icon for uploading and cropping, and add Choose from Library. Reused covers use the standard 11:3 presentation; existing cropped binaries are reused as stored. Choosing an existing image does not open a crop editor or create another binary. Changing/resetting one page's media reference does not change other pages' references.

## Deletion and persistence

Usage includes canonical Markdown, legacy editor content, page covers/icons, and database Files property values. Trashed nodes and descendants of trashed containers still count. Upload provenance alone does not count as usage. Unsaved editor drafts are not usage; wait for Saved before managing files.

Library deletion rechecks all selected IDs and saved usage on the server. Any used, missing, or foreign-workspace selection rejects the whole request. Workspace mutation requests share a row lock so saving references and deleting unused files cannot race. Filesystem cleanup runs after commit; failures are logged for administrator cleanup.

Deleting or permanently removing a page retains its uploads in Library. Permanently deleting a workspace removes its Library with the workspace. No schema migration is needed.

## Transfer compatibility

New document ZIP packages use manifest version 3 for shared attachment references; binaries appear once even when several included documents reference them. Native document headers remain version 2. Version-1/2 ZIP readers retain their original per-document ownership validation. Older Orbium versions reject version-3 packages with the existing upgrade message. A version-3 asset's owner is an included document used for import provenance, not an exclusive reference boundary.

Whole-account portability and inclusion of unused Library uploads remain governed by the separate portability phase. Document ZIP exports include selected referenced files only.

Favorites, duplicate detection, collections/tags, and other bulk actions are outside this first version.
