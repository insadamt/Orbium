# Toolbar review correction and color picker redesign

Phase 7 review — 2026-10-15.

## Changes

- Restored original text/image button padding, corners, colors and active backgrounds. Removed the new inset active markers, forced button dimensions and added Markdown image separators.
- Replaced creation-time CSS reveal with a visibility-driven 200 ms fade/scale animation. Markdown text toolbars wait for CodeMirror's positioning callback; hidden image and legacy text toolbars reveal on becoming visible again. Positioning transforms remain owned by the editor. Animation and observers are cleaned up when toolbars unmount.
- Retained Select's shared moving hover highlight and image keyboard navigation. Toolbar gaps now retain the bar so crossing the spaces between buttons animates its travel instead of hiding and restarting it. Other menus keep their existing behavior. Explicitly hide image controls carrying the `hidden` attribute.
- Rebuilt the color picker as a compact two-column list with small circular color dots, readable labels and a selection check. Default is a first-class choice; custom color lives in a separate footer with a compact native control and the selected hex value.
- Scoped color-option sizing independently of global menu item dimensions. The menu retains shared frosted appearance, opening motion, keyboard selection and viewport collision handling.
- OS reduced motion disables toolbar reveal and highlight travel.

No migrations, persisted-format changes or commits. Document-property expand/collapse motion is preserved.

## Validation

- Changed-source formatting/lint: PASS.
- `npm run lint`: PASS; 494 files formatted and 406 source files linted without warnings/errors. The subsequent hover-gap correction also passed scoped formatting/lint.
- `npm run types:check`: PASS after the final hover-gap correction.
- `npm run build`: PASS after the final hover-gap correction; existing warnings for large chunks, overlapping static/dynamic imports and plugin timings remain.
- `git diff --check`: PASS.

No automated tests written or run, per user instructions. Browser visual and interaction acceptance remains pending manual review.

## Manual checklist

1. Reload and select text in a Markdown document. Expected: the original toolbar button style returns, without inset markers or increased rounding; the toolbar fades/scales in after it is positioned.
2. Move slowly and quickly between Bold, Italic, Underline, Strike, Code, Link and Color, pausing over each. Expected: one highlight travels between controls, remains visible after settling and does not leave a second hover background on inactive buttons.
3. Apply/toggle formatting and a link. Expected: only the intended selected text changes; active buttons retain the original filled background.
4. Open Text color. Expected: a compact two-column menu with labeled dots and one current-choice check, no oversized colored blocks, and a distinct custom-color footer.
5. Choose each preset with pointer and keyboard, then Default. Expected: the captured text selection updates, reopening marks the current color and Default removes the authored color. Violet adapts to yellow in dark mode as before.
6. Pick a custom color and adjust it repeatedly. Expected: the selected range changes, the picker remains usable and the footer shows the custom hex value.
7. Select, dismiss and reselect an image; try alignment, fill width, resizing and download. Expected: original image toolbar styling, reveal on each opening, moving hover highlight and unchanged image actions. Deselection hides the toolbar.
8. Reopen text and image toolbars several times and switch document tabs/split panes. Expected: no stale hover bars, duplicate controls, initial offscreen reveal or stuck opacity.
9. Repeat in light/dark and Normal/Frosted modes, narrow viewports and near document edges. Expected: readable color labels, an on-screen picker and independent toolbar/picker highlights.
10. Enable OS reduced motion. Expected: immediate reveal and highlight positioning; all formatting, color and image actions still work.
11. If available, repeat toolbar opening and color selection in a legacy JSON/Tiptap document. Expected: the original styling and the same corrected reveal/color picker.

## Commit suggestions

- `fix(editor): restore toolbar styling and repair reveal timing`
- `feat(editor): redesign text color picker with compact labeled choices`

This remains within the requested Phase 7 review; no later phase was started.
