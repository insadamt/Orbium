# Explorer menu layout stability

Date: 2026-10-14. Phase 5 explorer review; no phase advancement.

## Implemented

- Measure card layout positions relative to the explorer container rather than the viewport. Scrolling between renders no longer looks like card rearrangement when opening right-click or three-dot menus.
- Convert container-relative positions back to viewport coordinates for fixed outgoing-card previews.
- Prevent menu entry, keyboard navigation, and Escape focus restoration from scrolling the page. Retain the focused menu action during unrelated rerenders.

## Validation

- `npm run types:check`: passed.
- `npm run lint`: passed; all 455 files correctly formatted, no warnings or lint errors in 372 files.
- `npm run build`: passed. Large-chunk and ineffective-dynamic-import warnings remain.
- `git diff --check`: passed.
- No automated tests written or run, per user instructions. Browser visual acceptance is pending manual testing.

## Manual checklist

1. Open a workspace or folder with enough pages to scroll. In Grid, scroll down, stop, and right-click a visible page. Expected: the menu opens at the pointer; cards stay in place and do not jump upward or replay rearrangement motion.
2. Dismiss the menu, scroll to another position, and click a page's three-dot button. Repeat opening and closing both menu types. Expected: stable cards and scroll position each time.
3. Repeat steps 1–2 in List, fixed-ratio Gallery, and natural Gallery. Expected: the same stable behavior in every layout, including near the bottom of the viewport.
4. Focus a visible page and press Shift+F10. Use ArrowUp/ArrowDown, Home, and End, then Escape. Expected: focus moves between menu actions and returns to the page without scrolling or moving cards.
5. On disposable pages, reorder by dragging and delete through the menu confirmation after scrolling. Expected: actual rearrangements still animate; the outgoing deletion preview starts at the visible card position and surviving cards close the gap.
6. Enable reduced motion and repeat menu opening and rearrangement. Expected: menus stay stable and actual layout changes apply immediately.

## Commits and compatibility

No commits created. No migrations, persistent formats, or dependencies changed.

Suggested commit: `fix(explorer): prevent menu-triggered layout animation after scrolling`
