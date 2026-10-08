# M5 — Mouse precision repair

Date: 2026-10-08. Status: **Implemented; the two reported targeting failures pass the focused browser reproduction. Broader manual acceptance remains pending.**

The user authorized this repair after the [mouse precision investigation](06-codemirror-mouse-precision-investigation.md). Work remains in M5.

## Result and implementation

Hovering ordinary text after rich widgets now selects that text's block, and clicking the H6 heading after the table places the caret in the heading. The cumulative drift came from rich-widget margins being outside CodeMirror's measured block heights.

- Added a CodeMirror `BlockWrapper` around each nonempty top-level Markdown syntax block. Its `display: flow-root` contains the existing content margins. CodeMirror's wrapper measurement includes the space above/below its children, keeping the visible layout and its height map consistent.
- Kept the existing styled rich-widget elements, classes, controls and positive margins inside those containers. The table retains its bottom space for edge controls. The same containers surround ordinary paragraphs, headings, lists, quotes and presentation directives, so account styles continue to target the existing content elements rather than an unmeasured top-level margin.
- The layout wrapper has rank 100; explicit direction/alignment presentation uses rank 99 inside it. Native list structures and their existing inner wrappers remain intact.
- Block geometry unwraps the layout container when positioning the gutter and drag indicator, keeping the controls aligned to the visible content rather than its surrounding spacing.
- Scrolling or resizing dismisses the block menu, hides the handle and clears its old block target. The next pointer movement resolves a fresh target instead of leaving a stale handle visible.

Changed source files:

- [markdown-block-wrappers.ts](../../resources/js/components/editor/markdown/interactions/markdown-block-wrappers.ts)
- [markdown-block-drag.ts](../../resources/js/components/editor/markdown/interactions/markdown-block-drag.ts)
- [markdown-block-gutter.ts](../../resources/js/components/editor/markdown/interactions/markdown-block-gutter.ts)
- [editor-document.css](../../resources/css/editor-document.css)

There is no fixed mouse offset, dependency addition, persisted content change, migration or API change. Existing format-1 Tiptap documents retain their original editor.

## Libraries and limitations

Reused installed `@codemirror/view`'s `BlockWrapper`, position mapping and wrapper measurement. Reviewed the installed implementation and the official [CodeMirror reference](https://codemirror.net/docs/ref/). It documents block-wrapper nesting and the restriction on external vertical margins for block widgets. This repair puts the existing margins inside CodeMirror-owned measurable wrappers.

A general drag library cannot repair native caret targeting. Orbium owns the CSS/container adaptation; no new library was installed or upgraded. The change remains bounded by the existing viewport wrapper collection rather than mounting an additional React tree for every block.

Long-document performance, touch drag, different browsers, custom account-style combinations and the full migration parity checklist remain manual acceptance gates. The wrapper adds one DOM container per rendered top-level block; no performance improvement is claimed.

## Actual validation

- Targeted `npx vp fmt` on the four changed sources: PASS.
- `npm run lint`: PASS; all 339 files correctly formatted, no warnings/errors in 274 linted files.
- `npm run types:check`: PASS (`tsc --noEmit`).
- `npm run build`: PASS in 10.53 seconds. Existing large-chunk and ineffective dynamic-import warnings remain.
- `git diff --check`: PASS after source changes; repeated after the report was added.
- Changed source sizes: CSS 368 lines; block wrappers 237; block geometry 77; gutter 409. All remain below 500 lines.
- No automated tests were written or run, as instructed. PHP checks were not run because PHP source is unchanged.

Focused interactive browser reproduction used the user's already-open format-2 review document in Chrome, after rebuilding and reloading. No document text or account preferences were edited.

| Check | Actual result |
|---|---|
| Hover inline-equation paragraph after code and Mermaid | Pointer `(720, 367)` resolves to its own paragraph; gutter Y=353.06 matches the paragraph's top. Before repair it resolved to the math block below. |
| Click H6 after the table | Pointer `(600, 810)` activates the H6 at Y=793.22–826.92; settled caret Y=801.97, X=597.11 is inside that heading. Before repair the final paragraph became active. |
| Measure contained margins | Code height 477.64 px becomes 517.64 px in its wrapper; Mermaid 210 becomes 242; math 160.58 becomes 192.58; table 133.66 becomes 181.66. Their existing margins are now inside measurable container bounds. |
| Scroll while a gutter is visible | No gutter remains visible after scrolling; stale target is cleared. |
| Switch Source → Live Preview | Source has no layout wrappers or gutter; returning and scrolling renders the wrappers/widgets again. Status remains Saved. |
| Increase math height by switching Preview → Edit | Math grows to 200.84 px and its wrapper to 232.84 px. Clicking the relocated H6 at `(600, 887)` still activates the H6 at Y=869.63. |
| Restore math Preview | Math and wrapper return to 160.58/192.58 px; source remains unchanged. |
| Inspect captured browser errors | The log contains earlier errors from the pre-repair Markdown bundle. Filtering for the repaired `markdown-editor-g-HSPuIW.js` bundle returns no error entries. This is focused evidence, not an exhaustive runtime error guarantee. |

## Manual checklist for the user

Reload Orbium so the new build is loaded. Use the existing review document or import [the M5 fixture](../examples/orbium-markdown-m5.md) into an empty disposable format-2 document. Make content changes only in the disposable copy.

1. **Original hover failure:** Hover `Inline ... and a display equation:` after the code and Mermaid blocks. Expected: Plus and six dots appear beside that paragraph, not beside display math below it.
2. **Original click failure:** Click several words in `Imported H6 remains H6 in Source` after the table. Expected: the caret lands near the clicked character in the heading. Type one character, then undo; expected only that heading changes and is restored.
3. **Selection and menus:** Drag-select words across ordinary paragraphs, including prose after rich widgets. Right-click a word and open the six-dot menu. Expected: selection and block actions belong to the intended text/block.
4. **Height changes:** Toggle Mermaid/math Edit and Preview, edit code, open a table cell and resize an image. Click the prose immediately below each afterward. Expected: caret and gutter remain accurate as block heights change; controls and table edge buttons stay usable.
5. **Drag/drop:** Move a disposable paragraph above/below a code, math or table block and undo. Drop a file next to the intended paragraph. Expected: insertion indicator and resulting placement match the target without lost content or extra accumulated separators.
6. **Styles:** Repeat with account styles disabled, then with your saved theme enabled. Include positive paragraph/heading/list/code/table margins and padding in a disposable style draft or your usual theme. Expected: styling remains visible and mouse targeting stays accurate. Cancel unused style drafts.
7. **Lifecycle:** Scroll with the mouse stationary, then move it slightly. Resize the window, switch retained tabs and use split panes. Expected: old handles disappear on scroll/resize and the next movement shows the correct active block's handle.
8. **Source, zoom and direction:** Switch Source/Live Preview; repeat at 100%, 125% and 150% zoom and on Arabic/mixed-script paragraphs. Expected: targeting matches visible text in both modes, with no cumulative vertical offset.
9. **Persistence and reference editor:** Wait for Saved and reload after disposable edits. Compare an existing Tiptap document. Expected: Markdown edits survive, and the legacy document keeps its existing appearance and interactions.

## Commits and stop gate

No commit, push, merge or next-phase work performed. Commit message suggestion:

`fix(editor): include block spacing in CodeMirror layout measurements`

Remain in M5 for the user's manual review. This focused fix does not imply acceptance of the full replacement editor.
