> The 2026-10-13 approved CodeMirror document transfer extension is specified in [18-document-transfer.md](18-document-transfer.md). Its `.orbie`, clean Markdown, package, and replacement-confirmation behavior supersedes the earlier single-file transfer description below for format-2 documents. Legacy format-1 editor behavior remains unchanged.

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

The document image menu opens pickers for PNG, JPEG, GIF, or WebP icons and covers. A selected icon overlaps the cover edge by half its height for every cover ratio. A rounded cutout in the cover leaves a transparent gap around the icon. For narrow centered covers, the icon shifts horizontally to stay on the cover's edge. Existing text icons remain visible until replaced or removed.

Icons that do not match 512×512 open a crop dialog. Every new cover opens the crop dialog with 16:9, 5:2, 9:16, 3:2, 4:3, 1:1, and 4:5 choices. The user can change ratio, position and zoom the crop, or cancel without changing the current image. Opened pages show the entire saved crop centered with a height limit; covers saved before this feature retain their wide banner layout.

The seven cover ratio buttons occupy one row on wider screens and two rows (four then three) on smaller screens. Documents, folders, and databases share these crop controls and the transparent icon cutout treatment.

No permanent formatting toolbar.

Each visible document has a small outline rail inside its document layout, at
the right edge of the document surface below the navbar. A reserved gutter keeps
it beside the content in both single-document and split views. It stays accessible while scrolling; non-document pages have
no rail. The rail and panel include every H1 and H2, with no sampling or heading
count limit. Two mark lengths distinguish the levels; the current reading section
is highlighted. Long rails show a portion of the outline in a container capped at 180px
(or the available height in a short viewport) and smoothly follow the current section when its mark reaches the visible edge.
Manual wheel/touch scrolling over the rail stays inside it. Resizing keeps the
current mark visible, and reduced motion makes automatic rail scrolling immediate.

Hovering or focusing the rail opens a compact floating outline beside it.
Clicking or tapping pins it open. Pointer departure collapses an unpinned preview
after a short grace period; keyboard focus keeps it reachable. Each panel has a
document title, Pin/Unpin and Close buttons. Hierarchy uses indentation and text
weight without H1/H2/H3 aliases. Long labels wrap and the list scrolls independently.
Documents remain mounted, readable and editable while panels are open.

Selecting a heading smoothly scrolls its own document to that section and closes
an unpinned preview. A pinned panel remains open when clicking outside, editing
the document or selecting headings. Close or Escape dismisses it; outside clicks
dismiss only an unpinned preview. Unpin restores the normal preview behavior.
Tab, arrows, Home/End and Enter support keyboard
navigation. Rail marks gently expand and fade between interaction/reading states.
The panel fades and slides from the rail on both opening and closing; quick
direction changes reverse the transition smoothly. Closed panels are inert and
hidden from assistive technology. Reduced motion disables these transitions and
makes heading navigation immediate. Wheel, touch, pointer or scrolling-key input
interrupts automated scrolling.

Split panes have independent rails and panels: opening one does not open the other
or change its scroll position. Panels fit their pane below the navbar without
blocking the editor or replacing the document. Same-origin iframe-backed document
panes keep their rail attached to the embedded document within the parent pane
and scroll that pane when
navigating to a heading.

Both JSON/Tiptap and Markdown/CodeMirror documents support Contents. Markdown
outlines read the full source for visible documents, including headings outside the
rendered viewport and inside editable presentation wrappers. Literal code,
math and other non-editable directive bodies are excluded. H3–H6 remain in
Markdown content but are omitted from this two-level outline. Extraction is
cached against the current document snapshot; updates are debounced by 150 ms
while the document is visible. Scroll updates reuse the cached headings; hidden
tabs do not scan outlines. Hidden tabs cancel pending animation work and preserve
document content and selection.

The editor is the final area on document pages, with a 16px outer bottom margin
and 16px of padding inside the island. A short document island grows to fill
the remaining viewport height; longer documents scroll naturally and finish
16px above the screen's bottom edge. The retained workspace and visible tab
pass the remaining height to the island. The shortcut hint is not rendered
below it. Empty writing space within the editor remains available.
CodeMirror root height rules target `.cm-editor` explicitly because the external
tooltip host shares theme classes and must not reserve editor-sized space.

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

### Per-divider appearance (approved 2026-10-08)

In the Markdown editor, double-click a rendered divider to open its dedicated floating
toolbar. Alt+Enter also opens it when the caret is in a divider. The toolbar includes a
compact row matching the text toolbar's padding, spacing, and button sizes, with a
native custom color picker, a theme-default color button, integer thicknesses from
1 to 12 CSS pixels, and illustrated solid/dashed/dotted/double style buttons. The
row wraps on narrow screens. Every change updates the divider
immediately and enters the normal autosave queue. The toolbar remains open while
adjusting controls. Reset clears local overrides immediately. Escape, Close, and
clicking outside dismiss the toolbar; Undo reverses changes. There is no Apply button.
Appearance controls are absent from the block context menu. Divider markers are
excluded from text formatting, preventing inline color from replacing a rule. Reset removes
all three local overrides; default choices leave each property unset. Double borders
need at least 3 px to visibly separate the lines. Plain `---`, `***`, and `___` rules
retain their existing default appearance.

Canonical Markdown stores these optional fields in a `kind=block` directive wrapping
exactly one thematic break: `dividerColor` (lowercase six-digit hex),
`dividerThickness` (integer 1–12), and `dividerStyle` (solid/dashed/dotted/double).
PHP and TypeScript validate the same values and reject appearance fields on other
block types. Example:

```markdown
:::orbium {"kind":"block","dividerColor":"#75a1ff","dividerThickness":3,"dividerStyle":"dashed"}
---
:::
```

Autosave, Markdown source/export, duplicate, and move preserve these fields.
This additive dialect extension needs no database migration. Older application
versions reject these newly supported fields rather than silently dropping them.
The retained legacy Tiptap editor does not expose these per-divider controls.


Editor text and divider toolbars use CodeMirror's body-mounted tooltip container so
ancestor document glass surfaces do not limit their backdrop blur. The toolbar and
text-color picker share the same raised frosted surface in frosted mode; normal mode
uses a solid card surface. Unsupported backdrop filters and reduced-transparency
preferences retain the existing more-opaque surface fallback. Toolbar focus remains
tracked when text color controls are outside the editor DOM.

### CodeMirror block drag and drop (2026-10-09)

The Markdown editor grip uses pointer capture with an Orbium block controller.
A fixed insertion line targets complete top-level source blocks. Edge dragging
and mouse-wheel/trackpad input scroll the enclosing document pane; wheel deltas
retain their pixel, line or page units. Pointer drops retain the scroll offsets
reached during the drag in both directions. The insertion line controls block
order. The previous policy of anchoring the preceding block was removed during
motion review because deleting content above that anchor compensated downward
moves differently from upward moves. Scroll limits can constrain restoration.
Drops do not focus the editor or select/reveal the moved block. The moved block's
top is kept visible with a small pane-edge inset when it would otherwise be
clipped; a block that is already visible causes no additional scrolling. This runs again
after the layout frame. Keyboard/menu moves retain their caret and scroll
behavior. A source change
cancels a pending drag; drops on another document do not move content. Existing
block-menu and Alt+Shift+Up/Down movement remain available. Nested reparenting and
multi-block selection dragging are not implemented. Touch behavior is not yet
manually verified. Manual acceptance is tracked in
`../reports/06-codemirror-block-drag-drop.md`.

### Block deletion and reorder motion (2026-10-12)

The Markdown block menu deletes the complete block and its surrounding blank
separator lines, leaving one normal Markdown separator between surviving blocks.
Deleting the first or last block removes its outer separators; deleting the only
block leaves an editable empty document. Explicit empty-block directives remain
independent blocks. Deletion is one undoable autosave transaction.

Deletion shrinks and fades the outgoing block for 80 ms, then nearby blocks slide
into the new layout for 140 ms. Pointer drops, menu moves and Alt+Shift+Up/Down use
the same consecutive sequence, followed by a 100 ms destination entrance without
bounce. GSAP stages the surviving live rows immediately after the edit, before
the next paint, then slides them into place. The editor container is never hidden
or faded. Only the moved block is temporarily transparent until its entrance;
unchanged blocks remain visible. One inert outgoing-block snapshot uses a fixed
screen position clipped to the originating pane, so drop compensation cannot
carry the outgoing pop downward. The outgoing/destination pop scales between 100% and
65% around the center of visible text/media, rather than the full-width row box.
The entrance explicitly clears horizontal and vertical translation; only surrounding blocks
translate up/down. The outgoing snapshot retains the editor theme and interface
scale. Completion or interruption restores original row styles and requests a
fresh CodeMirror measurement.
No persistent block identifiers or new
content format are required. Source edits, selection changes, pointer interaction,
actual scroll offset changes during animation, resize, editor destruction and reduced-motion changes
release temporary visuals. Reduced motion applies edits immediately without
snapshots or animation. Manual acceptance is tracked in
`../reports/06-block-deletion-reorder-motion.md`.

The animation records scroll offsets after drop restoration. Queued scroll events
with unchanged offsets do not cancel playback; actual scrolling still cancels it.
