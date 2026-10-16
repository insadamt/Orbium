# Statistics — details drawer

Superseded by [the split insights review](07-statistics-split-insights.md).
The current UI uses an in-page split and icon controls; the earlier drawer and
More-button behavior below is historical.

Date: 2026-10-16.
Scope: current Statistics UI review; no advancement to another product phase.

## Implemented

- Separate More buttons on Words, Blocks, Storage used, Tasks, and Uploads.
  Card backgrounds remain static; Documents remains in Content only.
- One right modal drawer, reusing the current scope's loaded summary without
  changing the URL or requesting statistics again.
- Words: writing totals/averages, character details, and a character composition
  chart showing non-space characters and spaces with exact counts/shares.
- Blocks: sorted block distribution, total/average counts, expansion, inline math.
- Tasks: completion progress, checked/remaining counts, and percentage.
- Storage/Uploads: original sizes, Images/Files composition, counts, shares,
  total uploads, average size, and inclusion details.
- At widths of 1024px and above, the 420px drawer slides in while the Statistics
  island narrows and moves left. Close reverses both motions over 280ms.
  Background navigation switches to the compact selector while narrowed; metric
  columns adapt to the available space.
- Below 1024px the drawer fills the viewport. Its content scrolls independently;
  background scrolling is locked. Safe-area padding is included.
- Escape, close button, and outside click dismiss the drawer. Radix provides
  modal focus containment and background isolation. Closing returns focus to
  the exact More button that opened it if that button remains mounted.
- System reduced motion disables page and drawer movement. Shared Light/Dark,
  Normal/Frosted surfaces apply to the portaled drawer.
- Category and scope changes close the drawer. Empty/pending values retain
  their existing explicit states.

## Commits and persistent changes

No commit created. Suggested message:
`feat(statistics): add animated details drawer to metric cards`

No migrations, archive changes, API changes, dependencies, or historical tracking.
Existing grouped category views remain available when the drawer is closed.

## Validation

- Changed-file formatting: `npm exec -- vp fmt` passed.
- `npm run types:check`: passed.
- `npm run lint`: passed, including formatting verification.
- `npm run build`: passed, with existing mixed static/dynamic import, large
  bundle, and plugin timing warnings.
- `git diff --check`: passed.
- No automated tests written or run, as requested. PHP checks are not applicable.
- Browser/manual verification is pending user review; no visual pass is claimed.

## Exact manual checklist

1. Open Statistics > Overview at desktop width. Expect Words, Blocks, and
   Storage used at the top with small More buttons. Clicking a card's empty
   area does nothing. Documents remains in the Content section.
2. Press Words > More. Expect the right drawer to slide in as the whole
   Statistics island moves left and narrows. Expect Words and the selected
   scope in its header, writing totals/averages, character disclosure, and a
   two-row character chart. Exact non-space and space counts sum to characters.
3. Close with X. Expect the drawer to slide out, the island to return to its
   original width/position, and focus to return to Words > More without scrolling.
   Repeat opening and closing rapidly: expect no stuck offset or duplicate drawer.
4. Open Blocks > More. Expect the same total as its card, the sorted usage chart,
   block expansion, and inline math. Percentages use all blocks; expanded zero
   rows remain zero. Scroll the drawer: expect the close/header to remain visible
   and the background page to retain its scroll position.
5. Open Storage used > More and Uploads > More. Expect the same selected scope
   and matching totals, Images/Files counts and original sizes, size shares,
   and expandable average size. An empty scope shows explicit empty upload state.
6. Open Tasks > More. Expect checked plus remaining to equal total, consistent
   progress/percentage, and an explicit empty state if there are no checklist items.
7. Open using keyboard Enter/Space. Expect focus inside the drawer, Tab/Shift+Tab
   contained inside it, Escape to close, and focus back on the opening More button.
   On desktop, click outside the drawer: expect dismissal and page restoration.
8. Try approximately 1024px and a large desktop viewport. Expect a readable
   narrowed page, compact background navigation, and a 420px drawer. At 375px,
   expect a full-width drawer, readable charts/table, accessible close control,
   and no horizontal page overflow. Close: expect the original layout restored.
9. Check Light/Dark and Normal/Frosted. Expect legible drawer surfaces, numbers,
   and controls. Enable OS reduced motion: expect immediate open/close and no
   page/drawer translation animation.
10. Inspect Network while opening each drawer. Expect no additional summary
    request and no URL/category change. Close, change scope, and reopen: expect
    the new scope's data only. Switch categories or leave Statistics and return:
    expect normal category navigation with no stale drawer offset.
11. Review an account and an individual document. Expect appropriate averages
    only for multi-document scopes. Review pending statistics: unavailable
    groups remain pending rather than becoming fabricated zeroes or charts.

## Limitations and stop gate

Charts describe current saved content. Historical trends remain deferred.
The drawer is modal: close it to interact with another card or the main page.
Manual visual and interaction checks remain for the user. Stop for this review.
