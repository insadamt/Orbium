# Phase 5 review — cursor-directed split scrolling

Date: 2026-10-09. Replaces the earlier split-scrolling/Guide proposal following the user's manual review. Phase 5 remains active.

## Changes

- Removed Settings → Guide, its authenticated route, and its page component.
- Removed Alt + wheel synchronization. Modifier-free scrolling over either pane moves that pane only; wheel input outside the panes moves both by the same distance.
- The split scroll areas begin at the top of the viewport in normal layout. The standalone top spacing is inside each pane's scrolling content, so the page island moves upward beneath the navbar rather than being clipped at its original top position. No fixed positioning is added to the pages.
- Existing GSAP split movement and transform-only popup animations remain. Natural document height, retained editors, and embedded content sizing are preserved.
- Native document and nested editor scrolling remain native. Same-origin iframe documents route wheel movement to their containing pane when their nested content cannot consume it. Embedded listeners refresh after iframe loads.
- Background/gutter wheel handling ignores Ctrl/Command zoom, consumed events, and scrollable menus. Each page clamps separately at its own boundaries.

## Library choice

Reviewed [GSAP Observer](https://gsap.com/docs/v3/Plugins/Observer/) and [native CSS overflow](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overflow). Observer's unified/debounced gesture API is broader than cursor routing requires. Native scroll areas plus scoped wheel handlers preserve editor/browser behavior without another dependency. Existing GSAP continues to handle animations.

## Validation

- Targeted Vite+ formatting: passed.
- `npm run types:check`: passed.
- `npm run lint`: passed; 362 files formatted, 296 files without lint warnings/errors.
- `./vendor/bin/pint --test routes/settings.php`: passed.
- Production build: passed; existing large-chunk and ineffective dynamic-import warnings remain.
- `git diff --check`: passed.
- No automated tests or visual/browser tests were written or run, per the user's instructions. Manual acceptance remains pending.

## Manual checklist

1. Split two long documents. Wheel over the left page: only the left page moves. Repeat over the right page.
2. Continue scrolling each page: its title/cover/top edge moves upward underneath the navbar instead of remaining pinned below it. Scroll back up: the standalone-style initial gap returns.
3. Wheel over the gutter and the outer left/right background margins: both pages move by the same amount without pressing a key.
4. Hold Alt while wheeling over one page: only that page moves, just as without Alt.
5. Put one page at an endpoint and wheel over the gutter: the other page continues while the first stops at its boundary.
6. Repeat with a database/document split and two databases. Navigate inside an embedded page and repeat scrolling: the behavior survives navigation.
7. Wheel inside a Markdown source editor or a scrollable menu: its local scrolling works; the other page stays still. Ctrl/Command + wheel still permits browser zoom.
8. Select a scrolled document and choose End split: the selected page returns centered near its scroll position. Reopen a split; check smooth movement and consistent frosted surfaces. Repeat with reduced motion.
9. Open Settings and verify Guide is absent. Open /settings/guide directly: the removed route no longer serves a Guide page.
10. Resize the window and check the navbar/content spacing. On narrow screens panes remain stacked; use touch, keyboard, or the outer scrollbar to reach the second pane, then check independent pane scrolling. Background wheel input intentionally scrolls the panes rather than the outer page.

## Limitations

Background synchronization uses equal pixel movement rather than equal progress through different-length pages. Short pages may reach their limit sooner. Touch gestures remain native to the touched scroll area; moving both is a wheel behavior. Narrow-screen stacking still needs manual acceptance, since background wheel input is deliberately assigned to both panes.

## Commit suggestion

`fix(navigation): scroll split pages by cursor position`
