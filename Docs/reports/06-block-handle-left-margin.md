# Editor review — Follow blocks from the left margin

Date: 2026-10-12. Status: implemented; manual review pending.

## Change

The Markdown editor previously restored the selection's block controls whenever
the pointer left the editor root. Because the Plus and six-dot controls extend
into the left margin, approaching them could move the controls to another block.
Pointer tracking now covers the containing document island. Left-margin pointer
coordinates are projected onto the editor content at the same height so moving
up or down follows the corresponding block, including rich widgets. Moving over
the controls themselves keeps them stable for clicking and dragging. Tracking
is scoped to each document island; leaving its editor-height region or right
edge restores the selection fallback. Listeners are removed on editor teardown.
This is a focused editor review fix, with no phase advancement.

## Actual validation

- Targeted `npx vp fmt`: passed.
- `npm run lint`: passed; 393 formatted files and 324 linted files, no errors or warnings.
- `npm run types:check`: passed.
- `npm run build`: passed in 9.99 seconds; large-chunk and ineffective-dynamic-import warnings reported.
- `git diff --check`: passed.
- No automated tests were written or run, as instructed. Browser/manual acceptance remains pending.
- No commit or push was made.

## Manual checklist

1. Reload Orbium and open a Markdown document with several blocks in Live Preview.
2. Click one paragraph, then hover a different paragraph. Move horizontally left
   across the six-dot handle and Plus button into the blank margin. Expected:
   controls stay visible beside the hovered paragraph without jumping to the caret.
3. Move back to the dots and click. Expected: the menu targets the hovered block.
   Close it, then drag that block elsewhere. Expected: the intended block moves.
4. Hover another paragraph, heading and code block in turn. Expected: controls
   follow each block and remain beside it when moving into the left margin.
   Keep the pointer left of the Plus button and move vertically between blocks.
   Expected: the dots smoothly follow the corresponding block without requiring
   the pointer to return to the text. Repeat beside a table and Mermaid block.
5. Move out through the editor's right, top or bottom edge. Expected: controls
   return to the selected block as before. Click a different block. Expected:
   controls follow the selection.
6. Repeat the left-margin check after scrolling and in a split document pane.
   Expected: controls remain attached to the hovered block in that editor.

## Commit suggestion

`fix(editor): follow hovered blocks from the left margin`
