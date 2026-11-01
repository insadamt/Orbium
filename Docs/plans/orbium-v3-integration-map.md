Summary: Maps the existing editor's structural and persistence dependencies before V3 implementation so headers cannot be introduced through only one save path. It depends on `../phases/orbium-v3-document-editor.md`, the source revision below and manual baseline observations recorded in the stage-1 report.

# V3 editor integration map

Stage-6 update: the identified editor, rich/column/control adapters and matched storage/readers/transfers are active in the product. Read `../docs/29-v3-active-editor.md` and `../reports/orbium-v3-stage-6-active-editor.md`. The audit tables below are the historical stage-1 baseline, not the current saved-version contract. Stop for stage-6 manual review before stage 7.

## Evidence and scope

Audited on 2026-10-31, branch `main`, revision `02c64ec6f995800bafbae049df50694377a55250`. The initial working tree was clean. Findings below come from source inspection, not browser reproduction. All paths are relative to the repository root. In the frontend tables, `editor/` means `resources/js/components/editor/markdown/`.

The user requested the full supplied specification. This map implements its stage-1 audit deliverable. Root `AGENTS.md` and specification section 12 retain approval between stages. No V3 runtime changes, data resets, migrations or compatibility adapters were introduced here. Existing development documents have not been deleted.

## Authoritative state and lifecycle

| Responsibility | Existing source | V3 integration obligation |
| --- | --- | --- |
| Owner document | `editor/markdown-editor.tsx` | Retain the single owner `EditorView`, immutable source and history. Add derived structural state, not a second saved document tree. |
| Mode switch | `editor/markdown-editor.tsx` presentation compartment | Switching currently reconfigures presentation on the same view. Keep raw Source Mode, selection/history and rich lifecycle; do not replace the editor on toggle. |
| Autosave | `editor/use-markdown-autosave.ts`, `editor/markdown-api.ts` | Keep immutable pending `Text`, composition guard, revision handling, retries and navigation guards. Send the matched V3 version/capability. |
| Hosted sessions | `resources/js/components/editor/hosted-document-session.tsx`, `use-hosted-document-activity.ts` | Keep original Document ownership, activity, read-only state and save status. |
| Tab activity | `editor/use-markdown-editor-activity.ts` | Preserve hidden-editor/editability and retained-tab behavior; do not activate child editors independently. |
| Rich updates | `editor/rich/widget-controls.ts`, `rich-range-mapping.ts`, `rich-widget-move.ts` | Keep guarded source writes and moved-widget retention; map by persistent block identity as well as ranges. |

## Parser-coupled operations

| Area | Existing source / concrete finding | Required adaptation |
| --- | --- | --- |
| Block lookup | `editor/interactions/markdown-block-actions.ts`: `MarkdownBlockRange` has `from`, `to`, `name`, `source`; `markdownBlockAt` climbs Lezer ancestors. | Make explicit ID/type/parent/sibling ranges authoritative. Adjacent list syntax must not redefine identity. |
| Neighbors | `adjacentMarkdownBlock` ensures the tree to document end with a 100 ms budget and follows top-level siblings. | Resolve siblings from the scoped index, including column children. Keep rendering syntax separate from identity. |
| Edit/delete/move | `replaceMarkdownBlock`, `deleteMarkdownBlock`, `moveMarkdownBlock` check source equality, editability/composition and dispatch history/motion effects. Delete/move consume neighboring blank separators. | Preserve guards/effects; calculate edits using full header/body boundaries and explicit empty-block ownership. |
| Conversion | `turnMarkdownBlockInto` strips Markdown prefixes; list conversion currently removes checkbox markers/indentation. | Retain ID; make boundary conversion lossless for nested item content and checkbox meaning. Do not reuse stripping as the V3 conversion contract. |
| Presentation | `markdownBlockPresentation`, `setMarkdownBlockPresentation` unwrap/serialize `:::orbium` metadata from syntax nodes. | Keep color/direction/alignment and feature metadata; do not store competing block identity in presentation metadata. |
| Wrappers | `editor/interactions/markdown-block-wrappers.ts` builds CodeMirror block wrappers from parsed ranges. | Use authoritative block boundaries, maintaining CSS hooks/gutters and incremental range mapping. |
| Preview | `editor/preview/build-markdown-preview.ts`, `markdown-live-preview.ts`, `editor/rich/read-rich-block.ts` | Hide/protect headers in Live Preview and isolate body parsing. A divider must not become a neighboring setext heading. |
| Dialect | `editor/dialect/markdown-dialect.ts`, `metadata.ts`, `editor/interactions/markdown-source-parser.ts` | Retain code-fence-aware dynamic directives; add scoped structural parsing and shared exact type/ID validation. |
| Creation | `editor/markdown-slash-commands.ts`, `markdown-typing-commands.ts`, `interactions/markdown-trailing-paragraph.ts` | Generate one ID per created block. Explicit typing conversions change type through a transaction; ordinary body edits never infer it from neighboring syntax. |
| Text editing | `editor/preview/markdown-writing-commands.ts`, `markdown-container-exit.ts`, `markdown-presented-container-exit.ts`, `markdown-paragraph-split.ts` | Replace only approved Enter/Shift+Enter/boundary semantics, preserving formatting and IME. Current Enter inserts blank-line separators; Shift+Enter inserts a paragraph hard break. |
| Selection | `editor/markdown-selection.ts`, `interactions/markdown-block-keymap.ts`, `markdown-block-gutter.ts` | Reuse existing two-stage selection; derive ranges without headers. Add explicit consecutive handle/Shift+Click block selection. |
| Paste | `editor/markdown-import-paste.ts`, `interactions/use-markdown-transfer.ts`, `markdown-transfer.ts` | Current special import-paste handler applies to an empty owner. Add structured paste in nonempty blocks, prefix/suffix preservation and fresh copied IDs atomically. |
| Drag | `editor/interactions/markdown-block-drag-controller.ts`, `markdown-block-drag.ts`, `markdown-drag-scroll.ts`, `markdown-drop-viewport.ts` | Extend current single-range transfer to ordered consecutive blocks. Preserve targets, insertion indicators, edge scrolling, source dimming and cancellation. |
| Split transfers | `editor/interactions/markdown-block-transfer.ts`, `markdown-linked-move-history.ts`, `markdown-split-block-targets.ts` | Keep preflight validation and linked undo ownership. Resolve both owners before writes and preserve moved IDs. |
| Embedded code | `editor/rich/code-input.ts`, `code-widget.ts` | Keep nested code source literal. Delegate Shift+Enter to the owner without splitting code or adding a literal newline. |
| Mermaid/math | `editor/rich/rich-source-input.ts`, `diagram-widget.ts`, `math-widget.ts` | Textareas have their own events. Implement the same owner-delegated Shift+Enter and preserve ordinary/blank Enter lines and existing Escape controls. |
| Tables/callouts/maps | `editor/rich/table-cell-actions.ts`, `rich-text-input.ts`, `callout-widget.ts`, `mindmap-widget.tsx` | Audit nested focus and writes individually; do not introduce ordinary child block IDs inside opaque payloads or arbitrary nesting. |

Headers alone do not fix list contamination. The body rendering parsers and each consumer of whole-document Lezer/CommonMark nodes must respect explicit block boundaries. Rendering one undivided Markdown tree and merely hiding header text does not meet the specification.

## Columns and hierarchy

| Responsibility | Current implementation | Required adaptation |
| --- | --- | --- |
| Layout representation | `editor/columns/column-source.ts`: `ColumnLayout = {widths, bodies}`; no layout/column/child IDs. | Layout ID belongs to its `++block`; stable column ID belongs to `kind: column`; every child has its own header. |
| Column metadata | Frontend `editor/dialect/metadata.ts` and backend `app/Services/Markdown/OrbiumMetadata.php` currently permit `column` metadata containing only `kind`. | Add column ID validation consistently, including global duplicate detection and nested-scope rules. |
| Nested editor | `editor/columns/column-editor.ts` mounts a specialized `EditorView`; ordinary changes publish its complete string. | Retain existing UI; translate child source changes to precise owner ranges, preserving composition and focus. |
| Owner writes | `editor/columns/column-commands.ts`: `replaceColumnLayout` replaces the entire owner rich-block range with serialized layout. `columns-widget.ts` invokes it for child changes. | Ordinary child keystrokes must edit child ranges instead of rewriting sibling bytes. Structural changes remain atomic owner transactions. |
| Synchronization | `column-editor.ts` maps owner refresh to a whole nested-body replacement when different, in a microtask. | Use mapped changes where safe; avoid stale child writes and selection jumps during owner updates/undo. |
| Transfers | `editor/columns/column-drop.ts`, `column-position.ts`, `column-registry.ts` | Resolve ID/scope/destination first. Moves preserve IDs; reject nesting and cross-owner mistakes. |
| Cleanup | `removeEmptyColumn` proportionally rebalances and `columnLayoutSource` promotes the sole survivor. | Count structural children, not nonblank headers; retain child IDs and remove obsolete container/column identities in the same transaction. |
| Resizing | `column-resize.ts`, `columns-widget.ts` | Retain 15% minimum, sum 10000, max three columns, cancel/blur handling, one accepted history action and responsive thresholds. |

## Server, formats and readers

| Surface | Existing source / current contract | V3 integration obligation |
| --- | --- | --- |
| Saved document | `app/Models/Document.php`, `app/Services/Markdown/MarkdownContract.php` | Saved Markdown is format 2, dialect `orbium-markdown-v1`. Final V3 saved-version policy must be explicit and matched across every reader/writer; `.orbie` version and package version are separate. |
| Creation | `app/Actions/Nodes/ManageHierarchy.php` | Initializes Markdown documents with the contract version. Create a valid empty V3 document without converting historical records implicitly. |
| Normal page | `app/Http/Controllers/DocumentController.php`, `resources/js/components/documents/document-page.tsx`, `document-content.tsx` | Controller and frontend discriminated union/rendering checks must agree on V3. Existing hard-coded `=== 2` checks must not route V3 to Tiptap. |
| Save | `app/Actions/Documents/SaveMarkdownDocument.php`, `MarkdownSaveData.php`, `editor/markdown-api.ts` | Keep row lock/revision check, workspace/Trash guards and atomic derived data. Validate malformed headers/duplicates before writes and prevent stale clients overwriting V3. |
| Server parsing | `app/Services/Markdown/MarkdownParserService.php`, `OrbiumBlockStartParser.php`, `OrbiumStructureValidator.php` | Existing CommonMark extensions recognize directives, not V3 headers. Add explicit block scoping without weakening safe links, escaping, UTF-8 or complexity limits. |
| Derivation | `app/Services/Markdown/MarkdownDocumentInspector.php`, `app/Services/Statistics/MarkdownDocumentStatistics.php` | Exclude headers/IDs from text and counts; use authoritative block types; preserve column mentions, media, map icons and Mermaid preparation. |
| Relationships | `app/Services/Markdown/MarkdownReferenceValidator.php`, `MarkdownReferenceRemapper.php`, `MarkdownColumnLayout.php` | Keep semantic Node/attachment IDs separate from block/column IDs, including deleted-reference rules. Preserve source outside explicitly remapped destinations. |
| Hosted documents | `app/Services/Boards/BoardResources.php`, `resources/js/components/boards/board-document-editor.tsx`, `board-document-preview.tsx` | Hard-coded formats `[1,2]` / `=== 2` are separate readers. Include hosted read-only previews, original revisions and editing, without changing native Board block schemas. |
| Frontend file envelope | `resources/js/components/document-transfer/document-format.ts` | Currently writes `.orbie` v2 and accepts v1/v2. Write/accept V3 explicitly; old unsupported development files fail clearly. |
| Native/Markdown export | `app/Services/DocumentTransfer/DocumentMarkdownSerializer.php`, `TransferSerializationOptions.php` | Serializer reconstructs AST source today. Native export must preserve explicit identities/empty blocks; clean Markdown strips headers and flattens columns. Do not lose literal header-looking code. |
| ZIP package | `app/Services/DocumentTransfer/DocumentPackage.php`, `DocumentPackageContent.php`, `MarkdownAstSnapshot.php` | Package manifest version is already 3 while native entries are v2. `min(packageVersion, 2)` currently validates the native envelope. Decouple these versions; compare valid V3 content/IDs without rewriting released package definitions. |
| Office output | `app/Services/DocumentExport/OfficeDocumentModel.php`, `OfficeDocumentExporter.php` | Keep readable Word/PDF output and rich fallbacks, without visible headers or Node/attachment reference loss. |
| Local search | `editor/interactions/markdown-logical-text.ts`, `editor/use-markdown-search.ts`, `columns/column-search.ts` | Current logical projection reparses/cache-keys immutable `Text`. Add structural exclusion and correct nested offset mapping. |
| Outline | `editor/markdown-table-of-contents.tsx`, `columns/column-position.ts` | Current H1/H2 extraction reparses full source when source identity changes. Preserve labels, heading motion and mounted-column navigation; honor explicit heading identity/type. |
| Global search | Server-derived `Document.plain_text` / mention index | Keep headers and IDs out of derived text; preserve workspace scope and existing result/navigation behavior. |
| Generation guidance | `resources/skills/create-orbium-documents/`, `Docs/docs/18-document-transfer.md` | Update maintained downloadable skill/examples when V3 becomes available so generated files use the accepted envelope and block format. Do not alter unrelated installed plugins. |
| Account portability | `Docs/docs/10-portability-protocol.md` describes a separately gated product phase. No account archive implementation was found in this audit's `app/` file inventory. | Do not claim account round-trip acceptance or build an unrelated restore product as part of V3. Adapt any actual archive integration found during implementation; document unavailable coverage. |

## Performance and motion to retain

- `markdown-editor.tsx` records `codemirror.mount`, mounted/first-frame marks and `codemirror.activation-frame`. `resources/js/lib/editor-performance.ts` exposes `window.__ORBIUM_PERF__` in development or with the profiling build flag, retains up to 500 samples, and observes long tasks where supported.
- Autosave defers source serialization until saving, using 700/1300/2200 ms delays by source size with a 10-second dirty-time bound. Preserve this lifecycle; structural validation must not force full serialization on each ordinary keypress.
- `markdown-block-motion.ts`, `markdown-block-history-motion.ts`, `markdown-history-layout-motion.ts`, `markdown-motion-snapshot.ts` preserve accepted-change geometry/history/scroll cleanup. Handle movement in `markdown-block-handle-motion.ts` has a 150 ms transition and reduced-motion handling.
- `rich/table-drag-motion.ts`, `rich/rich-widget-move.ts`, `markdown-drag-scroll.ts` and existing menu/toolbar motion are compatibility dependencies. Reuse their hooks around targeted transactions rather than remounting every ordinary block.
- Current whole-source work exists in outline/search and column synchronization. Treat it as a baseline risk, not permission for a broad optimization/redesign or evidence of measured slowness.
- No browser trace, pointer interaction, visual capture or thermal/input-latency measurement was taken. The stage-1 report gives the matched manual protocol; historical Tiptap measurements are not a current CodeMirror baseline.

## Staged implementation boundary

1. Stage 1: this inventory, preserved specification, actual static baseline and manual baseline protocol. Await review and runtime baseline observations.
2. Stage 2: exact canonical type names, shared syntax/identity validation, fence/scope-safe structural parser/index and V3 file envelope. Establish the matched saved-version/capability contract without partially enabling V3 writes in an unadapted editor.
3. Stage 3: owner transaction layer and stable-ID create/convert/split/merge/delete/duplicate/move, existing motion and linked history.
4. Stage 4: approved text/embedded keyboard behavior, selection and atomic structured paste.
5. Stage 5: persistent columns/children, targeted owner writes, ID-preserving transfers and deterministic dissolution.
6. Stage 6: all rich features, modes, readers, derivations, uploads/references, native/clean/Office/package transfers and downloadable generation guidance. Enable the matched runtime only when readers/writers safely support it.
7. Stage 7: full manual regression, matched performance comparison, fixes and final verification report. No automated tests/browser automation under current user instructions.

The stage-2 integration design must avoid a state where new V3 content is emitted through format-2 guards or parsed by untouched whole-document readers. Isolated foundation work may remain inactive until dependent runtime paths are ready. No historical-data migration or reset is required to make that boundary safe.
