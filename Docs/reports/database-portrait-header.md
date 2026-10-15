# Database portrait header experiment

Superseded by [shared-adaptive-cover-layout.md](shared-adaptive-cover-layout.md), which extends the layout to all page types and compact cover shapes.

## Scope and branch

`codex/database-portrait-header`, created from `editor/codemirror-markdown` with a clean working tree.

Implements the approved first design experiment: rearrange a database's header around a portrait cover. Document and folder headers retain the previous proportional-cover layout. No phase advancement.

## Implemented

- Custom portrait covers use a two-column database header when at least 600px of header width is available.
- The cover sits on the left, preserving its intrinsic ratio, with a maximum width of 220px and the existing height limit of min(320px, 35% of the viewport height).
- A 64px icon, editable title, counts, Table/Gallery switcher, Filter, Sort, settings, and New controls occupy the right side.
- The portrait arrangement removes the overlapping icon/cutout.
- Narrow containers stack the same header vertically. Container queries follow split-pane/header width rather than only browser width.
- Square, landscape, default, and unavailable-cover fallback images retain the stacked header.
- Table and Gallery stay full-width below the header.
- The existing toolbar was extracted into a focused component so its controls can follow the header arrangement without duplicating state or event handlers.

## Persistence

No migrations, dependencies, stored-setting changes, or binary modifications.

## Validation

- Targeted formatting: passed.
- npm run types:check: passed.
- npm run lint: passed, including repository formatting; no warnings or lint errors.
- npm run build: passed; warnings about large chunks, static/dynamic imports, and plugin timings.
- git diff --check: passed.
- Automated tests: not written or run, per project instructions.
- Visual review: requires the manual checklist below.

## Manual checklist

1. Open a database in a wide window. Upload a 9:16 cover using Edit → Change cover → 9:16 → Use image.
   - Expected: portrait cover on the left; icon, title, counts, and view/action controls on the right. No overlapping icon or cutout.
2. Repeat with a 4:5 crop and a portrait image selected from Library.
   - Expected: each retains its proportions; cover width stays within 220px and height stays within the shared limit.
3. Switch between Table and Gallery, open Filter/Sort/settings, and create a document.
   - Expected: the existing controls work; records and Gallery remain full-width beneath the complete header.
4. Rename the database, replace/reset its icon, and refresh.
   - Expected: changes persist and the cover-aware header remains intact.
5. Narrow the window or split pane until the header content width is below 600px, then widen it again.
   - Expected: vertical stack in the narrow container and side-by-side portrait header when wide, with no stale image cutout or icon translation.
6. Change the cover to 1:1, 16:9, or 11:3, then reset to default.
   - Expected: stacked cover/title/control layout returns; image proportions remain correct. Full-width banners can retain the original overlapping icon treatment.
7. Cancel a crop and refresh after a saved portrait crop.
   - Expected: cancelling does not alter the cover; refreshing preserves the saved image and its portrait arrangement after loading.
8. Check a long database title, keyboard focus through the image controls and toolbar, and touch controls where available.
   - Expected: controls remain reachable, title stays editable, and the header does not overlap the table/gallery.
9. Open an ordinary document and folder page.
   - Expected: their existing proportional-cover presentation remains unchanged.

## Limitations

This experiment covers portrait database headers only. Square-cover side layouts and document/folder variants await visual review. Image dimensions can update the header arrangement after loading when saved metadata is missing or inaccurate.

## Commit suggestion

No commit created.

`feat(databases): arrange portrait covers beside header controls`

## Stop

Code checks are complete; ready for manual design review. Further layout variants should follow that review.
