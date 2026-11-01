Summary: Records the removal of the outer text caret beside rendered non-text blocks; depends on rich-widget presentation state, shared CodeMirror selection drawing and the active V3 stage-6 editor.

# Stage-6 review repair: non-text block caret

## Implemented

- Rendered rich blocks, including tables, hide the owning editor's drawn caret when the selection head is inside the widget's source range, including its closing edge. This includes collapsed carets and the extra caret CodeMirror draws for nonempty selections. V3 dividers receive the same treatment.
- The CSS targets only the owning editor's direct cursor layer, preserving table-cell, code and other nested text editors, including column projections.
- Text selection highlighting remains visible; inline math, empty writing widgets and explicitly revealed rich source retain their text carets. Source mode does not install the rich presentation extension.
- No persistence, format or migration changes. No commit created.

## Actual validation

- `npm run types:check`: passed.
- `vp check resources/js/components/editor/markdown/rich/rich-blocks.ts`: formatting and lint passed.
- `npm run lint`: blocked by existing formatting issues in 16 unrelated files; left unchanged.
- `npm run build`: passed, with large-chunk and mixed static/dynamic import warnings.
- `git diff --check`: passed.
- No automated tests or browser automation were written or run. Runtime appearance and interactions remain unverified.

## Manual checklist

1. Reload a Document with text above and below a table. Click both the left and right edges of the table's outer surface and use arrow keys from the surrounding text to reach it. Select the table with its six-dot handle as well. Expected: no tall caret on either side, including the right-edge case in the follow-up screenshot.
2. Click a table cell and type. Expected: the cell's normal text caret remains visible and the edit saves after reload.
3. Repeat outer-surface selection for an image, file/media block, code block, Mermaid, math, Mind Map and divider. Expected: no outer document caret; existing controls still work. Enter a dedicated text input where available: its own caret remains visible.
4. Click ordinary paragraphs, headings, lists and writable empty spacers, and move across inline math. Expected: normal text carets remain visible.
5. Repeat table/cell/paragraph checks in a column layout and a Board-hosted Document. Expected: each local editor follows the same behavior without hiding another editor's caret.
6. Select text across a table and use block handles. Expected: text/block selection highlighting and controls still work. Return to ordinary text: its caret reappears.
7. Switch to Source mode and edit table source. Also reveal an individual rich block's source with Ctrl/Cmd+Shift+A while its outer surface is focused. Expected: source editing has a normal caret. Return to Live Preview: the outer widget caret is hidden again.

## Suggested commit

`fix(editor): hide outer text caret on non-text blocks`

## Screenshot follow-up

The user reported the caret still visible at the right of the table. Static inspection of the installed CodeMirror implementation confirmed that `drawSelection` enables `drawRangeCursor` by default: nonempty block selections can draw a caret at their head. The original guard only covered collapsed selections and excluded `block.to`. The follow-up removes that restriction and includes the closing edge, matching the existing rich-widget focus handler's inclusive range. Empty writing widgets are explicitly excluded. The focused formatting/lint, type, build and whitespace checks were repeated; runtime acceptance remains pending manual review.

Remain in stage-6 manual review; do not begin stage 7.
