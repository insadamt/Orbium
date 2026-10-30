# Document columns — independent block gutter scopes

Date: 2026-10-30. Source-level implementation; browser acceptance pending.

## Problem

The document gutter listens to the outer document hover surface. Entering a nested CodeMirror column editor previously returned no parent hover position, causing the document gutter to fall back to the editor selection and jump to another document block. The parent grip's measured first row could also be a nested column block or toolbar.

## Changes

- The nested column editor opts into an explicit `column` gutter scope; its handle listens only within its own column host.
- The document editor retains its own gutter scope. Hovering a nested column resolves to the *owning columns widget's* source position instead of the outer selection.
- The parent grip aligns with the top of the columns widget; it does not search nested child rows for an anchor.
- Child grips still target the individual blocks in each column, using the existing block menu and drag/drop implementation.
- No persistence format, endpoint, migration, or backend changes.

## Manual acceptance checklist

1. Create a document with blocks above/below a two-column layout. Hover every nested paragraph, heading and rich widget. The *outer* six-dot grip stays at the top of the columns layout, not at the hovered child and not at the previous selection.
2. Within each column, hover the top, middle and bottom child block. The *inner* grip follows that column's child only; the adjacent column's grip does not follow the pointer.
3. Move the pointer from each child onto its inner grip, from the column to the outer grip, and across the divider. No flicker, stale focus target or jumping controls.
4. Click the outer grip and use Duplicate/Move/Delete; these operate on the entire columns container. Click an inner grip and repeat; only the intended child is changed.
5. Drag the outer grip past another document block, then drag a child within its column, into the other column and out to document level. Ensure content, order, undo/redo and autosave remain correct.
6. Resize columns and add a third. Test long wrapped paragraphs, an empty column, rich blocks and scrolled pages. Grips stay anchored appropriately.
7. Repeat with a narrow stacked layout, split document panes, browser zoom 80%/125%, RTL text and both light/dark themes.
8. Repeat keyboard focus, right-click, Escape, touch (where available) and reduced-motion scenarios. No stuck menu or orphaned grip.

## Verification

Source transformation checks completed. A connected browser and project dependency runtime were not available to run TypeScript, lint, build or visual/interaction tests; those remain to be executed in the repository environment.
