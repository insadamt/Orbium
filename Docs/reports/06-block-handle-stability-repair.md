# Editor review — Block handle stability repair

Date: 2026-10-14. Status: implemented; browser/manual acceptance pending.

## Scope and findings

This is a repair within the existing CodeMirror M5 editor review. No later phase
was started. Investigation used the editor documentation, earlier handle/drag
reports, application source, and the installed CodeMirror implementation. There
was no connected browser inspection, so these are source-level findings rather
than a reproduced browser diagnosis of every reported glitch.

- Handle animation was cancelled on pointer-down. Cancellation moves the control
  immediately to its destination, even when the pointer pressed its intermediate
  animated position. The Plus button could move before click delivery.
- Focus changes always reset hover targeting to the editor selection, including
  loss of editor focus. Controls could switch away from the hovered block when
  interacting with controls or a menu.
- Margin projection used coordinate lookup when it did not hit a rich widget
  directly. CodeMirror maps the lower half of a block widget to its end boundary,
  making block identity ambiguous at that boundary.
- Drag targeting rejected points outside the editor root even though the six-dot
  control extends into the document's left margin.
- Scroll/layout refresh reused the stored block offset instead of resolving the
  block currently beneath a stationary pointer. Text-selection gestures also
  continued to update hover targeting.

## Changes

Hover and drag now share pointer targeting scoped to the originating document
island/editor height. Left-margin coordinates project onto content. Rendered
block wrappers map directly to their source start, including rich-widget padding
and lower halves. Dragging from the left margin retains a valid destination.

Handle motion pauses while the pointer is over the controls and resumes after
leaving. Pending placement and selection fallback do not replace the target while
controls are hovered/focused, a drag is pending/active, or the block menu is open.
Only focus gained by the main editor triggers its selection fallback; nested
editor focus continues to select its enclosing block. The gutter has the existing
`data-block-controls` marker used to identify control interactions.

Geometry refresh resolves the latest stored pointer coordinates. Document edits
hide obsolete controls before measuring their replacement. Touch movement and
pointer movement with a button held no longer retarget hover, preserving text
selection and drag ownership.

Existing block keyboard bindings moved into `markdown-block-keymap.ts` so the
gutter remains below 500 lines. Commands and shortcuts are unchanged. No new
packages, backend changes, migrations, or persisted-format changes were made.
Legacy Tiptap code is unchanged. No commit or push was made.

## Actual validation

- Targeted `npx vp fmt`: passed.
- `npm run types:check`: passed.
- `npm run lint`: passed; 478 files correctly formatted, 393 files linted with no
  warnings or errors.
- `npm run build`: passed in 10.22 seconds. Existing large-chunk and mixed
  static/dynamic import warnings remain.
- `git diff --check`: passed, including the completed report.
- No automated tests were written or run, as instructed.
- Browser behavior remains pending manual validation. PHP checks are not
  applicable because no PHP source changed.

## Manual test checklist

Reload Orbium and open a disposable Markdown document in Live Preview. Include
three distinct paragraphs, a heading, a multi-line list, tall code, a table, a
callout, math, and a Mermaid block.

1. Click paragraph A, hover paragraph C, and move horizontally into the left
   margin and back onto its dots. Click the dots and choose Duplicate. Expected:
   the controls remain reachable and only C is duplicated. Undo. Repeat with Plus;
   expected: an editable paragraph is inserted below C, while A stays unchanged.
2. Move quickly between distant blocks and press Plus or the dots while their
   vertical movement is still visible. Expected: the control pauses under the
   pointer, the click works once, and the indicated block receives the action.
   Leave without clicking; expected: movement resumes and settles once.
3. Move vertically through the left margin alongside the top and bottom halves
   of code, table, callout, math, and Mermaid blocks. Expected: each entire block
   retains its own handle; hovering its lower half does not select the following
   paragraph. Also check lists and wrapped paragraphs.
4. Start dragging from the dots and keep the pointer in the left margin. Drop
   before and after another block, then repeat over its text. Expected: a valid
   insertion indicator follows both paths and the same intended block moves.
   Undo each move. Drag outside the document island and release; expected: no move.
5. Drag while using the wheel and near the pane's top/bottom edge. Expected:
   scrolling and drop targeting continue to work. Press Escape during a drag,
   then try another drag and an ordinary dots click. Expected: cancellation leaves
   content unchanged, feedback clears, and subsequent actions work normally.
6. Hover a paragraph, keep the pointer stationary in the left margin, and scroll
   with the wheel. Expected: the controls follow the block now at that pointer
   height. Toggle a rich block's edit/preview or change its height; expected:
   controls do not keep targeting an obsolete block offset.
7. Drag-select text across paragraphs and inside code/table cells. Expected:
   selection stays usable without the handle chasing the selection gesture.
   Focus a nested code/table editor; expected: controls target its outer block.
   Tab to the dots and press Enter; expected: its menu targets that same block.
8. Check Ctrl/Cmd+Shift+M, Alt+Shift+Up/Down, and Ctrl/Cmd+Shift+A. Expected:
   current-block menu, movement, and whole-block source selection still work.
   Repeat hover/click checks with reduced motion, at 80%/125% zoom, and in both
   split panes. Expected: controls stay usable and affect only their own document.
9. Make a block move and a duplicate, undo/redo, wait for Saved, and reload.
   Expected: final order/content persist with no duplicates beyond the explicit
   duplicate action. Switch Source/Live Preview; expected: content survives and
   returning to Live Preview restores working controls.

## Commit suggestion

`fix(editor): stabilize block handles and margin drag targeting`

Remain in the current editor review; manual acceptance is pending.
