# Image size toggle and reverse direction motion

Phase 7 review — 2026-10-15.

## Implemented

- Image sizing now toggles: smaller images offer Fill available width with an expand icon; full-width images offer Restore image size with a shrink icon. Restore uses the previous smaller width remembered by the mounted image, subject to existing size limits.
- An image opened at maximum width without a remembered smaller width offers Reduce image size, using approximately 60% of available width with existing minimum-size limits. The subsequent click fills again. The remembered restore width is transient; the final chosen width saves normally.
- Shared size decisions between Markdown and legacy JSON editors. The accessible label, tooltip, pressed state and icon follow the current width and available editor space, including pane resizing.
- Both expansion and reduction reuse the existing 260 ms width transition; corner resizing remains immediate.
- Explicit LTR/RTL/Auto direction commands now use the existing horizontal movement helper, including reverse changes, when their rendered position changes. Markdown rich images are measured by their figure bounds; paragraphs/headings retain content-bound measurement. Both editor formats are covered.
- Existing left/center/right motion remains symmetric. An explicitly aligned block that keeps its physical position when direction changes has no artificial horizontal displacement. OS reduced motion skips movement.

No new persisted attributes, migrations or archive changes. No commits created. Existing staged work was preserved. This remains within Phase 7.

## Validation

- Scoped formatting/lint: PASS. An initial unbound-method warning was fixed by returning an arrow callback from the width-toggle hook.
- `npm run lint`: PASS; 502 files formatted and 413 source files linted without warnings/errors. The subsequent inline-math target guard also passed scoped formatting/lint.
- `npm run types:check`: PASS after the final target guard.
- `npm run build`: PASS after the final target guard; existing large-chunk, overlapping-import and plugin-timing warnings remain.
- `git diff --check`: PASS.

No automated tests written or run, per user instructions. Browser visual and interaction acceptance remains pending manual review.

## Manual checklist

1. Resize an image to a smaller width, note its width, then click Fill available width. Expected: smooth expansion and a shrink icon with Restore image size at maximum width.
2. Click Restore image size. Expected: smooth reduction to the remembered smaller width (within size limits), followed by the expand icon and Fill available width label. Repeat several times and reverse a transition before it completes: expected smooth retargeting to the chosen size.
3. Open/reload an already-full-width image. Expected: Reduce image size with a shrink icon. Click it: expected reduction to approximately 60% of available width, subject to minimum size. Click again: expected expansion and a Restore label.
4. Manually resize an image to maximum and back down; resize a split pane/browser window. Expected: the size button changes state with the target width and available space, without requiring image deselection.
5. Use narrow images aligned left, center and right. Toggle Fill/Restore. Expected: growth and reduction preserve the alignment and aspect ratio, with caption/toolbar following the image.
6. Use a short paragraph or heading without an explicit physical alignment. Choose LTR → RTL → LTR, then Auto. Repeat with appropriate English/Arabic text. Expected: position changes animate in the actual travel direction, including the reverse; reading direction remains correct.
7. In an image block using Start alignment, switch LTR → RTL → LTR through the block menu. Expected: a narrow image travels to the corresponding start edge and back. Repeat ordinary left → right → center → left alignment: expected symmetric movement.
8. Repeat direction changes on explicitly left/right/center-aligned text. Expected: explicit physical alignment is preserved; there is no fabricated sideways movement if the visible bounds stay in place.
9. Test in Markdown and a legacy JSON/Tiptap document if available. Wait for Saved and reload: expected final size, direction and alignment persist. Undo/redo retain normal document history; remembered restore width is not persisted.
10. Enable OS reduced motion and repeat toggling/direction changes. Expected: immediate final placement and size. Drag a corner during normal motion: expected direct, responsive resizing.

## Commit suggestions

- `feat(editor): toggle image fill and restore sizes`
- `feat(editor): animate bidirectional block direction changes`
