# Boards — Document-style block correction

2026-10-18. Current phase-4 manual review. The user approved redesign work and clarified the direction: “like blocks in documents same style same thing but without the 6 dots”. This supersedes the earlier spatial-notebook proposal.

## Result

- Native Board previews now use the Document editor's `orbium-editor`/`orbium-markdown-content` presentation. Heading levels, quotes, callouts, inline formatting, links and table surfaces use existing Document classes rather than a separate Board palette. Removed the conflicting Board heading/quote/callout/table declarations.
- Board-specific CSS now adapts shared presentation to spatial frames: no document-flow heading gaps, stable editor paragraph margins, matching list preview/editor rhythm, bounded overflow, media states and existing selection/resize behavior.
- Code, Math and Diagram use existing Document rich-card/attachment classes: identity icon, title, actions and inset content. Source Edit/Done actions use existing Board edit state. Code retains one persistent heading and Copy action; the nested preview renderer's duplicate heading is removed. Language selection remains available during code editing. Board code uses a generic code icon; Document code headers use language-specific icons.
- Images retain Document-like corners and secondary centered captions. Existing audio/video/PDF players already use Document primitives and now render without a second outer Board card. Ordinary downloads show the same link and rounded-up KB metadata treatment as Document attachments.
- Native blocks have no six-dot gutters. Original Documents edited in resource cards also omit their Markdown/legacy gutter components. Standalone Document pages keep their usual handles; hosted editing still saves the original Document.
- Resource previews retain their reference-specific layout. The previous suggested sizing overhaul was not applied: the user's Document-style direction is implemented as this focused correction.

## Scope and limitations

Native objects remain typed independent Board objects. This change shares presentation and existing lower-level renderers, rather than introducing arbitrary embedded Document fragments. Existing Board editing controls remain contextual. No backend, persistence schema, content format, geometry defaults, dependency or API change was required.

Shared document typography can change wrapping and settle automatic text heights once; manually sized non-text frames retain saved dimensions and may need manual enlargement for the richer headers. Code uses the existing shared editor/highlighter. Math/Diagram retain the existing simultaneous preview/source editing flow. This does not add Document-only nested content, slash commands, table column dragging or block conversion to native Board blocks. Account-specific imported editor themes were not manually verified.

The working tree contained extensive prior uncommitted changes. They were preserved. No commits were created. No later phase started.

## Actual validation

| Check | Result |
|---|---|
| Targeted `vp fmt` | Passed for changed Board/editor source files |
| `npm run types:check` | Passed, exit 0 |
| `npm run lint` | Passed, exit 0: 628 formatted files, 526 files without warnings/errors |
| `npm run build` | Passed, exit 0; built in 13.89s |
| `git diff --check` plus explicit whitespace inspection of touched untracked Board files/docs | Passed |
| Source size | Changed source files remain below 500 lines; Markdown editor is 498 lines |

The build retains the previously recorded mixed static/dynamic import warnings for document-image-crop-dialog, database-property-header and document-editor-loader, plus chunk-size and plugin-timing notices. Logs: `/tmp/orbium-board-document-style-types.log`, `/tmp/orbium-board-document-style-lint.log`, `/tmp/orbium-board-document-style-build.log`.

No automated tests were written or run. No live browser visual verification was performed. PHP checks and migration checks do not apply to this frontend-only correction.

## Exact manual acceptance checklist

Use a disposable **Document-style review** Board at 100% zoom and a Document with equivalent content. Arrange writing, technical blocks and media in separate nearby clusters for comparison.

1. **Writing parity:** create all three heading levels, a paragraph with bold/italic/link/inline code, a quote and a callout. Expected: Document typography and muted quote/rounded callout treatment; no extra outer card around writing and no six-dot handle on hover or selection. Heading spacing starts at the object's content rather than reserving a document section gap.
2. **Editing stability:** double-click each writing block, type, finish and re-enter. Expected: matching preview/editor formatting and content origin; auto-height follows content without an added toolbar row inside the block. Drag the inactive object, select multiple objects and resize width. Expected: existing canvas actions remain usable.
3. **Lists:** add bullet, numbered and checklist examples; enter three items and toggle a task. Use Enter, Tab/Shift+Tab and undo/redo. Expected: consistent marker/checkbox spacing between preview/editing, correct task state and existing native list behavior.
4. **Tables:** create a 3×2 table and enter distinct values; edit with Tab and select cells. Expected: the Document table's rounded frame, muted first row and internal rules in preview and editing; selected cells remain distinguishable. Wider tables remain scrollable while editing.
5. **Code:** add TypeScript, copy from preview, enter editing, change language, type, copy again and finish. Expected: one rich-card header with exactly one Copy action; current source is copied in both states, language updates work and highlighting remains readable. Empty source shows its placeholder inside the inset content panel.
6. **Math/Diagram:** add a nonempty equation and valid Mermaid diagram. Use the header Edit action, change source, then Done. Expected: matching Document card vocabulary, working live rendering, usable source fields and preserved full-diagram preview action. Invalid source stays visible/editable with existing feedback.
7. **Media:** insert portrait/landscape images with captions, an ordinary download and audio/video/PDF. Expected: readable centered captions, filename/KB metadata for ordinary downloads, and one player surface with functional controls. Upload/Library replacement and empty states still work.
8. **Hosted Document handles:** link a Markdown Document and double-click to edit; hover paragraphs and rich blocks. Expected: no six-dot gutter appears; formatting and autosave still work. If a legacy Document is available, repeat. Open the original as an ordinary Document page: its usual handles must still appear.
9. **Themes/zoom:** repeat representative comparisons in Light/Dark, Normal/Frosted and at 50%/100%/200%; inspect a narrow viewport. Expected: readable shared styles, usable toolbar/selection targets and bounded source/media content. If an imported editor theme is enabled, explicitly check that it does not make native Board content unreadable.
10. **Persistence/guards:** edit and move objects, wait for Saved and reload. Expected: content, settled heights, positions and sizes persist. Edit a hosted Document and verify the original receives changes; remove its card and verify the original remains. Existing dirty/upload/conflict navigation guards continue to protect edits.

## Commit suggestions

- `style(boards): reuse document block presentation`
- `fix(boards): omit gutters from hosted document editors`

Stop for manual review. No Mind Maps or later phase is authorized.
