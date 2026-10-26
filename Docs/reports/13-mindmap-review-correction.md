# Mind Map review correction — 2026-10-26

The user reported poor styling and several nonworking features. This correction stays within the approved Mind Map phase. Specific failing actions were requested during the work but had not been supplied when this report was written; the findings below come from source inspection, not browser reproduction.

## Findings and changes

- The Markdown widget wrapper received the same `.orbium-mindmap` class as its inner React canvas. Both consequently acquired a fixed height, flex layout and border, with additional wrapper padding. The wrapper now uses `.orbium-mindmap-block`; the shared canvas owns its frame once.
- The previous layout reserved equal space on both sides of the root even for an entirely one-sided deep branch. Bounds now use actual topic positions on each side.
- The effective zoom was a multiplier on a continuously recalculated fit scale. Adding topics, collapsing branches and opening controls could resize labels unexpectedly. An accepted edit now retains the current absolute scale. Initial views use at least 65% scale for readability; explicit Fit can show an entire large map at a smaller scale. Zoom controls display the actual percentage, with a 250% upper limit.
- The canvas centers the map vertically and horizontally when space permits. Selecting, creating or reparenting a topic reveals it using only the inner canvas scroll position. The surrounding Board/Document is not intentionally scrolled.
- A compact header, subdued dotted canvas, restrained topic cards, bottom topic panel and responsive controls replace the crowded editing header. Parent selection uses the existing searchable app picker. Full labels are available in topic hover titles; the topic panel edits the complete label.
- Passive editable Board maps expose an explicit **Edit** button. Read-only maps do not. Existing double-click/Enter/selection editing remains available.
- F2 or Space on a focused topic selects its label in the text field; double-click also selects the label. Topic focus updates selection, and keyboard branch deletion restores focus to its parent.
- Owner Undo can restore collapsed ancestors while the selected descendant still exists. Selection now resolves to its outermost visible collapsed ancestor, keeping one visible topic in the keyboard tab order.
- Composition cleanup reads the current owner callback without clearing the owner composition flag merely because its callback identity changed.
- The topic panel and viewport behavior live in focused files; changed Mind Map sources remain below 500 lines. Existing graph validation, persistence formats and owner save/history systems continue to apply. No migration, backend or dependency changes were required.

## Validation

Final checks passed:

- Targeted `vp check --fix`: formatting completed; no warnings or lint errors in 11 source files.
- `npm run types:check`: passed.
- `npm run lint`: passed; 741 files correctly formatted, 626 source files checked without warnings/errors.
- `npm run build`: passed in 16.70 seconds. Existing large-chunk and mixed static/dynamic import warnings remain. Final log: `/tmp/orbium-mindmap-review-build.log`.
- `git diff --check`: passed.
- A separate documentation-only `vp check` could not start because Markdown files are excluded by the repository formatter configuration; the full source formatting/lint check above passed.
- Changed Mind Map component: 467 lines; topic controls: 99; viewport hook: 87; stylesheet: 281.

No automated tests, Playwright or browser automation were written or run. Browser styling, focus, persistence and interaction acceptance remain for the user. PHP formatting/syntax checks are not applicable to this frontend/documentation correction.

## Exact manual checklist

Use a disposable Board and Markdown Document, plus a legacy Document or hosted Document card if available. Reload the app to load the updated frontend.

1. **Presentation:** insert `/Mind Map` in a Document and add a native Mind Map to a Board. Expected: one border/frame per map, compact header, centered root and no duplicate padded frame. Check light/dark themes and a narrow split pane: controls wrap inside the block; the map remains scrollable.
2. **Enter editing:** click **Edit** on the passive Board map. Expected: topic panel appears and label input receives focus. Finish editing using the existing Board control. Expected: ordinary move/resize returns. A read-only map offers no Edit or mutation controls.
3. **Labels and creation:** rename the root **Launch**. Add **Research** and **Build** beneath it, then **Sources** beneath Research. Use both buttons and Tab/Enter from a topic or its text field. Expected: Tab creates a child; Enter creates a sibling, or a child when the root is selected. New text is selected for replacement, the new topic becomes visible, and the scale stays stable as the graph grows. The central topic has no sibling button, parent change or deletion.
4. **Focus and deletion:** focus a topic; use arrows/Home, F2 and Space. Double-click another label. Expected: selection follows focus and rename selects the intended full label. Delete Sources using the keyboard. Expected: only that branch disappears and focus returns to Research. Backspace in the text field removes characters. Undo/Redo restores/removes graph changes through the original owner history.
5. **Collapse/history:** collapse Research, then expand and select Sources. Undo the expansion. Expected: Research becomes the visible selection rather than leaving every topic outside the tab order. Expand again: Sources remains stored. Left-side collapse toggles sit on the outer left edge; collapsed toggles show the direct child count.
6. **Reparent:** select Sources, search for Build in **Parent**, and choose it. Repeat with Build collapsed. Expected: only Sources moves, Build expands, Sources becomes visible, and the picker excludes Sources and its descendants. Undo restores the previous ancestry.
7. **View and geometry:** create a deep branch predominantly on one side. Use +, −, Fit and inner scrolling; resize the Board viewport. Expected: no matching empty-width reservation on the other side, current zoom is visible, Fit shows the full tree, and zooming/scrolling does not change saved graph content. Creating or navigating to an offscreen topic scrolls the inner map to it. Check after a small Fit that − still reduces scale.
8. **Persistence/history:** wait for Saved, reload both owners and repeat inside a hosted card/legacy Document when available. Expected: labels, ancestry and collapse flags survive. Duplicate a map and edit the copy: original content stays independent. Undo/Redo remains owned by the containing Board/Document. View zoom/scroll is transient and may reset on remount.
9. **Text and composition:** edit Arabic, emoji and a long label; use IME if available. Expected: literal text, usable caret and no interrupted composition or premature owner save. A label exceeding 500 Unicode code points is rejected with a visible limit message; existing saved content is preserved.
10. **Regression:** move/resize/copy a Board map; edit text before and after a Document map, reorder the map, and use another rich block. Expected: existing selection, history, saves and unrelated drawing/media/editor interactions remain usable. Existing phase conflict, recovery, export and validation checks remain in `13-mindmap-block.md`.

## Limits and commit suggestion

These are source-level repairs and a presentation pass; unspecified failing actions cannot be claimed resolved without the user's examples/manual review. No runtime performance or thermal improvement is claimed. The previously approved core scope remains unchanged.

No commit was created; existing uncommitted drawing/motion and initial Mind Map work were preserved.

Suggested commit messages (alternatives):

- `fix(mindmap): refine block styling and repair topic navigation`
- `fix(mindmap): stabilize zoom and improve editing controls`
