Summary: Investigates the active V3 editor's remaining glitches and failure paths before further fixes; depends on the V3 phase contract, current owner/projection/rich-editor code, server body validation and the earlier header-spacing repair. This is a static audit with a manual reproduction checklist, not a claim of browser acceptance.

# V3 editor stability investigation — 2026-10-31

## Result and evidence boundary

The problems extend beyond spacing. This review identified **13 concrete code-level defects** and **7 additional risks or interaction gaps**. Five defects are P1 because routine actions can create unsavable content, an unreachable writing block, or content in the wrong scope. Eight are P2 interaction/rendering defects.

“Code-level defect” means the relevant caller, mutation, range handling and consequence were traced in the current source. It does **not** mean the browser reproduction has been executed. All reproduction steps below are pending manual execution. Exact visual sizes, event timing, IME behavior and performance have not been measured. A static investigation cannot establish that every possible glitch has been found.

This is a stage-6 review. No runtime source, data, dependencies or migrations were changed during this investigation. No automated tests, fixture runners, browser automation or performance traces were run. The earlier header fix is included in the audited code; its type/build passes do not establish interaction correctness.

Reviewed paths include root initialization and mode switches; native input and keyboard overrides; selections and clipboard; body/type conversion; rich widget deletion, focus, editing and history; column projections, framing and command routing; drag/linked transfers; upload anchors; save admission, server parsing and autosave recovery; and logical search/outline rendering. Office/package output, native Board editing and the complete security surface were not exhaustively audited here.

## Why the editor feels inconsistent

1. **Block identity and body syntax are checked separately.** The frontend can accept a body edit because IDs and delimiters remain valid, while the server later rejects the body for its declared type. The client has no equivalent type diagnostic at the time of that edit.
2. **There are several mutation paths.** Ordinary typing, checked owner operations, projected column edits and older rich-widget handlers do not consistently carry the same scope, selection and operation semantics.
3. **Hidden source boundaries still affect interaction.** A source position can simultaneously be the end of one body and the start of the next header. Some adapters still treat headers as ordinary preceding text or treat a zero-length source range as a usable writing block.
4. **The renderer still infers many visuals from Markdown.** An explicit heading ID/type does not make all lines in its body render as a heading. This conflicts with the approved internal-line behavior.

The recent patch removed two causes of ordinary header gaps and added a collapsed-header caret guard. It did not establish these broader invariants, and it does not fix the remaining column replacement gaps.

## Defect register

| ID | Priority | Defect | Primary consequence |
| --- | --- | --- | --- |
| F01 | P1 | Replacing selected heading/list content removes its required markers without changing its type | Save rejection after an apparently successful edit |
| F02 | P1 | Exiting a completely empty list leaves a blank list-typed block | Save rejection from a normal Enter action |
| F03 | P1 | Rich-frame Delete/Backspace still deletes raw body source instead of the identified block | Invalid saved type or a rejected deletion |
| F04 | P1 | Several add-paragraph paths create no editable line before the next header | Invisible/unreachable empty blocks and rejected typing |
| F05 | P1 | Rich-frame paragraph creation in a column uses the projection's root scope | Paragraph inserted outside the column or action rejected |
| F06 | P2 | V3 replacement adapters discard requested caret positions | Caret jumps after alignment/direction and empty-widget editing |
| F07 | P2 | Internal heading newlines render as ordinary paragraph content | Visual type changes inside one heading block |
| F08 | P2 | Up/Left from a first rich block finds its own hidden identity line | Focus returns to the same rich widget instead of escaping above it |
| F09 | P2 | Markdown prefix shortcuts only recognize an unwrapped body's first line | Styled text behaves differently from unstyled text |
| F10 | P2 | Block menu Copy writes only flattened plain text | Copy/paste loses block type, formatting and native metadata |
| F11 | P2 | Column layout replacements retain the old open-boundary configuration | Phantom caret lines and protected-position typing remain around layouts |
| F12 | P2 | Structural literal checks reject ordinary intermediate paragraph input | Characters disappear with a structural warning while drafting fences/math |
| F13 | P2 | Styled empty-paragraph Enter uses a legacy same-body edit | No new paragraph identity and a caret at the following boundary |

### F01 — Selected content replacement can make a heading/list unsavable

`v3SelectAllTransaction` selects from the text body's raw start, including heading/list markers. The first Ctrl/Cmd+A clears whole-block selection. Typing a replacement therefore follows native text input rather than an identified block replacement. The live filter checks structure and identities, not the required syntax of each explicit type. For example, replacing `# Title` with `New title` leaves a `heading-1` header around paragraph source. The server rejects that body.

Evidence: [selection start](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/editing/v3-block-selection.ts:117>), [live admission](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/editing/v3-live-structure.ts:53>), [server type check](</home/insayd/Desktop/My Projects/Orbium/app/Services/Markdown/V3/V3BodyTypeValidator.php:34>).

Manual trigger: create an H1, place the caret in it, press Ctrl/Cmd+A once and type a new title. Wait for autosave. Repeat in a bullet/checklist. Required result: replacement text remains a valid block and saves; no manual source repair should be needed.

Repair direction: define the visible editable range separately from required type markers; route replacements/deletions that consume those markers through a type-aware body operation. Client and server must agree on valid empty and nonempty bodies.

Related entry point: [initial root caret](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/markdown-editor.tsx:475>) still uses raw `bodyFrom`, rather than the visible start used by the recent header-selection helper. Include keyboard focus into a reopened heading-first document in this check; a metadata-only caret repair does not protect Markdown markers at the body start.

### F02 — Enter on the only empty list item leaves an invalid old block

The keyboard resolver chooses `exit-text` for an empty final list item. The planner removes that item's marker and inserts a paragraph, but keeps the original list header/type. When the list contained only the empty item, its remaining body is blank. Server validation requires a list node or a marker-only list body; blank source satisfies neither.

Evidence: [empty-item exit](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/editing/v3-keyboard-operations.ts:98>), [exit planner](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/editing/v3-text-edit-operations.ts:26>), [list validation](</home/insayd/Desktop/My Projects/Orbium/app/Services/Markdown/V3/V3BodyTypeValidator.php:37>).

Manual trigger: insert a Bullet list, Numbered list or Checklist using `/`, leave its first item empty, and press Enter. Wait for save. Required result: a usable paragraph and a semantically valid previous block, with one coherent undo action.

Repair direction: explicitly decide the identity/type lifecycle for an entirely empty list during exit. Preserve a valid empty representation, convert the block or remove it according to the agreed behavior; do not leave a blank list body.

### F03 — Rich-frame deletion bypasses the V3 block lifecycle

The rich frame's own key handler dispatches a raw deletion of `RichBlock.from..to`. Those are body/syntax-node coordinates, not the complete V3 block range. Deleting a fenced code body's source can leave a `code` identity with no code body. Directive-backed rich blocks can instead hit the protected-range filter and refuse deletion. This handler does not call the V3 delete operation.

Evidence: [rich key handler](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/rich/rich-block-selection.ts:189>), [rich body coordinates](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/rich/read-rich-block.ts:19>), [identified deletion](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/interactions/markdown-block-actions.ts:155>).

Manual trigger: insert a code block and focus its outer frame using its noninteractive frame or keyboard focus, rather than its code input. Press Delete, then repeat with a table or math block and with Backspace. Required result: delete the identified block, preserve surrounding content, and save successfully. Undo must restore the whole block.

Repair direction: share the identified deletion path with handles and menus, including final-column cleanup and the final-document paragraph rule.

### F04 — Add-block paths can produce a paragraph with no writing line

The gutter's Add block below command and rich-frame paragraph creation pass `body: ''`. `completeV3BlockSource` produces a header followed by one LF. `appendV3Insertion` sees that LF and adds no further separator. When another block follows, the source becomes `new-header\nnext-header\n...`: the new paragraph's `bodyFrom` equals `bodyTo` and the next header's start. Protected ranges can merge across that position, and the writing hint is placed at the next hidden header rather than on a real empty line.

Evidence: [gutter paragraph body](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/runtime/v3-product-commands.ts:125>), [source framing](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/transactions/v3-source-edits.ts:64>), [hint position](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/runtime/v3-empty-paragraphs.ts:30>), [protected range merge](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/editing/v3-live-structure.ts:28>).

Manual trigger: create two paragraphs and use the first paragraph's gutter + to add a block between them. Type immediately. Repeat with a rich frame between two text blocks. Required result: a visible, focusable empty paragraph with its own ID, and immediate visible typing.

Repair direction: make empty-block serialization and the live writing target consistent across gutter, slash Text, rich-frame insertion, imports and keyboard operations. Do not globally delete genuine body blank lines.

### F05 — Rich-frame insertion in columns uses the wrong parent

A column projection parses its child source as a local root document, so its local blocks have `parentId: null`. `createOrFocusRichParagraph` reads that local parent and calls `dispatchV3ProductOperation`, which forwards the operation unchanged to the owner. Unlike the column keyboard dispatcher, that adapter does not translate the target parent. With a following child, the owner's parent check rejects the target. With no following child, a null parent and absent `beforeId` means insertion at the end of the root document.

Evidence: [local parent lookup](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/rich/rich-block-selection.ts:50>), [unchanged owner dispatch](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/runtime/v3-product-commands.ts:59>), [contrasting correct keyboard translation](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/columns/v3/v3-column-projection.ts:101>), [owner insertion target](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/transactions/v3-source-edits.ts:50>).

Manual trigger: put a code/table block in a column, focus its outer frame and press ordinary Enter or type a character on the frame. Test with and without a following child. Required result: any new paragraph stays in that same column. Dedicated code-input Enter must still insert a code newline.

Repair direction: resolve identity/scope from the authoritative owner for every product command, or use one explicit projection-to-owner command adapter. Individual controls should not guess parent scopes.

### F06 — Replacement adapters ignore their caret arguments

The V3 branch of `replaceMarkdownBlock` drops the supplied `caret` argument. Its `replace-body` plan defaults focus to offset zero. Presentation controls calculate a content offset and pass it to this function, so alignment/direction can jump the caret to the beginning. Separately, `applyRichSource` ignores `selectionOffset` in its V3 branch. The styled empty-paragraph editor depends on that offset when handing focus back to the owner after the first character.

Evidence: [discarded caret](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/interactions/markdown-block-actions.ts:108>), [computed presentation caret](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/interactions/markdown-block-actions.ts:347>), [default replacement focus](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/transactions/v3-block-text-operations.ts:71>), [discarded rich offset](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/rich/widget-controls.ts:48>), [empty input handoff](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/rich/empty-widget.ts:17>).

Manual trigger: place the caret mid-paragraph, change alignment/direction, then type. Also apply alignment to an empty paragraph and type two characters. Required result: typing continues at the intended visible position, without entering wrapper syntax or moving to the beginning.

Repair direction: carry a body-relative caret/selection intention through replacement DTOs, including transitions between specialized inputs and the owner.

### F07 — Enter within a heading does not preserve heading styling

The heading Enter path inserts a newline without a heading continuation representation. The V3 dialect sends the body to the ordinary Markdown parser; `# First\nSecond` becomes a heading followed by a paragraph. Preview heading classes only cover the parsed heading node. The saved ID still declares the whole body to be a heading. Server validation only checks the first node, so this can save while looking inconsistent.

Evidence: [newline operation](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/editing/v3-keyboard-operations.ts:110>), [body parser selection](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/runtime/v3-markdown-dialect.ts:60>), [heading styling](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/preview/build-markdown-preview.ts:162>).

Manual trigger: type an H1 title, press Enter once, and type a second line; then do the same in the middle of a title. Required result: the approved internal-line heading style remains until an empty final line exits the block. Compare Live Preview, outline and export behavior.

Repair direction: represent/render multiline typed headings consistently in both client and server readers; do not infer the block's visual type independently for each Markdown node.

### F08 — A first rich block cannot reliably escape upward

`adjacentWritingPosition` scans raw nonempty source lines. Immediately before a first rich body's opening syntax is its own V3 header, so it reports that header as a writing position instead of reporting no preceding body. The recent header guard then redirects that selection back into the same rich body. The rich focus plugin can refocus the same widget. The existing create-paragraph-before fallback is never selected because the raw header made the search appear successful.

Evidence: [raw-line search](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/rich/rich-block-selection.ts:20>), [arrow handler](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/rich/rich-block-selection.ts:170>), [header normalization fallback](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/editing/v3-live-selection.ts:66>).

Manual trigger: make a code/table block the first block, focus its outer frame, and press Up or Left. Required result: an appropriate editable position/paragraph above the block, with no focus loop. Check the first rich child of a column as well.

Repair direction: navigate through identified sibling bodies rather than nonempty raw lines. Header normalization should be a safety net, not the rich navigation algorithm.

### F09 — Styled paragraphs lose Markdown prefix shortcuts

The prefix shortcut requires `line.from === block.bodyFrom`. In a paragraph with an alignment/direction wrapper, `bodyFrom` points to the directive opener, while the visible text starts later at the wrapper's content. Typing `# ` or `- ` there cannot reach the shortcut. The paragraph parser deliberately suppresses inferred heading/list nodes, so the prefix stays paragraph content instead of changing the explicit type.

Evidence: [first-line restriction](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/runtime/v3-typing-shortcuts.ts:14>), [wrapped content start](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/transactions/v3-text-body.ts:61>), [paragraph grammar](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/runtime/v3-markdown-dialect.ts:14>).

Manual trigger: apply alignment/direction to a paragraph, clear its text, and type a heading or list prefix. Compare with an unstyled paragraph. Required result: the same shortcut behavior with compatible presentation retained.

Repair direction: resolve shortcut positions against the checked editable content range and serialize presentation through the type change.

### F10 — Menu Copy does not preserve an Orbium block

The ordinary block menu writes `logicalMarkdownText(...).text` through `navigator.clipboard.writeText`. That discards Markdown marks, explicit types and presentation, and provides no native clipboard payload. The keyboard block-copy route instead writes the V3 MIME payload. The ordinary menu also does not use the selected ID range when constructing its copy.

Evidence: [menu copy](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/interactions/markdown-block-menu.tsx:119>), [native keyboard copy](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/editing/v3-live-editing.ts:151>), [native paste routing](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/editing/v3-editing-clipboard.ts:71>).

Manual trigger: copy a styled heading with bold text through its block menu and paste in another empty block. Compare with handle selection plus Ctrl/Cmd+C. Repeat after selecting multiple block handles. Required result: consistent block type, supported style and selected block order, with fresh IDs on paste.

Repair direction: share native block clipboard construction for menu and keyboard actions, retaining a readable plain-text alternative.

### F11 — Column widgets still create phantom boundary positions

Both creation and rebuilding of column decorations use `Decoration.replace({ block: true, inclusive: false })`. This is the open-start block replacement configuration addressed for ordinary identity headers by the previous repair. The column header is not hidden separately because the layout widget owns the whole range. A root caret at the layout header is normalized to the layout body opener, which is itself protected syntax; it is not an ordinary writing body.

Evidence: [layout replacement](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/columns/v3/v3-column-widgets.ts:99>), [header normalization fallback](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/editing/v3-live-selection.ts:49>), [protected directives](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/editing/v3-live-structure.ts:24>).

Manual trigger: put a two-column layout between two paragraphs. Click the blank boundary immediately before/after the grid and type; repeat with the layout first/last. Required result: normal spacing and an editable text target or intentional widget selection, never a directive caret with rejected typing. Exact gap heights remain unmeasured.

Repair direction: coordinate layout replacement boundaries with explicit before/after writing positions and projection focus; changing general CSS padding will not solve the invalid caret.

### F12 — Drafting literal-looking paragraph input can reject characters

The structural scanner enters literal mode for a standalone `$$` or a code fence regardless of a paragraph's explicit type, and rejects unclosed literals. The input adapter only handles the third backtick/tilde on the first raw body line. A second `$` on an empty paragraph, or a third backtick on a later line inside a paragraph, has no corresponding safe drafting path. The transaction fails structural validation before a user can finish the intended input.

Evidence: [limited drafting handler](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/runtime/v3-typing-shortcuts.ts:14>), [literal detection](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/structure/v3-structure-parser.ts:323>), [unclosed literal rejection](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/structure/v3-structure-parser.ts:346>).

Manual trigger: in a paragraph, type two dollar signs at the start of a line. In another paragraph add an internal newline and draft a three-backtick fence there. Required result: an intentional supported drafting/shortcut behavior or literal prose, without invisible rejected characters.

Repair direction: reconcile explicit paragraph grammar with structural scanning and all supported live drafting paths. Do not weaken closed code-container protection globally.

### F13 — Styled empty-paragraph Enter uses a legacy body append

The specialized empty-paragraph textarea handles ordinary Enter by appending two LFs to the same rich source and placing a raw caret at its end. It does not publish the V3 empty-final-line exit operation or create a sibling paragraph ID. If a next block follows, that end can coincide with its protected header. Shift+Enter uses the separate V3 capture path, so the two actions can behave inconsistently.

Evidence: [legacy Enter](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/rich/empty-widget.ts:24>), [Shift+Enter-only capture](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/editing/v3-live-editing.ts:166>).

Manual trigger: apply alignment to an empty paragraph before another block; focus its empty input, press ordinary Enter, then type. Compare Shift+Enter. Required result: the specified empty-final-line exit, a usable sibling paragraph and one undo action, with no source-boundary error.

Repair direction: adapt empty rich inputs to the same identified keyboard operations and selection handoff used for ordinary text.

## Additional risks and interaction gaps

These are not counted as browser-confirmed failures or as the 13 concrete defects above.

| ID | Risk / gap | Source evidence | Manual investigation |
| --- | --- | --- | --- |
| R01 | **Typing cost grows with the document.** The V3 dialect reads the full source and rebuilds the combined tree; mapped structure changes still map every block/directive. Column synchronization compares content character by character when the owner source object changes, even when a particular column's text is unchanged. No latency threshold or regression magnitude is established. | [full-source parse adapter](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/runtime/v3-markdown-dialect.ts:86>), [all-range mapping](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/structure/v3-structure-state.ts:71>), [column synchronization](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/columns/v3/v3-column-projection.ts:329>) | Compare small/large documents and many columns while typing, scrolling and changing selection. Measure before choosing an optimization. |
| R02 | **Visible rich input may differ from accepted source after a rejected write.** Code input updates locally before publishing to the owner; `applyRichSource` catches rejection and returns false, while callers display a generic stale-source message. There is no immediate rollback of the local input in that failure branch. | [input publication](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/rich/code-input.ts:125>), [caught rejection](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/rich/widget-controls.ts:54>), [caller error](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/rich/code-widget.ts:86>) | On disposable content, change owner availability or create a stale edit while a rich editor is open. Compare input, owner Source and save/reload. A failed write must remain clearly unsaved/recoverable. |
| R03 | **Upload anchors prove positions/text, not stable block identity.** The anchor stores an ID for the upload request, offsets and source text; completion resolves the block currently at those offsets. A zero-width anchor has no content evidence if its original block is replaced. Wrong-target insertion is a risk, not a reproduced failure. | [anchor shape/mapping](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/markdown-upload-anchor.ts:3>), [completion target](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/use-markdown-upload.ts:175>) | During a delayed upload, delete, replace or move its original block/column; also switch tabs and modes. Completion must target the original supported block or provide a recoverable reference instead of silently choosing a new block. |
| R04 | **Cross-document drag has linked undo but separate persistence.** Both owner edits are coordinated in memory. Each Document still autosaves independently; a later destination conflict/failure is not an atomic server transaction with the source save. | [paired move](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/runtime/v3-document-transfer.ts:51>), [per-document autosave](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/use-markdown-autosave.ts:56>) | Use disposable documents and a destination revision conflict. Verify the transferred block is recoverable if one document saves and the other does not. Do not equate linked undo with durable atomic saving. |
| R05 | **Server type validation checks the first effective node.** Later siblings are not checked against the declared type. A body can begin with the right kind and contain unrelated later structures. This already permits F07's mixed heading body, but the full effect on derived statistics, outline and export needs review. | [first-child validation](</home/insayd/Desktop/My Projects/Orbium/app/Services/Markdown/V3/V3BodyTypeValidator.php:30>), [body aggregation](</home/insayd/Desktop/My Projects/Orbium/app/Services/Markdown/V3/V3DocumentParser.php:42>) | Compare live rendering, saved type, outline, hosted preview and exports for multiline/mixed bodies. Agree which secondary body structures are valid. |
| R06 | **Nested editing/IME/history need real event validation.** Separate rich inputs and column projections publish to one owner through different guards. Rich body replacements are isolated history actions, while native column typing can group. Platform composition, blur and deferred synchronization can change observed behavior. | [composition tracking](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/editing/v3-composition.ts:21>), [history isolation](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/transactions/v3-transaction-plan.ts:255>), [composition deferral](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/columns/v3/v3-column-projection.ts:315>) | Use actual IME and mobile input in root, columns, code and math; test undo/redo, blur, tab changes and fullscreen editors. Check duplication, discarded text, caret restoration and per-character undo behavior. |
| R07 | **Several current restrictions feel like broken editing even when intentional.** Partial cross-block cut/delete/typing is rejected; structural commands reject multiple carets; cross-scope native clipboard paste can reject instead of using a supported fallback. Rejection notices can remain visible during later successful typing because the notice is not cleared by the normal update listener. These need explicit UX decisions, not blanket removal of protection. | [partial-cut restriction](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/editing/v3-live-editing.ts:137>), [multiple-caret rejection](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/transactions/v3-transaction-plan.ts:48>), [clipboard scope](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/editing/v3-paste-source.ts:173>), [normal update listener](</home/insayd/Desktop/My Projects/Orbium/resources/js/components/editor/markdown/markdown-editor.tsx:224>) | Select text across two bodies and try copy/cut/replacement; try second-stage Select All replacement; recover from a rejected action and continue typing. Record which behavior is intentional and make its feedback actionable and dismissible. |

## Manual acceptance checklist

Use disposable documents. For each case, record the document/block IDs, exact action, observed result, Source contents, save status and whether undo/reload changes the outcome. The “required result” describes acceptance after repair, not a result already observed in this audit.

| Check | Action | Required result |
| --- | --- | --- |
| M01 / F01 | H1, bullet and checklist → first Ctrl/Cmd+A → type replacement → save | Content/type remain coherent and save succeeds. |
| M02 / F02 | Insert each list type with `/` → leave first item empty → Enter → save | No blank invalid list body; exit is one coherent undo action. |
| M03 / F03 | Focus outer code/table/math frame → Delete and Backspace → undo | Complete identified block removed/restored, without orphan header or rejected action. |
| M04 / F04 | Two text blocks → first block's + → type into inserted block | New paragraph is visible/editable between the existing blocks. |
| M05 / F05 | Rich frame in column → ordinary Enter/type, with/without next child | Insertion remains in that column; dedicated input Enter stays local. |
| M06 / F06 | Caret mid-paragraph → alignment/direction → type; repeat on empty styled input | Caret intention survives both changes and input handoff. |
| M07 / F07 | H1/H2/H3 → internal Enter → type → empty-final-line exit | Heading style stays consistent until the explicit exit. |
| M08 / F08 | First rich frame → Up/Left; repeat in first column child | Escape above the widget works without a focus loop. |
| M09 / F09 | Styled and unstyled paragraphs → same heading/list prefixes | Identical supported shortcut semantics and retained compatible presentation. |
| M10 / F10 | Menu Copy vs keyboard block Copy → paste styled heading/range | Supported block styles/types/order survive, and copied IDs are fresh. |
| M11 / F11 | Layout between paragraphs and at document edges → boundary clicks/type | No phantom writing rows or protected-directive caret. |
| M12 / F12 | Draft `$$` and a code fence on an internal paragraph line | Supported input remains visible, without structural rejection of ordinary intermediate text. |
| M13 / F13 | Empty aligned paragraph before another block → Enter → type; compare Shift+Enter | Correct new sibling identity and usable caret, without raw-boundary insertion. |
| M14 / R01 | Small vs large/many-column document → type/scroll/select | Measure responsiveness; do not declare performance parity without evidence. |
| M15 / R02–R04 | Stale rich edit, delayed upload and conflicting destination move | Accepted source is clear and rejected/partially saved work remains recoverable. |
| M16 / R05–R07 | Mixed-body rendering/export, real IME, undo and multi-block selections | Consistent representations, no lost/duplicated input and understandable restrictions. |

Repeat repaired core cases in root documents, column projections and Board-hosted Documents, with light/dark themes and narrow panes. Save/reload and undo/redo are part of acceptance, not optional final checks.

## Recommended repair sequence

1. Repair F01–F05 first: semantic edit admission, empty-list exit, whole-rich-block deletion, writable empty-block framing and authoritative parent routing. Verify save/reload and identity preservation for each.
2. Repair F06–F09 and F13 together around one explicit visible-content/selection contract shared by root text, wrappers, rich handoff and projections.
3. Repair native menu clipboard and layout boundaries (F10–F11), then reconcile safe drafting and scanner rules (F12).
4. Manually validate composition, asynchronous rejection, linked persistence and large-document behavior. Resolve R07's intentional restrictions against the desired product interaction model.

Do not start another feature phase or choose a new editor framework solely from the number of symptoms. The concrete failure paths above should drive the stabilization decision. Retain raw source and block identities throughout repairs.

## Checks and commit suggestions

- Investigation performed through read-only source/document inspection. `git diff --check` passed after report preparation.
- No type/lint/build checks were rerun for this report-only investigation; no runtime source was edited. Earlier implementation check results remain in the header-gap report and are not reclassified as interaction passes.
- No automated tests, fixtures, browser automation, runtime reproductions, application data writes, staging or commits were performed. The report and its entry in `Docs/START_HERE.md` are the only repository edits from this audit.

Suggested commit for this report: `docs(editor): audit V3 stability defects and manual reproduction paths`.

Suggested later fix boundaries, not completed changes: `fix(editor): preserve valid typed bodies during replacement and exit`; `fix(editor): unify identified rich deletion and column routing`; `fix(editor): preserve writable empty blocks and caret intent`.
