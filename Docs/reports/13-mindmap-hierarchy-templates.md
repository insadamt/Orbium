# Mind Map hierarchy templates — 2026-10-26

The user reviewed a researched shortlist and approved “okey add them all”. All nine template families are implemented within the existing Mind Map phase-5 review.

## Delivered layouts

| Template | Arrangement |
| --- | --- |
| Balanced mind map | Central topic with alternating right/left branches |
| Right-facing tree | Root on the left; descendants grow right |
| Left-facing tree | Root on the right; descendants grow left |
| Top-down hierarchy | Root above; descendants arranged in rows below |
| Bottom-up hierarchy | Root below; descendants arranged in rows above |
| Outline tree | Preorder rows with indentation and tree guides |
| Brace map | Right-facing groups joined with braces |
| Fishbone | Root outcome at the right, alternating cause groups along a spine |
| Timeline | Ordered milestones along a horizontal or vertical shared line |

Fullscreen **Edit → Templates** opens a themed visual picker at the upper right. Cards preview geometry using the same layout functions as the real map. For Timeline, reopen Templates to choose Horizontal or Vertical. Active-template selection and picker dismissal do not mutate the graph. Escape closes only the picker and returns focus to its trigger. Buttons support normal Tab/Enter/Space navigation; focus on the active card is revealed within a short panel.

Selecting a different layout changes only the map-level layout/version, preserving every topic ID, parent link, text, inline content/structured body, width and collapse flag. It uses one accepted original Board/Document history/save action and returns zoom to the readable automatic setting. Layout switching waits for topic composition to finish. New topics remain ordinary empty/template labels from the existing add flow; layouts do not replace content with examples.

## Geometry and interactions

- Horizontal layouts reserve measured topic height/subtree spans; vertical layouts reserve subtree widths and level height bands. This supports different topic widths and multiline text.
- Outline uses indented rows. Brace generates group braces. Fishbone reserves independent paired subtree columns around its spine. Timeline reserves independent milestone subtree lanes, with both orientations supported.
- Connectors and SVG bounds use the same arrangement as the topic frames. Collapsed descendants are excluded from placement, but remain saved. Root-only/collapsed-root maps remain valid in every layout.
- Width grips and exact width controls remain available. Horizontal left branches resize outward to the left; other layouts use the right width grip where appropriate. Automatic height, Fit, inner scrolling and owner Undo/Redo remain.
- Arrow navigation follows branch growth: outward enters/expands, inward returns to the parent, perpendicular arrows move between siblings; Home returns to the root. Outline keeps Right-child/Left-parent conventions. Text-editor keys retain their document behavior.
- Embedded/read-only maps display the stored geometry without template or mutation controls. Native Board viewport dimensions remain independent of topic widths.

A [static gallery](../previews/13-mindmap-templates.html) and [standalone SVG](../previews/13-mindmap-templates.svg) show the same sample tree in each layout and both timeline orientations. The gallery was rendered with the local SVG renderer and visually inspected without browser automation. It verifies schematic placement, not the running app's editing/save behavior.

## Persistence and compatibility

Graph **version 5** adds optional top-level `layout`, validated on client and server against:

`balanced`, `tree-right`, `tree-left`, `hierarchy-down`, `hierarchy-up`, `outline`, `brace`, `fishbone`, `timeline`, `timeline-vertical`.

Versions 1–4 remain supported and default to balanced without rewriting saved data. Layout is rejected in versions below 5; unknown/null values and graph versions above 5 are rejected. Selecting a changed layout upgrades to 5; subsequent body and width changes preserve 5. All original graph/body/width limits remain.

Normal/hosted legacy saves advertise `editor_features: {mindmap: 5}`. The existing largest-stored-graph capability guard protects a saved version-5 map from older clients silently dropping its layout. Native Board/Markdown/import validation shares the updated graph validator. Matching client/server deployment and editor reload are required; no database migration, Board spatial envelope change or Document envelope change is needed.

Formatting-preserving Document exports keep the graph and layout. Search/statistics/plain/office outlines continue using saved topic text, with graphical layout omitted explicitly. Whole-account archive formats are unchanged.

## Actual checks

- `npm run check:fix`: passed formatting/lint after the final source change.
- `npm run types:check`: passed.
- `npm run lint`: passed; 766 formatted files and 648 source files, no warnings/errors.
- `npm run build`: passed in 16.80 seconds. Existing large-chunk, mixed static/dynamic import and plugin-timing warnings remain. Log: `/tmp/orbium-mindmap-templates-build.log`.
- `vendor/bin/pint --test app/Services/MindMaps/MindMapData.php`: passed.
- `php -l app/Services/MindMaps/MindMapData.php`: passed.
- `git diff --check`: passed; repeated after completing this report.
- Static SVG/HTML gallery generated from the layout implementation, rendered locally with `rsvg-convert`, and visually inspected for all nine families plus the second timeline orientation. No browser used.
- Changed/new source files remain under 500 lines: canvas 473, tree layouts 214, spine layouts 141, picker 154. Geometry, catalog, previews and picker styles are separated by responsibility.

No automated tests, Playwright or browser automation were written or run, per user instruction. Integrated interaction, persistence/history and device checks remain manual.

## Exact manual acceptance checklist

Use a disposable native Board and normal Document; repeat saving/history on hosted Markdown and legacy Documents where available. Reload matching frontend/server first.

1. **Prepare representative content:** create a root with four branches, two grandchildren under each, and another deeper descendant. Mix short text, multiline paragraphs, `/heading`, a checklist, inline color/bold and one link. Give branches different widths (100, 180, 320 and 500 px) and collapse one branch. Wait for Saved.
2. **Picker:** open Edit → Templates. Expect nine labeled visual cards, an active checkmark and the same app theme/icons. Tab between cards and activate with Enter/Space. Escape and X close only the picker; outside click dismisses it. Reopen near a narrow/short window: expect a scrollable panel inside the dialog and the active card visible. Opening/closing/selecting the active template should make no new graph/history save.
3. **Balanced and horizontal trees:** select Balanced, Right-facing and Left-facing in turn. Expect two-sided, all-right and all-left growth respectively. Text/marks/widths and collapsed flags stay unchanged; connectors meet the frame edges without overlapping topic rectangles. Expand the collapsed branch: all original children return.
4. **Vertical hierarchies:** select Top-down, then Bottom-up. Expect the root above/below rows of descendants, clear sibling spacing, and orthogonal connectors. Add a long multiline child or widen a descendant: expect automatic row/column spacing and usable Fit/scroll, with no neighboring topic overlap.
5. **Outline and brace:** select Outline. Expect preorder indented rows and tree guide connectors, with all text readable at a chosen zoom. Select Brace: expect grouped right-facing branches with braces, including a parent with only one visible child. Collapse/expand and reparent a subtree: expect updated groups with preserved descendants.
6. **Fishbone:** select Fishbone. Expect the original root as the outcome at the right, a central spine and alternating upper/lower cause groups. Grandchildren remain attached to their own cause. Resize a cause and add a multiline grandchild: expect separate columns and attached bones without overlapping labels. Repeat with one cause and with no causes.
7. **Timeline:** select Timeline and expect milestones in existing sibling order along a horizontal spine, alternating above/below with nested details. Reopen Templates → Vertical: expect the same content along a vertical spine, alternating left/right. Change back to Horizontal. Add/collapse/delete a milestone and resize details: expect updated spacing and no missing saved topics. No dates or scheduling are created.
8. **Content preservation/history:** while a nonroot topic is selected, switch several layouts and use owner Undo/Redo. Expect the previous/next layout with all text, checkbox values, widths, topic IDs, parent links, selection and collapsed branches preserved. Edit text via `/`, drag a width grip and apply an exact width after switching; graph version must stay 5 and the chosen layout must remain.
9. **Keyboard and resize:** in each layout, finish text editing and use outward/inward/perpendicular arrows, Home, Enter/Tab creation and Delete. Expect navigation matching branch growth, original branch creation/deletion and document-style text editing. A collapsed topic expands using its outward arrow. Drag or keyboard-adjust width on root and nested topics; cancel a live drag with Escape/history: expect the existing one-commit/cancel behavior and automatic height.
10. **Save/reload/ownership:** choose a distinctive layout (including vertical Timeline), wait for Saved, close and reload. Expect that layout, rich body, widths and collapsed state in embedded/fullscreen views. Repeat in Board/normal/hosted/legacy owners. Copy/duplicate and use the existing formatting-preserving Document export/import: expect the layout retained and copies independent. Plain/office exports must still contain every projected label as an outline.
11. **Readonly/old maps:** inspect readonly fullscreen and embedded maps: saved layouts render without a picker or width controls. Load old version-1/2/3/4 maps and open/close Templates: expect Balanced and no automatic upgrade. Switch layout once: expect version 5 with old literal labels/marks/bodies/widths retained. Collapse the root and switch every template: expect one valid visible root, with descendants restored on expansion.
12. **Manual copied-request validation:** on disposable requests, try a layout in graph 4, unknown/null/non-string layout, an unknown top-level key and graph version 6. Expect rejection and unchanged stored revision. For a legacy stored graph-5 map, lower capability to 4 and omit the map in a full save: expect reload rejection and preserved content. Existing graph/body/width limits still reject invalid edits. Compose non-Latin text before switching; expect composition to complete or a clear finish-composition message rather than lost text.
13. **Visual/device checks:** verify light/dark, narrow windows, touch dragging, zoom/Fit and scrolling. Topic selection keeps one border, menus remain unscaled, and fullscreen overlays do not trigger underlying Board movement or Document shortcuts.

## Limits and commit suggestion

These are whole-map layout templates, not prefilled project content or mixed per-branch layouts. Timeline uses topic order without date semantics; Fishbone uses existing tree ancestry without additional relationship edges. Existing 500-code-point topic and 64 KiB graph limits still apply. App/browser performance, integrated save/history and actual pointer behavior remain pending manual verification. No later product phase started; no staging or commit performed, and unrelated pre-existing work remains.

Suggested commit: `feat(mindmap): add hierarchy layout templates and visual picker`
