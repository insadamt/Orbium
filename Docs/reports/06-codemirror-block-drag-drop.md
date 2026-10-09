# CodeMirror block drag and drop

## Scope

Focused repair and extension of the current Markdown editor's M5 block interaction. The user requested drag and drop and selected extending CodeMirror with Orbium-owned block-drag logic. This does not advance the migration phase or establish replacement acceptance.

## Implemented

The follow-up below supersedes the original native-drag implementation and touch limitation.

- A draggable grip that permits native mouse dragging. The previous shared button helper prevented mouse-down's default behavior; the grip now uses its own button while the add button retains selection preservation.
- A dedicated drag controller, separated from the block menu/gutter. Custom block drops are intercepted during capture before CodeMirror and nested rich editors process them. Ordinary file and text drops continue through their existing handlers.
- A fixed, body-mounted insertion line and native text preview. Target geometry spans multi-line blocks and resolves blank separators to surrounding blocks. Horizontal gutter coordinates are clamped to the content area. Fixed screen coordinates avoid mixing scaled viewport measurements with editor-relative offsets.
- Edge scrolling through the actual scrollable editor/page ancestors, with window fallback and clipped viewport bounds. Targets are refreshed under the pointer while scrolling. Animation frames stop when scrolling stops and are removed when the drag ends.
- Cleanup after drop, native drag-end, Escape, window blur, document changes, editor deactivation and destruction. Document changes cancel the drag with a notice. Drag completion suppresses an incidental handle click.
- Existing source-range moves preserve complete lists, quotes, rich blocks and presentation wrappers. Moves remain isolated undo transactions and use normal autosave. Already-adjacent placements are ignored; read-only state is explicitly respected.
- Existing Alt+Shift+Up/Down and block-menu move actions remain available.

## Library decision

Reviewed the official [CodeMirror reference](https://codemirror.net/docs/ref/) and [extensions list](https://codemirror.net/docs/extensions/) alongside [dnd-kit sortable guidance](https://dndkit.com/legacy/presets/sortable/overview/). CodeMirror supplies DOM event and source transaction primitives; dnd-kit supplies sortable item coordination and overlays. Our assessment: mapping React sortable items onto CodeMirror-owned, virtualized block DOM would require an adapter. The user chose Orbium-owned block logic on the installed CodeMirror primitives. No packages were installed or upgraded.

Native HTML dragging is a desktop interaction; touch dragging is not implemented or claimed. Keyboard/menu movement remains the alternative. Moving between documents, nested block reparenting and dragging multiple selected blocks are outside this focused change. List/quote/container handles move the complete top-level block.

## Commits and persistence

No commit created. Suggested message:

`feat(editor): improve CodeMirror block drag and drop`

No migration, persistent format, API or attachment authorization changes.

## Validation

Automated tests were neither written nor run, following the user's instructions. Browser/manual acceptance remains pending.

Final checks all exited with status 0:

- Targeted `vp fmt`: formatted the changed source files successfully.
- `npm run types:check`: passed.
- `npm run lint` (`vp check`): passed; 364 formatted files checked, no warnings or lint errors in 298 linted files.
- `npm run build`: passed in 8.99 seconds. Warnings remain for chunks over 500 kB and mixed static/dynamic imports of document image crop, media menu, database property input/header, document opening preview and editor loader modules.
- `git diff --check`: passed.

No PHP files changed, so PHP checks were not needed.

## Manual test checklist

Use a disposable Markdown document. Add three separated paragraphs labelled A, B and C, a multi-line paragraph, a multi-item list with a nested item, a quote, a code block, a table, an image/file, a callout, a Mermaid block and a divider with custom appearance. Use a long document for the scrolling checks.

1. Hover A and hold-drag its grip over the lower half of C, then release. Expected: a text preview follows the drag, the source dims, an insertion line shows after C, and the order becomes B, C, A. No source is inserted into C and no menu opens after release.
2. Drag A above B; then move first-to-last and last-to-first using the content edges and gaps. Expected: the insertion line identifies the destination and the resulting order matches it. Drag into the left gutter and the gaps between paragraphs; expected: the same block boundaries are targeted.
3. Drop a block on itself or immediately before/after the neighbor where it already sits. Expected: no content changes, extra blank paragraphs or new undo step. Repeat ten upward/downward moves; expected: separators do not accumulate.
4. Drag the multi-line paragraph, list, quote, code, table, media, callout, Mermaid and customized divider around A/B/C. Expected: each complete top-level block moves intact, including nested list items, source fences, attachment references and presentation metadata. Nothing drops into a table cell or rich-source input as text. Check the bottom half of multi-line source blocks; expected: the line appears after the whole block.
5. After a successful move, press Ctrl/Cmd+Z once and then redo. Expected: one undo restores the previous order; redo repeats the move. Wait for Saved and reload. Expected: order, rich source and media references survive.
6. Drag a block near the top/bottom edge of a long document's scroll pane and hold it there. Expected: the pane scrolls toward further blocks, the insertion line follows the block under the pointer, and release moves to the displayed destination. Repeat in a split pane and at browser zoom 80%/125%; expected: coordinates remain aligned and the relevant pane scrolls.
7. Drag away from the editor and release, or cancel with Escape. Expected: no move, lingering insertion line, dimmed block or continued scrolling. Leave and return during a drag; expected: feedback disappears outside and resumes inside.
8. While dragging, switch tabs or cause the document source to change if your environment permits it. Expected: the drag cancels; a document change shows the retry notice; dropping afterward does not use stale source offsets. Reopen the document and drag again; expected: normal behavior resumes.
9. Click the grip without dragging. Expected: the block menu opens. Click add below; expected: its existing insertion behavior works. Use Alt+Shift+Up/Down and the menu's move commands; expected: complete blocks move and undo works.
10. Select ordinary text and drag it within the editor, then drop a local PNG and PDF using the existing upload flow. Expected: text uses normal CodeMirror behavior; files upload as image/file blocks and persist after saving. Drag a block into another document's split pane; expected: no cross-document mutation or text insertion.
11. Repeat basic reorders in Light/Dark, RTL paragraphs and a custom editor style. Expected: readable preview/insertion line, correct block order, and preserved direction/style metadata.

## Known limitations and stop gate

Manual browser behavior has not been verified in this work. Desktop browser native-drag differences, IME behavior, large-document scrolling and split-pane behavior require the checklist above. Touch drag, cross-document movement and nested/multi-block sorting remain outside scope. No performance gain is claimed. Wait for the user's manual review; do not start another migration phase.


## Review follow-up — stable drop viewport and wheel scrolling

The user reported a jump on drop and requested fast wheel scrolling during the
drag. Block moves previously forced the caret to the destination, requested
scroll-into-view and focused the editor. Pointer drops now omit those actions;
keyboard/menu moves retain their existing behavior. Drop handling captures the
scroll offsets at release, suppresses browser scroll anchoring temporarily, and
restores offsets synchronously, during CodeMirror measurement and after that
measurement frame. The intent is to retain the viewport reached during the drag,
including wheel and edge scrolling, rather than restoring its starting position.

The grip now uses pointer capture, a five-pixel activation threshold and a
body-mounted pointer preview. Pointer release resolves the actual element under
the pointer; releasing outside the originating editor cancels the move. Escape,
pointer cancellation, lost capture, window blur and document/editor changes
clean up the preview, indicator and temporary listeners. Ordinary native text
and file drops continue through their existing paths.

While actively dragging over the originating editor, a capture-phase wheel
handler routes vertical pixel/line/page deltas to its enclosing scroll panes.
Unused deltas pass to an outer scroll pane or window at a scroll boundary.
Trackpad pixel deltas are retained; Ctrl+wheel remains available to the browser.
Scroll events refresh the insertion target even when the pointer stays still.

Library decision: continue the user's selected dependency-free CodeMirror/Orbium
approach. The official [MDN drag operations guidance](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Drag_operations)
describes device input suppression during native HTML dragging. Pointer capture
avoids that native-drag lifecycle. The installed CodeMirror API and official
[reference manual](https://codemirror.net/docs/ref/) describe deferred measurement
and explain that `scrollSnapshot` covers only the editor's own scroll element.
Orbium's live preview scrolls in enclosing page panes, so this repair preserves
those offsets explicitly. No package changes or new library approval required.

### Follow-up validation

Final checks all exited with status 0:

- Targeted formatting: passed.
- `npm run types:check`: passed.
- `npm run lint`: passed; all 365 files formatted, no warnings/errors in 299 linted files.
- `npm run build`: passed in 9.03 seconds. Bundle-size and mixed static/dynamic import warnings remain; this run also reported plugin timing diagnostics (87% of build time in plugin hooks).
- `git diff --check`: passed.

No automated tests written or run. No browser acceptance claimed. No commits,
migrations or persistent-format changes.

### Exact follow-up manual checklist

1. In a long Markdown document, scroll to its middle, note the scrollbar position,
   and drag a paragraph to another visible boundary. Release. Expected: scroll
   position remains where it was immediately before release; the editor does not
   jump to a caret, focus a new field or reveal a moved rich block's source.
2. Repeat step 1 with a code block, table, image, Mermaid block and a divider.
   Expected: whole blocks move, with their preview preserved and no automatic
   jump. Repeat near the first/last block; scrolling can clamp at a document's
   physical scroll limit if the rendered document becomes shorter.
3. Hold a paragraph grip and move at least five pixels to start dragging. Keep the
   button held, place the pointer near the middle of the editor and spin the wheel
   rapidly down and up. Expected: the document pane follows wheel input, the drag
   stays active and the line updates under the stationary pointer. Release at a
   visible boundary; expected: move lands there and the wheel-reached viewport
   remains in place.
4. Repeat step 3 using a trackpad and in a split pane. Expected: pixel scrolling
   works and the originating pane scrolls. Move over the other pane and release;
   expected: no cross-document mutation.
5. Hold near a top/bottom edge without wheel input. Expected: edge scrolling still
   works. Combine edge and wheel scrolling, then release; expected: no viewport
   reset. Press Escape during another drag; expected: no move or lingering preview.
6. Click the grip without moving, then exercise its menu and Alt+Shift+Up/Down.
   Expected: click opens the menu; keyboard/menu moves still place the caret and
   scroll to the moved block. Undo/redo a pointer move, wait for Saved and reload;
   expected: block order restores/repeats and persists.
7. Drop ordinary selected text and upload a PNG/PDF as before. Expected: existing
   text transfer and attachment behavior is unchanged. Verify normal wheel
   scrolling after a completed/canceled drag; expected: no lingering interception.

Touch pointer events are supported by the controller but touch behavior has not
been verified. Horizontal wheel scrolling is outside this vertical document
scrolling change. Browser/device checks remain with the user.

Suggested commit: `fix(editor): preserve drop viewport and support drag wheel scrolling`


## Review correction — insertion pushes content below

The user clarified that the dropped block should push the content underneath,
with content above the insertion point staying in place. Restoring a numeric
scroll offset alone did not enforce that: removing a source block from higher in
the document shifted the content above the destination upward.

Pointer drops now capture the bottom edge of the block immediately above the
insertion boundary. An after-drop uses the target block as its anchor; a
before-drop uses the preceding top-level block, excluding the dragged source.
The move returns its CodeMirror change mapping so this existing anchor can be
found after source removal and insertion. Scroll correction keeps its bottom
edge at the original screen position, allowing the inserted block to expand the
layout below it. The correction runs synchronously and after CodeMirror's
layout frame. Pointer drops continue to avoid caret focus/source reveal.
Wheel/edge scrolling and keyboard/menu moves retain their existing behavior.

This correction uses the previously approved CodeMirror/Orbium approach, with
no new dependencies, persistent-format changes or commits. Near the beginning
or end of a scroll range, browser scroll limits can prevent full compensation.
A first-boundary or unavailable-anchor drop retains numeric offsets as fallback.
Manual browser validation remains pending; no automated tests were run.

### Correction checks

All checks exited with status 0: targeted formatting, `npm run types:check`,
`npm run lint` (365 formatted files; 299 linted files without warnings/errors),
`npm run build` (7.67 seconds), and `git diff --check`. Build warnings remain
for bundle sizes and mixed static/dynamic imports.

### Correction manual checklist

1. Open a long document containing A, B, C, D and E as separate paragraphs. Scroll
   by wheel while holding A until C/D are visible, then drop A immediately after
   C. Expected:
   order becomes B, C, A, D, E; C stays at the same screen position while D/E
   move downward to make room for A. The view does not follow a caret.
2. Undo and drag A just before D. Expected: the same order and visual placement
   as step 1; C remains stationary. Repeat using a taller code/table/image block
   as the source; expected: content below moves down by the inserted height.
3. Move a later block (E) before D. Expected: C remains stationary and D moves
   down. Move a block upward across several paragraphs; expected: the boundary's
   preceding block remains stationary and the inserted block occupies space below.
4. Repeat after wheel and edge scrolling and in a split pane. Expected: the
   insertion boundary reached during scrolling stays stable; only that pane's
   scroll offset is corrected. Repeat at 80% and 125% zoom.
5. Drop on the first boundary and at the bottom scroll limit. Expected: valid
   block order with no extra blank blocks; compensation may clamp at a physical
   scroll limit. Undo/redo, save and reload; expected: correct persistent order.

Suggested commit: `fix(editor): anchor block drops above the insertion boundary`
