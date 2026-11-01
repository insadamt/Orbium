Summary: Reports the active V3 editor/storage/transfer cutover and exact manual acceptance steps; depends on the user-approved V3 specification, docs 25–29 and the unchanged existing rich/history/ownership services.

# V3 stage 6 — active editor

The user authorized this phase with “continue but make now the new editor who works instead of the v2”. New Markdown Documents now use the active V3 editor and saved content format 3. This phase connects the previous isolated foundations to product controls, rich content, columns, persistence and transfer readers. It does not start stage 7.

## Delivered

- New Documents and Board-hosted Documents start with an identified paragraph; Live Preview hides identity syntax and Source mode displays the actual V3 source. Existing editor shell, themes, dialogs, controls and performance instrumentation remain.
- Stable-ID commands now power slash insertion, prefix shortcuts, block menus, Shift handle selection, duplication/deletion/reordering, media uploads, rich edits, columns and cross-document moves. New copies get fresh structural IDs; conversions/moves retain them. Empty paragraph hints remain available.
- Column projections reuse existing rich previews, gutter/formatting controls, local icon pickers, grid/dividers and a single owner history. Search and outline navigate mapped child positions. Rich code/Math/Mermaid/table/Mind Map inputs continue using the existing feature surfaces. Mind Map fullscreen Shift+Enter closes the focus trap before inserting an owner paragraph. Nested rich composition blocks structural edits while allowing the same composing body to publish its own text.
- The server parses V3 bodies independently, validates declared types and derives plain text, references, statistics and Mermaid hashes without structural headers. Native Board tables retain an explicit body-only parser/inspector. Existing ownership/Trash/reference/revision protections remain.
- Saving requires format 3 and stable-block capability 1. Normal pages, hosted resources, recovery/session state, page caches, Library usage and statistics rebuilding use the matched format.
- Native `.orbie` exports retain IDs, empty blocks and source bytes, with bounded AST-proven omitted-reference rewrites. Clean Markdown/Office output omits structural headers and flattens columns. Native package entries use envelope 3 independently of the existing manifest 3; verification includes exact native source/identity equality or canonical clean output. Semantic relationship remapping retains structural identities.
- The maintained downloadable skill, payload references and showcase now target V3. No installed plugin was changed.

## Checks actually run

No automated tests, fixture execution, browser automation or runtime benchmark was run.

| Check | Actual result |
| --- | --- |
| Targeted frontend formatting/lint | Passed: all 96 touched/new frontend source files |
| `npm run types:check` | Passed |
| PHP syntax (`php -l`) | Passed: all 30 changed/new PHP files |
| `./vendor/bin/pint --test` | Passed; formatting check only |
| `npm run build` | Passed: 5,758 modules; final build duration recorded in the build log |
| `npm run lint` | Fails on 17 pre-existing formatting files listed below |
| `git diff --check` and source summaries/new-file size audit | Passed; no new source over 500 lines |

Build retains the existing ineffective-dynamic-import, large-chunk and plugin-timing warnings. The original lint baseline was 18 files; formatting the gutter while adapting it removed one existing violation. No unrelated baseline files were reformatted. Remaining files:

```text
resources/css/explorer-views.css
resources/css/workspace-navigation.css
resources/js/components/boards/board-keyboard.ts
resources/js/components/boards/board-properties-panel.tsx
resources/js/components/boards/board-shape-block.tsx
resources/js/components/boards/board-shape-data.ts
resources/js/components/boards/board-shapes.css
resources/js/components/boards/board-toolbar.tsx
resources/js/components/boards/use-board-tools.ts
resources/js/components/editor/markdown/columns/columns-widget.ts
resources/js/components/editor/markdown/interactions/markdown-block-drag.ts
resources/js/components/editor/markdown/preview/markdown-writing-commands.ts
resources/js/components/navigation/workspace-navigation-preferences.ts
resources/js/components/navigation/workspace-navigation-settings.tsx
resources/js/components/navigation/workspace-sidebar-tree.tsx
resources/js/components/navigation/workspace-sidebar.tsx
resources/js/layouts/app-layout.tsx
```

Logs: `/tmp/orbium-v3-stage-6-final-targeted.log`, `/tmp/orbium-v3-stage-6-mindmap-format.log`, `/tmp/orbium-v3-stage-6-final-types.log`, `/tmp/orbium-v3-stage-6-final-pint.log`, `/tmp/orbium-v3-stage-6-final-lint.log`, `/tmp/orbium-v3-stage-6-final-build.log`.

## Compatibility and limits

No data reset, historical-document conversion or database migration was performed. Existing development format-2 documents/native V1/V2 files are explicitly unsupported; create a new Document or import a V3 file. Format-1 legacy/native product readers remain separate where still used. Deploy the matching frontend/server and reload open editors; an old client cannot save format 3.

This report does not claim browser acceptance: focus, IME, drag/scroll/motion, modal shortcuts, hosted views, round trips and performance remain manual checks. The syntax adapter reuses exact immutable structural snapshots/body trees where available, but standalone readers and combined-tree construction still require matched performance review. No latency/thermal/memory improvement is claimed. Account portability remains a separate unavailable/gated feature.

Existing bounded semantic-remapping limits remain (256 candidates / 32 MiB parse work). A shared reference definition used both as image and file cannot receive two omitted-reference destination kinds without changing its usage spelling; export rejects it clearly and asks for explicit inline destinations. Separate inline image/file uses of the same asset are handled independently. No literal code/header examples are rewritten to hide this case.

## Manual checklist

Use matching freshly reloaded server/frontend code. Work in disposable Documents and use your own uploaded files/pages. Do not reset the database. The complete maintained showcase is `resources/skills/create-orbium-documents/assets/block-showcase.orbie`; existing stage fixtures are under `Docs/examples/` and are intended for manual review only.

1. **Active cutover:** create a new Document from a workspace/folder, open Source mode, then Live Preview. Expected: saved format 3; one `++block` paragraph with a nonempty unique ID; the header is hidden in Live Preview and the writing hint appears. Type `ALPHA`, wait for Saved, reload. Expected: text and the original ID persist; no version-2 payload is emitted.
2. **Independent blocks and typing:** type a paragraph, press Enter mid-text/end, then Enter on its empty final line. Repeat in headings, bullets, numbered lists, a checklist, quote and callout. Expected: Enter edits/continues inside the existing block; the empty final line/item exits to a new identified paragraph. Checked/nested items and neighboring styles do not change. Type `# `, `- `, `1. `, `- [ ] ` and `> ` in fresh paragraphs: the explicit type updates. Undo/redo each change and inspect IDs.
3. **Slash and focus:** in separate empty paragraphs insert each slash template, including Code, Table, Mermaid, Math, Mind Map, Callout, Divider and both column counts. Expected: a matching explicit type, retained replacement ID for ordinary templates, valid layout/column/child IDs for columns, and the intended writing/rich input receives focus. Slash completion Enter/Tab selects the command rather than inserting an unwanted paragraph. Type three backticks plus `ts` (and separately `mermaid`) in a fresh paragraph, then Enter: expect the matching closed code/diagram block with the same ID and an active dedicated input. Invalid nested column insertion is rejected without partial content.
4. **Shift+Enter:** try beginning/middle/end of a paragraph, list, heading and callout, then inside code, table, math, Mermaid and Mind Map fullscreen topic editing. Repeat inside columns and the final column child. Expected: exactly one fresh paragraph after the entire owning block in the same parent scope; original content/ID remains; caret reaches the paragraph. Rich Enter retains its dedicated behavior. Undo once restores the prior state.
5. **Boundary deletion:** at the visible start of a heading/list/quote/callout press Backspace; repeat at a paragraph boundary. At a non-paragraph end press Delete, then repeat after conversion. Expected: non-paragraph converts to paragraph first, preserving its ID/content; compatible adjacent paragraphs merge on the next action and retain the earlier ID. Rich/incompatible boundaries do not flatten. First/last document boundaries are safe no-ops.
6. **Whole-block selection:** click a handle, Shift-click a later sibling, copy/cut/paste, duplicate/delete using the menu, and use Ctrl/Cmd+A twice. Expected: ordered consecutive selection within one scope, plain copy excludes structural syntax, internal paste creates fresh IDs, delete/duplicate operate on the selected range, and document selection affects only its owner. Deleting all blocks leaves one identified empty paragraph. Undo restores original IDs/content.
7. **Formatting and references:** select mixed text/icons and apply bold/italic/strike/underline, colors and web links; change paragraph/heading direction/alignment and ordered-list numbering style. Add a mention of another owned page. Import Markdown with reference-style links/images and titles, then reuse the same reference label with different targets in two V3 bodies. Repeat in columns and rich table/callout inputs. Expected: existing controls/styles and reference targets/titles persist through save/reload and undo; sibling reference definitions never leak. Conversion retains authored nested/checklist content; unsupported rich conversions fail without rewriting neighbors.
8. **Upload anchors:** insert an image/file/video/audio/PDF via upload and Library, including between existing text and inside a column. Add a custom inline icon separately. While another upload is pending, alter its insertion text. Expected: matching identified media types, existing previews/metadata/controls, inline icons remain inline, stale insertion reports a clear recovery message and does not replace unrelated text. Saved ownership/reference behavior remains correct.
9. **Rich content:** import the V3 showcase into a disposable Document. Edit code language/content, copy code, edit Mermaid/math, change callout title/folding, reorder/edit/merge/split supported table cells, and edit Mind Map topics/layout/styles/icons. Expected: existing feature surfaces and motion, owner undo/redo, stable outer block IDs, saved/reloaded content and no structural syntax in previews. Literal fake headers/references inside code remain literal.
10. **Column creation and moves:** drag an ordinary block beside another to create two columns; move multiple selected blocks into/out of/between columns and reorder within a column. Add a third column through the layout handle menu. Expected: correct drop indicators/ghosts, reading order, unchanged moved IDs/payloads, no nested layouts and no fourth column. Caret/focus/viewport stay usable. Escape, blur and cancelled drag leave source unchanged.
11. **Column consequences:** resize with pointer/arrows/Home, use Equal widths, delete the last child of one of three columns, then remove a second column's final child. Expected: widths respect the 15% minimum and total 10000; three-to-two cleanup redistributes proportions, and one survivor dissolves into root children with unchanged IDs. Stack blocks preserves reading order/IDs. Each accepted action is one owner undo; repeated undo/redo has no extra editors, widths drifting or lost children.
12. **Split-pane transfer:** open two disposable V3 Documents side by side. Drag a root block, a selected range, a whole layout, and a column child across Documents. Expected: source removal and destination insertion retain the transferred identities; linked undo/redo reverses both owners together. Newer edits in the other pane produce the existing ordering notice. A destination ID collision/read-only/unavailable target rejects without losing the source. Check drag edge scrolling and drop viewport anchoring.
13. **Search and outline:** search for unique text in root/column headings, inline formatting, tables and literal code. Search for a structural UUID/header that appears only as structure. Navigate H1/H2 outline entries in columns. Expected: readable matches/highlights and correct nested focus/scroll; structural IDs have no matches or outline entries; literal code examples remain searchable. Global search/statistics/Library usage reflect saved body content rather than headers.
14. **Source recovery:** switch Source mode, duplicate an actual structural ID, introduce an invalid type/column scope, then return live and attempt Save. Expected: source is kept, structural actions/saving reject with diagnostics and no silent rewrite. Repair/undo in Source and return live: valid widgets and identities recover. Clear Source completely and return live; first typing or Enter creates an identified paragraph and keeps the caret usable. Literal header-looking code and escaped prose remain content.
15. **Hosted Documents:** create/open a Document card on a Board, edit text/rich content/columns, save and reload both normal and hosted views. Expected: format-3 editor/preview, unchanged native Board format, original Document revision/ownership, and no headers in the card preview. Read-only/error/recovery sessions reject writes and retain current source.
16. **Native and clean exports:** export a V3 `.orbie`, reimport it and compare structural IDs/empty blocks/types/source; include styled text, two/three columns, literal code examples, tables, math and Mind Maps. Expected: native structure survives and omitted references become readable missing placeholders. Export `.md`: headers/fences for structure are absent, columns flatten in order and literal code examples remain. Reimport clean Markdown: fresh identities, readable content and no remote-image ingestion.
17. **ZIP/Office/skill:** export/import native and clean packages with two linked pages and included/excluded assets, then DOCX/PDF. Expected: checksums/ownership/semantic remapping, distinct document/native versions, stable structural IDs in native packages, and readable Office output without structural headers. Download the skill ZIP from Settings → AI skills and import its showcase through Single document. Expected: V3 guidance/showcase, not a package-import attempt on the skill bundle.
18. **Negative paths and visual review:** try a native envelope version 2, malformed/duplicate headers, an undeclared ZIP entry, unavailable/cross-workspace references and stale revisions. Expected: clear rejection, no replacement/deletion or revision overwrite. Review dark/light themes, responsive columns at 680/520px, narrow hosted/split panes, reduced motion and real IME composition. Expected: unchanged visual controls, no duplicate characters, focus jumps, leaked listeners/editors or unexpected remounts. Capture runtime/performance observations for the separate stage-7 approval.

## Commit suggestions

No commit or staging was performed. Suggested logical messages:

- `feat(editor): activate V3 documents and stable block controls`
- `feat(documents): persist and transfer scoped V3 source`
- `docs(editor): document V3 cutover and manual acceptance`

Stages 1–5 were already uncommitted when this phase began; review the complete working tree before choosing commit boundaries.
