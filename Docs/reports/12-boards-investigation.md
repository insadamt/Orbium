# Boards — Navigation and block interaction investigation

## Phase

2026-10-18 — Phase-4 review, following the user's request for Back navigation and investigation of poor blocks. No later phase started. This supersedes the no-Back behavior in the spatial refinement report.

## Outcome and evidence

The source points to interaction problems beyond appearance. A list is implemented as independent text fields, each using the same single-paragraph editor as ordinary text. Structural changes require buttons. Adding more styling does not supply list/table keyboard behavior or a coherent editing history.

Desktop accessibility exposed the running Orbium browser, but desktop screenshot capture failed through the available providers, including a denied/cancelled portal request. No visual verification or manual interaction was completed. The findings below are source-derived; neither latency nor visual quality was measured.

| Priority | Finding and source | Status |
|---|---|---|
| High | Hidden surrounding navigation plus no visible Back made leaving a Board undiscoverable (`pages/boards/show.tsx`). | Fixed: visible Back uses app-tab history, with parent folder/workspace fallback. |
| High | Indexed list/table fields can reuse an editor instance for a different surviving value after deletion. The inline editor initializes content when mounted without synchronizing a replacement field value (`board-text-block.tsx`, `board-inline-text.tsx`). | Fixed for item/row/column deletion: successful validated replacement remounts the active field. Requires manual confirmation. |
| High | Enter always calls `setHardBreak()`, including in a list item (`board-inline-text.tsx`). There is no list split, empty-item exit, Backspace merge or explicit table Tab navigation in the Board adapter. | Open: lists/tables still behave like separate form fields. |
| High | Only the active item/cell mounts its own editor. Switching fields loses that editor's local text history; Board snapshot history is separate (`board-text-block.tsx`, `use-board-objects.ts`). | Open: structural editing and text history need one coherent design. |
| Medium | Rendering calculated the byte size of every object and passed an unused `maximumBytes` prop (`board-canvas.tsx`, `board-object-card.tsx`). | Removed. Snapshot validation remains. No performance claim without profiling. |
| Medium | The wheel handler yields to scrollable object bodies even outside editing (`use-board-camera.ts`). Canvas navigation can therefore change under the pointer. | Open: define one predictable pan/zoom/inner-scroll policy before changing it. |

Paths above are under `resources/js/components/boards/` unless otherwise indicated. Lists/tables use array indexes rather than stable field identities. The deletion remount is a targeted fix, not a replacement editing architecture. Existing full-snapshot validation still traverses and serializes object data on changes; profile before changing that safety boundary.

## Implemented

- Always-visible, keyboard-focusable Back beside the Board title. Existing guarded `stepHistory(-1)` handles prior app locations. Direct entry falls back through guarded `openLocation()` to the parent folder or workspace root. A blocked history navigation never falls through to another destination.
- A named indexed-field replacement handler remounts the surviving editor only after a successful validated list-item/table-row/table-column removal. Read-only/rejected changes do not advance focus or the editor revision.
- Removed the unused render-time total-byte calculation and card prop. Per-block and aggregate limits still run through `validBoardObjects()`.
- Updated the current feature contract and review handoff. All five changed source files remain below 500 lines.

## Recommended next focused correction

Rework List and Table editing around one block-owned session, preserving native Board JSON and existing save/ownership rules. Specify Enter/Shift+Enter, item split/merge, indent/outdent, cell Tab/Shift+Tab and selection behavior together with text/structure undo. Keep double-click for editing and explicit tools for creation, as requested. Make selected-object controls predictable before another styling pass. Then manually review a small representative Board containing text, a list, a table, code and media at ordinary zoom before expanding the treatment.

That rebuild and the scroll-policy change are not implemented in this investigation. The current blocks should not be considered accepted merely because static checks pass.

## Commits

No commits created. Existing unrelated work remains uncommitted.

Suggested messages:

- `fix(boards): restore guarded back navigation`
- `fix(boards): remount indexed editors after field deletion`
- `perf(boards): remove unused render-time byte calculation`

## Migrations / persistent format changes

None. No backend, dependency or API changes.

## Validation

- Targeted `vp fmt`: passed on all five changed source files.
- `npm run types:check`: passed (`tsc --noEmit`).
- `npm run lint`: passed; 620 files formatted, 520 files without lint warnings/errors.
- `npm run build`: passed in 12.82 seconds. Existing mixed static/dynamic import warnings remain for document-image-crop-dialog, database-property-header and document-editor-loader; large-chunk and plugin-timing notices remain.
- `git diff --check`: passed. Much of Boards is still untracked in the existing worktree; the source formatter/linter covers those source files.
- No automated tests written or run, per user instruction. PHP/migration checks do not apply to these frontend-only fixes.

## Manual validation for the user

Use a disposable Board for deletion and undo checks. These checks remain pending.

1. Open a Board from a workspace/folder. Click the top-left **Back**. Expected: return to the previous application location and restore ordinary surrounding navigation.
2. Open a nested Board URL in a fresh browser tab with no previous app history; click Back. Expected: its parent folder opens. Repeat for a root Board: its workspace opens.
3. While an upload or a hosted Document save is pending, try Back. Expected: existing leave protection blocks navigation; the active content stays mounted. After Saved, Back succeeds. If needed, temporarily use browser network throttling to keep the pending state observable, then restore normal networking.
4. Create a list with distinct items Alpha, Beta, Gamma. Double-click Alpha, remove the first item, then type into the focused survivor. Expected: Beta's content remains and receives the edit; Alpha does not reappear. Wait for Saved and reload: the same items remain.
5. Create a table with different first/second row values. Edit a first-row cell, remove that row, and type into the newly active cell. Expected: the surviving row's content receives the edit without resurrecting removed content. Save/reload and confirm.
6. Repeat with distinct first/second column values: edit the first column, remove it, type into the newly active cell. Expected: surviving cells retain their own content through Saved/reload.
7. Exit field editing and use the Board's Undo/Redo buttons after each structural deletion. Expected: the full object snapshot restores/removes the intended item/row/column. Local text history across separate fields remains a known limitation.
8. Reopen the Board. Expected: full-screen is still the default and Back remains visible. Double-click empty canvas: nothing is created. Double-click an existing text block: editing opens. Explicit creation tools still insert blocks.
9. Check the unresolved behavior deliberately: Enter inside a list item currently inserts a line break; moving between table cells requires clicking. Wheel over an overflowing object can scroll its content instead of panning. These are outstanding issues to address, not passing acceptance criteria for the final block UX.

## Stop gate

Remain in phase-4 manual review. Do not start Mind Maps or another phase.
