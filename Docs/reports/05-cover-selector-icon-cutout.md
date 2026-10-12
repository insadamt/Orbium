# Phase 5 review — Cover ratio selector and icon cutout

## Implemented

- Ratio choices use seven columns on wider screens and four columns on smaller screens, producing one or two rows.
- Document, folder, and database icons overlap every cover ratio by half their height.
- A measured SVG mask cuts the rounded icon footprint out of the cover. Transparent icon borders reveal the underlying page surface instead of painting a solid ring. Overlapping icons have no shadow across the gap.
- Icons shift onto narrow centered covers. Resize observation updates the cutout after image loading, viewport changes, and split-pane resizing; removing a cover or icon clears the cutout.
- No migrations or saved image changes. This remains Phase 5 review work.

## Validation

- `npm run check:fix` — passed.
- `npm run lint` — passed, including formatting validation.
- `npm run types:check` — passed.
- `./vendor/bin/pint --test` — passed.
- `npm run build` — passed, with large-chunk, ineffective dynamic import, and plugin timing warnings.
- `git diff --check` — passed.

Automated tests are neither written nor run, per user instructions. Visual acceptance remains pending manual review.

## Manual test checklist

1. Add a cover and inspect its crop dialog at desktop and 375 px viewport widths. Expected: all seven choices occupy one row at desktop and two rows on mobile, with no isolated seventh button on desktop. Select each ratio; the preview updates and buttons remain reachable.
2. Open a document with a 5:2 cover and an uploaded icon. Expected: the icon overlaps the cover's bottom edge by half its height, with a transparent rounded gap around it. Change to a text icon; the same gap remains.
3. Repeat with 9:16 and 1:1 covers, then resize the window and use a split pane. Expected: the icon stays on the cover edge and the cutout follows without changing the crop or stretching the image.
4. Repeat on a folder and database, including an existing legacy cover. Expected: the same overlap and transparent gap; title and media menu remain usable.
5. Repeat in Light/Dark and Normal/Frosted modes. Expected: the gap shows the underlying surface, without a solid theme-colored ring or icon shadow covering it.
6. Remove the icon from a document. Expected: the full cover reappears. Remove the cover. Expected: the icon returns to the ordinary header position. Restore both and refresh; the overlap returns.

## Commit suggestion

`fix(covers): arrange ratio choices and restore transparent icon overlap`

No commit was created.
