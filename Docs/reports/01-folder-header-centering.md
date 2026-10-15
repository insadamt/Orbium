# Folder header centering

## Change

Removed the folder-specific left-margin override so folder covers and titles use the shared centered, maximum-width header. This also applies to nested folders. Existing cover proportions and responsive side/stacked arrangements remain in place. This supersedes the folder alignment guidance in `cover-content-alignment.md`.

## Validation

- `npm run lint`: passed, including formatting; no warnings or lint errors.
- `npm run types:check`: passed.
- `npm run build`: passed with large-chunk and ineffective dynamic-import warnings.
- `git diff --check`: passed.
- Automated tests: not written or run, per project instructions.
- Browser appearance awaits manual review.

## Manual checklist

1. Open a folder, then open a folder inside it.
   - Expected: each cover/title header is centered horizontally in the available page area.
2. Switch the nested folder between Grid, List, and Gallery.
   - Expected: the header stays centered in each view.
3. Try a wide cover, a square cover, and a portrait cover.
   - Expected: the header remains centered while retaining existing cover proportions and side/stacked layouts.
4. Narrow the window or open the folder in a narrow split pane.
   - Expected: the header fits without horizontal overflow and uses its existing stacked layout when narrow.

## Commit suggestion

`fix(hierarchy): center folder cover and title headers`

No commit, migrations, dependencies, or persisted-data changes. No phase advancement.
