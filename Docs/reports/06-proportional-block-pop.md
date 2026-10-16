# Editor review — Restore proportional block pops

Date: 2026-10-16. Implemented; manual visual acceptance pending.

## Finding and change

The user reported that the vertical-only transition stretched blocks open. That
was a direct consequence of the preceding change: horizontal scale remained at
100% while vertical scale expanded from 65% to 100%.

This follow-up supersedes the vertical-only motion in commit `577b1d8`.
Both outgoing and incoming snapshots now scale uniformly between 90% and 100%
with opacity. Text, images, equations, and media preserve their proportions.
The smaller scale range limits how far content edges move. Both snapshots keep
zero translation; neighboring blocks retain their separate vertical slide.
Timings remain 80 ms exit, 140 ms neighbor rearrangement, 100 ms entrance.

Origin measurement now includes the complete visible surface of framed rich
blocks rather than just their text and media. A short left-aligned card header
can no longer pull the origin away from the card center. Images use their figure
bounds; plain text retains its visible text bounds. Hidden metadata, source
textareas, SVG style/script text, and KaTeX's hidden MathML are excluded from
text-origin measurements. This is a source-level geometry repair; no browser
reproduction or visual acceptance is claimed.

The existing widget retention and media snapshots remain in place. No
dependency, migration, API, or persistent-format changes. This remains within
the current editor review; no next phase started.

## Manual test checklist

1. Reload and move a paragraph, heading, code card, table, image, math block,
   Mermaid block, PDF, video, and audio block up and down. Expected: one small
   proportional pop out and pop in, without vertical stretching or squashed text.
2. Repeat with short left/center/right/RTL text, narrow aligned images, and wide
   cards with short headers. Expected: the pop stays centered on the visible
   content/surface, with no lateral arrival or diagonal travel.
3. Repeat using menu Move up/down and Alt+Shift+Up/Down. Expected: the same pop
   out → neighbor slide → pop in sequence; only neighbors translate vertically.
4. Repeat in split panes, a scrolled document, non-default interface scale, and
   80%/125% zoom. Expected: correct proportional sizing and pane clipping. Interrupt
   by clicking/typing/scrolling: expected clean, visible final content.
5. Check a PDF on a later page and a video paused after seeking. Expected: reader
   and playback state retained. Undo/redo, save, reload: expected correct source
   and order. Enable reduced motion: expected immediate updates without motion.

## Commit message suggestion

`fix(editor): restore proportional pops around visible block surfaces`

## Actual verification

- Targeted `npx vp fmt`: PASS, two source files.
- `npm run types:check`: PASS.
- `npm run lint`: PASS; 544 formatted files, 451 linted, no warnings/errors.
- `npm run build`: PASS in 12.95s, with existing large-chunk and mixed-import
  warnings.
- `git diff --check`: PASS.
- No automated tests written or run, as instructed. PHP checks do not apply.
- Browser visual acceptance remains pending the manual checklist above.
