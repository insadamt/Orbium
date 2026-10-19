# Boards — Canvas presentation polish

The subsequent [default full-screen and spatial refinement review](12-boards-spatial-refinement.md) supersedes the dock layout and immediate-insertion steps below. Use that report for current manual acceptance.

## Phase

2026-10-18 — User-approved presentation and interaction polish during the current Boards review. The working tree already contains phase-4 resource cards; this pass preserves that implementation and does not begin a later phase.

## Implemented

- A viewport-sized Board workspace below the existing application navigation, with a compact title, favorites and collapsible Details header. The canvas takes the remaining available space instead of sitting inside a second padded page surface.
- Floating creation controls for Text, Image, List, More and Page. More opens a visual picker with examples and descriptions for all twelve existing native block types. Page retains the existing Link page / New Document picker.
- Separate history controls at the top-right and zoom/fit/view options at the bottom-right. Grid, snapping, fit selection, reset and canvas help remain available through View options.
- Contextual selection tools anchored to the selected objects, with single-object formatting/edit controls, a multi-selection count, duplicate and selection options for fit height, layering and removal. The toolbar remains outside the scaled world, follows camera/drag paints, stays within the available area and reserves space for the docks.
- Hover feedback, distinct editing outlines, visible resize handles and screen-sized resize hit areas across zoom levels. Text, headings, lists, quotes, images and dividers retain transparent outer surfaces.
- Quieter dot grid, improved writing/callout/table spacing, image containment that preserves the entire image within its preview, and a calmer empty state.
- Responsive creation controls move above the bottom navigation on narrow screens. Existing appearance tokens and glass surfaces supply normal/frosted and light/dark styling.
- Board styles split into canvas layout, floating controls and block presentation files; changed/new source files remain under 500 lines.
- The block picker preserves the inserted editor's focus and restores its trigger on ordinary dismissal. Canvas focus is restored before dock insertion so non-writing objects keep keyboard access.

## Scope and compatibility

No migrations, API changes, dependencies, persistent format changes or archive changes. Existing Board and hosted Document save/recovery flows, upload locks, clipboard, object history and resource references remain in use. Alignment guides/distribution, grouping, drawing and Mind Maps are outside this presentation pass.

## Commits

No commits created. The working tree contains earlier feature changes; this pass leaves them in place.

Suggested messages, when preparing the corresponding logical changes:

- `feat(boards): improve canvas layout and contextual controls`
- `docs(boards): document canvas polish and manual acceptance`

## Validation

| Command | Actual result |
|---|---|
| Targeted `vp fmt` for changed source files | PASS |
| `npm run types:check` | PASS (`tsc --noEmit`, exit 0) |
| `npm run lint` | PASS: all 606 files correctly formatted; no warnings or lint errors in 508 files |
| `npm run build` | PASS: final build completed in 13.15 seconds |
| `git diff --check` | PASS |

The build reports warnings about chunks above 500 kB, three mixed static/dynamic Document imports, and plugin timings. These do not fail the build. The exact final build output is in `/tmp/orbium-board-polish-build.log`.

No automated tests were written or run. Browser interaction and visual acceptance are left to the user's manual review. No PHP or migration code was changed by this pass, so PHP/migration checks were not required for these presentation changes.

## Manual validation checklist

Use an empty Board and an existing Board with native objects and resource cards. Where a step changes content, wait for Saved before leaving.

| Check | Exact steps | Expected result |
|---|---|---|
| Workspace layout | Open a Board at 1440×900 and 1280×720. Resize the browser between the sizes. | The canvas fills the remaining workspace below navigation and the compact heading. Creation, history, save status and view controls stay inside the canvas area. There is no wrapping row of tools above the canvas. |
| Details and favorites | Open Details, change the Board title/icon or cover, close Details, then toggle the favorite star. | Existing metadata controls work. Closing Details returns space to the canvas. Favorites and the title retain their normal behavior. |
| Empty state and writing | On an empty Board, double-click empty space and confirm nothing is created. Choose Text from the dock, type two lines, select a word and make it bold, then click Done. Double-click the existing object to edit it again. | Empty-space double-click creates no object. Text from the dock creates a native transparent object. Formatting is available beside the selection, typing stays in the object, Done returns focus to the canvas, and double-clicking that object reopens editing. |
| Quick creation | Use Text, Image and List from the creation dock. For Image, upload or select an existing Library image. For List, add an item and change the list style. | Each control inserts its corresponding existing native object. Text/list editing and image/Library controls work; the image preview preserves its proportions. |
| Visual picker | Open More. Use the keyboard to focus Heading and insert it. Repeat with Callout, Quote, Code, Table, File, Math, Mermaid and Divider, scrolling the picker where necessary. Open More again and press Escape. | The picker has readable examples/descriptions and can scroll within the window. Each selection creates the correct object. A new inline editor keeps focus after insertion; Escape without insertion returns focus to More. |
| Selection and editing | Select a text object, drag it, change its type to Heading, choose a heading size, alignment and text direction, then double-click to edit. | The contextual toolbar follows the selected object. Changes apply to that object. The editing state is visually distinct. Ordinary writing has no permanent card header, background or shadow. |
| Resize and zoom | Select an image, code block or table. Resize from the right, bottom and lower-right handle. Zoom to approximately 10%, 100% and 400%, and pan with scroll or Space + drag. Move a selected object near each viewport edge. | Resize handles remain visible and usable, selection tools retain their screen size, and the toolbar remains in the available viewport area. Pan/zoom does not save content by itself. |
| Multi-selection and actions | Shift-click two objects. Duplicate them. Open Selection options; bring them to front, send them to back, and fit height. Delete the copies, then undo and redo. | Multi-selection shows its count and the shared actions. Relative layout and existing layer/history behavior remain intact. No single-object formatting controls appear for a multi-selection. |
| View controls | Use zoom −/+, Fit all, then View options → Fit selection, Reset to 100%, Dot grid, Snap to grid and Canvas controls. Reload after changing grid/snap. | Every view action remains accessible; help opens; zoom text updates correctly; grid/snap preferences retain their existing local behavior. |
| Clipboard and persistence | On the canvas, copy/paste native objects, cut/paste a copy, then use keyboard undo/redo. Wait for Saved and reload. | Existing canvas clipboard/history behavior works. Saved object content and positions return after reload. Editing text continues to use native text clipboard behavior. |
| Existing resource cards | Use Page to link an existing Document and create a new sibling Document. Edit the linked Document, wait for its save, finish editing, and open its original page. Return and remove only its Board card. | Existing resource workflows remain available. Editing persists to the original Document. Removing the card keeps the original page. Hosted Document save/upload locks continue to prevent switching/removal while required. |
| Save conflict and recovery | Open the same saved Board in two browser tabs. Save a change in the first; make a different change in the stale second tab. Use Download local draft, then Load latest → Cancel, and finally confirm Load latest. | The stale save reports a conflict without silently replacing local changes. Recovery actions remain readable and usable. Cancel keeps the draft; confirmed Load latest displays the server version. |
| Appearance and narrow layout | Repeat basic creation/selection in light and dark appearance, with normal and frosted surfaces. Resize to 390×844 and 640×800. Try More and View options using keyboard focus. | Text and controls remain readable. Transparent objects remain transparent. The creation dock moves above the bottom view controls, menus stay within the window and scroll when needed, and focus indicators remain visible. |
| Reduced motion and other pages | Enable reduced motion, navigate to a Board, pan/zoom, then visit an ordinary Document and workspace explorer. | This pass adds no camera animation. Other page layouts retain their existing behavior. |

## Known limitations

- Manual visual/browser acceptance has not been performed by the agent. The checklist above is pending user review.
- Selection tools remain pinned to the nearest available canvas area when the selection is offscreen or too close to an edge; they may therefore sit away from the selected object.
- Very short windows, expanded Details and long recovery notices can require page/panel scrolling to keep controls accessible.
- Existing rich blocks and hosted Documents retain their manual dimensions/internal scrolling. Images use containment, which can leave empty space around an image with different proportions from its object.

## Issues addressed during source review

- Prevented the block picker's normal close-focus behavior from taking focus away from a newly inserted inline editor.
- Scaled resize hit areas as well as visible handles inversely to zoom, so zooming out does not leave tiny pointer targets.
- Reserved space for creation/navigation docks when clamping the contextual toolbar.
- Removed the old frosted empty-state panel treatment so the revised empty message sits directly on the canvas.

## Stop gate

Stop for the user's manual review. No later Boards phase is started.

## Review correction — Double-click only edits

Removed empty-canvas double-click creation at the user's request. Empty-state guidance and Canvas controls now point to the creation dock. Existing object double-click editing, the block picker, clipboard paste and resource creation remain available. No persistence/API changes or commits.

Manual checks:

1. Double-click blank space on an empty Board and on a populated Board: no object is created and the block count does not increase.
2. Choose Text from the dock, type content and click Done; double-click the existing text: it enters editing without adding another object.
3. Open More and insert a Heading: creation through the picker still works.
4. Check the empty-state message and View options → Canvas controls: both describe dock-based creation.

Validation for this correction: targeted formatting, `npm run types:check`, `npm run lint` (606 formatted files, 508 linted files), `npm run build` (13.45 seconds) and `git diff --check` all pass. Build warnings remain for large chunks, mixed static/dynamic imports and plugin timings. No automated tests were written or run; manual checks above remain pending.

Suggested commit: `fix(boards): reserve double-click for editing`
