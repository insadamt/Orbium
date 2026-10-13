# Library background and viewport review

Date: 2026-10-13. Requested refinement of the current Library review; no phase advancement.

## Implemented

- Exposed the existing app appearance background behind Library and details, including default gradients, wallpapers, and animated effects in light/dark Normal/Frosted appearances.
- Sized details to `100dvh`, reserving space for the floating navigation's existing measured spacer. Removed the extra page padding and fixed preview minimum height that caused page overflow.
- Made the preview and metadata fill the remaining viewport, with internal scrolling for zoomed images, unsupported-file tiles, and long metadata/usage lists.
- Stacked preview and metadata into bounded rows on narrow screens. Added translucent preview/metadata surfaces for Frosted appearance.

## Validation

- `npm run types:check`: passed.
- `npm run lint`: passed formatting and lint checks.
- `npm run build`: passed with existing large-chunk and ineffective-dynamic-import warnings.
- `git diff --check`: passed.
- No automated tests written or run, per user instructions. Visual/runtime acceptance remains for the user's manual review.
- No migrations, dependencies, or persisted format changes. No commits created.

## Manual checklist

1. In Appearance, select the default background; open Library and then image details in Light and Dark. Expected: the subtle app background is visible behind content on both pages.
2. Select an image wallpaper and then an animated background, repeating in Normal and Frosted surfaces. Expected: the selected background shows behind both pages; Frosted preview/metadata panels are translucent and controls remain readable.
3. Open portrait, landscape, and square image details at desktop size. Expected: the page fits the viewport, the entire fitted image stays inside the preview, and navigation/zoom controls stay visible without scrolling the page.
4. Zoom in, pan using the preview's scrollbars, then click Fit. Expected: only the preview scrolls while zoomed; Fit restores the image inside the available preview area.
5. Open a file with a long filename and many saved usage links. Scroll its metadata panel to the bottom. Expected: every usage link and deletion explanation remains accessible; the preview and page navigation stay in place.
6. Resize below 850px, then to a phone width and a short window. Expected: preview and metadata stack within the viewport, floating navigation stays above content, and internal panel scrolling reaches overflowing content without a page scrollbar.
7. Open a non-image file and a missing-file entry if available. Expected: the fallback explanation is reachable inside the preview and available files retain their Download action.
8. Use Previous/Next, Back to Library, and navigate to a document or Settings. Expected: details remain fitted across file changes; gallery scrolling/restoration and other pages' normal scrolling still work.

## Commit suggestion

`fix(library): expose backgrounds and fit details to viewport`
