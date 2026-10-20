# Boards phase 4 — Linked-page block movement and container refinement

## Findings and changes

Hosted Markdown Documents explicitly omitted their block gutter. Hosted legacy
Documents also omitted EditorBlockGutter, the component that mounts their editable
content and block controls. Restored both existing gutters and reserved 52px inside
the editor so handles are reachable without escaping the card's clipping boundary.
Internal moves continue to edit/save the original Document. Hosted Markdown targets
retain their existing local-only restriction, revision guards and independent undo.

Markdown drag scrolling now stops at the resource viewport instead of spilling into
outer scrolling containers. The card gains a subtle border/shadow, rounded clipped
inner surface, muted header, icon tile, two-line title/status, consistent content
padding, thin scrollbar and action focus outlines. Selection/resize outlines remain
outside the clipped surface. Editing guidance now explains block reordering.

No migrations, persistent format changes or commits. No later phase started.

## Validation

- Targeted source formatting/lint: passed.
- `npm run lint`: passed; 652 files formatted, 546 files linted without warnings/errors.
- `npm run types:check`: passed.
- `npm run build`: passed; existing large-chunk, mixed-import and plugin-timing warnings remain.
- `git diff --check`: passed.
- No automated tests written or run. Manual browser acceptance remains pending.

## Exact manual checklist

1. Link a Document with three paragraphs, headings, a table and an image. Double-click its preview. Hover over a block: expected Add and drag/menu controls appear in the reserved left gutter without clipping.
2. Drag the last paragraph above the first, then move a rich block below another block. Expected: the drop indicator follows the insertion boundary, content moves once, and the outer card stays in place.
3. Use Ctrl/Cmd+Z, then redo while focused in the editor. Expected: the Document block move undoes/redoes without moving the Board card.
4. With a long Markdown Document, drag toward the inner viewport's top/bottom and use the wheel during the drag. Expected: the linked page scrolls, including to hidden destinations, while its header and Board remain fixed. At the end, outer page scrolling does not take over.
5. Press Escape during a Markdown block drag. Expected: the drag cancels and original block order remains.
6. Wait for save and finish editing; open the original Document and reload the Board. Expected: reordered content persists and the preview matches the original.
7. Try dragging a Markdown block from a hosted card into another Document editor. Expected: no cross-editor move or deletion; content stays in the original.
8. If available, open a legacy Document card and reorder its paragraphs. Expected: editable content and normal legacy block handles appear; reordered content saves to the original.
9. Inspect light/dark modes and narrow/resized cards. Expected: title truncates cleanly, icon/actions remain visible, reading/editor padding is consistent, focus rings are visible and no inner gutter is clipped.
10. Finish editing; move the card by its header and resize it. Expected: Board selection/handles remain accessible, preview scrolls on hover and header stays fixed. Ordinary standalone Document gutters still work.

## Limits

The existing rich-body preview size/depth limits remain. Legacy editing retains its
existing native drag behavior; the explicit edge-scroll boundary repair applies to
Markdown's pointer-drag implementation. Visual/manual checks above have not been run.

## Suggested commit

`fix(boards): restore linked-page block reordering and refine card container`
