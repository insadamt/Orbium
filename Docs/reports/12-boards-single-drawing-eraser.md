# Board phase 4 review — Keep erased ink in one block

Date: 2026-10-24. User clarification: erasing through a drawing must not divide it
into separate selectable blocks. This correction supersedes separate survivors
in `12-boards-partial-eraser.md`. Remain in Board phase-4 manual review.

## Result

Partial erasing now replaces the original drawing's path data with disconnected
subpaths inside the same object. Its UUID, selection frame, position, view box,
scale, color, width, opacity and layer stay unchanged. Selecting/moving/resizing,
duplicating, copying/pasting or deleting it operates on all its surviving ink.
Repeated erasing retains old gaps; the final visible ink being erased removes
the drawing. Undo/Redo still operates once per eraser drag. Preview cancellation
restores the complete original compound path, including existing gaps.

`BoardDrawing.breaks` stores indices of subpath starts in the flat point array.
It is omitted for continuous ink and validated as strictly increasing positive
integer indices below the point count. Rendering joins independently generated
subpaths inside one SVG path, preserving round dots and avoiding any connecting
line across erased space. The eraser reads all subpaths before clipping and never
creates new block UUIDs for surviving ink.

Clipping, frame-scheduled previews, size presets and cursor behavior remain as
established in the partial-eraser report. Total surviving points in one object
remain limited to 6,000, with at most 5,999 breaks. The preview cancels an oversized
single-object result or an aggregate above 120,000 points; normal byte limits
also validate the final commit atomically.

## Compatibility and deployment

- Added `2026_10_24_000001_add_board_drawing_gaps.php`; spatial envelope/default
  becomes **6**. Existing object JSON, UUIDs, revisions and content versions remain.
- Full saves, PATCH mutations, sibling Document creation, recovery and snapshot
  serialization use envelope 6. Backend validators accept only envelope 6 writes.
- The reader explicitly upgrades supported format-5 snapshots and format-1–4
  recovery drafts. An older envelope carrying `breaks` is rejected. Unknown future
  formats are rejected. Older clients reject envelope 6 before interpreting gaps.
- PHP validation permits only the bounded optional break-index field in addition
  to the existing drawing schema and normalizes indices to integers. No raw SVG,
  null-separated points, masks or arbitrary nested drawing data are accepted.
- Downgrade refuses while any drawing has a `breaks` field, including drawings
  in Trash. No rollback was run. Existing migrations were not rewritten.
- Deploy the matching migration/backend/frontend together and reload open Boards.
- Existing blocks split by the preceding implementation have no source-group
  metadata and remain separate. No unrelated drawings are automatically merged.

Updated drawing geometry/session/rendering, frontend validation/types/envelopes,
server validators, migration, data-model/Board docs and handoff. No dependencies
added. All new/changed source files are below 500 lines. Unrelated existing working
changes were preserved. No commit was made.

## Actual checks

- Focused frontend formatting: passed.
- Focused PHP Pint formatting and formatting check: passed.
- PHP syntax on the four modified PHP sources and new migration: passed.
- `npm run types:check`: passed (exit 0).
- `npm run lint`: passed (exit 0); 717 files correctly formatted and no warnings/
  lint errors in 604 analyzed files.
- `npm run build`: passed (exit 0), 12.74 seconds. Existing large-chunk,
  ineffective-dynamic-import and plugin-timing warnings remain.
- Migration SQL inspected using `migrate --pretend --path=...`.
- Local migration applied: 14.63ms; `migrate:status --path=...` confirms batch 20 Ran.
  The sandbox initially blocked localhost access; the authorized database commands
  then succeeded outside the sandbox. No database rollback performed.
- `git diff --check`: passed.
- No automated tests written/run and no Playwright/browser automation used.
  Browser behavior, selection feel and runtime performance await manual review.

## Manual test checklist

Reload the frontend and open a disposable Board after the migration.

1. **Single block:** Draw one long Pen stroke. Erase across its middle with the
   16px eraser. Choose Select and click either surviving side. Expect one selection
   frame containing both parts. Drag it: both parts must move together and the gap
   must remain empty.
2. **Repeated cuts:** erase a second and third gap in that same drawing. Select
   and move it again. Expect all surviving pieces to remain one block, with no
   reconnection across old gaps and no new independently selectable survivors.
3. **Resize:** resize that drawing using a corner, then a side. Expect all pieces
   and gaps to resize together with the original drawing scale behavior. Erase
   again at its transformed position and check grouping again.
4. **History:** erase multiple sections in one drag. Undo once: expect that whole
   drag restored while previous gaps stay. Redo once: expect the new gaps restored
   and the drawing still a single block. Start another erase and Escape before
   release: expect every previously saved gap and the original selection frame
   preserved without a new history step.
5. **Clipboard/duplicate:** Select the drawing with gaps, duplicate it, then copy/
   paste it. Expect each copy to be one independent block containing all its own
   pieces/gaps. Moving or deleting one copy must not affect the others.
6. **Save/reload:** wait for Saved and reload. Click either side of the erased gap:
   expect the same one-block behavior. Move it and save/reload again. Inspect a
   downloaded recovery snapshot if needed: expect one object for that drawing,
   envelope 6 and strictly increasing drawing.breaks indices.
7. **Style/size:** repeat with highlighter, colored ink and 8/32/64px erasers at
   different zoom levels. Expect original surviving color/thickness/opacity,
   consistent screen-sized cursor and one object per original stroke.
8. **Full erase/no-op:** erase all surviving ink in one drawing. Expect its block
   removed; Undo restores all pieces as one block. Erase only empty space or text:
   expect no drawing change or new history action.
9. **Older content:** open an existing Board containing ordinary drawings from
   before this change. Expect unchanged ink/positions and working new erasing.
   Previously split blocks stay separate; use one newly drawn stroke to validate
   the corrected behavior. If an older format-5 local draft is present, expect
   normal supported recovery rather than loss of the original draft.
10. **Compatibility boundaries (disposable Board):** manually submit an otherwise
    valid save with envelope 5, then envelope 6 drawing.breaks containing 0,
    duplicates, descending values or an index equal to points.length. Expect a
    validation rejection with no revision/content change. Restore a valid payload
    before continuing. Do not run rollback against real drawings merely to check
    the documented downgrade guard.

## Commit suggestions

- `fix(boards): preserve drawing identity after partial erasing`
- `feat(boards): store erased gaps inside a single drawing block`
