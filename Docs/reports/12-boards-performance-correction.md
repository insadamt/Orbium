# Board interaction CPU correction — 2026-10-20

## Phase and scope

Phase 4 manual review repair, authorized by “can you fix it” after the Board CPU
investigation. No later feature phase was started. This is an implementation repair,
not a measured temperature claim. The user performs browser/manual validation.

## Implemented

- Pointer events retain the latest sample per active pointer. Coordinate reads,
  alignment search, resize calculation and painting run once per animation frame.
  Idle pointer movement returns without reading geometry. Both touch samples are
  applied before resolving pinch. Release flushes its final sample synchronously.
- Object elements are collected once per movement/resize gesture. Drag previews
  translate existing surfaces rather than relaying out left/top every frame.
  Release writes canonical coordinates and clears translation; cancellation restores
  originals. Multi-selection bounds and floating toolbars follow the live preview.
- Camera panning translates the existing world. Native layout zoom still changes
  for actual zoom, retaining the established text/vector clarity behavior.
- Resize reuses cached objects, measures content after width/scale changes and
  skips unchanged style writes. Guide DOM is not replaced when geometry is unchanged.
- Automatic-height observations accumulate into one derived Board update per frame
  instead of mapping/queuing the whole Board separately for every changed card.
  Measurements tied to an obsolete object snapshot are discarded. Height changes
  preserve undo/redo behavior and pending measurements are canceled on unmount.
- Full linked-Document previews start through a shared idle queue with at most two
  active fetches. Queued cards are removed on cleanup and active fetches are aborted.
  Preview editing still uses the existing direct fetch/cached source path.
- Math/diagram blocks do not instantiate hidden preview sessions or render hidden
  math while editing their source. Finishing editing renders the current source.
- Save validation caches unchanged immutable block content across saves while
  rechecking object geometry, IDs and aggregate limits. Server validation is intact.
- Debounced recovery serialization yields through the existing idle scheduler
  (250ms timeout, 16ms timer fallback). New edits cancel obsolete queued idle work.
  Save, guarded exit, hidden-page and error paths still persist recovery immediately.
  Successful saves and loading/adopting saved snapshots cancel pending recovery work.

## Persistence and commits

No migrations, Board content/spatial format changes, new dependencies or API payload
changes. No commits were created. Existing unrelated working-tree edits were kept.

Suggested commits:

- `perf(boards): reduce opening and interaction CPU work`
- Alternatively split the source-preview/save work into
  `perf(boards): defer hidden previews and reuse content validation`.

## Validation

- Focused `vp fmt` on changed source: PASS.
- `npm run types:check`: PASS (exit 0).
- `npm run lint` (`vp check`): PASS; all 662 checked files formatted, no warnings
  or lint errors in 554 linted files.
- `npm run build`: PASS (exit 0), final build completed in 15.94 seconds.
  Warnings: chunks larger than 500 kB; mixed static/dynamic imports for
  `document-image-crop-dialog`, `database-property-header` and
  `document-editor-loader`; build plugin timing advisory. These warnings do not
  measure runtime Board interaction cost.
- `git diff --check`: PASS.
- No automated tests were written or run, as required by the user's instructions.
- PHP formatting/syntax checks are not applicable because this repair changes no
  PHP source. Other existing PHP/editor working-tree edits were left untouched.
- Browser/manual/thermal checks: pending the user's validation.

## Exact manual acceptance checklist

Use the same affected Board, browser, zoom and viewport as before. Load the updated
assets first. Compare browser CPU and responsiveness as well as temperature; this
implementation has not been profiled on the affected machine.

1. Open a Board with many text blocks, tables, linked Documents and PDFs. Wait for
   previews to finish. Expected: preview loading progresses, errors remain visible,
   automatic content heights settle, and the Board stays usable while loading.
   In Network, full linked-Document preview requests have at most two active fetches
   from this queue; summary, attachment and active-editor requests are separate.
2. Move the pointer over empty canvas without holding a button. Expected: no Board
   pointer layout processing, movement or save request from pointer movement alone.
3. Drag a text block, then a table, loaded PDF and linked Document. Release quickly
   after a fast movement. Expected: each stops exactly at the release position;
   internal rich content remains intact, with no jump back or leftover translation.
   Media playback controls and resource scrolling retain their normal ownership.
4. Select several objects and drag from an object and from the selection border.
   Expected: all objects move together; the outline, guides and floating toolbar
   track the group. Save/reload restores the same relative positions.
5. Drag toward another block with guides enabled; hold Alt to bypass snapping.
   Enable grid snapping and repeat. Expected: guides/grid snapping and Alt bypass
   behave as before, with no trailing stale guide lines on release.
6. Start a drag, press Escape while holding the pointer, then release. Repeat for
   a resize and cancel by switching focus away. Expected: original geometry returns,
   no later frame reapplies the canceled preview and no canceled history step is added.
7. Resize text/list/code/table blocks from the sides and corners. Add/remove wrapped
   text afterward. Expected: width/whole-block scaling follow the pointer; live
   content height and selection borders track wrapping, and height grows/shrinks.
   Resize/crop an image and resize a resource viewport too; frames remain correct.
8. Pan with Hand, Space-drag, middle mouse and wheel at 50%, 100% and 200% zoom.
   Zoom around the pointer, use Fit and reset. Expected: camera positions, grid,
   pointer placement, toolbars and content stay aligned; text/PDF clarity is retained.
9. On a touch device, pinch while moving both fingers, release one, then continue
   panning with the remaining finger. Expected: no finger samples are lost, no
   large camera jump occurs and cancellation leaves no stuck gesture.
10. Edit math and Mermaid source for several seconds, then finish editing.
    Expected: source input stays responsive; the final equation/diagram renders
    from the latest source. Re-enter, change source, finish and undo/redo; the preview
    follows the current source. Invalid source still shows the normal error state.
11. Type and delete text through several line wraps; exercise undo/redo and list
    actions. Wait for Saved, reload. Expected: no extra undo steps from measured
    height; text, formatting and final geometry persist.
12. Open a large linked-page Board and pan cards out of view before they load;
    navigate away once clean. Return and Refresh a card, enter/leave editing and
    scroll its Document. Expected: canceled queued requests do not start, canceled
    fetches do not populate stale cards, remaining previews load, source/scroll
    continuity and original-Document saving remain intact.
13. In a disposable Board, disable network, edit, and wait for the save error.
    Re-enable network and retry. Expected: local recovery remains available and
    successful saving removes the recovery draft. Try leaving while dirty and
    hiding the tab; existing save/navigation protection still applies.
14. Repeat a move and resize in normal and Board fullscreen modes. Expected: mounted
    editors, heading controls, selection and camera remain stable across fullscreen.
15. Compare short CPU recordings for opening, ten seconds of dragging, ten seconds
    of resizing and ten seconds of typing against the earlier baseline. Expected:
    fewer pointer calculations/unchanged style mutations and batched height updates.
    Record actual CPU/temperature rather than assuming a specific reduction.

## Known limitations

- Actual frame timing, CPU reduction and temperature improvement are unmeasured;
  static checks do not replace browser acceptance on the user's hardware.
- Large single Document rich previews, tables and PDF renders can still be expensive.
  Preview concurrency bounds fetch startup; it does not virtualize content within
  a linked Document or impose a maximum render duration on one rich preview.
- Autosave/recovery still serialize a full Board and the server still validates/
  upserts a full snapshot. The first validation of each new content object still
  costs work. Persistence semantics were retained.
- Layout zoom and live resize height measurements remain deliberate work to retain
  sharp content and correct automatic sizing.

## Stop gate

Remain in phase 4 manual review and address any reported regressions within it.
