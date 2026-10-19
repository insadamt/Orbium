# Boards — Interaction and UX correction

## Phase and authorization

2026-10-18 — current phase-4 review. The user approved the recommendations in `12-boards-ux-audit.md` with “okey fix all that”. These corrections remain within Boards; no later phase was started.

## Implemented

### Reliable canvas input

- Object movement and resize require six screen pixels before changing geometry. Small click/double-click movement no longer triggers snapping or a saved move.
- Pointer capture remains on the object when interacting with an object, preserving double-click edit targeting instead of retargeting the click to the canvas.
- Inactive previews pan the canvas on ordinary wheel input. Active editing and media players retain internal scrolling. Ctrl/Cmd+wheel is handled in capture phase by cursor-centered canvas zoom, including over editors/players, so those targets do not accidentally switch to browser zoom.
- Arrow move/resize uses 1-unit steps and Shift uses 10. Alt bypasses resize snapping as well as movement snapping. Image corner resizing preserves the existing frame ratio unless Shift is held.

### Native writing and history

- Replaced independent list-item/table-cell editors with one constrained Tiptap session per active native block. The editor adapts to the existing native JSON; it does not mount a Document or persist a new document-shaped format.
- Lists split items with Enter, insert soft breaks with Shift+Enter, merge at item boundaries with the editor's Backspace behavior, and indent/outdent with Tab/Shift+Tab, within the existing 12-level bound.
- Enter on an empty indented item outdents. Enter on an empty top-level item removes it when the list has other items, then finishes editing; a sole empty item remains available as a blank list.
- Tables use Tab/Shift+Tab cell navigation. Tab at the final cell adds a row, subject to the existing 100-row limit. Row/column actions live in contextual tools and keep the same block session. The existing 30-column limit remains enforced.
- Checklist rows use an explicit node view and native change handler so mouse and keyboard checkbox changes update the same validated native data.
- Native text, list/table structure, code/math/diagram edits, and canvas actions use the same Board history through toolbar and Ctrl/Cmd+Z/Shift+Z/Y. Typing groups end after 700ms idle; native cursor/field changes, structure, formatting, paste and cut establish boundaries. History remains bounded to 40 Board snapshots. Undo preserves a surviving active session and restores a nearby valid caret position.
- Referenced Documents and property/link inputs keep their independent histories. IME, uploading, conflict and hosted-Document locks still protect replacement/navigation. History toolbar actions check current locks at invocation rather than relying only on disabled presentation.
- Replaced `window.prompt()` link editing with an anchored application popover, a labeled address field, Apply/Remove actions, safe-link validation feedback and editor focus restoration.

### Stable, quieter layout

- List style and table structural controls render outside measured object content. Preview/editor typography and list row structure share sizing. Code header rows use matching height in preview/edit modes.
- Authored text/list height is measured with ResizeObserver; transient pointer-resize previews are excluded. Measurement updates do not create separate undo entries.
- Save status sits below identity. Expanded notices/errors clear the opposite vertical inset and have bounded scrolling height, preventing accidental canvas-sized panels. Upload/linked-Document activity explains why controls are temporarily locked.
- Properties render as a stage sibling of the floating toolbar, avoiding filtered-ancestor fixed positioning. On compact windows the inspector becomes a lower sheet; tools reserve its space or yield while the sheet is open. Opening/closing properties manages keyboard focus.
- Contextual editing tools use a stable lower position, arrangement actions are hidden while writing, and creation tools yield to active editing. Offscreen inactive selections hide their toolbar; an active offscreen edit retains its Done controls and an offscreen label.
- Fit view reserves identity, dock and inspector space. Board height follows the visual viewport when a touch keyboard opens. Touch controls and invisible resize targets are larger.
- Preserved full-screen Boards, guarded Back, transparent native writing/image surfaces, existing monochrome/Frosted appearance, and explicit tool placement. Focus cues use existing background/text treatment rather than adding new focus rings.

### Reduced repeated work

- The editing model caches validation and byte counts by immutable native-data identity. Every commit still checks identities, layout and aggregate budgets; server-bound snapshots still receive complete uncached validation.
- Already-normalized layers skip sorting. Smart-guide candidates are captured once per gesture. Drag painting builds one element lookup rather than querying separately for every moved object.
- Contextual tools observe the world transform, selected geometry and direct child changes rather than all descendant style changes. They reattach when culled selected previews return.
- Inactive offscreen selected previews are culled. Selection data and group geometry remain complete; an active editor remains mounted. Group painting includes offscreen selected objects in its bounds.

These are reductions in known repeated processing, not a measured frame-rate or latency claim. Manual browser profiling remains part of acceptance.

## Files and compatibility

Frontend changes are limited to `resources/js/components/boards/`. New responsibilities are split into the native editor, schema adapter, formatting popover, checklist node view, history keyboard handler, resize geometry, and focused interaction CSS. All Board source files remain below 500 lines at handoff.

Documentation updated: `Docs/START_HERE.md`, `Docs/docs/24-boards.md`, the current phase brief, audit handoff and this report.

No dependencies, backend APIs, database migrations, spatial format, native content version, ownership rules, Library lifecycle, Document persistence or recovery format changed. Existing unrelated uncommitted work was preserved. The production build refreshes generated output.

## Actual validation

| Check | Actual result |
|---|---|
| `npm exec vp fmt -- resources/js/components/boards` | Passed; 61 files formatted |
| `npm run types:check` | Passed; `tsc --noEmit`, exit 0 |
| `npm run lint` | Passed; 627 files correctly formatted, 526 files without lint warnings/errors |
| `npm run build` | Passed in 14.51s; 5,455 modules transformed |
| `git diff --check` and separate untracked-source/report whitespace inspection | Passed at handoff |
| Source size | Largest Board source is 496 lines; Board canvas is 492 lines |
| Automated tests | Not written or run, per user instruction |
| Live browser/manual checks and profiling | Pending user execution; no visual or performance acceptance claimed |

Build retains the existing mixed static/dynamic import warnings for document-image-crop-dialog, database-property-header and document-editor-loader, plus large-chunk and plugin-timing notices. The full final build log is `/tmp/orbium-boards-ux-build.log`. PHP and migration checks do not apply to this frontend-only correction.

## Manual acceptance checklist

These checks are pending user execution. Use a disposable Board with text, heading, a three-item list, a 2×2 table containing distinct values, code, an image, a long overflowing block and a Document resource card. Start at 100% zoom and wait for Saved between persistence checks.

1. **Click and double-click:** select text with a slightly shaky click, then double-click at 25%, 100% and 200% zoom. Expected: no incidental movement/save; double-click edits at the clicked text. A deliberate drag moves only after the six-screen-pixel threshold. Escape during the drag restores the original position.
2. **Creation tools:** choose Text, click once, and finish editing. Arm another tool, drag instead of clicking, then press Escape. Double-click blank canvas in Select. Expected: the single placement creates one block; dragging/cancellation and blank double-click create nothing.
3. **List structure:** type Alpha, press Enter, type Beta. Split a word with Enter; add a line with Shift+Enter; press Backspace at a following item's start. Expected: items split/merge naturally, soft breaks stay within an item, and text/formatting survive.
4. **Indent and exit:** Tab/Shift+Tab within list text. Press Enter on an empty indented item, then on an empty top-level item. Expected: indentation changes within 0–12; empty indented items outdent; empty top-level items finish editing, removing that item only when another item remains.
5. **Checklist:** switch the list to Checklist, toggle rows with mouse and with Space while a checkbox is focused, then undo/redo. Repeat outside editing and reload after Saved. Expected: every toggle updates the intended item and persists; no checkbox change exists only visually.
6. **Table navigation:** fill cells using Tab/Shift+Tab, then Tab from the final cell. Expected: focus travels through cells in order and a final-cell Tab adds one row within limits. Enter/Shift+Enter inserts a line inside a cell, without creating invalid multi-paragraph cell data.
7. **Table structure:** remove a row/column containing unique values and type into a surviving cell. Undo/redo, wait for Saved, and reload. Expected: the surviving content remains correct, removed content does not overwrite another cell, and structural operations remain reversible.
8. **Shared history:** type in different list items/table cells, change formatting, leave editing, move the object, and alternate toolbar Undo/Redo with Ctrl/Cmd+Z/Shift+Z. Repeat in native code/math. Expected: chronological content/layout changes, typing grouped by pauses, one completed gesture per layout action, and no lost field history from remounting. A surviving active editor remains usable after Undo.
9. **Original Document history:** edit a referenced Document, use its text Undo, and wait for its save. Open the original. Expected: its editor keeps its own history and the saved original contains the intended content; Board Undo does not replace a dirty hosted Document.
10. **Wheel ownership:** wheel over blank canvas, inactive text/code/table, an active editor and an interactive player; repeat with Ctrl/Cmd+wheel. Expected: inactive previews pan; deliberate active editing/player scrolling stays inside content; modified wheel zooms the Board around the pointer rather than the browser page. Hand/Space/middle drag still pan.
11. **Stable writing layout:** after initial measurements settle, enter/exit text/list/code editing without editing content. Expected: no structural action rows push authored content, no unexpected saved text/list height change from merely showing controls, and preview/editor wrapping stays consistent. Resize text width; content height follows the new wrapping.
12. **Properties and Frosted:** open properties in Normal and Frosted, change width/position, pan/zoom, and switch objects. Expected: inspector positioning is independent of the floating toolbar; valid field edits commit before selection changes; Escape closes it and returns focus to visible tools or canvas. Fit view keeps objects clear of the open inspector.
13. **Save failure and recovery:** temporarily enable browser offline mode, edit a disposable block, and wait for Not saved. Download the draft, restore networking, and retry. Expected: the error surface is bounded, recovery actions are reachable, retry retains content and reaches Saved. Loading latest still requires confirmation and replaces local content only after that choice.
14. **Busy and leave protection:** while uploading or saving/opening a referenced Document, attempt Back, editing completion and history actions. Expected: current protection retains pending content, status explains the active operation, and guarded navigation succeeds after saving finishes. During IME composition, text and the active session are preserved.
15. **Link editor:** select text, apply a valid link, edit/remove it, and try a disallowed scheme such as `javascript:`. Expected: the anchored form retains selection, invalid links show feedback, accepted changes are undoable, and closing restores editor focus without scrolling the canvas.
16. **Precision/image resize:** use arrows and Shift+arrows; resize an image from its corner, then with Shift. Expected: movement steps are 1/10 units, corner resize retains frame ratio by default, Shift permits free frame sizing, and Alt bypasses resize grid snapping.
17. **Responsive/touch:** inspect 1440×900, 1024×768, 640×480 and approximately 390px-wide viewports, including a touch keyboard. Expected: reachable Done/formatting, no creation/view dock collision, bounded save feedback, a compact properties sheet, larger touch targets and visible viewport height following the keyboard.
18. **Culling and multi-selection:** select objects spread beyond the viewport; pan them out and back, then group-drag, fit, undo and reload. Expected: selected data remains intact, group bounds include offscreen objects, contextual tools reattach on return, and active editors/uploads remain mounted and protected.
19. **Persistence and Back:** wait for Saved, reload, and use Back from both normal navigation and a directly opened nested Board. Expected: native content/geometry persists, the appropriate previous page/parent opens, and normal surrounding navigation returns.
20. **Manual performance profiling:** compare representative small and large Boards in browser developer tools while typing, dragging a multi-selection, zooming and using Select All. Expected: record actual long tasks/frame consistency before accepting a speed claim. Static checks alone do not verify responsiveness.

## Known limitations

- Live visual/interaction acceptance and browser performance measurements have not been performed. Desktop capture was unavailable during the audit; this pass followed the user's manual-test workflow rather than running automated browser tests.
- Board history is transient and snapshot-based, with 40 entries, not durable per-character revision history. A referenced Document deliberately owns separate content history.
- Existing object, geometry, content, table/list and recovery limits remain. Touch/appearance behavior needs the representative manual checks above.
- No later features such as Mind Maps, grouping, drawing, minimap or Board import/export were introduced.

## Commits

No commits created. Suggested logical commit messages:

- `fix(boards): stabilize canvas gestures and overlay positioning`
- `fix(boards): unify native editing and undo history`
- `refactor(boards): refine responsive controls and reduce repeated work`

## Stop gate

Remain in phase-4 manual review. Await the user's manual results before any later feature phase.
