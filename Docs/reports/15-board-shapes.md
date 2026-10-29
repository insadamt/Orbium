# Native Board shapes — implementation report

Summary: This report describes the first approved Board shape implementation, its actual static checks and the manual acceptance still required. It depends on `../phases/15-board-shapes.md`, `../plans/board-shapes.md` and the native Board contracts in `../docs/24-boards.md`.

## Implemented

- A Shapes button in the creation dock with vector previews for Rectangle, Rounded rectangle, Ellipse, Diamond, Triangle and Hexagon.
- Click for a 240 × 160 frame, Enter for view-center placement, or drag in any direction for a sized preview. Shift creates equal sides. Successful insertion returns to Select without opening an editor.
- Transient placement previews share existing pointer ownership/cancellation and do not publish records or saves until release. Existing Escape, history, tool changes, lost capture and pinch paths cancel them.
- Fill color, transparent fill, outline color, 1/2/3/4/6/8/12 px outline choices and solid/dashed outlines in the contextual selection toolbar. The saved schema permits finite widths between 1 and 12.
- Rich labels using the existing native Board editor: marks, links, inline icons, text color, alignment/direction, IME guards and original Board history. Double-click/Enter/Edit starts editing; Escape or Ctrl/Cmd+Enter finishes. Shape labels cannot convert their containing object into a writing block.
- Free resizing with Shift-constrained corner proportions, retaining label typography and outline width. Existing move, multi-selection, alignment/distribution, layers, duplicate, delete and same-workspace clipboard paths use native records.
- Shape-specific label areas and overflow scrolling. Wheel over an overflowing label scrolls that label; ordinary wheel elsewhere pans, and Ctrl/Cmd+wheel zooms.
- The same cheap SVG/React surface in original and Instant Scene modes. Shapes bypass prepared rich-content rendering; there is no new renderer dependency or continuous work loop.
- Small extractions for existing marquee resolution, completed transform commits and placement hints keep the touched orchestration files below 500 lines. Source summaries describe responsibilities/dependencies; comments explain the non-obvious sizing/focus/compatibility choices.

## Persistence and deployment

Native object type `shape` retains content format 1. Its `data.shape` stores kind, fill, stroke, stroke width and stroke style. Existing inline `content`, optional `align`, `dir` and `text_scale` remain Board-owned. No user-supplied SVG is stored or executed.

`2026_10_29_000001_add_board_shapes.php` upgrades the Board envelope/default to **9** and extends the object-kind constraint. Existing rows and revisions are not rewritten. Downgrade refuses while shapes exist, including Trash. Frontend/server validation bounds appearance and reuses existing inline-icon ownership/reference validation and object/Board byte budgets.

All full/PATCH/recovery/resource-creation snapshot writers use 9. Supported earlier snapshots adapt explicitly; a shape in an envelope below 9 and unknown envelope versions are rejected. Older clients' version-8 writes fail validation.

The migration was inspected with `--pretend`, applied to the local database and confirmed as **batch 23 / Ran**. On another installation, deploy matching code/assets, run `php artisan migrate`, then reload open Boards. Hard-refresh the local browser before manual review. Native Board export remains outside this change; no archive format is introduced.

## Actual checks

| Check | Result |
|---|---|
| `npm exec vp -- fmt resources/js/components/boards` | Passed; only intended changed/new files appear in the final diff |
| `npm exec vp -- check resources/js/components/boards` | Passed; 165 files correctly formatted, 145 files with no lint warnings/errors |
| `npm exec vp -- check --no-fmt` | Passed; repository-wide lint rules, 706 files, no warnings/errors |
| `npm run types:check` | Passed |
| `./vendor/bin/pint --test` | Passed |
| `php -l` on BoardBlockData, BoardContent, BoardShapeData and the new migration | Passed for all four files |
| `npm run build` | Passed; final build completed in 36.37 seconds |
| Migration SQL inspection, application and status | Passed locally; new migration is batch 23 / Ran |
| `git diff --check` | Passed |
| `npm run lint` | Fails its repository-wide formatting stage on the unchanged `resources/css/explorer-views.css`; that unrelated file was left untouched |

The build reports large chunks, mixed static/dynamic imports in existing document modules and plugin timing notices. It completes successfully. No automated tests, Playwright, browser automation or browser interaction were used. Visual correctness, persistence through the UI, cancellation feel and performance are **not claimed as manually verified**.

An initial TypeScript run found an accidental duplicate placement branch; it was removed. Lint found an unused resize variable; it was removed. Final checks above passed after those corrections.

## Manual acceptance checklist

Use a disposable Board. Start with a hard refresh and keep another Board with existing writing, drawings, media, linked pages and a Mind Map for regression review.

| Step | Exact action | Expected result |
|---|---|---|
| 1 | Open **Shapes**, then inspect all six entries. Choose Rectangle and click empty canvas once. | Each entry shows its shape and name. One unfilled rectangle with an outline appears, is selected, and the tool returns to Select; no text editor opens. |
| 2 | Choose each remaining shape and click once for each. | The five distinct shapes appear; no media placeholder or drawing object substitutes for them. |
| 3 | Choose a shape and press Enter while the canvas has focus. | One default-size shape appears at the camera's view-center placement point. |
| 4 | Create shapes by dragging down/right, down/left, up/right and up/left. Repeat with a very short drag. | Preview follows the intended direction; release creates one matching bounded object. Minimum size is 80 × 32, maximum size 4,000 × 4,000. |
| 5 | Hold Shift while dragging an ellipse and a rectangle. Toggle Shift during a drag before releasing. Also Shift-click a shape. | Equal-width/height frames produce a circle/square; live constraint follows Shift. Shift-click produces an equal-sided default frame. |
| 6 | Drag a shape, press Escape before release, then release. Repeat with the placement hint's Cancel button. Choose another tool before placing. | No canceled shape is saved, no orphan preview remains, and existing objects are untouched. Escape may first cancel the gesture while leaving placement armed; a second Escape exits the tool. |
| 7 | Start a drag and use Ctrl/Cmd+Z. With touch hardware, begin shape placement and add a second touch to pinch. | The shape preview is canceled before history/pinch takes control; releasing does not insert a stray shape. Pinch remains camera-only. |
| 8 | Select a shape. Choose a fill color, then **No fill**. Change outline color, width and Solid/Dashed. Use the color picker reset actions. | Fill/outline change independently. No fill reveals the canvas. Reset fill is transparent; reset outline follows theme foreground. Outline widths/styles remain visible. |
| 9 | After a style change, focus the canvas and use Undo then Redo. After one new shape insertion, Undo then Redo. | The style change and completed insertion are independently undoable. A drag's pointer samples do not become separate history entries. |
| 10 | Double-click a shape, type a short label and a second line, select text and apply bold/color. Finish with Ctrl/Cmd+Enter. Repeat edit entry using Enter and the toolbar Edit action. | Text stays inside the shape, centered initially; line breaks/marks/colors persist in preview. Finishing restores normal selection. Shape identity/appearance remains. |
| 11 | While editing a label, use `:query` icon completion or the existing formatting toolbar icon picker. Add a built-in icon and an owned custom image icon. Try a safe external link. | Shared inline controls work; saved label icons/links render through the Board owner. Label editing does not expose structural conversion into headings/lists. |
| 12 | Change label alignment and direction. Add enough text to overflow a small shape; wheel over the label, then Ctrl/Cmd+wheel. | Text layout updates. Overflow stays within the reserved label area without growing the shape. Ordinary wheel scrolls the long label; modified wheel zooms the Board. |
| 13 | Resize a labeled shape from its edges and corners. Hold Shift on a corner. Try the same after zooming/panning. | Ordinary resize changes width/height freely; Shift preserves the current aspect ratio. Opposite edges stay anchored within limits; label font size and outline width stay unchanged. |
| 14 | Move shapes; Shift-select two shapes and a text object. Move the selection, align it, and distribute three objects. Use More → Bring to front/Send to back on overlapping shapes. | Existing multi-selection, smart guides, alignment/distribution and layers work with independent shapes. Labels move with their frames. |
| 15 | Duplicate a styled/labeled shape. Copy/paste it within the same workspace, including into another Board. Delete a shape and Undo. | Each copy has a new identity and keeps style/label; deletion can be undone. Original pages/media remain owned and intact. |
| 16 | Wait for Saved, reload, leave/reopen the Board and move it to Trash then restore it. | All shapes, geometry, styles and rich labels return; there is no format error or silent flattening. |
| 17 | Open the Board in two tabs. Save a change in one, then attempt a stale save in the other. | Existing conflict/recovery protection keeps the local draft and requires deliberate reconciliation; shapes are not silently lost. |
| 18 | Open the same Board with `?boardRenderer=original`, then `?boardRenderer=instant` (use `&` if a query already exists). Pan far away/back, zoom and reopen the Board. | Both modes show the same native shape/label content; culling does not drop or reset saved shapes. |
| 19 | Review the regression Board: edit text/icons, draw/erase, resize media, edit a linked Document, create a new linked Document and edit a Mind Map. Reload. | Existing block interactions and original saves remain available under envelope 9; creating a linked Document still works. |
| 20 | Switch light/dark themes and enable the OS reduced-motion preference. Create, edit and remove a shape. | Default outline follows foreground; explicit colors stay explicit. Controls remain legible; existing reduced-motion handling avoids decorative Board entrances/exits. |

For a technical negative-path review on the disposable Board, use browser developer tools to resend a captured save request with an unknown shape kind, invalid color, outline width outside 1–12, or format version 8. **Expected:** HTTP 422 and no partial save. A custom label icon from another workspace must also be rejected. These checks have not been executed here. Do not attempt a migration rollback on real content; the rollback guard is intended to reject any saved shapes.

## Limits and review gate

- Connected arrows, rotation, persistent grouping and new exports are outside the approved first version.
- Shape selection uses the existing rectangular object bounds. Transparent corners/interiors are still part of the object's selection frame.
- Labels wrap/scroll in shape-specific central regions; shape geometry does not automatically grow to fit long text. Text size and shape aspect ratio are independent.
- Browser interaction, touch behavior, theme presentation and performance remain for manual acceptance. Static checks cannot establish them.
- No Git commit was created. Suggested message: `feat(boards): add native vector shapes and rich labels`. An optional documentation commit could use `docs(boards): document shape persistence and manual acceptance`.

Stop here for this phase's manual review. Fix reported issues within this scope; obtain explicit approval before connected arrows, rotation or another feature phase.
