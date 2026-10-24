# Orbium Instant Scene — first prototype contract

2026-10-23. Experimental correction inside Board phase 4. Branch:
`codex/instant-scene-engine`, based on freshly fetched `codex/boards` at
`ca15212`. The first working milestone and the subsequently reviewed, explicitly
approved PDF preservation milestone are in scope. Stop for manual review after
the PDF slice before expanding to other rich types or later milestones.

## Decision and evidence boundary

Separate canonical records, preparation, presentation, editing and persistence.
Use reusable detached native DOM templates for text, heading, list, quote and
callout, and prepared sanitized SVG for native Mermaid. Prepare independently of
card visibility. PDF preservation now adds reusable page pixels and per-object
view state as described below. Attach a lightweight copy when a card enters the mounting region;
activate the existing editor when editing begins. Keep the current renderer for
all other kinds and as an explicitly selectable reference renderer. Following the
user's review request, Instant Scene is the default on this experimental branch.

This is a working DOM/vector vertical slice, not a Canvas or GPU migration. It
changes the lifetime and ownership of preparation. It does not eliminate DOM
layout, painting, rasterization, card mounting or intrinsic-height observation.
Its advantage over the existing cache is proactive preparation of eligible
offscreen records and separation of their reusable visual assets from mounted
native rich components. Both engines already reuse sanitized Mermaid results;
do not attribute that preexisting optimization to this prototype.

No foreground Performance recording is available in this execution environment.
Source inspection confirms mechanisms, not their relative cost or a thermal
cause. The [implementation report](../reports/12-boards-instant-scene.md) records
the built baseline, actual checks and pending comparison worksheet. Follow the
[production profiling protocol](board-performance-profiling.md).

## Renderer boundary and rollback

Boards open directly with Instant Scene on this branch. `?boardRenderer=original`
explicitly selects the reference implementation; `?boardRenderer=instant`
explicitly selects Instant Scene. The optional session value at
`orbium.board.renderer` accepts either `original` or `instant`. The URL takes
precedence over a valid session value. With no override, an invalid value or
unavailable browser storage, Instant Scene is the default. Changing an override
takes effect on remount/reload; finish saving first.

`data-board-renderer` on the canvas exposes the selected adapter. There is no new
toolbar or product setting. The original uses its existing 10–400% camera range
and local camera key. Instant Scene uses 50–200% and a separate
`instant.view.v1` key, so experimental navigation cannot overwrite the reference
camera. Grid, snap and guides also follow that separate view key.

Rollback requires explicitly selecting original by query or session override.
Removing overrides restores this branch's Instant Scene default.
No schema, migration, API, dependency, content-version or archive change exists.
Prepared assets are disposable and never become canonical data.

## Scene records and revision invalidation

`BoardRecordStore` remains authoritative. Its existing per-object subscriptions,
geometry channel, grouped history, incremental PATCH/full PUT fallback, recovery
and original Document ownership remain in use. A new transaction-completion
subscription exposes changed IDs to preparation, without rebuilding a Board
snapshot for every keystroke.

A visual revision consists of the object ID, kind, immutable data identity and
width. Data includes inline marks, direction/alignment and surface scale. Moves,
layer changes and derived height updates reuse the visual; outer cards still
apply current geometry and layer order. Undo/redo, reset, deletion, conversion
and changed widths/data use the same notification boundary. Deleted assets and
pending jobs are removed. No spatial index is introduced without measurements.

Text templates retain live CSS classes/variables rather than computed styles,
so application theme/editor CSS changes apply without serializing stale colors
or metrics. Sanitized Mermaid is instantiated using fresh IDs and the existing
theme-variable adapter. Width changes request a current representation; shared
source-matched SVG can be reused because its vectors are resolution independent.
Fallback Documents, images, math, audio and video retain their existing revision,
attachment, theme and density handling. Their complete preparation is later work.

## Preparation and presentation

`BoardInstantScene` owns a finite pending-ID set and bounded asset caches. It
subscribes once, initially seeds eligible records, and prioritizes presented
objects before offscreen work. Only one preparation pump can be queued/running.
Each task processes at most eight records or approximately four milliseconds
between records, sharing the Board scheduler's single render lane. An individual
large text or Mermaid operation cannot be preempted by that between-record bound.
Current input receives the scheduler's existing bounded deferral.

Cold text can prepare synchronously in a layout effect so it is readable on first
paint. Other text is prepared progressively offscreen. Prepared templates have
no event listeners, editors, layout observers, live players or network fetches.
Presentation copies them into the original class hierarchy. Checklist changes
use a native delegated listener because cloned inputs have no React input tracker;
they write through the same validated Board action/history callback.

Mermaid preparation uses the existing strict renderer and sanitizer, through
`BoardPreparedPreviews`, retaining source-level reuse across identical diagrams
and native/fallback sessions. The scene retains per-object prepared references.
A warm attachment receives sanitized SVG before paint and working full-preview
controls without creating a Mermaid session. A genuinely cold diagram displays
its source until prepared; invalid syntax produces an actionable error. Changed,
evicted or uncached content can require preparation. Oversized SVG assets use the
native renderer rather than endlessly retrying an impossible cache admission.

Simple text uses text nodes and an explicit mark/tag allowlist. Links and colors
reuse the existing validators. It accepts no arbitrary HTML. The only new
`innerHTML` insertion receives the shared sanitizer's SVG output.

The existing mounting region/guard/48-unit offscreen card retention still bounds
presentation, with the active editor pinned separately. On warm return after a
card has been destroyed, its text template or SVG can still exist and attach
without parsing/fetching/renderer initialization. Copying DOM and browser layout
still cost time. Cache eviction and cold reopen are explicitly outside that warm
guarantee. No persistent prepared cache is implemented in this milestone.

## Native interaction and zoom

`BoardObjectCard` retains selection, pointer handling, resize handles, geometry,
automatic sizing and focus. Only its inactive eligible body chooses the prepared
adapter. Editing activates `BoardTextBlock`/`BoardSourceBlock` and their existing
native editors. All edits enter canonical records; finishing refreshes the
prepared visual. Active editors remain pinned offscreen by the existing lifetime
hook. Tables, code, math, images, audio/video, linked Documents and navigation
cards use their existing implementations throughout. PDFs use the native reader
with an optional Board preservation session. No feature is replaced with a shape
or permanently truncated excerpt.

Instant Scene keeps the world's CSS layout zoom at its last settled density
during camera gestures. Independent scale applies `camera.zoom / density`, and
translation applies `camera.x / density`, `camera.y / density`. Cursor-centered
wheel and touch pinch clamp **before** calculating their anchored positions.
Fit/toolbar zoom use the same experimental bounds.

At the existing 120ms camera-settle boundary, layout zoom becomes the final zoom,
translation is adjusted and transient scale returns to one in the same task.
Text/vector sharpness returns through native layout. Existing PDF observation
detects the settled density change and retains the previous page while preparing
its replacement within the existing pixel budget. This may temporarily soften
content during a gesture; it does not permanently reduce PDF/text quality.
Pointer/toolbar geometry continues to use the canonical camera's effective zoom.
The original adapter retains per-zoom native layout behavior.

## Resource budgets and lifecycle

| Resource | Prototype budget / scope |
|---|---|
| Native prepared templates | 1,000 entries, 8 MiB estimated serialized UTF-16, 50,000 DOM nodes, LRU per mounted Board |
| Scene diagram references/errors | 128 entries, 8 MiB estimated SVG/message strings, LRU per mounted Board |
| Shared prepared Mermaid | Existing 128 entries / 4 MiB estimated strings; can share SVG allocations with scene entries |
| Shared prepared math | Existing 128 entries / 4 MiB, unchanged fallback |
| Linked Document source | Existing 24 Documents / 8 MiB, unchanged fallback |
| Active editor | Existing single selected editing object, pinned independently |
| Rich preview initialization | Existing one shared render job; full async scene Mermaid preparation holds that slot |
| Document preview fetches | Existing two shared fetch jobs; scene adds zero fetches |
| Background preparation | One pump; up to eight records / ~4ms between operations per task; stops after pending set drains |
| Worker infrastructure | No new worker infrastructure; existing PDF.js document tasks are released for inactive prepared readers |
| Prepared PDF pages | 32 LRU entries / 64 MiB estimated RGBA + accessible text, per mounted Board |
| PDF state / metadata | At most 1,000 cached states; source replacement/deletion invalidates the object |
| Pinned PDF reader | One interacted object, additional to the existing editor pin |
| PDF cold preparation | Shared two fetch slots, held through first-page preparation and inactive task disposal; shared one raster slot |
| PDF fallback raster | Existing 8,388,608 pixels per page render; this is not a Board-wide graphics-memory cap |
| Object count | No fixed count cap (user approved removal); existing data budgets still apply |

Byte budgets estimate stored text/SVG, not total JS heap, DOM allocation, image
decoding or GPU memory. Node count separately bounds retained template complexity.
Visible copies, active editors and existing fallback renderers are additional.
There is no new global cap on visible PDF canvases/media/Document instances;
claiming one would misrepresent the prototype. Inactive PDF document tasks now
release after preparation, but dense visible canvases/fallback regions can remain costly.
Assets larger than a cache budget remain displayable through cold/native paths.

Hidden tabs pause queued preparation through the provider's visibility handling.
Uninterruptible work may finish. Disposal cancels queued work, unsubscribes and
clears detached assets; generation/data guards discard obsolete callbacks.
The camera requests frames only for changed camera events. Preparation uses finite
tasks, with no permanent rAF loop or zero-delay polling for missing content.
Existing app animations, resource metadata refresh and native player work remain
outside that statement. The app is not claimed to have zero background CPU.

## Alternatives evaluated and later review

Canvas 2D/display commands could reduce inactive DOM, but need faithful text
layout/marks, RTL, CSS themes, selection/accessibility and rich-card controls.
Raster tiles trade those costs for invalidation, memory and settled-resolution
work. OffscreenCanvas helps only once a suitable Canvas workload exists; workers
cannot lay out native DOM, edit content or manage focus. No measured advantage
justifies WebGL, a new dependency or a screenshot renderer in this slice.

Persistent assets could use IndexedDB for bounded derived strings/SVG, keyed by
owner, content digest, renderer version and relevant dimensions/style revision,
with account/workspace isolation, quota handling and logout/permission cleanup.
IndexedDB access must not become a synchronous navigation prerequisite. Backend
preparation would require matching sanitization/renderer versions and ownership
checks; PHP cannot reproduce arbitrary browser DOM layout. Neither is implemented.

The user subsequently approved PDF preservation after reviewing the first slice.
That implementation is described below. After its manual review and production
traces, choose the next dominant rich preparation cost. Persistent assets, new
worker infrastructure, tiling, adaptive fidelity, other rich-content coverage,
complete parity and migration stay planned. Do not start them automatically.

## Reviewed PDF preservation milestone

Approved by “okey go ahead” following the PDF-specific proposal. This is an
extension inside Board phase 4, not approval for complete rich-content coverage.

`BoardPdfSceneStore` belongs to `BoardInstantScene` and reads the canonical
`BoardRecordStore`. For each current file object that is confirmed as a PDF it
holds original attachment metadata and transient view state. One current-page
visual per object is retained under the 32-page / 64 MiB LRU. Pixel cost is
width × height × 4 plus UTF-16 page-text length. Cache ownership includes its
own canvas copy; destroying a card's displayed canvas cannot erase that copy.
Eviction zeros the retained canvas dimensions and releases its reference.

Source identity is the current object/attachment identity plus validated MIME
and byte size. Library uploads create new attachment identities; naming changes
update the header without rebuilding the reader. Replacement, deletion, conversion
away from a file, and authoritative unavailable metadata remove affected state.
Moves, layers, captions and automatic height do not invalidate a PDF page.
Logical page/rotation/width/height and actual pixel dimensions determine whether
the visible raster is reusable. Less than one logical pixel / at most one raster
pixel of rounding is tolerated, rather than treating translation rounding as a
new density. Changed width/zoom keeps old pixels scaled to current geometry until
the sharp replacement is ready; it does not permanently lower PDF quality.

`useBoardMediaSurface` attaches cached metadata/page pixels in a layout effect,
before starting bounded metadata revalidation. Matching metadata updates the name
and leaves the existing player intact. 401/403/404/410 removes the displayed file
and cached attachment representations. Transient network/server failures keep the
known page and show the existing error. No prepared file is persisted or shared
outside its Board provider. Native ownership checks and Library URLs remain.

The shared native PDF reader accepts an optional `PdfViewSession`. Without one,
normal Document/Library/original-Board readers keep their ordinary native lifetime.
With one, a warm shell restores page pixels, accessible text and view state before
paint. Page count is available from the prepared metadata, so existing controls
stay usable even while no PDF.js document is loaded. Page changes, rotation,
fullscreen/thumbnails or changed resolution load the native document as needed.
The loaded task is reused while that PDF is active. Plain x/y movement changes
neither the source effect nor the page geometry key.

Cold metadata/document loads use the existing two-slot fetch lane. A document's
slot remains held until its initial page attempt finishes and its inactive
document task is disposed. This prevents preparation from queuing a loaded worker
for every visible card while waiting for the single shared render lane. The
already-active reader can exist in addition to the two preparation slots. This
bounds document preparation concurrency, not PDF.js internal heap/worker memory.
Visible canvas memory is additional to the retained-page budget.

After rendering an inactive page, release its document task and thumbnail document
references while retaining pixels/state. Pointer, focus or wheel interaction
selects one pinned PDF object; fullscreen activates the same pin. Panning does
not clear it, so an active reader survives outside the mounting region. Another
PDF interaction or entering another object's editor releases the old pin and its
idle document task. The ordinary native editor pin remains independent. Queued or
running page work completes/cancels through explicit events; no retry polling
loop is introduced. Hidden tabs pause new Board scheduler jobs; already-running
work may finish. Initial preparation promises settle on cancellation/disposal so
they cannot keep a fetch slot permanently occupied.

On return after card eviction, a warm shell can rebuild cheap controls and copy
pixels without loading the PDF or rasterizing again. Shell creation is therefore
counted separately from document initialization and rasterization. Inactive cold
preparation or the first actual native interaction can create a document task;
that is different from a loading restart caused only by navigation.

Development snapshots expose `instantScene.pdfs`: retained page/byte/state counts,
page hits/misses/evictions, shell creations/destructions, document loads/disposals
and disposal failures, active task-handle estimate, raster starts/skips and pinned
reader count. `pinnedPdfOutsideRegion` separates PDF pins from normal retention.
These counters establish application lifecycle events, not FPS, CPU usage, exact
process memory or thermal improvement. Use the exact acceptance steps in
`../reports/12-boards-instant-scene-pdf.md`. Stop for that review before expanding.
