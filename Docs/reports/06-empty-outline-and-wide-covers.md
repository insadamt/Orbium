# Editor review — Empty outlines and 11:3 page covers

Date: 2026-10-13. User-requested refinement within the current review; no phase advancement.

## Changes

- Hide the outline rail and panel when there are no H1/H2 headings, in Markdown and legacy rich-text documents. Heading subscriptions remain active so adding a heading restores the rail. Removing the last heading resets hover, focus and pin state and cancels pending navigation.
- Remove Document outline, Find in document and Add file from the Markdown document actions menu. Remove the corresponding Find and Add file buttons from the legacy editor header. Existing find shortcuts and attachment insertion flows remain available.
- Display uploaded covers on document, folder and database/table pages in full-width 11:3 frames with centered fill cropping. Existing covers use this frame as well; their stored images and crop metadata are preserved.
- Add 11:3 to shared crop/Gallery choices and all four server validation endpoints. New cover crops default to 11:3 and export at 1320 × 360 pixels. Eight ratio choices use one row on wide screens and two rows of four on narrow screens.
- Gallery keeps its existing appearance defaults and saved settings; 11:3 is an additional uniform ratio choice. Natural Gallery continues to use stored crop metadata.
- Update editor and UI documentation. No migrations, dependencies, commits or pushes.

## Validation

- Targeted `npx vp fmt`: passed.
- `./vendor/bin/pint --test`: passed (formatting check only).
- `npm run types:check`: passed.
- `npm run lint`: passed; 409 formatted files, 339 linted files, no warnings/errors.
- `npm run build`: passed; existing large-chunk and ineffective-dynamic-import warnings remain. Log: `/tmp/orbium-cover-outline-build.log`.
- `git diff --check`: passed.
- Automated tests were neither written nor run, per user instructions. Browser/manual acceptance is pending.

## Manual test checklist

1. Open an empty document, a plain-text document and one containing only H3–H6 headings. Expected: no contents rail, placeholder marks or outline panel.
2. Add an H1 or H2. Expected: the rail appears after the short update debounce; hover, pin and heading navigation work. Pin the panel and remove the last H1/H2. Expected: rail and panel disappear. Add another H1/H2; expected: the rail returns without an automatically pinned panel.
3. Repeat in split panes and an available legacy JSON/Tiptap document. Expected: visibility follows each document independently, including a restored iframe pane.
4. Open the document actions menu. Expected: Import document, Export and Source/Live Preview remain; Document outline, Find in document and Add file are absent. Try Ctrl/Cmd+F and an existing attachment insertion action. Expected: find and attachment insertion still work. On a legacy document, expected: no Find/Add file header buttons.
5. Add or replace a cover on a document, folder and database/table page. Expected: crop opens with 11:3 selected and 1320 × 360 output. Drag, zoom and save, then refresh. Expected: crop persists and the page cover remains 11:3, with icon overlap/cutout and title intact.
6. Open older covers and upload a portrait crop using another supported ratio. Expected: all page headers remain 11:3, fill their available width, and center-crop without stretching. Resize and use split panes; expected: cover geometry adapts without overflow. Cancel a replacement; expected: original cover remains.
7. Open workspace-root, folder and database Galleries. Select Uniform and 11:3; try Show whole and Crop to fill. Expected: 11:3 previews, correct fitting and persistence after refresh. Switch to Natural; expected: saved image proportions return.
8. Try the remaining crop/Gallery ratios and remove a cover. Expected: existing ratio choices still save and Gallery settings work; removing a cover returns the optional-cover page layout.

## Known limitations

Page frames center-crop images saved with other aspect ratios, so some image content can be outside the visible header. The stored file and Gallery ratio metadata are not rewritten. Covers remain optional; pages without an uploaded cover do not acquire a placeholder image.

## Suggested commits

- `fix(editor): hide empty outlines and simplify document actions`
- `feat(covers): standardize page headers at 11:3 and add crop ratio`

Remain in the current review pending the user's manual feedback.
