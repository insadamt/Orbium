# Phase 5 review — Wide Gallery card spacing

Date: 2026-10-14. User-reported Gallery layout correction; no phase advancement.

## Changed

- Removed the explorer Gallery card's 210px minimum height. Uniform 11:3 and 5:2 previews can now produce compact cards with the existing title padding rather than an empty area beneath the title.
- Aligned explorer Gallery cards to the start of each row so neighboring cards cannot stretch their height.
- Removed the redundant natural-layout minimum-height override. Workspace-root and folder Galleries share the corrected styles.

## Validation

- `npm run types:check` — passed.
- `npm run lint` — passed, including formatting validation (455 formatted files; 372 linted files).
- `npm run build` — passed, with large-chunk and ineffective dynamic-import warnings.
- `git diff --check` — passed.
- No automated tests were written or run, per user instructions. Browser appearance remains pending manual review.

## Manual test checklist

1. Open a workspace-root Gallery. Open Gallery appearance, select Uniform, and select 11:3. Expected: the preview has the selected wide shape and the card ends just beneath the title's normal padding, with no large empty area underneath.
2. Switch to 5:2. Repeat both ratios in a folder Gallery, with covered and uncovered items. Expected: cards follow the selected preview ratio and stay compact; uncovered items show their type icon.
3. Try Show whole and Crop to fill, then refresh. Expected: each image fit works as before, and the saved ratio persists with compact cards.
4. Switch to 16:9, 1:1, and Natural masonry with mixed cover ratios. Expected: previews retain their proportions, titles remain visible, and cards do not overlap or stretch to match neighboring cards.
5. Repeat at a narrow viewport and in a split pane. Open a card, use its actions menu, and reorder cards. Expected: cards remain compact and all interactions work.

## Commit suggestion

`fix(gallery): remove excess space below wide-ratio card titles`

No commit created. No migrations or persistent format changes.
