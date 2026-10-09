# CodeMirror block drag and drop

## Scope

Focused repair and extension of the current Markdown editor's M5 block interaction. The user requested drag and drop and selected extending CodeMirror with Orbium-owned block-drag logic. This does not advance the migration phase or establish replacement acceptance.

## Implemented

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
