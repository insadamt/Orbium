# Mind Map topic width — 2026-10-26

The user reported that branch width could not be adjusted. Topics now have an outer-edge resize handle in the fullscreen editor. This is an explicit extension within the current Mind Map review phase.

## Behavior

- Select a topic after leaving text editing. A narrow grip appears on its outward edge: right for the root/right-hand branches, left for left-hand branches. Drag it to change that topic's width between 100 and 800 map pixels. Other topics keep their own widths.
- Text rewraps and its measured height grows/shrinks automatically. Branch positions, connector endpoints, scene bounds and selection reveal use each topic's actual width. Descendants keep a 60-pixel gap from their parent rather than using fixed-width columns.
- Pointer samples update a transient preview at most once per animation frame. The current zoom and parent-facing horizontal edge are kept stable during the drag. Only release publishes one owner action/save/history change. An unchanged drag does not upgrade or save the graph.
- Escape or owner Undo/Redo shortcuts during an active drag cancel its preview without consuming an owner history step. Pointer cancellation/capture loss also cancels. Rejected commits restore the accepted map. Completed changes use original Board/Document history, autosave, conflict and recovery systems.
- Tab to the grip and use arrows for 10-pixel steps; Shift changes the step to 50 pixels. On left branches, Left grows outward and Right shrinks. Home chooses 100, End chooses 800. Double-click resets to the default 180 pixels. The handle exposes its value/range to assistive technology.
- Read-only and embedded previews show saved widths without mutation handles. Native Board block dimensions remain independent of topic widths. Existing single-border selection, rich text, collapse/reparent and formatting controls remain in use.

## Persistence and compatibility

Graph **version 3** adds optional integer `width` on a topic. Version-1/2 topics retain their 180-pixel default. Only an accepted width change upgrades a map to version 3; viewing, cancelled/unchanged drags and opening/closing do not. Rich-text edits preserve version 3 instead of downgrading it. Labels, rich marks, topic IDs, ancestry and collapse flags are retained.

Client/server validate width as an integer within 100–800 and allow it only in version 3. Graph versions 1 and 2 remain supported. The existing 64 KiB graph, 500-code-point text and 64-parent-link depth limits remain. Native formatting-preserving exports retain widths; plain/office outlines still export topic text without geometry.

Current legacy clients advertise `editor_features: {mindmap: 3}`. The existing stored-graph capability guard automatically requires 3 when a legacy Document contains a version-3 map, protecting it from older schemas. Deploy matching frontend/server and reload open editors. Board spatial format stays 7, native content format stays 1 and Document envelopes are unchanged; no database migration is needed.

## Checks

Final checks passed:

- Targeted `vp check --fix`: formatting/lint passed without warnings/errors in 20 source files.
- `npm run types:check`: passed.
- `npm run lint`: passed; 754 files correctly formatted and 638 source files checked without warnings/errors.
- `npm run build`: passed; 5,577 modules transformed in 15.30 seconds. Existing large-chunk, mixed static/dynamic import and plugin-timing warnings remain. Log: `/tmp/orbium-topic-width-build.log`.
- `./vendor/bin/pint --test`: PHP formatting check passed.
- `php -l app/Services/MindMaps/MindMapData.php`: passed.
- `git diff --check`: passed.
- Changed/new source files remain below 500 lines: canvas 429, width handle 170, layout 161, width helpers 23 and PHP graph validator 95.

No automated tests, Playwright or browser automation ran. Browser interaction acceptance remains manual. Markdown documentation is excluded by the repository formatter configuration.

## Exact manual checklist

Use a disposable native Board and Markdown Document. Reload the frontend/server deployment; repeat on a legacy Document or hosted card if available.

1. **Find and drag:** open Edit, select a child topic, and leave its text editor with Escape/Finish editing if necessary. Expected: one outward-edge grip appears. Drag wider/narrower. Expected: only that topic's width changes; wrapped text grows/shrinks in height, connectors remain attached and descendants stay separated. Repeat on the root and a left-hand branch.
2. **Zoom/anchor:** repeat at 50%, 100% and a larger zoom. Expected: pointer movement uses the current map scale, the parent-facing edge stays horizontally anchored during the preview, and dragging the grip does not pan the Board or move the whole block. After release, normal layout/selection reveal resumes.
3. **One history action:** complete a substantial drag and press owner Undo, then Redo. Expected: one Undo restores the prior width; Redo restores the new width with original text/formatting/topology intact. Drag back to the starting width before release: expect no new content save/history step.
4. **Cancel:** start a drag and press Escape, Ctrl/Cmd+Z or Ctrl/Cmd+Y before releasing. Also try a cancelled pointer gesture if your browser/device supports it. Expected: the preview returns to accepted width, no new save/history action occurs and the editor stays open. The next ordinary Undo still applies to the earlier completed owner action.
5. **Keyboard/reset:** Tab from the selected label to the grip; use arrows, Shift+arrows, Home and End. Expected: 10/50-pixel steps, bounded to 100–800, with automatic text height. Left-hand outward direction is reversed naturally. Double-click the grip: expect default width 180. Verify keyboard focus remains visible without an extra border around the entire topic.
6. **Save/reload:** resize several different topics, format/edit one label, collapse/expand and reparent a resized branch. Wait for Saved, close, reload and reopen. Expected: independent widths survive along with rich text, ancestry and collapse state. Rich-text edits must keep graph version 3. Copy/duplicate/export/import through `.orbie`: expected widths survive and copies remain independent. Plain/office outlines continue to include all plain labels without geometry.
7. **Ownership/read-only:** repeat in native Board, normal/hosted Markdown and legacy Documents when available. Expected: original owner save status, Undo and conflict/recovery behavior. Embedded/read-only views show widths but no grips. Resizing a native Board viewport still changes its frame independently of topic widths.
8. **Compatibility/validation:** old version-1/2 maps retain default width on load and remain unchanged when a drag is cancelled. On disposable copied DevTools saves, try `width` in version 2, null/string/fractional/out-of-range width or graph version 4. Expected: rejection with no stored revision/content change. For a stored legacy version-3 map, lower capability to 2: expect reload rejection and preserved data. Existing text/graph budgets continue to apply.
9. **Regression:** select, rename, format, collapse, reparent and delete branches; use Fit/zoom and pan. Expected: existing actions remain usable, collapse toggles remain clickable above the resize hit area, and text selection never starts a canvas drag. Check light/dark, narrow windows and touch input manually.

## Limits and commit suggestions

Pointer feel, touch capture, actual anchoring, automatic-height feedback, persistence/history and conflict acceptance remain unverified in a browser until manual review. No performance or thermal improvement is claimed. The width range is 100–800; topic height remains automatic.

No commit was created. Existing uncommitted work was preserved.

- `feat(mindmap): add topic width resizing`
- `fix(mindmap): persist branch widths and relayout connections`
