# Slash-command Library picker type restrictions

Date: 2026-10-13. Current Library review; no phase advancement.

## Implemented

- `/file` opens a non-image-only Library picker; `/image` retains an image-only picker.
- Restricted picker requests to their type during search, sort, refresh, and pagination. Removed type tabs from restricted pickers and guarded selection against the opposite type.
- Retained the main Library's All/Images/Files browsing and existing cover/icon image-only pickers.
- No migrations, dependencies, or persistent format changes. No commits created.

## Validation

- `npm run types:check`: passed.
- `npm run lint`: passed formatting and lint checks after correcting formatting in the gallery hook.
- `npm run build`: passed with existing large-chunk and ineffective-dynamic-import warnings.
- `git diff --check`: passed.
- No automated tests written or run, per user instructions. Manual runtime acceptance is pending.

## Manual checklist

1. Use a workspace with PNG/JPEG/GIF/WebP images and PDF/text/archive uploads. In a Markdown document, run `/file`. Expected: only non-image files appear; there are no type tabs to switch to images.
2. Run `/image`. Expected: only supported images appear, with no All or Files tab.
3. In each picker, search, change sorting, and refresh; use Load more if enough matching uploads exist. Expected: every result remains the requested type and the count reflects that type.
4. Choose a file from `/file` and click Use file; choose an image from `/image` and click Use image. Expected: the appropriate attachment/image is inserted, saved, and retained after refresh.
5. Search for an image-only filename in `/file`, then a file-only filename in `/image`. Expected: no matching results rather than cross-type entries. Cancel and reopen: each command retains its own type restriction.
6. Open the main Library. Expected: All, Images, and Files tabs remain available, with both types visible under All. Cover/icon Library pickers still list images only.

## Commit suggestion

`fix(library): restrict slash pickers to images or files`
