# Phase 5 review — independent split scrolling and TOC

Date: 2026-10-17; final verification completed 2026-10-18.

## Problem and change

The previous implementation incorrectly changed the requested behavior to shared browser scrolling. TOC navigation still selected the pane element as its owner, even though that element no longer scrolled. This was an implementation mistake, not an approved behavior change.

Independent native pane scroll containers are restored. A pane scrollport reaches the viewport edges using its measured workspace position; the normal shared page gap is a margin on its content, not padding on the scrollport. There are no document iframe height calculations or top/bottom gap patches. Documents keep the same retained editor component, including restored/unprepared tabs.

Wheel input over a document surface remains native to that pane. Wheel input over the gutter, outer background, or empty space outside the document surfaces moves both panes by equal pixel distances, with independent clamping at each boundary. Source editors, PDF readers, scrollable menus, and outline widgets preserve their own scrolling. Embedded database wheel input targets its containing pane again.

TOC navigation can again scroll the containing pane. Reading-position listeners capture scroll events from the current scroll owner rather than retaining the owner selected before splitting. Editor resize also refreshes the active heading. The floating rail resolves its pane dynamically as retained documents enter or leave a split. Navigation stores pane scroll positions and restores the selected document's position on merge.

No dependency, backend, migration, or persisted-format changes. No commit created. Unrelated ongoing editor, media, and block-transfer edits were preserved.

## Validation

- `npm run types:check`: PASS.
- `npm run lint`: PASS; 556 files correctly formatted and 462 files linted without warnings or errors on the final run. An earlier repository-wide run caught formatting changes in separate in-progress block-drag files; those findings are absent from the final run.
- `npm run build`: PASS (12.47 seconds), with large-chunk, ineffective dynamic-import, and plugin-timing warnings.
- `git diff --check`: PASS.
- No automated tests were written or run, as instructed. Browser/manual acceptance remains pending; these static checks do not verify pointer routing or TOC interaction visually.

## Manual checklist

1. Hard-refresh. Split two long documents containing several H1/H2 headings. Wheel over the left document surface. Expected: only the left document moves. Repeat over the right: only the right moves.
2. Wheel over the gutter, outer background, and empty space below a short document surface. Expected: both panes move by equal pixel distances, each stopping at its own boundary. No modifier is needed.
3. Move both panes to their tops, then to their bottoms. Expected: equivalent covers/title headers start aligned; whole surfaces move under the navbar; the last blocks and rounded page bottoms remain reachable without a fixed inset cutoff.
4. Open the left TOC and choose a distant heading. Expected: only the left pane navigates to it, and its reading marker follows. Repeat with the right TOC. Scrolling one pane must not change the other pane's reading marker.
5. Open a document standalone, use its TOC, split it without reloading, then use the TOC and scroll again. End the split and repeat standalone. Expected: heading navigation, reading-marker updates, and the floating rail keep working through every transition without remounting the editor.
6. Pin a TOC and scroll its heading list. Expected: that list scrolls without moving either document. Repeat with a PDF reader, Source editor, and scrollable menu: local controls preserve their own scrolling.
7. Scroll the panes to different positions, switch to another tab/split group, and return. End the split with each document selected in separate runs. Expected: each pane retains its position; the selected document returns to its standalone position.
8. Reload a saved split and repeat with a previously unvisited document. Expected: both documents use the native editor path, with independent scrolling and working TOCs. A failed load exposes Retry rather than creating a document iframe.
9. Repeat with reduced motion, narrow-screen stacking, and a document/database split. Expected: correct scroll routing and reachable content remain; TOC navigation moves its own document pane.

Suggested commit: `fix(navigation): restore independent split scrolling and TOC tracking`

Remain in Phase 5 for manual review.
