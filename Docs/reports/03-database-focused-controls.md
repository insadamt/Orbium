# Database focused controls

Implemented the approved database UI refinement within the database scope.

## Changes

- Filter and Sort now open independent anchored panels, keeping the database visible.
- Each panel owns its draft and offers Apply, Cancel, and Clear all. Escape/outside dismissal discards unapplied changes.
- Active filter chips summarize saved conditions and allow immediate removal or clearing.
- Sort rules support explicit priority changes with accessible move-up/down buttons.
- Table/Gallery settings contains display configuration only; saving display settings preserves existing filters and sorts.
- Panels become bottom sheets below 640px, with scrollable bodies and safe-area spacing.
- Existing persistence, filter semantics, and per-view behavior remain unchanged. No backend changes or new dependencies.
- Existing uncommitted cover/header work was preserved.

## Validation

- `npm run types:check`: passed.
- `npm run lint`: passed, including formatting validation.
- `npm run build`: passed with dynamic/static import overlap, large chunk, and plugin timing warnings.
- `git diff --check`: passed.
- No automated tests written or run, as requested. Browser interaction and visual checks remain for manual review.

## Manual checklist

1. Open a database in Table; click Filter, Sort, and View settings in turn.
   Expected: Filter/Sort show only their own controls without a backdrop. Settings shows property controls and inline adding, without Filter/Sort tabs.
2. Add a filter using a Select property and choose an option; click Cancel. Reopen Filter.
   Expected: the database and saved filter list remain unchanged.
3. Add two conditions and apply them.
   Expected: both conditions must match, the Filter count is 2, and two readable chips appear below the toolbar.
4. Remove one chip, then use Clear all in the chip row.
   Expected: each action saves immediately; count/results update, and the chip row disappears when empty.
5. Add a filter, reopen Filter, choose Clear all, then Cancel.
   Expected: the saved filter survives. Repeat Clear all and Apply filters; all documents matching the current search return.
6. Add two sort rules on properties with repeated values, change directions, and move the second rule up. Apply.
   Expected: the top rule determines primary order; the second breaks ties. Sort count matches the saved rules.
7. Change a draft and press Escape; repeat by clicking outside the panel.
   Expected: the panel closes without saving. Escape returns focus to its toolbar trigger.
8. Switch to Gallery, set filters/sorts and preview/appearance, then return to Table and reload.
   Expected: each view retains its own saved configuration. Appearance/property saves preserve filters and sorts.
9. Use a viewport narrower than 640px; open Filter and Sort and add enough rules to scroll.
   Expected: each appears at the bottom; fields fit, content scrolls, and Cancel/Apply remain reachable.
10. Use Tab/Shift+Tab and keyboard selection in property/operator/value dropdowns.
    Expected: visible focus, operable controls, and dropdown selection keeps the parent panel open.
11. In a database with no custom properties, open Filter and Sort.
    Expected: Filter explains how to add a property and disables Add condition; Sort still offers Title.
12. Use browser network throttling while applying, then simulate a failed request.
    Expected: saving disables edits/dismissal, a failure retains the panel draft and displays an error, and retry succeeds after restoring connectivity.

## Suggested commit

`feat(databases): separate filters sorts and view settings`

## Button background correction

Manual review found that the shared frosted-theme stylesheet still assigned glass backgrounds to `.db-toolbar-button` and `.db-icon-button`, including hover/active states. Removed those selectors from both frosted surface rules and explicitly set their local background to transparent. New keeps its primary fill.

Validation: formatting/lint and production build passed; build retains import overlap, chunk size, and plugin timing warnings. `git diff --check` passed. No automated tests run. This follow-up changes CSS only.

Manual checks:

1. With Frosted appearance enabled, open a database. Expected: Filter, Sort, and View settings have no glass background; New remains filled.
2. Hover Filter/Sort/settings and apply a filter or sort. Expected: hover and active buttons remain transparent; active counts and text remain visible.
3. Switch to Solid appearance and repeat. Expected: the same transparent button treatment, with New still filled.
4. Tab through controls. Expected: keyboard focus remains visible and buttons still open their panels.

Suggested commit: `fix(databases): remove frosted theme button backgrounds`
