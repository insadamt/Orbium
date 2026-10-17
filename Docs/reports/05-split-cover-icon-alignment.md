# Phase 5 review — split cover and icon alignment

Date: 2026-10-17.

## Problem and change

The supplied screenshot shows an oversized cutout beside the left icon and a misplaced notch on the right edge of the other cover. The shared header hook measured transformed screen rectangles during split entry, then used those measurements as local SVG mask coordinates. Split animations scale and move the header; their screen coordinates do not describe its underlying layout. The previous icon translation was also subtracted in local pixels from transformed coordinates.

The hook now measures cover/icon sizes and positions through layout dimensions and offset-parent coordinates. It ignores animation transforms when aligning the icon and building its rounded cutout. Full-width banners retain the overlapping icon, while compact and portrait cover layouts retain their existing no-cutout behavior. This shared correction applies to document, folder, and database headers without changing title behavior.

No dependencies, migrations, stored formats, or backend changes. No commit created. The preceding active-tab split guard remains in the working tree.

## Validation

- `npm run lint`: PASS, including formatting of 549 files and lint of 455 files.
- `npm run types:check`: PASS. The first run caught an inferred-type error in the offset-parent traversal; an explicit DOM type fixed it before the passing rerun.
- `npm run build`: PASS (14.56 seconds), with large-chunk, ineffective dynamic-import, and plugin-timing warnings.
- `git diff --check`: PASS.
- No automated tests written or run, per user instructions.
- Browser interaction and screenshot comparison remain pending manual review.

## Manual checklist

Hard-refresh once to load the new assets. Open two documents A and B with default covers, including one with a long title.

1. Select A and drag inactive B to the right split edge. Expected: each icon overlaps its own cover with a matching rounded cutout; neither cover has an extra notch at its opposite edge. Titles remain below the icons and readable.
2. End the split and repeat with B dropped on the left. Expected: both headers remain aligned during and after animation, with no stretched cutout or shifted icon.
3. End the split with each document selected in turn. Expected: the remaining header returns to its normal centered width and its icon/cutout stay aligned. Repeat split/merge several times; offsets must not accumulate.
4. Resize the window while split, including crossing the narrow-screen stacked layout. Expected: covers preserve their proportions, titles wrap, and each banner cutout continues to match its icon.
5. Repeat with custom wide covers and uploaded image or emoji icons. Expected: the cutout follows the icon's outer rounded box and cover/title editing remains usable.
6. Try portrait and square covers, including widths on both sides of the 600px header breakpoint. Expected: the existing side or stacked layout applies; narrower covers have no cutout, and returning to a full-width banner restores the correct overlap.
7. Split a document with a database and check folder headers standalone. Expected: shared cover/icon alignment remains correct and database controls stay accessible.
8. Enable reduced motion and repeat split/merge, then switch between ordinary tabs and existing split groups. Expected: no stale notch or icon offset after either immediate or animated placement.

Suggested commit: `fix(navigation): keep cover icon cutouts aligned in split panes`

Remain in Phase 5 for manual review.
