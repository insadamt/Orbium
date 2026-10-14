# Playful editor checkboxes

Phase 7 — UI polish, requested 2026-10-14.

## Implemented

- Installed the requested `@animate-ui/components-community-playful-todolist` with `npx shadcn@latest add ... --yes`. Relocated generated sources to the repository's `resources/js` aliases and reused the existing context/state helpers.
- Adapted the [Animate UI Playful Todolist](https://animate-ui.com/docs/components/community/playful-todolist) wavy SVG path into a shared editor checkbox adapter. Completion draws the wave over task text in one second; the checkmark draws in 200 ms and hover/press gently scale the box. Unchecking clears the wave.
- Kept native checkbox semantics and the existing CodeMirror marker edits and Tiptap task-item transactions. Markdown, legacy documents, and disabled nested rich-body previews share the appearance.
- Measured text rectangles produce separate waves for wrapped lines, merge overlapping inline-formatting rectangles, and update after text/layout changes. Decorative SVGs are inaccessible to assistive technology and ignore pointer events. Observer/frame/tween cleanup follows editor widget destruction.
- Reduced motion applies checked states immediately and removes hover/press scaling. All newly created sources stay below 500 lines.

## Persistence and commits

No migrations, content format changes, or archive changes. No commit created. Existing unrelated working-tree changes were retained.

Suggested commit messages:

- `feat(editor): add playful animated checklist checkboxes`
- `feat(editor): animate completed tasks with wavy strikethroughs`

## Validation

- Targeted `npx vp fmt`: PASS.
- `npm run types:check`: PASS after correcting the legacy node-view factory's nullable return.
- `npm run lint`: PASS, no formatting issues, warnings or lint errors.
- `npm run build`: PASS; large-chunk and ineffective dynamic-import warnings remain.
- `git diff --check`: PASS.
- Automated tests were neither written nor run, as instructed. Browser behavior and visual acceptance remain pending manual review.

## Manual test checklist

1. In a Markdown document, enter `- [ ] Short task` and `- [x] Completed task`, then move the caret to a separate paragraph. Click the first checkbox. Expected: the checkmark animates, a wavy strike draws across its text in about one second, and the editor reports Saved. Click again; expected the checkmark and strike disappear and the task becomes incomplete.
2. Check a task, use Ctrl/Cmd+Z, then redo. Open Source. Expected: exactly the intended marker switches between `[ ]` and `[x]`; surrounding text stays intact and undo/redo matches the checkbox state. Reload after Saved; expected the saved state returns without replaying an entrance animation.
3. Add a long task that wraps, with bold text, italic text, an inline code span and a link. Resize the document pane and edit its text while completed. Expected: waves stay over each text line, do not run across the checkbox or empty editor width, and do not block text selection or links.
4. Add nested tasks and an Arabic task; check parent and child separately. Expected: independent checked states, correct indentation/direction, and no strike through neighboring tasks. Scroll away and back, switch tabs, and toggle Source/Live Preview; expected no stale overlay or lost task state.
5. In an existing legacy Tiptap document, create a checklist using `/`, toggle its tasks, undo/redo and reload after Saved. Expected: the same animation, retained nesting/editing behavior and saved checked states.
6. Inspect a checklist inside a rich-body preview, such as a callout. Expected: matching checkmark/wavy completion appearance; preview-only checkboxes remain disabled. Enter its editing surface to change source; expected the preview reflects the source when restored.
7. Use Tab to focus an editable checkbox and Space to toggle it. Expected: one toggle of the intended task, accessible complete/incomplete label, and unchanged surrounding text. Repeat in light/dark themes and split panes; expected clear neutral colors and independent pane state.
8. Enable OS reduced motion, reload, then check/uncheck tasks and hover/press their boxes. Expected: immediate check/strike state with no drawing or scaling; saving, undo and keyboard interactions still work. Toggle reduced motion while a wave is drawing; expected animation settles immediately.

## Review boundary

This is the requested Phase 7 editor motion polish. No later phase was started. Manual review is pending.
