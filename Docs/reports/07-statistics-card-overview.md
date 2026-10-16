# Statistics — card overview without category navigation

Date: 2026-10-16.
Scope: approved removal of Statistics category navigation within the current UI
review. The user's additional enhancement request is awaiting clarification.

## Implemented

- Removed vertical tabs, the mobile category selector, URL category switching,
  and hidden Writing/content/Storage panels. The main page shows one overview.
- Overview retains Words, Blocks, Storage used, applicable Content organization,
  Tasks, and Uploads. Documents remains in Content rather than the top cards.
- Inspect controls still open independent companion/standalone insight pages,
  where full metric values and charts remain available.
- Removed unused category components/styles and obsolete inline detail renderers.
  Kept content summary and block icon mapping in focused modules.
- Legacy `category` parameters are ignored and removed from newly constructed
  navigation URLs. Existing scope and originating-page return context remain.
- Independent page layout, charts, Refresh, scope selection, pending/error states,
  keyboard focus restoration, and reduced-motion behavior remain supported.

## Validation

- Changed-file formatting via `npm exec -- vp fmt`: passed.
- `npm run types:check`: passed.
- `npm run lint`: passed, including formatting verification.
- `npm run build`: passed; existing large-chunk, mixed static/dynamic import,
  and plugin timing warnings remain.
- `git diff --check`: passed.
- No automated tests written or run, as requested. No PHP changes in this revision.
- Manual browser/layout validation is pending the user's review.

## Exact manual checklist

1. Open Statistics on desktop and mobile. Expect the overview cards with no
   vertical navigation, category dropdown, or hidden tab panels.
2. Open `/statistics?category=content`, then `?category=storage`. Expect the
   same overview and all inspect actions to remain available.
3. Inspect Words, Blocks, Storage, Content, Tasks, and Uploads where applicable.
   Expect their existing detailed values and charts in the independent right
   page on desktop, or standalone page on mobile. No metric details are lost.
4. Close the companion. Expect Statistics centered again and focus back on the
   inspect control. Inspect another metric while open: expect direct switching.
5. Change scope, Refresh, and use Back to source. Expect the correct scope and
   existing behavior, without category controls or stale values. Newly opened
   insight/return URLs omit the obsolete category parameter.
6. Review empty/pending scopes and Light/Dark/reduced motion at narrow and wide
   widths. Expect explicit states, readable cards, and no horizontal overflow.

## Commits / limits / stop gate

No commit created. Suggested message:
`refactor(statistics): replace category navigation with card overview`

No new metrics, historical data, or persistence/API changes. Further enhancement
scope is awaiting the user's preference; stop after this approved navigation change.
