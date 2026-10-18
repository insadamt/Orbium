# Phase 5 review — split pane bottom-edge scrolling

Superseded after manual rejection by [natural split document scrolling](05-natural-split-document-scrolling.md). The implementation and validation below describe an earlier attempt.

Date: 2026-10-17.

## Problem and change

The latest screenshot shows a hard bottom boundary on the right embedded page while the left retained document continues lower. Framed panes reserved 64px of bottom padding; native document panes reserved 16px. The pane gaps were padding on the scroll container rather than separate scrolling content, leaving different geometry at the viewport edges.

Both pane paths now use a vertical flex layout with non-shrinking generated top/bottom spacers. The existing responsive top gap scrolls with the page, and both sides use a 16px ending gap. Embedded frames do not flex-shrink. Their height is calculated from the greater of the main element's layout height and scroll height, covering overflowing content without animation-transformed screen measurements. Hidden panes remain hidden explicitly.

The previous embedded root-scroll forwarding remains in place. Independent pane scrolling, nested PDF/Source scrolling, retained editors, and the top-alignment correction remain. No dependencies, migrations, or persisted-format changes. No commit created. Unrelated editor changes were left intact.

## Validation

- `npm run types:check`: PASS.
- `npm run lint`: PASS, including repository formatting and lint checks.
- `npm run build`: PASS (20.80 seconds), with large-chunk, ineffective dynamic-import, and plugin-timing warnings.
- `git diff --check`: PASS.
- No automated tests were written or run. Manual browser acceptance remains pending.

## Manual checklist

1. Hard-refresh. Recreate the pictured split and scroll the right pane over ordinary page content. Expected: content passes through the viewport's lower edge without a stationary 64px inset cutoff.
2. Continue to the bottom of each document. Expected: the final block and complete rounded bottom of each document surface are reachable, followed by the same 16px ending gap. Different-length documents finish at different scroll positions.
3. Scroll back to the top. Expected: both starting surfaces remain aligned; covers and titles can scroll beneath the navbar again.
4. Repeat after swapping the documents, reloading the saved split, and opening an unvisited document. Expected: both retained and framed paths have consistent viewport edges and reachable endings.
5. Load a tall image/PDF or add content near the end of an embedded page. Expected: the frame grows with the document, the last block remains reachable, and the iframe does not compress to the viewport.
6. Wheel over one pane and then over the gutter. Expected: one pane moves independently, or both move by equal pixel distances respectively. Nested PDF/Source controls keep their own scrolling.
7. Switch between split groups and ordinary tabs. Expected: inactive prepared panes stay hidden, no duplicate pages appear, and existing scroll positions are retained.
8. Resize across narrow-screen stacking, end/recreate the split, and repeat with reduced motion. Expected: no top or bottom clipping is introduced by resizing or motion.

Suggested commit: `fix(navigation): keep split page gaps inside scrolling content`

Remain in Phase 5 for manual review.
