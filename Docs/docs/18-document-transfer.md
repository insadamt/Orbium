# Document import and export

Approved by the user on 2026-10-13. This is the document-transfer extension to the current CodeMirror editor review. It does not implement Phase 6 account snapshot replacement.

## Entry points

- Document editor: one **Document actions** (three dots) menu contains import, export, find, add file, source/preview, and the document outline action. The outline rail remains available as navigation.
- Workspace/folder contents: right-click a document for **Export…**; right-click empty space for **Import…**. Keyboard users can use an item's actions button or Shift+F10 on empty space.
- Import in a document accepts a single text document, even when the document already contains writing. Package import belongs to the workspace/folder destination.

## Single documents

`.orbie` is UTF-8 text, with a versioned header and the `orbium-markdown-v1` body dialect:

```text
<!-- orbium-document {"version":1,"title":"Example"} -->
```

It preserves supported Orbium body presentation metadata. Serialization normalizes source spelling; it does not mutate the current editor content. Single files do not contain binary assets or other pages. Their internal references become installation links; image-only wrappers become ordinary links with captions in `.orbie` when their assets are absent. Images in standard `.md` exports retain ordinary Markdown image links to the source installation.

`.md` uses standard Markdown/GFM. Color, underline, explicit direction/alignment, divider styling, image sizing and rich-table spans are omitted or flattened into readable equivalents. Rich cell content uses `<br>` separators in GFM tables. Mermaid fences and math source remain; rendering math/Mermaid depends on the receiving Markdown application. Code is opaque during conversion. No account CSS theme is included.

Workspace imports create a new document: `.orbie` uses its header title, `.md` uses the filename. Editor imports replace only body content and keep the document's existing title, header, and database properties. Validated non-empty replacements require **Replace content** confirmation. Cancel, invalid files, and edits during validation retain the current content. A CodeMirror replacement is one undoable editor transaction and uses normal autosave.

External image syntax on single-file import remains literal text, following the existing policy against automatic remote image ingestion. Standalone attachment IDs cannot establish identity across installations; use a package for owned assets and relationships.

## Packages

Export **Package** uses three checkboxes:

- Include images: on by default.
- Include files: on by default.
- Include related documents: off by default.

Counts update with the selected documents. Zero-count choices are disabled. Related documents are directly mentioned, visible, supported Markdown documents in the same workspace, excluding the main document itself; they are not recursively expanded. The main document may use current unsaved editor content. Related pages use their saved contents captured when the dialog loads.

ZIP format 1:

```text
manifest.json
documents/<source-id>.orbie OR documents/<source-id>.md
assets/<source-attachment-id>
```

The manifest has `kind: orbium-document-package`, `version: 1`, ordered `documents`, and `assets`. Each document declares `id`, `title`, `source`, `path`, and `sha256`. `source` is the validated import representation with semantic `orbium:` relationship keys. Each asset declares `id`, `owner`, `name`, `path`, and `sha256`. Source IDs are package-local relationship keys, never destination IDs.

Native `.orbie` document entries retain package-local relationship keys. Markdown entries use relative links to documents/assets for use outside Orbium. Import verifies that each entry's parsed content agrees with its manifest representation after resolving those destinations. The first document is the main document. Excluded references remain installation links, and excluded images become ordinary links rather than broken owned image blocks.

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
