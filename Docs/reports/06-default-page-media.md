# Editor review — Default page covers, icons and hover editing

Date: 2026-10-13. User-requested refinement within the current review; no phase advancement.

## Implemented

- Documents, folders and database/table pages always show an 11:3 cover. Pages without a custom cover use a bundled monochrome orbital SVG.
- Documents without a custom icon show a document symbol; folders and databases retain their type symbols. Every icon overlaps the cover with the existing transparent cutout.
- Removed the three-dot image menu. Cover and icon each reveal an Edit control on hover and keyboard focus. Touch devices keep Edit visible; reduced motion disables the reveal transition.
- Edit opens Change cover/icon and, when custom media exists, Reset to default. Existing upload, crop, error and persistence flows remain. Controls show Saving and disable during upload.
- Defaults are display fallbacks, not attachments or database writes. Custom uploads and legacy text icons take precedence. Reset clears the saved custom reference and restores the fallback.
- Shared cover and Edit components keep document and container behavior consistent. Updated editor/UI docs and marked the prior optional-cover report as superseded.
- No migrations, dependencies, commits or pushes. New components are below 500 lines; the revised document page is 468 lines.

## Validation

- Targeted `npx vp fmt`: passed.
- `npm run types:check`: passed.
- `npm run lint`: passed; 410 files formatted, 340 linted, no warnings/errors.
- `npm run build`: passed; existing chunk-size and ineffective-dynamic-import warnings remain. Log: `/tmp/orbium-default-page-media-build.log`.
- `git diff --check`: passed.
- No automated tests were written or run, per user instructions. Browser and visual acceptance remain pending manual review.

## Manual test checklist

1. Open a document, folder and database/table page with no uploaded images. Expected: each has a neutral 11:3 cover and the corresponding document/folder/database icon overlapping its bottom edge, with a clear cutout and readable title.
2. Hover the cover, then hover the icon. Expected: each reveals its own Edit button; there is no three-dot image menu. Move away; expected: Edit fades away unless focused or its menu is open.
3. Tab to both Edit controls and press Enter. Expected: focused controls are visible and their menus are keyboard accessible. On a touch device, expected: both controls remain visible and can be tapped.
4. Choose Change cover, upload an image, adjust the default 11:3 crop and save. Expected: custom cover replaces the fallback, Saving disables its Edit control during upload, and the cover persists after refresh. Repeat on all three page types.
5. Choose Change icon and upload an icon. Expected: custom icon replaces the symbol, retains its overlap/cutout, and persists after refresh. Repeat with a page that already has a legacy text icon.
6. Open each custom image's Edit menu and choose Reset to default. Expected: its default cover/type icon returns immediately after successful save and remains after refresh; resetting one image does not reset the other.
7. Cancel a file picker or crop dialog. Expected: current media remains. Choose an unsupported file where possible; expected: a readable error appears and current media remains.
8. Resize, check light/dark surfaces, and open document/folder/database split panes. Expected: covers stay 11:3, icons and edit controls remain reachable, cutouts track resizing, and editing one pane leaves the other unchanged.
9. Enable reduced motion and repeat hover/focus. Expected: controls appear without fading. Verify title editing, database views and document writing still work.

## Known limitations

- Defaults apply to document, folder and database/table page headers. Gallery cards continue using their existing preview rules and saved crop settings.
- Default media are not written to user attachments or included as uploaded files in exports; the bundled asset supplies the fallback.
- Reset retains the existing attachment lifecycle: it clears the header reference without deleting the uploaded attachment binary.

## Suggested commit

`feat(media): add default page covers and icons with hover edit controls`

Remain in the current review pending the user's manual feedback.
