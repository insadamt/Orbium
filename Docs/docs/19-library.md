# Workspace Library

Approved 2026-10-13 during the current review; no phase advancement.

Library provides a workspace-owned collection of existing uploads and new files. Open it through the Library button beside Settings or the workspace sidebar. It is separate from the node hierarchy.

## First version

- Browse uploaded files and images, including earlier uploads and files whose original page was removed.
- Search filenames, filter images/files, and sort newest, name, or largest first.
- Show image thumbnails, filename, MIME type, size, upload date, storage availability, and saved usage links.
- Upload, preview, download, rename, and permanently delete unused files.
- Select up to 100 files and review them together before deletion. Review fetches current saved usage; any used file blocks permanent deletion of the entire selection.
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


## Gallery and details review (approved 2026-10-13)

Library now uses borderless natural masonry cards with compact filenames and a three-dot menu. The menu offers View details, Download, Rename, Select/Deselect, and Delete review. Image proportions are preserved; narrow containers use a compact two-column layout where space allows. Touch keeps menus visible and increases control targets. Keyboard focus uses background/text cues in accordance with the existing focus-style review.

The toolbar groups filename search, All/Images/Files filters, sorting, refresh, selection mode, and Upload. Metadata and usage lists have moved out of cards into authenticated detail pages at `/workspaces/{workspace}/library/items/{attachment}`. Detail pages offer the original image preview, fit/zoom controls, file information, usage links, protected deletion, Back to Library, and previous/next navigation within the current filtered sort order. Unsupported previews show a file tile and download action.

Rename and delete use centered dialogs. Rename updates loaded cards without clearing selection or replacing the gallery with a loader. Delete review checks usage before enabling permanent deletion; the final write rechecks usage independently under the existing workspace lock. Successful deletion removes selected cards and revalidates loaded pages to avoid skipping items on the next Load more request.

Reuse pickers use the same masonry cards with one selected file and an explicit Use image/file confirmation. They retain a separate Upload a new image/file action and exclude management menus.

Filename/type/sort filters and gallery scroll position are stored per account/workspace in browser session storage. Returning from details and refresh restore loaded pages and scroll after masonry measurements settle. Restoration is capped at 20 pages (960 files); subsequent browsing can load additional pages. Filters travel in detail-page URLs; clearing browser session storage removes the remembered position. User scrolling or keyboard/pointer input cancels pending scroll restoration.

The listing endpoint now returns paginated summaries (48 files per page) and does not scan saved document content. Detailed usage is fetched for a detail page or deletion review. Images reserve space using header dimensions and load lazily. Thumbnail requests authorize workspace ownership before using local cached derivatives; responses explicitly use private caching and revalidation. Where GD is available, eligible large static images are resized to at most 640px wide and 1600px tall. Small images, GIFs, large/unsupported decodes, JPEGs with unknown/non-default EXIF orientation, and installations without GD fall back to originals. JPEG orientation-aware dimensions require PHP EXIF support. Original uploads remain unchanged. Preview cache entries are removed alongside permanent file/workspace deletion and excluded from portable content.

No migrations, new packages, or attachment/reference format changes were introduced by this UI review.

## Background and viewport review (2026-10-13)

Bulk action controls are temporarily hidden following the user's review: the Library has no Select/Done toolbar control, card Select/Deselect action, or bulk action bar. Single-file rename and protected deletion remain available. Reuse pickers retain single selection and Use image/file. Right-clicking a Library card (or pressing Shift+F10/the Context Menu key while focused) opens View details, Download, Rename, and Delete review beside the pointer/card. The menu stays inside the viewport and supports keyboard navigation, Escape, and outside-click dismissal. The existing three-dot menu remains available for touch and keyboard users. Server-side bulk deletion validation remains implemented.

Image cards in the Library gallery and reuse pickers omit visible filename captions following the user's review. Non-image cards retain filenames. Image filenames remain in accessible labels, image alternative text, detail pages, and management dialogs.

Library and file details expose the app's existing appearance background, including the default subtle gradients and selected image/animated backgrounds. Details use the dynamic viewport height with space reserved for the measured floating navigation. The preview and metadata panel fill the remaining space; the page itself does not scroll. Long metadata/usage lists and zoomed previews scroll inside their respective panels. Narrow layouts stack the preview and metadata within the same viewport. Frosted surfaces retain translucent preview and metadata panels.
