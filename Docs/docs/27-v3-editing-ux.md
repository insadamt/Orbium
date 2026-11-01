Summary: Explains the inactive stage-4 keyboard, selection and paste implementation and its integration contracts; depends on the V3 structure/index and owner transactions documented in 25 and 26.

Current runtime: stage 6 activates these foundations in the product. See [Active V3 editor](29-v3-active-editor.md); the stage descriptions below retain their original implementation/review boundaries.

The user approved stage 4 with “okey continue”. The application remains on format 2. These modules are opt-in foundations for the stage-5 column and stage-6 feature adapters; no active editor import, keyboard binding, save handler or import/export path changed.

`resources/js/components/editor/markdown/editing/` separates these responsibilities:

| Module | Responsibility |
| --- | --- |
| `v3-editable-text.ts` | Checked content ranges, excluding structural headers and presentation closes. |
| `v3-keyboard-operations.ts` | Enter, universal Shift+Enter and two-action boundary commands resolved against explicit block IDs. |
| `v3-text-edit-operations.ts` | Atomic text changes/exits; presentation-aware serialization when necessary. |
| `v3-inline-join.ts` | Reject a join if local Markdown syntax would acquire a different interpretation. |
| `v3-block-selection.ts` | Owner-local handle/Shift-handle selection and two-stage Select All. |
| `v3-selection-drag.ts` | Capture ordered IDs and source ranges for the existing drag controller; reject stale owner/state. |
| `v3-paste-source.ts` | External Markdown normalization and bounded, document-scoped internal clipboard envelope. |
| `v3-paste-operations.ts` | Inline-context/block-range/explicit-target paste with structural ID remapping. |
| `v3-editing-clipboard.ts` | Clipboard source/commands, preserving reference IDs and omitting real block/column headers from plain copies. |
| `v3-live-structure.ts` | Opt-in hidden/atomic headers and directive fences plus a filter against accidental structural writes. |
| `v3-live-editing.ts` | Owner keyboard/clipboard handlers, handle selection entry point and capture-phase embedded Shift+Enter delegation. |
| `v3-editing-inspection.ts` | Disposable manual CodeMirror surface without application persistence. |

Keyboard rules

- Enter adds a line within the current text block. An empty final line, including an empty final list item, exits through one paragraph insertion transaction. No timers. Lists retain indentation and unchecked new task markers; numbered items increment the current marker. Quotes/callouts continue their quote prefix.
- Dedicated rich editors keep normal Enter. Shift+Enter delegates to the owning document and inserts a paragraph after the whole identified block. The same-column target follows from `parentId`; a whole-layout ID targets the root flow.
- Backspace at the start of non-paragraph text converts it first. Forward Delete at its end converts it while retaining the end caret. A later boundary command merges adjacent compatible paragraphs and retains the earlier ID. Empty paragraphs delete with preceding-block focus. Deleting an entire root handle selection creates a fresh empty paragraph in the same action.
- Automatic joins compare local inline syntax before/after. Different block presentation, ambiguous delimiter joins, atomic inline cuts and opaque payloads fail visibly without a write.

Selection and clipboard

Handle adapters call `selectV3BlockFromHandle(view, id, shiftKey)`. The selection belongs to that owner state; Shift selection stays within consecutive siblings. `captureV3SelectionDrag` supplies ordered IDs to the existing movement transaction, without replacing the current drag visuals. Stage 5 adds cross-column moves and final-child cleanup; see [V3 columns](28-v3-columns.md).

Select All first selects editable content, then root document blocks. Source Mode must omit the complete live-editing extension so its normal raw selection/copy behavior remains available. Live range copies omit actual structural headers; literal header examples inside code remain literal. Mixed partial text selections crossing headers can copy plain content; cut/delete across those protected markers requires a complete handle range and reports this requirement.

Single ordinary paragraphs paste inline. Multiple Markdown nodes become separate typed blocks; adjacent bullet/checklist groups split by top-level item type, preserving nested items and states. External headers in prose are escaped, while code bodies remain literal. Internal block paste keeps types, bodies, presentation and reference IDs and remaps actual block/column identities, including descendants. A text-context paste keeps the original prefix ID, assigns fresh pasted IDs and creates an identified trailing text fragment when needed. Callout trailing prose becomes a paragraph while the original callout header remains intact. One paste is one isolated owner history action, including its caret.

Internal clipboard payloads use `application/x-orbium-v3-blocks+json`, version 3 and an explicit document scope supplied by the integrating application. The scope is a routing guard, not authorization. Stage 6 must retain server validation and authorized attachment/reference transfer. Different-scope internal paste currently rejects visibly; it does not bypass security with a silent fallback. Stage 5 normalizes supported external Markdown column directives into identified V3 layouts and typed children. File clipboard handling continues through the existing upload path when integrated.

Integration contract

Install `v3OwnerTransactionExtensions` with the owner's existing `history()` exactly once. Install `v3LiveEditingExtensions` only in the Live Preview compartment, passing current owner availability, a stable document clipboard scope and visible error reporting. The extension deliberately does not create a second history. New V3 documents should be initialized with an identified empty paragraph by the creation adapter; deleting all selected root blocks already retains such an editing target. Existing rich/column widgets must resolve an embedded event target to its owning V3 block ID; the capture listener prevents Shift+Enter from reaching the inner editor, then calls the checked owner operation. Never register a split sibling or hosted different document as a child of this owner.

The trusted owner-operation annotation is used only by the validated planner. Ordinary live writes cannot remove headers, change identities/types/scopes or create structure through typing. Undo/redo retains the original owner history. Source Mode remains unrestricted raw input with structure diagnostics; no automatic repair or data deletion. Invalid live source blocks further editing until repaired in Source Mode.

The disposable inspector presents bodies with structural syntax hidden. It does not mount existing rich previews, styled empty-block widgets, column layouts, drag animations or app controls. It therefore validates an integration boundary manually, not visual/product parity. Do not enable V3 in the product based on these checks alone. Follow [the stage-4 report](../reports/orbium-v3-stage-4-editing.md) for exact review steps and actual check results.
