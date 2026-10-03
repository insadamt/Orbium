# Document editor specification

## Product rule

> Markdown speed + Notion interaction + Orbium minimalism.

The Orbit is where Orbium may be visually expressive. The editor should get out of the user's way.

## Layout

The document page uses the shared floating top controls. The title, optional cover/icon, database properties, and editor sit inside one spacious floating island. Back remains in the top controls. Search expands there into a document-local finder with a match count and Enter/Shift+Enter navigation.


Typical document:

```text
breadcrumbs / tabs

optional icon   optional cover

Document Title

Body...
```

The document image menu opens pickers for PNG, JPEG, GIF, or WebP icons and covers. A selected icon overlaps the cover edge by half its height and sits beside the title column. Existing text icons remain visible until replaced or removed.

Icons that do not match 512×512 open a crop dialog. Every new cover opens the crop dialog with 16:9, 9:16, 3:2, 4:3, 1:1, and 4:5 choices. The user can change ratio, position and zoom the crop, or cancel without changing the current image. Opened pages show the entire saved crop centered with a height limit; covers saved before this feature retain their wide banner layout.

No permanent formatting toolbar.

Preferred text column:

- roughly 700–900 px;
- default around 760 px;
- wide content such as code/tables may use more horizontal space.

## Canonical content

Use Tiptap/ProseMirror JSON as canonical persisted content.

Persist:

```text
content
content_format_version
plain_text
```

`plain_text` is derived.

A future clean Markdown serializer is desirable, but v0.1.0 portability does not depend on a Markdown folder export.

## Markdown typing behavior

At minimum:

```text
# + Space       H1
## + Space      H2
### + Space     H3
- + Space       bullet list
1. + Space      numbered list
> + Space       quote
---             divider
```lang          code block
```

Inline Markdown-style shortcuts may include:

```text
**bold**
*italic*
~~strike~~
`code`
```

The user should not be forced to type raw Markdown after conversion.

## Markdown file import

The document editor accepts `.md` and `.markdown` files and converts GitHub Flavored Markdown into editable blocks only when the document is empty. The import control is hidden once the document has content. Import replaces the empty placeholder paragraph, and autosave persists the result through the normal document save flow.

Pasting clipboard text that contains Markdown syntax into an empty document uses the same block conversion, even when the clipboard also includes HTML. Ordinary prose and rich text without literal Markdown syntax use the editor's normal paste behavior. Once the document has content, paste continues to use the normal editor behavior.

Headings, lists, task lists, quotes, tables, dividers, fenced code blocks, inline formatting, and links map to their editor equivalents. A `mermaid` fence becomes a Mermaid block. Raw HTML is kept as text. External Markdown image references become text because editor images require authorized uploaded attachments. Markdown headings beyond H3 map to H3 because the editor supports H1 through H3. The import accepts files up to 400 KB and rejects conversions that exceed the document's 1 MB save limit.

## Slash menu

Typing `/` opens a nearby frosted menu.

Initial commands:

```text
Text
Heading 1
Heading 2
Heading 3
Bullet list
Numbered list
Checklist
Quote
Callout
Code
Image
File
Table
Mermaid
Math block
Inline math
Divider
```

Typing filters commands.

Arrow keys + Enter must work.

## Block controls

Hover near a block shows minimal controls:

```text
+    drag-handle
```

Block menu:

- turn into;
- duplicate;
- copy;
- move up/down;
- delete.

Dragging reorders blocks.

## Text selection toolbar

Compact floating toolbar:

- Bold
- Italic
- Underline if supported consistently
- Strike
- Inline code
- Link
- More

Selected text also has a color control with preset swatches, a native custom color picker, and a way to return to the default text color. Colors are stored as six-digit hex values in the document content.

Do not make this toolbar permanently visible.

## Code blocks

Must support:

- syntax highlighting;
- language selector;
- language label;
- programming-language icon;
- copy button;
- optional line numbers setting;
- horizontal scroll.

Language icons should use a recognizable language icon set where available and a generic code icon fallback.

Common initial icon mappings:

- PHP
- JavaScript
- TypeScript
- Python
- Rust
- Go
- Java
- C
- C++
- C#
- HTML
- CSS
- SQL
- Bash
- JSON
- YAML

## Mermaid

Mermaid block:

- source editing;
- rendered preview;
- easy switch/focus behavior;
- sanitized output;
- error state that preserves source and explains the parse failure.

Do not execute arbitrary script from Mermaid content.

## Math

Support:

- inline math;
- block math.

Example syntax shortcuts may recognize:

```text
$E = mc^2$
$$ ... $$
```

Rendering library choice is implementation-level; output must be safe and readable.

## Images

Paste/drag/upload image:

1. upload through Laravel Filesystem;
2. create attachment metadata;
3. insert editor attachment/image node;
4. show selection controls.

Controls may include:

- resize;
- alignment;
- caption;
- replace;
- download;
- delete.

## Files

File attachment block shows at minimum:

- file-type icon;
- original name;
- size.

Opening/downloading must use authorized routes, not direct arbitrary storage paths.

## Mentions

Mentions may target:

- Document
- Folder
- Database

Typing trigger should be natural. `@` is the preferred initial trigger.

Example:

```text
See @Backend Architecture for the detailed design.
```

Mention picker searches the current workspace.

Saving a document must:

1. persist editor content;
2. derive plain text;
3. derive current mention set;
4. update mention index atomically;
5. validate referenced targets belong to the same authorized user's scope.

Mentions never change parentage.

## Database document properties

When parent is a database:

```text
Title

Properties ▾
Status      Active
Priority    High
Deadline    ...

Body...
```

Properties are inline-editable and collapsible.

The body is identical to a normal document body.

## Autosave

No normal Save button.

Behavior:

```text
edit
↓
debounced autosave
↓
Saving…
↓
Saved
```

Requirements:

- avoid request per keystroke;
- preserve latest local state during an in-flight save;
- surface failures;
- do not silently overwrite newer server state if a conflict-control mechanism is introduced.

`Ctrl + S` may force/flush save without becoming the primary workflow.

The autosave queue retains the latest immutable ProseMirror document snapshot and serializes it only when a save starts. An in-flight save owns its snapshot; later edits replace only the pending snapshot. Failed requests retain the pending content for retry, and revision checks and navigation guards remain active.

## Current-document search

`Ctrl + F` searches inside the active document.

`Ctrl + Space` remains global Search Master.

The floating page finder's match count settles after 150 ms of inactivity while typing or editing. Enter/Shift+Enter uses the current document immediately. Match positions are cached only for the latest document snapshot and query per editor, so content changes invalidate them without rescanning on every selection change.

## Block direction and alignment

Text blocks detect direction from their first strongly directional character.
The compact block menu offers left, center, and right text alignment.
Empty blocks created with Enter or the add-block control inherit the preceding
block's direction; typing a different language updates its automatic direction.
Existing explicit direction choices remain stored in editor content. Direction
and alignment survive autosave and reload. Alignment applies to
paragraphs and headings, including those inside lists, quotes, and callouts.

## Focus/read state

When idle, editor chrome should disappear as much as possible.

A future dedicated focus mode may exist, but is not required for v0.1.0.

## Editor reference remapping

Editor content may contain:

- target node IDs for mentions;
- attachment IDs.

The content format service must support remapping these references during portability restore.

Never implement portability by regex replacement over serialized JSON.
