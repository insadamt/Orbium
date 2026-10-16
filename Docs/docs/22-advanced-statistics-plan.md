# Advanced statistics — final feature before V1

Date: 2026-10-16.
Status: planned for later implementation; no implementation started.
Release position: the final feature added before V1, followed by release hardening.

## 1. Purpose and release boundary

Add historical growth and deltas to the approved Statistics page without making
its overview harder to understand or slowing down normal writing.

The user approved planning historical statistics for every page and workspace,
with Month, Year, and All time views and navigation through previous periods.
History is driven by saved changes; it requires no scheduler, queue, or external
analytics service. Monthly and yearly summaries keep historical reads bounded.

This document is an implementation plan, not permission to start implementation
or advance a product phase. Finish other planned work first. When the user asks
to start this feature, reconcile its scope with `01-v0.1.0-scope.md`, implement
one milestone at a time, and stop for manual approval between milestones.
After final acceptance, freeze feature additions and proceed to release audits,
fixes, the release candidate, and explicit approval before stable promotion.

“V1” is the user's product milestone name. Existing release documents use
`v0.1.0`; this plan does not silently rename tags or change the release process.
Resolve the actual version label when preparing the release.

## 2. Read before implementation

- `../START_HERE.md` and `../AGENTS.md`.
- `00-product-spec.md`, `01-v0.1.0-scope.md`, `02-domain-model.md`.
- `03-technical-architecture.md`, `04-data-model.md`, `05-ui-ux-system.md`.
- `10-portability-protocol.md`, `11-security-self-hosting.md`.
- `18-document-transfer.md`, `19-library.md`, `21-statistics.md`.
- `../phases/07-settings-onboarding-polish.md`, `../phases/08-release.md`.
- Repository `AGENTS.md`: manual testing only; no automated tests written or run.

## 3. Agreed product behavior

### Scopes

Track account, workspace, folder, database, and document history. “Every page”
includes folders and databases; do not limit implementation to account history.
Reuse the current ownership, containment, visibility, and upload-counting rules.
Account/workspace snapshots must not be computed by blindly summing child
snapshots: descendants overlap, and referenced uploads can be shared.

### Period selection

| View | Navigation | Chart points | Comparison |
|---|---|---|---|
| Month | Previous/next month and month/year picker | Daily closing totals | Opening to closing total of selected month |
| Year | Previous/next year and year picker | Monthly closing totals | Opening to closing total of selected year |
| All time | Entire available history | Monthly, or yearly for long histories | First reliable baseline to latest total |

Default to the current month. Disable future periods and future points. Label
current periods “so far.” Allow previous periods even if the user did not log in
then. Display “No recorded history” before tracking began, rather than zeroes.
A partially tracked month/year must be labeled with its actual coverage dates.

For All time, choose a bounded granularity (proposed: at most 120 monthly points,
then yearly). State the granularity in the UI; individual years remain accessible
through Year view. Missing/unknown data must produce a chart gap, not a false zero.

### Interface

Keep the approved Overview intact. Add a sibling Trends tab:

1. Existing scope selector and source-page return navigation.
2. Overview / Trends tabs.
3. Month / Year / All time, period label, arrows, and picker.
4. Four metric cards: Words, Documents, Blocks, Storage used.
5. Ending value, signed absolute delta, percentage delta, and comparison dates.
6. One line chart, with the selected card choosing the metric shown.
7. A short explanation of net growth and data coverage when relevant.

Example: September 2027, Words: 24,500; +2,100 (+9.4%) since September 1.
A closed month uses its historical ending total, not today's live total.
Hover, touch, and keyboard interaction expose exact date/value details. Provide
an expandable accessible values table; charts cannot be the only way to read data.
Use icons and restrained theme-aware styling consistent with the approved UI.
Persist tab, period, and metric selection in the URL alongside existing scope.
Cancel obsolete requests; scope/date changes cannot show a late stale response.

## 4. Metric meaning and delta rules

Start Trends with the four existing metrics. Do not add activity tracking,
writing streaks, reading time, or workspace comparison as incidental scope.

- Words, documents, blocks, and storage are balances at a point in time.
- Absolute delta = closing value minus opening value.
- Percentage delta = absolute delta / opening value * 100, when opening > 0.
- Opening = 0, closing = 0: zero change, 0%.
- Opening = 0, closing > 0: show “New” with the absolute increase.
- Missing or incompatible opening value: show unavailable comparison, not zero.
- A decline is valid. Avoid treating every decrease as failure; lower storage can
  mean cleanup. Positive and negative signs must remain readable without color.
- Month/year openings come from the value immediately before the period began.
- If history starts mid-period, offer a clearly labeled “since tracking began”
  comparison; do not present it as a complete period delta.
- First-ever scope baseline is the All time opening, not an invented zero.

These figures measure net saved content growth. They do not measure words typed,
work sessions, or effort. Imports, Trash, restores, and moves can affect totals.
A document scope can legitimately show a constant Documents value of one.

## 5. Calendar and unchanged-day reconstruction

Use one persisted statistics timezone per account, initially the configured
application timezone. Store capture instants in UTC and calendar period keys in
that statistics timezone. Month/year boundaries use calendar dates, not fixed
24-hour/30-day durations. Cover leap days and daylight-saving transitions.
Do not regroup old history merely because a browser's timezone changes.
A future timezone-setting change requires an explicit conversion or new coverage
epoch; a settings screen for this is outside the initial implementation.

History is sparse: store baselines and changed dates, not duplicate rows for
every inactive day. Read the nearest reliable prior closing value and carry it
forward across unchanged dates. Never carry a value backward before its baseline.

Example:

| Date | Action | Closing words | Storage behavior |
|---|---|---:|---|
| October 10 | Saved edits | 1,200 | Store changed day |
| October 11 | No changes | 1,200 | Carry forward on read |
| October 12 | Server off | 1,200 | Carry forward on read |
| October 13 | Saved edits | 1,500 | Store changed day |

This is reliable only while every persistent writer participates in tracking.
Login does not prove an absence of changes: sessions can span days and CLI/import
operations can write without a login. Track successful writes, not keystrokes or
login events. Login may initialize/check tracking status without scanning every
page or generating rows for every missing day.

If tracking is disabled, a writer bypasses it, or history integrity is uncertain,
record an unknown coverage interval. Start a new baseline rather than silently
filling the interval. Direct database edits are unsupported and need explicit
reconciliation. A server-off interval alone does not create an unknown interval.

## 6. Extensible metric definitions

Use a small typed metric registry in application code, not a runtime plugin
framework. A definition specifies:

| Attribute | Examples / purpose |
|---|---|
| Stable key and definition version | `words`, version 1 |
| Label and unit | Words / count; Storage used / bytes |
| Supported scopes | Account, workspace, folder, database, document |
| Meaning | Balance, event counter, or ratio |
| Aggregation | Opening/closing; sum; numerator/denominator |
| Update dependencies | Save, hierarchy, attachment changes |
| Availability | Tracked since, complete/unknown/incompatible |
| Backfill policy | Reliable reconstruction available or unavailable |

Separate metric meaning from storage schema version and HTTP response version.
Historical values record the definition version used. Missing metric keys mean
not tracked/unavailable; a known zero is an explicit valid value.

Aggregation rules must be explicit:

- Balance: carry opening/closing values; never sum daily totals.
- Event counter: sum eligible increments if/when such a metric is introduced.
- Ratio: aggregate numerator/denominator and divide; never average daily ratios.

Adding a metric later means adding its definition, calculation/dependencies,
recording, aggregation, and UI placement. Generic period storage should not need
a migration for each scalar metric. It may still need migrations for genuinely
new source data. Do not assume arbitrary future metrics are free to calculate.

New metrics begin at their own known baseline. Backfill only from reliable
historical inputs. Current document bodies cannot recreate past word counts.
When a definition changes, rebuild only where reliable historical source data
exists; otherwise start a version boundary and suppress incompatible deltas.

## 7. Proposed persistence model

Finalize migrations after reviewing the actual data model; use additive changes.

### Scope identity and current state

A statistics scope record identifies the owning user, scope kind, stable subject
identity, tracking state/start, calendar timezone, and current metric values with
their definition versions. Enforce one identity per owned scope.

Keep history identity independent from node deletion so removing a node cannot
cascade-delete all past aggregate history. Preserve only the minimum identity
metadata needed; avoid copying document bodies or titles into snapshots.
Account deletion must remove its statistics. Historical reads still authorize
ownership and subject visibility; a tombstone is not a bypass for Trash access.

### Period records

Use a period table keyed by scope identity, granularity (day/month/year), period
start, and coverage epoch. Store opening/closing metric values and definition
versions, capture/coverage timestamps, and completeness. JSONB metric maps allow
new keys without a column per metric; keep metric validation in the registry.

Use unique constraints and indexes matching scope/date/granularity reads. Scope
identity columns must avoid nullable-unique-key ambiguity for account scopes.
Do not store duplicate derived fields without a concrete read-performance reason.
Deltas can be calculated from opening/closing values in the response.

Initial non-metric metadata can include visible/trashed/deleted state. Distinguish
a page's intrinsic saved-content totals from its contribution to active ancestors.
Trashing a document excludes it from ancestor content totals without pretending
that its saved body was rewritten to zero. Record lifecycle transitions even
when the intrinsic word count stays unchanged. Existing upload-retention rules
remain separate from active-content inclusion.

## 8. Mutation-driven capture and rollups

Introduce focused services and clear DTOs for affected scopes, metric changes,
operation identity, and capture instant. Keep controllers thin and new source
files under roughly 500 lines. Do not hide writes behind query-like names.

For each successful persistent change:

1. Resolve affected scopes and capture one timestamp for the operation.
2. Acquire existing write serialization plus any scope locks in a stable order.
3. Ensure a reliable pre-change baseline for scopes not initialized yet.
4. Apply the domain operation and derive before/after metric contributions.
5. Update scope current values and that calendar day's closing record.
6. Update month/year summaries from authoritative openings and latest closings.
7. Commit domain changes and historical changes atomically.

Preserve a period's first valid opening across subsequent writes. Repeated saves
must not repeatedly add totals. Rejected saves, failed moves, and rolled-back
imports must leave no historical changes. Use existing revisions/operation
boundaries for idempotency; introduce explicit operation keys where necessary.

No scheduler is needed to close a period: the next write is assigned its calendar
date. Unchanged periods carry forward lazily. On a write after a long absence,
resolve boundary values from sparse records; do not loop through every missing day
or materialize thousands of idle periods in the save transaction.

Monthly and yearly summaries describe their own boundaries. A yearly balance is
not the sum of monthly balances. Closed summaries change only through an explicit
historical correction, versioned rebuild, or restore policy.

### Required mutation coverage

| Operation | Affected behavior |
|---|---|
| Markdown/legacy document save | Page and active ancestor writing/block totals |
| Create/duplicate document or container | New identity/baseline, ancestor content totals |
| Folder/database move | Page history preserved; old/new ancestor contributions change |
| Sibling reorder / rename | No growth delta if metrics do not change |
| Trash / restore, including subtrees | Ancestor content removed/restored once; retain intrinsic page history |
| Workspace Trash / restore | Account active content changes; retained upload storage follows current rules |
| Upload / attachment delete | Workspace/account retained storage and affected referencing pages |
| Cover/icon/body/Files-property reference changes | Unique referenced uploads for affected pages/ancestors |
| Document/linked-package import | Newly saved content counted once, no invented pre-import history |
| Permanent deletion / account replacement | Tombstone, cleanup, and restore policy applied atomically |
| CLI tools / supported maintenance | Participate or explicitly mark coverage interruption |

Cross-workspace moves remain rejected under current domain rules; do not introduce
them for statistics. Rebuilds of current derived counts are repairs, not writing
activity; handle semantic corrections explicitly rather than recording fake growth.

### Shared uploads and ancestor cost

Storage is not additive across pages. An upload referenced twice counts once in
each containing scope. Removing one reference must not remove its size while
another remains. Workspace totals include retained unused uploads; account totals
also include retained uploads in trashed workspaces under the current rules.

Implement and measure a scoped distinct-attachment membership/refcount mechanism
or another bounded equivalent. Count body, page-media, and database Files
references together. Account/workspace retained storage has a different source
from page referenced-storage. Never sum page storage into workspace storage.

Bulk moves, subtree Trash/restore, and imports update each affected scope once
per logical operation, using batched queries. Audit reference fan-out: deleting
a shared upload can affect several pages and ancestor chains. Avoid repeated
full-document parsing or account-wide scans in autosave.

## 9. Initialization, rebuild, and portability

- Provide an explicit resumable command to initialize history for existing scopes
  before normal tracking is enabled. Reuse stored derived counters; pending
  counters keep affected metrics unavailable. Coordinate initialization and writes
  with the same locks; support safe on-write baseline creation where needed.
- Record actual initialization times. Existing pages start from their current
  totals; creation timestamps are not evidence of earlier word counts.
- Login checks status, but does not synchronously initialize every page.
- Correcting current statistics does not recreate historical values. A period
  summary can be rebuilt from valid daily history; past bodies generally cannot.
- Retain daily data initially. Monthly/yearly summaries are rebuildable read
  models, not a reason to delete daily records needed for old Month views.
- Fresh installs, upgrades, interruption/resume, and server restarts must work.

Before implementation, settle portability compatibility as part of milestone 1.
Recommended policy: whole-account archives preserve source history, scope identity,
metric versions, coverage, and timezone, with validated ID remapping; regenerate
monthly/yearly read models if needed. Use an explicit archive version/adapter if
its format changes. Older archives without history start a new baseline.
Individual document/linked-package imports start new history and do not merge
another account's historical records. Account replacement must not mix the old
account's history with the restored timeline. Safety backups must preserve the
history needed to recover the previous state. Update actual export contracts,
documentation, and manual acceptance together; never silently extend a released
archive format or claim history is reconstructible from ordinary document export.

## 10. Performance and security requirements

No per-keystroke work, document-body parsing on chart reads, network polling,
Redis, queues, scheduler, or new analytics infrastructure.

Incremental mutation work should follow changed pages, affected ancestor chains,
and attachment membership changes. Query by authenticated owner/scope/date using
indexes. Read the requested period plus necessary boundary records only.
Month returns at most 31 days, Year at most 12 months; All time uses bounded
monthly/yearly points. Preserve a single consistent read across values/deltas.
Current-scope baselines and very large subtree operations may cost more; measure
these explicitly rather than hiding them behind an unqualified “instant” claim.

Before implementation, capture baseline timings. Before final acceptance, report:

- Save latency and query count before/after on small and large documents.
- Ancestor-depth and bulk-operation cost; shared-upload fan-out.
- First baseline, warm history reads, and month/year/all-time payload sizes.
- Long inactive gaps, many pages, multiple sessions, and concurrency behavior.
- Daily/month/year row growth and index size for representative data volumes.

Agree concrete performance limits from those measurements before final acceptance.
Use local non-test diagnostics and manual browser profiling; do not write or run
automated tests. Statistics requests must remain owner-scoped; never trust scope
IDs, date ranges, or metric keys from the client. Reject unsupported metrics,
invalid dates, and excessive ranges. Historic access must respect existing
visibility rules. Prevent duplicate writes, mixed versions, and negative counts
from concurrent saves, retries, moves, or restore races.

## 11. Implementation milestones and stop gates

Each milestone ends with a report, exact manual steps/results, relevant checks,
limitations, and suggested commit messages. Stop for explicit user approval before
the next milestone. Do not implement the whole feature in one uninterrupted pass.

| Milestone | Deliverable | Acceptance gate |
|---|---|---|
| 1. Contracts | Final metric semantics, timezone, scope identity, coverage, portability, schema, operation inventory, performance baseline | User approves concrete contracts and UI layout |
| 2. History foundation | Additive migrations, registry, initialization, sparse daily history, atomic saves and ancestor updates | Existing and new scopes record accurate baseline/day values |
| 3. Complete mutation coverage | Hierarchy, Trash, uploads/references, imports, deletion, repair and restore behavior | No supported writer bypasses history; uniqueness and visibility hold |
| 4. Rollups and read API | Monthly/yearly summaries, deltas, unchanged-period reconstruction, owner-scoped bounded queries | Daily/month/year boundaries agree; no duplicated totals |
| 5. Trends UI | Month/year picker and arrows, All time, four cards, one accessible chart, values table, URL state | Previous/current/partial/missing periods are understandable |
| 6. Release acceptance | Performance measurements, upgrade/restore checks, docs and manual acceptance report | User accepts the feature; feature freeze before release hardening |

Baseline approval must cover the write overhead as well as chart speed. If
storage-reference tracking or archive compatibility cannot meet the agreed
constraints, report the concrete issue and revise the plan with the user before
silently reducing per-page coverage or adding infrastructure.

Suggested implementation commits (do not create them as part of this plan):

- `feat(statistics): define versioned historical metric contracts`
- `feat(statistics): record daily history for pages and workspaces`
- `feat(statistics): capture hierarchy and upload history changes`
- `feat(statistics): add monthly and yearly growth summaries`
- `feat(statistics): add navigable historical trends`
- `docs(statistics): document historical tracking and release acceptance`

## 12. Exact manual acceptance checklist

Use disposable local fixtures and documented development controls for calendar
boundary scenarios. Never modify real user history to simulate dates. Any
clock/fixture control must stay local and must not become a production setting.

1. Initialize an existing account. Expect current totals as the first baseline
   for every initialized scope; no pre-tracking zeroes or invented earlier growth.
   Interrupt/resume initialization: expect no duplicates and no missing writes.
2. Save 100 additional words. Expect the page, containing folders/database,
   workspace, and account to reflect exactly +100; month/year closings match.
   Save unchanged content/retry a request: expect no duplicate increase.
3. Keep a session open across midnight without logging in again; save on both
   dates. Expect separate daily values and a preserved first opening. Repeat
   across month/year boundaries, a leap day, and a daylight-saving transition.
4. Leave several days/months unchanged, including a server-off interval. Expect
   flat reconstructed values after restart, without one write per inactive day.
   Try an unknown tracking interval: expect a gap, not an assumed flat line.
5. Navigate an earlier month, year, and All time. Expect selected-period end
   values, correct comparison dates, bounded points, and future navigation
   disabled. Current periods say “so far”; partial periods show coverage dates.
6. Start at zero and add content. Expect absolute growth and “New,” not infinity.
   Keep zero unchanged: expect 0%. Reduce content: expect a signed negative delta.
7. Use 1,000 words unchanged for ten days. Expect a closing monthly balance of
   1,000, not 10,000. Compare monthly/yearly summaries with their daily boundaries.
8. Move a page/subtree within a workspace. Expect its own history to persist,
   old/new ancestor totals to change once, and past container history unchanged.
   Reorder/rename only: expect no word/document/block/storage growth.
9. Trash/restore a subtree and a workspace. Expect active ancestor content to
   follow existing visibility rules while page intrinsic totals/history remain
   identifiable. Retained uploads must not falsely disappear from storage.
10. Reuse an upload in multiple body/media/Files references. Expect distinct
    counts per scope. Remove one reference: expect storage retained while another
    remains. Delete the upload: expect all affected scopes updated once.
11. Import a document/package, restore an account archive with history, then
    restore an older supported archive without history. Expect new document
    baselines, remapped preserved account history, or explicit new baseline as
    appropriate. Repeated operations must not duplicate or merge unrelated history.
12. Try conflicting saves, a rejected move, and a failing import. Expect rollback
    to leave both domain data and history unchanged. Simultaneous sessions must
    not lose increments. Derived-count repair must not masquerade as new writing.
13. Add a temporary development metric/definition version through the registry.
    Expect older missing values marked Not tracked and incompatible deltas
    suppressed. Verify a ratio aggregates its components, not daily averages.
14. Request another account's scope/history and a hidden/deleted subject. Expect
    current authorization/visibility rules. Purge an account: expect owned history
    removed; deleting one page must not erase past workspace aggregate totals.
15. Rapidly switch scopes, periods, and metrics on a slow connection. Expect the
    newest selection only. Reload the URL: expect the same selection. Retry a
    failed request; check empty, partial, and missing-history states.
16. Check keyboard/touch chart exploration, values table, approximately 375px
    viewport, Light/Dark, Normal/Frosted, and reduced motion. Expect readable
    controls, exact accessible values, and no horizontal page overflow.
17. Compare measured save/query/row-growth results with the agreed performance
    limits. Expect bounded chart reads and no account scan on ordinary autosave.
    Record actual results and remaining limitations; do not assert “instant.”

## 13. Validation and completion report

During implementation, run changed-file formatting and relevant lint/type/build
checks, PHP formatting when applicable, and `git diff --check`. Run no automated
tests, as instructed by the user. Report exact commands/results; do not turn
unperformed manual checks into passing results.

For this planning task: only Markdown documentation and index links change.
Validate links, section coverage, and whitespace. Application build/type checks
are not applicable to the plan alone. No migrations, commits, or implementation
are included in delivery of this file.

The final feature report must include implemented scope, actual check results,
manual checklist outcomes supplied by the user, performance measurements,
migration/deployment/portability instructions, limitations, and commit suggestions.
After acceptance, stop feature work and follow the existing release hardening
and explicit stable-promotion gates.
