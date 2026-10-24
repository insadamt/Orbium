# Boards phase 4 — Remove the 1,000-block cap

## Implemented

Removed the fixed Board object-count limit at the user's explicit request.
Frontend insertion, duplication, clipboard validation, snapshot reads and recovery
no longer reject Boards above 1,000 blocks. Backend full-save and incremental
create/update/delete validation, resulting-object validation and sibling Document
creation no longer enforce that cap. The local `boards:stress` command accepts
counts above 1,000 and no longer displays the obsolete limit message.

Existing data-size budgets (256 KiB per block, 4 MiB aggregate), block-content
limits, identity/geometry/layer checks, ownership and revision guards remain.
Renderer/PDF cache budgets still bound cached surfaces independently of Board
object count. Larger Boards have not been profiled or manually accepted.

## Persistence / commits

No migration or spatial-format change. Older clients still enforce their old
count cap; use the updated frontend and backend together. Existing unrelated
Instant Scene/PDF and page-insertion work was preserved. No commit created.

Suggested commit: `fix(boards): remove the 1000-block count cap`

## Actual checks

- Frontend formatting: passed for all three changed TypeScript files.
- `npm run types:check`: passed.
- `npm run lint`: passed; 699 files formatted, no lint warnings/errors in 590 files.
- `npm run build`: passed; existing chunk-size, mixed import and plugin-timing
  warnings remain.
- `./vendor/bin/pint --test`: passed.
- PHP syntax checks: passed for BoardContent, BoardSaveRules,
  BoardContentController, ApplyBoardMutation, CreateBoardDocument and
  CreateBoardStressScene.
- `git diff --check`: passed.
- Source search found no remaining `MAX_OBJECTS`, `boardLimits.objects` or old
  count-limit errors in application/Board frontend code.
- No automated tests or browser automation were written or run.

## Manual test checklist

1. In the local environment, run
   `php artisan boards:stress <workspace-id> --count=1001 --kind=plain`.
   Expected: a disposable Board is created with 1,001 blocks and an opening URL;
   no count-limit error or obsolete limit warning appears.
2. Open that Board, add a Text block and wait for Saved. Reload.
   Expected: the new block persists above the old threshold, with no unsupported
   snapshot error.
3. Duplicate several selected blocks, then copy/paste them on the same Board.
   Expected: both operations add blocks and save successfully above 1,000.
4. Add an existing Document through Add or `@` → Inline Document, then create a
   new sibling Document through Add. Expected: both cards are added and persist;
   creation leaves exactly one new original Document beside the Board.
5. On the disposable scene, select all blocks with the canvas focused and delete.
   Wait for Saved and reload. Expected: deletion of more than 1,000 objects succeeds
   and the Board is empty. Undo before reloading in a separate run: expected all
   deleted objects return and can be saved again.
6. Open an ordinary smaller Board; add, edit, duplicate, delete and undo/redo a
   block. Expected: existing editing/history/save behavior remains intact.
7. Trash the disposable stress Board when finished. Expected: ordinary Trash
   behavior applies; referenced original Documents remain separate.

Manual acceptance remains pending within phase 4. No later phase was started.
