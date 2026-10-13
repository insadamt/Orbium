# Using Orbium and the skill bundle

## Install or share the skill

Download `create-orbium-documents.zip` from Settings → AI skills. Extract it; the root folder contains SKILL.md, references, and assets. For assistants with filesystem skills, put that complete folder in the assistant's configured skills directory. For Codex's default personal setup this is `~/.codex/skills/create-orbium-documents/`; a configured CODEX_HOME uses its `skills` directory. Other assistants have different installation workflows: follow their own skill import UI. Attaching a ZIP only works when that assistant can read archives. Ask it to read SKILL.md and the relevant references before authoring.

For a chat-only assistant that cannot read ZIPs, extract the bundle and attach SKILL.md plus the relevant Markdown references, or paste their text into the conversation with your task. If it cannot write files, it can return complete text or a generation script; you must save/run it in your own environment to obtain the artifact. A ZIP extension alone does not make an archive a usable skill or document package.

The skill ZIP is for the assistant. The `assets/block-showcase.orbie` inside it is for Orbium's Single document importer. The bundled `.css` is for Editor styles. A generated document-package ZIP uses manifest.json at its root and goes into Whole package import. Keep these three destinations distinct.

## Example requests

- “Use create-orbium-documents to make a .orbie study guide with a checklist, folded callout, blue key terms, equation, and Mermaid flowchart.”
- “Create a native Orbium ZIP with Overview, Decisions, and Tasks. Add bidirectional mentions and include the attached PNG and PDF.”
- “Create an Arabic/English document with RTL paragraphs and left-aligned code. Keep colors readable in Light and Dark.”
- “Create a separate Orbium CSS theme with rounded callouts, subtle shadows, blue headings, and theme-aware quote backgrounds. Explain how to apply it.”
- “Create a rich table with a two-column merged heading. Preserve it in .orbie rather than flattening it into GFM.”

Tell the assistant your content, audience, page titles, desired styles, whether assets should be included, and whether you want one file or linked pages. Supply the actual image/file bytes if they must be bundled. It should choose restrained defaults when styling is unspecified and preserve requested meaning when formatting.

## Orbium organization and navigation

A user owns workspaces. Workspace roots and folders contain folders, documents, and databases. Databases contain documents only. Documents have no children. A page mention is a reference, never a parent-child relation. Importing a document package creates new sibling documents in the chosen workspace/folder; it does not recreate folders or database schemas.

Use the workspace selector to switch or manage workspaces. Workspace/folder explorers provide Grid, List, and Gallery. Click/Enter opens an item; Ctrl/Cmd-modified opening uses the app's tab behavior. Tabs retain work surfaces; the breadcrumb navigates to ancestors. `Ctrl + Space` opens Search Master for workspace search/navigation/commands. Settings top Search filters settings categories. Trash restores deleted content; permanent deletion uses the app's confirmation flow.

Database entries have structured properties above a normal document body. Tables/properties in a document are not a database schema. Document transfer excludes database values, tags, hierarchy, covers/icons, and account preferences. Edit those through Orbium's own interfaces.

## Author and edit

New Markdown documents use a CodeMirror editor with source and live preview. Some retained older documents use the legacy editor; this skill targets the Markdown dialect. Type Markdown headings/lists/code or `/` for available block commands. Use `@` to choose an owned page mention rather than entering destination database IDs manually. Text formatting supports bold, italic, strike, inline code, color, and underline; block controls add direction/alignment and relevant media/table operations.

Use the block handle/context controls to duplicate, reorder, or delete. Edit code in its code widget; Mermaid and math have source/preview controls. Tables expose cell editing and supported span operations. Images expose caption, width, alignment, replace/download/remove. A folded callout can expand/collapse. The document outline navigates headings. `Ctrl + F` searches the current document. Undo/redo use document history; autosave reports saving/saved or a recoverable failure. Wait for Saved before relying on a reload.

Document actions (three dots) contain Import, Export, Find, Add file, Source/Preview, and outline actions. Source mode is useful for inspecting directives but malformed reserved syntax must be corrected before saving.

## Import and export

1. To create a new page: workspace/folder empty-space context menu → Import → Single document → choose `.orbie`. Expected: title comes from its header and content becomes editable.
2. To add linked pages/assets: the same menu → Import → Whole package → choose the generated document ZIP. Expected: verification, creation, assets, reference connection, then Open main document.
3. To replace a current editor body: Document actions → Import → choose one text document. A nonempty body requires Replace content confirmation; Cancel retains it. This keeps title/header/properties and provides undo.
4. To export: Document actions or a document's context menu → Export. Choose Single document or Package, Orbium or Markdown. Package options select images, files, and directly mentioned related documents; related inclusion is not recursive.
5. `.orbie` retains supported native body presentation. Plain Markdown drops native colors, underline, direction, image sizing, rich-table spans, and divider styling. Mermaid/math sources survive but another Markdown viewer may not render them.

Package imports allocate new IDs and connect included references to new copies. Reimport adds another copy. When a connection fails after import, inspect the destination before retrying. Single files cannot embed image/file bytes or create other pages.

## Theme application

Open Settings → Editor styles → Customize styles → Import the bundled/generated CSS. Review the live Full document or focused block preview, enable custom styles if needed, and Apply. Base stylesheet takes complete rules; individual block overrides take declarations only. Import replaces draft base rules and clears draft overrides; Cancel discards draft changes. Themes affect the current account's documents across workspaces, including database documents. Themes are not saved inside `.orbie` or document ZIP packages.

## Troubleshooting and acceptance

| Symptom                              | What to check                                                                                              |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Header/version error                 | Exact first-line orbium-document JSON, integer version 2, nonblank matching title, LF newline              |
| Manifest/path/checksum error         | ZIP root, regular entries only, exact declared paths, hash final bytes after content edits                 |
| Missing live reference               | Include target document/asset, use the correct owner's asset, or replace with an explicit missing fragment |
| External image stays text            | Supply supported image bytes and create a package; remote URLs do not create owned images                  |
| CSS cannot apply                     | Exact selector/property allowlists, no at-rules/URLs/!important, valid browser-supported values            |
| Styles appear in different colors    | Preset colors intentionally vary by theme; fixed hex does not                                              |
| Colors/effects disappear in Markdown | Export native .orbie for body metadata; apply account CSS separately                                       |
| Import was interrupted               | Inspect destination for successful copies before retrying                                                  |

After importing, open every page, follow each mention, view included images, download files, save/reload, and confirm body/styles remain. Review Light/Dark and narrow layout. Do not equate correct hashes with parser/import acceptance.
