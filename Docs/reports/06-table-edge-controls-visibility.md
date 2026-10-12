# Editor review fix — Table edge controls

Date: 2026-10-10. Implemented within the current CodeMirror editor review; manual acceptance is pending.

## Changes

The table's row and column buttons previously sat outside the block bounds, separated by a 5 px gap. Crossing that gap could end hover and hide both buttons. Full-width tables could also place the column control beyond the available content width. The controls' overlay included the secondary options toolbar, affecting alignment when options were open.

A dedicated table frame now reserves 27 px at the bottom and inline end for the buttons and their gaps. This space remains within the block's hover area. The scrolling table stays within the remaining width, and the overlay surrounds the table rather than the secondary actions toolbar. Existing hover and focus-within visibility rules keep both buttons visible while hovering the block, selecting its surface, or editing a cell. Logical inline positioning supports RTL.

This fixes existing behavior using the existing DOM/CSS controls. No new feature or dependency was introduced. There are no migrations or persistent-format changes. No commit was created.

## Validation

- Targeted `npx vp fmt`: passed for both changed source files.
- `npm run types:check`: passed.
- `npm run lint`: passed; 368 files formatted correctly, 301 files linted without warnings or errors.
- `npm run build`: passed in 8.32 seconds; chunk-size, mixed static/dynamic import, and plugin-timing warnings remain.
- `git diff --check`: passed before this report was added; repeated after adding it.
- Automated tests were neither written nor run, as instructed. Browser verification is pending with the user.

## Manual test checklist

1. Reload Orbium and open a disposable document containing a table in Live Preview. Hover any cell or the table block's blank surface. Expected: both bottom Add row and side Add column buttons appear.
2. Slowly move from the table across the gap toward each button, then click it. Repeat several times. Expected: both buttons stay visible across the gap; each click adds exactly one final row or column.
3. Click a cell and move the pointer outside the table. Type and navigate with Tab/Shift+Tab. Click the block's blank surface and move the pointer away again. Expected: both controls remain visible while a cell or the block has focus. Click a paragraph elsewhere and leave the table; expected: controls hide.
4. Open Table options and add a row/column with the edge buttons. Expected: controls stay aligned with the table and do not extend over the options toolbar.
5. Make the table wider than the document pane, horizontally scroll it, and resize the pane. Repeat in a narrow split pane and with an RTL table. Expected: the column control remains beside the visible table edge, on the logical end side; the table scrolls without clipping the controls.
6. Undo/redo additions, wait for Saved, and reload. Expected: table structure and contents persist correctly. For merged cells, structural controls retain the existing disabled state until cells are split.

## Suggested commit

`fix(editor): keep table edge controls visible on hover and focus`

## Stop gate

Continue manual review within the current editor phase. Do not begin another phase without explicit approval.
