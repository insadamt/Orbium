# Boards — UX and interaction audit

Implementation follow-up: the user approved these recommendations with “okey fix all that”. See `12-boards-ux-correction.md` for the resulting corrections and pending manual acceptance. This audit preserves the original investigation evidence.

## Scope and conclusion

2026-10-18. Investigation requested by the user because Boards feel glitchy and poorly designed. This is a phase-4 review report, with recommendations for approval. No application code, persistent format, dependency, or migration was changed, and no later phase was started.

The first priority should be interaction reliability. The current implementation combines canvas selection/movement, separate inline editors, structural controls, and two levels of history without a consistent editing experience. Several layout rules also have concrete conflicts. A visual redesign should follow the interaction corrections so the new appearance rests on predictable behavior.

Reviewed the current Boards contract, phase-4 brief, previous investigation and presentation reports, product/domain/scope documentation, UI system, and the canvas, pointer, camera, editing, history, autosave, resource, toolbar, and styling implementation.

Evidence labels used below:

- **Source finding:** behavior or conflicting rules are present in the implementation. This does not mean the issue was reproduced manually.
- **Layout risk:** source suggests an unwanted visible result; confirm in the running browser.
- **Design proposal:** a recommended interaction or presentation decision, requiring manual review.
- **Performance hypothesis:** work exists on a frequent path; its user-visible cost has not been measured.

Desktop capture failed through the available providers, including a denied/cancelled screenshot portal request. Targeted browser accessibility returned only the application/frame, without page contents. No live visual inspection, interaction reproduction, or performance measurement was completed. No screenshot or automated browser workaround was used. Subjective visual findings remain proposals, not observed screenshots.

## Priority 1 — Correct the sources of glitches

### 1. Separate clicking from dragging

**Source finding.** `use-board-pointer.ts:229` creates a move/resize gesture immediately after pointer down. Subsequent pointer moves update geometry without a movement threshold. The six-screen-pixel threshold in this file applies to block placement only. Smart alignment can add a correction even for a small movement.

**Likely consequence:** a slightly shaky click or double-click can move an object and create a history/save change while the user intends to select or edit it.

**Recommendation:** keep a pending click state, begin movement only after a small screen-space threshold, and resolve double-click editing without committing incidental movement. Preserve explicit tool placement and the current rule that double-clicking empty space creates nothing. Do not depend on zoom for the physical drag threshold.

### 2. Make lists and tables behave like editable content

**Source finding, also documented in the previous review.** `board-inline-text.tsx:52` restricts editing to one paragraph. Its Enter handler always inserts a hard break (`:118`). `board-text-block.tsx` renders independent item/cell editors and uses separate buttons for structural operations. There is no Board-specific list split/merge or table cell Tab navigation. Indentation is stored and displayed, but there is no native Board indent/outdent command.

**Consequence:** writing a list requires repeated button use; a table feels like isolated text boxes rather than a coherent table.

**Recommendation:** give each list/table one block-owned editing session. Define Enter to split a list item, Shift+Enter for a soft break, Backspace at an item boundary to merge, and Tab/Shift+Tab for indent/outdent. For tables, define Tab/Shift+Tab cell traversal, caret placement on cell activation, and predictable focus after adding/removing a row or column. Decide empty-list-item exit behavior explicitly before implementation. Retain native Board objects and their compatible data format; this does not require turning them into miniature Documents.

### 3. Unify the experience of Undo and Redo

**Source finding.** Item/cell keys change when a different field becomes active (`board-text-block.tsx:48`), remounting a Tiptap editor and its local history. Board-level Undo/Redo uses whole-object snapshots (`use-board-objects.ts:216`) and the visible history buttons invoke that history directly (`board-toolbar.tsx`). Typing inside an active field uses editor history instead. Content changes are grouped by object ID in `board-canvas.tsx:176`.

**Consequence:** the visible Undo button and the keyboard shortcut can undo at different granularities. Moving between fields discards the previous field's editor history. The existing deletion-remount fix protects surviving content but does not solve the history design.

**Recommendation:** agree on one chronological user-facing history policy for text and structural changes within a block. Route toolbar and keyboard actions consistently to the active session; canvas movement remains one completed gesture. Preserve history when switching list items/table cells. Ensure leaving editing does not cause content to be undone twice or collapse a long session into a surprising single removal.

### 4. Define one wheel, scroll, and zoom policy

**Source finding.** `use-board-camera.ts:182` yields to any editor/interactive target before handling wheel input. It also yields to overflowing object bodies outside editing. `board.css` gives object bodies internal scrolling and contained overscroll.

**Consequence:** ordinary wheel input can pan the canvas over empty space and scroll a card over content. Editor/interactive targets also bypass canvas Ctrl/Cmd+wheel handling; verify whether browser page zoom takes over there.

**Recommendation:** while browsing, ordinary wheel input pans the canvas consistently. Allow internal content scrolling during deliberate editing/content interaction. Specify ownership at scroll boundaries and for media controls. Define cursor-centered canvas zoom over previews, and verify pinch/modified wheel inside active editors without accidental browser zoom. Keep necessary code/table/media scrolling usable.

### 5. Fix expanded save-message geometry

**Source finding with a layout risk.** `board-chrome.css:88` positions the save panel with `bottom: 20px`. `board-workspace.css:58` adds `top: 72px` for expanded/error states without clearing bottom. With automatic height, those two insets can stretch the panel through most of the canvas. Small-screen rules also retain a bottom inset. The expanded state includes ordinary recovery/navigation notices, not just failures (`board-save-status.tsx:25`).

**Recommendation:** define a compact, content-sized status surface and a bounded error/recovery surface with one vertical anchor. Keep status near Board identity and keep recovery actions reachable. A blocked navigation notice should not become a canvas-sized obstruction. Preserve retry, draft download, and confirmed replacement with server content.

### 6. Give the properties panel its own stable positioning root

**Source finding with a layout risk.** `board-selection-tools.tsx:100` renders the properties panel inside the selection toolbar. That toolbar has `glass-surface`. `board-object-design.css:203` makes the panel fixed, while `resources/css/appearance-frosted-components.css:95` gives glass surfaces a backdrop filter. A filtered ancestor can establish the containing block for fixed descendants.

**Likely consequence:** the inspector's right/top/bottom coordinates can resolve against the moving toolbar in Frosted mode, rather than the viewport. The resulting placement can vary by appearance mode. Small-screen toolbar overflow also needs checking for clipping.

**Recommendation:** render the inspector as a sibling overlay or through an explicit overlay portal. Give it a viewport/stage positioning root and layer order independent of the moving toolbar. Make its occupied area part of toolbar and fit-view placement calculations. Review Normal, Frosted, and reduced-transparency appearances.

## Priority 2 — Make the experience calmer and easier to understand

### 7. Keep content geometry stable when entering editing

**Source finding with a layout risk.** `board-object-card.tsx:53` measures the first content element whenever editing changes. Lists introduce a style selector, removal controls, and an Add item action only during editing. `use-board-objects.ts:55` persists measured height through the normal save path. Source/media blocks similarly introduce controls into their content layout when activated.

**Recommendation:** measure authored content separately from temporary editor controls. Put structural actions in a contextual control area that does not change the content's saved size. Maintain the same typography, wrapping, and content origin between preview and editing. Opening and closing editing without changing content should not alter layout or create unnecessary saves after initial measurement has settled.

### 8. Stabilize contextual tools and simplify the chrome

**Source finding/design proposal.** The selection toolbar follows object geometry during selection but moves to a lower reserved position during editing (`use-board-selection-anchor.ts:56`). It remains clamped into view even when its selected object is outside the viewport. The current layout independently positions identity, history, save status, block count, creation tools, zoom controls, placement hints, selection tools, and properties.

**Recommendation:** use a small number of predictable zones:

| Zone | Proposed responsibility |
|---|---|
| Top | Back, Board identity, save state, and history with clear spacing |
| Bottom center | Select, Hand, and creation tools with a strong active-tool cue |
| Bottom right | Zoom and Fit controls |
| Beside selection | Short contextual actions when the selection is visible |
| Stable editing position | Formatting for the active block; avoid following the caret or fighting menus |
| Right overlay | Optional properties inspector with a dedicated positioning root |

Specify toolbar movement on edit entry deliberately, avoid covering the active text, and suppress irrelevant arrangement actions while writing. Hide or clearly explain contextual tools when their object is offscreen. Reserve space for the inspector and save messages instead of independently clamping each overlay.

This is a design proposal. Full-screen Boards, visible guarded Back navigation, and explicit creation tools are already intentional product decisions and should remain.

### 9. Make responsive layout and touch deliberate

**Layout risk/design proposal.** Bottom docks and save status are positioned independently. The compact breakpoints move the creation dock but do not provide a common collision layout. At small widths, status/error text and view controls need explicit coexistence rules. Many general buttons are 34px high; list deletion and resource actions are smaller, and resize interaction uses narrow edge targets.

**Recommendation:** design desktop, compact-window, and touch arrangements as explicit layouts. Collapse secondary controls into menus, keep text readable, provide larger invisible hit areas where needed, and keep important actions reachable with the on-screen keyboard open. Retain the visible Edit action as an alternative to double-click. Check short landscape windows as well as narrow portrait widths.

### 10. Improve sizing, positioning, and editing affordances

**Source finding/design proposal.** `board-keyboard.ts:64` uses 8-unit arrow movement and 32-unit Shift movement. Resizing exposes east/south/southeast handles, with automatic-height text using only east (`board-object-card.tsx:156`). Link editing uses `window.prompt()` (`board-inline-text.tsx:255`). Native blocks, resource references, and original Document editing use substantially different control surfaces.

**Recommendation:** provide a finer movement modifier and clearer size feedback; review handle visibility/hit areas across zoom levels. Consider preserving image aspect ratio by default during corner resizing while keeping an explicit way to change it. Replace the link prompt with the app's own anchored editor, including invalid-address feedback. Use consistent spacing, labels, and interaction states across native blocks, while keeping content-appropriate surfaces. Preserve transparent text/headings/images and the current monochrome identity rather than wrapping everything in cards.

For resource cards, make “linked original” and the target type clear before editing. The current original-Document warning is useful and should remain. When saves/uploads temporarily disable Board actions, show the reason beside the active operation so the Board does not appear frozen. Removing a reference must continue to keep the original page.

Keyboard focus treatment should follow the user's existing UI preferences. Any new cue should use the agreed app styling rather than silently introducing a different global focus treatment.

## Priority 3 — Measure and then address performance

**Performance hypotheses, not measured regressions.** The implementation already uses requestAnimationFrame camera/drag painting, preview culling, and one active editor; preserve those strengths.

Potential work to inspect with manual browser profiling:

- Every content commit validates all objects, traverses/serializes their data, and sorts layers (`use-board-objects.ts:36`, `board-api.ts:24`). Single-field typing therefore performs work beyond that field.
- Local recovery serializes the whole snapshot after a 150ms pause; saving validates and serializes the full snapshot again (`use-board-autosave.ts`, `board-recovery.ts:32`, `board-api.ts:178`).
- Smart-guide candidate filtering/alignment runs on pointer events before the animation-frame paint. Painting queries object elements and selection geometry; the toolbar observes style mutations across the world and reads layout (`use-board-pointer.ts`, `board-pointer-paint.ts`, `use-board-selection-anchor.ts`).
- Selected objects are deliberately kept mounted even outside the viewport. Select All can therefore mount many rich previews (`board-canvas.tsx:231`). Active editors must still remain mounted for data safety.

Profile representative small and large Boards while typing, dragging a multi-selection, zooming, and opening code/media/Document cards. Record input responsiveness, long tasks, frame consistency, and preview mounting. Then consider validating changed objects with cached aggregate budgets, avoiding unnecessary layer sorting, caching element/guide candidates per gesture, and narrowing toolbar observation. Preserve complete validation at save boundaries and existing limits, conflict handling, and recovery guarantees. Do not introduce a new canvas engine or infrastructure without evidence that it is needed.

## Recommended implementation order

These are focused corrections within the current review, each followed by manual acceptance, rather than authorization to start a later feature phase.

1. **Interaction and layout safety:** click/drag separation, wheel ownership, expanded save geometry, and inspector positioning.
2. **Native editing:** list/table session behavior, coherent history, caret/focus handling, and content-only sizing.
3. **Presentation:** consistent chrome zones, stable contextual tools, responsive layouts, and block-specific visual refinement.
4. **Measured performance:** profile the corrected experience, address demonstrated bottlenecks, then repeat the representative manual checks.

Mind Maps, grouping, drawing, minimap, Board import/export, and unrelated application redesign remain outside this investigation. The existing phase-4 save/ownership/recovery contracts should be retained.

## Validation actually performed

| Check | Result |
|---|---|
| Documentation and implementation review | Completed; findings and limitations recorded above |
| `npm run types:check` | Passed; `tsc --noEmit`, exit 0 |
| `npm run lint` | Passed; all 620 checked files formatted; no warnings/errors in 520 linted files |
| `npm run build` | Passed in 12.22s; 5,448 modules transformed |
| Whitespace | `git diff --check` passed after report creation; the untracked report also passed a separate trailing-whitespace/final-newline check |
| Automated tests | Neither written nor run, per user instruction |
| Manual browser reproduction/visual acceptance | Pending; screenshot capture unavailable and browser accessibility exposed no page contents |

Build warnings: mixed static/dynamic imports for document-image-crop-dialog, database-property-header, and document-editor-loader; minified chunks above 500 kB. These are baseline warnings and do not establish a Board interaction regression. PHP checks and migration validation are not applicable to this documentation-only investigation.

Passing static checks do not demonstrate that the current UX is acceptable.

## Manual test checklist

Use a disposable Board with text, a three-item list, a small table with distinct cell values, code, an image, an overflowing card, and a Document reference. Record present failures first. The expected results below are acceptance targets for the proposed corrections; they are not claims that the current implementation passes.

1. **Select versus drag:** at 25%, 100%, and 200% zoom, click and double-click text with minor pointer movement. Expected: selection/editing does not move it; a deliberate drag starts after a consistent physical threshold and Undo restores the previous position.
2. **Placement/cancellation:** choose Text, click once, then try dragging while another placement tool is armed. Press Escape. Double-click blank space in Select. Expected: click places one object and returns to Select; drag/cancel inserts nothing; blank double-click creates nothing.
3. **List writing:** type Alpha, press Enter, type Beta; use Shift+Enter, boundary Backspace, and Tab/Shift+Tab. Expected: normal item split/merge, soft break, and indentation work without requiring Add item for ordinary writing.
4. **Table navigation:** enter distinct text in adjacent cells using Tab/Shift+Tab. Add/remove a row and column. Expected: focus follows a defined cell order, surviving values remain intact, and no removed field's content reappears.
5. **History consistency:** edit multiple list items/cells, change structure, leave editing, move the block, then undo/redo with both the toolbar and keyboard. Expected: chronological, documented behavior; text is neither skipped nor undone twice, and movement remains one step.
6. **Scrolling and zoom:** wheel over blank canvas, text, inactive code/table/media, and an active editor. Repeat with Ctrl/Cmd+wheel and pinch. Expected: browsing pans consistently, deliberate inner scrolling works, and canvas/browser zoom ownership does not change unexpectedly.
7. **Save messages:** use browser offline mode on the disposable Board, edit, and wait for a save failure; then restore networking and retry. Also attempt Back while unsaved. Expected: compact, readable feedback and reachable recovery actions; the panel does not fill most of the canvas. Retry retains the edit and reaches Saved. Do not load the server snapshot without first downloading any draft you want to keep.
8. **Properties placement:** open properties, pan/zoom, move/select objects, and repeat in Normal/Frosted plus reduced transparency. Expected: the panel stays in its intended viewport zone without following the toolbar or clipping; Escape closes it and returns focus.
9. **Stable editing geometry:** after initial layout settles, note a list/text block's size and location; enter/exit editing without changing content. Expected: no jump caused by editor controls, no new authored layout change, and stable preview/editor wrapping.
10. **Contextual tools:** edit objects near each viewport edge, pan the selection out of view, and open properties. Expected: tools remain relevant, do not cover the active text or other docks, and do not float without a clear connection to an offscreen selection.
11. **Responsive/touch:** check 1440×900, 1024×768, 640×480, and a 390px-wide phone viewport. Use Edit and the on-screen keyboard on touch. Expected: identity, creation, view/status controls, and Done remain reachable without overlaps or clipped menus.
12. **Size and precision:** resize an image and a text block at several zoom levels; move with the proposed fine modifier. Expected: discoverable handles, predictable text reflow, deliberate aspect-ratio behavior, and fine positioning without surprise jumps.
13. **Linked resources:** edit a referenced Document and wait for its save; open the original, then remove only the card. Expected: original content is updated, the reason for temporary disabled actions is visible, and card removal keeps the original Document.
14. **Persistence/navigation:** wait for Saved, reload, then use Back. Expected: all content and geometry remain correct and ordinary surrounding application navigation returns. During an upload/save, navigation protection keeps the content safe and explains the temporary block.
15. **Manual performance review:** on separate small and large disposable Boards, profile typing, multi-object drag, pan/zoom, and Select All with browser developer tools. Expected: record the actual bottlenecks before optimizing; no unmeasured speed or frame-rate claim is accepted as verification.

## Commits and handoff

No commits were created. Existing uncommitted work was preserved. The only authored file in this investigation is this report; the production build refreshed generated build output.

Suggested message for this report:

- `docs(boards): document interaction and UX improvement audit`

Suggested messages for future approved, separately implemented corrections:

- `fix(boards): stabilize pointer gestures and overlay positioning`
- `fix(boards): unify native list and table editing history`
- `refactor(boards): simplify canvas controls and responsive layout`

Remain in phase-4 review. The user has requested recommendations; implementation of these proposals is pending their direction.
