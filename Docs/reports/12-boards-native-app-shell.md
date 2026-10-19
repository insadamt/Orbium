# Boards — native Orbium app shell

## Phase

Boards phase 4, manual review correction approved with “go ahead” after the proposal to integrate Boards with the normal app bar and styling. Earlier full-screen and separate Board header rules are superseded. No later phase started.

## Implemented

- Removed the fixed full-viewport Board overlay, hidden app bar/pane controls, inert application navigation and body scroll lock. Boards now use Orbium's existing app shell, navigation tabs, breadcrumbs, workspace and account controls.
- Reused the normal `floating-body-island` surface, inherited Normal/Frosted styling and shared background. The canvas is rounded and contained inside the page.
- Reused `NodeMediaHeader` with a `toolbar` layout for the inline title. It uses the existing title field, trimming/empty-title behavior, header save endpoint and errors. Full cover/icon editing remains in Board details. Header keys follow the saved title so the inline and details views refresh without remounting the canvas.
- Removed the Board-specific Back control; the normal app Back/history and workspace home are available again.
- Moved Select, Hand, Text, Add and undo/redo to a compact toolbar above the canvas. Selected tools use the shared accent treatment. Add opens downward, and zoom remains in the canvas corner. History remains accessible during editing while placement buttons hide.
- Kept selected-block formatting and More actions contextual. Adjusted selection toolbar, properties panel, camera fit and placement-hint space for the contained canvas.
- Replaced viewport takeover sizing with available-height measurement beneath the real app bar/spacer. Window, visual viewport and app-bar wrapping changes update the available height. Minimum working height allows page scrolling on short screens. Narrow toolbars hide Select/Hand text labels while keeping accessible names and can wrap.
- Restored the canvas keyboard focus outline. Page-level errors now occupy normal flow; canvas save/recovery messages have a height-bounded scrolling area.

## Commits

No commit created. Existing uncommitted work is preserved.

Suggested messages:

- `refactor(boards): integrate canvas with the native app shell`
- `docs(boards): document native shell layout and manual acceptance`

## Migrations / persistent formats

None. Existing Board/resource/editor saves, content formats, archive formats and Node relationships are unchanged. The shared header's compact/document layouts retain their existing behavior; the toolbar layout is opt-in for Boards.

## Validation

- Targeted `vp fmt`: PASS on all 13 modified source/style files, including the final CSS adjustments.
- `npm run types:check`: PASS.
- `npm run lint`: PASS; all 639 checked files correctly formatted, no warnings or lint errors across 536 linted files.
- `npm run build`: PASS. Existing warnings remain for bundles larger than 500 kB and ineffective dynamic imports of Document modules.
- `git diff --check`: PASS.
- Modified source files remain under 500 lines: Board canvas 445, toolbar 203, shared Node media header 359, workspace-height hook 46 and Board page 148.
- No automated tests written or run, per user instruction. PHP checks are not applicable to this frontend-only change.

## Exact manual checklist

Use a disposable Board, a same-workspace Document and Database, and more than one app tab.

1. Open the Board from its folder. Expected: the same Orbium app bar, breadcrumbs, workspace/account controls and tabs as other pages remain visible and keyboard reachable. A rounded page surface contains the title, toolbar and canvas; there is no separate fullscreen Board header or second Back button.
2. Switch to the Document and Database tabs, then back to the saved Board. Use app Back/Forward, workspace home and breadcrumbs. Expected: ordinary navigation works without hidden/inert controls left behind; Board content reloads correctly. Open the Board URL directly with no tab history: workspace home and breadcrumbs still provide a route out.
3. Click the Board title, rename it and press Enter; wait for the header reload, then reload the browser. Expected: the title persists and app navigation reflects it. An empty/whitespace title restores the saved title. A long title wraps without covering the menu.
4. Open Board options → Board details. Change cover/icon or title, close the dialog, then toggle favorite. Expected: existing media behavior persists, inline title reflects the saved name, focus returns to Board options and favorite survives reload. Inspect a normal Folder/Database header to confirm their full layout is unchanged.
5. Choose Text from the toolbar and click the canvas; edit and finish. Repeat with Add → Image and another rich block. Expected: placement coordinates match the pointer inside the canvas beneath the app bar, automatic height/corner scaling still work, and toolbar history remains visible while editing.
6. Use Tab to open Add, arrow/typeahead to choose a block, Enter to accept and Enter again to place at center. Expected: the menu opens below the toolbar and preserves canvas focus for placement. Escape cancels placement without creating a block. Add → Link page or create Document opens its normal dialog with focus inside.
7. Select a block and edit it; select text, open More → Properties, change width/position and close it. Expected: contextual formatting follows the selected block inside the canvas, properties remains reachable without covering the app bar, and closing restores focus to More or canvas. Pan selected content offscreen and back: controls follow existing selection behavior.
8. Move, resize, duplicate, align and distribute blocks. Undo/redo using toolbar and keyboard. Expected: one history action per completed arrangement/gesture, correct previews and saves, no canvas remount caused by a title/favorite update.
9. Pan by wheel/Hand and zoom with Ctrl/Cmd+wheel and buttons; use Fit all/selection and Reset. Expected: camera gestures stay within the canvas, zoom centers around the pointer/current canvas, and fits use the available contained area. Scrolling or interacting with app menus does not pan the canvas.
10. Repeat at 1440px, 1024px, 768px, 480px and 360px widths, then a short landscape window. Expand app page search to trigger app-bar wrapping. Expected: the Board remains below all navigation rows, toolbar can wrap without overlap, canvas retains usable height, and short screens can scroll the normal page. With a touch keyboard open, navigation remains accessible and the canvas resizes.
11. Repeat in light/dark, Normal/Frosted, with image wallpaper and reduced motion. Expected: the Board page shares app surface/background styling, selection uses accent colors, menus remain legible, and keyboard focus on the canvas is visible.
12. Disable the network on the disposable Board and edit a block; try changing tabs, workspace home, breadcrumbs and Back. Expected: existing save guards prevent losing unsaved Board content and show recovery feedback. Restore network and retry where offered, wait for Saved, then navigate and reopen: content persists.
13. Edit a linked Document and attempt app navigation while it is unsaved/uploading. Expected: the existing hosted Document guard prevents leaving, the active editor stays mounted, and saving completes to the original Document. After Saved, normal navigation works.

## Known limits

Manual/visual acceptance remains pending; no browser interaction or screenshot verification is claimed for this pass. Prior desktop screenshot capture was unavailable. Static checks verify formatting and compilation, not the actual responsive appearance or focus behavior. Existing bundle warnings remain.

## Review refinements

- Responsive sizing measures the real page position and watches the app bar/spacer, rather than assuming one fixed navigation height.
- The toolbar is hosted in a normal-flow slot outside the spatial stage, keeping camera and selection coordinates relative to the actual canvas.
- Retained existing save/router/tab guards when exposing app navigation again.
- Kept title editing on the shared header implementation to avoid a second header persistence workflow.

## Stop gate

Remain in Boards phase-4 manual review. Await the user's manual feedback before any later phase.
