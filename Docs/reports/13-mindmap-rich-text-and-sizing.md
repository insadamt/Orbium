# Mind Map text sizing, formatting and shared block style — 2026-10-26

## Request and result

The user requested automatic height for topic text, Document-like text editing/toolbar behavior, and the approved Mind Map block style on other blocks. This is a review extension within the current Mind Map phase.

Topic labels now grow and shrink with their complete rendered content. They use the existing Tiptap text marks and shared native text-formatting controls rather than a plain textarea. Shared rich-card and media surfaces adopt the approved solid card frame and softer inset surface. Legacy Code, Math and Mermaid blocks also use the shared heading, icon/action treatment and inset content layout. Existing technical-block editing modes are retained; this request does not introduce new fullscreen source editors for every block or add frames to ordinary paragraphs/list items.

## Topic sizing and editing

- Removed the two-line clamp and fixed topic height. Each placed topic carries its own height. A ResizeObserver measures the unscaled natural content box, batches changes and publishes only changed heights. Initial text-based estimates are replaced by actual measurements, including styled text and line breaks. Deleted topic measurements are pruned.
- Tree spacing and connection endpoints use topic heights, including tall roots/parents, so expanded labels reserve their own space. Collapse controls follow the vertical middle. Selection reveal uses the actual topic height. The embedded preview responds to the measured tree; the established Document preview viewport still caps at 440 pixels and Board viewport dimensions remain independent of topic size.
- One active topic mounts a small Tiptap editor. Labels support bold, italic, underline, strike, inline code, safe ordinary links and existing preset/custom text colors. Typing shortcuts and selection semantics come from the existing text extensions. Old plain labels are inserted as literal text, never parsed as HTML or Markdown.
- The selection toolbar reuses the native text controls, the existing color/link pickers and toolbar highlight/motion behavior. It appears after pointer selection completes and sits outside the scaled scene. Its position follows selection, scrolling and toolbar size; controls wrap in narrow dialogs.
- Tab adds a child; Enter adds a sibling (a child for the root); Shift+Enter adds a line break. Escape/Finish editing leaves topic writing before exiting fullscreen. Formatting changes, paste/cut and typing preserve the owner's action/typing history distinction. Rejected limits/conflicts restore the last accepted label content.
- Canvas dragging excludes live text editors, links and portal controls, so selecting text or adjusting a formatting picker does not pan the map. Links inside selectable topic buttons render as formatted text; read-only previews can open validated links.

## Data and compatibility

Mind Map graph **version 2** adds optional topic `content`, using the existing validated inline text/hard-break/mark structure. The topic's required `text` remains the exact plain-text projection (`hardBreak` becomes a newline). Both client and server reject a mismatch. Existing graph version 1 remains readable without reinterpretation; opening/closing or viewing an old map does not rewrite it. An accepted topic text/formatting edit explicitly upgrades that map to version 2. Unedited topics may remain plain labels inside a version-2 map.

The existing 500-Unicode-code-point label, 64-parent-link depth and 64 KiB serialized graph limits remain. Rich text consumes part of that graph byte budget. Unsupported graph versions, fields, marks, colors, links and malformed trees continue to fail validation. No mentions, attachment references or Node relationships are added. Safe link/color validation is shared with native text, and literal text still renders without executing markup.

Board spatial format remains 7 and native object content format remains 1; no database migration is required. Markdown Document format remains 2; legacy Document format remains 1. Deploy the matching frontend/server code and reload open editors. Older clients that only understand version-1 maps cannot edit version-2 graphs safely.

Current legacy full saves advertise `editor_features: {mindmap: 2}`. The server requires capability at least as high as the largest Mind Map graph version already stored in that Document. This keeps an older version-1-capable legacy client from dropping a formatted map. Version-1 Documents continue to accept version-1-capable clients. Current clients can intentionally delete a map using the normal save path.

Search, statistics, plain Markdown and Word/PDF outline exports continue to use the validated plain `text` projection, including collapsed labels. Formatting-preserving `.orbie` export retains the versioned graph and inline formatting. Plain/office outline exports intentionally lose topic mark styling; they do not become graphical map exports. Archive envelopes and owner save/conflict/recovery services are unchanged.

## Shared block styling

- Shared rich cards now use the same solid `card` surface, 18-pixel outer radius, border, 10-pixel content inset and 11-pixel inner radius as the Mind Map preview.
- Code/Math/Mermaid rich content and source surfaces use the softer 45% muted/background mix. Existing media cards also use the solid outer surface.
- Markdown and native Board technical blocks already use the shared heading/actions and inherit the shared presentation. Legacy Code/Math/Mermaid were aligned explicitly, preserving language/copy, edit/preview, deferred rendering and Mermaid fullscreen controls.
- Existing Document paragraphs, lists, table structure and media playback behavior are retained. This is shared visual consistency, not a replacement of those editors or their saved data.

## Checks

Final checks passed:

- Targeted `vp check --fix`: formatting completed; no warnings/errors in 25 source files. The final focused inline-validation formatting/lint pass also passed.
- `npm run types:check`: passed.
- `npm run lint`: passed; 750 files correctly formatted and 634 source files checked without warnings/errors.
- `npm run build`: passed; 5,573 modules transformed in 15.52 seconds. Existing large-chunk, mixed static/dynamic import and plugin-timing warnings remain. Log: `/tmp/orbium-mindmap-rich-build.log`.
- `./vendor/bin/pint --test`: PHP formatting check passed.
- `php -l`: passed for `MindMapData.php`, `EditorContentInspector.php` and `DocumentController.php`.
- `git diff --check`: passed.
- Main canvas: 379 lines; topic editor: 178; text toolbar: 120; scene: 211; extracted shared inline validator: 62. Changed/new source files remain under 500 lines.

No automated tests, Playwright, browser automation or browser acceptance checks were run. Manual acceptance is pending. Markdown documentation is excluded by the repository formatter configuration.

## Exact manual checklist

Reload the app after deploying matching frontend/server code. Use disposable Board and Markdown Documents, plus a legacy Document/hosted Document card when available. Wait for Saved before ordinary reloads.

1. **Growth/shrink:** edit a topic and type several wrapped lines, including Shift+Enter line breaks and a long unbroken word. Expected: the topic grows to show all text, surrounding branches move apart and connectors meet vertical centers. Remove the text: it shrinks back without a stale large gap. Repeat for the root, a parent with children and topics on both sides. No two-line truncation or inner topic scrollbar should remain.
2. **Formatting selection:** double-click a topic, select part of its text and release the pointer. Expected: Document-style formatting controls appear near the selection, without panning the canvas. Apply bold, italic, underline, strike and inline code to separate ranges; type with Ctrl/Cmd+B/I/U. Expected: only the selected/intended range changes, selection stays usable, height follows wrapping, and formatting appears in the embedded preview after Done.
3. **Color and links:** select text and choose a preset/custom color, then reset it. Add, change and remove an ordinary safe link using the shared picker/Ctrl/Cmd+K. Expected: picker surfaces appear above fullscreen, keep the intended text range and preserve accepted changes. Adjusting a spectrum must not pan the map. Unsafe script/page/file protocols are rejected; labels never create page mentions. In edit selection mode, link styling must not nest an actionable link inside a topic button; full/read-only preview may open safe links.
4. **Keyboard/history:** create child/sibling topics using Tab/Enter; use Shift+Enter for a line break. Escape or Finish editing ends topic writing first. Repeat typing, formatting, paste, deletion and reparent actions with owner Undo/Redo. Expected: marks/text and topology restore together, no textarea-native history takes over, and surrounding Document/Board content is unchanged. Deleting/undoing creation of the active topic must leave a visible topic reachable.
5. **Persistence and ownership:** save a formatted map, close fullscreen, reload and reopen it. Repeat inside a native Board, normal Markdown Document and hosted/legacy Document when available. Expected: text, ranges, colors, links, line breaks, ancestry and collapse state survive. Duplicating/reordering a map preserves its formatting and copies remain independent. Owner save status still reports real Unsaved/Saving/Saved/error states.
6. **Old maps and plain text:** open an existing version-1 map containing literal `**stars**`, `<script>`, backticks or `@name`. Expected: literal labels, no execution, mention creation or automatic mark parsing on load. Opening/closing leaves version 1 intact; an accepted edit upgrades to version 2 without changing untouched labels/IDs. Empty labels remain valid. Arabic/emoji retain their text and wrapping.
7. **Composition/conflict/recovery:** use IME inside a formatted topic, then go offline or create a stale-revision conflict on disposable data. Expected: original owner composition/save guards still apply, rejected changes do not remain only in the small text editor, and the existing conflict/draft recovery controls retain accepted local graph content. Done does not falsely mark pending changes Saved.
8. **Validation, via copied DevTools save requests:** separately try graph version 3; topic `content` inside version 1; unknown node/mark/attribute; mismatched plain `text`; unsafe link/color; over-500-code-point label; graph over 64 KiB; cycle or excess depth. Expected: 422/validation failure, unchanged stored revision and no partial mutation. A hard-break node with extra keys is invalid. Use only disposable data.
9. **Legacy compatibility:** copy a successful legacy save of a stored version-2 map and lower `editor_features.mindmap` to 1 (or omit it). Expected: rejection with a reload message and unchanged stored graph/revision. Capability 2 accepts the same valid save. A version-1-capable client remains allowed for a stored version-1 map. Do not downgrade real deployed clients to manufacture this check.
10. **Export:** export/import a formatted map through formatting-preserving `.orbie`. Expected: formatting, label text and tree survive. Plain Markdown/Word/PDF outline exports include complete plain labels, including collapsed branches, and intentionally omit inline mark styling. Original interactive maps stay unchanged.
11. **Other block styling:** place Mind Map beside Code, Math, Mermaid, file/media cards in a Markdown Document and native Board. Check a legacy Document if available. Expected: consistent solid frames, inset surfaces, icon/action sizing and light/dark appearance. Verify Code language/copy/editing, Math source/preview, Mermaid source/preview/fullscreen, and media playback still work. Normal writing/list/table layouts should remain usable.
12. **Responsive/reduced motion:** repeat text selection, formatting pickers, growth and Fit at different map zoom levels, in a narrow split pane and with reduced motion. Expected: complete topic text, reachable wrapping toolbar controls, unscaled popup UI, scrollable map and no repeated toolbar entrance animation while merely typing. Runtime performance remains a manual observation.

## Limits and commit suggestions

Browser sizing, toolbar positioning, touch selection, IME, paste, rich-text persistence and export acceptance remain unverified until manual review. Inline text formatting is supported; arbitrary nested document blocks inside a topic are not introduced. Viewport sizing/scrolling remain transient where previously documented. No runtime performance or thermal improvement is claimed.

No commit was created; earlier uncommitted work was preserved.

- `feat(mindmap): add rich topic text and automatic height`
- `style(editor): unify rich blocks with mindmap presentation`
