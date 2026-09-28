# Document editor specification

## Product rule

> Markdown speed + Notion interaction + Orbium minimalism.

The Orbit is where Orbium may be visually expressive. The editor should get out of the user's way.

## Layout

Typical document:

```text
breadcrumbs / tabs

optional icon   optional cover

Document Title

Body...
```

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
Math
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

## Current-document search

`Ctrl + F` searches inside the active document.

`Ctrl + Space` remains global Search Master.

## Focus/read state

When idle, editor chrome should disappear as much as possible.

A future dedicated focus mode may exist, but is not required for v0.1.0.

## Editor reference remapping

Editor content may contain:

- target node IDs for mentions;
- attachment IDs.

The content format service must support remapping these references during portability restore.

Never implement portability by regex replacement over serialized JSON.
