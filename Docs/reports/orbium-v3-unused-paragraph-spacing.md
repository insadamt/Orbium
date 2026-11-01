Summary: Records the user-requested treatment of unused writing blocks as spacing; depends on deferred V3 empty-row cleanup, stable IDs, checked owner replacement and writable spacer inputs.

# Stage-6 review: unused paragraphs become space blocks

## Implemented

- Leaving an empty paragraph converts it to a spacer with the same ID and position instead of deleting it. Clicking outside the editor also finalizes it as spacing, including the only block in a document.
- Inserting another block while leaving the empty paragraph also allows this conversion; ordinary typing within the same block does not trigger cleanup.
- Conversion preserves the current selection and does not request editor focus or movement animation. Existing spacer typing promotes it back into writable paragraph content.
- The active empty paragraph remains available for writing until it is left. Specialized empty rich blocks retain their own semantics. Explicit deletion, Ctrl+Backspace and trimming extra trailing rows within nonempty text retain their existing behavior.
- No persistence-format change or migration; no commit created. Existing composition, handle-selection, upload and pending-move guards remain.

## Actual checks

- Focused formatting/lint: passed.
- `npm run types:check`: passed.
- `npm run build`: passed, with chunk-size, mixed static/dynamic import and plugin-timing warnings.
- `git diff --check`: passed.
- No automated tests or browser automation run; interaction acceptance remains manual.

## Manual checklist

1. Add an empty paragraph between two existing blocks, then click another paragraph without typing. Expected: the blank row remains as a spacer, with no writing hint after leaving it.
2. Add an empty paragraph, then insert another block without typing in the first one. Expected: the unused row remains in its original position as spacing.
3. Leave a new Document's sole empty paragraph by clicking outside the editor. Expected: the blank block remains usable as spacing; clicking it and typing creates ordinary text without losing the first character.
4. Click a retained spacer and type. Expected: it becomes a paragraph in place; surrounding blocks do not move unexpectedly. Press Ctrl+Backspace while a spacer is blank: explicit deletion still works.
5. Undo/redo the conversion and save/reload the Document. Expected: the row retains its position, identity and spacing behavior.
6. Repeat adding/leaving an empty paragraph inside a column and a Board-hosted Document. Expected: only the empty row in the focused editor becomes spacing, without stealing focus.
7. Type into a newly added paragraph before leaving it. Expected: content remains ordinary text; no conversion or loss of text. Leave a nonempty paragraph with extra trailing blank lines: existing trailing-row cleanup still works.

## Suggested commit

`fix(editor): preserve unused writing blocks as spacers`

Remain in stage-6 review.
