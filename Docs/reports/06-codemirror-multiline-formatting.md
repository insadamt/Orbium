# Cross-block text selection and formatting

Date: 2026-10-12. Status: replacement implemented; manual acceptance pending.
Current editor review only. The two previous implementations failed user review.
Their passing static checks did not establish working browser behavior.

## Behavior reference

Reviewed Notion's official [writing and editing documentation](https://www.notion.com/help/writing-and-editing-basics).
It describes selecting partial text across paragraphs, lists and callouts by
starting a drag within text, and showing an editing menu for highlighted text.
These observable behaviors are the target. The documentation does not expose
Notion's editor implementation; the implementation below is Orbium's own.

## Changes

Replaced the previous source-row formatter with selected block text and inherited
formatting marks. The parser collects paragraphs, headings and GFM Task nodes,
including callout body paragraphs. It separates actual text from heading markers,
checkboxes, quote markers, callout headers, inline math and rich media payloads.
Each selected text portion retains its existing bold/italic/strike/code/link/color/
underline marks. Formatting changes those marks directly; serialization rewrites
each changed text block once, preserving its surrounding block structure. Related
marks share wrappers, avoiding nested color overrides and contradictory toggles.
Color reset and underline removal affect selected portions inside existing spans.
Link destinations are validated before edits; existing link titles are retained
unless the selected link is explicitly changed. Inline-code removal escapes literal
Markdown characters and entities. Selection endpoints are mapped to the serialized
visible text, rather than mapping every endpoint to the edge of a replaced row.

All block changes dispatch in one isolated undo transaction and use existing
Markdown/Orbium metadata fields and the normal autosave queue. No backend, database,
archive format, dependency or migration changes. Only changed text blocks are
serialized. The source parse is cached by immutable document snapshot, and selection
collection visits the selected source interval. The first complete parse for a new
snapshot is synchronous; no long-document performance measurements were performed.

The toolbar now retains its selected source snapshot for button, link prompt and
native color-picker actions. It stays hidden during mouse selection and appears
after pointer release, so it does not intercept a growing drag. Keyboard selection
continues to show it immediately. Pointer-release, cancellation, blur and editor
destruction clean up the selection lifecycle.

A concrete callout defect was also fixed: its outside-click listener previously
closed and destroyed its nested editor when clicking that editor's body-mounted
formatting toolbar. It now recognizes the owning formatting target. Keyboard
formatting operates on a non-empty selection even when it ends in a literal block.

Implementation is split between source parsing, text-run collection, serialization,
transaction assembly and toolbar behavior. Every modified/new source file remains
under 500 lines. No commit created.

## Actual verification

- Targeted `npx vp fmt`: passed.
- `npm run types:check`: passed.
- `npm run lint`: passed; 400 files formatted and 330 linted, no warnings/errors.
- `npm run build`: passed in 9.39 seconds. Existing large-chunk and ineffective
  dynamic-import warnings remain.
- `git diff --check`: passed.

An initial type check caught an EditorView type-only import used as a runtime value;
that import was corrected before the final checks. No automated tests written or run,
following the user's instructions. PHP unchanged. Browser connection was attempted,
but the in-app browser backend was unavailable. No live interaction was verified.

## Exact manual checklist

Reload Orbium. Create a disposable empty Markdown document and import
[the formatting review fixture](../examples/editor-multiblock-formatting.md).
Use Live Preview. Undo or reload a fresh fixture between independent checks.

1. Drag from midway through the first paragraph to midway through the third, slowly,
   then quickly and in reverse. Expected: the selection extends across paragraphs;
   the toolbar appears after release and does not interrupt the drag. Click Bold.
   Expected: every selected text portion becomes bold, including plain text beside
   existing bold/italic/color spans; unselected boundary text retains its appearance.
2. Without reselecting, click Italic, then Underline, then choose Red and Blue.
   Expected: each effect applies to the same selected portions across all blocks;
   color changes preserve the other effects. Choose Default color. Expected: local
   color is removed throughout the selection, including previously colored phrases.
3. Select a middle fragment of the fixture's underlined and colored text together
   with plain text in another paragraph. Toggle underline and change/reset color.
   Expected: selected portions change consistently; surrounding unselected text
   keeps its previous underline/color, with no literal metadata appearing.
4. Press Ctrl/Cmd+A twice from an ordinary paragraph; apply Bold. Expected: heading,
   paragraph, bullet, numbered-item, checklist, quote and callout body text format
   together. Heading levels, list markers, checked states and callout header remain
   intact. Divider and fenced code remain untouched. Toggle Bold again: selected
   eligible text becomes plain. Repeat with Underline and Strike.
5. Start a cross-block selection in prose and end it at/beyond the fenced code block.
   Press Ctrl/Cmd+B and Ctrl/Cmd+I. Expected: selected prose changes even though the
   selection ends in a literal block; code source remains intact.
6. Open the callout for editing, select its two body paragraphs and click toolbar
   Bold/color/custom color. Expected: the toolbar action runs without closing the
   callout first, both paragraphs change, and selecting any native picker value
   retains the same selection. Repeat with multiple adjustments in the picker.
7. Select a fragment of a linked label plus ordinary text in another block. Set a
   new HTTPS link, then clear it with an empty URL. Expected: selected portions
   update together; unselected link portions keep their destination. Try
   `javascript:alert(1)`. Expected: a validation notice and no partial changes.
8. Select text containing nested bold/italic, inline code, brackets, escaped literal
   asterisks and an ampersand. Toggle inline code on/off and Bold/Italic. Expected:
   readable literal text is retained without duplicate delimiters or visible
   metadata. Check Source mode: structure and valid Markdown remain intact.
9. Undo once after one bulk action. Expected: the whole action reverses; Redo
   restores it. Wait for Saved and reload. Expected: all affected blocks preserve
   their text, effects and structure. Repeat in Light/Dark and split panes.
10. Repeat keyboard selection and select-all on a longer document with offscreen
    prose. Expected: selected offscreen text is included and only the focused
    document changes. Release a drag outside the pane and switch tabs; expected:
    no stuck selection mode or stale toolbar.

## Practical limits and review gate

Rich code, tables/cells, math and media retain their separate editing controls.
Parent-document text formatting preserves their source. Pointer selection across
nested rich editors needs particular attention in manual review; the changes above
do not establish complete Notion parity or touch acceptance. The manual checks are
pending, and the earlier failed attempts make them necessary before acceptance.
Remain in the current editor review phase.

Suggested commits:

- `fix(editor): format selected text consistently across blocks`
- `fix(editor): preserve selection through formatting toolbar actions`
