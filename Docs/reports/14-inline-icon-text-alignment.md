# Inline icon text alignment — 2026-10-28

## Changes

Within the current inline-icon review, the supplied Mind Map screenshot showed artwork sitting below adjacent text. Shared inline icons now use `vertical-align: middle`, aligning their box center to the surrounding font's x-height center rather than depending on the baseline of the transparent selection character inside the box. Removed the Mind Map-specific negative baseline offset so editing and preview use the shared alignment. Existing icon sizes and text-selection behavior remain intact.

No migration, persisted-format change or commit was made.

## Validation

- `npm run lint`: passed; formatting passed for 861 files, no warnings/errors across 692 linted files.
- `npm run types:check`: passed.
- `npm run build`: passed in 18.13 seconds; large-chunk, ineffective dynamic-import and plugin-timing warnings remain.
- `git diff --check`: passed.

No automated tests or browser automation were run. Visual acceptance remains manual.

## Manual checklist

1. Fully reload the app, open the Mind Map from the screenshot and inspect the icon beside its text. Expected: the icon is vertically centered alongside the text in the topic preview.
2. Edit that topic, move the caret around the icon, then finish editing. Expected: the same vertical alignment in editing and preview, with no vertical jump.
3. Add built-in, brand and custom-image icons between words in a paragraph and heading; repeat in Board text and a Document. Expected: artwork centers alongside the surrounding text at each font size.
4. Wrap the text onto multiple lines and change Mind Map zoom. Expected: each icon stays aligned with its own text line.
5. Drag-select words and an icon, apply a text color, then save/reload. Expected: one continuous selection, vector icons inherit the selected color, and alignment remains stable after reload.

## Suggested commit

`fix(editor): align inline icons with surrounding text`

Remain in the current inline-icon review.
