# Phase 5 review — scroll the whole embedded split page

Superseded after manual rejection by [natural split document scrolling](05-natural-split-document-scrolling.md). The implementation and validation below describe an earlier attempt.

Date: 2026-10-17.

## Problem and change

The user's screenshot shows the left document moving underneath the navbar while the right document is clipped at its initial top edge. The embedded rendering path permits the iframe window to scroll independently of the host pane. Its wheel ownership check could also treat the embedded document root/body as nested content and leave wheel handling inside the iframe. Focus and editor reveal can scroll that window without a wheel event.

The wheel ownership check now skips document roots and bodies. Embedded page root scrolling is transferred to the outer pane, then reset inside the frame. Ordinary document content therefore moves with the entire page surface. Actual nested scroll controls retain the existing wheel ownership and containment behavior. The embedded Statistics action remains outside normal flow, preserving the previous top-alignment correction.

This is a focused correction within Phase 5. No dependency, migration, persistence format, or backend changes. No commit created. Unrelated in-progress editor/block-transfer changes were left intact.

## Validation

- `npm run types:check`: PASS.
- `npm run lint`: PASS after formatting the changed file; the first run flagged formatting in that file.
- `npm run build`: PASS (13.37 seconds), with large-chunk, ineffective dynamic-import, and plugin-timing warnings.
- `git diff --check`: PASS.
- No automated tests were written or run. Browser acceptance remains pending the user's manual review; the screenshot diagnosis and code inspection do not substitute for interaction testing.

## Manual checklist

1. Hard-refresh. Open two long documents, including a restored or previously unvisited tab using an embedded pane. Create a split. Scroll over ordinary text in each pane. Expected: that whole document moves, including its island, cover, title, and initial top gap; content can pass beneath the fixed navbar rather than clipping at the original page start.
2. Scroll over the gutter. Expected: both outer panes move together by equal pixel distances, until each reaches its own boundary. Scroll one pane alone afterward; the other remains still.
3. In the embedded document, click an editable block, move the caret downward through several screens, and use document search or an outline link to reveal distant content. Expected: revealing content moves the outer pane without leaving the document scrolling behind a stationary iframe top edge.
4. Scroll both panes back to their tops. Expected: their initial page surfaces and equivalent default headers align, with no extra Statistics toolbar row.
5. Scroll inside a PDF reader, Source editor, and a scrollable menu. Expected: each control retains its own scrolling and existing boundary containment; scrolling outside the control moves the entire document pane.
6. Repeat after swapping left/right placement, reloading a saved split, and ending/recreating a split. Expected: no stuck pane or double scrolling; ending a split retains the selected document's outer scroll position through the existing navigation behavior.
7. Repeat with a document/database split and reduced motion. Expected: the outer page scrolls naturally and existing split placement still works.

Suggested commit: `fix(navigation): forward embedded page scrolling to split panes`

Remain in Phase 5 for manual review.
