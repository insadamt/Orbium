# Passive inline icons and mixed drag selection — 2026-10-28

## Findings and changes

The user explicitly requested removing every click-to-replace action from inserted icons and treating them like characters in the surrounding text. This supersedes the earlier double-click replacement design. Picker results and application toolbar buttons remain controls; inserted inline content does not.

The earlier shared native node and Markdown widget still installed double-click listeners that prevented default behavior, stopped propagation and opened the picker. Native glyphs also remained separate noneditable DOM leaves. Painting their selected background alone did not reliably carry a mouse drag across those leaves. Native completion menus used a diamond placeholder instead of the actual vector glyph, and nested Markdown inputs omitted the main editor's completion renderer.

- Removed the native/Markdown icon double-click handlers, replacement titles, intercepted events and unused widget editing flag. No inserted icon has its own click/key handler, button role or tab stop. Glyphs are explicitly nondraggable; pointer hit testing goes to the surrounding text surface. The accessible image label remains.
- The shared native icon selection plugin now tracks ordinary primary-button text drags. When a range crosses an inline icon, it updates one ProseMirror TextSelection across the words and whole glyph, rather than depending on native selection across a noneditable leaf. Plain-text-only gestures retain existing behavior. Shift anchors are retained; IME/read-only/control interactions are excluded, document changes cancel the gesture, and listeners are removed on teardown.
- Native/legacy completion entries carry the actual icon choice and render the shared glyph component, with readable labels and no diamond placeholders. Nested Markdown table/callout inputs now use the main completion menu icon renderer and menu styling too.

The native changes are shared by Board writing/list editors, Mind Map topic bodies and legacy Documents. Passive Markdown widgets/shared rich rendering cover Markdown Documents, hosted content and nested rich inputs. No content/schema/migration/dependency change. Existing insertion controls, marks, ownership, history and previous format-8 work remain.

To replace an inserted symbol, select it with the text-selection controls and insert the desired symbol through the existing toolbar/slash/colon flow, or delete/reinsert it. Clicking or double-clicking the glyph does not open a picker.

## Actual Browser verification

Used the authorized Browser plugin against local **Icon selection browser check — 2026-10-28**, Board 159. The browser connection recovered during this correction. Interactions used visible UI controls, pointer drags, typing and DOM observations; no hidden editor state or test-suite execution.

| Surface | Observed result |
| --- | --- |
| Native Board text | Forward and reverse drags selected `before [rocket] after` as one range; the icon acquired the selection decoration and the Text formatting toolbar was visible. |
| Drag starting on a glyph | After the final reload, dragging directly from the first rocket selected it, the following word and the second rocket in one range; no picker opened. |
| Native Board text color | Choosing Red applied `preset:red` to the complete mixed range. The rendered vector computed to `rgb(235, 36, 36)`. |
| Native Board icon interaction | Double-clicking the glyph opened zero icon pickers; role remained `img`, with no tabindex and a label-only title. |
| Native completion menu | `:rocket` showed the actual emoji, Lucide rocket and brand SVGs. DOM inspection confirmed real SVG paths in the vector/brand options. The selected vector result inserted normally. |
| Native `:icon` picker | Accepting Browse all icons opened the full icon picker with the emoji grid. Escape dismissed it; insertion remains available despite removing glyph click behavior. |
| Mind Map topic editing | Inserted a vector with `:rocket`; forward and reverse drags selected the complete words/icon range and revealed its formatting toolbar. |
| Mind Map text color | Choosing Blue marked the complete mixed range and the glyph computed to `rgb(117, 161, 255)`. |
| Mind Map icon interaction | Double-clicking the glyph opened zero icon pickers. |
| Save/reload | After Saved and a full reload, Board vectors retained Red and the Mind Map vector retained Blue. All remained image-labeled inline content without tab stops. |
| Document-style Board table cell | Entered the canonical inline-icon source through the visible cell editor. It rendered a passive rocket; a drag selected words and icon together. Double-click opened zero icon pickers. |

The table completion popup did not appear during the Browser typing attempt, so its new menu renderer is source/type/build checked but **not visually verified**. Table selection-color controls, every heading/list/legacy Document combination, custom images, touch/IME and theme/zoom combinations still require the checklist below. Do not describe this as exhaustive all-surface UI acceptance.

## Static checks

- Targeted formatting: passed.
- `npm run lint`: passed; all 861 files correctly formatted, no warnings/errors across 692 linted files.
- `npm run types:check`: passed.
- `npm run build`: passed in 21.49 seconds. Existing large-chunk, ineffective dynamic-import and plugin-timing warnings remain.
- `git diff --check`: passed.

No automated tests were added or run. The Browser interaction was explicitly authorized by the user. No PHP changes in this correction.

## Manual checklist

Fully reload so existing editor instances receive the revised node/plugin.

1. In Board Text/H1–H3/Quote/Callout and every list style, create `before [icon] after`. Drag both directions across it, start/end beside the icon, and extend with Shift+Arrow. Expected: one range includes the complete symbol and adjacent words; the toolbar appears after release.
2. Click/double-click each symbol and navigate with the keyboard. Expected: no icon picker, separate button focus, replacement tooltip or object drag. Ordinary word/caret selection follows the surrounding editor's behavior.
3. Apply Red, a custom hex and Default to a partial mixed range. Expected: selected words/vector glyphs change together; unselected content stays unchanged. Undo/redo, copy/paste, delete/undo, save/reload should retain icon identity and marks.
4. Repeat steps 1–3 in Mind Map paragraph/heading/list/quote/callout bodies, Markdown and legacy Documents, hosted Documents, table cells and rich callouts. Expected: equivalent passive content and selection behavior. Select the glyph before using Insert icon if replacing it.
5. Type `:rocket` in those editors. Expected: context/completion entries display actual emoji/vector/brand previews; no diamond placeholder or missing glyph. In nested fields also verify `/icon` opens the shared picker and insertion/cancellation preserves the intended cell.
6. Repeat with adjacent icons, icons at line boundaries, wrapped text, custom images, Light/Dark and varied canvas zoom. Expected: complete selectable glyphs with matching range highlights. Image/emoji pixels retain their original artwork when text color changes. Read-only content must not write.

## Suggested commit

`fix(editor): make inline icons passive text-selection content`
