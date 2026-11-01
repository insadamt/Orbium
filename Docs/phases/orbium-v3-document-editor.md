Summary: Defines the user-approved V3 editor refactor, its format and acceptance contract. It depends on the existing CodeMirror editor, document columns, Markdown services and repository phase gates.

Repository execution note (2026-10-31): the user requested “implement it all”. Follow section 12 one stage at a time, with explicit approval before advancing. The root `AGENTS.md` manual-testing instruction overrides the automated-test requirements in sections 11–13: do not write/run automated tests or browser automation. Run formatting, lint, type, build and whitespace checks. Stage 1 findings and manual baseline capture are recorded in `../reports/orbium-v3-stage-1-baseline.md`; the source integration map is `../plans/orbium-v3-integration-map.md`. Stage 2 was approved with “next” and stage 3 with “continue”; their isolated inactive foundations are documented in `../docs/25-v3-document-structure.md`, `../docs/26-v3-owner-transactions.md` and `../reports/orbium-v3-stage-3-transactions.md`. Stage 4 was approved with “okey continue”; its inactive editing extension, manual inspector and checks are documented in `../docs/27-v3-editing-ux.md` and `../reports/orbium-v3-stage-4-editing.md`. Stage 5 was approved with “continue”; identified column transactions, owner projections and the opt-in surface are documented in `../docs/28-v3-columns.md` and `../reports/orbium-v3-stage-5-columns.md`. Stage 6 was explicitly approved with “continue but make now the new editor who works instead of the v2”. The active product now uses matched V3 editing, saved format 3 and native V3 transfer, described in `../docs/29-v3-active-editor.md` and `../reports/orbium-v3-stage-6-active-editor.md`. Stop for stage-6 review before stage 7. The original specification below is retained, including its historical status line.

---

Stage-6 scope amendment (2026-10-31): the user explicitly requested a new non-editable empty-space block after reporting leftover blank rows and repeated writing prompts. This authorizes the additive `spacer` type, empty-paragraph Enter → spacer plus fresh paragraph, and removal of abandoned empty writing rows. It supersedes the original prohibition on new block types only for this specific spacing behavior. Saved/native version 3 remains, with additive `spacers: 1` client capability and stale-client save protection. See `../reports/orbium-v3-spacer-blocks.md`; remain in stage-6 review.

Stage-6 follow-up interpretation (2026-10-31): after the user again reported an attached empty row and Enter blinking, the repair makes paragraph-end Enter open a separate writing paragraph immediately, while keeping internal Enter when text follows the caret. The original paragraph-end rule below is historical for this specific case; heading/list/dedicated editor rules remain. A preference question was presented, but this implementation choice was made without a reply and is stated explicitly for manual review. Ordinary text/Enter/cleanup must not use document-wide block-move fades. Follow `../reports/orbium-v3-enter-row-and-blink.md`.

Stage-6 writable-spacing amendment (2026-11-01): the user explicitly requests “make empty block can be write in it”. This supersedes the non-editable interaction requirement above. A blank spacer accepts text through a native input and becomes an identified paragraph on first ordinary text, preserving its ID; structured Markdown paste uses the existing checked paste operations. Focus alone does not change or remove spacing. Saved spacer bodies remain whitespace-only and existing persistence capability guards remain. Follow `../reports/orbium-v3-writable-spacers.md`; remain in stage-6 review.

Stage-6 empty-row layout repair (2026-11-01): the user requests correction of empty-block glitches and writing-hint alignment from three screenshots. Empty and filled paragraphs now share their measured frame; writable spacers use inherited line metrics instead of a fixed 24 px height; the hint contributes no editable DOM geometry. Dedicated rich focus updates the logical body caret without moving native focus, allowing existing abandoned-row cleanup. Empty controls resolve their own line/spacer identity. No saved-format or Enter-rule changes. Follow `../reports/orbium-v3-empty-row-layout.md`; remain in stage-6 review.

# Orbium V3 — Document Editor Refactor Specification

**Status:** Approved product decisions; implementation not started\
**Date:** 2026-10-30\
**Target:** Existing Orbium application, `main` branch\
**Suggested repository location:** `Docs/phases/orbium-v3-document-editor.md`\
**Purpose:** Refactor the *existing* CodeMirror-based document editor to have reliable, independent, persistent blocks without rebuilding its interface or changing unspecified behavior.

> **Governing rule:** Only the changes explicitly described in this specification are authorized. **Everything else must work and look as it does in the current editor.** This is a targeted refactor, not a new editor, redesign, or feature expansion.

---

## 1. Goals and rationale

The current editor is fast compared with the former Tiptap implementation, but some operations derive block boundaries and types from a shared Markdown/Lezer syntax tree. Adjacent structures can accidentally influence one another. Observed examples include a bullet list changing or disappearing after a nearby checklist is inserted, and unintended interactions between dividers, styling directives, and other Markdown constructs.

V3 must:

1. Make each block's **identity and type explicit**, rather than inferring its identity/type solely from surrounding Markdown.
2. Ensure operations on a block **cannot silently corrupt unrelated blocks**.
3. Retain the performance advantages of the **current CodeMirror editor**.
4. Implement the **specific keyboard, selection, paste, and merge rules agreed below**.
5. Retain the current editor's **visuals, animations, rendering, interactions, plugins, and UX** outside those explicit changes.
6. Keep the native `.orbie` format human-readable as extended Markdown.

**Out of scope:** A new editor engine, moving back to Tiptap, a new UI design, new block types, nested columns, arbitrary recursive block nesting, collaboration, and compatibility migrations for prelaunch V1/V2 documents.

### Prelaunch compatibility decision

Orbium has **not launched**. The user explicitly waived backward compatibility for old development-only documents. Do **not** build a V1/V2-to-V3 migration or a permanent legacy-adapter layer solely for old documents. Old development data may be reset. This exception **does not** authorize deleting existing product capabilities, APIs, media handling, export options, or preserving less data within newly created V3 documents. Unsupported old files should fail clearly rather than being silently misparsed.

---

## 2. Preserve the current product and editor

Do not start from scratch. Reuse the existing React, TypeScript, CodeMirror, Markdown dialect, rich-block widget, and UI architecture. Extend or refactor existing modules where necessary.

### Explicit preservation requirements

- **UI/UX:** Existing editor appearance, spacing, typography, themes, frosted surfaces, controls, focus behavior, placeholders, tooltips, and responsive behavior.
- **Editing:** Existing features and block types; inline formatting, icons, colors, links, mentions, attachments, image controls, tables, mathematical expressions, Mermaid, Mind Maps, and other current rich features.
- **Modes:** **Live Preview and Source Mode retain their current interaction models.** V3 must adapt the underlying representation, not redesign those modes.
- **Motion:** Existing GSAP/CSS animation patterns, durations, easing, animated handles, block motion, drag previews, insertion indicators, moving menu highlights, selection toolbars, image toolbars, table reordering, and reduced-motion behavior.
- **Drag/drop:** Current grip interaction, drag creation of columns, reorder/move, auto-scrolling, accurate targets, viewport anchoring, split-pane behavior, and cancel/cleanup semantics. Extend where newly approved multi-block behavior requires it.
- **Columns:** Existing resize interactions, equal widths, 2/3-column presentation, responsive stacking, width redistribution, and auto-dissolution rules.
- **Data lifecycle:** Existing authorization, uploads, autosave, undo/redo, linked view and hosted document behavior, imports/exports, and asset/reference handling, adapted for V3.
- **Performance:** Retain incremental/viewport-focused rendering and existing optimizations. Avoid new lag, UI freezing, unnecessary remounts, or full-document work on each keystroke.

### Known implementation areas to inspect and adapt

These paths are **starting points, not a mandate to replace the modules**:

| Responsibility | Existing source |
|---|---|
| Owning editor | `resources/js/components/editor/markdown/markdown-editor.tsx` |
| Block range operations | `.../interactions/markdown-block-actions.ts` |
| Block wrappers | `.../interactions/markdown-block-wrappers.ts` |
| Block drag controller | `.../interactions/markdown-block-drag-controller.ts` |
| Block movement animations | `.../interactions/markdown-block-motion.ts` |
| Handle movement animations | `.../interactions/markdown-block-handle-motion.ts` |
| Transfer and linked history | `.../interactions/markdown-block-transfer.ts` |
| Writing shortcuts | `.../preview/markdown-writing-commands.ts` |
| Container exit behavior | `.../preview/markdown-container-exit.ts` |
| Slash commands | `.../markdown-slash-commands.ts` |
| Column parsing/serialization | `.../columns/column-source.ts` |
| Column editor | `.../columns/column-editor.ts` |
| Column owner writes | `.../columns/column-commands.ts` |
| Markdown dialect/metadata | `.../dialect/markdown-dialect.ts`, `.../dialect/metadata.ts` |
| Table row/column animations | `.../rich/table-drag-motion.ts` |

Existing source shows that column changes can currently reserialize a complete layout. V3 should prefer **targeted child-block edits** so one child edit does not unnecessarily rewrite unrelated children; preserve the current visible column editor UI and single-owner history semantics.

---

## 3. The V3 document format

V3 uses **three layers**:

1. **`++block` structural header:** Explicit, persistent block ID and type. It owns block identity and boundaries.
2. **Optional `:::orbium` presentation or rich-feature directives:** Existing Orbium-specific metadata and feature syntax; **not** a second block identity/type system.
3. **Markdown body:** Content, including inline formatting, list items, code fences, and supported extended Markdown.

### 3.1 Document envelope

A native `.orbie` file remains UTF-8 text with an explicit format version. For newly authored V3 documents, use a version-3 envelope:

```md
<!-- orbium-document {"version":3,"title":"Example"} -->

++block {"id":"b1","type":"paragraph"}++
Hello world.

++block {"id":"b2","type":"bullet-list"}++
- First bullet
- Second bullet

++block {"id":"b3","type":"checklist"}++
- [ ] First task
- [x] Second task

++block {"id":"b4","type":"divider"}++
---
```

`b1`, `b2`, etc. are **illustrative IDs**; production IDs must be collision-resistant and stable. The single-file `.orbie` envelope, persisted body format, editor's capabilities/version guards, and associated serializers/validators must be updated **consistently**. Existing database `content_format_version` and `.orbie` header version are distinct implementation concerns; do not inadvertently leave V3 data routed through a legacy format-2 parser.

### 3.2 Header contract

A block begins at a standalone structural line:

```text
++block {"id":"<persistent-id>","type":"<explicit-type>"}++
```

- Required: exactly one nonempty `id` and a recognized `type`.
- Metadata must be valid JSON; header is one line.
- Each block ID is unique throughout the document, including children of columns.
- **No `++endblock` marker.** A block ends at the next sibling `++block`, its containing column's closing directive, or end of document.
- The structure parser must be **scope-aware** and recognize literal/code contexts. A line such as `++block {...}++` inside a fenced code block, escaped source, or another opaque rich payload **must not** start a new structural block.
- An empty block is valid and must not be lost because its Markdown body is blank.
- Header recognition must be deterministic and independent of the Markdown list/heading/parser ambiguity that V3 is intended to eliminate.
- Structural headers are editor-owned in Live Preview; Source Mode keeps its existing raw-source editing behavior. See §8.

**Type is authoritative.** Markdown syntax controls the block's body rendering within that type; it must not implicitly change the block type. A neighboring `- [ ]` must not convert an explicit `bullet-list` block into `checklist`, and `---` in a `divider` must not accidentally change the preceding paragraph into a heading.

### 3.3 Optional Orbium metadata

Keep the existing Orbium dialect for appearance and rich features. Example:

```md
++block {"id":"b5","type":"paragraph"}++
:::orbium {"kind":"block","align":"center"}
Centered paragraph with **bold text**.
:::
```

The `++block` header owns the ID and type; `:::orbium` owns presentation or feature-specific data. Do not duplicate `id`/`type` as competing authorities in presentation metadata. Preserve current color, alignment, direction, captions, rich attachments, inline icons, etc. through the V3 parser and serialization pipeline. Reuse the existing directive fence strategy, including selecting fence lengths that cannot close nested bodies accidentally.

### 3.4 Block type categories

**Content blocks:** paragraph, headings, bullet list, numbered list, checklist, quote, callout, divider, code, Mermaid, math, table, media/file, Mind Map, and **all other existing supported types**. Use the exact canonical names the implementation formalizes; the names in this document are illustrative where existing code may use a different identifier.

**General-purpose container block:** `columns`, **only**. There is no approved general recursive container schema.

**List unit:** An entire bullet/numbered/checklist is **one block**. List items, including nested list items, are **internal structure**, not separately ID'd Orbium blocks.

**Quote/callout:** Keep their existing internal rich/Markdown presentation, but do not introduce independently addressable child `++block` nodes inside them.

---

## 4. Column layout structure

Columns are a special **container block** whose two or three columns contain ordinary child blocks. The column layout, each column, and every child block have stable IDs.

### 4.1 Canonical example

```md
++block {"id":"layout-1","type":"columns"}++
:::::orbium {"kind":"columns","version":1,"widths":[5000,5000]}

::::orbium {"kind":"column","id":"col-1"}

++block {"id":"b10","type":"heading-2"}++
## Left Column

++block {"id":"b11","type":"paragraph"}++
This is the left content.

::::

::::orbium {"kind":"column","id":"col-2"}

++block {"id":"b12","type":"heading-2"}++
## Right Column

++block {"id":"b13","type":"checklist"}++
- [ ] First task
- [ ] Second task

::::

:::::

++block {"id":"b14","type":"paragraph"}++
This is outside the column layout.
```

The outer `columns` block closes at the end of its `:::::orbium` directive; the following `++block` is a **top-level sibling**. A `++block` inside a column is a **child**, not a sibling of the container. A column's closing delimiter also closes its current child block. The parser must respect these scopes, including dynamic directive fence lengths.

### 4.2 Column rules

- **Maximum three columns; minimum two** while a layout exists.
- **No nested column layouts.** Existing rejection of nested columns remains.
- Persist column IDs, child block IDs, order, and width proportions.
- Use existing normalized widths (integers totaling `10000`, each at least `1500`); retain existing resize UI and behavior.
- Move child blocks into, between, or out of columns **without changing their IDs**.
- Dragging an ordinary block beside another can create a layout; preserve existing drag/drop interaction and animation.
- If a column becomes empty after moving/deleting its last block, remove that column automatically. Rebalance surviving widths proportionally.
- If only one column would remain, dissolve the container and promote its children back to ordinary document blocks, preserving child IDs and content.
- Maintain the current responsive behavior: narrow panes visually stack columns without changing the saved width proportions.
- Undo/redo of moves, resizing, column removal and dissolution restores the complete hierarchy, IDs, and widths.
- The stable column ID belongs to the `column` directive; it is not an additional general-purpose `++block` type.
- Creation/editing may have a transient empty column; successful structural operations must follow the established empty-column cleanup behavior.

---

## 5. Block identity and lifecycle

Block IDs are **persistent in the document**, not regenerated on load. Keep an ID when editing, converting, or moving that block. Generate new IDs on creation, duplication, or paste-as-new-block.

| Operation | Identity rule |
|---|---|
| Create block | New ID |
| Edit text or styling | Keep ID |
| Change block type | Keep ID |
| Reorder/drag within or between columns | Keep ID |
| Duplicate | New ID for every duplicated block and nested child |
| Copy/paste block | New IDs for all pasted block identities |
| Merge blocks | Keep the surviving earlier block's ID |
| Split a block | Earlier part keeps ID; new part gets a new ID |
| Delete block | Retire its ID from the active document |
| Undo/redo | Restore/reapply the **same IDs** from the original transaction |
| Dissolve columns | Keep surviving child IDs; remove the obsolete container/column IDs |

Generate IDs with a robust collision-resistant method (for example, UUIDs). Internal copy/paste must remap every relevant identity, not only top-level IDs. Existing references and features using document IDs or attachment IDs must **not** be conflated with block IDs. Source edits that create duplicates/invalid identities must receive a clear validation error; do not silently discard content.

---

## 6. Keyboard and text-editing behavior

**Priority rule:** The following custom behavior overrides Notion. For **all other text/navigation shortcuts and editing interactions**, retain the current editor's features and adopt the established, natural Notion-style editing semantics where the V3 block model requires adaptation. Do not redesign unspecified shortcuts.

### 6.1 `Enter`

**Ordinary text/content editing:** Enter continues within the same block. On an **empty final line**, pressing Enter exits that block and creates a new paragraph block below it. This is a **content/position rule**, not a double-tap time window; slow presses work the same.

- In a paragraph, one Enter adds an internal new line; pressing Enter again while on the empty final line creates the next paragraph block.
- Headings, quotes, callouts, and other text-editable blocks follow the same internal-line / empty-final-line exit rule, with their existing visible style maintained until the user exits.
- In a bullet/numbered/checklist, Enter creates the next item inside that **same list block**. Enter on the empty **final list item** exits the list and creates a new paragraph block.
- Preserve existing rich block-specific editing controls and formatting wherever the agreed Enter behavior does not replace them. Do not make literal code editors exit on Enter.
- In embedded code, Mermaid, math-source, or other dedicated inner editors, **Enter always inserts a normal editor newline**. Blank lines are valid content and **never implicitly exit** the embedded editor.
- At the middle of a block, Enter must not silently generate an unrelated block or delete text after the caret. Preserve the current block-specific Markdown/formatting semantics where not explicitly overridden.

### 6.2 `Shift + Enter` — universal new-block shortcut

**From every block type**, Shift + Enter creates a **new paragraph block immediately after the entire current block**, irrespective of whether the caret is at the beginning, middle, or end.

1. Leave the original block's content and ID **unchanged**; do **not** split at the caret.
2. Insert a new sibling paragraph with a fresh ID **after** the current block.
3. Move keyboard focus/caret into the new paragraph.
4. Inside an existing column, create the paragraph in that **same column**, after the current child; do not leave or destroy the layout.
5. In code/Mermaid/math and other embedded editors, intercept Shift + Enter and delegate the new-block operation to the owning document; **do not** insert a literal newline in the embedded source.
6. For `columns` as a whole and other non-text/rich blocks, resolve the current structural location and insert a paragraph after that block; never insert in an arbitrary nested sub-editor or corrupt the container.
7. One shortcut = one undoable transaction, including focus and structural consequences.

**Examples:** `|Hello`, `Hel|lo`, and `Hello|` all become the original unchanged `Hello` block followed by a new empty paragraph. They do **not** become two halves of `Hello`.

### 6.3 Backspace, Delete, and other editing shortcuts

Use natural **Notion-style text behavior**, except where our shortcuts above override it.

- Normal Backspace/Delete within a block edits only intended content.
- At the start of a non-paragraph text block such as a heading, list, checklist, or quote, **first Backspace converts the current block into a paragraph** (retaining its ID and content). Another Backspace at the beginning can merge with the preceding compatible block. Conversion and merge are **separate undoable user actions**.
- At the start of a paragraph, Backspace may merge it with the preceding compatible paragraph; the surviving earlier block keeps its ID.
- Removing an empty paragraph block focuses the preceding block, matching ordinary editor expectations.
- Forward Delete at boundaries follows analogous natural content-preserving behavior.
- Never flatten or destroy opaque rich data (code widgets, Mermaid, media, attachments, tables, Mind Maps, etc.) solely to satisfy an automatic merge. For these, retain existing safe behavior unless a lossless, explicit conversion exists.
- If list-to-paragraph conversion is needed, preserve all list-item content (including nested items and checkbox meaning in a readable representation); never discard later items or their text.
- Preserve standard word deletion, cursor movement, text selection, IME/composition handling, and platform conventions, except our expressly defined shortcuts.
- Structural markers must not become accidentally editable or removable through normal Live Preview text deletion.

**Do not interpret “Notion-style” as authorization to replace Orbium's menus, design, motion, or established shortcuts.** It describes *text-editing semantics* only.

---

## 7. Selection, clipboard, and drag/drop

### 7.1 Selection

- Click and drag within text: standard text selection.
- Click block drag handle: select that whole block.
- Shift+Click: extend to a consecutive block range.
- `Ctrl/Cmd + A` inside a block: select that block's content; press again to select document content, following the agreed two-stage selection model.
- Support selecting multiple consecutive blocks for copy, cut, delete, and drag, preserving order.
- Respect existing focus, toolbars, formatting selection, keyboard accessibility, and split-pane boundaries.

### 7.2 Paste (approved option A)

| Incoming clipboard content | Result |
|---|---|
| A single ordinary paragraph | Paste inline into the focused block as appropriate |
| Several paragraphs | Create **separate paragraph blocks**, not one giant block |
| A bullet or numbered list | Preserve as a correctly typed list block |
| A checklist | Preserve checkbox states and list structure |
| Code or a paste inside an embedded code editor | Preserve literal code, formatting, and line breaks; do not interpret code lines as blocks |
| Blocks copied from Orbium | Preserve supported block types, style, metadata, and content; assign fresh IDs |

- Pasting several paragraphs within an existing block must preserve text before/after the selection and keep deterministic cursor/identity behavior; do not overwrite unrelated block bodies.
- Apply paste as **one undoable transaction**.
- When pasted into a column, create resulting blocks in that column unless an existing explicit move action is used.
- Keep existing attachment security/reference handling; reassign block IDs, not unrelated media or page identities.
- Plain `.md` imports, where supported, should be normalized into V3 blocks using the same structural semantics; `.orbie` imports preserve explicit valid V3 structure.

### 7.3 Block drag/drop

- Move one block or a consecutive selection of blocks; multi-block drag preserves relative order.
- Moving a list moves the **whole list block**, not one item.
- Move blocks among ordinary flow and existing columns using the current drop surfaces and indicators.
- Moving preserves block IDs, content, style, rich metadata, and references.
- Preserve the current animated drag preview, insertion line, edge scrolling, source dimming, smooth placement, cancel/Escape behavior, split handling, and reduced-motion path.
- Invalid destinations must cancel cleanly without content loss or partial writes.
- All affected structural changes, including automatic removal/dissolution of columns, must be atomic in the owner's undo history.

---

## 8. Live Preview and Source Mode

**Both modes must behave as they do today.** Do not replace their current visual and interaction models.

**Live Preview**

- Hide structural `++block` headers and appropriate directive syntax from the rendered reading/editing surface.
- Treat header/delimiter spans as structural/atomic for user-facing caret, selection, Backspace, Delete, drag, and clipboard actions.
- Preserve existing block handles, Live Preview widgets, rich editors, inline formatting, rendering and animations.
- Use explicit block IDs/types to drive block boundaries, even where the Markdown syntax tree would previously have merged adjacent structures.

**Source Mode**

- Retain the existing raw-source editing experience (including its present keyboard and visual behavior); do **not** introduce a redesigned restricted source editor.
- Display the real canonical V3 source, including headers and directives, as raw source.
- Users can edit raw text as they do now. Changes must be validated and reinterpreted safely; report malformed structural syntax rather than silently dropping blocks. Preserve valid untouched content through source/live switches.
- Do not automatically rewrite every header or restyle the entire document on every keystroke.

**Source vs Live Preview switch:** Never lose IDs, metadata, empty blocks, cursor intent, history, or unsupported-but-valid current rich content due to repeated switching.

---

## 9. Internal architecture and transaction contract

### 9.1 One authoritative owner document

Keep the **existing owning CodeMirror document** as the single authoritative text/history state, not one CodeMirror instance per ordinary block. Existing dedicated/nested editors (column bodies, code/Mermaid/math source editors, table cells, etc.) may remain **as present UI implementation details**; their writes must integrate safely into the owning document and history. Do **not** replace every block with a separate React-mounted editor.

### 9.2 Structural block registry / index

Introduce or refactor a focused, incremental **structural index** over the V3 document. Minimum useful information per block:

- `id`, `type`, owning parent (`document` or specific column ID), and sibling order;
- source range for the structural header, editable body, and complete block;
- associated presentation/rich directives and nested column boundaries;
- location in the owning CodeMirror state (range mapping through changes);
- validity/error state when Source Mode contains incomplete syntax.

The registry is a **derived editor structure**, not a second independent persistent document source of truth. Make lookups by ID/range efficient; preserve the last valid view safely while users type incomplete raw syntax, without hiding or losing actual edited source. Parser must be **code-fence aware, scope aware, and directive aware**.

### 9.3 Atomic edits

All structural operations should flow through a small, testable transaction layer: create, insert, convert, split, merge, delete, duplicate, move, paste, change hierarchy, and column dissolution.

For every transaction:

1. Validate the block identity, permissions/editability, source state, destination, and current selection/composition state.
2. Calculate precise source edits using structural boundaries; **never infer a whole-block edit solely from an adjacent Lezer Markdown list/heading node**.
3. Preserve unaffected blocks' bytes, IDs, metadata, and children wherever possible.
4. Apply one atomic owner transaction, with coherent selection/focus and the existing history/autosave semantics.
5. Re-map the registry and refresh only affected views/widgets/ranges.
6. Trigger the **existing** motion system with correct before/after geometry, preserving scroll position and cleanup.

Operations across hosted views/split document editors must retain existing linked-history and permission semantics. Do not create conflicting independent histories inside child editors.

### 9.4 Parsing and performance

- Avoid whole-document reparsing, DOM reconstruction, or reserialization for ordinary single-block keystrokes.
- Do minimal range updates where safe; re-evaluate larger scopes for genuinely structural changes (e.g., column creation/dissolution).
- Preserve CodeMirror viewport rendering, deferred rich widgets, current animation scheduling, and scroll stability.
- Structural metadata must remain stable under formatting changes and inline markdown edits.
- The parser must not treat header-looking text inside code, literal rich payloads, or escaped content as structure.
- Do not add unrelated dependencies or a new editor framework.
- Benchmark typing, selection, large paste, block movement, scrolling, source/live switching, and columns against the current editor; **no unverified performance claims**.

---

## 10. Serialization, exports, and integration

V3 is the canonical native document representation. Update all parsing/serialization touchpoints together: frontend, backend validation, API save/read, import/export, previews, document outline, statistics, search, mentions, asset discovery, hosted document cards, columns, and supported document transfer workflows.

- **Native `.orbie`:** Preserve valid V3 headers, IDs, content, directives, and column hierarchy.
- **Standard Markdown (`.md`):** Export readable Markdown **without `++block` headers**. Flatten columns in existing reading order; preserve current fallback semantics for rich blocks.
- **Word/PDF and other existing exports:** Keep their UI and readable-output semantics; block headers must never appear as visible document text.
- **Copy as plain text:** No raw block headers unless the user explicitly copies raw Source Mode text according to current behavior.
- **Imports:** Create valid V3 block identities for Markdown; accept valid V3 `.orbie`; no old V1/V2 compatibility work is required.
- **References and assets:** Search, mentions, links, attachments, image IDs, inline icons, rich content and relationship tracking inside column children must continue working.
- **Security:** Preserve existing validation, authentication, authorization, sanitized rendering, file upload, and archive safety requirements.

The user waived backward compatibility **only for unpublished historical documents**, not the features or integrity of newly authored V3 documents.

---

## 11. Regression and acceptance checklist

The following are **required implementation acceptance criteria**. Preserve existing test and quality standards documented by the repository; this specification is not an instruction to skip tests.

### Structure and content integrity

- [ ] Every new ordinary/rich block has exactly one persistent ID and explicit type.
- [ ] Adjacent bullet list + checklist never merge or alter one another without an explicit action.
- [ ] `---` in a divider block never turns an unrelated paragraph into a setext heading.
- [ ] Existing custom text colors, alignment, direction, underline, and Orbium directive metadata survive edits, reordering, save/reload, and source/live switching.
- [ ] Header-like text inside code/Mermaid/math/literal regions is **not** recognized as `++block` structure.
- [ ] Empty blocks survive source round-trips and ordinary editing.
- [ ] Malformed or duplicate block headers fail safely without silent content loss.
- [ ] Repeated save/load and import/export preserve valid V3 source and identity semantics.

### Keyboard and text editing

- [ ] Enter inside a paragraph, heading, quote, or callout makes an internal line; Enter on its empty final line creates a separate paragraph block without corrupting formatting.
- [ ] Enter continues list items within the same list block; Enter on the empty final list item exits to a paragraph.
- [ ] Enter inside code/Mermaid/math embedded editors inserts ordinary newlines, including repeated blank lines.
- [ ] Shift+Enter from the **start, middle, and end** of a block inserts a new paragraph **after the whole block**, leaving original content unchanged.
- [ ] Shift+Enter works inside embedded editors and column child blocks; focus moves into the newly inserted paragraph.
- [ ] Backspace at the start of a heading/list/quote follows the agreed **convert-to-paragraph first, merge later** semantics without losing content.
- [ ] Backspace/Delete, word editing, IME, selection, and text formatting are natural and do not expose/delete structural headers in Live Preview.
- [ ] Undo/redo restores exact content and IDs for conversion, creation, merge, paste, move, and column dissolution.

### Selection, paste, and drag/drop

- [ ] Block handle selects the block; Shift+Click selects consecutive blocks; repeated Ctrl/Cmd+A follows the agreed selection stages.
- [ ] Pasting multiple external paragraphs creates separate blocks in a single undo step.
- [ ] Pasting internal blocks regenerates IDs while preserving content, styles, rich metadata and checklist states.
- [ ] Dragging one/multiple selected blocks preserves order/IDs and retains the existing preview, indicator, animations, auto-scroll, and cancellation behavior.
- [ ] Moving rich/list blocks does not flatten source or detach images/files.

### Columns

- [ ] Two or three columns work; four and nested columns remain unsupported.
- [ ] Layout, column and child IDs survive reorder, resize, save/reload, and export.
- [ ] Moves between/outside columns preserve child IDs and metadata.
- [ ] Removing an empty column rebalances proportions; one survivor dissolves the layout and promotes its blocks intact.
- [ ] Column UI, resizing, responsive stacking, drag-to-create, animations and hosted/split views work as before.

### Visual, integration, and performance

- [ ] Existing menus, moving highlights, toolbars, block handle transitions, GSAP motion, table animations, and reduced-motion paths remain visually consistent.
- [ ] Live Preview and Source Mode retain their current behavior except for required structural adaptations.
- [ ] Existing document search, outline, mentions, images, exports, hosted board documents, autosave, and read-only permissions remain functional.
- [ ] Large-document typing, scrolling, rich rendering, block moves, and source/live switching show no material regression versus the current editor.
- [ ] No orphan motion snapshots, leaked event handlers, duplicated editors, misplaced caret, or jumps after undo/redo, drag cancellation, tab/split switching, or reduced-motion changes.

### Verification commands (subject to the repository's actual available scripts)

```bash
./vendor/bin/pint --test
php artisan test
npm run types:check
npm run lint
npm run test
npm run build
git diff --check
```

Add focused unit/integration/browser tests for the structural parser, ID lifecycle, transaction rules, Source Mode round-trips, keyboard overrides, selection/paste, and column hierarchy. Compare large-document performance before/after. Report commands actually run, results, known limits, and a manual validation checklist. Do not report passing behavior without testing it.

---

## 12. Implementation order for Codex

The following order reduces risk while preserving the working editor. **Each step is an internal implementation stage, not permission to redesign the UI or add unapproved features.** Follow the repository's phase/commit discipline and get the user's approval before advancing phases.

1. **Baseline and regression map:** Inspect current editor, capture existing animation/interaction behavior and performance, map frontend/backend storage and exports, and identify parser-coupled operations.
2. **V3 syntax and validation:** Introduce explicit block headers, ID/type validation, code-fence-safe/scoped parsing, the V3 `.orbie` envelope, and a source-range structural index, with round-trip tests.
3. **Transaction foundation:** Adapt create/convert/merge/split/delete/duplicate/move operations to stable IDs and isolated, undoable source changes; preserve unaffected bytes and existing motion hooks.
4. **Editing UX:** Implement only the approved Enter, Shift+Enter, Notion-style boundary semantics, selection, and multi-paragraph paste. Preserve all unspecified shortcuts.
5. **Column integration:** Introduce layout/column/child identity, integrate scope-aware block indexing and targeted child edits, retain column controls/animations, implement deterministic dissolution.
6. **Feature integration:** Adapt existing rich blocks, Live Preview/Source Mode, search, mentions, outline, attachments, exports, hosted documents, autosave, and backend guards without redesign.
7. **Regression/performance hardening:** Run code/tests/build, execute the full manual checklist, compare performance against baseline, fix discovered regressions, and provide one consolidated task commit where appropriate.

**Stop condition:** Do not call V3 complete until the original source corruption cases are reproducibly fixed **and** preserved editor behaviors pass regression review.

---

## 13. Explicit boundaries and interpretation

1. **No redesign.** Do not alter the current UI, motion language, or non-overridden editor interactions in the name of simplification.
2. **No premature migration project.** Prelaunch V1/V2 document compatibility is unnecessary. Keep current V3 feature integration and safe import/export semantics.
3. **No one-editor-per-block architecture.** One owning CodeMirror document; retain existing specialized embedded editing surfaces where appropriate.
4. **No arbitrary nesting.** Columns are the only general container, with **at most three** columns. Lists remain one block containing list items; callouts/quotes remain content blocks.
5. **No silent restructuring.** `++block` determines block identity and type. Only explicit conversions/transactions change them.
6. **No shortcut drift.** Enter / Shift+Enter are Orbium's approved custom rules; otherwise respect the present editor and natural Notion-like text editing.
7. **No accidental content loss.** If a corner case cannot be implemented losslessly, fail safely and make it visible rather than flattening/deleting rich content.
8. **Source Mode remains Source Mode.** Do not substitute an unrequested protected visual source editor.
9. **Animations are part of compatibility.** Preserve current drag, table, menu, toolbar, handle, and reduction-of-motion behavior.
10. **Evidence over assumption.** Measure performance and verify functionality with tests and manual acceptance, particularly for complex source and columns.

### Final principle

> **Keep the Orbium editor users already know. Replace the fragile block interpretation with stable V3 structure, reliable transactions, and only the explicitly approved UX changes.**
