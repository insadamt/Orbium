# Editor review — Consistent block motion and top handles

Date: 2026-10-16. Implemented; manual visual acceptance pending.

## Findings and changes

- Motion previously preferred the first nested rich-widget offset over the row's
  CodeMirror position. Inline math could therefore misidentify an entire paragraph.
  Motion now reads the complete rendered row's DOM position.
- Motion transformed live CodeMirror rows and animated destination rows separately.
  It now animates inert snapshots, grouping all rendered destination rows into one
  pop. Live row geometry stays untransformed. Participating live rows are temporarily
  transparent; untouched rows stay visible. The sequence remains 80 ms pop out,
  140 ms neighbor movement, and 100 ms pop in.
- Rich decorations refresh synchronously before motion staging, reducing the risk
  that deferred parsing replaces the elements selected for animation.
- Rich blocks now resolve to their complete top-level layout wrapper, matching text
  blocks. Grip placement chooses the earliest visible content row instead of
  globally preferring a nested toolbar or centering on a tall table row. Padding,
  borders, and interface scale remain part of the calculation.
- Snapshot construction is extracted into a focused module. Every changed source
  file remains below 500 lines. Updated the editor documentation.

This fixes the current editor review only. No next phase was started. No backend,
API, dependency, migration, or persistent-format changes. No commit created.

## Actual verification

- Targeted `npx vp fmt`: PASS, three source files.
- `npm run types:check`: PASS.
- `npm run lint`: PASS, 542 files formatted; 449 files linted, no warnings/errors.
- `npm run build`: PASS in 12.82 seconds. Warnings remain for large chunks and
  mixed static/dynamic imports.
- `git diff --check`: PASS.
- No automated tests written or run, as instructed. PHP checks are not applicable.
- Browser visuals and pointer behavior have not been manually verified.

## Manual test checklist

Use a disposable document in Markdown Live Preview. Include paragraphs A/B/C,
a wrapped paragraph containing inline math, headings, bullet/number/task lists,
a quote, callout, toggle, columns, code, table with a tall first row, Mermaid,
display math, image, file, video/audio/PDF where available, divider, and empty block.

1. Hover each block from its upper and lower portions. Expected: Plus and six dots
   stay beside the top content row, never the block's middle/bottom. A nested code
   or diagram toolbar inside a container must not move the outer block's handle
   down to that toolbar. Tall table headers must not lower the grip.
2. Drag A below C, then above B. Expected: one pop out at the source, surrounding
   blocks slide vertically into order, then one pop in at the destination. No
   bounce, diagonal travel, duplicate entrance, document blanking, or final snap.
3. Repeat in both directions for each block type listed above. Expected: complete
   blocks move with intact content, and each moved block pops as one unit. Inline
   math stays part of its paragraph; multiline blocks do not animate line by line.
4. Repeat using block-menu Move up/down and Alt+Shift+Up/Down. Expected: the same
   sequence and correct ordering. Edit rich source, return to preview, then move
   again; expected: no blink caused by a late preview replacement.
5. Repeat in a long scrolled document, both split panes, at 80%/125% browser zoom,
   with a non-default interface scale, centered/right/RTL text, and light/dark
   themes. Expected: handles remain at the top, snapshots match the content and
   stay clipped to their originating pane, and visible drops retain scroll position.
6. Interrupt motion by clicking, typing, scrolling, resizing, or leaving the page.
   Expected: no lingering snapshot, invisible block, stale transform, or lost edit.
   Cancel a drag with Escape; expected: order unchanged.
7. Delete a middle block. Expected: it pops out and neighbors close the gap. Undo
   and redo a move/deletion; expected: intact source and correct order. Wait for
   Saved and reload; expected: final content/order persists.
8. Enable reduced motion and repeat drag/menu/keyboard moves and deletion.
   Expected: immediate correct updates without pop/slide animation. Toggle reduced
   motion during animation; expected: clean final content without temporary visuals.

## Limits and stop gate

Only rendered rows receive animation. Legacy JSON/Tiptap behavior is unchanged.
Visual acceptance remains pending the checklist above. Remain in this editor
review until the user approves moving to another phase.

## Commit message suggestions

- `fix(editor): unify block reorder motion and top-align drag handles`
- Alternatively split by responsibility:
  - `fix(editor): animate complete block snapshots without transforming live rows`
  - `fix(editor): anchor block grips to the first visible content row`

## Follow-up — animation stopped during manual review

The user reported that animation no longer played. Source inspection found two
fragile parts of the previous change: inline opacity writes dirty CodeMirror's
row attributes, and any selection transaction canceled playback even if it only
reasserted the existing selection. This investigation does not claim a browser
reproduction of the reported failure.

The repair masks participating live rows using a temporary stylesheet scoped to
the originating editor. It no longer writes animation styles onto live rows;
GSAP operates on snapshots only. The stylesheet and scope attribute are removed
on completion/interruption. Snapshot ownership is assigned after the rich refresh,
so setup updates cannot clear the outgoing snapshot reference. Cancellation now
requires an actual selection change, while document changes, pointer input,
scrolling, resize, and reduced-motion changes retain their interruption behavior.

Actual checks: targeted formatting PASS; types PASS; lint PASS (542 formatted
files, 449 linted, no errors/warnings); build PASS in 13.91s, with large-chunk,
mixed-import and plugin-timing warnings; diff check PASS. No automated tests
written or run. Browser acceptance remains pending.

### Focused manual retest

1. Reload the app and open a Live Preview document containing paragraphs A/B/C.
   Drag A below C, then back above B. Expected: pop out, neighbor slide, pop in,
   with no immediate final-layout reveal or blank page.
2. Repeat with a wrapped paragraph containing inline math, code, a tall table,
   Mermaid, and a container. Use drag, menu moves, and Alt+Shift+Up/Down.
   Expected: one complete-block sequence for each operation and correct order.
3. Scroll mid-document and repeat. Interrupt by typing/clicking/scrolling, then
   perform another move. Expected: no hidden content or lingering snapshots;
   subsequent moves still animate. Undo/redo, save, and reload: order persists.
4. Enable reduced motion. Expected: immediate correct edits; disable it and
   repeat: animation returns. Six-dot handles remain beside the top content row.

Commit suggestion: `fix(editor): preserve block motion across editor redraws`

## Follow-up — snapshots animated outside the visible pane

The user again reported blinking without motion. Further inspection found a
specific CSS cascade conflict missed in the previous investigation:
`@codemirror/view`'s base theme sets `position: relative !important` on its theme
root. Snapshot layers copy that root's classes to preserve editor styling but
assigned ordinary inline `position: fixed`. The important theme declaration wins,
so snapshots remain in document flow below the editor instead of overlaying their
captured screen bounds. Masking the real rows then appears as blinking.

Snapshot layers now set inline `position: fixed !important`, which takes
precedence over that stylesheet rule. This applies to outgoing, incoming, and
neighbor snapshots through the shared constructor. Theme classes and viewport
clipping are retained. The source-level conflict is confirmed; browser visual
acceptance is still pending. The earlier row-style/selection changes did not
resolve the user's reported symptom on their own.

### Manual test checklist

1. Reload and drag A below C, then back above B. Expected: outgoing pop at the old
   position, neighbors slide vertically, then incoming pop at the new position;
   no blink or animated content appearing below the document.
2. Repeat with code, table, Mermaid, image, inline-math paragraph, and a container;
   use menu moves and Alt+Shift+Up/Down. Expected: visible complete-block motion
   for both directions and intact content.
3. Repeat in a scrolled document and both split panes. Expected: snapshots stay
   aligned with content and clipped to their originating pane; no temporary extra
   page height or scrolling caused by snapshot layers.
4. Interrupt by clicking/typing/scrolling, then move again. Expected: all content
   remains visible and editable, with no snapshot left behind. With reduced motion
   enabled, expected: immediate updates without animation. Undo/redo and reload:
   expected: correct saved content/order.

Commit suggestion: `fix(editor): override CodeMirror positioning on motion snapshots`

Actual validation for this positioning repair: targeted formatter PASS;
`npm run types:check` PASS; `npm run lint` PASS (542 formatted files,
449 linted, no warnings/errors); `npm run build` PASS in 13.80s with existing
large-chunk, mixed-import and plugin-timing warnings; `git diff --check` PASS.
No automated tests written or run. No commit, migration, or dependency change.
