# Boards — Select-style toolbar motion and Add menu

2026-10-19. Requested refinement within Boards phase-4 manual review.

## Implemented

The title toolbar now reuses Select's shared GSAP hover/focus highlight. It glides across enabled tool/history controls and separators, respects reduced motion, and releases its observers/listeners on unmount. Active tools retain their accent/indicator styling. The persistent toolbar does not replay an entrance on hover.

Replaced Add's two-column descriptive grid with a compact single-column menu, grouped into Writing, Media and Technical. Each action has an icon/name, and the current placement tool has a check. All block types and Link page/create Document remain available. The Add trigger now has a readable Add label and animated chevron; when a non-text placement tool is active it shows that tool's icon/name. The menu uses the same shared animated surface/highlight as AppSelect. Linear order matches Up/Down navigation and typeahead; groups retain separators without interrupting highlight travel. Menu height follows available viewport space and scrolls; coarse-pointer rows are at least 42px.

Placement still returns focus to the canvas after choosing a type; dismissing without choosing returns to Add. Editing/upload/save restrictions and resource-picker focus ownership remain. No persistence, backend, dependency or migration changes. No commits created for this follow-up; concurrent table work remains intact. No later phase started.

## Validation

- Targeted `vp fmt`: passed for all five changed source files.
- `npm run types:check`: passed, exit 0.
- `npm run lint`: passed, exit 0; 650 formatted files and 545 linted files without warnings/errors.
- Final scoped `vp check`: passed after the last trigger/chevron refinement.
- Final `npm run build`: passed, exit 0; existing mixed-import, chunk-size and plugin-timing notices remain.
- `git diff --check`: passed.

Logs: `/tmp/orbium-toolbar-select-polish-{types,lint,scoped-lint,build}.log`. No automated tests written or run, per user instructions. Browser visual/focus acceptance remains manual.

## Manual checklist

1. Hover slowly and quickly across Select, Hand, Text, Add, Undo and Redo. Expected: one gliding hover highlight, continuous across the separator; disabled controls are skipped and active-tool indication stays readable.
2. Open Add with pointer and keyboard. Expected: compact grouped list, eased shared menu entrance/exit, rotating trigger chevron and clear icon/name rows. Move across groups/separators: the highlight travels continuously.
3. Choose Heading, Image, Table, Code, Math and Diagram in turn. Expected: Add shows the chosen icon/name until placement or cancellation; reopening marks the active placement tool. Click the canvas or press Enter to place: the correct block appears and the tool returns to Select.
4. Use Up/Down, Home/End, typeahead, Enter and Escape. Expected: linear predictable item navigation; Escape returns focus to Add; choosing a placement type keeps canvas keyboard placement usable.
5. Choose Link page or create Document. Expected: the existing resource picker owns focus; no restoration to Add interrupts it. Editing a block disables placement controls with the existing explanatory tooltips.
6. Repeat near screen edges and at narrow/short window sizes. Expected: viewport-bounded menu, accessible scrolling, wrapped title toolbar and reachable touch targets.
7. Repeat in light/dark, Normal/Frosted and reduced motion. Expected: readable shared surfaces; immediate highlight/chevron/menu changes with reduced motion and no duplicate lingering controls.

## Commit suggestion

`style(boards): animate toolbar highlights and simplify add menu`

Remain in Boards phase-4 manual review.
