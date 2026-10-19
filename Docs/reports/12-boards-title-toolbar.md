# Boards — Tools beside the title

2026-10-19. Requested refinement within Boards phase-4 manual review.

## Implemented

Moved the left vertical creation/history rail into the Board heading, immediately to the right of the title and before Board options. Tools now form a compact horizontal group with undo/redo separated at the end. The canvas uses the width previously occupied by the rail. Add opens downward aligned to the end of its trigger; tooltips prefer the bottom. Selected tools retain an accent background and a bottom indicator.

The page owns the toolbar host and passes it to the existing Board canvas/controller. The existing portal keeps tool actions and keyboard handling attached to the same React controller; moving the host does not recreate the Board editor or persistent state. Editing/save/upload locks remain in effect. Narrow windows wrap the tools/options below the title, aligned to the right; coarse-pointer targets remain 42px.

No migrations, dependencies or data-format changes in this placement change. The requested commit also records the accumulated toolbar refinements and text-color support from the preceding review reports. Separate table-preview rendering edits are left uncommitted.

## Validation

- Targeted formatting: passed for the placement source files.
- TypeScript: `npm run types:check` passed, exit 0.
- Scoped `vp check`: passed for the pending source changes; no formatting/lint warnings or errors.
- Full `npm run lint`: failed on formatting in the separate `board-table-block.tsx` work; that file is outside this toolbar commit and was left unchanged.
- PHP syntax and targeted `pint --test` format verification: passed for `BoardBlockData.php`.
- Final `npm run build`: passed, exit 0; existing mixed-import, chunk-size and plugin-timing notices remain.
- `git diff --check`: passed.

Logs: `/tmp/orbium-title-toolbar-{types,lint,scoped-lint,build,php,pint}.log`. No automated tests written or run, per user instructions. Live visual acceptance remains manual. Concurrent table source/rendering edits are excluded, including their hunks in shared validation/types files.

## Manual checklist

1. Open a Board at desktop width. Expected: Select, Hand, Text, Add and undo/redo appear horizontally to the right of the title, followed by Board options; no left rail remains.
2. Select Hand and pan, then Select and select a block. Choose Text/Add and place blocks with pointer and Enter. Expected: tools and active indicators work; Add opens below the toolbar and stays in the viewport.
3. Edit a text/list/table block and use undo/redo. Expected: placement tools remain visible but disabled during editing, history remains available under the existing locks, and content editing is preserved.
4. Rename the Board, use Board options/details and switch app tabs. Expected: title saving, details/favorites and navigation still work, with no duplicate toolbars or editor reset from moving the host.
5. Resize below 640px and use a coarse pointer. Expected: title occupies its own row, tools/options wrap to the right below it, touch targets remain reachable, and the canvas has no reserved left rail.
6. Pan/zoom, select/deselect blocks and select text. Expected: floating contextual toolbars still follow selections, text-color controls remain available for selected text and block alignment/direction remain in the block toolbar.

## Commit suggestion

`feat(boards): refine toolbars and move tools beside title`

Remain in Boards phase-4 manual review.
