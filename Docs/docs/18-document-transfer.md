# Document import and export

Approved by the user on 2026-10-13. This is the document-transfer extension to the current CodeMirror editor review. It does not implement Phase 6 account snapshot replacement.

## Entry points

- Document editor: one **Document actions** (three dots) menu contains import, export, find, add file, source/preview, and the document outline action. The outline rail remains available as navigation.
- Workspace/folder contents: right-click a document for **Export…**; right-click empty space for **Import…**. Keyboard users can use an item's actions button or Shift+F10 on empty space.
- Import in a document accepts a single text document, even when the document already contains writing. Package import belongs to the workspace/folder destination.

## Single documents

The 2026-10-14 approved [Word/PDF export extension](20-office-document-export.md) adds `.docx` and direct `.pdf` downloads to Single document. These formats use a clean document layout shared through DOCX generation and server-side LibreOffice conversion. They do not use Orbium editor themes and are not offered as package/import formats.

Settings → **AI skills** provides the `create-orbium-documents` skill bundle for external assistants to generate version-2 `.orbie` files, document ZIP packages, and separate editor CSS themes. **Download skill ZIP** downloads a folder containing `SKILL.md`, usage/block/color/effect references, an importable `.orbie` showcase, and a CSS starter theme. The authenticated download assembles the current maintained files from `resources/skills/create-orbium-documents/` and deletes its temporary archive after sending. The page presents one primary ZIP download, a concise contents overview, three setup steps, an example prompt, and an Editor styles link for the included theme. Copy controls and the raw instruction field were removed during the UI review. The ZIP is installed in the assistant, not Orbium's Whole package importer. Import its showcase through Single document and its CSS through Editor styles. Documentation covers all supported native body metadata, preset Light/Dark colors, exact CSS selectors/properties, supported static effects, Appearance settings, package schema/checksums/limits, and manual usage. This does not connect an AI service or import generated files automatically.

`.orbie` is UTF-8 text, with a versioned header and the Orbium Markdown body dialect. New files use version 2; version-1 files remain readable:

```text
<!-- orbium-document {"version":2,"title":"Example"} -->
```

It preserves supported Orbium body presentation metadata. Serialization normalizes source spelling; it does not mutate the current editor content. Single files do not contain binary assets or other pages. Version-2 single exports retain image/file placeholders and page-mention labels using explicit missing-reference destinations. Images keep their captions and presentation metadata in `.orbie`. Their missing targets are not fetched or connected to unrelated destination IDs. Standard `.md` uses the same missing-reference fragments with ordinary Markdown image/link syntax. Version-1 exports retain their original installation-link behavior; re-export to obtain the new placeholders.

`.md` uses standard Markdown/GFM. Color, underline, explicit direction/alignment, divider styling, image sizing and rich-table spans are omitted or flattened into readable equivalents. Rich cell content uses `<br>` separators in GFM tables. Mermaid fences and math source remain; rendering math/Mermaid depends on the receiving Markdown application. Code is opaque during conversion. No account CSS theme is included.

Workspace imports create a new document: `.orbie` uses its header title, `.md` uses the filename. Editor imports replace only body content and keep the document's existing title, header, and database properties. Validated non-empty replacements require **Replace content** confirmation. Cancel, invalid files, and edits during validation retain the current content. A CodeMirror replacement is one undoable editor transaction and uses normal autosave.

External image syntax on single-file import remains literal text, following the existing policy against automatic remote image ingestion. Standalone attachment IDs cannot establish identity across installations; use a package for owned assets and relationships.

## Packages

Export **Package** uses three checkboxes:

- Include images: on by default.
- Include files: on by default.
- Include related documents: off by default.

Counts update with the selected documents. Zero-count choices are disabled. Related documents are directly mentioned, visible, supported Markdown documents in the same workspace, excluding the main document itself; they are not recursively expanded. The main document may use current unsaved editor content. Related pages use their saved contents captured when the dialog loads.

Current ZIP format 2 (format 1 remains supported):

```text
manifest.json
documents/<source-id>.orbie OR documents/<source-id>.md
assets/<source-attachment-id>
```

The manifest has `kind: orbium-document-package`, `version: 2`, ordered `documents`, and `assets`. Each document declares `id`, `title`, `source`, `path`, and `sha256`. `source` is the validated import representation with semantic `orbium:` relationship keys. Each asset declares `id`, `owner`, `name`, `path`, and `sha256`. Source IDs are package-local relationship keys, never destination IDs.

Native `.orbie` document entries retain package-local relationship keys. Markdown entries use relative links to documents/assets for use outside Orbium. Import verifies that each entry's parsed content agrees with its manifest representation after resolving those destinations. The first document is the main document. In format 2, excluded references use explicit missing destinations. Included references are remapped as before. Format-1 packages remain readable with their original installation links; their shape and reference interpretation are not rewritten.

Packages include referenced body images/files only. Covers, icons, themes, database schemas/properties, hierarchy, tags, and account settings are not transferred. A document package is not an account archive or arbitrary folder ZIP importer.

## Import lifecycle

Select **Whole package**, choose `.zip`, then import into the current workspace root or folder. The loading view displays actual server stages and counts:

1. Verifying package.
2. Creating documents.
3. Importing images and files.
4. Connecting references.
5. Import complete, with counts and **Open main document**.

Verification rejects missing manifests, unsupported versions, unsafe paths, symbolic links, duplicates, missing/undeclared entries, damaged entries/checksums, invalid body syntax, mismatched file/manifest content, missing references, and unsupported owned-image content. It completes before creation. Import verifies the upload again before mutation; it does not rely on an earlier client verification result.

Database creation/remapping/saves use one transaction. Assets receive generated storage keys and stream from verified entries; failure removes newly written binaries and rolls back new database records. The original destination content is never replaced by package import. Reimport intentionally creates another copy. A lost connection after commit may leave a successful import without client confirmation; inspect the destination before retrying.

Limits: 100 MiB compressed upload / total declared expanded entries; 500 entries; 101 documents; 398 assets; 8 MiB manifest; document source 2 MiB and existing parser complexity limits; per-asset expanded size 100 MiB. Effective limits may also depend on deployment PHP/proxy configuration. No filesystem paths or authentication secrets are exported.

Legacy format-1 Tiptap documents retain their existing editor and convenience Markdown transfer. The new transfer dialog/export protocol requires format-2 Markdown documents; it does not silently convert legacy stored content or remove Tiptap. Full account restore remains separately gated.

## Missing references

Format-2 exports reserve these standard Markdown fragment destinations:

```text
#orbium-missing-page-<source-id>
#orbium-missing-image-<source-id>
#orbium-missing-file-<source-id>
```

The numeric suffix is an opaque source key, not a destination identity. Missing references are not entered into mentions/attachment indexes and are not remapped to coincidentally equal destination IDs. Only image placeholders may appear inside image presentation wrappers. The live preview renders missing images/files as labeled buttons and missing pages as normal `@page` mentions. Clicking opens a keyboard-accessible dialog explaining that the item was excluded, deleted, or is no longer available. No automatic remote image ingestion is added.

Live page and attachment links are checked against an authenticated, uncached, workspace-scoped availability endpoint before opening. Trashed targets, targets under trashed containers, unavailable binaries, and inaccessible references result in a missing-item dialog. Unavailable metadata/image loads show media placeholders, including nested media in callouts and table cells. Click-time network failures report that the item could not be checked rather than treating a failed check as a confirmed deletion. Restoring a page allows its original mention to open again without rewriting source; refresh restored media previews.

Saving retains existing references whose targets were deleted, but only if their IDs already occur semantically in the stored document. Newly introduced unavailable/foreign IDs are still rejected. Permanently removed mention targets are not reinserted into the mention index. Exports turn deleted/unavailable targets into explicit missing references and count/include only available assets. Single-file import still validates before replacing content; package verification still requires every live internal reference to have a corresponding included item.

Page mentions have an inline button appearance and keyboard focus. Normal click, Ctrl/Cmd+click, Enter and Space use the same availability/missing-page checks; a missing target does not navigate to an error page. Pointer interaction does not move the editor caret into the mention label. Labels are not editable in live preview. Backspace/Delete at their boundary removes the complete mention, and selections cannot edit only part of a label. Ctrl+Space remains Search Master.


## Library shared assets (2026-10-13)

New document ZIP manifests use version 3. The field shapes remain those described above, but every included document may reference any included asset. Each binary is emitted once, and `owner` selects an included document for import provenance. Native `.orbie` document headers remain version 2. Versions 1 and 2 retain their original per-document asset ownership validation. Older Orbium installations reject version 3 with an upgrade message. This is independent from the whole-account archive format.


## Mind Map export compatibility (2026-10-24)

The version-1 Mind Map directive is part of the current reserved Orbium dialect. With formatting preserved, exports keep its full graph (topic IDs, parents, labels and collapse state), and imports use the shared graph validator before writes. Older servers reject the unknown directive kind. Without formatting preservation, maps deliberately become an indented text outline in a fenced code block, with all descendants in parent-child order and literal label text. That outline remains readable but cannot reconstruct an editable graphical map or collapse state. No file/page manifest entries are inferred from literal topic labels. `.orbie`/package/archive version numbers do not change in this phase.


Mind Map rich-text review (2026-10-26): formatting-preserving native transfer retains supported graph version 2 and inline topic content. Plain Markdown and office outline fallbacks still use validated plain labels and intentionally omit topic mark styling. Existing version-1 maps remain valid; unsupported graph versions are rejected through the shared validator. See `../reports/13-mindmap-rich-text-and-sizing.md` for checks and exact manual acceptance.


Mind Map inline icons (2026-10-26): formatting-preserving graph-7 exports keep built-in/brand inline atoms and their marks. Custom icon attachment IDs are discovered inside every topic body and included in package asset selection. Native `.orbie` packages with included images retain atoms and remap IDs on import, with complete AST proof of all other content. Graph JSON rewrites target only parsed Mind Map directive headers, never code samples or unrelated metadata. Standalone `.orbie` files and package exports that omit an image replace that custom atom with its readable marked label, keeping the exact topic-text projection and avoiding dangling/source-installation IDs. Standard Markdown and Office exports retain the existing full topic outline with readable icon labels. No package envelope version changes; older clients reject unsupported graph 7. See `../reports/13-mindmap-inline-icons.md`.
