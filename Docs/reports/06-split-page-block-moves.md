# Split-screen block moves

The later [media retention and linked history report](06-split-media-retention-and-linked-history.md)
supersedes this report's independent-undo limitation and extends prepared-preview
reuse to loaded PDF/video/audio players.

## Scope and implementation

Focused extension of the current Markdown editor block interaction, requested
by the user. No migration phase advancement.

- The existing grip moves a complete top-level block between two different
  Markdown Live Preview pages in the same workspace.
- A shared host-window registry connects retained editors and same-origin iframe
  editors. Each destination resolves its own DOM and CodeMirror geometry in its
  owning window. The preview and insertion line render above both panes.
- Wheel and edge scrolling follow the pane under the captured pointer. Listener
  and registry cleanup follows drag cancellation and editor destruction.
- Source and destination editability, visibility, workspace and document identity
  are checked. The destination source-size and line-size limits are checked before
  insertion, and the original is removed only after insertion succeeds.
- Complete Markdown source carries presentation wrappers, list nesting, media
  IDs and mentions without conversion or re-uploading workspace Library files.
- The ordinary same-page reorder path retains its existing move transaction.

## Persistence and commits

No API, migration, dependency or persistent-format changes. No commit created.

Suggested commit: `feat(editor): move blocks between split-screen pages`

## Validation

Automated tests were neither written nor run, per the user's instructions.
Manual browser acceptance remains pending. Final checks:

- Targeted formatting passed for all five changed TypeScript files.
- `npm run types:check`: passed (exit 0).
- `npm run lint`: passed (exit 0); 551 files formatted correctly, no warnings or
  lint errors in 457 files.
- `npm run build`: passed (exit 0), 14.76 seconds. Existing warnings remain for
  large chunks, mixed static/dynamic imports and plugin timing diagnostics.
- `git diff --check`: passed (exit 0).

No PHP files changed, so PHP checks were not needed. All modified/new source
files remain under 500 lines.

## Manual test checklist

Use two disposable Markdown pages A and B in the same workspace, both in Live
Preview. Give A three separated paragraphs and give B two paragraphs.

1. Open A and B in split screen. Drag A's middle paragraph by its grip into the
   gap between B's paragraphs and release at the insertion line. Expected: it
   disappears from A and appears exactly once at the indicated boundary in B;
   no block menu opens after release. Repeat from B to A.
2. Drop above the first and after the last block of B. Repeat with an empty B,
   including moving A's only block. Expected: the block occupies the indicated
   boundary, an empty destination has no unwanted blank prefix, and an emptied
   source stays editable. Repeat several times; separators must not accumulate.
3. Move a nested list, quote/callout, code block, table, image, file, video/PDF,
   Mermaid block and a block with custom alignment/direction/style. Expected:
   complete top-level blocks move, nested content remains intact, media still
   opens, mentions still navigate, and presentation metadata is preserved.
4. Make B long. While dragging from A, wheel-scroll over B, then hold near B's
   top and bottom edges. Expected: B scrolls and its insertion line updates;
   A does not scroll instead. Return to A while holding the grip; expected:
   scrolling and same-page reorder work there too. Repeat at 80% and 125% zoom.
5. Drag across the divider and cancel with Escape; then release another drag
   over a title, toolbar or outside both editors. Expected: neither page changes,
   and preview, indicator, dimming and scrolling stop. A subsequent grip click
   and ordinary wheel scrolling must work normally.
6. Try Source mode, a legacy JSON page, another workspace, and another view of
   the same page as destinations. Expected: no insertion line or transfer into
   those destinations. Hidden tabs must not accept drops. Switch away from the
   source during a drag; expected: cleanup and no stale drop afterward.
7. Wait until both pages show Saved, then reload both. Expected: the moved block
   exists in B and no longer in A, including its media and mention references.
8. Move another block. Focus B and undo once; expected: the inserted block is
   removed. Focus A and undo once; expected: the original returns. Redo in both
   pages; expected: the move is reproduced. Each page has independent history.
9. Try transferring a block into a page already near its source-size limit.
   Expected: an over-limit destination shows a notice in the source and the
   original remains intact. If a save fails for another reason, expected: that
   page retains its unsaved content and shows its existing save error.
10. Reorder within one page, use keyboard/menu moves, drag ordinary selected text
    and upload a local image/file. Expected: existing interactions still work.

## Limitations and stop gate

Single top-level blocks only. Markdown Live Preview pages in the same workspace
only. Source mode, legacy editor pages and cross-workspace reference migration
are outside this change. Undo histories and autosaves are independent: the two
saves are not atomic, so a failed save must be resolved before leaving/reloading.
No browser/device acceptance is claimed. Await the user's manual review.

## Follow-up: match same-document move animation

The user requested the same motion when moving between documents. Transfer
insertion/removal now use the existing block-motion plugin in each page, with
its existing easing, timing, snapshots, reduced-motion behavior and cleanup.
The source block shrinks/fades out over 80 ms; neighboring blocks slide for
140 ms after the exit interval; the destination block scales/fades in for 100 ms
after the slide interval. Destination capture excludes outgoing rows because
insertion must not animate an existing destination block away.

The edits remain synchronous and retain independent undo/autosave. No API,
dependency or persistent-format changes. No commit created.

Suggested follow-up commit: `feat(editor): animate block moves between split pages`

### Manual follow-up checklist

1. Split two Markdown Live Preview pages with three paragraphs each. Reorder a
   paragraph within one page, then move it between pages in both directions.
   Expected: the same exit shrink/fade, neighboring-row slide and grouped
   entrance pop occur, with no bounce or blanking of the whole editor.
2. Move a nested list, code block, table, image, Mermaid and styled/RTL block.
   Expected: each complete block animates with its presentation intact; the
   destination's existing blocks remain visible and slide when displaced.
3. Move into an empty page, then move the only block out of a page. Expected:
   the entrance/exit still animates and the empty page remains editable.
4. After wheel/edge scrolling, drop a block between pages. Expected: motion is
   clipped to each pane, lands at the insertion line and leaves no temporary
   copies or invisible rows. Quickly click/edit during playback; expected:
   animation cleans up and editing works immediately.
5. Enable OS reduced motion and repeat a move. Expected: both pages update
   immediately without shrinking, sliding, fading or lingering hidden rows.
6. Wait for both pages to show Saved and reload. Expected: the final block
   placement persists. Undo once in each page to reverse another move; expected:
   content restores using the existing independent histories.

Browser verification remains pending. No automated tests written or run.

### Follow-up validation results

- Targeted formatting: passed for both changed TypeScript files.
- `npm run types:check`: passed (exit 0).
- `npm run lint`: passed (exit 0); 551 files formatted, no warnings or lint
  errors in 457 files.
- `npm run build`: passed (exit 0), 16.12 seconds. Existing large-chunk,
  mixed-import and plugin-timing warnings remain.
- `git diff --check`: passed (exit 0).

No PHP changes; no PHP checks needed. Await manual review.

## Follow-up: retain prepared rendering

The user requested that moved blocks stay rendered. Each page previously had
independent math and Mermaid preview caches; copying only Markdown could replace
the destination preview with “Rendering…” while repeating preparation.

Moves now collect prepared previews for rich blocks within the moved source
range, including inline equations, and populate the destination caches before
insertion. Only sanitized Mermaid output, prepared math output and attachment
metadata are copied. Subscriptions, controllers, document IDs and save state
remain local. A pending Mermaid cache lookup does not overwrite a preview
supplied by the move. The existing exit/slide/entrance animation remains.

No migration, content-format, API or dependency changes. No commit created.

Suggested commit: `fix(editor): preserve rendered previews across split-page moves`

### Manual rendering checklist

1. In page A, create a valid Mermaid diagram and wait until its preview appears.
   Move it to page B in split screen, then back. Expected: the rendered diagram
   appears as the destination entrance animation begins, without “Rendering
   diagram…” or a second render delay. Diagram controls still work.
2. Repeat with display math and a paragraph containing inline math. Expected:
   rendered equations survive the move without “Rendering equation…”; inline
   equations stay inline. Edit and preview afterward; expected: normal editing.
3. Repeat steps 1–2 with an empty destination, OS reduced motion, and after
   wheel/edge scrolling. Expected: prepared previews remain available and no
   invisible rows, stale copies or loading placeholders remain after the move.
4. Move an image/file/PDF/video block after its metadata loads. Expected: file
   name/type/size remain correct and document-local controls work after moving.
5. Move a block before it finishes rendering. Expected: its normal pending/error
   behavior continues; an unavailable preview is not claimed as prepared.
6. Undo in both pages, redo, wait for Saved and reload. Expected: content and
   previews remain correct; same-page moves and new diagram/math creation work.

Browser verification pending. Automated tests were neither written nor run.

### Rendering follow-up validation

- Targeted TypeScript formatting: passed.
- `npm run types:check`: passed (exit 0).
- `npm run lint`: passed (exit 0); 552 files formatted, no warnings or lint
  errors in 458 files.
- `npm run build`: passed (exit 0), 14.84 seconds; existing mixed-import,
  chunk-size and plugin-timing warnings remain.
- `git diff --check`: passed (exit 0).

No PHP changes. Source files changed in this follow-up remain under 500 lines.
The unrelated existing edit to `split-pane-scroll.ts` was left intact.
