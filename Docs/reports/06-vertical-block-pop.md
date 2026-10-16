# Editor review — Keep block pops from moving sideways

Date: 2026-10-16. Implemented; manual visual acceptance pending.

## Finding and change

The user reported that some blocks appeared to arrive from the left and requested
a commit. Previous rich-widget preservation work was already committed as
`2c86920 fix(editor): retain rich block previews and media state during moves`.

The pop scaled the full snapshot on both axes. Horizontal scaling changes the
screen positions of content away from the transform origin; aligned content and
wide card surfaces can consequently appear to travel sideways. This is a
source-level geometry finding, not a browser reproduction.

Both outgoing and incoming pops now keep horizontal scale at 100%, with explicit
zero x/y translation. Only vertical scale changes between 65% and 100%, alongside
opacity. Neighboring blocks retain their vertical slide and the existing
80/140/100 ms sequence. Rich widget retention, reader/player state, PDF/video
snapshots, source edits, undo, autosave, and reduced-motion behavior are retained.

No dependencies, migrations, API, or persistent-format changes. This remains
within the current editor review; no next phase started.

## Manual test checklist

1. Reload a Live Preview document containing short/long paragraphs and headings
   with left, center, right, and RTL alignment. Drag each upward and downward.
   Expected: each block pops vertically in place, keeping its horizontal position
   and width throughout; no arrival from either side.
2. Repeat with images of different widths/alignment, PDFs, videos, audio, tables,
   code, Mermaid, display math, and nested containers. Expected: the same vertical
   pop, intact previews, and no lateral card movement or final-width snap.
3. Repeat with block-menu Move up/down and Alt+Shift+Up/Down. Expected: one pop
   out, vertical neighbor slide, and one pop in using the same stationary width.
4. Repeat in a scrolled document, split panes, non-default interface scale, and
   80%/125% zoom. Expected: snapshots remain aligned and clipped to their pane.
   Interrupt by typing/clicking/scrolling: expected clean, visible final content.
5. Move a PDF on a later page and a video paused after seeking. Expected: reader
   and playback state remain intact. Undo/redo, save, reload: expected correct
   source/order. Enable reduced motion: expected immediate correct updates.

## Commit message suggestion

`fix(editor): keep block pops vertical without sideways scaling`

## Actual verification

- Targeted `npx vp fmt`: PASS.
- `npm run types:check`: PASS.
- `npm run lint`: PASS; 544 formatted files, 451 linted, no warnings/errors.
- `npm run build`: PASS in 13.38s; existing large-chunk, mixed-import, and
  plugin-timing warnings remain.
- `git diff --check`: PASS.
- No automated tests written or run, as instructed. PHP checks do not apply.
- Browser visual acceptance remains pending the manual checklist above.
