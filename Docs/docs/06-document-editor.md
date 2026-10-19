> The 2026-10-13 approved CodeMirror document transfer extension is specified in [18-document-transfer.md](18-document-transfer.md). Its `.orbie`, clean Markdown, package, and replacement-confirmation behavior supersedes the earlier single-file transfer description below for format-2 documents. Legacy format-1 editor behavior remains unchanged.

# Document editor specification

## Product rule

> Markdown speed + Notion interaction + Orbium minimalism.

The Orbit is where Orbium may be visually expressive. The editor should get out of the user's way.

## Layout

The document page uses the shared floating top controls. The title, cover/icon, database properties, and editor sit inside one spacious floating island. Back remains in the top controls. Search expands there into a document-local finder with a match count and Enter/Shift+Enter navigation.


Typical document:

```text
breadcrumbs / tabs

page icon       proportional cover

Document Title

Body...
```

Every document, folder and database page shows a neutral default 11:3 cover and a type-specific icon when no custom media is set. When the displayed cover fills the available width, the icon overlaps its edge by half its height, with a rounded transparent cutout around it. When the cover is narrower, the icon sits with the title below it without overlap or a cutout. Each cover and icon reveals its own Edit button on hover or keyboard focus; touch devices keep these controls visible. Edit offers Change cover/icon and, for custom media, Reset to default. These controls replace the three-dot image menu and open PNG, JPEG, GIF or WebP pickers. Reset clears the custom media reference and restores the default appearance. Existing text icons remain visible until replaced or reset.

Icons that do not match 512×512 open a crop dialog. Every new cover opens the crop dialog with 11:3 (the default), 16:9, 5:2, 9:16, 3:2, 4:3, 1:1, and 4:5 choices. The user can change ratio, position and zoom the crop, or cancel without changing the current image. Document, folder, and database page headers preserve cover proportions within the available width and a height limit of min(320px, 35% of the viewport height). Embedded panes use the host viewport height. Covers align with the left edge of the content below, with no added side background, stretching, or additional cropping. Document header layouts use the same 780px maximum width as properties and editor content; folder headers align with the item area, and database headers align with the table/gallery. The loaded image dimensions determine the displayed ratio, including Library images and older covers without reliable metadata; saved crop ratios reserve space while loading, otherwise 11:3 is the provisional fallback. The default image retains its own 11:3 ratio. Missing cover images fall back to the default cover. Saved crop ratios remain available to Gallery previews.

Page headers now adapt to the cover shape on documents, folders, and databases. At a header width of at least 600px, portrait covers (ratio below 1) and compact covers (ratio from 1 up to, but excluding, 2) appear on the left with the icon above the title, vertically centered beside them. Long titles wrap in an auto-sizing editable field; Enter or leaving the field saves the title. Document properties stay in their existing collapsible section below the complete cover/title header and above the editor, at normal document width. Portrait covers have a maximum width of 220px; compact covers have a maximum width of 320px. Wide covers (ratio at least 2), the default cover, and narrower containers use the stacked header. Document editors and container contents stay below the complete header at their normal content width.

The eight cover ratio buttons occupy one row on wider screens and two rows of four on smaller screens. Documents, folders, and databases share these crop controls and the adaptive cover/icon layout.

Split header correction (2026-10-17): overlapping icon positions and cover cutouts are calculated in layout coordinates, independently of tab and split animation transforms. Entering or ending a split must keep the cutout aligned with its icon without an extra notch on the opposite cover edge. See [the report and manual checklist](../reports/05-split-cover-icon-alignment.md).

No permanent formatting toolbar. The document actions menu offers Import, Export and Source/Live Preview; it omits Document outline, Find in document and Add file. Outline navigation remains on the rail, and existing find shortcuts and attachment insertion flows remain available.

Each visible document has a small outline rail aligned with its document layout, at
the right edge of the document surface below the navbar. A reserved gutter keeps
it beside the content in both single-document and split views. The rail is fixed at the browser viewport's vertical midpoint using CSS, so document scrolling never recalculates its vertical position. Its host is portaled to the outer document body, including for same-origin iframe panes, to avoid ancestor clipping and scrolling with the iframe. Its horizontal position follows its document's right edge. It stays accessible while scrolling; non-document pages have
no rail. Documents without H1/H2 headings also have no rail or panel; adding a heading restores the rail and removing the last one hides it. The rail and panel include every H1 and H2, with no sampling or heading
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
Video
Audio
PDF
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

In split screen, dragging a Markdown Live Preview block by its grip into another
Markdown Live Preview page in the same workspace moves the complete top-level
block to the displayed insertion line. This includes nested list contents,
presentation metadata, attachments and mentions. Wheel and edge scrolling follow
the destination pane. An empty destination accepts the block. Source mode,
legacy JSON pages, other workspaces and a second view of the same page are not
cross-page destinations. Escape or releasing outside a valid destination cancels.

Split interaction correction (2026-10-18): visible Markdown split panes stay editable independently of which pane owns shortcuts. This allows a block to move directly into the companion pane without selecting it first and keeps both endpoints available for linked undo/redo. Hovering a document surface selects its pane without a click. Hover activation waits while pointer buttons are held so it cannot cancel a drag, and a successful transfer focuses the destination. See [the report and manual checklist](../reports/05-split-hover-activation-and-block-transfer.md).

Cross-page moves use the same block motion as in-page moves: the source block
shrinks/fades out, neighboring blocks slide into their new positions in both
pages, and the inserted block scales/fades in. Reduced motion applies both edits
immediately without animation.

Block history motion correction (2026-10-18): undo and redo of block moves replay the same outgoing pop, neighboring-block slide, and incoming pop as the original move, including linked moves between split documents. Undoing a block deletion pops the block back in; redoing it pops it out. Exact before/after block ranges travel with the session history rather than being guessed from matching text. Outgoing media snapshots are captured before linked history adopts a player into the other page. Ordinary typing undo keeps its existing behavior, and reduced motion remains immediate. See [the report and manual checklist](../reports/05-block-undo-redo-motion.md).

History reveal refinement (2026-10-18): linked undo/redo first reveals the outgoing block and the corresponding restoration position in their own panes, then rechecks both histories before applying the paired change. Each history transaction also reveals the restored block or removal site, overriding an unrelated old caret position. Animation waits for CodeMirror's scroll/layout measurement to settle; neighboring-row motion excludes reveal scrolling, and outgoing snapshots keep their captured screen position. Rapid history requests queue in order while reveal is pending. Changes or closed/hidden editors abort stale requests safely. See [the refinement report and manual checklist](../reports/05-block-history-reveal-refinement.md).

Moving already-rendered Mermaid and math blocks carries their prepared previews
to the destination editor before insertion, including inline math. The move must
not replace a prepared preview with a fresh rendering/loading placeholder.
Attachment metadata is reused for moved media. Loaded PDF/video/audio players
move to the destination without reconstructing their readers, retaining PDF
page/zoom/rotation and playback time/volume. This also applies to media inside
callouts and table cells, with separate state for repeated references. PDF resize
renders keep the previous page canvas visible until the new raster is ready.
Media sources use workspace Library URLs so their availability does not depend
on the original page remaining present. Page-owned editing controls are rebound.

Ctrl/Cmd+Z undoes a cross-page move in both mounted pages together; Ctrl+Y or
Ctrl/Cmd+Shift+Z redoes it. Ordinary newer edits in the focused page undo first.
If the other page has newer edits, is closed or is not editable, the move is
blocked with a notice instead of undoing only half. Both pages must remain open
in the same session for linked history; reloading resets editor history.
Autosaves remain independent: wait for both pages to show Saved before reloading.
The two page saves are not one server transaction. See
[the report and manual checklist](../reports/06-split-page-block-moves.md).

## Table border handles

Markdown Live Preview tables use subtle 8-by-1-pixel marks integrated into the top border of each column and the leading border of each row, with 4-pixel breaks on either side (`----- - -----`), with transparent hit areas and no visible button background. Handles appear on table hover, keyboard focus, and touch devices. Drag a column handle left/right or a row handle up/down to reorder complete columns or rows. The actual cells follow the pointer along that axis within the table bounds, leaving their original space empty while neighboring cells slide aside to open the destination gap. On release, the cells settle into the gap before the source edit commits. Menu move actions use the same movement. Escape cancels it. Reduced motion retains direct pointer feedback and applies positions immediately without settling tweens. Clicking a handle opens its options in place of the former column three-dot button.

Column options include ascending/descending sorting, Move left/right, and Delete column. Row options include Insert above/below, Move up/down, and Delete row. Boundary move actions and deleting the final row or column are disabled. Tables with merged cells and read-only documents disable structural actions. Markdown tables keep their first row as the header after row changes; rich tables retain explicit header metadata. Changes use normal undo/redo and autosave. Newly inserted rows preserve column widths and alignment.

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

The approved 2026-10-16 extension adds Video, Audio, and PDF commands to the Markdown editor, with inline viewers and type-restricted Library reuse. See [23-media-blocks.md](23-media-blocks.md) for playback, supported types, transfer compatibility, and browser limitations.

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

Properties are inline-editable and collapsed by default when the document opens. The Properties toggle animates the section height and opacity while rotating its chevron; saving a property keeps the current expanded state. Collapsing immediately removes fields from keyboard and assistive-technology navigation, then unmounts them after the animation. OS reduced motion switches states immediately.

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

In CodeMirror live preview, explicit direction and alignment apply to the rendered
text lines as well as their presentation wrapper. Empty paragraph inputs update
their presentation when a block menu choice changes. Block and table context
menus keep the interface's left-to-right layout independently of block direction.
Find keeps rich block previews visible and highlights the selected matching block.
Decoration updates cover edited enclosing blocks, including edits away from the
main cursor; direction inference is cached against both source and parse tree.

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
shared text-style color menu (spectrum, hue, HEX field, presets, and theme-default
color), integer thicknesses from
1 to 12 CSS pixels, and illustrated solid/dashed/dotted/double style buttons. The
row wraps on narrow screens and shares the text toolbar's positioned reveal and
moving hover highlight. Arrow Left/Right and Home/End move between toolbar controls;
menus retain their own keyboard handling. Preset colors save as concrete hex values.
Every change updates the divider
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
retain their pixel, line or page units. Dragging within 96 CSS pixels of the
visible pane's top or bottom starts automatic scrolling (the band shrinks to a
quarter of the pane height in short panes). Speed increases toward the edge,
from 80 up to 1,400 CSS pixels per second. Holding beyond the vertical pane edge
keeps maximum speed. Edge scrolling does not require a block drop target under
the pointer; horizontal bounds keep it inside the originating document surface
and its clipping ancestors, including the grip gutter. Moving back to the center,
outside those horizontal bounds, or ending/canceling the drag stops it.
While the pointer remains in an edge band, the scroll loop retries even if a
frame produces no movement. Same-origin embedded documents include their host
pane's clipping bounds and scrollbar. Captured pointer coordinates are mapped
through the moving iframe so holding still continues to track the same screen
position. Host-pane limits do not spill into scrolling the outer workspace.
Pointer drops retain the scroll offsets
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
bounce. Rich decorations are refreshed before staging motion. Complete rendered
rows are identified by their CodeMirror DOM positions, including paragraphs with
inline math. The destination block pops as one grouped snapshot; neighboring
row snapshots slide into place while live row geometry stays untransformed.
A temporary pane-scoped stylesheet masks participating rows without changing
CodeMirror-owned row attributes. Reasserting an unchanged selection does not
cancel playback; actual selection changes still do. The editor container is never hidden
or faded. Only the moved block is temporarily transparent until its entrance;
unchanged blocks remain visible. One inert outgoing-block snapshot uses a fixed
screen position clipped to the originating pane. Its fixed positioning uses an
inline important declaration to override CodeMirror's copied base-theme rule
(`position: relative !important`), keeping snapshots out of document flow.
Drop compensation therefore cannot
carry the outgoing pop downward. Outgoing/destination pops scale proportionally
between 100% and 90% with opacity, preserving block proportions. Framed rich
blocks use their complete visible surface as the origin; images use their figure,
and text-only blocks use visible text/media. Hidden metadata, style text, source
textareas, and KaTeX's hidden MathML are excluded. Both pops explicitly clear
horizontal and vertical translation; only surrounding blocks translate up/down. The outgoing snapshot retains the editor theme and interface
scale. Snapshot SVG IDs, embedded CSS ID selectors, and CSS fragment URLs are
remapped together, preserving Mermaid typography, colors, and geometry while
blocks move. CSS color values remain unchanged. Only participating live rows are transparent beneath their snapshots;
stationary content remains visible. Completion or interruption restores original row styles and requests a
fresh CodeMirror measurement.
No persistent block identifiers or new
content format are required. Source edits, selection changes, pointer interaction,
actual scroll offset changes during animation, resize, editor destruction and reduced-motion changes
release temporary visuals. Reduced motion applies edits immediately without
snapshots or animation. Manual acceptance is tracked in
`../reports/06-block-deletion-reorder-motion.md`.

The animation records scroll offsets after drop restoration. Queued scroll events
with unchanged offsets do not cancel playback; actual scrolling still cancels it.


## Workspace Library reuse (2026-10-13)

Image/file insertion now offers existing workspace uploads or a new upload. Cover/icon Edit menus add Choose from Library alongside the existing Change upload/crop action. References reuse the attachment ID; removing one use leaves the Library file intact. See `docs/19-library.md` for lifecycle and limits.

## Alignment motion review (2026-10-15)

Changing supported text-block or image alignment moves the visible content from
its previous horizontal position to the final left, center or right position over
260 ms. The command updates the document immediately; motion adds no persisted
state. Text content, image size, captions and autosave retain their existing
behavior. Editing, pointer input or wheel scrolling interrupts the visual
transition. OS reduced motion skips it. This applies to Markdown and legacy JSON
editors. Existing restrictions on which block types expose alignment remain.


## Rich block card appearance (2026-10-16 review)

Mermaid, display math, and fenced code blocks share the media cards’ rounded theme-aware surface, compact icon/identity header, and muted inset content area. Mermaid and display math use labelled icon actions for editing source and returning to preview; Mermaid retains its full-preview action. Code keeps the language selector, language icon, animated copy button, and directly editable highlighted source, without a Code block subtitle. Rich source editors have 16px internal padding. Document tables have 12px outer corners and matching rounded corner-cell backgrounds while keeping row/column handles accessible. Inline math stays within the text flow. Source formats, undo/redo, autosave, diagnostics, and read-only rules are unchanged. See `../reports/06-expanded-media-and-rich-block-cards.md` for manual acceptance steps.


### Block handle and reorder consistency repair (2026-10-16)

Block grips use complete top-level layout bounds for rich and text blocks.
Their vertical anchor is the earliest visible content row, accounting for padding
and borders. Nested source toolbars and tall first table rows cannot pull the grip
toward the middle or bottom of the block. See
`../reports/06-block-motion-and-top-handles.md` for manual acceptance steps.


### Math preview reuse during block movement (2026-10-16)

Markdown math previews reuse prepared KaTeX markup by formula and display/inline
mode within each editor context. A cache hit is applied immediately when a widget
remounts during reorder, avoiding a return to “Rendering equation…”. New formulas
retain idle rendering; nested rich-body equations use the same prepared previews.
The cache holds at most 128 results per editor, including errors; older entries
can render again after eviction. Existing KaTeX trust, expansion, and size limits
are unchanged. Manual acceptance is tracked in
`../reports/06-math-block-motion-preview-reuse.md`.


### Preserve rich widgets during block reorders (2026-10-16)

Pointer, menu, and keyboard block moves retain already mounted rich-widget roots
and controllers for the synchronous reorder and motion-staging update. Retention
matches the original source, widget kind, editor context, and mapped destination,
so repeated attachment references retain independent player/reader state. Move
annotations map rich-block content ranges and source-editor positions to the
inserted source rather than the deletion boundary. Unclaimed removed widgets are
released after the update; ordinary deletion and editor teardown still dispose
controllers. Offscreen widgets keep the existing virtualization lifecycle.

Animation snapshots copy PDF canvas pixels and capture a loaded video's current
frame without loading or playing another media element. Browser-paused media
that was playing before DOM relocation is resumed when still connected. Paused
media stays paused. See `../reports/06-rich-block-move-state.md` for manual checks.

### Code language selector and logo clarity (2026-10-16)

Code headers offer 106 language/format choices with readable names, including
C++, C#, Objective-C, and Visual Basic .NET. The choices use Lowlight common grammars plus selected Highlight.js grammars
through a shared highlighter factory for Markdown and legacy JSON editors.
Highlight.js is an explicit dependency at the already installed version; no
content format changes are needed.
Aliases such as `kt`, `rb`, `rs`, and `md` resolve to their language
in the selector. Unknown language tags remain selectable and preserved.
Both Markdown and legacy JSON code headers render 24px SVG logos;
Markdown headers use foreground contrast within the existing 40px icon badge.
C#, Java, and Visual Basic use pinned Devicon language assets.
Other matching logos use Simple Icons; SQL, Diff, and Makefile use neutral
format symbols rather than PostgreSQL, Git, or GNU logos. Plain text, INI,
and unknown tags use a consistent vector code symbol.
See `../reports/06-code-language-options-and-logos.md` for manual acceptance.


The additional selector options are Clojure, CMake, Dart, Dockerfile, Elixir,
Erlang, Fortran, F#, Groovy, Haskell, Julia, Lisp, MATLAB, Nginx configuration,
OCaml, PowerShell, Scala, Scheme, and TOML. Matching Simple Icons marks are used
where available. PowerShell uses a neutral terminal symbol. TOML uses the existing INI/TOML grammar.


### Language dropdown icons (2026-10-16 review)

Both editors show matching 24px icons in language dropdown rows and code headers.
The reviewed Simple Icons and Devicon logos are retained, including the original
Rust, Perl, PHP, XML, Go, Lua, Less and Objective-C artwork. Abbreviation badges
were removed at the user's request. Neutral symbols remain for formats without
matching logos. Decorative menu icons do not alter accessible names or keyboard
typeahead; typeahead uses the full language name. Unknown tags keep a neutral
code icon. Text-only selects elsewhere retain their existing appearance.
See `../reports/06-code-language-picker-icons.md` for validation and manual checks.

The code language selector trigger uses a subtle focus background without a focus
ring, including after selecting an option. Keyboard focus and menu navigation
remain available. Other selects retain their existing focus styles.


### Searchable code language selector (2026-10-16)

The language picker now offers 65 choices, adding HTTP, Protocol Buffers, LaTeX,
Windows Batch, Apache configuration, x86 Assembly, ARM Assembly, Nix and Nim.
JSX and TSX are separate choices and preserve their fence tags, using the existing
JavaScript and TypeScript grammars. Existing `javascript` and `typescript` tags
keep their respective labels. Additional grammars are registered in both editors.

The dropdown search filters labels, canonical tags and aliases, ignoring case.
Examples: `bat`, `proto`, `tex`, `ps1`, `arm` and `react`. React matches JSX and TSX.
Opening the menu focuses search; arrow keys enter the results, Enter selects,
and Escape dismisses. Arrow Up from the first result returns to search. Typing
while a result is focused returns to search and adds to the query. No results
shows “No matches found.” Closing/reopening resets search. The search field stays
above an independently scrollable results list. Unknown language tags remain
selectable and searchable. Original logos, 24px sizing and the trigger's
border-free focus style remain. Neutral symbols identify generic formats without
matching logos. Other app selects remain text-only without search unless opted in.
See `../reports/06-searchable-code-languages.md` for manual validation.

### Additional code languages (2026-10-17)

The picker now offers 78 language/format choices. Added GLSL, Awk, Gradle,
Handlebars, Twig, Crystal, D, Haxe, Pascal, Delphi, Prolog, Verilog and VHDL.
Pascal and Delphi have separate labels using the same Delphi/Pascal grammar.
Highlighting is registered in the shared factory for both editors. Search and
fence normalization recognize aliases such as `frag`, `vert`, `gawk`, `hbs`,
`cr`, `hx`, `pas`, `dpr`, `sv` and `vhd`. The existing `pl` alias continues to
identify Perl; use `prolog` for Prolog.

Gradle, Handlebars, Crystal, D, Haxe and Delphi use matching Simple Icons marks.
GLSL, Awk, Twig, Verilog and VHDL use neutral shader, terminal, template and chip
symbols. Pascal and Prolog use the code fallback. Original logo artwork, 24px
sizing, search behavior and the border-free selector trigger remain.
See `../reports/06-additional-code-languages.md` for validation and manual checks.

### Automation and specialist code languages (2026-10-17)

The picker now offers 93 choices. Added AppleScript, AutoHotkey, AutoIt, Tcl, Ada,
CoffeeScript, Elm, QML, ReasonML, Smalltalk, Vala, SAS, Stata, AsciiDoc and Gherkin.
All 15 grammars are registered in the shared highlighter for both editors.
Names and aliases such as `osascript`, `ahk`, `au3`, `tk`, `coffee`, `qt`, `re`,
`st`, `ado`, `adoc` and `feature` work in search and fence normalization.

Ada, AutoHotkey, AutoIt, CoffeeScript, Elm, ReasonML and Vala use matching
Simple Icons marks. AppleScript, AsciiDoc, Gherkin, SAS and Stata use neutral
terminal, document, checklist and chart symbols. Tcl, QML and Smalltalk use the
code fallback. Existing original logos, 24px sizing, searchable selection and
border-free trigger focus styling remain. There are no dependency or format
changes. See `../reports/06-automation-and-specialist-code-languages.md` for
manual validation.

### Git and additional technical formats (2026-10-17)

The picker now offers 106 choices. Added Git commands, PostgreSQL / PL/pgSQL,
Vim Script, OpenSCAD, Processing, LLVM IR, VBScript, Stylus, XQuery, Thrift, Coq,
Java Properties and DNS zone files. Both editors share the 12 added grammars.
Git commands preserves the `git` fence tag and uses Bash highlighting via a
highlighter alias, with the Git logo. It describes shell commands, not commit
messages or interactive rebase files; patches still use Diff.

Search/fence aliases include `postgresql`, `plpgsql`, `vimscript`, `scad`, `pde`,
`ll`, `vbs`, `styl`, `xpath`, `xq`, `bind` and `zone`. PostgreSQL has its own logo;
generic SQL retains its neutral database symbol. Vim, OpenSCAD, LLVM and Stylus
use matching logos; the other additions use neutral symbols where no matching
logo is available. Search, original artwork, 24px sizing, border-free trigger
focus styling and unknown-tag preservation remain.
See `../reports/06-git-and-technical-code-formats.md` for manual acceptance.

### Block Edit/Preview motion (2026-10-17)

Switching the shared rich-block source controls between Edit and Preview reveals
its incoming panel with a 200 ms fade and short vertical movement. The mode,
focus, source transaction, and editor measurement update immediately. Repeated
selection of the current mode does not restart the animation. OS reduced motion
removes the reveal. This applies to blocks using the shared mode controls,
including Mermaid and display math; code remains directly editable.
See `../reports/06-block-mode-motion-and-pdf-space.md` for manual acceptance.


## Editing original Documents from Board cards

Boards phase 4 may mount this editor for the single active Document reference card. Its optional hosted session supplies autosave/recovery/guards while retaining the original Document identity, content format, revision, save endpoints, attachment ownership, mention indexing and Mermaid cache. Inactive cards show bounded previews without editor instances. Hosted sessions register local-only block transfer targets, hide the page outline and freeze on revision/content-format conflicts; normal Document pages keep their default editor session. Board-native text/code/table/media objects use their own schemas and controls. See `24-boards.md` and `../phases/12-boards-resource-cards.md`.
