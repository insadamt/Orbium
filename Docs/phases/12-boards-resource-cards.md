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
