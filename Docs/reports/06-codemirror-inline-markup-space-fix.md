# M5 — Keep inline formatting markup hidden while writing

Date: 2026-10-08. Status: implemented; manual acceptance pending.

## Problem and change

The user reported raw `:orbium[TEST] {"color":"preset:pink"}` appearing after pressing Space. The preview previously replaced the closing bracket and JSON with separate atomic ranges. Their shared boundary remained a possible caret position; inserting a space there invalidates the required adjacent `]{` syntax.

The closing bracket and metadata now form one hidden atomic range. A preview-only selection filter moves direct selections inside a valid span's hidden opening or closing syntax to its visible text boundary. Search selections no longer reveal Markdown markers in Live Preview. Both the document editor and nested rich text editors reuse these preview protections. Predefined Markdown and keyboard shortcuts retain their existing handlers.

This is an M5 bug repair, with no phase advancement, backend changes, migrations, or persisted-format changes. No commit was created.

## Library assessment

Reused installed CodeMirror state/view/language APIs. The local `@codemirror/view` declarations document that atomic ranges protect cursor movement but do not prevent direct programmatic selections. Orbium therefore supplies a small selection filter alongside its existing replacement decorations. No new dependency is needed for this repair. An attempt to refresh the official decoration reference returned HTTP 403; the installed API declarations were inspected instead.

## Actual validation

- Targeted `npx vp fmt`: PASS, three source files.
- `npm run lint`: PASS; 346 files correctly formatted, 281 linted files with no warnings or errors.
- `npm run types:check`: PASS.
- `npm run build`: PASS, 8.67 seconds. Build reports large chunks, ineffective dynamic imports, and plugin timing warnings.
- `git diff --check`: PASS.
- No automated tests were written or run, following the user's instructions. Browser acceptance remains pending with the user.

## Manual checklist

Reload Orbium to load the rebuilt editor. Use a disposable Markdown document in Live Preview.

1. Type `TEST`, select the word, and choose pink in the selection toolbar. Click immediately after the word, press Space, then type `next`. Expected: editable text with the applied color; no `:orbium`, brackets, or color JSON appears.
2. Move through the beginning and end of the colored word with Left/Right, then click those boundaries and type spaces. Expected: the caret reaches visible text positions and typing cannot split the hidden bracket/metadata boundary. Repeat with underline and a custom color.
3. Search for `TEST` with Ctrl+F and navigate matches using Enter/Shift+Enter. Expected: the visible word is highlighted/selected without exposing formatting syntax. Close search and continue typing.
4. On separate new lines, type `#` then Space, `##` then Space, `###` then Space, `-` then Space, `1.` then Space, and `>` then Space, followed by text. Expected: headings, lists, and quote presentation still convert, with markers hidden after conversion. Also try bold, italic, strike, inline code, `/`, and `@`; expected: their existing formatting and menus remain available.
5. Apply a color to text in a table cell or callout. Repeat the Space and cursor checks. Expected: the nested editor also keeps valid metadata hidden.
6. Undo/redo edits, wait for Saved, and reload. Expected: text, spaces, and formatting survive without raw markup appearing.
7. Deliberately switch to Source and back to Live Preview. Expected: Source remains available for explicit Markdown editing; returning to Live Preview hides valid formatting syntax again.

Already malformed source is not rewritten automatically. If an earlier edit inserted a space between a span's closing `]` and `{`, undo that edit or remove that intervening space in Source before repeating these checks. Invalid or literal source is not silently hidden, and code blocks retain their code text.

## Commit suggestion

`fix(editor): protect hidden inline metadata while typing`

Manual review continues within M5.
