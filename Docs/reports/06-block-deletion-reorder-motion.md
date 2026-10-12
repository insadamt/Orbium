# M5 review — block deletion and reorder motion

Date: 2026-10-12. Status: implemented; manual acceptance pending.

## Implemented

- Block-menu deletion removes the whole source range and neighboring blank
  separators. Surviving blocks receive one normal Markdown separator instead of
  retaining the deleted block's empty space. First/last/only-block deletion is
  handled; explicit empty-block directives remain independent blocks.
- A dedicated CodeMirror motion plugin owns GSAP snapshots and the exit, layout
  and entrance sequence. Deletion shrinks/fades the outgoing block in 80 ms, then
  surrounding rows slide for 140 ms. Reorders then add a 100 ms destination
  entrance without bounce. The consecutive sequence lasts 320 ms for movement
  and 220 ms for deletion.
- Drag-and-drop, block-menu moves and Alt+Shift+Up/Down share the animation path.
  Source transactions remain synchronous and isolated for undo. Drag layout
  measurement waits until the existing viewport-restoration frame has run.
- Temporary snapshots are inert and hidden from accessibility. Snapshot widget
  offsets cannot interfere with live editor position queries, and SVG identifiers
  are remapped to preserve diagram references without duplicating live IDs.
- New edits/selections, pointer interaction, resize, relevant scrolling during
  animation, reduced-motion changes and editor destruction cancel pending motion
  and restore original styles. Reduced motion skips snapshots and animations.

This is a focused editor M5 review change. No later migration phase is started.
No backend, database migration, API or persistent-format changes. No dependencies
were installed. Existing unrelated working-tree changes were retained.

## Commits

No commit created. Suggested messages:

- `fix(editor): collapse spacing when deleting markdown blocks`
- `feat(editor): animate block deletion and reordering`
- Combined: `fix(editor): close deleted block gaps and animate reordering`

## Validation

- Targeted `vp fmt`: PASS.
- `npm run types:check`: PASS.
- `npm run lint`: PASS; 391 formatted files, no warnings/errors in 322 linted files.
- `npm run build`: PASS. Existing warnings remain for chunks over 500 kB and mixed
  static/dynamic imports of document image crop, media menu, database property
  input/header, document opening preview and document editor loader modules.
- `git diff --check`: PASS.

No automated tests were written or run, as instructed. No PHP files changed in
this task, so PHP checks were not applicable. Browser acceptance remains the
user's manual review.

## Manual checklist

Use a disposable Markdown document in Live Preview with paragraphs A, B and C,
a multiline paragraph, a list, a code block, a table, a Mermaid diagram and a
divider. Include a separate long document for viewport checks.

1. Open B's grip menu and choose Delete. Expected: B shrinks/fades; C slides up
   toward A; only normal block spacing remains. Switch to Source: A and C have
   exactly one blank separator line. Undo once: B and the original spacing return.
2. Restore A/B/C. Delete the first block, then the last block, then the sole
   remaining block. Expected: no leading/trailing gap remains, and the empty
   document accepts typing. Undo each deletion: complete content returns.
3. In Source put several blank lines on both sides of B. Return to Live Preview
   and delete B. Expected: only one normal blank separator remains between A/C.
   Add an explicit empty block with Plus next to B and repeat: that independent
   empty block remains. Delete multiline text, a list, code, table, diagram and
   divider between paragraphs: each disappears completely without leftover fences,
   table rows or metadata, and surrounding blocks close the space.
4. Drag A below C and then back above B. Expected: A shrinks at its old position,
   surrounding blocks slide up/down, and A expands at the indicated destination.
   Repeat using menu Move up/down and Alt+Shift+Up/Down: the same motion and correct
   order apply. A same-position drop makes no source change or new undo step.
5. Move multiline text, lists, tables, code, diagrams and customized dividers.
   Expected: complete blocks retain their contents and appearance. Repeat ten
   moves: no extra blank paragraphs accumulate. Undo once after a move: previous
   order returns. Redo, wait for Saved, reload: final order/deletion persists.
6. In the middle of a long document, drag to a visible boundary; repeat after
   wheel/edge scrolling and in a split pane at 80%/125% browser zoom. Expected:
   the existing insertion-anchor viewport behavior remains, the moved block's top
   stays visible where possible, and no focus/caret jump occurs on pointer drop.
   Releasing outside the originating pane or pressing Escape makes no move.
7. Start another move/delete, click elsewhere or type immediately, scroll during
   motion, resize, or navigate away and back. Expected: no invisible content,
   lingering ghost, stale transform or lost edit. Repeat in Light/Dark, RTL text
   and a custom editor theme: snapshots and final blocks remain readable.
8. Enable the operating system/browser reduced-motion preference and repeat
   deletion and all three movement methods. Expected: spacing and order update
   immediately without shrinking, expanding or sliding. Change the preference
   during animation: temporary visuals clear and final content remains visible.

## Limitations and stop gate

Animation covers rendered visible rows; offscreen blocks receive the source edit
without a visible transition. Browser motion, rich-block snapshots, long-document
scrolling and split-pane acceptance remain unverified until the checklist is run.
The retained legacy Tiptap editor is unchanged. Existing cross-document and nested
reparenting limitations remain. Wait for M5 manual review; do not start M6.

## Review follow-up — consecutive motion

The user reported a glitchy animation that appeared to play twice and requested
one fast sequence: pop out → rearrange → pop in. The original entrance overlapped
the surrounding row transitions and used overshooting easing. Live rows were also
being transformed while CodeMirror could measure them.

The repair uses consecutive 80/140/100 ms stages, removes overshooting easing, and
explicitly sets initial positions/opacity before playback. All movement happens
on inert snapshots; the live editor stays at its final, untransformed layout and
is revealed when the sequence finishes or is interrupted. Existing undo, spacing,
autosave and pointer-drop viewport behavior remain in place.

### Focused manual follow-up

1. In A/B/C, drag A below C, then drag it back to the first position. Expected:
   one quick pop out, one slide of surrounding blocks, then one destination pop
   in; no overlap, bounce, second move or final-position flash.
2. Repeat using menu Move up/down and Alt+Shift+Up/Down with paragraphs, a code
   block, a table and a Mermaid block. Expected: the same consecutive sequence,
   intact blocks and no extra movement when the animation ends.
3. Delete B between A/C. Expected: B pops out once, then C slides up once and
   normal spacing remains. Undo once, redo, wait for Saved and reload. Expected:
   content and order reflect the final operation.
4. Repeat a drag in the middle of a long document and in a split pane. Interrupt
   motion by typing, clicking or scrolling. Expected: no additional viewport
   jump, lingering copy or invisible content; the final layout remains editable.
5. Enable reduced motion and repeat move/delete. Expected: immediate updates
   without animated stages, with correct order and spacing.

Follow-up commit suggestion:
`fix(editor): sequence block motion without overlapping transitions`

Follow-up checks: targeted formatting PASS; `npm run types:check` PASS;
`npm run lint` PASS (391 formatted files, 322 linted files, no warnings/errors);
`npm run build` PASS in 9.20 seconds with the existing bundle-size and mixed-import
warnings; `git diff --check` PASS. No automated tests written or run.
Manual browser acceptance remains pending.

## Review follow-up — stationary pop

The user reported that the moved block appeared to travel downward instead of
popping out. Snapshot layers were positioned relative to the editor, which can
move on screen during pointer-drop viewport compensation. The slight centered
shrink could also pull the top of tall blocks downward.

Snapshots now live in inert, fixed screen layers clipped to the originating
pane. Editor theme classes, custom-style scope, CSS variables and interface scale
are retained. The pop shrinks to 65% with a top-center origin and fades, keeping
its top edge fixed. The destination uses the same origin and scale; surrounding
rows alone receive vertical translation. The 80/140/100 ms sequence is retained.
Source transactions, separator cleanup, undo and autosave are unchanged.

### Stationary-pop manual checklist

1. Create A/B/C and drag A below C, then back above B. Expected: A visibly shrinks
   and disappears at its old screen position, other blocks slide once, and A
   expands at the new position without falling/sliding into it.
2. Repeat with a tall table, multiline paragraph and code block, using drag,
   menu Move up/down and Alt+Shift+Up/Down. Expected: the moved block's top edge
   stays fixed during each pop; only neighboring blocks travel vertically.
3. In a long document or split pane, move a block after wheel/edge scrolling.
   Expected: viewport compensation cannot drag the outgoing pop downward, and
   snapshots stay clipped to the originating pane. Repeat at 80%/125% browser zoom
   with Light/Dark and a custom editor theme: size and appearance match live blocks.
4. Delete a middle block, undo, redo, save and reload. Expected: one stationary
   exit followed by gap closure; content/order persist. Interrupt by clicking,
   typing, scrolling or navigating: no lingering screen overlay or hidden content.
5. Enable reduced motion and repeat. Expected: immediate correct edits with no
   overlays or animated stages.

Commit suggestion: `fix(editor): anchor block pops to their screen positions`

Final checks: targeted formatting PASS; `npm run types:check` PASS;
`npm run lint` PASS (391 formatted files, 322 linted files, no warnings/errors);
`npm run build` PASS in 10.29 seconds with existing bundle-size and mixed-import
warnings; `git diff --check` PASS. No automated tests written or run.
Manual acceptance remains pending.

## Investigation — direction asymmetry and blinking

The user reported that bottom-to-top moves looked better than top-to-bottom
moves, and that some operations only blinked. This follow-up supersedes the
preceding insertion-anchor viewport descriptions.

Source inspection found three interacting defects:

- The drop helper anchored the block above the insertion line. On a downward
  move, removing the source above that anchor moves the anchor upward and causes
  compensating scroll. On an upward move, the source is below the anchor and
  does not produce the same compensation. Equal animation timings therefore
  did not produce equal viewport behavior.
- The animation canceled on every relevant scroll event. Scroll events from
  restoration can be delivered after restoration has finished and playback has
  begun, causing an immediate reveal of final content instead of the sequence.
- Fixed snapshot layers clipped to the final rows' bounding box. A row translated
  back to its old position could be outside that box, especially near the first
  or last visible block, and disappear rather than slide through its path.

Repairs:

- Both move directions preserve the drag-reached scroll offsets. Only a clipped
  destination top receives visibility compensation; physical scroll limits may
  still clamp offsets. The direction-dependent preceding-anchor correction is
  removed, while pointer drops continue to avoid caret/focus jumps.
- Capture a baseline of actual pane/ancestor/window scroll offsets immediately
  before playback. A queued event at unchanged offsets does not cancel motion;
  real scrolling still interrupts and clears snapshots.
- Snapshot layers cover and clip to the complete originating pane. Their inner
  surfaces retain the captured block geometry, so moved rows can cross old and
  final block bounds while remaining visible inside the pane.

These findings are from source inspection; browser reproduction and final visual
acceptance remain pending. No timing, easing or source-format changes were added
in this repair. The sequence remains 80 ms out, 140 ms shift and 100 ms in.

### Direction comparison manual checklist

1. Use A/B/C in a document tall enough that the scrollbar is away from either end.
   Drag A below C; then drag it back above B. Expected: both directions show one
   complete pop-out, rearrangement and pop-in sequence. The scrollbar stays at its
   release position when the destination is already visible; only neighbors slide.
2. Repeat moving the first visible block down and the last visible block up.
   Expected: moving rows remain visible along the entire path inside the pane;
   no blank band, clipped entrance or final-state blink replaces the animation.
3. Repeat after wheel scrolling and edge auto-scroll, and in split panes at
   80%/125% browser zoom. Expected: a queued restoration scroll does not suppress
   playback; each pane retains its release viewport. A destination clipped at the
   pane edge is brought into view, and physical scroll limits may clamp offsets.
4. Compare menu and Alt+Shift+Up/Down moves of paragraphs, multiline text, lists,
   code, tables and Mermaid. Expected: intact blocks and the same stage ordering
   in both directions. During playback actually scroll, click or type: expected
   immediate clean final layout without invisible content or lingering overlays.
5. Delete the middle block, undo/redo, save/reload, and repeat with reduced motion.
   Expected: gap closure and persistence remain correct; reduced motion applies
   edits immediately without animation.

Commit suggestion:
`fix(editor): align reorder viewports and avoid scroll-canceled motion`

Final checks: targeted formatting PASS; `npm run types:check` PASS;
`npm run lint` PASS (391 formatted files, 322 linted files, no warnings/errors);
`npm run build` PASS in 8.63 seconds with existing bundle-size and mixed-import
warnings; `git diff --check` PASS. Automated tests were neither written nor run,
as instructed. Browser reproduction and visual acceptance remain pending.

## Review repair — document blanking during movement

The user reported that the entire document became blank briefly during a move.
The previous implementation explicitly set the live editor container's opacity
to zero and relied on whole-document snapshots until playback completed. Any
snapshot visibility or clipping failure therefore blanked the document.

The full-document snapshots and editor-opacity changes are removed. Only the
outgoing block gets an inert snapshot. After the source edit, live neighboring
rows are staged synchronously before the next paint and slide into their final
positions. Only rows belonging to the moved block get temporary entrance opacity;
unaffected blocks retain their original opacity throughout. The exit starts
immediately, and scroll-baseline capture still waits for drop restoration.
Completion/interruption restores row styles and requests a fresh CodeMirror
measurement. The consecutive 80/140/100 ms stages, symmetric viewport offsets,
separator cleanup, undo and autosave remain unchanged.

This supersedes earlier claims that animation uses whole-document inert snapshots
and hides the live editor until the sequence finishes. No editor-container opacity
or visibility writes remain in the motion plugin.

### Blanking repair manual checklist

1. Reload and open A/B/C plus several other paragraphs. Drag A below C and back
   above B. Expected: surrounding text remains visible during every frame; only
   A disappears between its exit and destination entrance. No document-wide blank.
2. Repeat with menu Move up/down and Alt+Shift+Up/Down using paragraphs, a tall
   table, code and Mermaid. Expected: one consecutive sequence with neighboring
   blocks visible and no jump after styles are restored.
3. Repeat in a long scrolled document and a split pane. Move near the first/last
   visible block and at 80%/125% browser zoom. Expected: no blank document or pane;
   visible destinations preserve scroll offsets in both directions.
4. While motion is active, click, type, scroll or navigate away. Expected: final
   live content stays visible/editable, original styles return, and no snapshot
   remains. Delete B, undo/redo, save/reload: expected normal spacing and persistence.
5. Enable reduced motion and repeat. Expected: immediate edits with correct order
   and no snapshots or animated stages.

Commit suggestion: `fix(editor): keep document visible during block motion`

Final checks: targeted formatting PASS; `npm run types:check` PASS;
`npm run lint` PASS (391 formatted files, 322 linted files, no warnings/errors);
`npm run build` PASS in 8.99 seconds with existing bundle-size, mixed-import and
plugin-timing warnings; `git diff --check` PASS. No automated tests written or run;
manual visual acceptance remains pending.

## Review repair — entrance from the upper-right

The user reported that the moved block seemed to arrive from the upper-right
instead of popping in place. The entrance scaled a full-width row around its top
center. For a short left-aligned paragraph, that origin sits far to the right of
the visible text, so scaling translates the text sideways even without a `y`
animation. This is a geometry finding from source inspection.

A focused pop-origin helper now measures visible text ranges and media/table
bounds. Both the outgoing snapshot and the destination entrance scale around the
visible content's center. Incoming rows explicitly start with zero horizontal
and vertical translation. Blank content falls back to the row's center. Timing,
neighbor slides, document visibility, scroll behavior, undo and autosave remain
unchanged. No dependencies or persistent-format changes.

### Pop-origin manual checklist

1. Reload and move a short left-aligned paragraph up and down using the grip,
   menu and Alt+Shift+Up/Down. Expected: it expands around its visible center at
   the destination, with no arrival from the upper-right or other corner.
2. Repeat with long/multiline paragraphs, centered and right-aligned text, RTL
   text, code, a table, image, diagram and divider. Expected: the pop origin follows
   the visible content; neighboring blocks retain their vertical slide.
3. Repeat in a scrolled document, a split pane and at 80%/125% browser zoom.
   Expected: no diagonal entrance, document-wide blank or extra viewport jump
   for visible destinations.
4. Undo/redo, wait for Saved and reload. Expected: correct order and intact content.
   Interrupt by clicking/typing/scrolling: expected clean visible final content.
   Enable reduced motion: expected immediate edits without animated stages.

Commit suggestion: `fix(editor): center block pops on visible content`

Final checks: targeted formatting PASS; `npm run types:check` PASS;
`npm run lint` PASS (392 formatted files, 323 linted files, no warnings/errors);
`npm run build` PASS in 11.04 seconds with existing bundle-size and mixed-import
warnings; `git diff --check` PASS. No automated tests written or run;
manual visual acceptance remains pending.
