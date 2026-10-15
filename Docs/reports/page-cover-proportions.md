# Shared page-cover proportions

## Scope

Implement the approved cover sizing plan across document, folder, and database page headers. This supersedes the earlier database-only cover update and does not advance to another product phase.

## Implemented

- Shared covers preserve the loaded image's intrinsic aspect ratio. Cropped uploads therefore retain their chosen ratio, and Library images/older covers no longer depend on historical 11:3 metadata.
- Covers fit within the available width and a height limit of min(320px, 35% of the viewport height). Embedded panes use the existing host viewport height variable.
- Narrower covers are centered without an artificial side background. Images use whole-image fitting without stretching or additional cropping.
- Full-width covers retain their overlapping icon and transparent cutout. Narrower covers position the icon below the image, aligned with the title.
- Resizing re-evaluates both cover dimensions and icon placement.
- Cover Edit stays attached to the displayed image; existing touch and keyboard visibility remains in place.
- The default cover keeps its intrinsic 11:3 ratio. Unavailable cover images fall back to the default while retaining Reset to default access.
- Saved ratios provide provisional dimensions before image loading; missing metadata provisionally uses 11:3 until intrinsic dimensions become available.

## Persistence and compatibility

No migrations, new dependencies, binary changes, archive changes, or persistence updates. Existing Library reuse metadata is unchanged; loaded image dimensions determine header presentation. Existing crop controls, uploads, reset, and Gallery view settings are retained.

## Validation

- Targeted source/CSS formatting: passed.
- npm run lint: passed; repository formatting passed, no lint warnings/errors.
- npm run build: passed. Reported large-chunk, static/dynamic-import, and plugin-timing warnings.
- npm run types:check: passed.
- git diff --check: passed.
- Automated tests: neither written nor run, per project instructions.
- Browser visual review: left to the user's manual validation.

## Exact manual checklist

1. On a document page, use cover Edit → Change cover. Upload an image, choose 11:3, and save. Repeat for 16:9, 5:2, 9:16, 3:2, 4:3, 1:1, and 4:5.
   - Expected: the saved crop is fully visible in its chosen proportions, with no stretching or extra cropping. Height never exceeds 320px or 35% of the viewport height.
2. Repeat representative wide, square, and portrait uploads on a folder and database page.
   - Expected: all three page types follow the same sizing and alignment rules.
3. Choose a square or portrait image through Edit → Choose from Library on each page type.
   - Expected: after the image loads, it retains the original file proportions, even if existing saved metadata says 11:3. No duplicate file or new crop is created.
4. Open an older page cover and refresh; also refresh a newly cropped cover.
   - Expected: intrinsic proportions are restored after loading. A provisional frame may appear while image dimensions are unavailable.
5. Resize between a wide window and narrow/split panes, including a short window.
   - Expected: covers remain inside the available width and height limit; narrower covers stay centered and the page content remains aligned.
6. At a width where a wide cover fills the header, inspect the icon. Resize until the cover is height-limited and narrower than the header.
   - Expected: full-width mode has the overlapping icon/cutout; narrower mode places the icon below with no lingering mask or horizontal translation. Resizing back restores the overlap.
7. Tab to the cover controls and use them; repeat on a touch device if available.
   - Expected: Edit is accessible and attached to the actual image, not the empty side space.
8. Start a crop, change ratio, then Cancel.
   - Expected: the saved cover remains unchanged.
9. Reset to default and refresh.
   - Expected: the neutral default cover returns with its 11:3 proportions and the same height limit.
10. If a page already references an unavailable image, open it.
    - Expected: the default cover is displayed; Edit still allows replacing/resetting the missing custom cover.
11. Open Table and Gallery for an existing database.
    - Expected: their controls, records, and Gallery appearance settings are unchanged.

## Commits

No commit created. Suggested message:

`feat(covers): preserve aspect ratios within bounded page headers`

## Stop

Implementation and code checks are complete; the user's visual review remains. Further UI refinements can follow the manual review.
