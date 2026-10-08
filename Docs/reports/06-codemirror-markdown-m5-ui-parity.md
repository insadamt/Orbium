# M5 correction — Restore the Tiptap editor UI

Date: 2026-10-08. Status: **Implemented for manual review. Visual acceptance and full migration parity remain pending.**

The user rejected the CodeMirror UI and requested investigation of the legacy editor, including context menus, block presentation and document styles. This is a correction within M5. It does not authorize M6 or removal of Tiptap.

## Reference and findings

Reviewed the legacy document header, selection toolbar, color picker, block gutter/context menu, code node view, image/file views, table edge controls, inline/display math and Mermaid views, plus shared document CSS and style selectors. Compared these against the corresponding CodeMirror interactions and rich widgets.

The previous implementation used text formatting buttons and native block-menu selects, persistent generic rich-block frames, image fields underneath the image, source textareas for table cells, a browser prompt for inline math, and a source-editing card for ordinary blocks with direction/alignment metadata. These were material differences from the legacy UI.

## Implemented

- Extracted engine-neutral block-menu, formatting-button and color-picker components from the legacy editor. Both engines now consume the same presentation. The block menu retains the Radix select, alignment/direction button groups, action icons, frosted panel, viewport clamping and Escape handling.
- CodeMirror uses the legacy Plus/GripVertical gutter icons, right-click block menus, text copy, disabled boundary movement actions, block drag preview, dragged-block opacity and an insertion indicator. Block moves also remove an adjacent separator to avoid accumulating empty paragraphs.
- Selection formatting uses the same Lucide icons, ordering, pressed styling and palette layout. A stable tooltip factory keeps the palette mounted while formatting updates source. Partial emphasis removal retains formatting outside the selected text.
- Formatting-only directives render editable Markdown lines inside structural wrappers, with directive headers/closers hidden. Explicit alignment/direction, paragraph splitting, inline span boundaries, shortcuts and slash insertion preserve the canonical wrapper contract. Empty authored paragraphs have a small writing field instead of an Empty paragraph card.
- Lists use native `ul`, `ol` and `li` wrappers. Ordered items receive explicit values for viewport rendering, and imported alphabetic/Roman list types retain their presentation. Paragraph/list/quote selectors continue to use the shared document-style runtime. Escapes/entities display their decoded text in Live Preview.
- Code blocks use the legacy language/copy header and a continuously editable CodeMirror code surface. The installed lowlight renderer supplies syntax colors while editing; there is no separate code edit/preview mode. Copy feedback resets, and unknown language tokens stay available without being replaced by an `unknown` sentinel.
- Images use a selected-image side toolbar, alignment icons, fill width, download, delete, replacement, corner resize handles and an in-place caption. File attachments use the legacy bordered download card with a size label. Their persistent generic source-control rows are hidden.
- Tables use the existing table cell/border styles and row/column edge controls. Cell editing uses a lazy CodeMirror writing surface; secondary actions appear behind a Table options button. Table action logic is split from widget mounting. Semantic structure comparison avoids rebuilding cells just because serialization switches between GFM and rich-table syntax. Parent-to-cell synchronization is deferred outside the nested editor's update listener.
- Callouts have directly editable bodies. Default NOTE does not add an extra visible heading; imported titles/folding remain supported. Inline math uses an in-place source popup. Display math and Mermaid keep the legacy Edit/Preview presentation.
- The document header restores Import/Export/Find/Add file ordering. Export is a direct action with an adjacent options button; the Markdown source switch is a compact icon. Mobile gutter space and the original footer hint are restored. Duplicate wrapper registration was removed, and interaction extensions remain stable during appearance changes.
- Rich input undo/redo routes through the parent document history. Disposal guards prevent optional controls from dispatching after their widget is destroyed.

## Libraries and source ownership

Reused the user's approved installed libraries: CodeMirror view/state/commands/completion, React/React DOM, Radix select/dropdown, Lucide, lowlight, KaTeX and the existing Mermaid session. Examined local package declarations for CodeMirror block wrappers, tooltips and completion customization. No dependency additions.

These libraries supply editor state, viewport rendering, icons and UI primitives. They do not supply Orbium block ownership, canonical directive edits, attachment authorization or lossless conversions. Those remain Orbium responsibilities. Shared UI components have no Tiptap runtime import; legacy engine commands remain in their adapter.

## Persistence and scope

No API, database migration, content-format change, dependency change or automatic conversion of existing documents. Format 1 continues to load Tiptap, and format 2 continues to store canonical Markdown. No commit, push, PR or M6 work was performed.

## Actual validation

- `npm run check:fix`: PASS; formatting completed, no lint warnings/errors in 274 files.
- Final `npm run lint`: PASS; all 339 checked files correctly formatted, no warnings/errors in 274 linted files.
- `npm run types:check`: PASS (`tsc --noEmit`).
- `npm run build`: PASS, 7.78 seconds. Existing large-chunk and ineffective-dynamic-import warnings remain.
- `git diff --check`: PASS.
- Changed/new TypeScript, TSX and CSS files were checked for size: none exceeds 500 lines.
- No automated tests were added or run, as instructed.
- In-app browser setup was attempted, but the `iab` browser was unavailable. No browser interaction, screenshot comparison, IME check or performance measurement is claimed.

## Manual checklist

Use a new format-2 document, import [the UI review fixture](../examples/orbium-markdown-m5-ui-review.md), and keep an equivalent format-1 Tiptap document open as the reference. Use the same appearance, document styles, zoom and viewport for both. Perform edits on disposable review documents.

1. **Default surface:** Compare both headers, paragraphs, headings, lists, quote, callout, code, math and table. Expected: matching shared typography, borders, spacing and control presentation; ordinary formatted blocks have no Edit block card. Source controls remain available through the compact header icon.
2. **Context menu:** Right-click a paragraph, then open its grip menu. Repeat near the bottom/right of the viewport. Expected: the same Block options panel, Turn into select, alignment/direction groups and icon actions as Tiptap; the panel stays within the viewport. Escape, outside click, scroll and resize close it. Open the Turn into Radix select; interacting with its portal must not dismiss the whole menu prematurely.
3. **Block actions:** Convert disposable text through H1/H2/H3, bullet list, numbered list, checklist, quote, code and back to text. Duplicate, copy text, delete and move blocks. Expected: conversions save successfully, copy excludes Markdown punctuation, first/last movement is disabled, and undo/redo restores each edit. Rich atoms are protected against unsupported text conversions.
4. **Drag and add:** Drag a paragraph, complete list and rich block above/below other blocks, repeating several times. Expected: a text drag preview, dimmed origin and insertion line; whole authored blocks move without accumulating blank paragraphs. Click Plus; expected: a writing position below the block without an automatically inserted slash. Try narrow mobile width; the gutter must remain reachable.
5. **Formatting:** Select ordinary words and apply each toolbar action with undo between attempts. Select a word inside a longer bold phrase and remove bold. Expected: icon order/pressed states match Tiptap, surrounding words retain formatting, and source/save/reload remain valid. Repeat with nested bold/italic and underline/color spans.
6. **Colors:** Change preset color, custom color and Default text color on selected text. Expected: the shared palette, current-color indicator and preset checkmark; clearing color retains underline. Custom-color changes keep the picker usable. Purple adapts between Light/Dark as in the legacy editor.
7. **Direction/alignment:** Edit the fixture's RTL and centered paragraphs directly, apply alignment/direction from the menu, press Enter in the middle/end, and use Shift+Enter. Expected: metadata stays hidden in Live Preview, new paragraphs preserve presentation, keyboard focus stays usable and saving succeeds. Type into the empty RTL paragraph; expected: it becomes ordinary editable text without a source card.
8. **Lists/styles:** Check the repeated-source-marker numbered list displays 3, 4, 5; check nested bullets, checklist toggles and alphabetic numbering. Change account paragraph/list/quote/code/table styles and compare both engines. Expected: native markers, indentation, body styles and RTL layout follow the same style system. Scroll a long list; values must remain correct as lines enter the viewport.
9. **Code:** Click code and type, press Enter/Tab, change language and Copy, then undo/redo. Expected: continuously editable highlighted code with the legacy language/copy header; no mode-switch card. Copy shows feedback then returns to Copy. Source fence spelling remains valid, including authored backticks. Switch Source/Preview while code is focused; expected: no stale-widget exception.
10. **Callout and math:** Click/edit callout text, add inline formatting, leave and return. Click inline math, type valid/invalid LaTeX, close with Enter/Escape and outside click. Use display math/Mermaid Edit and Preview. Expected: direct callout editing, an in-place inline-math field and the legacy display-mode controls; errors preserve source and saved content.
11. **Images/files:** Upload a real image/file. Select the image, align/fill/resize from each corner, use keyboard arrows, add a caption, download, replace and delete with undo. Expected: side controls appear on selection, corner handles/caption follow the image, download cards show file name/size, and attachment ownership/source survive save/reload. Check narrow viewport controls and canceled resizing.
12. **Table editing:** Click a formatted cell, type, use Tab/Shift+Tab, add a paragraph and enter a literal pipe. Expected: formatted writing rather than a source textarea; normalization and GFM-to-rich conversion do not lose typing focus or throw an update-listener error. Use edge Plus controls; expected: added last row/column and the same table borders/width behavior as Tiptap. Open Table options for secondary actions; they should not cover the table during ordinary reading.
13. **Suggestions/navigation:** Type / and @ inside plain and explicitly formatted paragraphs. Expected: frosted completion panels and mention labels with the type on the same line; arrows/Enter work, Ctrl+Space remains Search Master, and references navigate through the existing autosave guards.
14. **Persistence/activity:** After the above edits wait for Saved, reload, open Find and navigate results, switch between retained tabs, and use split panes. Expected: content/styles/references survive, Source reveals valid canonical Markdown, menus belong to the active editor, and inactive views do not accept edits. Repeat while a code input, table cell, palette and inline-math popup are open.

## Remaining acceptance limits

The shared UI and reviewed presentation changes do not establish pixel-level or full behavior parity. Browser screenshots and matched long-document measurements are still required. M5's safe single-source-line toolbar selection restriction remains; multiline mixed-format selections and advanced table spanning operations remain migration gaps from the earlier reports. Nested rich content in a cell/callout still needs review while editing as well as while reading. Native drag has not established touch parity. These are acceptance gates, not claims that the migration is finished.

## Commit suggestions

- `fix(editor): restore Tiptap menus and block presentation in CodeMirror`
- `refactor(editor): share editor surfaces across Tiptap and CodeMirror`

Stop in M5 for the user's manual review. Do not start M6 or remove the legacy editor.
