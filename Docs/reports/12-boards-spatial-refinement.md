# Boards — Default full-screen and spatial refinement

## Phase

2026-10-18 — User-approved phase-4 review refinement. This supersedes the optional Focus layout in the earlier review. It does not begin a later Boards phase.

Subsequent review: `12-boards-investigation.md` supersedes this report's no-Back navigation behavior. Back is now visible; full-screen remains the default. That investigation also records unresolved block interaction problems, so the presentation changes below do not establish UX acceptance.

## Implemented

- Boards open directly in a full-viewport workspace. Removed the Focus hook/toggle, Exit focus and the alternate page-sized layout. No Back button is added, following the user's “with no back” instruction. Existing browser/application navigation shortcuts, Search Master and resource links remain available.
- Surrounding Orbium navigation stays hidden and inert while the Board is mounted, with cleanup on navigation. A compact title/favorite/details area remains. Details now opens the existing metadata controls in a dialog. Browser chrome remains browser-controlled.
- Stronger heading typography, more deliberate new-object dimensions, refined quote/callout/list/table/code presentation, image frames and clearer empty editing states. Ordinary writing and image outer surfaces remain transparent.
- Empty media areas explain how to add content and expose Upload/Library actions while editing; they accept a dropped file through the existing guarded upload lifecycle. Code editing focuses the existing CodeMirror input and shows a writing hint when empty.
- Double-click writing uses the pointer position to place the caret near the clicked text. Lists and tables activate the clicked item/cell. Keyboard insertion/editing still focuses the active field. Inline focus/formatting avoids scroll-into-view commands so the canvas does not pan merely because formatting restores editor focus.
- The contextual toolbar stays in a stable lane above the dock during text editing, rather than following every content-height change. Type-specific controls and the existing selection options remain available.
- Measured text height is saved as derived geometry without adding a separate history step or clearing redo. Content and explicit width/layout changes continue to use the existing object history.
- Smart alignment guides snap a moving selection's edges/centers to nearby visible objects within six screen pixels. They are on by default, independent of grid snapping, and browser-local. Alt bypasses both object and grid snapping. Guide painting and drag previews use the existing frame loop; only a completed gesture persists.
- A shared multi-selection outline replaces individual selection outlines/handles. Dragging the outline or any selected object moves the selection as a unit. Objects remain independent; no persisted group or hierarchy relation is introduced.
- Arrange offers left/center/right and top/middle/bottom alignment for two or more objects, plus equal-gap horizontal/vertical distribution for three or more. Toolbar and context-menu actions share the same geometry function and enter existing history/save validation as one action.
- Optional Object properties exposes bounded X/Y/width/height and existing text-style controls. Automatic text height is read-only. Fields commit on Enter/blur, reject invalid values and clamp to existing geometry limits; Escape cancels a draft field value. Selecting another canvas object commits a valid property draft before replacing the panel.
- Updated the feature contract, handoff and help. Source responsibilities remain split; new/changed files remain below 500 lines.

## Persistent formats and compatibility

No migrations, backend/API changes, dependencies or format-version changes. Existing source data, Library ownership, resource-card persistence, revisions, recovery, clipboard and navigation/upload guards retain their existing routes and lifecycle.

Typography can remeasure and save existing native text heights when a Board opens; positions and widths stay explicit. New-object size defaults apply to newly created blocks. Smart-guide preferences are browser-local and do not write Board content. Persistent grouping, drawing and Mind Maps remain outside this review.

## Commits

No commits created; earlier uncommitted work is preserved.

Suggestions:

- `feat(boards): default to full-screen spatial editing`
- `docs(boards): document spatial refinement and manual checks`

## Validation

| Command/check | Actual result |
|---|---|
| Targeted `vp fmt` on Board source and the Board page | PASS |
| `npm run types:check` | PASS (`tsc --noEmit`, exit 0) |
| `npm run lint` | PASS: all 620 files correctly formatted; no warnings or lint errors in 520 files |
| `npm run build` | PASS: final production build completed in 18.47 seconds |
| `git diff --check` | PASS |
| Source sizes | New/changed files remain below 500 lines; canvas 450, pointer handling 475, new object styles 317 |

The build reports warnings about chunks above 500 kB, three mixed static/dynamic Document imports and plugin timings. These do not fail the build. The complete final output is in `/tmp/orbium-board-refinement-build.log`.

No PHP or migration code changed in this pass, so PHP/migration checks were not required. No automated tests were written or run. Browser/visual acceptance remains pending the user's manual review.

## Manual validation checklist

Use a new Board and an existing Board with text, images, code, tables and a linked Document. Wait for Saved before checking persistence/navigation.

| Check | Exact steps | Expected result |
|---|---|---|
| Default full screen | Open a Board directly, reload, navigate to another Board and reload again. Press Escape with Select active and no editor open. | The canvas uses the full browser content viewport every time. There is no Focus, Exit focus or Back button, and Escape never returns to a page-sized layout. |
| Metadata | Use Board details in the compact title area, change a title/icon/cover, close the dialog, then toggle the favorite star. | The existing metadata workflow works in a scrollable dialog and returns to the full canvas. The title/favorite state updates normally. |
| Navigation cleanup | From a saved Board, use Search Master (`Ctrl+Space`) or an existing resource link to open another page. Return using the app's normal navigation. | Other pages regain their navigation/scrolling/keyboard controls. Returning to a Board opens the full canvas. Existing unsaved-navigation guards still apply. |
| Object presentation | Place Heading, Text, Quote, Callout, List, Table, Image and Code blocks; add representative content. Inspect an existing Board too. | Headings have a clear scale, ordinary writing remains transparent, content-specific surfaces are readable and images preserve proportions. Existing text heights may reflow under the new typography. |
| Clicked text editing | Place several lines of text, finish editing, then double-click near a word in the middle. Type a character. Repeat on the third list item and a non-first table cell. | Editing starts near the clicked text and in the clicked item/cell, rather than always at the end or first field. Source remains correct after Saved/reload. |
| Stable formatting | Pan/zoom to an object near an edge, double-click to edit, select text and toggle bold/italic/link. Type several new lines. | Formatting preserves the intended text selection, the camera does not jump to scroll an editor into view, and the editing toolbar stays in its lane while content grows. |
| Derived height history | Create Text, type several lines, click Done, then focus the canvas and use Board undo/redo. Change its width via Properties, then undo/redo again. | Text height follows content/width. Undo/redo targets the content or explicit width change without an additional height-only history step, and redo remains available. |
| Placement | Choose Text/Image/Add, observe the count before clicking, then place a block. Cancel an armed tool with Escape. Double-click empty space with Select. | Choosing a tool alone creates nothing; a placement click creates one object. Cancel and empty-space double-click create nothing. |
| Media insertion | Place an empty Image, use Upload, then repeat with Library. Place another Image and drop a supported image on its empty editing area. Repeat File with a supported file/media type. | Empty states explain the available actions. Upload/Library/drop use the existing lifecycle, display the selected media and preserve Library ownership. |
| Upload negative path | While an upload is pending, try switching tools or objects. Try dropping an unsupported image file. | Existing upload locks prevent unsafe switching. Unsupported input produces a visible error; any retained Library upload follows the existing lifecycle. |
| Code editing | Place Code, type immediately, choose a language and finish editing. Reopen it and change text. | The code input receives focus, the empty hint disappears as content appears, and highlighting/language/copy behavior remains available. |
| Smart guides | Leave Smart alignment guides enabled in View options and disable grid snapping. Create two objects. Drag one until its left/center/right or top/middle/bottom aligns with the other. Release, save and reload. | Dashed guides appear during the gesture, the selection snaps within a small screen-space tolerance, guides clear on release, and the final geometry persists. |
| Guide zoom and bypass | Repeat alignment around 25%, 100% and 200% zoom. Hold Alt while dragging across an alignment target. Toggle Smart alignment guides off, save/reload and repeat. | The snapping tolerance remains about six screen pixels. Alt bypasses snapping/guides. Turning guides off disables object snapping and persists only as a local view preference. |
| Grid independence | Enable grid snapping with guides off, move an object, then enable both and drag again. | Existing grid snapping works independently. When both are enabled, object alignment can adjust the grid result near an object anchor. Alt bypasses both. |
| Multi-selection | Shift-select two/three objects and drag an outer shared-outline edge; then drag one selected object's body. Press Escape during a drag. | One shared outline represents the selection; all selected objects move together without becoming a persisted group. Cancel restores their original geometry and clears guides. |
| Alignment actions | With two selected objects, open Arrange and apply all six alignments, undoing between them. Repeat through the right-click Arrange submenu. | The selected edges/centers align. Other objects/content/layers are preserved. Each effective command is one history action. |
| Distribution | Select three spaced objects with different widths/heights. Distribute horizontally and vertically, undoing between commands. Try with only two selected. | Adjacent gaps become equal within the selection's outer extent; distribution is disabled for fewer than three objects. A tight/overlapping selection can retain overlapping gaps. |
| Exact properties | Select an object, open Object properties and change X, Y and width; for image/code, change height too. Press Enter or blur each field, then save/reload. | Values update the selected object within existing bounds. Native text height stays read-only and follows wrapping. Saved geometry returns after reload. |
| Properties cancellation and selection | Edit a number and press Escape, then Escape again. Reopen Properties, edit a value and click another canvas object. Try empty, non-finite and out-of-range input. | Escape cancels the draft, then closes the panel without leaving full screen. Selecting another object commits a valid draft to the original object. Invalid input reverts; out-of-range values clamp and show the bounded value. |
| Selection controls | Move selected objects near each viewport edge, pan/zoom and open/close Properties. Test single and multi-selection, using touch-accessible Selection options too. | Controls remain readable and reachable; closing Properties restores focus to its button. Arrange and type-specific tools match the current selection. |
| Save/conflict recovery | Edit offline, restore network and retry. In two browser tabs, save in one and edit the stale other tab. Download the local draft and test Cancel/confirmed Load latest. | Failures and recovery controls remain visible above the canvas. Conflicts keep local changes until explicit resolution; no silent overwrite occurs. |
| Hosted Documents | Link/edit a Document through Page, wait for its save and open the original. Create a sibling Document and remove only its Board card. | The existing original-Document persistence, sibling creation, ownership and removal behavior remains. Dirty/uploading hosted cards retain their switching guards. |
| Appearance and viewports | Review at 1440×900, 1280×720, 640×800 and 390×844 in light/dark and normal/frosted styles. Try a short landscape window and reduced motion. | Full screen remains the default. Controls and dialogs are legible/reachable, panels scroll when necessary, and no new camera animation appears. |
| Touch and IME | On touch, tap to place, use Hand to pan and pinch while another tool is armed. With an IME, compose text and press Enter/Escape before completion. | A tap places one object; pinch adds none; Hand pans. Composition is not prematurely placed/finished or discarded. |

## Issues addressed during source review

- Measured height originally entered object history as a separate edit; derived-height updates now preserve the current content group and redo stack.
- Editor entry and formatting focus previously requested scrolling; native inline focus now opts out and uses the clicked position when available.
- Property Escape/blur could commit the stale draft during a nested blur event; cancellation is tracked before blur.
- Property clamping now updates the displayed number even if the bounded value already equals the saved geometry.
- Selecting another object now blurs a Properties field before replacing its panel, so a valid draft can commit first.
- Shared selection previews calculate bounds from all selected objects, including while a single object preview changes.
- Guide extents use both corrected axes and stationary candidates from the visible neighborhood, avoiding alignment with distant offscreen objects.
- Hidden empty media hosts no longer take space away from the insertion target.

## Known limitations

- Manual browser/visual checks above are pending user review. No claim of manual validation is made.
- Browser address/tab bars remain controlled by the browser. There is intentionally no on-canvas Back/Exit action.
- Alignment guides assist movement; they do not provide measured spacing labels, resize snapping or persisted constraints.
- Multi-selection is transient; there is no persistent grouping or proportional group resize.
- Distribution preserves outer extent and can yield negative gaps when the selected objects already overlap tightly.
- Larger typography can require manual spacing adjustments on existing free-form Boards; object positions are not automatically rearranged.
- Rich/media objects and hosted Documents retain manual dimensions/internal scrolling. Very short viewports may require control/panel scrolling.

## Stop gate

Stop for user manual review. No Mind Map or later Boards phase is started.
