# Shared adaptive cover layout

Later layout refinements and the Library edit-menu fix are recorded in [cover-header-review.md](cover-header-review.md).

## Scope

Follow-up on `codex/database-portrait-header` after the user reported no visible change and clarified that all pages should use the design. The earlier implementation only activated for portrait database headers; documents, folders, square covers, and moderate landscape covers did not activate it.

## Changed

- Documents, folders, and databases now share the same header container and shape-driven responsive rules.
- At least 600px of header width: portrait covers (9:16, 4:5) appear beside title/details with a maximum width of 220px. Compact covers (1:1, 4:3, 3:2, 16:9) use the same side arrangement with a maximum width of 320px.
- Wide covers (11:3, 5:2), default covers, and narrow containers use the stacked header.
- Existing intrinsic aspect ratios and the min(320px, 35% of viewport height) limit are retained.
- Side headers have a 64px icon without overlapping cutouts. Stacked headers retain adaptive icon overlap behavior.
- Database controls follow the title/details in the side column.
- Document database properties can occupy the side header. The editor was separated from the header and remains at its normal width below it.
- Document editor selection was extracted into a focused component to keep the document page below 500 lines.

## Validation

- Targeted formatting: passed.
- npm run types:check: passed.
- npm run lint: passed, including repository formatting; no warnings or lint errors.
- npm run build: passed with large-chunk, import, and plugin-timing warnings.
- git diff --check: passed.
- Local Vite endpoint: reachable; confirmed it served the earlier experimental stylesheet while investigating.
- Browser visual inspection: unavailable through the desktop screenshot backend; requires user review.
- Automated tests: not written or run, per project instructions.

## Manual checklist

1. Refresh a document with a 1:1 or 16:9 custom cover in a wide window.
   - Expected: cover left, icon/title and any database properties right; editor below at its normal width.
2. Repeat on a folder and database using 4:3 or 3:2 covers.
   - Expected: cover and header details sit beside each other; folder contents and database Table/Gallery remain below at their normal width.
3. Try 9:16 and 4:5 covers on all three page types, including Library reuse.
   - Expected: portraits retain their proportions with a maximum width of 220px and the shared height limit; the icon has no overlapping cutout in side mode.
4. Try 11:3 and 5:2 covers, then Reset to default.
   - Expected: stacked headers with wide covers above the title/details.
5. Narrow and widen the page or split pane across 600px of header width.
   - Expected: a vertical stack in narrow containers and side headers for compact/portrait images when wide. No stale icon mask or translation.
6. Edit a title/icon, change a cover, cancel a crop, and refresh.
   - Expected: existing editing, cancellation, reset, and persistence behavior remains intact.
7. Type into both Markdown and legacy document editors, and open database Filter/Sort/settings and create a document.
   - Expected: existing editing and database behavior remains intact; content is not squeezed beside a cover.

## Persistence and commits

No migrations, dependencies, persisted-format changes, or commits.

Suggested message:

`feat(headers): adapt all page layouts to cover proportions`

## Stop

Code checks complete; ready for manual review. The original portrait-only report is superseded by this report.
