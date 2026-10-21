# Board stress scene — manual review

Completed 2026-10-21 within the existing Board phase-4 performance review.

## Delivered

- `php artisan boards:stress <workspace> --count=500 --kind=mixed --layout=spread`
  creates a new disposable root-level Board. Options support 1–1,000 objects,
  mixed/plain content and spread/dense layouts. It is local-only.
- The generator uses normal hierarchy creation, shape validation and Board saving
  inside one transaction. It does not overwrite existing Boards, alter limits,
  upload files, or create linked Documents.
- Reproducible content/geometry: ten columns, 640 × 600 spacing for spread and
  180 × 140 for the deliberately overlapping dense scene, starting at (80, 80).
- Created local Board **154** in workspace **1**:
  [Open stress Board](http://localhost:8000/workspaces/1/boards/154).
  Readback confirmed format 4, revision 1 and exactly 1,000 saved objects:
  200 text; 100 each of heading, list, quote, callout, code, table, math and Mermaid.
  Tables have eight rows/four columns; checklists have five items; Mermaid has
  eight nodes. No performance or thermal improvement is inferred from creation.

## Checks

- Pint formatting on both new PHP files: passed.
- PHP syntax on both new PHP files: passed.
- Focused PHPStan on both new PHP files: passed, zero errors.
- Artisan command registration/help: passed.
- Actual fixture creation through application validation/save: succeeded.
- Read-only persisted counts/revision inspection: confirmed the totals above.
- Whitespace check: passed.
- No automated tests written or run. Frontend code/assets are unchanged by this
  task; frontend checks/build were not repeated. Browser acceptance remains manual.

## Exact manual checklist

1. Open the link while signed in. Start at 100% zoom near the top left.
   Expect a numbered grid; pan horizontally to find lists, code, tables, diagrams
   and formulas. Rich content should settle without blocking canvas controls.
2. Pan down several rows, then return immediately; repeat after travelling much
   farther away. Expect readable content on return, stable positions and no stale
   render appearing inside a different block. Record any delay or CPU spike.
3. Zoom 100% → 50% → 100% → 200% → 100%.
   Expect sharp settled text, controls aligned with blocks, and responsive panning.
4. Double-click the first text block, type a sentence, finish editing, undo/redo,
   wait for Saved and reload. Expect the chosen final state to persist, with other
   blocks intact. Side-resize and drag it; expect the border to follow correctly.
5. Edit a table cell, insert a row, finish editing and reload after Saved.
   Expect the cell/row changes to persist and normal table controls to work.
6. Try adding/duplicating at 1,000 objects. Expect the normal object-limit guard.
   Delete one block and wait for Saved before testing a single insertion; undo
   the insertion/deletion if you want to restore the original scene.
7. For a smaller text-only comparison, run
   `php artisan boards:stress 1 --count=100 --kind=plain --layout=spread`.
   Expect a separate Board URL with 100 short paragraphs. For a dense workload,
   use `--layout=dense` and label its measurements separately.
8. Remove disposable Boards through the normal Trash action when finished.
   Expect existing workspace content to remain intact. Media/linked Document
   behavior requires its own scene with real uploads/targets.

## Commit suggestion

`chore(boards): add repeatable local stress scene generator`
