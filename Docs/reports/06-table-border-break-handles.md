# Editor review — Border-break table handles

Date: 2026-10-14. Visual refinement within the current editor review.

## Changes

Table handles now follow the requested `----- - -----` pattern: a short 8-by-1-pixel center mark, with a 4-pixel interruption in the border on either side. Row handles use the same pattern vertically. The marks align with the existing one-pixel table border; transparent hit areas preserve clicking and dragging. Updated the editor specification. No dependencies, migrations, persistent-format changes or commits.

## Validation

- `npm run lint`: passed, including formatting.
- `npm run types:check`: passed.
- `npm run build`: passed; existing build warnings remain.
- `git diff --check`: passed.
- No automated tests written or run. Visual acceptance remains pending manual verification.

## Manual test checklist

1. Reload a Markdown table in Live Preview and hover it. Expected: each column handle looks like a short border segment with a small gap on either side (`----- - -----`), without a filled button background.
2. Inspect a row's leading border. Expected: the same interrupted-border pattern vertically. Repeat in light/dark and Normal/Frosted appearances.
3. Click a mark and then drag a row/column using its surrounding hit area. Expected: menus, lifted drag preview, neighbor movement and settling continue working. Check RTL and a narrow split pane for alignment.

## Suggested commit

`style(editor): integrate table handles into interrupted borders`

Remain in the current editor review; do not start another phase without explicit approval.
