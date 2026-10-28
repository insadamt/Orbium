# Continuous inline icon highlight — 2026-10-28

This report records the screenshot selection correction within the existing inline-icon review. Shared icon styles depend on the surrounding editor's font metrics, transparent selection character and native selection decorations. Mind Map styles retain larger artwork through a size variable.

## Changed

The icon used a fixed artwork-height box, middle alignment, rounded corners and outside margins. Its selected background appeared as a separate small rectangle beside the full-height text highlight.

Inline icon containers now inherit text line height and baseline, with automatic height. Internal padding preserves spacing while including it in the highlight. Artwork remains centered at its existing size. Mind Map overrides change artwork size without forcing a short container. Separate selection rounding is removed.

No content format, migration, dependency or icon interaction changes. Existing unrelated home explorer work is preserved. No commit was created.

## Actual checks

- `npm run lint`: passed, including formatting (863 files) and lint (694 files).
- `npm run types:check`: passed.
- `npm run build`: passed in 20.39 seconds; existing large-chunk and ineffective dynamic-import warnings remain.
- `git diff --check`: passed.
- No automated tests, Playwright or browser automation were run. Visual acceptance remains manual.

## Manual checklist

1. Fully reload, edit the Board text from the screenshot and select the complete paragraph including its final icon. Expected: the icon highlight joins the text highlight at the same line height, without a small rounded selection box or spacing gap.
2. Drag forwards and backwards over `before [icon] after`, then select with Shift+Arrow. Expected: one continuous range; deselecting clears the highlight and clicking the icon opens no picker.
3. Repeat with adjacent icons, wrapped line endings, headings, brands and custom images. Expected: artwork retains its size and aligns with its text line; selected spacing is highlighted.
4. Repeat in a Mind Map topic, a Document and a Board table cell, in Light and Dark themes. Expected: normal mixed-range selection; Mind Map artwork remains larger without a shorter highlight box.
5. Color a mixed text/vector-icon range, undo/redo, wait for Saved and reload. Expected: both change color together, undo/redo works, and saved icon identity and formatting remain intact.

## Suggested commit

`fix(editor): join inline icon highlights with text selection`

Remain in the current inline-icon review pending manual acceptance.
