# Statistics — independent insight pages

Date: 2026-10-16.

Navigation follow-up: [the card overview review](07-statistics-card-overview.md)
removes category navigation; the independent page layout below remains current.
Scope: correction within the current Statistics UI review. Supersedes the nested
split and drawer layouts. No product-phase advancement.

## Implemented

- Statistics and insights are sibling page surfaces at the workspace level.
  Each has its own background, rounded border, padding, header, and content.
  The insight surface is no longer rendered inside the Statistics panel/card.
- Opening animates the Statistics page into the left 40% of the workspace.
  The insight page uses the entire remaining 60% after a 24px gap. There is no
  fixed-width sidebar, shared outer page card, or inner split divider.
- Closing restores the centered Statistics page. Both pages stay interactive;
  outside clicks do not close insights and there is no overlay or focus trap.
- The insight page has its own Refresh and Close controls, independent scrolling
  below its header, and an Open insights page action. Its metric charts use the
  available page width; composition charts grow on wider surfaces.
- Added a real authenticated route, `/statistics/insights/{metric}`, and Inertia
  page entry. Allowed metrics: words, blocks, storage, tasks, uploads, organization.
  Other metric slugs are rejected by the route constraint.
- Open insights page opens that route in an app tab. It can also be copied,
  opened directly, or reloaded. It preserves the existing scope/category query
  parameters and uses existing owner-scoped summary endpoints.
- Below 1024px, inspecting navigates to the standalone page. Its Statistics
  return control restores the original scope/category. Resizing an already-open
  companion to a narrow viewport shows that page at full workspace width until
  closed; it is not embedded beneath the main card.
- The companion shares the loaded summary, so inspecting adds no request and
  Refresh from either surface updates both. The standalone route owns its own
  summary request, loading/error/retry flow, and Refresh.
- Main category controls respond to their available page width. Focus restoration,
  Escape-to-close within the companion, inert closed content, theme surfaces,
  and reduced-motion handling remain supported.
- Scope parsing is shared by the root and standalone pages. App tabs identify
  the new route as Statistics insights instead of Home.

## Persistent changes / commits

One additive read route; no migrations, stored format changes, new packages,
statistics counting changes, or history tracking.

No commit created. Suggested message:
`feat(statistics): open insights as independent companion pages`

## Validation

- Changed TSX/CSS formatting via `npm exec -- vp fmt`: passed.
- PHP formatting via Pint: passed.
- `./vendor/bin/pint --test`: passed.
- `php -l app/Http/Controllers/StatisticsController.php`: passed.
- `php -l routes/web.php`: passed.
- `php artisan route:list --path=statistics --except-vendor`: passed; four
  registered routes, including the new standalone insight route.
- `npm run types:check`: passed.
- `npm run lint`: passed, including formatting verification.
- `npm run build`: passed; existing large-chunk, mixed static/dynamic import,
  and plugin timing warnings remain.
- `git diff --check`: passed.
- No automated tests written or run, per user instructions. Manual browser/layout
  checks remain pending; no visual pass is claimed.

## Exact manual checklist

1. Open Statistics on desktop and inspect Words. Expect the whole Statistics
   page to move left, including its title, scope selector, and Refresh toolbar.
   Expect a separate insight page to its right with its own rounded surface,
   title, scope, Refresh, Open page, and Close actions. The right page must use
   all remaining workspace width, not sit inside the Statistics card.
2. Inspect another metric while open. Expect that independent right page to
   update. Both pages stay usable. Close it: expect Statistics to return to its
   original centered position/width without a leftover column or offset.
3. Refresh from either companion surface. Expect both to show the same updated
   scoped values. Try a failed refresh: expect retained values and retry/error
   feedback. Change scope: expect old insights to close and old values to clear.
4. Use Open insights page. Expect a separate app tab named Statistics insights,
   with the selected metric and scope. Reload or paste that URL in another
   browser tab: expect the same standalone page and working Refresh.
5. At 375px, inspect a metric. Expect navigation to its independent page, rather
   than a split inside the summary. Use Statistics to return: expect the same
   scope/category. Resize a desktop companion below 1024px: expect the insight
   page to fill the workspace, with Close restoring Statistics.
6. Review Words, Blocks, Tasks, Storage, Uploads, and Content. Expect the existing
   insight totals/charts and exact values to remain consistent; Storage uses
   byte shares, Uploads uses count shares, and pending values stay pending.
7. Use keyboard inspection, Escape within the companion, and Close. Expect
   focus to return to the opening control or main page if that control is hidden.
   Tab must reach both pages. Closed companion content must be skipped.
8. Check Light/Dark, Normal/Frosted, reduced motion, and several desktop widths.
   Expect separate readable page surfaces, charts that use their page width,
   no horizontal overflow, and immediate layout changes with reduced motion.
9. Open `/statistics/insights/unknown`: expect 404. Open a valid insight route
   with a foreign/unavailable scope: expect the existing unavailable/retry
   response without another owner's statistics. Sign out and open a valid
   route: expect the normal authentication guard.

## Limitations / stop gate

Charts still describe current saved statistics. Historical tracking is deferred.
Narrow screens navigate to the standalone insight page rather than showing two
compressed pages. Manual acceptance is outstanding. Stop for this UI review.
