# Native icon selection matching the Document screenshot — 2026-10-28

## Change

The user's reference shows one text selection spanning words and an icon, with the ordinary formatting toolbar above it. The native Board/Mind Map node still allowed ProseMirror object selection even after the earlier DOM adjustment. Native arrow/click behavior could therefore switch to a separate icon selection rather than stay in the text range. The previous transparent selection character alone did not establish the requested visual behavior.

- Disable separate object selection and object dragging for the shared native inline-icon node. ProseMirror's existing inline cursor and Shift+Arrow handling now keep these glyphs in text selections. Deleting/copying a mixed range continues to operate on whole saved icon atoms.
- Use a text range covering the icon for explicit double-click replacement as well, preserving the existing picker/mark behavior.
- Add a shared selection decoration for every icon inside a selected range. Browser selection does not reliably paint noneditable SVG/image boxes; these decorations paint those boxes with the same foreground-based selection background as the surrounding text. Focused/unfocused colors match the Document selection theme. Clear the decoration when the selection collapses; never save it in content.
- Observe Mind Map pointer gestures in capture phase because its fullscreen dialog stops bubbling pointer-down events. Show the formatting toolbar after release and also recover from pointer cancellation/window blur.

This is the existing inline-icon review. Native Boards (writing/list editors), Mind Map topic rich text and legacy Documents share the node/plugin. Board Document-style table cells continue using their existing Markdown/CodeMirror selection renderer. There is no content/schema/migration/dependency change in this correction. Keep all prior format-8/color/completion/zoom work.

## Verification

- Targeted formatting: passed on all five changed source files.
- `npm run lint`: passed; 860 files correctly formatted, no warnings/errors in 691 linted files.
- `npm run types:check`: passed.
- `npm run build`: passed in 15.51 seconds. Existing large-chunk, ineffective dynamic-import and plugin-timing warnings remain.
- `git diff --check`: passed.
- No PHP changes in this correction, so no additional PHP checks or migration runs.

No automated tests, Playwright or browser/computer interaction were run. Source/build checks cannot confirm native drag geometry; the following manual acceptance remains required.

## Manual checklist

Fully reload first, since existing editor instances retain their initialized extension schema.

1. In a Board text object, enter editing and write `before [rocket icon] middle [brand icon] after`, using the existing picker for both symbols. Drag from before the first word through the final word, then backwards. Expected: one text range includes both icons, with matching selection backgrounds; no separate object outline, object move, or replacement picker. After release the text formatting toolbar appears.
2. Repeat starting/ending the drag on either side of each icon. Put the caret next to an icon and use Left/Right and Shift+Left/Right. Expected: Left/Right crosses the glyph as one inline unit; Shift extends/retracts the ordinary text selection across it. Repeat with a glyph at the start/end of the line and two adjacent glyphs.
3. With words and both icons selected, choose Text color → Red, then a custom color, then Default. Expected: selected words and vector icons change/reset together; unselected words remain unchanged. The same range remains targeted while the color menu owns focus. Click elsewhere: the icon highlight clears.
4. Copy/paste the mixed range, delete it, undo/redo, then double-click one icon and replace it. Expected: whole icons retain identity/marks during copy/undo and exactly one symbol is replaced on double-click; ordinary dragging never opens the picker.
5. Repeat steps 1–4 in Board H1/H2/H3, Quote, Callout, bullet/numbered/check lists and Document-style table cells. Expected: the same mixed selection and formatting behavior in each editable text surface.
6. Open a Mind Map in fullscreen Edit, enter topic text editing and repeat steps 1–4 in paragraph, heading, list, quote and callout content. Expected: branch/canvas does not drag during text selection; toolbar stays hidden during the gesture and appears on release above the range. Drag outside the topic before releasing and repeat after switching windows: the toolbar must recover.
7. Repeat with an uploaded image icon, Light/Dark themes, wrapped lines and several Board/Mind Map zoom levels. Expected: selection includes the complete icon box without a visible placeholder. Vector icons follow text color; image pixels/emoji retain their original artwork.
8. Finish editing, wait for Saved and reload. Expected: icons and colors persist, selection decorations do not. Spot-check a legacy Document containing icons for the shared node's cursor/drag behavior. Read-only views must not write.

## Suggested commit

`fix(editor): keep native inline icons in text selections`
