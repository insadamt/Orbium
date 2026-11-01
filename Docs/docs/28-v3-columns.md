Summary: Explains stage-5 V3 column transactions, owner projections and the opt-in column surface; depends on docs 25–27, the V3 scoped index and existing column CSS/divider behavior.

Current runtime: stage 6 activates these foundations in the product. See [Active V3 editor](29-v3-active-editor.md); the stage descriptions below retain their original implementation/review boundaries.

The user approved stage 5 with “continue”. The active product remains format 2 until the coordinated stage-6 storage and feature integration. V3 columns can now be mounted explicitly in the disposable inspector. Existing rich previews, product gutter/menu/slash adapters, hosted views and persistence are not activated by this phase.

Source and identity

A layout has a root `columns` block ID, two or three stable column directive IDs and identified ordinary child blocks. New layouts seed each column with an identified empty paragraph. Moves retain every moved block ID; resizing retains layout/column/child IDs; stacking and dissolution retire layout/column IDs and promote existing children without regenerating them. Internal paste remaps actual structural identities, including all column descendants, while keeping literal payloads and media/page identifiers.

The parser/index remains authoritative. `v3-column-model.ts` reads columns by ID and serializes newly created layouts with safe fence lengths. Existing containers widen only their required delimiters when an inserted child has a longer real directive fence. Literal colon/header examples in code do not cause existing containers to rewrite. Widths remain integer proportions totaling 10000, with at least 1500 per column.

Owner commands

| Operation DTO | Behavior |
| --- | --- |
| `create-columns {target, count: 2 | 3}` | Insert a new root layout, fresh column IDs and a fresh empty paragraph per column. |
| `wrap-columns {blockIds, besideId, side}` | Move a consecutive ordinary range beside a distinct ordinary root block, creating two columns and preserving existing block identities/content. |
| `add-column {layoutId, side?, blockIds?}` | Add the third column at the left/right edge; create an empty paragraph or move the specified range into it. |
| `resize-columns {layoutId, widths}` | Change only the outer layout metadata line. Equal widths uses the existing helper. |
| `stack-columns {layoutId}` | Remove layout/column syntax and promote children in column reading order. |
| `move {blockIds, target}` | Existing move command now supports in/out/between-column transfers. No nested layouts. |
| `delete {blockIds, ensureParagraph?}` | Existing delete command now cleans up a column when its final child is removed. |
| `edit-column {columnId, ownerSource, edits, selection, userEvent}` | Publish native projected text changes against an exact immutable owner snapshot, touching only checked child body ranges. |

`v3-column-consequences.ts` composes required fence changes and cleanup with the initial changes before dispatch. Empty-column removal redistributes surviving widths proportionally. A single remaining column dissolves into root children. No intermediate invalid layout or independent history entry is published. Three-to-two cleanup uses narrow column/header edits; a structural dissolution can replace the affected layout while preserving child source bytes. Ordinary same-line typing uses the checked mapped-body path and maps hidden ranges without full source scanning or rereading every unrelated block body. The native planner bounds each delta to its owning child; structural edits retain the complete identity/source integrity checks.

Transaction integrity explicitly declares changed parents and exact changed column headers. Unaffected and transferred child source bytes remain checked, including presentation, code and references. A single required trailing newline can frame an originally unterminated root block when moving it into columns. Removed/new IDs are reported as net consequences; undo/redo restores the original IDs and widths from the owner history.

Projected editing and UI

`v3-column-projection.ts` mounts a column as a view of owner source. It installs no `history()`. Native edits carry an immutable owner `Text` snapshot, checked deltas and local selection; the owner validates and commits first, then the projection accepts its view transaction. The final newline framing the parent close is excluded from the projection. This prevents native Backspace/Delete from joining body text to a parent delimiter.

A native typing transaction uses the original CodeMirror user event so ordinary undo grouping survives. It does not capture block-motion geometry, add a block-motion history effect or force the owner scroll position on each keystroke. Structural commands remain isolated one-action owner transactions. Undo/redo, clipboard, conversion and paragraph insertion delegate to the owner. Ctrl/Cmd+A first selects current block content, then selects the owner document. Shift+Enter capture resolves the exact projected child, including its final EOF position.

`v3-column-registry.ts` tracks mounted projections by owner and column ID for focus, composition and embedded event delegation. Only the registered originating column may publish native composition changes; structural commands reject while any column composes. Read-only, unavailable, stale and different-owner writes reject before commit. Owner synchronization uses narrow differences when content really changes and refreshes permission/focus without rebuilding the column editor on ordinary edits. Structural grid changes retain surviving projections by column ID.

`v3-column-layout.ts` reuses the actual `.orbium-columns-*` CSS and `bindColumnDividers`. Responsive stacking therefore retains the existing 520px/680px container rules and never rewrites widths. Pointer preview writes only on acceptance; Escape, cancellation and blur retain the existing cancel path. The controller exposes existing Add column / Equal widths / Stack blocks action descriptors for the later menu adapter. `v3-column-widgets.ts` supplies an opt-in owner replacement and keyed/deferred disposal. Source Mode must remove this live compartment; it continues displaying the real raw source.

`v3-column-drop.ts` returns the existing drag target shape (owner, indicator rectangle, apply callback) using IDs and mounted geometry. It supports side creation, adding the third column, in/out/between-column moves and consecutive ranges. Applying a stale/unavailable target rejects without partial writes. The existing drag controller must consume these targets after its grip/selection adapters use V3 IDs in stage 6; this phase does not replace drag ghosts, edge scrolling or motion controls.

Integration and boundaries

- Install the existing owner history and `v3OwnerTransactionExtensions` once.
- Install `v3LiveEditingExtensions({renderColumnLayouts: true, ...})` together with `v3ColumnWidgets(...)` only in the owner's live compartment. The syntax protection field still guards all headers/fences, while the layout widget owns their visual replacement.
- Use a stable authorized document clipboard scope across owner and its projections. The scope is not authorization; keep the stage-6 server/reference/asset validation.
- Supply `extensionsForColumn` when adapting existing typed rich/formatting/search/gutter features. Unadapted legacy inference/writing extensions must not write V3 source through format-2 serializers.
- Route layout controls/slash commands to the owner DTOs. Route existing grip/drop handling to stable IDs and the V3 drop target adapter.
- Keep Source Mode unrestricted. Invalid raw source unmounts live layout projections without rewriting the source; repair it before structural editing.

External supported Markdown column directives now normalize into a fresh identified V3 layout with typed children. Empty imported columns receive identified empty paragraphs. Nested column paste rejects. This normalizer does not add a V1/V2 native-document migration or activate the current import UI.

[The stage-5 report](../reports/orbium-v3-stage-5-columns.md) records actual checks and exact manual acceptance. No runtime tests or performance benchmark were run; source/build checks are not proof of focus, IME, widget lifecycle, drag or responsive visual behavior.
