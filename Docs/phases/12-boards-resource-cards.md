# Boards phase 4 — Live resource cards

Approved by “okey go ahead” after the native-block review. Read `../docs/24-boards.md`, hierarchy/domain/data, Document editor, navigation and Library contracts. Preserve the phase-3 independent native block model. Do not write or run automated tests.

## Decisions before implementation

- Add a `resource` Board object whose data stores only a target Node ID. No document content, copied title, hierarchy change or implicit mention is stored in Board snapshots. Introduce spatial format 4 by additive migration; native content format remains 1. Explicitly adapt older Board envelopes/drafts. Downgrade refuses while resource objects remain.
- Scoped Board JSON endpoints browse visible same-workspace Documents/Databases/Boards, return bounded live summaries, and fetch full document source only when editing a Document card. Validate live ancestry on every request. Saved missing/trashed references remain removable/movable placeholders; adding arbitrary unavailable/foreign targets is rejected. Preserve references through target permanent deletion without cascading knowledge deletion.
- New Document creation uses the hierarchy service with the Board's current parent folder/root. Create and attach the reference atomically against the current Board revision and object UUID; an idempotency key prevents retrying a lost response from creating sibling duplicates. Do not create a Document under a Board. Library/mentions continue to belong to the original Document.
- Inactive cards render bounded text/title/icon previews, never full editors. Refresh visible previews on focus/visibility and after card editing, with cancellation and bounded concurrency. Only the active Document card mounts the existing Markdown or legacy Document editor. Database/Board cards navigate through ordinary app tabs; no recursive Board/database embedding.
- Add an optional hosted Document session context to reuse existing editor UI with its original save endpoints/validation. It supplies single-request autosave, revision conflicts, local session recovery, pending-upload/import/composition guards and download/confirmed reload. Normal Document editors retain their existing default behavior. Hosted documents cannot participate in cross-editor block transfers.
- Protect the active card from switching, removal, undo/layout replacement and navigation while dirty, saving, uploading/importing or composing. Keep it mounted even if culled. Freeze conflicting editors; loading latest requires confirmation and cannot interrupt an upload. Keep Board spatial revisions independent of Document revisions; removing a card never deletes its target.
- Stop after checks/report/manual checklist. No Mind Maps, drawing, grouping, whole-account portability or phase 5 work is authorized.

## Required checks

Run formatting, PHP syntax, TypeScript, lint, build, migration SQL inspection/application and whitespace checks. Record actual results and exact positive/negative manual steps, known limits and commit suggestions. No automated tests.

## Review handoff

Implementation and exact manual acceptance checks are recorded in `../reports/12-boards-resource-cards.md`. Phase 4 remains awaiting manual approval. No Mind Map/later phase is started.

The subsequently approved canvas presentation polish is recorded separately in `../reports/12-boards-canvas-polish.md`. It preserves the resource-card implementation and remains part of the current review.

The user also authorized full-viewport Focus mode, explicit Select/Hand tools, native block placement and contextual UI improvements during this review. See `../reports/12-boards-focus-mode.md`; this remains phase-4 review work.

The spatial refinement review made full-screen the default Board layout and added object presentation/editing improvements, smart guides and alignment/distribution, a transient multi-selection outline and an optional properties panel. See `../reports/12-boards-spatial-refinement.md`. This is phase-4 review work, not authorization for Mind Maps or a later phase.

The latest user review requests a way back and an investigation of poor blocks. A visible Back button now follows guarded app-tab history with parent/workspace fallback; default full-screen remains. Indexed-field deletion remounts the surviving editor to prevent stale text, and the canvas no longer calculates an unused whole-Board byte total while rendering. `../reports/12-boards-investigation.md` records these fixes and unresolved keyboard, field-history and scrolling issues. The investigation is source-based because desktop capture was unavailable. Phase 4 remains pending manual review.


The user subsequently approved all audit recommendations with “okey fix all that”. Native list/table editing now uses a single constrained block editor, shared Board history, deliberate pointer gestures, consistent wheel ownership, stable content measurement, independent overlays, compact/touch layout refinements, an anchored link editor and targeted reductions in repeated processing. See `../reports/12-boards-ux-correction.md` for implementation, actual static checks, limits and exact manual validation. This remains phase-4 review work and does not authorize a later feature phase.


The user also approved the next block-presentation enhancement. The focused visual pass and representative-board acceptance are recorded in `../reports/12-boards-block-presentation.md`. No later phase is authorized.

The subsequent approved redesign explicitly follows Document block styling without six-dot handles, superseding the proposed spatial-notebook direction. Shared Document presentation and gutter-free hosted editing are recorded in `../reports/12-boards-document-style.md`. This remains phase-4 review work.

The user then requested matching editing ergonomics. Native click-to-edit, selection formatting, writing commands/shortcuts and focused Math/Diagram source editing are recorded in `../reports/12-boards-document-editing.md`. This remains the same phase and keeps typed independent Board objects.

The subsequent user report of widespread glitches authorized stabilization, recorded in `../reports/12-boards-editing-stabilization.md`. Reproduced crash/event-ownership failures were repaired and exercised in a disposable Board through the browser. This is a repair pass, not complete manual acceptance or authorization for another phase.


Native app integration correction (2026-10-19): the user approved the normal app bar/tabs, shared page styling, shared editable title and toolbar above the canvas. This supersedes the full-screen/separate-header presentation decisions in earlier review notes. Follow `../docs/24-boards.md` and `../reports/12-boards-native-app-shell.md`; this remains phase-4 review.

Performance architecture correction (2026-10-21): the user explicitly requested the
new architecture without waiting for the P0 recording gate. Scoped records/history,
per-object subscriptions, staged rich previews/read-only tables and revisioned
incremental saves are recorded in `../reports/12-boards-performance-architecture.md`
and `../plans/board-performance-architecture.md`. This supersedes P0-only execution,
preserves format 4/full recovery and remains this phase's manual review. Actual
performance/thermal acceptance is unmeasured; no later product phase is authorized.


Drawing review extension (2026-10-23): the user explicitly requested adding a drawing
system. That request supersedes this phase’s original drawing exclusion for pen,
highlighter, whole-stroke eraser and their native persistence/Board interactions.
Spatial format 5 and the manual acceptance boundary are described in
`../reports/12-boards-drawing.md` and `../docs/24-boards.md`. No Mind Map or later
product phase is authorized.


Drawing smoothing refinement (2026-10-23): the user approved smoother curves,
light stabilization and Off / Light / Strong controls. The focused refinement
bakes curve samples into existing format-5 points, preserving saved drawings and
Board interactions. See `../reports/12-boards-drawing-smoothing.md`. Stay in the
same phase for manual review.


Drawing smoothing correction (2026-10-23): user review found the modes felt alike.
The focused repair adds clearly separated geometric cleanup scales, stronger
stabilization and bounded simplification work. See
`../reports/12-boards-drawing-smoothing-correction.md`. Manual feel acceptance
remains outstanding within the same Board phase.


Smart drawing templates (2026-10-23): the user explicitly chose free/local template
recognition after clarifying handwriting/sign/shape conversion. Strong pen now
uses a BSD $P recognizer adaptation with defined shapes/signs/0–9/A–Z, candidate
choices and undoable conversion to existing text/drawing objects. perfect-freehand
supplies streamlining. See `../reports/12-boards-smart-templates.md`. Spatial
format remains 5; this is still the same phase's manual review.


Drawing toolbar correction (2026-10-23): following poor recognition results, the
user explicitly requested removing recognition for now and improving drawing UI,
motion and UX. The local recognizer/catalogs/conversion actions are removed;
Strong retains freehand smoothing. App-style glass controls, shared buttons/select,
visual brush presets and a preview are recorded in
`../reports/12-boards-drawing-toolbar.md`. This supersedes the smart-template
extension above and stays within the same Board phase-4 manual review.


Partial eraser review correction (2026-10-24): user-requested path cutting and
8/16/32/64px size controls supersede the whole-stroke eraser. Saved survivors are
ordinary format-5 drawing objects; no migration. Stay in this phase-4 review.
See `../reports/12-boards-partial-eraser.md` for checks and manual acceptance.


Single-block eraser correction (2026-10-24): the user clarified that surviving ink
must stay in the original drawing block. Internal break indices replace separate
survivors. Additive Board format-6 migration preserves saved objects/revisions,
with explicit older draft adaptation and downgrade refusal while gaps remain.
See `../reports/12-boards-single-drawing-eraser.md`; remain in phase-4 review.


Path Pen review extension (2026-10-24): the user's reference authorizes point-by-
point straight-path construction in the drawing palette. Completed paths reuse
one native format-6 drawing object with existing selection/history/partial erasing.
No new schema, migration or later phase. See `../reports/12-boards-path-pen.md`.


Existing drawing styling (2026-10-24): user-requested Path Pen nib illustration
and floating color/width controls for a selected drawing block. Uses the shared
text color picker, existing drawing fields and validated undoable record updates;
no format or migration change. See `../reports/12-boards-drawing-style-editing.md`.
Remain in phase-4 review.


Board micro-motion review (2026-10-24): user-requested lifecycle, editing/style,
selection/control, checkbox/path and status feedback, with bounded decorative
exits and reduced-motion cancellation. Existing direct camera/input/persistence
contracts remain. Full inventory/manual checks: `../reports/12-boards-micro-motion.md`.
No later phase, backend or format change.
