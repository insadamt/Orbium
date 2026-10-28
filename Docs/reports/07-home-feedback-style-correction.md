# Home feedback style correction — 2026-10-28

This report records the home-page styling correction after the user rejected the first feedback UI. It depends on the existing explorer toolbar, shared floating surfaces/theme overrides, Lucide icons, and app Tooltip provider. The behavior described in `07-home-page-polish.md` remains the scope.

## Current revision — centered no-results state

The user requested a larger presentation in the middle to remove the feeling of emptiness. This supersedes the compact No matches toolbar status described in the earlier correction below.

- No-results now occupies the visual center of the explorer area with an 88 px neutral icon surface, 36 px SearchX artwork, a 28 px No matching pages heading, short guidance, and a labeled reset action.
- The icon and action reuse shared floating surfaces and theme tokens. The surrounding area stays open rather than adding a large boxed panel.
- Grid, List, uniform Gallery and natural Gallery all use the same centered layout while results are empty. Truly empty, unfiltered containers retain their prior presentation.
- Reveal remains a compact toolbar notice because matching cards are present.
- Existing filtering, reset behavior, saved preferences, Reveal navigation, and icon fallback remain unchanged.
- This revision’s targeted formatting, lint (864 formatted files; no warnings/errors across 695 linted files), type check, and whitespace check passed. Production build passed in 18.12 seconds with chunk-size, mixed-import, and plugin timing warnings. No automated tests or browser verification run.

Current manual checklist:

1. Search for an absent title in a populated workspace. Expected: the large icon, No matching pages heading, guidance and labeled reset action appear together in the middle of the empty explorer area, with no compact No matches toolbar badge.
2. Click Clear search and filters. Expected: the query/type filter clear and cards return; selected view and sort remain.
3. Repeat with an excluding type filter in Grid, List, uniform Gallery and natural Gallery. Expected: the same centered layout in every view, including natural Gallery.
4. Repeat in Light/Dark and Normal/Frosted. Expected: neutral app colors, readable typography, matching floating icon/button surfaces and hover treatment.
5. Reveal a child excluded by the saved type filter using the parent URL’s ?focus=<child-id>. Expected: cards remain visible, the compact Reveal toolbar notice remains, and its close action returns to the ordinary filter.
6. Open a genuinely empty container without filters. Expected: no new no-results presentation.

Suggested commit: `fix(explorer): center and enlarge the no-results state`

## Earlier correction — toolbar feedback

- Removed the full-width text block and separate recovery button from the card area.
- Moved feedback into the same row as the explorer controls, with a 42 px compact floating surface, 12 px corners and label, muted monochrome icon, and a 32 px icon action.
- No matches uses SearchX and a reset action. Its shared tooltip says Clear search and filters.
- Revealed outside filters uses ScanEye and a close action. Its tooltip says Return to filters.
- Reused `floating-surface` so existing Normal/Frosted and Light/Dark styling applies. Hover uses existing accent/text tokens; reduced motion skips the button color transition.
- Recovery actions disable during hierarchy mutations and dragging, matching the other explorer controls.
- No change to saved data, filtering, Reveal scrolling, icon fallback, or genuinely empty containers. No new migration, dependency, or commit.

## Validation

- Targeted formatting: passed.
- `npm run lint`: passed; 863 files formatted correctly and no warnings/errors across 694 linted files.
- `npm run types:check`: passed.
- `npm run build`: passed in 18.39 seconds, with chunk-size, mixed static/dynamic import, and plugin timing warnings.
- `git diff --check`: passed.
- No automated tests, Playwright, or browser automation run. Visual acceptance remains manual.

## Manual checklist

1. In a populated workspace, search for an absent title. Expected: a compact No matches control sits in the toolbar, with no extra panel or text/button block among the cards.
2. Hover its reset icon. Expected: the app tooltip reads Clear search and filters. Click it. Expected: the title query and type filter clear, restoring items while retaining view and sort.
3. Save a type filter that excludes a known child, then open its parent with `?focus=<child-id>`. Expected: the child appears and scrolls into view; the toolbar shows Revealed outside filters. Hover/click its close icon. Expected: Return to filters tooltip, then normal filtered results return.
4. Repeat in Grid, List, uniform Gallery, and natural Gallery. Expected: toolbar feedback does not create a card-layout gap or shift cards into an additional content row.
5. Repeat in Light/Dark and Normal/Frosted with a detailed wallpaper. Expected: surface, border, typography, icons, hover, and tooltip match the existing app controls; no separate opaque recovery button remains in Frosted mode.
6. Clear all filters in a genuinely empty folder. Expected: no status control or permanent empty-state panel. With reduced motion enabled, hover the feedback action. Expected: immediate state changes.

## Commit suggestion and stop

Suggested commit: `fix(explorer): match filter feedback to floating toolbar style`

Stay on home-page review. Do not move to the next page without user direction.
