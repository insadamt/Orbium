Summary: Documents Ctrl+Backspace deletion of empty V3 writing blocks; depends on keyboard operation resolution, native spacer inputs and existing checked owner deletion/history.

# Stage-6 review: empty-block Ctrl+Backspace

## Implemented

- Ctrl+Backspace now deletes an empty paragraph, spacer or text block containing only its required heading/list/quote/callout marker and whitespace.
- Native spacer textareas allow this shortcut instead of rejecting all modified key events. Draft text and composition retain their existing handling.
- Existing selected-block deletion also accepts Ctrl+Backspace. Nonempty ordinary text and text selections fall through to normal word/selection deletion.
- Checked owner operations preserve undo, column cleanup and a writable paragraph when required after deleting the final block. No format or migration changes; no commit created.

## Validation

- Focused formatting/lint check on all three edited TypeScript files: passed.
- `npm run types:check`: passed.
- `npm run build`: passed, with chunk-size, mixed static/dynamic import and plugin-timing warnings.
- `git diff --check`: passed.
- Repository-wide lint previously reported formatting problems in 16 unrelated files; no unrelated formatting changes made.
- No automated tests or browser automation written or run. Manual interaction acceptance remains pending.

## Manual checklist

1. Place an empty paragraph between two filled paragraphs. Focus it and press Ctrl+Backspace. Expected: only the empty block is removed; neighboring text remains intact.
2. Create a blank spacer by pressing Enter in an empty paragraph. Click its blank row and press Ctrl+Backspace. Expected: the spacer disappears rather than remaining as an empty textarea.
3. In an empty heading, list item, checklist or quote, press Ctrl+Backspace. Expected: the empty block is removed even though its saved Markdown contains a required marker.
4. Type two words in a paragraph and press Ctrl+Backspace after the second word. Expected: normal word deletion, with the block retained. Select part of a word and repeat: normal selection deletion remains available.
5. Undo and redo an empty-block deletion. Expected: the block and its position are restored/removed without altering neighboring content.
6. Repeat paragraph/spacer deletion inside a column and a Board-hosted Document. Expected: the action targets the focused editor and existing column cleanup remains valid.
7. Delete the only empty block. Expected: a writable empty paragraph remains so the document is still editable. Reload after saving: content remains valid.
8. Select an empty block with its handle and press Ctrl+Backspace. Expected: the selected block is removed. Source mode retains ordinary raw-source word deletion.

## Suggested commit

`fix(editor): delete empty blocks with ctrl backspace`

Remain in stage-6 review.
