Summary: Records the empty-block movement animation repair and manual acceptance steps; depends on rendered V3 row identities, shared GSAP snapshots and spacer input focus synchronization.

# Empty-block movement animation — 2026-11-01

The user reports that moving empty blocks does not trigger animation. This is a focused stage-6 review repair. Findings come from source inspection; runtime animation has not been verified.

## Changes and reasons

- Motion snapshots resolve spacer/empty-paragraph DOM markers against the owning editor's V3 index. Atomic blank widgets no longer rely exclusively on ambiguous DOM boundary offsets.
- Displaced V3 rows match by block ID and relative row offset. Source insertion/deletion mappings at adjacent empty boundaries no longer determine their identity. Legacy rows retain source-offset matching.
- V3 motion ranges exclude their end boundary, which belongs to the next block. The next blank row can therefore receive displacement motion instead of being included in the moved block's outgoing/incoming snapshots.
- When native focus enters a spacer whose logical caret is already inside that block, it updates handle-selection effects without replacing the caret. Previously the new range could trigger the motion plugin's selection-change cancellation immediately after movement. Focusing from another block still publishes the full block selection.

Changes are limited to the shared motion/snapshot modules and spacer input focus. Existing motion timing, reduced-motion handling and ordinary typing/Enter suppression remain. No saved format, backend, dependency or migration changes. Prior working-tree changes were preserved; no commit was created.

## Checks actually run

- Changed-file formatting/lint: passed for all three TypeScript files.
- `npm run types:check`: passed.
- `npm run build`: passed with mixed static/dynamic import, large-chunk and plugin-timing warnings.
- `npm run lint`: failed on the same 16 unrelated formatting files recorded in the previous empty-block handle report. No unrelated formatting changes were made.
- `git diff --check`: passed.
- No automated tests, Playwright or other browser automation were written or run. PHP checks were not applicable to these frontend-only changes. Visual correctness remains pending the manual checklist below.

## Manual test checklist

Reload the updated application. Use a disposable V3 Document with visible text blocks labeled A, B and C. Keep reduced motion disabled for the first five checks.

- [ ] **Spacer movement:** Create spacers with repeated Enter between A and B. Use a spacer's six-dot menu to Move up/down across a text block. Expect displaced text to slide smoothly into its new position, without snapping or blinking. Repeat in both directions.
- [ ] **Empty paragraph:** Insert an empty Paragraph using the plus control and move it across B using its menu. Expect neighboring content to animate while the empty row keeps its normal height. Directly type in the moved row; expect writing at its new location.
- [ ] **Keyboard and drag:** Select a spacer's handle and use Alt+Shift+Up/Down, then drag it across a visible text block. Expect the accepted reorder to animate and preserve A/B/C text. Test an empty paragraph the same way. Platform-reserved shortcuts may be intercepted by the operating system.
- [ ] **Adjacent blanks and range selection:** Move a spacer next to another spacer, then select a range containing text and empty blocks and move it. Expect only the chosen range to relocate; the next sibling must not blink as part of the moved range. Swapping visually identical blank rows can have no visible difference; use neighboring text to assess displacement.
- [ ] **History and columns:** Undo and redo these moves. Repeat within a column and move a blank child between columns. Expect correct order, retained blank rows and no stranded invisible content. Save and reload; expect the final order to persist. Column and cross-scope runtime behavior remain unverified until this check is performed.
- [ ] **Editing regression:** Click the moved spacer and type, paste plain text, then press Enter. Expect normal writing and new-row behavior without document-wide move fades. Click a different spacer directly; expect that spacer to receive the caret.
- [ ] **Reduced motion:** Enable the operating system's reduced-motion preference and repeat movement. Expect immediate reordering with no animation or lingering hidden rows.

## Commit message suggestions

- `fix(editor): preserve animation when moving empty blocks`
- `fix(editor): track blank motion rows by block identity`

Remain in stage-6 manual review; no later stage was started.
