# Mind Map branch slash commands — 2026-10-26

The user requested “support all type of text with / inside the branch”. This implements the Document text-block types inside topics within the existing phase-5 review.

## Delivered behavior

- `/` in an empty text block opens a filtered, icon-based text-type menu: Text, Heading 1, Heading 2, Heading 3, Bullet list, Numbered list, Checklist, Quote, Callout and Code. It works on individual blocks inside the topic, including list/quote/callout text. Arrow keys select; Enter/Tab accepts; a click accepts without losing the text selection. Escape dismisses the menu and preserves literal slash text. Slash in code remains literal.
- Branch editing uses a full structured text document. Enter continues text/list/code editing; Shift+Enter makes a soft break where supported. Tab/Shift+Tab indent/outdent list items. Escape or Ctrl/Cmd+Enter finishes editing. With the topic selected rather than editing text, Enter still creates a sibling and Tab a child.
- Shared inline formatting controls continue to provide bold/italic/underline/strike/code/link/color. Checkboxes are editable in the text editor. Previews show the saved checked state without adding nested interactive controls.
- Structured preview and editor styles share heading/list/quote/callout/code presentation, preserving automatic height and variable-width layout. Topic selection uses a focusable treeitem container to accommodate real block elements without placing them inside a button. Canvas panning excludes these topic containers.
- A dialog-local menu stays outside the scaled topic scene. Its position is clamped to the fullscreen surface and refreshed on selection/transactions, scroll and window resize. Selected options scroll within the menu, not the surrounding canvas.

## Persistence and compatibility

Graph version **4** adds optional topic `body`, a structured JSON document with an exact plain `text` projection. Existing `content` and `body` cannot coexist on one topic. Accepted text changes replace inline content with one canonical body; width changes preserve version 4. Opening/closing an unchanged topic does not upgrade its graph. Older version-1 labels remain literal and versions 2/3 retain their formatting and widths.

Client/server both validate allowed nodes, parent/child structure, attributes, safe inline marks and plain-text equality. Bodies allow 256 block nodes and nesting depth 16; original 500 Unicode code points per topic, 64 KiB per graph and 64 topic-parent links remain. Code blocks are plain text. Unknown nodes, HTML, media and arbitrary attributes cannot become persisted body content. Rejected edits restore accepted content through the existing owner path.

Legacy normal/hosted full saves advertise `editor_features: {mindmap: 4}`. The stored-graph capability guard requires 4 for a stored version-4 map. Deploy matching frontend/server and reload open editors. Board spatial format 7, native content format 1 and Markdown/legacy envelopes stay unchanged; **no database migration** is required.

Search, statistics and plain/office exports continue using `topic.text`; plain outlines lose rich structure explicitly. Formatting-preserving graph exports retain bodies and widths. No changes to account archive formats or external services.

## Checks actually run

- `npm run check:fix`: passed formatting and lint after implementation.
- `npm run types:check`: passed.
- `npm run lint`: passed; 758 files correctly formatted, 641 source files checked without warnings or errors.
- `npm run build`: passed in 16.57 seconds. Existing chunk-size, mixed static/dynamic import and plugin timing warnings remain. Log: `/tmp/orbium-mindmap-slash-build.log`.
- `vendor/bin/pint --test app/Services/MindMaps/MindMapData.php app/Services/MindMaps/MindMapTopicDocument.php`: passed.
- `php -l` for both PHP files above: passed.
- `git diff --check`: passed before the documentation update; repeated for final delivery.
- New/changed source files are under 500 lines (largest affected source: canvas, 429).
- No automated tests, browser automation or Playwright written or run, per user instruction. Browser interaction, rendering, import/export and persistence acceptance remain manual. No performance claims.

## Exact manual checklist

Use disposable content. Repeat the core editing/save/undo checks in a native Board map, a normal Markdown Document map and a hosted/legacy Document map where available.

1. **Open and discover:** open Mind Map Edit, double-click a topic and replace the selected label with `/`. Expect an unscaled menu with ten text choices and matching icons. Type `h2`, use arrows and Enter. Expect an empty Heading 2; type a title. The menu disappears and the topic grows naturally.
2. **All text types:** create a separate topic for each menu choice. Add two lines/items in lists, a checked and unchecked task, a multiline quote/callout/code sample, and all three headings. Expect proper text styles both while editing and after Escape, in embedded preview and fullscreen preview. Code punctuation/slashes remain literal.
3. **Mixed body:** start with a heading, then add a paragraph and lists within the same topic using Enter and `/` on the new empty text block. Add nested list items with Tab, outdent with Shift+Tab; click a task checkbox while editing. Expect one branch with preserved document structure, working list continuations and saved checked state. Enter inside text must not create a new branch.
4. **Menu keyboard/click:** filter `/quote` and accept by click; filter `/check` and accept by Tab. Press Escape while `/` is open: expect the menu to close, literal slash retained and editor still active. Press Escape again: expect selected-topic mode. Type a nonmatching query: expect “No matching text type”, with Escape still working. After dismissing, literal URLs/paths remain text and typing `/` inside code never opens a menu.
5. **Graph shortcuts/focus:** finish editing with Escape and with Ctrl/Cmd+Enter. With the topic selected, Tab adds a child and Enter a sibling; F2/Space/double-click edits. Arrow navigation and Delete/Backspace continue working. Clicking a topic must select without starting canvas pan. Expect one selection border.
6. **Toolbar:** select paragraph/list/heading text, apply bold/underline/color and a safe link, then finish. Expect marks and link retained after reopening; toolbar stays above the scaled scene. Link fields/pickers do not trigger graph history or canvas pan. Inline formatting is unavailable where code-block schema disallows it.
7. **Height and width:** add a long list and multiline text, finish, narrow/widen the selected branch via grip. Expect automatic height, separated neighboring topics and connected edges. Reopen and edit a resized version-4 branch: width stays saved. Cancel a drag with Escape and use owner Undo/Redo: formatting/body/width remain coherent.
8. **Save/history:** apply a slash command, type, check a task, format text and resize. Use owner Undo/Redo while editing and after finishing. Expect accepted actions to restore body, marks, checked state and width. Wait for Saved, close, reload and reopen: expect the same structured content and geometry. Repeat on hosted documents. Copy/duplicate or `.orbie` export/import through the existing Document workflow: expect the same saved graph; plain/office exports contain all projected topic text.
9. **Position/read-only:** zoom in/out, scroll a branch near each fullscreen edge and open `/`. Expect the menu to stay readable inside the dialog, scroll its own options and track the caret. Resize the window; repeat. Read-only fullscreen/embedded views have no slash menu, mutation toolbar or width grips; rendered checkboxes stay inert.
10. **Older content/limits:** open existing version-1 literal Markdown/HTML-looking labels and version-2/3 marked/resized topics. Expect unchanged display/data on open/close. Edit one topic: expect graph 4, original marks and widths preserved. Paste more than 500 characters or exceed the graph/body limits: expect rejection and restored accepted content, never a falsely saved editor-only body. Compose non-Latin text and finish composition before closing: expect committed content preserved.
11. **Manual validation in copied disposable requests:** try `body` in graph 3, body+content together, a body/plain-text mismatch, an unknown node/attribute, invalid heading level/list start/checked value, unsafe link, body nesting over 16 and graph version 5. Expect validation rejection and unchanged stored revision. For a stored legacy graph 4, lower advertised capability to 3 while omitting its map: expect reload rejection and preserved content.

## Limits and review boundary

This adds text-block commands. Tables, media, nested Mind Maps, Mermaid and math widgets are not included in branch bodies. Graph text/byte limits are unchanged; long documents belong in Documents. This remains phase-5 manual review, with no later phase started. No commit or staging performed; pre-existing uncommitted work remains.

Suggested commit: `feat(mindmap): support slash text blocks inside branches`
