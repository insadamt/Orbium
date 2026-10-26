# Mind Map fullscreen editor — 2026-10-26

## Approved result

The user approved the proposed Mermaid-style preview and fullscreen editing flow with “okey go ahead”. This redesign supersedes the inline topic panel and dotted-canvas presentation described in the earlier review correction. It remains in the existing Mind Map phase; no later phase or advanced map feature was started.

## Changes

- The embedded block uses the same shared attachment/rich-card heading, type icon and Edit/full-preview actions as Mermaid and other rich blocks. It displays only the fitted map. No topic inspector, hints, grid or zoom controls compete with the preview. Document preview height follows the tree within 200–440 pixels; native Board maps retain their saved viewport height and resize behavior.
- **Edit** opens a live fullscreen dialog. Board double-click/Enter/Edit also opens this editor through the existing Board editing state. A separate fullscreen action opens a view-only map; capable owners can switch it into Edit. Read-only maps never expose mutations.
- The fullscreen dialog uses the existing Mermaid overlay, window animation and reduced-motion behavior. It shares the current document's body as its portal target, traps focus and restores block-control focus when closing. Done or Escape closes it; clicking outside does not discard the editing surface.
- The plain theme-colored canvas has thinner curved connections, quiet topic cards, a slightly stronger central topic and a subtle selected border.
- Board tool buttons, including their tooltip and disabled-state behavior, form a vertically centered left dock: child, sibling, rename, collapse/expand, parent and branch deletion. Root-only restrictions remain. The parent panel opens only when requested and uses the existing searchable parent picker; descendant/self choices remain excluded.
- Double-click, F2/Space or Rename edits the topic directly using a plain-text textarea. New topics open their own selected label for replacement. Tab creates a child; Enter creates a sibling, or a child for the root. Shift+Enter permits a line break. Escape exits label editing before closing the dialog. Every accepted character still enters the owner's existing content/history path immediately.
- Bottom-center controls show zoom out, actual percentage, zoom in and Fit. Empty-space mouse dragging and scrolling pan the map. Extra bounded scroll space lets small maps pan too; native touch scrolling remains available. Pointer motion writes scroll offsets instead of rerendering the graph for every pointer move.
- Selected/new/reparented topics remain visible inside the map. The prior selection correction for collapsed ancestors and keyboard branch-deletion focus is retained.
- The top-right save label mirrors the actual containing Board, Markdown or legacy Document status, including hosted sessions. A small owner-DOM status attribute and scoped attribute observer bridge nested CodeMirror roots without creating another save service or marking changes Saved optimistically.
- Ctrl/Cmd+Z/Y is routed from the dialog through the original owner's keyboard/history path, including Markdown nested roots and native Boards. Portaled IME state is mirrored into the original block's composition marker so existing autosave guards can still see it. Composition blocks history/closing until input finishes; label blur clears the composition marker.
- Existing graph format, graph validation, migration, ownership, conflict/recovery behavior, export fallbacks and save endpoints are unchanged. No new dependency was installed. The canvas, scene, tools, view controls and owner-status bridge are separate small files.

## Checks

Final checks completed successfully:

- Targeted `vp check --fix`: formatting completed; no warnings or lint errors in 18 source files.
- `npm run types:check`: passed.
- `npm run lint`: passed; 746 files correctly formatted and 630 source files checked without warnings/errors.
- `npm run build`: passed; 5,569 modules transformed in 31.87 seconds. Existing large-chunk, mixed static/dynamic import and plugin-timing warnings remain. Log: `/tmp/orbium-mindmap-fullscreen-build.log`.
- `git diff --check`: passed.
- Main wrapper: 294 lines; canvas: 354; scene: 183; topic tools: 155. Each changed/new source file stays below 500 lines, including the existing editor entry points.

No automated tests, Playwright, browser automation or browser acceptance checks were run. The user will perform visual and interaction acceptance. PHP checks are not applicable: this correction changes frontend code and documentation only. Markdown documentation is excluded by the repository formatter configuration.

## Exact manual checklist

Reload the frontend. Use a disposable native Board, a Markdown Document, and a legacy Document/hosted Markdown card if available. Use **Launch**, **Research**, **Build**, **Sources** as labels. Wait for Saved before normal reloads.

1. **Embedded appearance:** insert a map next to a Mermaid block in a Document; also place a native Board map. Expected: matching rich-block heading/actions, a fitted map preview, no embedded inspector, hints, dotted grid or view toolbar. A simple Document map is compact; larger maps grow only to the preview limit. Existing Board width/height remain intact. Check light/dark themes and a narrow split pane.
2. **Open/close:** click Edit. Expected: fullscreen dialog, root selected/focused, vertically centered left tools, view controls at bottom center, Done and owner save status at top right. Done returns to the updated preview and a block control receives focus. On a native Board, double-click/Enter/Edit should reach the same dialog; closing returns to ordinary Board selection/move/resize. Reopen several times: no duplicate overlays or abandoned editor remains.
3. **Read-only full preview:** click the fullscreen icon. Expected: view-only canvas with pan/zoom/Fit and Done, without topic mutation tools. A writable owner offers Edit; a truly read-only owner does not. Clicking Edit changes the same dialog into the live editor. Opening/closing and view changes alone must not create a content save.
4. **Direct labels and creation:** rename the root Launch using double-click, F2 and the Rename tool. Add Research and Build beneath Launch, then Sources beneath Research using toolbar buttons and Tab/Enter. Expected: the label editor is inside the selected topic, new label text is selected for replacement, caret remains stable, all labels/links appear in the proper branches, and additions remain visible without shrinking the selected zoom. Shift+Enter inserts a line break. Shift+Tab retains ordinary focus navigation.
5. **Label Escape/focus:** while typing, press Escape once. Expected: accepted text remains, the label editor closes and its topic receives focus; the fullscreen dialog stays open. Press Escape again from the topic/canvas. Expected: fullscreen closes and the original block remains. Repeat after keyboard deletion and Undo of a new topic: a visible topic remains reachable; shortcuts do not delete surrounding Document text or another Board object.
6. **Left dock:** select Research; collapse and expand it. Expected: Sources hides/reappears without losing data. Select Sources, open Change parent, search Build and select it; repeat with Build collapsed. Expected: Sources moves under Build, its ancestry expands and it is visible. The popup and tooltips render above the fullscreen surface. Root sibling/reparent/deletion tools are disabled with an explanation; collapse is disabled on a leaf. Escape dismisses an open picker before the editor.
7. **Delete/history:** delete Research with a nested child using Delete and the dock, then Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z and Ctrl/Cmd+Y. Repeat after direct label editing. Expected: original owner Undo/Redo restores/removes the correct branch/label, without browser-native textarea history taking over, changing another map or closing the editor. Undo an expansion while a descendant was selected: its visible collapsed ancestor becomes selected.
8. **View controls:** drag blank canvas with both a single-root and larger map, scroll, zoom and Fit. Expected: smooth local panning, readable percentage, Fit brings the whole visible tree into view, and no graph save is triggered. Add/reparent/navigate to an offscreen topic: inner canvas scroll reveals it. Resize the browser/split pane and repeat. Check narrow and short windows: toolbar remains scrollable and Done stays reachable.
9. **Real save status:** edit a label with DevTools Network throttled. Expected: status follows the same Unsaved/Saving/Saved transitions as the owner. Make a disposable offline edit: status shows Not saved, never a false Saved. Done may close the dialog but does not cancel pending content or bypass owner navigation/recovery guards. Return online and use the owner's retry/recovery flow. Reload after Saved: updated labels, ancestry and collapse flags survive.
10. **IME and literal text:** compose text with an IME, use Arabic/emoji and literal HTML/Markdown-looking labels. Expected: plain text, stable composition and delayed owner save while composing. Escape/history must not discard the active composition. After input completion or blur, autosave resumes and Done works. More than 500 Unicode code points is rejected with the existing visible limit message while accepted graph content remains intact.
11. **Hosted/legacy ownership:** repeat editing, status, history, IME and Done in a hosted original Document card and legacy Document when available. Expected: edits belong to the original Document; status/conflict/recovery remain its own. The native Board-owned map stays independent. In a split pane, the dialog appears over its owning document, and closing it returns focus there.
12. **Regression and recovery:** move/resize/duplicate a Board map after closing; reorder/copy a Document map and edit one copy. Expected: independent copies, original graph preservation and normal surrounding text, Mermaid, media, drawing, history and saves. Repeat the existing stale-revision/offline/export checks in `13-mindmap-block.md` on disposable data; the redesign must not bypass those protections. No graphical export is added.

## Known limits

Browser layout, keyboard/focus feel, touchscreen behavior, split-pane portal behavior, IME and persistence/conflict acceptance remain unverified until the user follows the checklist. No performance/thermal improvement is claimed. Map view state is transient and resets on remount. Zooming uses the shared scroll/scale viewport rather than a new infinite-canvas engine. Existing source/rich-view switching, conflicts and owner recovery still belong to their original editors.

## Commit suggestions

No commit was created. Existing uncommitted initial Mind Map, drawing and motion work was preserved.

- `feat(mindmap): add fullscreen editing with board-style tools`
- `refactor(mindmap): separate rich preview from fullscreen editor`
