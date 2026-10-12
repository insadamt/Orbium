# Navigation tab pop motion

Date: 2026-10-12. Phase 5 review follow-up.

## Implemented

- New navigation tabs scale and fade in over 180 ms with a slight overshoot.
- Removed tabs shrink and fade out over 140 ms. Presentation retains the outgoing tab briefly after the navigation store removes it, preserving existing close/save guards and immediate navigation behavior.
- Split tab groups use the same motion when formed or ended.
- Outgoing tabs are inert, hidden from accessibility, and excluded from active-tab lookup and drag sorting. Separate outgoing sortable IDs avoid collisions during split changes.
- Reduced motion disables entry animation and removes outgoing tabs immediately.
- Sortable tab presentation is extracted from the strip to keep files focused and below 500 lines.

## Validation

- Changed frontend files formatted with `npx vp fmt`: PASS.
- `npm run lint`: PASS; formatting and lint checks both passed.
- `npm run types:check`: PASS.
- `npm run build`: PASS, with warnings about chunks over 500 kB and modules imported both dynamically and statically.
- `git diff --check`: PASS.
- No automated tests written or run, per user instructions. Visual/manual acceptance remains pending.

## Manual test checklist

1. Refresh Orbium, then click the navigation island's plus button. Expected: a new tab pops in with a short scale/fade and settles at its normal size.
2. Open a document with Ctrl+click in the explorer. Expected: its new tab pops in once; switching between existing tabs does not replay entry motion.
3. With at least three tabs open, click X on an inactive tab, then on the active tab. Expected: each closing tab shrinks/fades out, disappears within about 160 ms, and the correct remaining page stays active or opens promptly.
4. Close the active unpinned tab with Ctrl+W. Expected: the same exit motion occurs. Right-click a tab and pin it; expected: it remains protected from closing and pin/reorder actions do not replay entry motion.
5. Quickly add and close several tabs. Expected: no lingering ghosts, clickable closing tabs, or duplicate live tabs.
6. Drag tabs to reorder. Then drag an eligible document tab to a split edge and click End split. Expected: dragging, pane focus, and existing split transitions still work; group changes pop in/out without duplicate drag targets.
7. Open enough tabs to overflow the strip at a narrow desktop width. Use the scroll arrows, activate a hidden tab, then close tabs. Expected: arrows remain accurate and the active tab is revealed; the page has no horizontal overflow.
8. Enable browser/OS reduced motion and repeat steps 1, 3, and 6. Expected: tab changes are immediate, with no scale/fade animation or reserved closing-tab gap.
9. Edit a document and immediately close its tab. Expected: the existing close/save guard still protects edits; a tab whose close is blocked does not animate out.
10. Repeat opening/closing in light and dark themes. Expected: tab labels remain readable and animation stays within the navigation island.

## Compatibility and review gate

No dependencies, migrations, or persistent-format changes. No commits created. Outgoing tabs retain their strip space briefly during the exit; surrounding tabs settle after removal. Visual acceptance is left to the user. Remain in Phase 5.

Suggested commit: `feat(navigation): add reduced-motion-aware tab pop animations`.
