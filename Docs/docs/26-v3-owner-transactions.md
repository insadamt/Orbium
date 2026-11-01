Summary: Defines inactive V3 owner commands, identity integrity and history/motion dispatch so later keyboard and widget adapters cannot write parser-inferred block ranges. It depends on `25-v3-document-structure.md`, the owning CodeMirror state, existing history/motion services and stage-3 approval boundaries.

Current runtime: stage 6 activates these foundations in the product. See [Active V3 editor](29-v3-active-editor.md); the stage descriptions below retain their original implementation/review boundaries.

# V3 owner transaction foundation

## Activation and ownership

Stage 3 implements `resources/js/components/editor/markdown/transactions/`. It is not installed into the format-2 editor, slash menu, keyboard handlers, column widgets, drag controller, autosave or transfer UI. Existing product behavior and saved formats stay active until coordinated integration. There are no server/API/schema/dependency changes in this stage.

`prepareV3Operation({owner, state, operation, preserveSelection?})` computes a transaction without applying it. `owner` is an identity token: an `EditorView` for live dispatch, or a private object for isolated manual inspection. The prepared result retains that exact owner token, `EditorState` and immutable source `Text`. Identical source in another owner is insufficient to apply it. Source, selection or permission reconfiguration invalidates a prepared plan; redo uses history rather than preparing a fresh command.

The owner must have its existing `history()` plus `v3OwnerTransactionExtensions`. The latter installs the derived structural field and existing inverted block-motion effects; it creates no independent history or ordinary-block editor. Current V3 syntax must be valid. Last-valid recovery snapshots never authorize edits against malformed current source.

## Command DTOs

| `kind` | Required fields | Current behavior |
| --- | --- | --- |
| `insert` | `target: {parentId, beforeId?}`, `type`, `body` | Fresh ID and explicit type; creates an ordinary/rich block before a sibling or at scope end. New layouts require stage 5. |
| `replace-body` | `blockId`, `body` | Replaces that block's complete body without changing ID/type. Caller supplies retained presentation/rich metadata as part of the body. Whole-layout body replacement is rejected. |
| `convert` | `blockId`, `type` | Retains ID and converts supported text to paragraph, H1–H6, bullet/numbered/checklist or quote source. Callout-to-text retains an authored title. Opaque conversions or incompatible presentation fail without writes. |
| `split` | `blockId`, `offset` | Splits a paragraph/heading: earlier ID remains; trailing block gets one fresh ID and the same type. Offset is UTF-16 within unwrapped content after removing a heading prefix; Markdown inline markers count. |
| `merge` | `earlierId`, `laterId` | Adjacent paragraphs in the same scope and compatible presentation merge; the earlier ID survives, later ID retires, source caret lands at the join. |
| `delete` | `blockIds` | Deletes an ordered consecutive sibling range, including a selected layout's descendants/columns. An emptied column requires stage-5 cleanup and is rejected here. Deleting all root blocks yields a valid empty document. |
| `duplicate` | `blockIds` | Inserts a copy after an ordered consecutive range; every copied block/layout/column identity is regenerated, including descendants. Raw bodies, literal examples, rich payloads and semantic page/media/map-topic IDs retain their bytes. |
| `move` | `blockIds`, `target` | Moves an ordered consecutive range within its existing scope, retaining IDs/order/body source. Whole layouts move as root blocks. Cross-scope/owner transfers belong to later integrations. |

`parentId: null` identifies ordinary root flow; a string identifies an existing column, not a Document/Node ID. `beforeId` must belong to that exact scope. Missing targets, nonconsecutive/reversed ranges, no-op moves and identity collisions fail explicitly. New IDs use the shared cryptographic generator, checked against all existing block/column identities and IDs allocated by that command.

`replace-body` is a bulk source command, not permission to drop presentation metadata or to rewrite a layout on every child keystroke. Precise ordinary CodeMirror typing still uses the structural field's mapped-body path. Candidate planning reuses the same safe mapping helper for eligible source changes; structural commands may rescan the bounded source. No runtime speed claim is made.

## Validation and transaction contract

1. Require an editable owner, one text selection range, the existing history and a valid current structural index.
2. Resolve identities/scopes from the index and calculate narrow source changes. No operation derives a whole-block range from a neighboring Lezer list/heading node.
3. Map or scan the candidate structure. Verify declared new/retired IDs, explicit types, column owners and unchanged column headers. Compare every unaffected block's bytes. A parent layout is affected when one of its children changes, but its unrelated children are still checked separately.
4. Resolve source selection and attach one full history-isolation annotation plus existing block-motion effects. Moves also carry the existing rich-widget retention annotation.
5. Construct one owner transaction, respecting owner transaction filters. Reject if they alter candidate text, expected selection, user event, history isolation or required motion/retention effects, or suppress history. Revalidate the resulting structural field.
6. Immediately before dispatch, verify exact owner/state/source, DOM/activity/permission availability and composition. Dispatch one transaction; no separate focus/history document write follows it.

Undo/redo stores/restores the actual source edits and original generated IDs. A failed preparation leaves the current owner, selection and history unchanged. A stale prepared operation must be prepared again; it must not be rebased by guessing a similarly spelled block.

Source boundaries preserve neighboring bytes. When inserting after an EOF block without a terminal LF, one LF is explicitly permitted on that preceding block to separate headers. Undo restores its original spelling. Layout separators have no child-block owner: removal/movement of a complete layout includes its following whitespace gap so that whitespace does not become new content of a preceding paragraph. Other neighboring content is not trimmed or reserialized.

## Text and opaque data

Type conversion preserves text from all list items/continuations/nesting. List-to-paragraph conversion escapes markers into a readable representation, preserving checkbox states rather than stripping them. Text, inline formatting, color/underline source and supported presentation are retained. Type-specific `listType` metadata is removed only when explicitly leaving numbered-list type; incompatible alignment requires explicit clearing first.

Paragraph/heading splitting balances strong/emphasis/strike, code, normal links and Orbium formatting spans. Cuts through inline syntax, images, mentions, icons, math and other opaque payloads are rejected. A list is never split into independently identified items. Converting text containing nested opaque blocks/multiline code requires a dedicated lossless adapter; the generic converter cannot flatten it. Generic conversion into callout/code/media/table/map types is also deferred to those adapters.

Paragraph merge requires equivalent presentation. Ambiguous inline delimiter/escape boundaries are deliberately rejected instead of inventing a separator or losing marks. Empty/ordinary compatible paragraphs can still merge. Removing an empty paragraph focuses the preceding block where present; first-block removal focuses the next block. Stage 4 will bind these primitives to the approved boundary/keyboard rules and handle any additional lossless joins needed there.

## Live dispatch and visual compatibility

`executeV3Operation({view, isAvailable, operation, preserveSelection?, focusEditor?})` prepares and applies through the live adapter. `applyV3PreparedOperation` accepts a previously prepared plan with the same live owner. The required `isAvailable` callback must reflect current hosted/tab/permission availability; the adapter additionally checks editable/read-only state, connected/visible DOM, nested ownership and composition in the owner, mounted columns and maps.

The adapter reuses `markdownBlockMotion`, `markdownBlockMotionEffect` and `preserveRichWidgetsDuringMove`, preserving existing cleanup/reduced-motion mechanisms. It does not introduce new durations, animations, cloned editors or independent histories. If motion/focus fails after an accepted source transaction, it returns `applied: true` with a warning so callers do not repeat a command that already changed content. A rejected/stale proposal cleans up its captured ghost and does not dispatch.

The current editor is not connected to this adapter, so visual parity, live caret handoff to specialized widgets/columns, IME behavior, undo motion and split-linked history are not runtime verified. Existing format-2 split history is untouched. No V3 cross-owner API is exposed in this stage; future transfer integration must preflight both owners and use existing linked-history semantics.

## Manual review

`v3-transaction-inspection.ts` exposes one isolated owner state with `inspect`, `prepare`, `applyPrepared`, `applyOperation`, `undo`, `redo`, `setSelection`, `setReadOnly`, `setComposing` and `applyRawSourceChanges`. It mounts no view and saves nothing. `setComposing` models the command gate; it does not exercise real browser IME. Raw source changes intentionally model Source Mode and remain available for malformed-source recovery review.

Use `../examples/orbium-v3-transactions.orbie` and the stage-2 columns sample through the development-console steps in `../reports/orbium-v3-stage-3-transactions.md`. The sample's page/attachment IDs are illustrative and are not authorized workspace references. Full content/reference/security validation remains required before persistent V3 activation. No automatic assertions, tests or browser automation are added or run.
