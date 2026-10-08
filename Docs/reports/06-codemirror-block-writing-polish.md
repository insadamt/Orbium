# M5 — Code layout, block controls and writing below special blocks

Date: 2026-10-08. Status: **Implemented for manual review; visual acceptance pending.**

The user requested better code-block design and padding, corrected six-dot alignment, and an easy way to write below a special block at the end of a document. This is a focused M5 follow-up to the [mouse precision repair](06-codemirror-mouse-precision-fix.md).

## Findings and changes

The document editor's CodeMirror themes used descendant selectors that also matched nested code editors. Before this change, browser inspection of a one-line code block found a 477.64px root, a 430.65px content minimum height inherited from the page's `45vh` rule, sans-serif text and zero content/line padding. The nested code editor was inheriting page layout instead of its own compact layout.

- Scoped page scroller/content styles to the outer editor. Code inputs now have automatic height, no page-sized minimum height, their own monospace typography and 1rem padding on all four sides. Live Preview line reset remains separate from Source line spacing.
- Refined the code header background, divider, horizontal spacing and Copy button presentation while retaining the existing language picker and syntax highlighting.
- Aligned Plus and six-dot controls with the first visible text line, accounting for heading/block padding and line height. Code, math and Mermaid use their visible toolbar row; tables use their first row. Geometry accounts for the editor's vertical scale.
- Added a keyboard-accessible `Click to write below` area after a final special block in Live Preview. Clicking the blank editor area below that block also creates or focuses a normal writing paragraph. Existing trailing writing space is reused; the action ensures two line breaks after the special block, including documents with only one trailing newline, so typing does not extend a table. Creation is isolated in undo history.
- Fixed blank-line block ownership: controls on a new writing line resolve to that line rather than the preceding special block.

The bottom interaction applies only when the last parsed top-level block is a supported rich block (including code/table/math/Mermaid/callout/media), indented code, divider or HTML block. It does not add an action after ordinary text. Source mode and non-editable editors do not expose the interaction. Parsing must reach the document end before the action is offered.

## Implementation and libraries

Reused the already approved, installed CodeMirror view/state/language/commands APIs. Their local declarations were examined for `ViewPlugin`, `ensureSyntaxTree`, transactions and `isolateHistory`. These provide lifecycle, parsing, selection and undo primitives; they do not decide which Orbium special block needs a following paragraph or how to align its controls. Those small rules remain in Orbium. No new dependency is proposed or added. A refresh of the official online reference returned HTTP 403; local installed declarations were available.

The new interaction is isolated in `resources/js/components/editor/markdown/interactions/markdown-trailing-paragraph.ts`. Existing rich-widget, block geometry and theme files own their respective presentation changes. Modified source files remain under 500 lines.

There are no backend, API, database or content-format changes. Format-1 documents retain their existing editor. No commit or push was made. Work remains in M5.

## Actual validation

- `npx vp fmt` on changed source: PASS.
- `npm run lint`: PASS; 340 files correctly formatted, no warnings/errors in 275 linted files.
- `npm run types:check`: PASS (`tsc --noEmit`).
- `npm run build`: PASS, 7.72 seconds; large-chunk and ineffective-dynamic-import warnings remain.
- `git diff --check`: PASS.
- No automated tests were added or run, following the user's instructions.
- The report Markdown is excluded by the repository's `vp fmt` configuration; it was reviewed directly.

Browser inspection established the code-style inheritance problem before the changes. The browser connection timed out during reload and again during recovery, preventing final visual/click verification. No post-change browser acceptance, screenshot comparison or long-document performance result is claimed. The checklist below remains pending with the user.

## Manual checklist

Reload Orbium to load the new build. Use a disposable format-2 Markdown document in Live Preview. The [M5 review fixture](../examples/orbium-markdown-m5-ui-review.md) supplies varied blocks. Make document edits in the disposable copy.

1. **Code design:** Insert a one-line code block. Expected: compact height, monospace text, approximately 16px padding on each side, and a distinct language/Copy header. Compare light and dark appearance. Add several lines and a long line; expected: vertical growth and horizontal code scrolling without a large empty panel.
2. **Code interaction:** Type inside code, press Enter/Tab, change language and click Copy. Expected: highlighted, editable code, correct clipboard text and temporary copy feedback. Save and reload; expected: code and language survive.
3. **Six-dot alignment:** Hover paragraphs, H1–H3, lists, quotes, code, tables, math and Mermaid. Expected: controls align with the first visible text line or the block's first header/control row rather than the surrounding blank spacing. Open each grip menu; expected: actions target that block.
4. **Final code:** In Source, make a closed code fence the document's final block with no newline after it. Return to Live Preview and click the blank space below it. Expected: a normal text writing line appears below code and receives focus. Type a sentence; expected: prose outside the code, with its own grip. Before typing, undo once; expected: the added separator is removed without deleting code.
5. **Final table:** Repeat with a table as the last block, first with no trailing newline and then with exactly one trailing newline. Click below and type a sentence. Expected: an ordinary paragraph below the table, preserving table cells and row count. Source shows a blank separator line between table and paragraph.
6. **Reuse trailing space:** Leave two or more line breaks after a final special block. Click the bottom action repeatedly before typing. Expected: the existing last writing line is focused without adding repeated blank lines. Type and wait for Saved, then reload; expected: the paragraph survives.
7. **Only at the document end:** Put a paragraph after a code block or table. Expected: no bottom special-block action; ordinary Enter continues normal text writing. Repeat with a final math/Mermaid/media block; expected: the writing action applies beneath the last block only and does not activate widget controls.
8. **Keyboard and modes:** Tab to `Click to write below` and press Enter. Expected: focus moves into the new paragraph. Switch Source/Preview, open another retained tab and try a read-only editor where available. Expected: no stale buttons, unintended edits or inactive-editor mutation.
9. **Precision regression:** Scroll, resize the pane, change heading padding through document styles, and edit a rich block so its height changes. Hover/click text below it. Expected: caret and controls still target the intended block. Repeat at another browser zoom and in a split pane.

## Commit suggestions

- `fix(editor): isolate code styling and align block handles`
- `feat(editor): add writing below final special blocks`

Continue manual review within M5; full migration acceptance remains pending.
