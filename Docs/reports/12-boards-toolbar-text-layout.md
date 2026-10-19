# Boards — Toolbar alignment and text direction

2026-10-19. Requested refinement within Boards phase-4 manual review.

## Implemented

Added dedicated Text alignment and Text direction icon/menu buttons for text, heading, quote and callout blocks. They appear in the selected-block toolbar and native text-selection formatting toolbar. Alignment offers Left, Center and Right; direction offers Automatic, Left to right and Right to left. Trigger icons reflect the current value and menus mark the selected choice.

Moved these options out of the nested Text style menu. Both toolbar locations share a focused component and use existing `align`/`dir` block data, save validation and action history. Changes affect the whole block and preserve inline content/marks. List/table and non-writing blocks retain their existing controls. The controls use shared app menus, keyboard navigation, collision handling, disabled states and Board tooltips. Native editor selection/content is not replaced by a layout change.

No dependencies, migrations, persisted-format changes or commits. No later phase started.

## Validation

- Targeted `vp fmt`: passed for all six changed source files.
- `npm run types:check`: passed, exit 0.
- `npm run lint`: passed, exit 0; 646 formatted files and 541 linted files without warnings/errors.
- `npm run build`: passed, exit 0; existing mixed-import, chunk-size and plugin-timing notices remain.
- `git diff --check`: passed.

Logs: `/tmp/orbium-toolbar-layout-{types,lint,build}.log`. No automated tests written or run, per user instructions. Browser visual/focus acceptance remains manual.

## Manual checklist

1. Select a text block, heading, quote and callout. Expected: separate alignment and text-direction buttons beside Text style, with icons reflecting current values.
2. Choose Left, Center and Right. Expected: the entire block's text aligns immediately; reopening marks the current option.
3. Enter mixed Arabic/English text and choose Automatic, Left to right and Right to left. Expected: block direction changes independently of alignment; content stays intact.
4. Enter editing and select a phrase. Expected: the text-formatting toolbar includes the same buttons while block controls remain hidden. Change layout, then apply Bold or a link. Expected: layout changes the whole block; formatting still targets the retained selection.
5. Undo/redo layout changes, wait for Saved, reload and reselect. Expected: layout participates in Board history and saved values persist.
6. Open both menus using keyboard, choose with arrows/Enter, and dismiss with Escape. Expected: current-choice checks, usable focus and normal menu dismissal. Repeat near canvas edges and in a narrow window.
7. Deselect/reselect rapidly and repeat under reduced motion. Expected: existing pop behavior and immediate reduced-motion changes; no More-only strip regression.

## Commit suggestion

`feat(boards): add toolbar alignment and text direction controls`

Remain in Boards phase-4 manual review.
