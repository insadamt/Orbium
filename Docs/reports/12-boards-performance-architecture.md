# Board performance architecture — 2026-10-21

## Scope and outcome

The user's “look just enhance everything implement the new architecture” authorizes
implementation without waiting for P0 traces. This supersedes the earlier P0-only
handoff and measurement prerequisite. The work remains a correction within Board
phase 4. P0 tooling is preserved; no later product feature phase is started.

The record/subscription, transactional history, scoped scheduling, read-only table,
visibility derivation and incremental persistence architecture is implemented.
Actual browser acceptance, CPU/frame/input timings and thermal impact remain
unmeasured. Static checks establish build/type/format validity, not a measured
performance gain. See the [architecture/protocol contract](../plans/board-performance-architecture.md).

## Changes

- Board records are normalized by UUID with separate layout/history channels.
  Each card subscribes to its immutable record; selected formatting subscribes
  separately. Single-object edits validate changed data and update total byte
  accounting, without mapping/publishing all content through BoardWorkspace.
- Multi-object commands publish atomic changes; automatic heights remain one
  derived transaction per frame without history/redo changes. A 40-entry grouped
  before/after history replaces full-object snapshot stacks. Layer commands retain
  unchanged object identities where possible.
- Save/recovery materialization is deferred to boundaries via a current-record
  reader. Optional duplicate recovery writes are skipped; critical paths still
  force complete draft writes. Confirmed Load latest cannot race pending autosaves.
- Visibility scans reuse geometry/coverage inputs; retention recency commits after
  render. The existing overscan/guard/weighted retention and pinned editor remain.
- Inactive tables use Document-style read-only cells/fullscreen without hidden
  CodeMirror editors or unused diagram sessions. Active tables retain the existing
  Document editor, menus, sorting, row/column controls and history. Preview/edit
  transitions retain scrolling; active table Mermaid sessions are started.
- One Board-scoped scheduler separates bounded fetch (2) and render-initiation (1)
  lanes. Native code/math/diagram previews, table embeds and linked Document embeds
  share prioritization/yielding/cancellation. Text remains immediate; expensive
  linked embeds progress without replacing the complete Document with an excerpt.
- Incremental PATCH batches explicitly create/update/delete records under a Board
  revision transaction. Changed content/reference/geometry validation and resulting
  count/byte/layer checks remain authoritative. Unchanged content is not resubmitted
  or upserted in ordinary incremental saves.
- Exact request bodies/UUIDs survive uncertain failures. The server's bounded last
  receipt acknowledges an immediate replay once and rejects stale/conflicting
  writes. Full GET/PUT, session snapshots, raw corrupt-draft download and original
  Document persistence remain. Whitespace middleware now covers PATCH as well as PUT.
- Snapshot capability negotiation keeps legacy/mixed/non-contiguous Boards on the
  full-save path. UUID case is canonicalized on reading, matching PostgreSQL UUIDs.

## Intentional boundaries

The plan conditions spatial indexing, workers, speculative cache expansion,
asynchronous recovery journals, media quality changes and wider Document adaptation
on evidence. Those experiments were not installed without measurements. Existing
native layout zoom/PDF density stays sharp; current caches retain their bounds.
The shared rich-renderer scheduling hook is opt-in for Boards; ordinary Document
rendering/editor behavior keeps its defaults. No new dependencies or infrastructure.

## Migration and compatibility

Snapshot format remains 4; native content format remains 1. The additive migration
adds nullable byte-budget and replay metadata only. Full snapshot fields still omit
this metadata. A read capability advertises mutation protocol 1 where supported.

- SQL inspection with `php artisan migrate --pretend --no-interaction`: PASS after
  connecting to local PostgreSQL outside the restricted network sandbox; three
  nullable metadata columns, no content rewrite.
- Applied only `2026_10_21_000001_add_board_mutation_metadata.php` to the local
  development database: PASS, 14.35ms.
- For another installation, run `php artisan migrate` with the matching server
  deployment before loading the new client. Existing full-save clients remain
  compatible with this server. A legacy Board may use PUT until it is reopened
  after its normal native/full save.
- First incremental mutation on preexisting native content initializes byte
  metadata once; subsequent mutations read bounded metadata and write changed rows.

## Validation

- Focused frontend formatting: PASS.
- `npm run types:check`: PASS, exit 0.
- `npm run lint`: PASS, exit 0; 678 checked files correctly formatted, no warnings
  or lint errors in 570 linted files.
- `npm run build`: PASS, exit 0; final build completed in 15.67 seconds. Existing
  warnings remain for >500 kB chunks, mixed static/dynamic imports of
  `document-image-crop-dialog`, `database-property-header`, `document-editor-loader`
  and plugin timing. These are build warnings, not runtime measurements.
- Production diagnostic exclusion inspection: PASS; the manifest/referenced scripts
  contain no Board diagnostic module entries or API/flag/capture-marker strings.
- `./vendor/bin/pint --test`: PASS for the repository. PHP syntax checks: PASS
  for all 11 new/changed PHP files, including middleware/routes/migration.
- Focused PHPStan (`--debug --no-progress`) for all new/changed PHP: PASS, zero errors.
- Repository-wide PHPStan: FAIL, 91 errors across 24 unchanged files. Examples:
  missing iterable types in existing Board/resource/Trash services, existing
  Database configuration typing and Library/search/model typing. The complete
  report was inspected; no error file is part of this patch's changed PHP source.
- Board routes: PASS, 11 registered routes including existing GET/PUT and new
  PATCH `boards.content.mutate`.
- `git diff --check`: PASS. New/substantially modified source remains under 500
  lines; the largest changed source is the existing Board canvas at 459 lines.
- No automated tests written or run, as instructed. Browser behavior, replay,
  conflict/recovery and performance are for the user's manual acceptance below.

## Exact manual test checklist

Use a disposable native Board with text, list, code, table, math, Mermaid, image,
PDF and linked Document cards. Load the updated assets and keep Network open.
Repeat the affected large Board's real pan/drag/typing workflow after the small
scene is verified. The older P0 report describes the previous architecture;
inactive tables should now have zero hidden source views.

1. **Open and save:** open the Board, edit one short text block without changing
   its wrapping, wait for Saved, reload. Expected: content/selection behavior and
   saved geometry remain correct. Its native contiguous snapshot advertises
   `mutation_version: 1`; the save is PATCH with one updated record and empty
   creates/deletes, rather than a full `objects` payload. Automatic-height changes
   can add geometry updates for the affected object.
2. **Render isolation:** in React DevTools Profiler, type several sentences in one
   text block while unrelated table/diagram/PDF cards are visible. Expected: the
   edited card/formatting update; unrelated cards' rich surfaces do not remount or
   restart. Save status, first history availability and actual height changes can
   still update the lightweight parent/layout. Do not infer CPU gain from memo
   declarations alone.
3. **Text fidelity:** add leading/trailing spaces, blank paragraphs, inline marks,
   RTL text and IME composition; empty and refill a code/math source. Save/reload.
   Expected: meaningful whitespace/empty strings and formatting survive PATCH;
   composition is not interrupted and no save publishes unfinished composition.
4. **Grouped history:** type one burst, pause over 700ms, type another, move the
   block, then undo/redo each action. Repeat after content grows/shrinks and after
   a table edit. Expected: logical steps restore complete changes in order, no
   measured-height-only step, redo survives derived sizing and a new edit clears
   redo. Toolbar undo availability follows the current stack.
5. **Multi-object transactions:** select several cards, drag using guides/grid and
   Alt bypass, release quickly, undo/redo. Resize sides/corners, reorder layers,
   duplicate, cut/paste and delete a middle card. Expected: final pointer geometry,
   whole-block scaling, automatic height and selection borders remain correct;
   each gesture is one history action. PATCH contains affected records and any
   layer compaction updates. Save/reload retains the final order and geometry.
6. **Table lifetime and parity:** outside editing, check
   `document.querySelectorAll('.board-table .cm-editor').length` in Console.
   Expected: zero for inactive tables. Enter one table, edit cells, use Tab/Shift+Tab,
   formatting, sort, row/column menus, insertion/deletion and drag reordering.
   Finish editing. Expected: the shared editor mounts only during editing and
   destroys its source view afterward. Rich cells/spans/widths/header appearance
   and fullscreen preview remain correct. Horizontally scroll before entering /
   leaving editing; the same scroll position is retained within the available range.
7. **Rich initialization:** pan into code/math/Mermaid/table-rich-cell regions,
   keep panning and reverse. Expected: readable source/text appears promptly and
   previews progressively become complete without waiting indefinitely for motion
   to stop. Invalid source has an error state. Finish source editing and undo/redo;
   the latest canonical content renders and canceled old jobs do not overwrite it.
8. **Linked Documents:** scroll a long mixed-content linked Document, enter editing,
   change original text, finish and open the original page. Expected: all content
   remains reachable and edits save to the original. Scroll/source anchors and
   save/revision controls work. Pan the active editor offscreen and return:
   composition, selection, draft and scrolling are retained. Removing its card
   retains the Document and attachments.
9. **Return pans and bounds:** make short return pans, then travel beyond retention
   and return; resize the viewport, Fit/reset, zoom to 50/100/200% and enter/exit
   Board fullscreen. Expected: recent surfaces stay mounted within the existing
   budget; evicted ones can rebuild from cached source. Source downloads remain
   bounded, stale jobs cancel, and grid, toolbars, pointers and sharp settled PDFs
   remain aligned. Normal/narrow/reduced-motion layouts keep usable controls.
10. **Media:** play/pause video/audio, page/scroll/zoom a PDF, use fullscreen,
    replace an image/file and undo/redo. Expected: controls retain event ownership,
    uploads/Library ownership remain intact, settled text/PDF output stays sharp
    and removing a card retains its uploaded file.
11. **Offline and newer edits:** turn Network Offline, edit and wait for Not saved;
    make another edit, reconnect and choose Retry save. Expected: the retained
    batch retries with its original mutation UUID/body; newer changes save after
    its acknowledgement. The final content survives Saved/reload; full recovery
    snapshots remain downloadable while offline and navigation stays guarded.
12. **Replay and lost response:** in Network, copy a successful PATCH as a fetch
    request and replay it manually before another write. Expected: same revision/
    mutation acknowledgement, no duplicate object or extra revision. Replay after
    another write: expected 409. For a lost-response simulation, block/interrupt
    a request's response after server completion and Retry: expected the same
    UUID/body is acknowledged or reports a later revision conflict, never a second
    application. Keep copied requests private and use only disposable content.
13. **Conflict/reload race:** open the same Board in a second browser tab, save a
    change there, then save from the stale first tab. Expected: 409, complete local
    draft/download remains and further writes are blocked. Confirm Load latest.
    Expected: no pending autosave races the GET; the current saved Board replaces
    the draft only after loading. Repeat Load latest offline: expected the old
    draft remains available and the UI reports failure.
14. **Recovery compatibility:** refresh while a disposable offline edit is pending;
    then exercise an older-revision and a corrupt/unsupported local draft.
    Expected: same-revision drafts recover and save, older revisions use conflict
    controls, and corrupt raw bytes remain downloadable. A crash after an uncertain
    committed mutation may show an older-revision conflict, never blind replay.
15. **Authoritative rejection:** manually edit copied PATCH requests on disposable
    data: overlap an ID across operations, update/delete an unknown ID, create an
    existing ID, reuse a mutation UUID with different data, give duplicate/gapped
    layers, invalid geometry/content/version, foreign attachments/resources or
    exceed block/aggregate/object limits. Expected: 422/409 as applicable, or 404
    for unavailable/foreign Board access; no partial save or revision advancement.
16. **Legacy/default Document compatibility:** open a Board containing legacy rows
    if available, edit/save/reload, and open a normal standalone Document with
    tables/media/diagrams. Expected: legacy Board uses full PUT and converts via
    its normal adapter; reopening a fully native contiguous Board enables PATCH.
    Ordinary Documents retain their existing editor/render behavior. Unknown
    mutation capabilities use the compatible full-save path.

For timings, use the existing [profiling protocol](../plans/board-performance-profiling.md)
when convenient. Compare matching assets/machine/scene/viewport and record actual
numbers; acceptance of this implementation does not establish a thermal claim.

## Commits and handoff

No commits created. Suggested logical commits:

- `perf(boards): isolate records and store transactional history`
- `perf(boards): schedule rich previews and separate table editing`
- `feat(boards): add revisioned incremental saves with safe retries`

Remain in Board phase-4 manual review. Address reported regressions here; do not
start Mind Maps, another product phase or unmeasured infrastructure experiments.
