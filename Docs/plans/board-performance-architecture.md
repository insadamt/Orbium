# Board performance architecture — implementation contract

Implemented for the existing Board phase-4 correction on 2026-10-21, following the
user's explicit instruction to implement the architecture without waiting for P0
recordings. This supersedes the earlier measurement-first execution gate; manual
acceptance and actual performance measurements remain pending. No later product
phase, new framework, worker infrastructure or GPU renderer is introduced.

## Scoped editing records and transactions

Each mounted Board owns a `BoardRecordStore` containing immutable records keyed by
UUID, stable ordered IDs, cached snapshot materialization and a separate geometry
snapshot. `BoardSubscribedObjectCard` uses `useSyncExternalStore` to subscribe to
its record. Selection formatting subscribes to the selected record separately.
Text edits replace and validate only that object and adjust the aggregate byte
budget. They do not publish a new geometry snapshot or map every Board object.

Geometry, kind, membership and layer changes publish a completed layout transaction.
Multi-object commands still use the compatible snapshot command boundary, diff into
records once, and notify changed IDs. Automatic heights are batched per frame and
discard stale measurements; derived geometry creates no history entry and retains
redo. Camera movement remains outside content/history and uses the existing refs
and requestAnimationFrame painting.

History keeps at most 40 entries containing before/after records for changed IDs
and shared order arrays. Typing coalesces by object and the existing 700ms boundary.
Undo/redo restores the whole logical action, including structural order, rather
than creating a separate undo model per card. New accepted actions invalidate redo;
derived sizing does not. Existing selection/editor reset behavior remains.

Snapshot arrays are materialized only when a consumer needs them: save/recovery,
whole-Board commands, diagnostics or actual geometry publication. Autosave accepts
a reader for the current immutable records, not a freshly constructed full array
on every character. Snapshots already sent remain immutable while newer changes
wait behind the in-flight request.

## Visibility and renderer lifetime

Visibility derivation is memoized against geometry, published camera coverage and
the active editor. Retention recency commits in a layout effect; rendering performs
no state updates. The existing 640px overscan, 160px guard and weighted 48-unit
offscreen retention remain. The active editor is pinned independently. No spatial
index is introduced without evidence that scanning the bounded geometry is costly.

Inactive native tables mount a lightweight read-only surface with Document table
classes, rich cell rendering, spans/widths/alignments and the shared fullscreen view.
They mount no CodeMirror view. Mermaid sessions are created only if a cell needs
one. Editing mounts the existing Document table widget and hidden source controller;
cell tools, keyboard navigation, formatting and Board history remain shared.
Switching modes preserves table scroll offsets; active editing is not recycled.

One `BoardWorkScheduler` per provider bounds preview fetches to two and expensive
render initiations to one. Native code/math/diagram previews, rich read-only table
cells and linked Document embeds use the render lane; active source/cell/native
editors remain immediate. Visibility is observed without per-pointer DOM reads.
Current input can postpone a render start for at most 120ms, and queued work ages
so continuous motion cannot indefinitely starve it. Each initiation yields through
a browser task. Individual Mermaid/PDF renderers retain their own internal resource
limits; the Board lane is not a global cap on every asynchronous renderer job.
The repeat-loading correction now holds the render slot through a native Mermaid
render/sanitization promise, instead of starting another independently idle-delayed
Document session. Embedded diagrams retain their existing session scheduling.

Prepared previews outlive an individual culled surface within the mounted Board:
sanitized Mermaid SVGs use a least-recently-used 128-entry/4 MiB estimated-string
budget, keyed by owner kind, node ID and exact source. Math markup uses a shared
Board scope capped at 128 entries/4 MiB estimated strings. Native cache hits attach
before paint without queuing compilation. Reused SVGs receive fresh instance IDs
and current theme colors. Table/linked-Document Mermaid sessions seed from the same
owner-scoped prepared results. No live DOM or editors are retained by these caches.
Cold/changed/evicted sources still require rendering; nothing is pre-rendered for
all stored objects. Ordinary Documents keep their own math scope by default.

Linked Document text is constructed immediately from cached/fetched original source;
expensive embedded surfaces initialize progressively. All content remains accessible;
no permanent excerpt/summary replaces the original Document. Jobs are canceled on
content change, mode change and unmount, and stale callbacks cannot populate a new
surface. Ordinary Documents retain synchronous rich rendering unless an explicit
Board context supplies the optional scheduling hook.

Linked Document refresh preserves the current readable revision until its fetch
succeeds; a different target never inherits that source. A failure remains visible
alongside the retained content. Missing/revoked resource metadata still removes
the preview through the existing resource boundary.

The source cache remains revision-matched and bounded to 24 Documents/8 MiB per
provider. Warm retained surfaces and overscan prepare likely incoming content;
there is no unconditional 2–4-viewport allocation. Native layout zoom and existing
PDF density/debounce/pixel budgets remain, preserving settled rendering quality.

## Incremental save protocol version 1

The snapshot and native content formats remain **4** and **1**. Existing full GET
and PUT endpoints remain available. A snapshot additionally advertises
`mutation_version: 1` only when every stored object is native and its layer order
is contiguous. The client uses full PUT when the capability is absent/unknown;
legacy/mixed or non-contiguous Boards normalize through the existing full-save
adapter. Reopening the normalized Board can enable incremental saving.

`PATCH /workspaces/{workspace}/boards/{node}/content` accepts:

| Field | Contract |
|---|---|
| `format_version` | Exactly 4 |
| `mutation_version` | Exactly 1 |
| `revision` | Expected current Board revision, safe integer |
| `mutation_id` | UUID retained for the exact request through retries |
| `creates` | Full native records with new UUIDs in this Board |
| `updates` | Full native records already belonging to this Board, including layer changes |
| `deletes` | UUIDs already belonging to this Board |

Each array is present, bounded to 1,000 entries and individually unique. The batch
is nonempty, and an identity occurs in exactly one operation across the arrays.
Unchanged records are omitted. Geometry/versions/typed data and references use the
same authoritative rules as full saves. Aggregate resulting count/data bytes and
unique contiguous layer order are checked before committing. Deleting/reordering
can require additional updates for compacted layer numbers.

The endpoint uses normal authentication, CSRF, visible owned Board access and the
workspace write boundary. One Board row lock/transaction covers revision checking,
record validation, aggregate checks, row deletes/upserts, revision increment and
the replay receipt. Only changed rows are written after budget initialization;
bounded ID/layer/budget metadata is still read for aggregate invariants. Original
Documents, resource ownership, missing references and attachment rules remain.

The response echoes `mutation_id` and the expected next revision. The client checks
both before acknowledging the batch, advances its baseline, then saves newer edits.
Network/uncertain server failures retain the exact body and UUID. Confirmed 4xx
rejections release that prepared request; 409 blocks further writes and preserves
the complete local draft. No automatic last-write-wins or rebase is added.

## Migration, replay and recovery

`2026_10_21_000001_add_board_mutation_metadata.php` adds:

- nullable `boards.last_mutation_id` and `last_mutation_hash`;
- nullable `board_objects.data_bytes`, derived from canonical server JSON.

Existing content/UUIDs are not rewritten by the migration. A legacy native Board's
missing budgets initialize once under its Board lock in one bounded upsert. Future
full and incremental saves maintain them. Budget checks use canonical compact JSON
bytes, not PostgreSQL's whitespace-bearing `jsonb::text` representation. Metadata
is absent from snapshots/recovery/exports. Deploy the migration and matching PHP
before serving the new client. Older clients can still use full PUT on this server.

The last successful mutation's ID/hash is a bounded replay receipt. An identical
retry at its result revision returns the original acknowledgement without another
write/increment. Reusing the current receipt with different data returns 409. A
later write clears/replaces the receipt; an older exact request then fails revision
checking. This protects lost responses without an unbounded receipt table. A full
PUT also clears the receipt. No request is silently applied twice.

Recovery retains the complete format-4 snapshot in existing per-session storage,
not a mutation journal. Debounced recovery materialization yields to input;
duplicate optional writes can be skipped. Save/error/exit/hidden-page guards still
force draft persistence. A save acknowledgement with newer queued edits rewrites
their draft against the acknowledged revision. A crash after a lost response can
recover an older-revision draft and show the existing conflict controls; it never
blindly replays changes into a newer server snapshot.

Confirmed Load latest suspends pending saves and retains the old recovery draft
until the replacement arrives. A failed load leaves the draft available. Unknown
or corrupt draft bytes remain downloadable until explicit replacement. Changing
this to asynchronous journaling or moving non-DOM work to workers requires evidence
and equivalent durability; neither is necessary for this architecture correction.

See the [implementation report/manual checklist](../reports/12-boards-performance-architecture.md).

## CPU follow-up after negative user review

The preview-cache correction did not resolve the user's observed loading/CPU/heat.
Pending jobs now use a single minimum-rank scan instead of a full sort, and input
deferral retries after 16ms rather than repeatedly polling with zero-delay tasks.
New queued jobs pause while the browser document is hidden and resume when visible;
already-running asynchronous work can finish. Native unmarked tables with no
`table_source` render literal inline text/breaks directly into the same shared
table/fullscreen structure. Marked/source-backed rich tables retain the existing
Document renderer. Height observers stay mounted across content edits/derived
height publications, with explicit rescaling/width/mode dependencies and actual
ResizeObserver content notifications. SVG instance IDs remain fresh while neutral
color-to-CSS-variable adaptation reuses a weakly held prepared string.

These remove identifiable work, but are not a measured explanation or resolution
of thermal spikes. Current local `public/hot` selects development assets. A
temporary second server isolates built frontend assets for manual comparison;
the app environment/backend/data remain local and unchanged. See
`../reports/12-boards-cpu-followup.md` for limitations and the required foreground
recording. Stay within phase-4 manual review.
