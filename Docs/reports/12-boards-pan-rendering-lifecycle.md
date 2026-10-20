# Board pan rendering lifecycle repair — 2026-10-20

## Phase and problem

Phase 4 manual review. The user reports that blocks now take too long to reappear
when moving across the Board, and CPU/temperature spikes continue. The earlier
repairs have not established a thermal resolution. No later phase is started.

Source inspection confirms two separate mechanisms:

1. Strict culling unmounted rich blocks outside the mounting region. Returning
   recreated native code/diagram/table/media surfaces and refetched linked Document
   source. The idle queue introduced in the first performance pass could add up to
   another idle scheduling delay per queued Document during continuous movement.
2. Camera frames changed the dotted canvas background position and published
   fresh mounting bounds at fixed 120ms intervals even during small pans. That
   combines viewport painting with repeated React culling updates and delayed
   discovery of newly visible objects.

These mechanisms are confirmed in source. Their share of the user's CPU and actual
thermal impact remain unmeasured; this report does not claim that every spike is
explained. Manual browser validation remains with the user. An optional question
asks which block types are slow; no unanswered preference is treated as a reply.

## Implemented

### Retain recently visited rich surfaces

`use-board-rendered-objects.ts` keeps objects in the current mounting region plus
recent offscreen objects under a weighted 48-unit retention budget. Plain text and
other lightweight blocks cost 1; tables and Mermaid cost 3; linked resources cost 6;
file/media objects cost 12. That permits at most 48 lightweight objects, 16 native
tables/diagrams, 8 linked resources or 4 file players offscreen in addition to the
current region. Mixed sets share that budget. The active editor remains pinned
independently. Deleted objects disappear from retention immediately.

Returning across the culling edge reuses mounted renderers, scroll state and PDF
canvases while they remain in this recent set. Long traversal still evicts old
objects rather than retaining every rich surface indefinitely. The budget is a
heuristic for relative rendering/memory cost, not a hard JavaScript/GPU byte limit.

### Stable camera mounting region

`use-board-visible-bounds.ts` begins with no speculative 4,000-unit region. The
saved camera and measured viewport establish initial bounds before choosing blocks.
A 640-screen-pixel overscan region is refreshed when the viewport comes within
160 screen pixels of its boundary. Ordinary movement within that region publishes
no new React bounds. Real zoom or viewport size changes refresh it immediately.

The camera checks that numeric coverage during its normal paint rather than waiting
for the previous 120ms visibility timer. Viewport dimensions are measured during
setup/resize and reused by camera frames. Camera save settling remains at 120ms.

### Reuse linked Document source and prioritize visible cards

The Board provider owns a revision-matched source cache capped at 24 Documents and
8 MiB of estimated serialized UTF-16 payload. Reads update recency and replacement
or eviction updates the accounting. Oversized entries are not cached. No source is
persisted to a new storage location or shared between Board providers.

A remounted preview can initialize from matching cached source and bypass another
source fetch. Routine metadata registration does not invalidate source; a revision
change misses the old cache naturally. Explicit Refresh and Document-save events
invalidate the affected source, and explicit Refresh bypasses any matching cache
on that refresh cycle. Existing scoped fetches and original-Document editing/save
ownership remain authoritative.

The full Document fetch queue retains its two-request concurrency limit but starts
on ordinary queued tasks rather than waiting for idle time. IntersectionObserver
tracks the card's visibility against the canvas without per-frame geometry reads;
visible cards are chosen before pending offscreen prefetches. Once no visible job
is waiting, overscan/recent-card work can use free capacity. Unmount still removes
pending work and aborts the active request. Cached source still needs rich DOM
construction when the mounted surface itself has been evicted.

### Move the dotted grid independently

The dotted grid is now a separate clipped layer beneath the world. Panning changes
its translation modulo the grid period; it no longer changes the canvas background
position. Pattern size changes only with zoom. The calculation compensates for the
layer inset so grid phase remains consistent at fractional zoom and negative
coordinates. The grid layer stays bounded to the viewport plus 128px on each side,
covering the maximum supported 128px grid period. Grid toggle and zoom clarity are
preserved. Unchanged inverse-zoom and zoom-label values are not rewritten.

## Persistence and commits

No schema, API payload, hierarchy or Board content/spatial version change. No new
dependency. Previous pending Board work was preserved. No commits were created.

Suggested commit:
`perf(boards): retain rich previews and stabilize pan rendering`

## Validation

- Focused `vp fmt` on the changed/new source: PASS.
- Final `npm run types:check`: PASS (exit 0).
- Final `npm run lint` (`vp check`): PASS; all 667 checked files formatted,
  no warnings or lint errors in 559 linted files.
- Final `npm run build`: PASS (exit 0), built in 14.98 seconds. The build reports
  chunk-size, mixed static/dynamic import and plugin-timing warnings.
- `git diff --check`: PASS.
- Type checking caught nullable resource metadata revisions during implementation;
  the source cache accepts null metadata revisions and does not treat them as a
  match for a saved numeric Document revision.
- No automated tests were written or run, as instructed. No PHP source was changed
  by this repair; PHP checks are not applicable.
- Browser lifecycle, actual CPU usage and temperature: pending manual validation.

## Exact manual acceptance checklist

Reload the updated app/assets and compare the same Board/browser/zoom/viewport.
Record whether any remaining spike occurs during object dragging, canvas panning,
plain pointer movement, or the cold rendering of newly encountered content.

1. Open a saved Board whose camera is away from the origin. Expected: blocks are
   chosen around the saved viewport; unrelated origin blocks do not briefly mount.
2. Pan a short distance away from loaded text, tables, Mermaid, PDF and linked
   Document cards, then return. Expected: recently viewed surfaces remain rendered
   without restarting their loading placeholder, PDF page or diagram session.
3. Pan repeatedly back and forth near an old culling edge. Expected: no repeated
   fetch/render cycle for the same retained blocks and no wait for panning to stop.
4. Pan continuously into previously unseen content. Expected: mounting-region
   updates do not wait for the old 120ms timer; visible linked Document cards take
   queued fetch priority over offscreen ones. Cold content still requires its first
   fetch/render. No claim is made of zero loading time for large cold content.
5. Traverse far enough to exceed retention, then return. Expected: older rich
   surfaces can rebuild; retained source with a matching revision avoids another
   Document source download. Memory does not grow by retaining every visited block.
   The visible/mounting region and active editor are additional to the offscreen
   budget; this budget does not cap the number visible at once.
6. With Network open, compare a return pan against the previous build. Expected:
   no new source requests for retained Document cards; evicted cards can reuse
   matching cached source. Full preview fetch concurrency stays at two. Attachment,
   summary and active-editor requests are separate from that limit.
7. Refresh a linked Document, edit/save its original, and return from hosted editing.
   Expected: Refresh fetches fresh source, saved revisions appear, old cached source
   does not overwrite current content, and original save/conflict guards remain.
8. Start editing a linked Document, pan it offscreen and return. Expected: the active
   editor remains mounted and its draft, selection and scroll position survive.
   Finish/save normally. Native text/table undo and derived automatic height still
   behave correctly after return pans.
9. Toggle the grid; pan horizontally/vertically in both positive and negative
   coordinates at minimum, fractional, 100% and maximum zoom. Expected: dots align
   with the Board world without seams, jumps, exposed edges or a phase reset; grid
   hidden state persists and controls remain clickable through the grid layer.
10. Resize the browser and enter/exit Board fullscreen, then use Fit/reset and pan.
    Expected: bounds update to the new viewport, content remains sharp and grid,
    selection, resize handles and floating toolbar positions stay aligned.
11. Move/delete/undo a recently retained block; save and reload. Expected: the correct
    current geometry/content is shown, deleted items do not remain as ghost cards,
    and transient retention/source caches do not alter saved Board data.
12. Navigate away while previews are pending, then reopen. Expected: queued work is
    canceled, no stale response populates a replacement Board, and normal loading
    and error messages remain available.
13. Compare short CPU/Performance recordings of the same repeated pan. Expected
    structural changes: fewer mount/unmount cycles, fewer repeated source requests,
    no fixed-cadence bounds churn within the guard region and grid translation
    instead of canvas-background position painting. Record actual CPU/temperature;
    static build checks cannot establish that the thermal issue is resolved.

## Limits

Very dense visible Boards and first-time large PDF/Document/diagram rendering can
still be expensive. Source caching does not cache a destroyed rich DOM surface, and
retention intentionally has a limit. Recently retained offscreen cards still own
mounted renderer state and can receive ordinary metadata refreshes. Frosted backdrop
filters and animated backgrounds were not disabled. If spikes persist, a browser
recording from the affected Board is needed to identify remaining main-thread,
paint/raster, GPU or background work rather than assuming those costs are equivalent.

Remain in phase 4 manual review.
