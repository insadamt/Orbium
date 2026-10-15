# Animate direction undo and redo

Phase 7 review — 2026-10-15.

## Cause and changes

Direction/alignment motion was attached only to explicit menu commands. History restored the document state without invoking those commands, so Ctrl+Z changed position immediately.

- Added a Markdown history dispatch adapter that identifies restored direction/alignment metadata, captures the old rendered block position, applies the original transactions once and reuses the existing 260 ms movement.
- Added a legacy JSON/Tiptap history listener that captures affected blocks before a history transaction updates the view and animates restored direction/alignment.
- Both paths retain actual undo/redo transactions, history grouping, autosave and normal editor shortcuts. They add no document edits or history entries. Ordinary typing undo does not trigger layout movement.
- Reduced motion remains immediate. Content that retains its physical position has no artificial travel. The opaque color-picker and slider-focus edits remain intact.

No migrations, new dependencies, persisted format changes or commits. Existing staged work was preserved. This remains within Phase 7.

## Validation

- Scoped formatting/lint: PASS.
- `npm run lint`: PASS; 504 files formatted and 415 source files linted without warnings/errors.
- `npm run types:check`: PASS.
- `npm run build`: PASS; existing large-chunk, overlapping-import and plugin-timing warnings remain.
- `git diff --check`: PASS.

No automated tests written or run, per user instructions. Browser visual and interaction acceptance remains pending manual review.

## Manual checklist

1. Create a short paragraph without an explicit physical alignment. Change LTR to RTL, then focus the editor and press Ctrl+Z. Expected: the original direction is restored with smooth reverse horizontal movement, instead of snapping.
2. Press Ctrl+Shift+Z (or the editor's supported redo shortcut). Expected: direction and movement return in the opposite direction. Repeat undo/redo several times: expected one normal history step per change, with clean final placement.
3. Test RTL → LTR → undo, then manual direction → Auto → undo/redo. Use English and Arabic text so Auto chooses its actual writing direction. Expected: restored direction is correct and position changes animate when there is visible travel.
4. Change paragraph/heading alignment left → center → right, undo and redo each step. Expected: restored alignment travels smoothly in either direction and no extra motion-only undo entries appear.
5. In a narrow image using Start alignment, change block direction and undo/redo. Also undo/redo its image alignment. Expected: the image moves to the correct restored position, with caption and toolbar following it.
6. Type ordinary text and undo/redo it. Undo formatting and block edits too. Expected: ordinary history behavior remains intact; typing undo does not introduce sideways animation or lose content.
7. Repeat in long/scrolled and split documents; interrupt movement by typing, clicking or scrolling. Expected: clean final layout, no stuck transforms and independent panes.
8. Repeat in a legacy JSON/Tiptap document if available. Expected: direction/alignment history uses the same reverse movement.
9. Enable OS reduced motion and repeat undo/redo. Expected: immediate final placement with correct history. Wait for Saved and reload: expected restored direction/alignment persist.

Suggested commit: `fix(editor): animate direction and alignment undo redo`
