# Editor review — Preserve every mounted rich block during movement

Date: 2026-10-16. Implemented; manual visual acceptance pending.

## Findings and change

The user requested the same movement stability for all blocks, including PDFs and
video. Source inspection identified a shared lifecycle issue: a source move is a
removal plus insertion, and CodeMirror may destroy/recreate the corresponding
rich widget. A new media controller reloads its reader/player. Mapping a moved
source's original offsets through the deletion also loses its destination and
source-editor state. In addition, ordinary DOM cloning copies neither PDF canvas
pixels nor a video's decoded frame.

The repair is shared across all mounted Markdown rich widgets:

- A transient move registry retains existing roots/controllers during the
  synchronous transaction and motion setup. It matches original source, kind,
  context, and exact mapped destination, keeping duplicate file references
  independent. CodeMirror can reuse the original controller at its new position.
- Replaced widget instances cannot dispose a root adopted by another instance.
  Deferred roots that were not reused are released at the end of the operation.
  Ordinary deletion, source replacement, and editor teardown retain disposal.
- A move annotation maps block and content offsets, revealed source, and active
  rich-source editor positions to the inserted source. This includes inline
  widgets and rich content inside a moved top-level container.
- Snapshot construction copies PDF/other canvas pixels, captures loaded video
  frames, and strips cloned audio/video sources so snapshots do not load/play
  duplicate media. The animated frame is intentionally still for the short
  transition; the live player is revealed afterward.
- Media playing before DOM relocation resumes if the browser paused it and it
  remains connected. Paused media is not started.

This covers PDFs, video/audio, images/files, math, Mermaid, code, tables,
callouts, and other rich containers through the shared widget lifecycle. The
existing math and Mermaid preview safeguards remain. No dependencies,
migrations, APIs, or persistent formats changed. Source files remain below
500 lines. No next phase started. Browser reproduction is not claimed.

## Manual test checklist

Use a disposable Live Preview document containing each supported rich block and
paragraphs between them. Fully load previews before checking retention.

1. Open a multipage PDF, select page 2 or later, change zoom/rotation, and scroll
   inside the reader. Drag the whole block above and below other blocks. Expected:
   the PDF page remains visible during motion; after movement the same reader,
   page, zoom/rotation, and reading position remain without a reload placeholder.
2. Seek a video away from zero and pause. Move it up/down. Expected: the paused
   frame appears in motion snapshots and the live video keeps its seek position.
   Repeat during playback: expected no restart at zero or new loading card;
   playback resumes if DOM relocation caused a browser pause.
3. Repeat with audio after seeking, paused and playing, using non-default volume
   and mute. Expected: position and settings remain; paused media stays paused.
4. Include two references to the same PDF/video. Set different pages/times on
   each, then move one across the other. Expected: each retains its own state,
   with no state exchanged between identical sources.
5. Repeat moves using block-menu Move up/down and Alt+Shift+Up/Down. Move an
   ordinary paragraph across each media block. Expected: the moved block and
   displaced neighboring rich blocks keep their previews and state.
6. Move images, files, code, tables, Mermaid, display/inline math, a folded
   callout/toggle, and a container with nested media. Expected: no loading or
   unstyled flash, blank PDF page, reset folding, or reconstructed controls.
7. Open a rich source editor, move its block, then edit the source. Expected: the
   editor remains usable and writes to the moved block only. Replace an image or
   media source afterward: expected the new attachment loads normally. Remove a
   playing block: expected playback stops and its resources are released.
8. Repeat in a long scrolled document, both split panes, light/dark themes,
   non-default interface scale, and 80%/125% zoom. Interrupt motion by clicking,
   typing, scrolling, or resizing. Expected: no orphan snapshots or invisible
   content; retained readers/players remain usable. Cancel dragging with Escape:
   expected no source change.
9. Enable reduced motion and repeat media moves. Expected: immediate reordering
   with retained reader/player state and no snapshots. Disable reduced motion:
   expected normal pop/slide returns. Undo/redo, wait for Saved, reload: expected
   intact source and saved order; fresh document mounting may reload previews.

## Known limits

Retention is for mounted widgets during explicit pointer/menu/keyboard moves.
Scrolling a widget out of CodeMirror's rendered range can still unmount it; moves
to offscreen destinations can therefore release the old viewer. Undo/redo and
fresh editor mounts retain their existing lifecycle. Video snapshots require a
loaded, drawable frame; unavailable frames retain the poster fallback. Browser
playback restrictions can prevent an automatic resume after relocation.

## Commit message suggestion

`fix(editor): retain rich block previews and media state during moves`

## Actual verification

- Targeted `npx vp fmt`: PASS for changed source files.
- `npm run types:check`: PASS.
- `npm run lint`: PASS; 544 files formatted, 451 linted, no errors/warnings.
- `npm run build`: PASS in 11.62s; existing large-chunk and mixed static/dynamic
  import warnings remain.
- `git diff --check`: PASS.
- No automated tests written or run, as instructed. PHP checks do not apply.
- Browser visuals, media playback, and PDF reader retention remain pending manual
  acceptance using the checklist above.
