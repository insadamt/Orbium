# Document properties expand and collapse motion

Phase 7 polish — 2026-10-15.

## Implemented

- Added a 220 ms height and opacity transition when document properties expand or collapse; the editor below moves with the section.
- Rotated one chevron between collapsed and expanded states instead of swapping icons.
- Kept properties collapsed by default and preserved inline editing and the current open state after saves.
- Linked the toggle to its section with `aria-controls`. Collapsing immediately makes fields inert and hides them from assistive technology; exit animation completes before field unmounting.
- OS reduced motion makes all transitions immediate.

No migrations, persistent format changes or commits. This is a focused Phase 7 polish change; no later phase was started.

## Validation

- Scoped formatting/lint: PASS.
- `npm run lint`: PASS; 492 files formatted, 405 files linted without warnings/errors.
- `npm run types:check`: PASS.
- `npm run build`: PASS, 22.94 seconds; existing chunk-size, overlapping-import and plugin-timing warnings remain.
- `git diff --check`: PASS.

No automated tests written or run, per user instructions. Browser acceptance remains for manual review.

## Manual checklist

1. Open a database document from Table or Gallery. Expected: Properties starts collapsed, with a right-facing chevron and no entrance animation on page load.
2. Click Properties to expand, then collapse. Expected: fields reveal/hide over approximately 220 ms, the chevron rotates and the editor moves smoothly with the section.
3. Toggle repeatedly before animations finish. Expected: the section reverses toward the latest state, with no duplicate fields or stuck height.
4. Expand, edit a text/number value and choose a Select/Multi-select option. Expected: editors and popups remain usable; saving keeps Properties expanded. Reload and expand again: saved values remain and the initial state is collapsed.
5. Focus Properties with Tab, then use Enter/Space to toggle. Tab onward after collapsing. Expected: the toggle reports the correct expanded state and collapsed fields are skipped immediately, including during the closing animation.
6. Repeat with many properties, in a narrow/split document and in light/dark themes. Expected: the full section opens without a fixed height limit and existing styles remain unchanged.
7. Enable OS reduced motion and toggle again. Expected: height, opacity and chevron states change immediately.

Commit suggestions:

- `feat(documents): animate properties expansion and collapse`
- `feat(ui): add reduced-motion-aware document property transitions`
