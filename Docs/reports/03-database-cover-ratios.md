# Database top-cover aspect ratios

Superseded by the shared layout described in [page-cover-proportions.md](page-cover-proportions.md).

## Scope

Focused database UI update: display the database page's top cover using its saved crop ratio.

## Implemented

- Database header covers honor all eight existing crop choices: 11:3, 16:9, 5:2, 9:16, 3:2, 4:3, 1:1, and 4:5.
- Cover ratio updates after a successful upload and persists through the existing header endpoint.
- Reset and covers without ratio metadata use the default 11:3 frame.
- Library selection keeps its existing 11:3 behavior.
- The shared cover component accepts an optional aspect ratio; document and folder callers retain their current presentation.
- Existing icon overlap/cutout logic continues to observe cover dimensions.

## Persistence

No migrations or persisted-format changes. Uses the existing cover_aspect_ratio field.

## Validation

- Formatting: passed for both changed source files.
- npm run lint: passed, including repository formatting verification; no warnings or lint errors.
- npm run types:check: passed.
- npm run build: passed; warnings about large chunks and modules imported both dynamically and statically.
- Automated tests: not written or run, per project instructions.
- git diff --check: passed.

## Manual validation checklist

1. Open a database and choose cover Edit → Change cover. Select an image, choose 16:9, and confirm Use image.
   - Expected: the database's top cover displays at 16:9 without being forced into the old 11:3 banner.
2. Repeat with 11:3, 5:2, 9:16, 3:2, 4:3, 1:1, and 4:5.
   - Expected: every frame follows its selected ratio; portrait covers are taller and square covers are square.
3. Refresh after saving a square or portrait cover.
   - Expected: the cover and selected ratio remain unchanged.
4. Start changing the cover, choose another ratio, then cancel.
   - Expected: the current saved cover and its dimensions remain unchanged.
5. Resize the window or open the database in a narrow split pane.
   - Expected: cover scales to available width while retaining its ratio, and the icon cutout follows the cover edge.
6. Reset the cover to default, then choose a Library image as the cover.
   - Expected: reset restores the neutral 11:3 cover; Library selection displays in its existing 11:3 frame.
7. Open an existing database cover without ratio metadata, plus a normal document and folder page.
   - Expected: their existing 11:3 header presentation remains available.

## Commits

No commit created. Suggested message:

`fix(databases): honor saved header cover aspect ratios`

## Stop

This cover update is ready for manual review. No other database UI enhancements are included.
