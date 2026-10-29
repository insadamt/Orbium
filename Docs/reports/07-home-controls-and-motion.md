# Home controls and motion — 2026-10-28

This report records the five approved home UI/UX improvements and the requested motion pass from buttons to larger elements. It depends on shared tooltips/surfaces, page-search and navigation state, installed Motion/GSAP, and the existing viewport layout. It extends the previous home feedback and sizing reviews; browser acceptance remains manual.

## Implemented

- Active type/Favorites filters now have a named, removable chip. Removing a chip clears only that filter, retaining search, sort and view. Existing browser persistence is unchanged.
- Icon controls use the shared app tooltip with a 350 ms delay and consistent placement. Filter/sort tooltips include their current choice. View controls, Gallery settings, search/close, page actions, home/new tab, Back, Statistics, Library and Settings are covered. Visible workspace/account names retain their existing menus.
- Sort’s nonmanual-order explanation now lives in its tooltip instead of occupying the toolbar permanently.
- Explorer controls use existing floating surfaces and consistent neutral hover, press and disabled feedback. Gallery settings keeps its slot while hidden so view controls do not shift when switching views.
- Tab placement correction after screenshot review: removed the new reserved search space and forced two-row layout through 2000 px. The original responsive header rules own positioning again, restoring centered tabs to the top row at the supplied desktop width. Narrow-window wrapping retains its original behavior. Closing search still restores focus to its trigger.
- The search input remains mounted but inert and visually clipped while closed, allowing its contents to fade with the width transition. Filtering still applies immediately.

## Motion inventory

| Surface | Feedback |
|---|---|
| Buttons, icon actions and view controls | 120 ms press scale and 160 ms color/border/opacity feedback |
| Workspace/account menu chevrons | 180 ms open/close rotation |
| Active-filter chip | 160 ms fade/scale entrance and exit; outgoing action becomes inert |
| Reveal notice | 160 ms fade/scale entrance and exit without reserving outgoing layout space |
| Search | Existing width transition plus a 140 ms field fade; original responsive header placement restored |
| Gallery appearance control | Fade when shown/hidden, with its toolbar slot retained |
| Toolbar and folder header | 220 ms arrival fade with 6 px settling |
| Initial visible cards | 280 ms entrance with a bounded stagger of up to 160 ms; offscreen cards skip initial motion |
| Card hover/press | Existing lift plus a small icon enlargement and subtle press scale |
| Card layout/view changes | Existing 420 ms repositioning; size changes receive a short opacity softening rather than stretching text |
| Filtered/deleted cards | Existing 220 ms exits; offscreen exit previews are skipped |
| No-results state | Existing 240 ms entrance/180 ms exit retained |
| Menus, dialogs and tabs | Existing shared animations retained; no second animation system added to them |

Card motion stays separate from drag/stack gesture motion. Returning cards cancel matching outgoing clones during rapid filtering. OS reduced motion skips added CSS/Motion animations and cancels active GSAP card motion and exit previews. No continuous animation or artificial action delay was added.

## Scope and persistence

- Main animation and desktop-layout rules are scoped to the home/workspace/folder explorer.
- Shared search structure, Back/Statistics tooltips and shell icon tooltips also apply to their existing consumers. Their navigation and filtering behavior is preserved.
- No backend, migration, content/archive format or dependency changes. No commits created.
- New source files are focused and under 500 lines; modified source includes purpose/dependency summaries and comments for non-obvious behavior.
- Mobile, screen-reader redesign and RTL menu work remain outside the user’s requested scope.

## Validation

- Targeted formatting: passed during implementation.
- `npm run lint`: passed; all 868 files formatted correctly, no warnings/errors across 697 linted files.
- `npm run types:check`: passed.
- `npm run build`: passed in 19.90 seconds, with chunk-size, mixed static/dynamic import and plugin timing warnings.
- `git diff --check`: passed.
- No automated tests, Playwright, browser automation or manual browser verification were run.

## Manual acceptance checklist

1. **Saved filter:** select Documents or Favorites, reload the home container. Expected: the named chip is visible beside controls. Enter a title query, then remove the chip. Expected: the type/Favorites filter clears while the query, sort and view remain.
2. **Tooltips:** hover Filter, Sort, each view, Gallery settings, search/close, page actions, Back, Statistics, Library, Settings, home and New tab. Expected: the shared tooltip appears after a short delay; filter/sort show current choices. Back/Statistics/view/Gallery controls do not also show the old browser-native tooltip.
3. **Sort guidance:** choose Name A–Z, then hover Sort. Expected: current sort and the Manual order drag guidance are in the tooltip; the permanent sentence no longer occupies the toolbar. Switch back to Manual order and confirm reordering works.
4. **Original tab position:** at the supplied screenshot width (about 1657 px), then at 1600, 1920 and 2200 px, inspect the header and open/close search. Expected: tabs are centered on the same top row as workspace/account controls, instead of occupying the added second row. At 1024 and 1440 px, expected: the original responsive wrapping remains. Input focus and Escape/close still work.
5. **Button feedback:** hover/press/release the small controls and reset action. Expected: brief consistent color/press feedback; disabled controls do not react or perform actions. Open workspace/account menus and check chevron rotation and their normal menu behavior.
6. **Initial cards:** open a populated workspace/folder. Expected: visible cards arrive with a short bounded stagger; no long chain of delayed cards. Scroll down. Expected: offscreen cards are already available, with no forced entrance animation or blank gaps.
7. **View transitions:** switch Grid → List → uniform Gallery → natural Gallery. Expected: cards reposition/soften size changes without stretched text, blocked controls or leftover faded cards. Gallery settings fades in/out without shifting the rest of the toolbar.
8. **Rapid filtering:** quickly alternate matching/nonmatching queries and type filters. Expected: chips, Reveal/no-results notices and cards settle to the latest state, without duplicate outgoing cards, inert overlays, flashes of stale results or extra blank-page scrolling.
9. **Reveal:** save a filter excluding a child, then open the parent with `?focus=<child-id>`. Expected: the child appears and scrolls into view; the Reveal notice animates in. Dismiss it. Expected: it fades out while normal filtered results return immediately.
10. **Drag/actions:** select cards, drag/reorder in Manual order, cancel with Escape, move into a folder, and delete/restore a disposable item. Expected: existing stack, drop-target and hierarchy behavior remains; hover/press effects do not fight drag motion. Page actions disable while the explorer is busy.
11. **Reduced motion:** enable OS reduced motion before opening home; repeat filters, views and search. Then enable it while cards are moving. Expected: extra travel/scale/stagger is absent, active card work stops, and all controls remain usable.
12. **Appearance/viewport regression:** repeat the empty/no-results and populated states in Light/Dark and Normal/Frosted, with a detailed wallpaper and short desktop window. Expected: matching surfaces and readable tooltips, no extra blank scroll range, and all genuinely long content remains reachable.
13. **Shared-control regression:** open a document, database and Settings. Check page search and Back/Statistics. Expected: normal search/navigation scope and focus remain, without home-only card or header-layout styling leaking onto those pages.

## Limitations and stop

Visual smoothness and pointer behavior have not been browser-verified. The original responsive header arrangement applies at all widths; this correction removes the new 1000–2000 px two-row override. Actual content that exceeds the viewport still scrolls. This pass adds bounded interaction feedback, not continuous decorative motion.

Remain on home-page manual review before moving to another page.

## Suggested commits

- `feat(explorer): clarify saved filters and unify control feedback`
- `feat(explorer): add bounded home interaction motion`
- `fix(navigation): restore original desktop tab placement`

## Tab placement correction validation

Removed only the new header/search layout overrides from `home-interactions.css`; tooltip, filter and motion work remains. Targeted formatting, lint (868 correctly formatted files; no warnings/errors across 697 linted files), type check and whitespace check passed. Production build passed in 16.40 seconds with chunk-size, mixed-import and plugin timing warnings. No automated tests or browser verification run.
