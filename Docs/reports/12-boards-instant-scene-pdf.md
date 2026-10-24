# Instant Scene — reviewed PDF preservation milestone

2026-10-23. Board phase 4, branch `codex/instant-scene-engine`. The user approved
the proposed PDF milestone with “okey go ahead” after reporting that the first
prototype still rebuilt content during movement. This milestone implements PDF
preservation only; other rich-content preparation remains gated for review.

## Outcome and evidence boundary

PDF page pixels and per-object view state now belong to the Board's scene, rather
than exclusively to its mounted card. An evicted card can return using prepared
pixels without reopening the PDF document or rasterizing an unchanged page.
An interacted PDF can stay pinned offscreen with its native session alive.

These are implemented lifecycle paths verified by source/type/build inspection.
Browser behavior, CPU, frame timing and temperatures remain for manual validation.
No browser profiling, Playwright or automated tests were performed. This report
does not claim that the broader CPU/thermal problem is fixed.

The confirmed earlier mechanism remains in the reference renderer: 48 weighted
offscreen retention units, file cost 12, permit at most four offscreen file/media
cards. Evicting a PDF calls reader destruction, destroys the document task and
zeros its displayed canvas. There was no prepared PDF page or view-state store
independent of that card. Making the first prototype default did not change this.

## Implemented

- `BoardPdfSceneStore` belongs to the existing Instant Scene instance and reads
  canonical records. It owns independent copies of prepared PDF pixels, accessible
  page text, current attachment metadata and per-object page/count/zoom/rotation/
  scroll/sidebar state.
- Warm metadata/pixels attach in a layout effect before network revalidation.
  An unchanged response updates the filename and preserves the mounted player.
  Authoritative 401/403/404/410 clears the affected cache/display. Transient
  failures retain the known page beside the existing error message.
- Native reader shells restore cached controls/text/pixels without a loaded
  PDF.js document. Native documents load when cold preparation, changed page,
  rotation, fullscreen/thumbnails or changed density/size requires them.
- Raster keys include page, rotation, logical dimensions and actual pixel
  dimensions. Small subpixel rounding is tolerated. Plain x/y movement does not
  change source or density. Old pixels stay visible, sized to the current frame,
  until changed-resolution pixels are complete.
- Cold metadata and document preparation share two Board fetch slots. Document
  preparation holds its slot through the initial page attempt and inactive task
  disposal. Rasterization shares the single Board render slot. Queues pause in
  hidden tabs; current tasks may complete.
- Inactive document tasks and thumbnail document references release after page
  preparation. One PDF interacted with by pointer/focus/wheel is pinned beyond
  normal culling; another PDF interaction or entering another object's editor
  releases the previous pin. Fullscreen uses the same native reader and pin.
- Initial preparation promises settle on success/error/cancellation/disposal.
  Stale source/generation callbacks cannot fill replacement objects. Rapid page
  changes cancel old work; returning to an already displayed page settles without
  overwriting it with the canceled result. No render-retry polling loop remains.
- Normal Documents/Library/original-Board readers supply no preservation session.
  Existing native controls, download, accessibility text, original ownership,
  Board history/saves/conflicts and recovery remain authoritative.

No schema, migration, dependency, endpoint, content/export format or persistent
view-state change. State survives card eviction inside the mounted Board, not a
full page reload or closing/reopening the Board provider.

## Budgets and cleanup

| Resource | Budget / behavior |
|---|---|
| Prepared current-page cache | 32 entries and 64 MiB; LRU, RGBA pixel bytes plus UTF-16 page text |
| Per-object view state / metadata | Current objects only, under the existing 1,000-object limit |
| Interacted PDF pin | One, independent of the existing editor pin |
| Cold preparation | Two shared fetch slots held through initial preparation/disposal; one shared raster slot |
| Inactive loaded documents | Released once their page attempt settles |
| Active document | Kept for the pinned native interaction/fullscreen; released on deactivation when pending work settles |
| Displayed raster quality | Existing 8,388,608-pixel per-page limit; settled density remains sharp |

Cached canvases are independent of live displayed canvases. Eviction zeros the
cached backing canvas; card destruction zeros its displayed canvas. Deletion and
source replacement invalidate that object's state; unavailable attachments
invalidate all matching cached references. Leaving the Board clears scene assets
and cancels queued jobs; running document/render work is canceled/disposed through
the owning reader. Temporary native canvas buffers are explicitly cleared.

Cache byte accounting is not a browser-wide memory measurement. Visible canvas
copies and PDF.js internal memory are additional. Dense visible canvases can
still be costly; full rich-content instance budgeting, persistence and adaptive
fidelity are not silently added by this milestone.

## Files and commits

New Board files: `instant-scene/board-pdf-scene-store.ts` and
`use-board-media-surface.ts`. New shared PDF files: `pdf-view-session.ts`,
`pdf-page-surface.ts`, `pdf-page-raster.ts`, `pdf-document-resource.ts` and
`pdf-reader-keyboard.ts` under `resources/js/components/media/`.

Updated: Instant Scene/provider hooks, Board canvas/object/media integration,
rendered-object pinning and development scene counts; shared PDF reader,
attachment player, density/layout observation and thumbnail disposal. Updated
`Docs/START_HERE.md`, `Docs/docs/24-boards.md`, and the
[architecture contract](../plans/board-instant-scene-architecture.md).

All preexisting uncommitted work was preserved. No commit or push created.
Suggested commits:

- `feat(boards): preserve PDF pages and view state across card eviction`
- `perf(pdf): release inactive documents and skip unchanged page rasters`
- `docs(boards): record PDF preservation budgets and manual acceptance`

## Validation

- Focused changed-source `vp fmt`: PASS.
- Final `npm run lint`: PASS, exit 0; 694 correctly formatted files, 586 linted
  files, no warnings/errors. An intermediate unbound-method warning was corrected
  before this passing run.
- Final `npm run types:check`: PASS, exit 0.
- Final `npm run build`: PASS, exit 0, **17.90s**, 5,517 modules transformed.
  Existing large-chunk, mixed static/dynamic import and plugin-timing warnings
  remain. Build duration is not a runtime performance result.
- Production manifest SHA-256:
  `17e32160bfe5740460edbb7b68a9663e1a6802fa538b0575c4a56a130c051e78`.
- Production manifest/referenced-script inspection: no Board diagnostic module,
  console API or capture-marker strings in shipped scripts.
- Built-frontend comparison server login inspection: HTTP 200 on port 8001,
  `/build/assets/` script URLs and no Vite client. This is not authenticated
  browser acceptance. The existing development server/hot file were preserved.
- `git diff --check`: PASS. Added source files are under 500 lines; largest new
  PDF-specific file is the 231-line Board store. Modified Board canvas is 494
  lines and the shared PDF reader is split by responsibility at 452 lines.
- No PHP application source changed; PHP checks are not applicable to this slice.
  No automated tests or Playwright were written or run, as instructed.

Browser execution, lifecycle counters under real interaction, frame time,
CPU/power/temperature and memory trends remain pending the manual steps below.

## Exact manual acceptance

Use disposable content and wait for Saved before refreshing. Instant Scene is
the default on this branch; `?boardRenderer=original` provides the comparison.
Start at 100% Board/browser zoom with the same viewport/DPR/theme. Use at least
six PDF objects, placed in separated regions, with a small multi-page PDF. The
native stress generator does not create PDFs. References to the same Library
file must have separate object identities and independent view state.

1. **Cold preparation:** reload a Board with the six PDFs. Expected: cold pages
   prepare progressively; input stays available; the original reader/control
   design remains. Wait for pages/queues to settle. Inactive document tasks should
   release; the visible prepared pages must stay readable.
2. **Direct object drag:** change one PDF to page 2, scroll within it, then drag
   the entire block using its header/page pixels without resizing. Repeat twenty
   times at unchanged Board zoom. Expected: the same reader/page remains, with no
   loading restart or page reset. Creation/document-load/raster counters must not
   increase solely because of these x/y moves.
3. **Pinned active return:** keep that PDF active, pan well beyond normal
   retention and return. Expected: its live native reader survives, with page,
   zoom, rotation and scroll state preserved. Its object remains counted as
   pinned outside the mounting region, rather than requiring reconstruction.
4. **Return after actual eviction:** activate a second PDF to release the first
   pin, traverse enough other file regions to exceed the four-file offscreen
   retention and return to the first. Keep the prepared cache under both budgets.
   Expected: cached page pixels appear without Loading document, page/state is
   retained, and a shell may be recreated without a PDF document load/raster.
   A small metadata revalidation request is expected; it must not blank the page.
5. **Independent states:** set different pages/zooms/scroll positions on two
   objects referencing the same file. Evict/revisit each. Expected: independent
   states and the correct prepared page for each object; no cross-object leakage.
6. **Native reactivation:** on a returned cached shell, Next/Previous, page input,
   Home/End/Page keys and zoom must work. Expected: the document activates when
   needed, the old page remains until the new one is ready, and subsequent active
   changes reuse that document task. Rapidly request page 2, then page 1 while
   work is pending; expected: page 1 wins and no stuck busy/queue state remains.
7. **Resolution/geometry:** width-resize, corner-scale and Board zoom through
   50/100/200%, then settle. Expected: existing pixels stay aligned and visible
   while preparing a sharp final-resolution page; unchanged geometry does not
   continuously rasterize. Side/corner controls and automatic height remain aligned.
8. **Fullscreen:** expand a PDF, change page/zoom/rotation, toggle thumbnails,
   close and reopen rapidly, then pan away/back. Expected: the same native
   controls, current state, focus return and usable thumbnails. Width/density
   changes can rasterize; pure pan/drag must not reset the document.
9. **Deactivation:** activate another PDF, or enter a text/Document editor, then
   wait for PDF work to settle. Expected: the former PDF releases its pin and
   inactive document task, retaining its prepared visual. The newly active editor
   keeps its own existing draft/selection protections.
10. **Replacement/deletion/history:** replace a PDF with a different Library PDF,
    undo/redo replacement, move/delete/undo the object, save/reload. Expected: the
    correct file and canonical layout persist, with no old source drawn in a new
    reference. Full reload can prepare again; removing a card retains the Library
    binary and existing reference/usage rules.
11. **Failures:** on disposable data, deny/unavailable metadata and PDF downloads,
    try a corrupt/password-protected PDF and test Network Offline after warming.
    Expected: actionable errors/download remain, authoritative unavailability
    removes affected prepared content, transient failure retains known pixels,
    and failed/canceled initial work releases queue slots. Save/recovery guards
    remain unchanged; go online and remount to retry a failed native open.
12. **Hidden/cleanup:** start several cold preparations, hide the browser tab,
    return, then leave the Board while work is pending. Repeat opening/closing.
    Expected: queued work pauses/resumes and disposal removes the previous Board's
    assets/tasks, with no stale content or accumulated pending preparation slots.
13. **Budget pressure:** visit enough distinct prepared pages, or large rasters,
    to exceed the entry/byte budget. Expected: LRU eviction, prepared count ≤32,
    prepared bytes ≤67,108,864, and bounded retained cache growth. Evicted pages
    can prepare again; current visible pixels and active-reader state stay usable.
14. **Fallback/default compatibility:** repeat native PDF actions in
    `?boardRenderer=original`, a standalone Document and Library details; also
    check Board images/video/audio replacement/playback. Expected: their native
    ownership, controls, fullscreen and error behavior remain available. No new
    PDF preservation state is written to Board content, recovery or export data.

## Diagnostic verification and pending measurements

Use the Vite development server for attribution only. Set
`sessionStorage.setItem('orbium.board.profile', 'true')`, reload after saving,
then select a scope from `window.__ORBIUM_BOARD_PERF__.list()`.
Read `window.__ORBIUM_BOARD_PERF__.snapshot(scope).instantScene.pdfs` before and
after each action. Scope numbers change on remount; do not assume `board-1`.

| Action | Expected counter behavior after settling |
|---|---|
| Drag/pan at unchanged page geometry | No new document load or page raster solely from movement |
| Warm return after card eviction | Page hits/shell creations can rise; document loads/rasters remain stable |
| First native change of a dormant page | Document load can rise once; changed pages rasterize |
| Inactive preparation/deactivation | Document disposals rise; active document-handle estimate settles to zero or the one active task |
| Active PDF offscreen | Pinned reader count stays one; `countsByKind.pinnedPdfOutsideRegion` reflects it |
| Cache pressure | Evictions rise; retained page/byte bounds remain satisfied |

`readerShellCreations` is distinct from `documentLoads`. `pageRasterizations`
counts PDF.js raster starts, including canceled attempts; it does not count browser
compositor/paint work. `activeDocuments` is loads minus completed disposal attempts,
not OS worker memory. Inspect any `documentDisposalFailures` rather than claiming
resource cleanup succeeded. Metadata revalidation is separate from opening the
PDF document. Capture/Profiler callbacks themselves add work; disable them for
ordinary idle inspection. Production retains no Board profiling console API.

Use the [production profiling protocol](../plans/board-performance-profiling.md)
for the same six-PDF scene and identical old/new viewport/zoom/build conditions.
Record three ten-second pan/return/drag trials, cold readiness, frame median/p95,
long tasks, style/layout/paint/raster, DOM and memory after repeated traversal.
Measure CPU/power/temperature separately with system tools. All runtime figures
remain **pending manual recording**; no improvement is inferred from build times
or cache/counter declarations.

Stop after this review. Extending prepared visuals to Documents/tables/other media,
persistent assets, adaptive fidelity or later product phases requires approval.
