# M5 — Caret, persistent block handles and selection polish

Date: 2026-10-09. Status: implemented for manual review; browser acceptance pending.

## Scope and implementation

This is a focused follow-up within the current CodeMirror editor review. No later phase was started.

- Nested code editors now mount their own drawn caret and selection extension. The parent editor previously hid the nested native caret without supplying a nested cursor layer.
- Code, table-cell and callout editors share Orbium selection appearance: a rounded, translucent monochrome highlight, lighter when unfocused, and a two-pixel foreground caret. Selection/cursor styles are scoped to each editor's own layers. Native source textareas use the same selection color.
- The shared Plus/six-dot controls remain at the active block when the pointer leaves. Keyboard selection, nested-editor focus, content changes, scrolling, resizing and layout changes refresh their position. Hover still targets other blocks, and leaving returns to the active block.
- Controls fade in and move vertically with a 180 ms CSS transition after a short 35 ms delay. Operating-system reduced motion disables both effects.
- Ctrl/Cmd+A selects the current block first; a second press selects the document body. Further presses retain the document selection. Moving the selection or editing resets the sequence. Nested code/table/callout editors escalate to the enclosing document. Math/Mermaid source textareas select their source first, then the parent document. Ctrl/Cmd+Shift+A retains its existing source-oriented behavior.
- First-stage selection excludes Orbium block wrapper metadata and rich-source fences where the parsed block exposes content bounds. Normal Markdown formatting markers remain part of ordinary text block selections.

Implementation is isolated in `markdown-selection.ts`, with focused changes to existing editor mounts, rich-block selection and the gutter lifecycle. Modified source files remain under 500 lines.

## Library assessment

Reviewed the official [CodeMirror styling guide](https://codemirror.net/examples/styling/), [reference manual](https://codemirror.net/docs/ref/), and [GSAP CSS documentation](https://gsap.com/docs/v3/GSAP/CorePlugins/CSS/), plus installed CodeMirror declarations and selection-hiding implementation.

CodeMirror provides caret/selection geometry and keymap primitives, but does not decide Orbium's block-first select-all behavior. Its rendering engine remains in use with custom Orbium appearance. GSAP can animate CSS properties, but this single vertical transition does not need its timeline machinery. The library-choice question was presented; the recommended existing-CodeMirror/CSS approach was used after the optional response period. No dependencies were installed or upgraded.

## Persistence and commits

No backend, migration, API, persistent-format or attachment-access changes. No commit was created.

Suggested commits:

- `fix(editor): restore code caret and style text selections`
- `feat(editor): keep block handles visible and add staged select all`

## Validation

Automated tests were neither written nor run, following the user's instructions. Browser/manual acceptance remains pending. PHP was unchanged, so PHP checks are not applicable.

All final checks exited with status 0:

- Targeted `npx vp fmt`: passed.
- `npm run types:check`: passed.
- `npm run lint`: passed; 366 files formatted and 300 linted files without warnings or errors.
- `npm run build`: passed in 6.41 seconds. Existing large-chunk and mixed static/dynamic import warnings remain.
- `git diff --check`: passed.

An initial type check found an `Element`/`HTMLElement` mismatch in parent-editor discovery; typed `closest<HTMLElement>` calls corrected it before the final checks.

## Manual test checklist

Reload Orbium and open a disposable Markdown document in Live Preview with at least three paragraphs, a heading, a list, a multi-line code block, a table, a callout, a math block and a Mermaid block.

1. Click in the code body; type, use Enter/Tab and move with arrow keys. Expected: a visible blinking caret follows the insertion point; code editing/highlighting, language changes and Copy still work. Repeat with empty code, a long horizontally scrolled line, Light and Dark appearance.
2. Click a paragraph, move the pointer outside the editor and type. Expected: the six-dot controls remain beside that active paragraph. Move between paragraphs using arrow keys and click into code, a table cell and a callout. Expected: controls follow the correct outer block and stay aligned with its first line or toolbar.
3. Hover blocks above/below the active block. Expected: controls slide vertically instead of jumping instantly. Leave the editor; expected: they return to the active block. Enable system reduced motion; expected: positioning works without animation. Open the grip menu and drag a block; expected: actions affect the indicated block, and drag cancellation/reordering still work.
4. Place the caret in the middle of a paragraph and press Ctrl/Cmd+A. Expected: only that paragraph is selected. Press again; expected: the complete document body is selected. Press a third time; expected: the complete body remains selected. Click another paragraph, repeat, then edit and repeat; expected: each new sequence starts at the current block.
5. Repeat select-all inside multi-line code, a table cell and a callout. Expected: first press selects the focused nested editor's contents; second selects the enclosing document. Code fences are excluded from the first code selection. Also try an empty code block; expected: first press selects its empty contents and second escalates.
6. Edit math/Mermaid source and press Ctrl/Cmd+A twice. Expected: first selects only that source field and second selects the document. Try a rich-block surface and a block using custom direction/alignment metadata; expected: first selection remains within content bounds.
7. Select text by mouse and keyboard in ordinary text, code and cells in Light/Dark. Expected: readable translucent highlights with gently rounded edges and a foreground caret; focused/unfocused highlights remain readable. Copy selected code/text and paste into a disposable field; expected: the selected contents match the visible selection.
8. Scroll a long document, resize the pane and repeat at 80%/125% zoom and in split panes. Expected: controls stay aligned with their owning editor; Ctrl/Cmd+A affects the focused document only. Switch Source/Live Preview and tabs; expected: no stale menu or controls from the previous layout.
9. Change text, undo/redo, wait for Saved and reload. Expected: authored content persists; selection and handle animation do not create content changes or autosave entries.

## Known limitations and stop gate

Browser behavior has not been verified in this work; the checklist is pending with the user. The existing CodeMirror geometry engine is retained and customized, rather than replaced by a new selection renderer. In table editing, the first stage selects the focused cell's editor contents. Document selection refers to the body, excluding the separately edited title. Operating-system reduced motion governs the new CSS animation.

Continue review within the current editor phase. Wait for user review before beginning another phase.
