# Columns: drag-only creation and automatic cleanup

Implemented for Markdown Live Preview, 2026-10-30.

- Drag a document block beside another block to produce a two-column layout.
- Drag a further block beside a two-column layout to create a third column (maximum three). A vertical drop indicator previews the placement.
- Drag a column's last block out or into another column to remove the emptied column automatically, within the same owner-history transaction.
- Deleting the last block in a column also removes that column. If only one column remains, its content becomes ordinary document blocks.
- Remove the redundant Add Column toolbar action. Preserve existing resizing, Equal widths, Stack blocks, and block drag/drop.
- Rebalance remaining widths proportionally after a column disappears.
- Preserve canonical Markdown and existing source/history semantics; no API, database, or dependency changes.

## Manual acceptance

1. Start with two ordinary paragraphs. Drag one beside the other, using left and right edges. Confirm two columns and intact content.
2. Drag a third document block beside the layout. Confirm three columns, correctly ordered and no blank placeholder column.
3. Drag a block with other blocks remaining in its source column. Only that block moves and the source column remains.
4. Move the last block from a three-column layout to another column or outside the layout. Confirm the empty column disappears and two columns remain.
5. Move the last block from one side of a two-column layout. Confirm the layout disappears and surviving content is normal document blocks.
6. Delete the last block in a two-column or three-column layout. Confirm identical automatic cleanup.
7. Resize a three-column layout, then empty a column. Confirm remaining columns retain their relative width proportions.
8. Undo and redo creation, move, deletion and auto-dissolve. Wait for Saved and reload; ensure content and order persist.
9. Retest drag handles, selection, keyboard, RTL, narrow split pane, rich blocks, scrolling and reduced motion.
