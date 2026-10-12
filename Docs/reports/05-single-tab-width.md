# Single-tab width correction

Date: 2026-10-12. Phase 5 review follow-up.

## Implemented

The final unpinned tab keeps the close button's layout space, preserving the same
width and title truncation as when other tabs are open. The button is invisible,
disabled, hidden from accessibility, and excluded from keyboard focus while only
one tab remains. The drag preview also reserves this space.

## Validation

- Changed frontend files formatted with `npx vp fmt`: PASS.
- `npm run lint`: PASS, including repository formatting checks.
- `npm run types:check`: PASS.
- `npm run build`: PASS, with warnings about chunks over 500 kB and modules imported both dynamically and statically.
- `git diff --check`: PASS.
- No automated tests written or run, per user instructions. Manual acceptance remains pending.

## Manual test checklist

1. Refresh Orbium with one unpinned tab, then click plus to open another tab.
   Expected: the original tab keeps its width as its X becomes visible.
2. Close the other tab and wait for its exit animation to finish.
   Expected: the remaining tab keeps its width while its X disappears.
3. Repeat with a short title and a title long enough to truncate.
   Expected: neither the tab width nor the title truncation changes when the tab becomes the last one.
4. With only one tab, click its reserved close-button space and navigate through controls using Tab.
   Expected: the tab stays open and no hidden close button receives keyboard focus.
5. Drag the single tab, then repeat with multiple tabs. Pin and unpin a tab from its context menu.
   Expected: the drag preview retains the tab's title spacing; visible close buttons and pin controls still work normally.

No dependencies, migrations, or persistent-format changes. No commits created.
Remain in Phase 5 for manual review.

Suggested commit: `fix(navigation): preserve single-tab width when close icon is hidden`.
