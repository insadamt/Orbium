# Document columns

Summary: This phase implements the user-approved side-by-side Document blocks as saved two/three-column layouts. It depends on the Markdown/CodeMirror editor, reserved Orbium directives, owner history/autosave, existing block controls and document transfer services.

## Authorization and scope

On 2026-10-30 the user approved the proposed first version with “okey go ahead do it”. This authorizes one column feature phase, including drag-to-create, blocks stacked within columns, adjustable proportions, slash insertion and responsive stacking. Finish with manual review; do not start nested layouts, wider-page settings or another feature phase.

The active Markdown Document editor is the implementation target, including Documents edited inside Board linked-page cards. Native Board objects already have independent spatial positioning. Legacy format-1 Documents keep their existing schema and do not gain column insertion in this phase.

## Product behavior

- `/columns` offers **2 columns** and **3 columns**. Inserting a layout focuses its first column.
- Drag an ordinary block to another block's left/right edge to create an equal-width two-column layout. The vertical indicator identifies a side drop; a horizontal indicator keeps the existing reorder behavior.
- Drop ordinary blocks into a column or between columns; drag them outside the layout to return them to ordinary Document flow. Each layout transfer uses one owner history transaction.
- Each column supports the existing text, heading, list, callout, code, table, attachment, math, diagram and Mind Map insertion/rendering paths.
- Contextual layout controls offer **Add column** (two-column layouts), **Equal widths** and **Stack blocks**. Stacking preserves nonempty bodies in left-to-right column reading order.
- Dividers preview resizing without writing history each pointer move. Release accepts one change; Escape, pointer cancellation and window blur cancel. Arrow keys adjust widths, Shift increases the step, and Home balances the adjacent pair.
- Each column occupies at least 15% of available column content width. Narrow layouts stack in reading order: two columns at 520px or less, three at 680px or less. This uses the actual container, including split/hosted panes. Stacking never changes saved widths.
- Quiet controls appear on hover/focus; touch retains visible layout controls. Reduced motion removes the new control transitions.
- No nested columns. Nested insertion commands are omitted; pasted column directives are rejected in column editors. The server rejects nested saved layouts.

## Persistent contract

Content format stays 2; no schema migration. Add reserved directives:

```text
:::::orbium {"kind":"columns","version":1,"widths":[5000,5000]}
::::orbium {"kind":"column"}
Text on the left.
::::

:::orbium {"kind":"column"}
Text on the right.
:::
:::::
```

The normal serializer chooses outer fences longer than all nested fences. `version` is required and exactly integer 1. `widths` is required: two or three integers of at least 1500, totaling 10000. Direct children must be exactly the matching number of `column` directives. A `column` must be a direct child of `columns`. Empty column bodies are valid. Other unknown metadata remains invalid.

Current Markdown saves advertise `editor_features.columns: 1`. If incoming or saved Markdown contains a real columns AST node, an older client's save is rejected with a reload message before writes. Literal code samples do not trigger this guard. Older servers reject the unknown reserved directive; deploy matching server/frontend and reload editors.

Normal AST traversal discovers column text, page mentions, media references and statistics. H1/H2 column headings participate in the Document outline; mounted column positions provide precise navigation. Formatting-preserving `.orbie`, document packages and account archives retain the source and widths. Standard Markdown and Word/PDF intentionally flatten columns in reading order through the existing generic container serializers. No archive/package envelope changes.

## Validation and stop

Run formatting, lint, types, build and whitespace checks. Do not write/run automated tests or browser automation. Record actual results and exact manual acceptance in `../reports/16-document-columns.md`; stop for the user's review.
