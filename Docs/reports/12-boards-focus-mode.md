# Boards — Focus mode and canvas interactions

Superseded presentation: the subsequent [default full-screen and spatial refinement review](12-boards-spatial-refinement.md) removes the optional Focus mode and its exit controls. Use that report for current manual acceptance.

## Phase

2026-10-18 — Approved follow-up to the Boards canvas polish. This remains phase-4 review work; no later phase is started. The existing native blocks and resource-card implementation remain in place.

## Implemented

- Optional Focus mode fills the browser viewport and hides Orbium navigation, tabs, the Board heading and Details. The top-right Focus / Exit focus button stays visible. Hidden controls are inert while focused and regain their prior state on exit/unmount.
- Focus is a presentation change on the existing mounted canvas. Native/hosted editors, drafts, media sessions, camera and save queues are retained. Browser chrome remains controlled by the browser; this mode does not call the browser Fullscreen API.
- One visible bottom creation dock: Select, Hand, Text, Image, Add and Page. The active tool has a contrasting state. History remains at the top and zoom/view controls at the bottom-right. At narrower widths the creation dock moves above the view controls.
- Select moves/selects objects; Hand pans without interacting with objects. Space temporarily pans, including over object previews. Existing scroll/pinch/middle-drag navigation remains available.
- Native block insertion is explicit: choose a type, then click/tap to place one object at the world point. A placement hint and Cancel control remain visible. Enter places at the view center. Choosing a tool alone creates no content; successful insertion returns to Select. Dragging beyond six screen pixels, pointer cancellation and pinch never insert objects. A drag away and back to the starting point is still rejected.
- Double-click with Select continues to edit existing objects; double-clicking empty space with Select creates nothing. The existing clipboard and Page resource workflows remain available.
- Escape cancels the innermost gesture/tool or finishes editing before exiting Focus on a later press. Open menus, dialogs, code completion, IME composition and browser media fullscreen retain their own Escape behavior. Dirty hosted documents/uploads retain their switching guards. Exit focus remains available as a presentation action without discarding the editor.
- A compact Text style menu replaces several native selects and exposes text/heading/quote/callout type, heading size, alignment and direction. Existing inline formatting is still available beside the selection. Other block types keep their type-specific Edit controls.
- A canvas context menu exposes existing edit, duplicate, fit-height, layering, removal and fit-all actions. Right-clicking an unselected object selects it first; right-clicking an existing multi-selection retains it. Editing text/media keeps native context behavior. The existing Selection options menu remains available to touch users.
- Saved is a quiet status indicator; save failures/notices expand into visible recovery controls. Recovery dialogs and Library/resource pickers stay above the focused canvas.
- Updated the empty state, accessible canvas description, help dialog and Board contract. Added focused modules for tools, focus, Escape handling, context menu, text style and help; changed/new source files remain under 500 lines.

## Persistent formats and scope

No database migrations, API changes, dependencies, Board schema/content versions or portability changes. Focus and tool state are transient and reset when the editor is remounted. The normal hierarchy, resource ownership, optimistic revision handling, local recovery, upload guards, clipboard and history continue through their existing services.

No alignment guides/distribution, grouping, drawing, Mind Maps or later resource features are introduced.

## Commits

No commits created; existing uncommitted project work is preserved.

Suggested messages:

- `feat(boards): add focus mode and explicit placement tools`
- `docs(boards): document focus mode and interaction acceptance`

## Validation

| Command | Actual result |
|---|---|
| Targeted `vp fmt` on changed/new source files | PASS |
| `npm run types:check` | PASS (`tsc --noEmit`, exit 0) after the tool-state narrowing fix |
| `npm run lint` | PASS: 613 correctly formatted files; no warnings or lint errors in 514 files |
| `npm run build` | PASS: final production build completed in 11.83 seconds |
| `git diff --check` | PASS |
| Changed/new source file sizes | All under 500 lines; canvas 455, pointer handling 483 |

Build warnings remain for chunks above 500 kB, three mixed static/dynamic Document imports, and plugin timings. The complete final build output is in `/tmp/orbium-board-focus-build.log`. No PHP or migration code changed in this pass, so PHP/migration checks were not required.

No automated tests were written or run. Browser interaction and visual acceptance remain pending the user's manual review.

## Manual validation checklist

Use an empty Board and an existing Board with native content, images, code, tables and a linked Document. Wait for Saved before navigation when verifying persistence.

| Check | Steps | Expected result |
|---|---|---|
| Enter/exit Focus | Open a Board, pan/zoom to a recognizable area, then choose Focus. Choose Exit focus. Repeat with Escape while no editor/tool/gesture is active. | Focus fills the browser content viewport. App tabs/navigation, heading and Details disappear. Exit focus remains visible, the surrounding UI returns on exit, and the camera/object layout is retained. |
| Draft preservation | Start editing native text and type a sentence. Toggle Focus using the visible button, continue editing, then exit Focus and wait for Saved. Repeat with a hosted Document while it has unsaved content. | Editors remain mounted and typed content is preserved. Focus changes do not discard drafts, reset revisions or replace the content. Existing hosted save guards still apply. |
| Focus dismissal order | In Focus, choose Text and press Escape. Choose Text again, place a block, write, and press Escape; press Escape again after editing finishes. Open Add, Text style, View options and a dialog, pressing Escape in each. | Placement cancels first and Focus remains. Editing finishes before a subsequent Escape exits Focus. A menu/dialog closes without also exiting Focus. The explicit Exit focus action remains usable. |
| Select and Hand | With Select, click/drag an object and marquee several objects. Choose Hand and drag over empty space and over an image/text object. Hold Space with Select and pan over an object, then release Space. | Select changes object selection/positions. Hand/Space pan the camera without moving or editing objects. Releasing Space restores the active tool. The active dock state and cursor communicate the current tool. |
| Mouse placement | Choose Text; observe the count before clicking. Click near the canvas corner. Click Done, then choose Image and click another location. | Arming alone does not increase the count. Each click inserts one native object at the corresponding world position and returns to Select. Image upload/Library selection remains available. |
| Placement cancellation | Choose a block, press Escape or click Cancel, then click empty space. Arm a block again, drag more than six pixels and release. Repeat by dragging away and back to the start before releasing. | Cancel returns to Select and creates no object. Both drag gestures create no object; the placement tool remains armed until successful placement or cancellation. |
| Placement after pan/zoom | Pan/zoom, choose a block through Add and click a recognizable dot/position. Repeat after zooming far out/in. | Placement uses the transformed world point rather than the untransformed screen coordinate. Only one object is added per successful gesture. |
| Empty-space double-click | With Select active on an empty and a populated Board, double-click empty space. Then double-click an existing text object. | Empty-space double-click adds nothing. Existing-object double-click enters editing, with no extra object. |
| Keyboard placement | Tab to Text or open Add with the keyboard and choose Heading. Press Enter after the placement hint appears; finish editing with Escape. | Choosing the type focuses the canvas. Enter inserts one object at the current view center. Escape finishes the edit; the block persists after Saved/reload. Tab focus indicators remain visible. |
| Native block types | Use Add to choose List, Quote, Callout, Code, Table, File, Math, Mermaid and Divider, clicking to place each. Edit the applicable blocks. | All existing types remain available; choosing a type requires placement and does not immediately add a block. Existing field and media behavior remains. |
| Context menu | Right-click an unselected native object; duplicate it, fit its height and change layers. Shift-select two objects and right-click within that selection. Open Selection options using touch/keyboard. | Right-click selects the intended object or retains the existing multi-selection. Actions apply to that selection. The same actions remain reachable without right-click. |
| Native editor context menus | Enter text editing and right-click selected text. Right-click a link or media control. Open a context menu then choose Edit on a text object. | Native text/link/media context behavior remains available. Choosing Edit from the canvas menu starts editing without taking focus away from the new editor. |
| Compact text styling | Select text and open Text style; switch to Heading, choose a size, then change alignment and direction. Open the inline bold/italic/link controls while editing. | The contextual toolbar stays compact. All previous style options remain accessible and persist through save/reload. Text keeps its transparent canvas surface. |
| Selection at edges | Select/move objects near each edge, pan, and zoom from about 10% to 400%. Repeat for a multi-selection. | Context tools remain the same readable screen size, stay within the available viewport area and reserve space for the docks. Resize handles retain their existing usable size. |
| Save errors in Focus | In Focus, make a change with the network offline, then restore connectivity and retry. In two browser tabs, save in one and change the stale Board in the other to trigger a conflict. | Failures are clearly visible with retry where permitted and draft download/latest recovery actions. A conflict keeps the local snapshot. Recovery dialogs remain above the focused canvas; Cancel preserves local work. |
| Upload/IME guards | Start an upload, then try switching tools, finishing editing or switching resource cards. While composing text with an IME, press Enter/Escape and try switching tools; finish composition and save. | Upload/hosted-document guards still prevent unsafe switching. IME Enter/Escape do not prematurely place/finish a block. Completed composition and uploads remain in the draft/save flow. |
| Resource cards | Use Page in normal and Focus modes to link an existing Document or create a sibling Document. Edit and save it, open its original page, return, then remove its card. | Resource pickers remain usable above the canvas. The original Document receives edits, creation uses the existing sibling workflow, and removing the card keeps the original page. |
| History and clipboard | Duplicate, delete, undo/redo, and copy/cut/paste objects in both modes. Wait for Saved and reload. | Existing snapshot history and clipboard behavior remain; saved content/geometry return after reload. Tool/focus presentation changes do not create content history entries. |
| Narrow screens and appearance | Check normal and Focus modes at 1440×900, 1280×720, 640×800 and 390×844; try a short landscape window. Repeat in light/dark and normal/frosted appearance with reduced motion. | Controls are legible, Exit focus stays accessible, creation/view docks do not overlap, menus scroll within the available viewport, and no camera animation is introduced. Very short views may scroll the control panels. |
| Touch placement and pinch | On a touch device, arm Text and tap to place. Arm another block, begin a two-finger pan/pinch and release. Choose Hand and pan over an existing object. | A tap places one object; pinch adds none; Hand pans without moving the object. Touch users retain Selection options for object actions. |
| Navigation cleanup | Enter Focus, use existing app navigation shortcuts or a resource card to navigate away, then open a Document/explorer and return to a Board. | Other pages regain their navigation, scrolling and keyboard controls. Focus/inert state does not leak into another page. Unsaved navigation guards retain their existing behavior. |

## Issues addressed during source review

- Removed a redundant Hand comparison after the pan branch had already narrowed the tool type; the subsequent TypeScript check passed.
- Suppressed block-picker close-focus restoration after choosing a tool, so Enter reaches the canvas placement handler.
- Prevented context-menu close-focus restoration from stealing focus when its Edit action starts an editor.
- Prevented a placement drag that returns to its starting position from creating an object.
- Kept Hand/placement keyboard handling from falling through into object edit/selection shortcuts; undo/redo remain available.
- Protected native inline IME input from Escape/Enter handlers and added composition guards around canvas editing/tool switching.

## Known limitations

- Manual browser and visual acceptance is pending the user's review; no claim of manual verification is made.
- Focus fills the browser content area; browser tabs/address bars remain under browser control.
- Focus/tool state is local to the mounted Board editor and is not restored across reload/navigation.
- Native block placement uses a crosshair and instructional hint; it does not display a rendered block ghost. Resource cards retain their existing picker/center-insertion workflow.
- The custom context menu is available with Select while no editor is active; active editors retain native context behavior. Touch can use the visible Selection options button.
- Very small/short viewports can require menu/panel scrolling. Existing rich blocks/hosted Documents retain their manual dimensions and internal scrolling.

## Stop gate

Stop for manual review. No Mind Map or later Boards phase is started.
