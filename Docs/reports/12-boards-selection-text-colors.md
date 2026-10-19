# Boards — Selection text colors

2026-10-19. Requested refinement within Boards phase-4 manual review.

## Implemented

- Removed alignment/direction from native text-selection formatting. Their dedicated buttons remain in the block toolbar for text, headings, quotes and callouts.
- Added the shared Document text-color picker to native selection formatting, including preset colors, the custom spectrum and Default text color reset. The picker captures a selection bookmark so its inputs can take focus without losing the target text. Changes enter Board action history and respect disabled editing.
- Installed the existing `TextColor` mark in native Board editors and retained its attributes in the native inline serializer. Read-only previews render the same theme-aware preset tokens or custom six-digit hex colors. This covers native text, headings, quotes, callouts, list items and table cells.
- Extended client/server inline validation to accept `textColor` with a supported preset token or six-digit hex value. Server mark attributes remain restricted by mark type; arbitrary CSS/color values are rejected.

No dependencies, migrations or commits. Native content version 1/spatial version 4 remain; `textColor` is an additive supported inline mark. Existing Boards continue to load. A previous server rejects saves containing the new mark, so client and server must be deployed together; do not downgrade while relying on colored Board content. No data rewrite or older-format adapter change.

## Validation

- Targeted `vp fmt`: passed for all nine changed TypeScript source files.
- PHP syntax check: passed for `app/Services/Boards/BoardBlockData.php`.
- Targeted `pint --test`: passed (format verification only).
- `npm run types:check`: passed, exit 0.
- `npm run lint`: passed, exit 0; 647 formatted files and 542 linted files without warnings/errors.
- `npm run build`: passed, exit 0; existing mixed-import, chunk-size and plugin-timing notices remain.
- `git diff --check`: passed.

Logs: `/tmp/orbium-toolbar-color-{types,lint,build,php,pint}.log`. No automated tests written or run, per user instructions. Browser appearance, selection/focus and persistence acceptance remain manual.

## Manual checklist

1. Select a text block without selecting text. Expected: alignment and direction remain in the block toolbar and work as before. Enter editing and select a word: selection formatting has a Text color button and no alignment/direction controls.
2. Apply Red, Blue and Violet to separate words. Expected: only the intended selection changes; surrounding text and existing bold/italic/link marks remain. Finish editing: the preview preserves colors.
3. Select colored text and open the picker. Expected: current color is indicated. Adjust the custom spectrum repeatedly: selection stays targeted, picker stays usable and custom colors update. Choose Default text color: the explicit color is removed.
4. Repeat in a heading, quote, callout, list item and table cell. Expected: colors survive editing/preview transitions and subsequent typing.
5. Undo/redo color changes, wait for Saved and reload. Expected: action history restores changes and the saved colors persist after reload.
6. Repeat in light/dark modes. Expected: preset colors follow shared Document theme colors; custom hex colors remain explicit. Check keyboard menu navigation, Escape, narrow windows and canvas-edge placement.
7. Rapidly select/deselect text and switch blocks while the picker is open. Expected: no stranded picker, stale editor action or block-toolbar overlap. Enable reduced motion: visibility remains immediate.

## Commit suggestion

`feat(boards): add selection text colors and keep layout controls on blocks`

Remain in Boards phase-4 manual review.
