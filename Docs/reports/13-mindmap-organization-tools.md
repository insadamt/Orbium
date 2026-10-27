# Mind Map organization tools — 2026-10-26

The user accepted the recommendation to start with additions 1–4: branch drag/reorder, colors/icons, search and bulk expand/collapse. These are implemented inside the existing Mind Map phase-5 review.

## Delivered behavior

### Branch movement and order

- Drag a nonroot topic label, or its selected top-left grip, onto another topic. The middle half makes it a child; the leading/trailing quarter inserts before/after that topic. The root accepts children only. Drop indicators use horizontal or vertical insertion lines according to the target's layout direction.
- A dimmed source, destination highlight/insertion line and unscaled status explain the pending action. Invalid source/self/descendant targets are excluded. Topic widths, IDs, content, styles and descendant relationships are retained. Destination ancestors expand on an accepted drop.
- Pointer movement previews locally at most once per animation frame. Near-edge dragging scrolls the inner map; the loop stops when scrolling stops moving. Only an accepted release publishes an owner action. Cancel, capture loss, window blur and Escape/owner-history during a drag discard the preview. An external map change during a gesture rejects the stale drop.
- Alt+Up/Down reorders the selected topic among siblings. Existing Change parent remains the keyboard alternative for reparenting. Enter inserts a sibling immediately after the selected topic. Root movement and cyclic moves are rejected; the original depth/byte/text validator also checks every accepted move.
- Existing automatic layout placement is retained; dragging changes ancestry/order rather than storing arbitrary free coordinates. Balanced/Fishbone layouts may change a branch's side as sibling order changes.

### Branch colors and icons

- **Branch appearance** in the left dock provides nine colors and **Inherit**. A branch's color flows to descendants unless a child has an explicit override. Resetting a child restores inherited/default color. Node fills/frames, topic glyphs and connectors use the effective branch color across all templates.
- The panel searches the existing local built-in/brand icon catalog and renders 48 results per page. Names and SVG glyph loading reuse canonical icon data/assets. Icons decorate individual topics; Remove deletes that topic's icon. No attachment or image ownership path is introduced.
- Text stays theme-readable over a subtle tinted background, including while editing. Topic selection still uses the existing single border. Inline text colors remain separate from branch color.

### Map search

- Fullscreen Edit and read-only preview have topic-text search. Ctrl/Cmd+F focuses the map field. Matching frames are highlighted; an active result has a distinct border and is revealed within the inner viewport. Next/Previous or Enter/Shift+Enter cycles results, including hidden descendants.
- Matching is literal with Unicode normalization, case folding and diacritic folding; it is not regular-expression search. The field shows current/total or No matches. Search input Undo/Redo stays local to the field.
- Ancestor expansion is a view override, never a saved graph change. Clearing/Escape restores the current saved collapsed state. Escape returns focus to the selected topic or viewport. Explicit editing/move/visibility actions can still change saved collapse flags as part of their normal owner action.
- An actively edited result remains revealed even when its new text no longer matches. Automatic search selection pauses during that editing. Starting/cycling search finishes the active text editor through its already accepted owner changes. Clearing search and read-only searching make no content save/history action.

### Bulk detail controls

- **Expand all** clears collapsed flags. **Collapse all** shows only the root. **Levels** offers the actual depth of the map, with the root counted as level 1.
- A changed operation is one saved, undoable owner action. It clears search and finishes text editing. Reapplying an unchanged graph does not create another save/history action. Descendants and their rich content/styles remain stored.

## Data, compatibility and implementation

Graph **version 6** adds optional topic fields:

- `color`: `gray`, `red`, `orange`, `amber`, `green`, `teal`, `blue`, `purple`, `pink`.
- `icon`: a validated name in the canonical built-in/brand catalog.

Absence inherits/defaults color or omits the icon. Reset removes the optional field. Null/unknown values and these fields in versions below 6 are rejected. Client/server share the same accepted palette/catalog; the server reuses `InlineIconData::isBuiltin`. New style changes upgrade to 6, and later text/width/layout edits retain 6. Graph versions 1–5 remain readable and unchanged until a meaningful mutation requires an upgrade.

Sibling order and collapsed flags use the existing format; moving/searching/bulk visibility alone do not require a graph-6 upgrade. All existing limits remain: 500 Unicode code points per topic, 64 KiB graph, 64 parent links, structured body depth/node budgets and 100–800 px widths.

Normal/hosted legacy clients advertise mindmap capability **6**, preserving existing inline-icon capability **2**. The stored-graph capability guard protects saved graph-6 maps. Deploy matching frontend/server and reload open editors. No database migration or outer Board/Document envelope change is required. Custom image/emoji picker features from the separate Document inline-icon work are unchanged.

Formatting-preserving graph transfers retain new metadata. Plain text/search/statistics/office outlines continue using topic text; colors and decorative glyphs are omitted from those outline fallbacks. No additional Node links/attachments or account archive changes.

Topic add/remove/collapse/keyboard logic was extracted into a focused hook to keep the canvas under 500 lines. Search, drag handling, styling and pure structural actions have separate files. Connectors now carry their owning topic ID alongside path geometry so inherited color can be applied consistently, including braces/spines.

## Actual checks

- `npm run check:fix`: passed formatting and lint after final source changes.
- `npm run types:check`: passed.
- `npm run lint`: passed; 843 formatted files and 675 source files, no warnings/errors.
- `npm run build`: passed in 16.13 seconds. Existing large-chunk, mixed-import and plugin-timing warnings remain. Log: `/tmp/orbium-mindmap-tools-build.log`.
- `vendor/bin/pint --test app/Services/MindMaps/MindMapData.php`: passed.
- `php -l app/Services/MindMaps/MindMapData.php`: passed.
- `git diff --check`: passed; repeated after this report.
- Source sizes remain below 500 lines: canvas 444, scene 282, drag hook 227, topic actions 187, feature CSS 316.
- No automated tests, Playwright or browser automation written or run, per user instruction. This report records static/build verification; actual pointer behavior, responsive appearance, save/history and device acceptance remain manual.

## Exact manual checklist

Use disposable content in a native Board and normal Markdown Document; repeat persistence/history in hosted Markdown/legacy Documents where available. Reload the matching client/server first.

1. **Prepare:** create a root with four branches and several grandchildren. Mix `/heading`, a checklist, multiline text, inline bold/color/link and widths 100/180/320/500. Collapse a branch with a unique label. Expect existing template, formatting, resize and save behavior.
2. **Reparent:** finish text editing and drag a branch label onto another topic's center. Expect a highlighted destination and “Move inside” status; release should make it a child with all descendants/content/widths intact. Repeat via the selected grip while its text editor was active. A collapsed destination expands. The root stays fixed and accepts child drops.
3. **Reorder:** drag onto a topic's leading/trailing quarter. Expect a line and before/after status. Release and verify sibling order, then use Alt+Up/Down and Enter to add an adjacent sibling. Repeat in balanced, left/right tree, top/down, outline, brace, fishbone and both timeline directions. In top/bottom hierarchies and vertical-growing timeline subtrees, expect horizontal insertion indicators. Whole subtrees remain attached, though balanced sides can change with order.
4. **Invalid/cancel:** try dropping onto the source, its descendant, empty canvas and outside the viewport. Expect no invalid mutation. Start a valid preview and press Escape, Ctrl/Cmd+Z/Y, cancel the pointer or blur the window: expect original graph and no extra history step. Move to a viewport edge: expect inner scrolling, stopping after release/cancel. If content changes externally during a drag, expect a retry message rather than overwriting the newer graph. A valid move that exceeds depth/byte limits must be rejected with accepted content retained.
5. **One history action:** complete a move or sibling reorder, then Undo/Redo. Expect exactly the prior/new ancestry and order, with all rich content, widths, style and collapsed descendants. Drop into an unchanged sibling position or hit a reorder boundary: expect no extra save/history action.
6. **Color inheritance:** open Branch appearance, choose a color, and inspect the topic, descendants and connectors. Give a child a different color; change the parent's color again. Expect the child override to remain. Choose Inherit on the child and expect its parent's color. Reset the root to Inherit for theme defaults. Repeat while editing text and after switching every template; fills must remain visible and text readable in light/dark themes, with one selection frame.
7. **Icons:** search a Lucide icon and a brand, page through results, select one, reopen the branch editor and remove/replace it. Expect canonical glyphs in embedded/fullscreen/read-only views with preserved label/body text. Search unknown names: expect no matches. Page changes should mount only one page of glyph buttons. Icon/color changes each undo/redo through the original owner.
8. **Hidden search:** with a matching grandchild under a collapsed ancestor, open fullscreen preview or Edit and use Ctrl/Cmd+F. Search with different case/accent spelling. Expect matching frames, current/total count, active-result reveal and temporary expansion. Enter/Shift+Enter and Previous/Next cycle all matches; a single match can be re-revealed after selecting another topic. Search a nonexistent label: expect No matches. Clear/Escape: expect the saved collapsed state and no new revision/history entry from search alone. Read-only search exposes no mutation tools.
9. **Editing a result:** search a hidden result, edit its text so it stops matching, and continue typing. Expect the editor to remain visible and text to save normally; search must not steal selection while typing. Finish editing, clear search and reopen the branch: expect the edited body preserved. Add a child/sibling from a revealed result: expect the new topic and accepted ancestry visible after clearing search. Search-field Undo/Redo edits its draft rather than undoing the map.
10. **Bulk levels:** Expand all, Collapse all, then show levels 1, 2 and a deeper available level. Expect all/root-only/requested depth, with root counted as 1 and no deleted descendants. Each changed operation is one undoable save; repeat the same setting and expect no extra action. Perform it while a search is active and a topic is being edited: search clears, editing finishes and accepted text remains. Undo/Redo must restore exact earlier collapse flags and all styles/widths.
11. **Save and compatibility:** style, reorder, switch templates and resize a branch; wait for Saved, close, reload and reopen. Expect graph-6 metadata, original structured text, independent widths, order and collapse flags. Repeat on Board/normal/hosted/legacy owners. Existing graph-1–5 maps must open without an automatic upgrade. Search/open/close/resetting an absent style must not upgrade; choosing a new style does. Formatting-preserving Document duplicate/export/import should retain metadata; plain/office outlines retain topic text.
12. **Manual copied-request validation:** try color/icon fields in graph 5, unknown/null color, nonexistent/non-string icon, graph version 7, cycles, root reassignment and too-deep moves. Expect rejection with unchanged stored revision. For a legacy stored graph-6 map, lower mindmap capability to 5 while omitting it from a full save: expect reload rejection and preserved data. Confirm current saves retain inline-icons capability 2.
13. **Input/device regression:** compose non-Latin text, use `/` commands, formatting/link pickers, exact width and resize cancellation, reparent picker, Fit/zoom and deletion. Expect accepted text retained and no underlying Board movement/Document shortcut interference. Verify mouse/touch capture, narrow/short windows, light/dark, keyboard focus and read-only controls manually. Search and icon dialogs/inputs must keep their own native draft Undo/Redo.

## Review boundary and commit suggestion

This completes the approved first four additions. Browser/performance and interaction claims await manual acceptance. No staging/commit performed; the separate inline-icon work was preserved.

Suggested commit: `feat(mindmap): add branch organization and search tools`
