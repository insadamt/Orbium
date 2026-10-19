# Boards — Zoom rendering clarity

2026-10-19. Phase-4 manual review repair. The user requested a fix for poor resolution when zooming out and in for all blocks.

## Implemented

- Camera painting uses native CSS layout zoom instead of a transformed world scale. Position offsets are divided by camera zoom to preserve the existing world-to-screen mapping. This lets DOM text, tables, code, vector diagrams/math and resource surfaces render at their effective display scale rather than enlarging a cached world layer.
- Removed the world's persistent `will-change: transform` layer hint and transform origin. An explicit `z-index: 0` preserves its stacking context so object layers do not overtake Board chrome. Per-block whole-surface scale remains in place and composes with camera zoom.
- PDF raster density now includes actual displayed scale, measured from display width versus logical width. Device density remains capped at the existing 2× factor before display scaling, and the existing 8,388,608-pixel page budget remains.
- Added a focused PDF display-density helper. It watches Board world/object style changes, debounces zoom/resize updates and only requests a raster replacement when density actually changes. Panning alone does not rerender the page. Loading/relocation refreshes observation; destruction clears timers and observers. Existing double-buffered page replacement remains.
- Updated the editor-anchor comment to describe the new camera positioning. Camera coordinates, cursor anchors, visibility culling, resize target sizes, selection, grid and saved zoom retain their existing data contracts.

## Commits

None created. Existing unrelated work was preserved.

Suggested commit: `fix(boards): render blocks sharply at camera zoom levels`

Optional separate PDF commit: `fix(media): match PDF raster density to board zoom`

## Migrations / formats

None. No API, dependency, stored Board content, camera storage format or attachment binary change.

## Actual validation

| Check | Result |
|---|---|
| Targeted `vp fmt` | Passed |
| `npm run types:check` | Passed, exit 0 |
| `npm run lint` | Passed, exit 0; 638 formatted files, 535 files without warnings/errors |
| `npm run build` | Passed, exit 0; 15.04s |
| `git diff --check` plus changed-file whitespace scan | Passed |
| Source sizes | Changed files below 500 lines; camera 311, PDF reader 367, density helper 58 |

Build retains existing mixed static/dynamic-import, chunk-size and plugin-timing notices. Logs: `/tmp/orbium-board-resolution-format.log`, `/tmp/orbium-board-resolution-types.log`, `/tmp/orbium-board-resolution-lint.log`, `/tmp/orbium-board-resolution-build.log`.

No automated tests were written or run. PHP checks are not applicable to these frontend-only changes. No browser/manual visual verification was performed by the agent; clarity, gesture behavior and editor alignment require the manual review below.

## Manual checklist

Use a disposable Board with text, heading, list, table, code, math, Mermaid, a high-resolution image with caption, a PDF and a resource card. Start at 100%.

1. **All-block clarity:** zoom out to 50%/25%, then in to 100%/200%/400%, pausing after each step. Expected: text, table rules and vector content are rerendered at each displayed size and recover clarity when enlarged; no persistent blurry world snapshot remains after zoom settles. Small text naturally occupies fewer pixels when reduced.
2. **Cursor anchor and panning:** zoom using Ctrl/Cmd+wheel over a recognizable cell/word, then use the zoom buttons, Hand, Space-drag and Fit view. Expected: cursor-centered zoom retains its anchor; panning, grid alignment, percentages and Fit view remain correct, without jumps or object displacement. Check a Board with many visible objects for acceptable responsiveness.
3. **Combined scaling:** scale a table/text block using a corner, then repeat camera zoom from 50% to 400%. Expected: whole-block scale and camera zoom compose without unexpected wrapping, clipped surfaces or stale low-resolution text. Try all edge/corner handles. Expected: their screen hit targets and opposite-edge anchoring remain usable.
4. **Editing and automatic growth:** double-click an intended word/table cell at 50%, 100% and 200%; type, select and format text, then add table rows. Expected: caret and selection match the clicked location, popovers follow the selection, and added content still grows the block. Verify source-language and media controls.
5. **PDF quality/lifecycle:** open a PDF, zoom the Board to 200%/400%, pause for the page rerender, then change its block scale. Expected: PDF page density improves within its pixel budget, without a blank flash during replacement. Pan at fixed zoom. Expected: page remains stable. Expand/close the player, change pages and remove/reopen the block. Expected: page controls and rendering remain functional. Check an ordinary Document PDF too.
6. **Images, overlays and persistence:** inspect a sufficiently large source image at several scales, open selection tools and media fullscreen, then wait for Saved and reload. Expected: original image detail is used, Board tools remain above the object layer, fullscreen behaves correctly, and saved camera/block scale return. Repeat representative checks in Frosted and, if available, on touch.

## Limits and stop gate

Raster images/videos cannot gain detail beyond their source resolution. PDF pages remain bounded by the existing pixel budget. Very small zoom levels necessarily reduce available screen pixels. Native layout zoom can require more layout work than a transformed layer, so large-Board responsiveness and browser/editor behavior remain manual acceptance items.

Remain in phase-4 manual review. No later phase started.
