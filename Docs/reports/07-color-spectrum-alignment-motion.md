# Color spectrum, image controls and alignment motion

Phase 7 review — 2026-10-15.

## Implemented

- Replaced the two-column named color list with a saturation/brightness plane, hue slider, editable hex field with preview, one row of preset swatches and a Default action. The picker retains the shared surface and menu reveal. Spectrum dragging previews locally and applies on release; hue and keyboard changes apply directly. Hex values apply on Enter or blur; malformed values revert.
- Kept color-picker keyboard input local to the picker so spectrum arrows and Hex editing cannot trigger the text toolbar navigation.
- Standardized every image toolbar button/link to the original compact 28px hit area. The Markdown download anchor now has the same padding, dimensions and rounded hover area as its neighboring buttons, without a link underline.
- Added a 260 ms horizontal transition for explicit left/center/right image alignment and supported text-block alignment. Text measures its rendered contents instead of its full-width block box. Image motion moves its figure, toolbar and caption together. Markdown and legacy JSON/Tiptap commands share this behavior.
- Separated Markdown image physical alignment margins from logical Start margins so transitions among left/center/right stay consistent and Start still follows inherited RTL, including on initial mount.
- Alignment edits still apply immediately to editor state and autosave. Playback is visual only, preserves positioning transforms and cancels on editing, pointer input or wheel scrolling. OS reduced motion applies the final alignment immediately.

## Scope and compatibility

No new alignment options for unsupported block types, migrations or persisted format changes. Undo/redo and imported alignment retain normal immediate rendering. No commits created. This change stays within Phase 7; no later phase was started.

## Validation

- Changed-source formatting/lint: PASS. An initial floating-promise lint warning in the motion helper was corrected before final checks.
- `npm run lint`: PASS; 497 files formatted and 409 source files linted without warnings/errors.
- `npm run types:check`: PASS.
- `npm run build`: PASS, 12.14 seconds; existing large-chunk, overlapping-import and plugin-timing warnings remain.
- `git diff --check`: PASS.

No automated tests written or run, per user instructions. Browser visual and interaction acceptance remains pending manual review.

## Manual checklist

1. Select document text and open Text color. Expected: one spectrum panel, a hue strip, hex field, seven compact circular presets and a Default action; the toolbar keeps its original design.
2. Drag around the spectrum and release, then adjust hue. Expected: the preview/thumb follow input and only the captured text selection receives the chosen color. Dragging commits on release. Reopen: the selected custom color is restored.
3. Enter `#336699` in Hex and press Enter; try another valid value and blur. Enter malformed text. Expected: valid values apply and update the preview; malformed input reverts without changing text color. Escape in Hex restores its displayed value.
4. Choose every preset and Default. Expected: preset colors and checks agree, Default clears the authored color, and the adaptive violet/yellow preset keeps its existing theme behavior.
5. Navigate with keyboard: focus the spectrum and use arrows (Shift for larger steps), adjust hue with arrows, edit Hex and choose presets with menu navigation. Expected: controls remain usable and the editor selection is preserved. Repeat spectrum dragging with touch if available.
6. Select an image and hover alignment, fill, download, replace and delete actions. Expected: each action has the same 28px hit/hover area; Download is centered with matching padding and still downloads the image.
7. Use an image narrower than the editor. Change left → right → center → left → center → right. Expected: the image visibly travels between its real old and final positions, with caption and toolbar following. Image size stays unchanged. A full-width image has no horizontal distance to animate.
8. Use a short paragraph and heading. Change their block-menu text alignment through the same sequence. Repeat with multiline/wrapped text and RTL. Expected: content slides horizontally toward the selected alignment, finishes at the correct position and stays editable; surrounding blocks do not move sideways.
9. During movement, type, click elsewhere, wheel-scroll or choose another alignment. Expected: the transition clears to a clean final layout with no stuck transforms, lost content or permanent opacity changes.
10. Wait for Saved and reload. Expected: text color and final alignment persist; image width/caption remain intact. Undo/redo: expected normal content history, without extra motion-only entries.
11. Repeat in light/dark, Normal/Frosted, narrow/split documents and at browser zoom. If available, repeat in a legacy JSON/Tiptap document. Expected: readable controls, independent pane behavior and correct final positions.
12. Enable OS reduced motion and change alignment. Expected: immediate placement with all color/image actions still available.

## Commit suggestions

- `feat(editor): add spectrum color picker and alignment transitions`
- `fix(editor): match image download hover to toolbar buttons`
