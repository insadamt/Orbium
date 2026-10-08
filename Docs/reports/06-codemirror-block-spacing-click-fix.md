# M5 review repair — clicks in block spacing

Date: 2026-10-08. Status: implemented; manual acceptance pending.

## Problem and change

The user reported that clicking beneath a paragraph or between blocks allowed
typing in layout spacing, bypassing the intended Enter/Shift+Enter writing flow.
CodeMirror represents Markdown separators as real source lines; their smaller
Live Preview line height did not prevent pointer selection from entering them.

The Live Preview selection filter now retains the previous selection when a
pointer gesture produces a single collapsed caret on a structural separator.
The same protection applies to a lone trailing newline without an explicit
Markdown hard break. Clicking spacing changes neither the source nor its revision.

Enter-created paragraphs, Shift+Enter hard breaks, explicit empty blocks, source
editing, range selections and keyboard selection retain their existing behavior.
Blank lines inside a parsed source block are not treated as inter-block separators.
The existing structural-separator rule reserves the first blank line after content
for spacing; additional intentional blank lines remain writing positions.

The final special-block writing control and its bottom-area click behavior remain
available. That interaction explicitly creates a paragraph outside code/tables/media;
this repair addresses selection of separator lines. No backend, database, persisted
format or legacy Tiptap changes were made. No commit or push was made. Work remains
within M5 review.

## Library evaluation

Reused installed `@codemirror/state` transaction filters and the existing Orbium
structural-separator helper. The official [CodeMirror reference](https://codemirror.net/docs/ref/)
and installed view implementation were consulted. CodeMirror supplies selection
transactions tagged `select.pointer`; Orbium supplies the spacing policy. Atomic
ranges support cursor navigation but do not prohibit every direct selection, so
they are insufficient by themselves. No additional dependency was needed or added.

## Actual validation

- `npx vp fmt resources/js/components/editor/markdown/preview/markdown-preview-selection.ts`: PASS.
- `npm run lint`: PASS; 349 files correctly formatted, no warnings/errors in 284 linted files.
- `npm run types:check`: PASS.
- `npm run build`: PASS in 8.03 seconds; existing large-chunk and ineffective-dynamic-import warnings remain.
- `git diff --check`: PASS.
- No automated tests were written or run, as instructed.
- Browser interaction and manual acceptance were not performed; the following checklist is pending.

## Manual checklist

Reload Orbium and use a disposable format-2 document in Live Preview.

1. Type `First block`, press Enter, and type `Second block`. Click inside the first
   paragraph, then click the narrow blank separator between the paragraphs and type
   `X`. Expected: the caret stays at its previous position; `X` edits the first
   paragraph rather than filling the separator. Undo the character.
2. Click the end of `First block`, press Shift+Enter, and type `Same block`.
   Expected: a second line within that paragraph. Click that line and edit it.
   Expected: it remains selectable and editable; Source contains two spaces before
   its line break and a blank separator before `Second block`.
3. In Source replace the body with `First block` followed by exactly one newline.
   Switch to Live Preview, click the text, then click the blank final line and type.
   Expected: the existing text is edited; the trailing spacing is not a new writing
   position. Repeat using Shift+Enter from the end of the text instead.
   Expected: its explicit hard-break line accepts typing normally.
4. Press Enter at the end of a paragraph and click its new empty paragraph before
   typing. Expected: the new paragraph accepts text. Add an explicit empty block
   using the Plus control; expected: it remains editable.
5. Put paragraphs around a code block/table/divider and click their separator
   lines. Expected: no separator becomes a writing position or reveals rich source.
   Edit a blank line inside code; expected: code editing still works. The existing
   final `Click to write below` action still creates an ordinary paragraph.
6. Drag-select across two paragraphs, Shift+click to extend a selection, and use
   arrow keys. Expected: selection still works. In Source click/edit a blank
   separator; expected: raw Markdown remains freely editable.
7. Wait for Saved, reload, and switch retained tabs or split panes.
   Expected: edits survive, spacing stays protected in Live Preview, and controls
   continue to target the active document.

## Commit suggestion

`fix(editor): prevent pointer placement in markdown block spacing`

Remain in M5 manual review; M6 is not started.
