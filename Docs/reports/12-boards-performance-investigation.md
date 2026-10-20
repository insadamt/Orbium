# Board CPU investigation — 2026-10-20

## Scope and evidence

Phase 4 review investigation of CPU/temperature spikes while moving and editing
Board objects. This is a source audit of the current working tree, including
existing uncommitted Board/media changes. No application source was changed.
No later phase was started, no commits were made, and no persistent format changed.

The paths below identify confirmed work in the code, not measured percentages of
the user's CPU. No browser performance recording or temperature telemetry from the
affected machine was available. A single cause of the reported 80°C temperature
has therefore **not** been established. No infinite observer loop was established.

## Findings, in repair priority order

### 1. Pointer processing is only partially limited to animation frames

`resources/js/components/boards/use-board-pointer.ts:228` reads viewport geometry
through `camera.localPoint()` before checking whether a gesture exists. Ordinary
pointer movement over the canvas, including bubbling editor pointer movement,
therefore reaches a geometry read even without an active Board gesture.

During movement, `resolveBoardMove()` executes before the pending-frame guard at
line 311. It rebuilds selection/target collections, computes bounds, checks nine
anchor combinations per target per axis, and allocates replacement objects for
every delivered pointer event. Only the DOM painting is limited to one animation
frame. Resize geometry has the same scheduling arrangement.

Impact: extra event-rate work, amplified by many visible objects and frequent
pointer input. This is a confirmed scheduling inefficiency; its runtime share
requires profiling.

Repair: retain the latest pointer sample and resolve geometry once per frame;
skip coordinate reads when no gesture/touch needs them. Preserve final release
coordinates, cancellation, snapping, modifier keys and pinch behavior.

### 2. Moving a block uses the full resize painter

`resources/js/components/boards/board-pointer-paint.ts:5` queries all mounted
object elements and builds a map on every paint. Even a position-only drag writes
content scale, frame width/height, object width/height and image fit, followed by
left/top. It also queries selected elements to recompute the selection rectangle.
Guide elements are replaced on every frame, even if the result is unchanged.

`use-board-selection-anchor.ts` observes selected-object style mutations and then
reads block bounds and toolbar dimensions. This adds toolbar positioning work as
the drag painter changes those styles. It is frame scheduled; an infinite loop
is not demonstrated.

Impact: DOM traversal, redundant style writes and geometry reads during movement.
Left/top movement requires layout positioning rather than a transform-only drag
preview. The actual layout/paint cost must be measured in the browser.

Repair: cache gesture elements, use a dedicated position-only movement preview,
and update guides only when changed. Investigate a temporary translation preview
that commits canonical x/y on release; check toolbar/selection anchoring and zoom
before adopting it. Keep full sizing work restricted to resize gestures.

### 3. Editing repeatedly processes content and whole-Board snapshots

`board-native-editor.tsx:119` extracts the edited block document, builds Board
data and JSON-stringifies both versions for each content update.
`use-board-block-editing.ts` maps the object collection and commits it.
`use-board-objects.ts:50` validates every object's identity/layout and aggregate
limits on each commit. Its WeakMap already avoids revalidating unchanged content;
this is **not** an uncached full-content validation on every keystroke.

The changed block's height observer is reattached and measured when data changes
(`board-object-card.tsx:74`). A changed measured height calls `apply()` and queues
another save without adding history. This is necessary derived geometry, but
adds state/save scheduling to edits that change wrapping.

`use-board-autosave.ts` writes recovery after 150ms of inactivity and saves after
700ms, with a 10-second maximum dirty interval. `board-recovery.ts:39` serializes
the **whole** Board into synchronous session storage. The save path calls
`readBoardSnapshot()` without the commit validation cache and serializes the
whole Board again (`board-api.ts:198`). `SaveBoard.php` validates and upserts all
objects. Even a single move eventually takes this full snapshot path.

Impact: costs grow with total Board data, even when changing one small block.
The 150ms recovery debounce can fire between slower keystrokes. Saving is already
debounced and does not issue a request for every pointer move.

Repair: profile commit, height and recovery/save costs separately. Coalesce
derived height with content updates where practical and avoid repeated unchanged
snapshot processing. Preserve recovery, conflict protection and server validation.
Do not remove validation or introduce partial-save semantics casually; that would
need a separately designed persistence change.

### 4. Math/diagram previews rebuild while their source editor is active

`board-source-block.tsx:152` clears the preview and creates a fresh
`MermaidPreviewSession` whenever source changes. Math rendering or diagram
registration/start still occurs when the preview host is hidden during editing.

Impact: potentially expensive hidden work for math/diagram edits. This finding
does not explain plain-text dragging by itself. Mermaid has its own scheduler,
so this audit does not claim every keystroke completes a full diagram render.

Repair: defer hidden preview work until editing ends, or debounce it if a visible
live preview is needed. Retain session/cache state and cancel obsolete work.

### 5. Camera and linked-card rendering can amplify large-Board cost

`use-board-camera.ts:65` uses CSS layout zoom and left/top for the world. Its
visible-bounds updates run during navigation at roughly 120ms intervals and on
settling, mounting/unmounting content as it crosses the overscan boundary.

`board-document-preview.tsx` fetches and renders full Document source for each
mounted linked Document card. The summary-preview queue is bounded; the separate
full-document preview fetches do not share that concurrency queue. Native Board
tables also create a hidden CodeMirror source view even outside editing
(`board-table-block.tsx`). Many mounted rich cards therefore carry meaningful
initialization and DOM cost despite only one active editor.

PDF density observation already debounces changes and checks whether scale
actually changed (`media/pdf-display-density.ts`). Plain movement should not be
described as unconditionally rerendering every PDF page.

Repair after measuring: distinguish camera translation from zoom, retain the
existing zoom clarity requirement, and add bounded loading/visibility management
for heavy previews. Check scroll, source anchors, selection and mounted editor
preservation before changing culling or preview lifetime.

## Proposed first repair pass

1. Coalesce pointer computation and eliminate idle pointer geometry reads.
2. Separate movement from resize painting and reduce repeated DOM/guide work.
3. Stop rebuilding hidden math/diagram previews during source editing.
4. Profile again, then target measured typing/save or heavy-card costs.

Avoid changing camera clarity, recovery guarantees or persistence contracts until
recordings show that those changes are needed. This investigation supplies a
concrete starting point, not a claimed performance improvement.

## Manual investigation checklist

Use a disposable Board or duplicate rather than changing important content for
profiling. Compare the same browser, viewport, zoom and Board contents. Record
browser CPU, frame responsiveness and Performance main-thread activity; temperature
alone cannot identify the responsible call path. Keep captures short.

1. Open the affected Board and wait until Saved and previews finish loading.
   Record 10 seconds without interaction. Expected: establishes idle baseline;
   recurring long tasks at idle would require an additional investigation.
2. Record 10 seconds moving the pointer over empty canvas without pressing buttons.
   Expected: no Board movement/save; inspect pointer handlers for geometry work.
3. Record dragging one plain text block for 10 seconds, then stop and wait for
   Saved. Expected: one committed move, with drag cost distinguishable from the
   subsequent recovery/save burst.
4. Repeat on the same Board with smart guides disabled, then restore the setting.
   Expected: no alignment guides; any reduction isolates guide-search overhead.
5. Repeat on a small disposable Board with one text block at the same zoom.
   Expected: comparison reveals whether cost scales with Board complexity.
6. Edit text for 10 seconds, including pauses longer than 150ms. Continue typing
   through a line wrap; delete that line afterward.
   Expected: content height grows/shrinks; inspect validation, JSON/storage and
   layout work separately. Text must remain intact and eventually show Saved.
7. Edit a Mermaid or math source block, then finish editing.
   Expected: compare hidden-preview work while typing against the final preview
   render. Use a valid small source to avoid measuring error handling alone.
8. Compare plain text movement with movement of a loaded PDF and linked Document.
   Pan at constant zoom, then zoom separately.
   Expected: separates ordinary movement, rich-card initialization and density
   changes; constant-scale movement should not require a new PDF density render.
9. After any repair, verify selection/multi-selection, guides, Alt bypass,
   width/corner resizing, automatic height, undo/redo, canceled gestures and
   fullscreen. Reload only after Saved.
   Expected: geometry/content persist and interaction behavior remains correct.

For each recording note object count, block types, linked Document sizes, zoom,
browser version and whether the app uses development or production assets.

## Validation and handoff

- Read the required project/phase documentation and traced frontend interaction,
  rendering, recovery/save and backend persistence paths.
- No automated tests were written or run, per user instructions.
- Formatting/lint/type/build checks: not run; this change is a Markdown report
  only, with no source changes or claimed runtime fix.
- Whitespace check: recorded in the task handoff after writing this report.
- Existing uncommitted application changes were preserved.
- Phase 4 remains in manual review.

Suggested commit for this report:
`docs(boards): investigate interaction CPU hotspots`

Suggested messages for future implemented repairs:
`perf(boards): coalesce pointer geometry and streamline drag previews`
`perf(boards): defer hidden source previews during editing`
