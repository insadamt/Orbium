# Editor review — Integrated border handles and table drag motion

Date: 2026-10-14. Follow-up to the table border handles review.

## Changes

Handles are now muted 12-by-2-pixel border marks, with no visible button background. Their larger transparent hit areas remain available for dragging, clicking and keyboard focus. Hover and open-menu states increase contrast; keyboard focus retains an outline. The mark rotates vertically for row handles.

Dragging now lifts a clipped snapshot of the complete row or column. It follows the pointer along its movement axis while neighboring cells slide aside over 160 ms to open the destination gap. On release, the preview settles into the gap over 180 ms, then the existing source mutation commits the reorder. Returning to the original position settles back without writing. The move actions in row/column menus use the same animation. Reduced motion keeps direct pointer feedback and applies positions immediately without tweened movement.

The snapshot retains column widths, cell formatting, theme variables, text direction and interface scale. It is inert, hidden from assistive technology, stripped of editing controls and clipped to the originating table and pane viewport. Snapshot IDs and internal references are remapped. Destination detection uses original cell positions, so animated neighbors do not cause the target to oscillate.

Escape, actual scrolling of the table's ancestors, resize, window blur, new pointer input, reduced-motion changes and widget cleanup remove the snapshot and restore original live cell styles. Scroll events from another pane or queued events with unchanged offsets do not interrupt the motion. Existing undo/redo, autosave, row actions and merged/read-only constraints remain in place.

Updated the editor specification. No dependencies, migrations or persistent-format changes. No commit created. All new or changed source files remain under 500 lines.

## Validation

- Targeted formatting and lint: passed.
- `npm run lint`: passed; 438 checked files formatted correctly, 357 files linted without warnings or errors.
- `npm run types:check`: passed.
- `npm run build`: passed in 9.43 seconds. Existing large-chunk and mixed static/dynamic import warnings remain.
- `git diff --check`: passed.
- No automated tests written or run, as instructed. Browser visuals and pointer interaction remain pending manual acceptance.

## Manual test checklist

1. Reload a Markdown table in Live Preview and hover it in light and dark themes. Expected: short muted marks sit directly along the column top and row leading borders, with no filled button backgrounds. Hover a mark and Tab to one. Expected: contrast increases and keyboard focus remains clear; clicking still opens its options.
2. Drag the middle column slowly left and right. Expected: its header and all body cells lift together as one preview, following horizontal pointer movement. The source becomes faint and neighboring columns slide aside smoothly to leave a gap. Pause near a destination boundary. Expected: the target remains stable.
3. Release over a different column. Expected: the preview settles into the gap, then the new column order persists without an extra menu opening. Repeat with rows vertically. Expected: each whole row moves together and neighbors slide up/down.
4. Drag out and return to the original position before release. Expected: the preview returns and the order stays unchanged. Repeat with Escape, scrolling the table or document, resizing and switching focus to another window. Expected: previews and temporary transforms disappear without changing the order.
5. Choose Move left/right from a column menu and Move up/down from a row menu. Expected: the selected row or column visibly travels to the adjacent position while neighbors move aside, then the new order commits.
6. Use unequal column widths, multiline rows and formatted cells. Repeat in RTL, a narrow split pane, and a non-default interface scale. Expected: preview content, dimensions and direction match the live table; movement stays inside its originating visible pane, and surviving cells retain their formatting and widths.
7. Repeat several moves and cancellations, then edit cells and use insert/delete actions. Expected: no lingering opacity or transform styles, no orphan previews, and all controls remain usable. Undo/redo a completed move, wait for Saved and reload. Expected: order and cell content persist correctly.
8. Enable reduced motion, then drag and use menu movement. Expected: pointer feedback and reordering remain functional, with immediate neighbor positioning and no pickup or settle tween. Toggle reduced motion during a drag. Expected: it cancels cleanly.
9. Open a merged table and a read-only document if available. Expected: structural controls remain disabled and no drag preview is created. Open fullscreen preview. Expected: the editing handles remain absent.

## Known limits

This change applies to Markdown Live Preview table blocks. Automatic scrolling at a drag viewport edge remains outside the existing behavior.

## Suggested commit

`feat(editor): refine table handles and animate row and column moves`

Remain in the current editor review; do not start another phase without explicit approval.
