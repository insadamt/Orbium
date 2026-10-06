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

Every block supports automatic text direction and an Auto/LTR/RTL choice in its block menu. Automatic direction follows the first strong character and inherits the preceding block's direction when the block has no directional text. RTL layouts use logical edges for lists, quotes, tables, attachments, and media; code and diagram source fields remain left-to-right for editing.

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

The document editor can download the current document as a `.md` file, including its title and current body edits. This is a single-document convenience export, separate from the portable Orbium archive. Standard blocks use GitHub Flavored Markdown; Mermaid and math retain their source syntax. Mentions and attachments become links to this Orbium installation, so the file alone does not carry their targets or binary data. Database properties are not included. Visual-only formatting such as text color, alignment, and direction is omitted.

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

Selected text also has a color control with seven preset swatches, a native custom color picker, and a way to return to the default text color. The preset colors are red (`#eb2424`), blue (`#75a1ff`), green (`#24eb4b`), cyan (`#24c9eb`), magenta (`#eb24e4`), a theme-dependent swatch (yellow `#ebe424` in dark mode and violet `#3700ff` in light mode), and orange (`#eb8424`). These colors are the same on normal and frosted surfaces. Presets are stored by name so the theme-dependent swatch adapts when the theme changes. Custom colors are stored as six-digit hex values.

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

## Long-document rendering

Direction normalization inspects the changed top-level range and continues into
following blocks only while inherited direction needs updating. Unchanged nested
subtrees reuse their normalized results. Initial normalization builds one content
replacement, preserving selection and avoiding one transaction step per block.

Syntax highlighting keeps the existing Lowlight grammars and language detection.
It skips selection-only transactions, maps unchanged decorations through edits,
and queues changed code blocks for short idle batches. Code remains editable while
coloring catches up. Highlight-only transactions do not change content or create
undo/save entries. A single large code block still requires synchronous highlighting
within its scheduled job.

Math previews activate within 600 pixels of the viewport. After the editor becomes
interactive, Mermaid warms independently and prioritizes visible diagrams and the
next three viewport heights in the reading direction. Nearby preparation continues
during scrolling; distant rendering yields to interaction. Local rendering remains
limited to one diagram at a time. Prepared dimensions reserve responsive space for
all copies before nearby SVGs mount, so tall prepared previews do not expand their
boxes upon insertion. Uncached sources have unknown dimensions until rendering
completes. Previews remain mounted after first display.
Rendered Mermaid SVGs are disposable document-scoped cache entries in PostgreSQL,
keyed by the source hash and renderer version. Saved previews are retrieved lazily
and reused within the editor session. Markdown import never waits for all diagrams
or cache persistence. Local preview display and cache uploads are independent;
obsolete SVGs are removed when changed source is saved. The Mermaid source in
document JSON remains authoritative.
Cached SVG is sanitized again before insertion into the editor. A renderer
version or configuration change requires a cache version bump.
Images use native lazy loading and asynchronous decoding. The complete editable
document remains mounted; these optimizations do not virtualize selection or blocks.

## Editor reference remapping

Editor content may contain:

- target node IDs for mentions;
- attachment IDs.

The content format service must support remapping these references during portability restore.

Never implement portability by regex replacement over serialized JSON.

## Account-wide editor styles (approved 2026-10-05)

Settings → Editor styles provides a base CSS stylesheet, independent block declaration overrides, and a live sample-document preview. CSS import replaces the draft base and clears draft overrides; Apply saves to the current account. Export combines the base and overrides, in that order, into one `.css` file. Reimport preserves the effective appearance as base rules; subsequent block overrides remain editable independently. Reset block clears only its override, returning to the base theme. Cancel restores saved preferences. Reset all and Enable custom styles take effect on documents only after Apply.

Styles apply to normal and database documents in all workspaces owned by that account. Already-open documents receive a same-origin BroadcastChannel notification and fetch the account's saved settings. Browsers without BroadcastChannel update on navigation/reload. Theme preferences are PostgreSQL-backed `users.editor_styles` JSON and do not change canonical document content, revisions, or Markdown export. Complete account archive integration belongs to the approved portability phase; standalone CSS sharing is available now.

Stable selectors: `.orbium-paragraph`, `.orbium-heading-1`, `.orbium-heading-2`, `.orbium-heading-3`, `.orbium-bullet-list`, `.orbium-ordered-list`, `.orbium-checklist`, `.orbium-quote`, `.orbium-callout`, `.orbium-code`, `.orbium-table`, `.orbium-image`, `.orbium-file`, `.orbium-mermaid`, `.orbium-math`, `.orbium-divider`. Selectors refer to block containers; image styles affect the image wrapper, and table styles affect the table. Paragraph rules also apply to paragraphs inside composite blocks. Existing explicit inline formatting remains higher priority. Title/cover and app chrome are outside this scope.

Support appearance declarations: colors, font family/size/weight/style, line height, letter/word spacing, text alignment/decoration/transform/indent, border shorthand/width/style/color/edges/radius, padding, margin, and box shadow. Logical spacing and border edges support RTL. Theme variables are limited to `--foreground`, `--background`, `--muted`, `--muted-foreground`, `--border`, `--accent`, `--accent-foreground`, `--primary`, and `--primary-foreground`. Use these variables instead of fixed colors when styles should adapt to Light/Dark.

CSS is parsed and validated with CSSTree and regenerated under the document/preview scope; stored source is never inserted directly. Only exact documented class selectors, optionally comma-separated, are accepted. Arbitrary/nested selectors, at-rules, remote URLs, custom properties, !important, negative dimensions, positioning, display, transforms, and animation are excluded. CSS must also be supported by the current browser. Invalid drafts show source-linked diagnostics and retain the last valid preview; enabled invalid themes cannot be applied. Invalid stored settings fall back to the default document appearance, and custom styles can always be disabled in Settings. Combined exported UTF-8 CSS is limited to 50,000 bytes; each override is limited to 10,000 characters.

The sample preview contains representative media, equation, and diagram markup. It does not upload attachments or invoke the Mermaid renderer. CodeMirror is loaded with the Settings page and provides CSS highlighting, completion, and editor history. CSSTree validates syntax; Orbium owns the property/selector policy and account persistence. Block selector decorations are transient, map through edits, and rebuild only changed enclosing blocks, preserving the long-document rendering strategy.

A starter theme is available at `../examples/editor-theme.css`.

### Editor styles workspace redesign (2026-10-06)

The settings page now summarizes saved Enabled/Disabled status, distinct customized block types (base selectors plus overrides), and override count. Customize styles opens a Radix dialog with a fixed header/toolbar/footer, maximum width 1280 px, and height 90dvh (94dvh below 480 px). The dialog's available inline size controls its layout: grouped navigation/editor/preview at 1000 px and above; AppSelect plus editor/preview at 760–999 px; AppSelect and Editor/Preview tabs below 760 px. Content scrolls inside the workspace rather than moving Apply below the sample document.

Selecting a block opens its focused representative preview; Base stylesheet defaults to Full document. Both modes remain available, and switching resets preview scroll. Selector copy, override status, empty-state examples, Clear override, Import, Export, Reset theme, and a collapsed CSS reference replace the earlier dense form. Custom styles stays a draft enable switch until Apply.

One CodeMirror view retains separate EditorState, cursor/selection, undo history, and scroll position per source. Theme compartments adapt syntax colors to resolved Light/Dark without recreating the editor. @codemirror/lint displays errors supplied by our CSSTree/policy validator; @lezer/highlight is a direct dependency for syntax tags. Validation returns source/message/character ranges, gathers the first error per source, and marks navigation items. A source-linked error button selects that editor and jumps to the invalid range. Combined size limits are checked before parsing.

Draft validation settles after 150 ms of inactivity. Invalid drafts preserve the last valid preview, labelled Showing last valid styles; invalid saved settings initialize to default appearance. Disabled drafts show Custom styles disabled. Apply and Export validate the immediate current snapshot. Apply is disabled while unchanged, busy, or invalid and enabled. Export always requires valid CSS. Disabling an invalid theme remains possible for recovery.

Apply freezes draft mutation, saves via the existing endpoint, updates the baseline, notifies open documents after success, and closes. Save/validation failures preserve the draft and appear next to the visible action bar. Cancel, Escape, and Close request Keep editing/Discard changes when dirty; closing restores focus to Customize styles. A failed import preserves the draft; a valid import clears overrides and explains that in its notice. Resets remain unsaved until Apply. No database migration, content schema, endpoint, selector, or CSS export format changes accompany this redesign.

Current manual acceptance is recorded in `../reports/05-editor-styles-redesign.md`.
