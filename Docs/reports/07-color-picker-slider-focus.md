# Color picker slider focus repair

Phase 7 review — 2026-10-15.

## Cause and fix

Markdown color formatting always called `view.focus()` after a source update. Each hue-slider change therefore focused the editor outside the dropdown, dismissing the picker before the old input-refocus workaround could run.

- Added an explicit formatting focus option, defaulting to the existing editor-focus behavior.
- Color changes that keep the picker open now update the captured text range without moving focus away from the hue slider, spectrum or hex input.
- Removed the focus-away/focus-back workaround. Presets, Default and normal formatting still use the normal editor-focus behavior.
- Disabled touch panning on the hue input so swiping it adjusts hue without beginning page scrolling.

No migrations, persisted format changes or commits. Existing opaque-background edits were preserved. This remains within Phase 7.

## Validation

- Scoped formatting/lint: PASS.
- `npm run lint`: PASS; 497 files formatted and 409 source files linted without warnings/errors.
- `npm run types:check`: PASS.
- `npm run build`: PASS; existing large-chunk, overlapping-import and plugin-timing warnings remain.
- `git diff --check`: PASS.

No automated tests written or run, per user instructions. Browser gesture acceptance remains for manual review.

## Manual checklist

1. Select a sentence, open Text color and drag the hue slider slowly from end to end, then back. Expected: the picker stays open throughout the drag, the thumb follows input and only the captured sentence changes color.
2. Continue dragging outside the slider's horizontal bounds and release, then make another adjustment. Expected: dragging does not dismiss the picker; it remains usable afterward.
3. Repeat several swipes on touch if available. Expected: hue changes without scrolling the page or closing the picker.
4. Adjust the saturation/brightness plane, including its arrow-key controls; edit Hex and apply a valid value with Enter. Expected: color updates keep the picker open and focus stays in its controls.
5. Choose a preset or Default. Expected: the choice applies and the picker closes normally. Reopen and click outside, then reopen and use Escape from the menu: expected normal dismissal.
6. Apply Bold, Underline and a link after closing the picker. Expected: their existing editing/focus behavior remains intact.
7. Repeat in split documents and a table-cell text editor. Expected: the owning editor's captured selection changes; other panes/cells remain unchanged. Check a legacy JSON/Tiptap document if available: its existing picker behavior remains usable.
8. Wait for Saved and reload. Expected: the chosen text color persists.

Suggested commit: `fix(editor): preserve color picker focus while dragging hue slider`
