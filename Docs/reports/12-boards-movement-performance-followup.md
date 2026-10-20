# Board movement CPU follow-up — 2026-10-20

## Scope and evidence

Phase 4 repair after the user reported that movement still spikes CPU/temperature
with the first optimization installed. The first pass did not resolve the reported
problem. This follow-up removes additional work confirmed by source inspection;
its impact on the user's hardware is not yet measured. No later phase, schema,
API payload or content format change is involved. No commits were created.

The desktop tools did not provide a browser performance recording from the affected
Board. No temperature, CPU percentage or frame-rate improvement is claimed.
An optional clarification asks whether “moving” means block dragging, canvas
panning or pointer movement without clicking. The changes address block dragging
and camera panning; no answer is assumed for the pointer-only case.

## Changes

- Selection toolbar tracking reads the explicit block preview coordinates plus the
  camera, rather than calling `getBoundingClientRect()` on the viewport and every
  selected rich block after movement. Viewport and toolbar dimensions are cached
  at setup and through actual resize notifications. Position writes occur only
  when their values change; existing bounds clamping and edit visibility remain.
- Pointer coordinate conversion caches the viewport origin at pointer-down.
  Scroll/resize invalidates it; the next sample remeasures once. Moving blocks no
  longer forces a viewport geometry read in each preview frame. This remains a
  screen-space click threshold and retains final release flushing.
- Alignment anchors are indexed once per drag gesture. Each frame binary-searches
  the neighboring anchors for the three moving edges/center on each axis instead
  of scanning all visible objects. Duplicate positions and equal-distance matches
  retain original target/anchor priority. Grid snapping, Alt bypass, coordinate
  clamping and visible-target scope remain unchanged.
- PDF density observation compares the actual camera zoom and block content scale
  before scheduling work. Pure translation no longer resets density timers and
  does not schedule a later geometry read. Actual scale changes still use the
  existing debounce and pixel budget. The PDF reader's width observer is retained.
- Active movement adds a temporary `will-change: translate` hint only to the dragged
  blocks. Canonical painting removes the marker on release or cancellation.
  Camera motion similarly hints the world until camera settling/unmount. This
  lets browsers prepare compositing without retaining layers for every idle card.
  Layer promotion and GPU acceleration remain browser decisions.
- Multi-selection movement derives its outline directly from the moving objects;
  it no longer builds a selected-element list from all cached Board elements on
  each movement frame. Single-object resize keeps the combined selection fallback.

## Validation

- Focused `vp fmt` on modified/new source: PASS.
- `npm run types:check`: PASS (exit 0).
- Final `npm run lint` (`vp check`): PASS; all 664 checked files formatted,
  no warnings or lint errors in 556 linted files.
- Final `npm run build`: PASS (exit 0), built in 14.46 seconds. Warnings remain for
  chunks exceeding 500 kB, mixed static/dynamic imports of
  `document-image-crop-dialog`, `database-property-header`, `document-editor-loader`,
  and build plugin timings. These are build diagnostics, not a runtime CPU profile.
- `git diff --check`: PASS.
- No automated tests were written or run, per user instructions.
- No PHP source was changed; PHP checks are not applicable to this patch.
- Browser interaction and actual CPU/temperature improvement: pending user validation.

## Exact manual checklist

Load the updated assets before comparing the same Board at the same zoom/viewport.

1. Move only the pointer over empty canvas, then separately drag a plain text
   block and pan with Hand. Expected: all retain correct interaction; record which
   action actually spikes CPU. This distinguishes pointer-only work from Board
   movement rather than treating those cases as equivalent.
2. Drag text, a table, a loaded PDF and a linked Document at 50%, 100% and 200% zoom.
   Expected: the toolbar follows above/below the block and stays within the canvas;
   the block stops at release without a jump. PDF content stays intact.
3. Select several blocks and drag them. Expected: the shared outline and toolbar
   follow the group, all relative positions persist, and guides do not align the
   group to itself.
4. Drag near left/center/right and top/center/bottom anchors of other blocks,
   including overlapping blocks. Toggle guides/grid and hold Alt during movement.
   Expected: nearest guides, snapping and bypass behave as before; the guide target
   is stable when several anchors have the same coordinates.
5. Resize text from sides/corners and resize a member of a multi-selection.
   Expected: text wrapping/automatic height and toolbar bounds remain correct;
   the combined selection rectangle encloses the selected blocks.
6. Start movement and press Escape before releasing; repeat by switching focus
   away. Expected: original positions return, no preview reappears and the
   `data-board-moving` marker is absent afterward. Ordinary release also removes
   it, commits once and supports undo/redo.
7. Pan by Hand, middle mouse, Space-drag and wheel; then zoom a loaded PDF.
   Expected: viewport positions, grid and toolbar remain aligned; translation does
   not start density rendering, whereas zoom refreshes density after settling.
   The world `data-camera-moving` marker clears after settling.
8. Scroll the surrounding page or resize the window between movements; enter/exit
   Board fullscreen and repeat. Expected: the new pointer origin is used, with
   no offset selection, placement, dragging or resizing.
9. Save, reload and check moved objects. Expected: canonical coordinates persist,
   temporary compositor markers do not persist and undo/save behavior remains.
10. Compare short Performance recordings and browser CPU for dragging/panning with
    the prior build. Expected structural difference: no per-frame Board pointer
    origin/selected-block rect reads; indexed guide lookup; no PDF density timer
    churn from translation. Record actual CPU/temperature separately. If the spike
    persists, a recording of the affected Board is needed to identify remaining
    scripting, paint, rasterization, backdrop-filter or unrelated background cost.

## Limitations and handoff

Thermal resolution remains unconfirmed until manual measurement. Rich content can
still be expensive to rasterize; a compositor hint does not guarantee a particular
rendering path. Frosted styling and its backdrop filters were preserved. No claim
is made that smart guides or PDFs explain a spike caused by pointer movement alone.

Suggested commit:
`perf(boards): remove repeated layout and guide scans during movement`

Remain in phase 4 manual review.
