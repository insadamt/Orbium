# Block drag edge scrolling

## Scope and implementation

Focused repair of the current Markdown editor's block dragging. No phase
advancement, dependencies, migrations, or persistent-format changes.

- Edge scrolling runs independently of block hit testing, so padding or clipped
  content under the pointer cannot prevent it from starting.
- The top and bottom activation bands extend 96 CSS pixels into the visible
  document pane, capped at one quarter of its height.
- Speed increases quadratically with proximity, from 80 to 1,400 CSS pixels per
  second. Pointers beyond the vertical edge retain maximum speed.
- Horizontal bounds follow the document surface and clipping ancestors. The grip
  gutter remains included; moving into another pane stops automatic scrolling.
- Existing insertion targeting, wheel input, drop behavior, and drag cleanup
  remain in use. No drop is accepted without a valid block target.

## Validation

- Targeted formatting: passed (two source files).
- `npm run types:check`: passed.
- `npm run lint`: passed (544 formatted files; 451 linted files, no warnings/errors).
- `npm run build`: passed in 10.79 seconds. Warnings remain for chunks larger
  than 500 kB, mixed static/dynamic imports, and plugin hook timings.
- `git diff --check`: passed.

No automated tests were written or run, following the user's instructions.
Browser/manual acceptance remains pending. No commit created.

## Manual test checklist

1. Open a document long enough to scroll several screens. Start dragging a block
   using its grip, then hold near the bottom of the visible pane without moving
   the pointer or using the wheel. Expected: scrolling continues downward and
   the insertion line updates as blocks pass under the pointer.
2. Move slowly closer to the bottom edge. Expected: scrolling starts gently in
   the edge band and becomes faster toward the edge. Move back into the middle;
   expected: automatic scrolling stops while the drag remains active.
3. From the middle of the document, repeat at the top edge. Expected: the same
   increasing speed upward. Move past the pane's vertical edge while staying
   inside the browser; expected: maximum speed continues until the scroll limit.
4. Repeat while the pointer is over the grip gutter and blank spacing near an
   edge. Expected: automatic scrolling works without a block directly underneath.
5. Repeat in split view. Expected: only the originating pane scrolls. Move into
   the other pane; expected: automatic scrolling stops and releasing there does
   not move content between documents. Move back near the originating pane edge;
   expected: scrolling resumes. Repeat at 80% and 125% interface/browser zoom.
6. During edge scrolling, release at a visible insertion line. Expected: the
   block moves there and scrolling stops. Repeat with Escape and window blur;
   expected: no move, preview, insertion line, or lingering automatic scrolling.
7. At the document's beginning/end, keep holding at the corresponding edge.
   Expected: no jitter or scrolling beyond the physical limit. Move to the
   opposite edge; expected: scrolling reverses. Verify wheel input while dragging,
   undo/redo, and save/reload; expected: existing behavior and order persist.

## Limitations

Touch behavior remains manually unverified. Scrolling stops at physical scroll
limits. Edge scrolling follows the originating pane even when the pointer is
over its header; insertion still requires a valid document block target.

## Follow-up: intermittent scrolling repair

The user reported inconsistent activation. Code inspection identified that the
animation loop depended on an actual offset change in its first frame. A zero
or negative initial frame interval, rounded movement, or temporarily unchanged
layout could stop the loop until another pointer move. Edge holds now continue
requesting frames regardless of movement; negative intervals are clamped to zero.
Leaving the edge band or finishing the drag still ends the loop.

Embedded split documents also grow their iframe to content height and scroll a
parent pane. The original traversal ended at the embedded document root. Scroll
container discovery now crosses same-origin iframe boundaries, projects host
clipping geometry into editor coordinates, and includes the parent scrollbar.
It stops scroll propagation at the originating split pane. A captured screen
position is reprojected as the iframe moves beneath a stationary pointer, keeping
edge direction and drop geometry current without requiring pointer motion.

Additional manual checks:

1. In a long document, repeat a quick drag into each edge band ten times, holding
   still for several seconds each time. Expected: consistent activation and
   continuous movement without needing to wiggle the pointer. Repeat near the
   start of the slowest part of each activation band.
2. Open two documents in split view and repeat in each pane, including the
   embedded document. Hold still long enough to scroll several screens.
   Expected: scrolling continues in the intended direction; the insertion line
   follows the content and does not reverse as the host pane moves the iframe.
3. Repeat at 80%, 100%, and 125% zoom, then release on a visible paragraph.
   Expected: insertion matches the displayed line. Reach each physical scroll
   limit; expected: no scrolling of the outer workspace or neighboring pane.
4. Return to the middle, press Escape, release, and switch away from the window
   in separate drags. Expected: scrolling stops in every case, with no lingering
   preview. Check undo, save/reload, and wheel scrolling afterward.

Follow-up validation: targeted formatting, TypeScript, and lint passed (545
formatted files; 452 linted files, no warnings/errors). Production build passed
in 10.05 seconds with bundle-size and mixed-import warnings. Final
`git diff --check` passed. No automated tests written or run. Manual acceptance
is pending; no commit created.

## Suggested commit

`fix(editor): accelerate block dragging near viewport edges`

Follow-up suggestion: `fix(editor): keep block edge scrolling active across split panes`
