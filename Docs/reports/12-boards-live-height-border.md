# Boards — Live automatic height border

2026-10-19. Phase-4 review repair, requested because height borders only adjusted after pointer release.

## Implemented

Resize previews now paint width/surface scale, measure the resulting content height, and paint that height during the same scheduled pointer frame. The selection border and resize handles follow wrapping while dragging. North corners retain the opposite bottom edge within coordinate bounds. Pointer release commits the measured preview as one resize action; cancellation restores original geometry. Image crop frames and dividers retain their existing behavior.

The passive content observer intentionally avoids persistent updates during resize. Previously, live pointer painting kept the old height until that observer resumed after release. The new focused preview helper measures without saving or updating React state during the gesture.

## Commits / compatibility

No commit created. Suggested message: `fix(boards): update automatic height borders during resize`.

No migration, API or persisted-format changes. Existing unrelated working-tree changes were preserved. Remain in phase-4 manual review; no later phase started.

## Actual validation

- Targeted formatting: passed.
- `npm run types:check`: passed, exit 0.
- `npm run lint`: passed, exit 0; 639 formatted files and 536 files without warnings/errors.
- `npm run build`: passed, exit 0; 19.82 seconds, with existing chunk-size/mixed-import/plugin-timing notices.
- `git diff --check` and explicit changed-source/report whitespace scan: passed.
- Source sizes: preview helper 40 lines, pointer controller 478 lines.

Logs: `/tmp/orbium-live-height-types.log`, `/tmp/orbium-live-height-lint.log`, `/tmp/orbium-live-height-build.log`.

No automated tests written or run, per user instructions. No browser verification performed by the agent; pointer behavior requires manual acceptance.

## Manual checklist

1. At 100% zoom, create a paragraph with several sentences. Hold and drag its east/west width handle slowly inward and outward without releasing. Expected: the height border and bottom corners grow/shrink as text wraps during the drag, with no delayed jump on release.
2. Repeat with a heading, list, multiline table, code block and linked Document summary. Expected: border follows current content height throughout dragging, within the existing minimum/maximum size bounds.
3. Drag each corner on a content block. Expected: content and border scale together during the drag; north corners keep the opposite bottom edge anchored within bounds.
4. Start a width resize, then press Escape before release. Expected: original width, height and position restore. Repeat with a corner, then pointer cancellation if available.
5. Finish a resize, undo once and redo once. Wait for Saved and reload. Expected: each resize is one history action; restored width/scale and content-derived height match the completed gesture.
6. Repeat width and corner cases at 50% and 200% camera zoom. Expected: border and content remain aligned while dragging. Repeat an image crop/scale: its saved-frame behavior remains usable.

## Limits

Existing geometry bounds, media viewports and possible overlap with fixed neighbors remain. Content measurement performs a layout read after applying width/scale, limited to the active resize preview and scheduled once per animation frame. Very large content still needs manual responsiveness review.
