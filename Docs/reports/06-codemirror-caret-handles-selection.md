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

## Review follow-up — stable handle motion

Date: 2026-10-10. The user reported frequent glitches in the six-dot animation. This follow-up supersedes the delayed CSS `top` transition and fade described above.

Code inspection identified competing positioning paths: hover chose one block, but geometry/scroll refreshes restored the active selection block. Blank separators also restored the active block while the pointer crossed between neighbors. Animating every `top` change with a delay added lag during scrolling and layout changes.

The gutter now retains its hovered target through geometry/scroll updates, maps that target through source edits, and returns to the active block on pointer leave or a focus/selection change. Blank gaps retain the previous target until another block is reached. CodeMirror `requestMeasure` batches geometry reads separately from writes and coalesces repeated requests. Focusing the gutter's own buttons does not replace its block target.

A focused `MarkdownBlockHandleMotion` controller replaces the CSS animation. Its 150 ms transform animation runs only when changing blocks, without the previous delay. An interrupted move starts at the currently displayed position. Unchanged measurements preserve the running animation; initial display, same-block layout shifts and ordinary scroll/resize correction do not start animations. Pointer presses, menus, dragging, hiding and editor destruction cancel motion where appropriate. Operating-system reduced motion skips new animations. The repeated fade was removed.

Library assessment: continue Orbium-owned behavior with CodeMirror's installed measurement API. Reviewed native [Element.animate](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate) and [Animation.cancel](https://developer.mozilla.org/en-US/docs/Web/API/Animation/cancel) documentation. These provide interruptible transform playback and cleanup; Orbium still owns block targeting and geometry. GSAP remains unnecessary for this small repair, so no dependency or dependency-choice approval is needed.

### Actual validation

All checks exited with status 0:

- Targeted `npx vp fmt`: passed.
- `npm run types:check`: passed.
- `npm run lint`: passed; 367 files formatted, 301 linted files without warnings/errors.
- `npm run build`: passed in 10.59 seconds; existing large-chunk and mixed static/dynamic import warnings remain.
- `git diff --check`: passed.

No automated tests written or run. Browser acceptance remains pending with the user. No backend, format, migration or dependency changes. No commit was created.

### Exact manual checklist

1. Reload Orbium. In a disposable document containing several paragraphs and headings, move the pointer rapidly up/down between blocks, reversing direction before each move finishes. Expected: one continuous handle movement toward the latest block, without flickering, queued delays or repeated returns to the active paragraph.
2. Click paragraph A, then hover paragraph C. Keep the pointer on C while code/diagram content settles, and move through blank separators between C and its neighbors. Expected: the handle stays on the hovered target through layout refreshes and retains that target while crossing gaps; reaching another block moves it once. Move outside the editor: expected return to A, with its handle still visible.
3. Hover a block and wheel-scroll a long document, including scrolling inside code or a split pane. Resize the pane. Expected: controls follow the same block without trailing behind a delayed scroll animation. Repeat at 80%/125% browser zoom.
4. Click the grip while it is moving, open/close its menu, and drag/reorder a block. Expected: motion settles for interaction; menu and drag use the indicated block, with no moving menu anchor or lingering animation after drop/cancel. Press Escape during a drag and repeat.
5. Move the caret with arrow keys, click into code/table/callout content, and type near a paragraph wrap boundary. Expected: controls follow the focused outer block; editing a block's height does not restart its animation repeatedly.
6. Enable system reduced motion and repeat block changes. Expected: immediate positioning with no animation. Switch documents/tabs and Source/Live Preview, then save/reload: expected no stale controls, content loss or extra undo/save entries caused by handle motion.

Suggested commit: `fix(editor): stabilize block handle animation`

Remain within the current editor review phase; wait for the user's manual review.
