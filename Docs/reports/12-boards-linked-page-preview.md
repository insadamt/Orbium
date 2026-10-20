# Boards phase 4 — Linked-page rendered preview and scrolling

## Implemented

- Resource cards retain their saved frame height. New cards use the existing 600 × 420 geometry; all resize handles remain available.
- The header stays above an internally scrollable body in preview and original-Document editing modes.
- Document content renders immediately using the existing rich-body renderer, scoped to the original Document for media and references. Legacy content uses the Markdown serializer.
- Target revision changes and Refresh reload the preview. Pending requests abort when the preview unmounts.
- Hover wheel scrolling belongs to the card; overscroll stays contained. Ctrl/Cmd-wheel retains Board zoom. Native scrollbar dragging and touch scrolling avoid starting a canvas move.
- Database/Board targets retain navigation cards. No migrations, persistent format changes, or commits.

## Validation

- Targeted formatting/lint: passed.
- Full formatting/lint (`npm run lint`): passed, 651 formatted files and 546 linted files.
- `npm run types:check`: passed.
- `npm run build`: passed; warnings for large chunks, mixed static/dynamic imports, and plugin timings.
- `git diff --check`: passed.
- Documentation-only `vp check` could not run because Markdown targets are excluded by formatter rules; source formatting/lint passed above.
- No automated tests written or run, per repository instructions.

## Manual checklist

1. Add a linked Document containing headings, bold text, lists, a table, image, math and Mermaid. Expected: the body renders without double-clicking; supported rich blocks display instead of the previous plain-text excerpt.
2. Link a long Document, then hover over its body and scroll without selecting it. Expected: inner content scrolls, card height and Board position stay fixed, and the title/actions remain visible. Scroll to both ends: no canvas movement.
3. Drag the inner scrollbar. Expected: content scrolls without moving the card. Tab into the content area and use Page Down/Up: content scrolls with visible focus.
4. Scroll over empty canvas, then Ctrl/Cmd-wheel over a card. Expected: canvas scrolling and pointer-centered zoom still work.
5. Drag a card by its title; resize its sides/top/bottom/corners. Expected: frame size/position changes, content stays reachable by scrolling, and whole-surface corner scaling remains available. Reload: saved geometry remains.
6. Double-click ordinary preview text or select the card and press Enter. Edit the original Document and wait for save, then finish editing. Expected: the editor stays inside the frame, the updated rendered preview returns, and opening the original shows the saved edits.
7. Edit the original in another Orbium tab, return to the Board, and use Refresh if needed. Expected: the rendered preview updates to the latest saved content.
8. Add an empty Document and an older legacy Document. Expected: empty-state guidance and a rendered legacy preview, respectively.
9. Trash a target and refresh its card. Expected: unavailable placeholder; removing the card never deletes another resource. Database/Board cards still open their original pages.
10. On a touch device, swipe within a long card. Expected: content scrolls without dragging the card. Move the card using its header.

## Limits and review gate

Manual browser acceptance remains pending. Rich-body rendering retains its existing
131,072-character/depth safety limits; larger sources fall back to text. Legacy
previews follow the existing serializer's supported formatting. Visible Document
cards now fetch source and render rich content, increasing work compared with excerpts;
offscreen cards remain subject to existing canvas culling. No later phase is started.

Suggested commit: `feat(boards): render linked documents in scrollable fixed-height cards`
