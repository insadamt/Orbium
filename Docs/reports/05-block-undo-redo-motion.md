# Phase 5 review — block undo/redo motion

Date: 2026-10-18.

## Problem and change

Original block moves played the shared block-motion sequence, while undo/redo restored content without replaying it. The history dispatcher previously animated alignment changes only.

Block reorder, transfer, and deletion transactions now record exact before/after block ranges in session history. Inversion swaps those ranges, so undo and redo use the same motion plugin as the original action: outgoing pop at 80ms, neighboring-row movement at 140ms, and incoming pop at 100ms. Deletion has only an outgoing pop; restoration has only an incoming pop. Normal typing undo remains unchanged, as does alignment history animation.

Same-page reorder history uses the existing rich-widget retention and range-mapping path. Linked cross-document undo/redo captures the outgoing snapshot before restoration adopts live media into the companion page. This retains the visible player frame for the outgoing pop while the live viewer/player is reused by the incoming block. Paired-history guards, synchronous edits, autosave, reduced motion, and animation interruption cleanup retain their existing behavior.

The new history effects are transient editor-session state. No persisted content, archive format, database, dependency, or backend changes. No commit created. New/changed source files remain below 500 lines.

## Validation

- `npm run types:check`: PASS.
- `npm run lint`: PASS; 558 files correctly formatted and 464 files linted without warnings or errors.
- `npm run build`: PASS (11.46 seconds), with large-chunk and ineffective dynamic-import warnings.
- `git diff --check`: PASS.
- New history-motion service: 112 lines; Markdown editor: 485 lines.
- No automated tests were written or run, per user instructions. Browser animation acceptance remains pending manual review; static checks do not demonstrate visual correctness.

## Manual checklist

1. Hard-refresh. In a disposable Markdown Live Preview document, move the middle of three blocks using its grip. Undo, then redo. Expected: each operation uses the same outgoing pop, sibling slide, and destination pop, with the block appearing exactly once at its restored position.
2. Repeat using the block menu and Alt+Shift+Up/Down. Delete a block and undo/redo. Expected: undo deletion slides neighbors apart and pops the restored block in; redo pops it out and closes the gap. Plain typing undo retains its normal behavior.
3. Split two Markdown documents in the same workspace. Move a block A → B, undo from B, then redo. Repeat from A after hovering into it. Expected: the outgoing block pops out of one pane while its counterpart pops into the other; both histories remain linked and content is never duplicated.
4. Repeat with identical paragraphs, a nested list, table, code, image, Mermaid, math, and a styled/RTL block. Expected: the correct block animates with its full presentation; surrounding content remains visible and moves smoothly.
5. Move a loaded PDF with changed page/zoom and a video/audio block with a saved playback position. Undo/redo repeatedly. Expected: outgoing snapshots retain the visible media frame and incoming players keep the existing retained state without a loading flash or reset.
6. Exercise repeated rapid undo/redo, then interrupt with scrolling, a click, typing, or resize. Expected: animations finish or cancel cleanly without leftover ghosts or invisible live rows. TOC navigation, pointer activation, and independent pane scrolling still work afterward.
7. Add a newer edit in the companion page before undoing a linked move, or close the companion. Expected: existing history notices block unsafe reversal; no partial move or animation appears.
8. Enable reduced motion and repeat moves, deletion, undo, and redo. Expected: immediate correct content updates without pop/slide effects or leftover snapshots. Disable reduced motion and repeat once; animation returns.
9. Wait for both Saved indicators and reload. Expected: the final content placement persists and the normal fresh editor history starts empty.

Suggested commit: `feat(editor): replay block move animations on undo and redo`

Remain in Phase 5 for manual review.
