# Phase 5 review — normal document scrolling in splits

Rejected during manual review: this changed the required independent scrolling and broke TOC navigation. Superseded by [independent split scrolling and TOC](05-independent-split-scroll-and-toc.md).

Date: 2026-10-17.

## Problem and change

The user rejected the repeated top/bottom spacing patches and requested normal document scrolling without hardcoded split scrolling. The earlier attempts retained two different rendering paths and viewport-sized pane scrollers. Passing static checks did not demonstrate that those fixes worked visually.

Split documents now render through the same retained DocumentPage component as ordinary document tabs. Restored or unprepared document tabs fetch and mount that component rather than falling back to an iframe. Failed loading exposes Retry; failed drag preparation leaves the current layout intact and reports the failure.

The split is an ordinary content-height grid. The browser owns page scrolling, so both document columns move together. Removed the pane viewport height, overflow clipping, generated gap spacers, calculated negative workspace offset, pane scroll restoration, background wheel synchronization, and embedded root-scroll forwarding. Regular document island styles provide the page spacing and natural ending. Navigation records window scroll positions. Nested PDF readers, Source editors, and menus retain their own native scrolling.

Database views still use their existing iframe path and content-height measurement, with unconsumed wheel input forwarded to the browser page. Their starting gap uses the same responsive CSS variable as normal page islands. This repair does not port database views to retained native components. Documents have no iframe height measurement or scroll forwarding.

This supersedes the earlier independent-pane scrolling specification and the rejected edge corrections, following the user's request. No dependencies, backend changes, migrations, or persisted formats changed. No commit created. Unrelated in-progress editor/block-transfer edits were preserved.

## Validation

- `npm run types:check`: PASS.
- `npm run lint`: PASS, including formatting and lint checks.
- `npm run build`: PASS (16.84 seconds), with large-chunk, ineffective dynamic-import, and plugin-timing warnings.
- `git diff --check`: PASS.
- No automated tests were written or run. Browser interaction remains pending manual acceptance; no visual success is claimed from build checks.

## Manual checklist

1. Hard-refresh and open two long documents. Select A, drag inactive B to either split edge, and scroll over ordinary text on each side. Expected: the browser page scrolls both full document columns together, including covers, titles, and islands. There is no stationary top/bottom inset clipping the content.
2. Continue to the end of the longer document. Expected: every final block and the complete rounded document bottom are reachable. The shorter document ends naturally; it is not stretched to the longer document's height. Compare each document to its standalone presentation.
3. Return to the top and swap split placement. Expected: equivalent default headers start on the same line and remain aligned, without a second toolbar row.
4. Reload with the split persisted, including a document not yet visited this session. Expected: the document loads into the normal editor surface. DevTools Elements should show no document iframe named orbium-pane; database iframes remain allowed.
5. With network access temporarily unavailable, attempt an unprepared document split or reload an existing split. Expected: the new split does not replace the current layout on failed preparation; a restored missing document shows an error and Retry. Restore access and retry; the native document appears.
6. Scroll inside a PDF reader, Source editor, or menu. Expected: that control retains its local scrolling. Scroll over ordinary document content afterward; the browser page moves normally.
7. Edit both documents, switch active pane for shortcuts, exercise Undo/Redo, end/recreate the split, and save/reload. Expected: editor state and saved content remain correct; ending a split preserves ordinary page scrolling without resetting through a pane scroll offset.
8. Resize to stacked narrow-screen layout and repeat with reduced motion. Expected: the browser scroll reaches both full documents without nested viewport boxes.
9. Try a document/database split and switch between existing split groups and ordinary tabs. Expected: both surfaces remain available, database wheel input can move the outer page when not consumed by a nested control, and inactive panes remain hidden.

Suggested commit: `fix(navigation): use normal document flow for split scrolling`

Remain in Phase 5 for manual review.
