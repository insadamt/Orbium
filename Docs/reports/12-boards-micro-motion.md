# Board phase 4 review — Micro-motion

Date: 2026-10-24. Adds the requested subtle Board lifecycle, editing and control
animations. This remains Board phase-4 review; no later phase started.

## Audit and result

The Board already animates its floating toolbars, menus, drawing palette and
fullscreen transitions. Those remain. This pass fills the gaps around accepted
block changes, editing feedback, drawing styles, selection and small controls.
It adds no persistent fields, backend endpoint, schema, migration or dependency.
Board spatial format remains **6**. Existing uncommitted work is preserved;
no commit was created.

## Complete new animation inventory

| Interaction | Effect | Duration |
| --- | --- | --- |
| Create, duplicate, paste or restore an inactive block | Fade from 0, scale .96 → 1 and rise 4px | 180ms |
| Create/restore a drawing or active editor | Opacity .65 → 1 with no spatial movement | 140ms |
| Delete, cut, undo creation or redo deletion | Inert visual preview shrinks 1 → .94 and fades out | 140ms |
| Enter or leave edit mode | Mounted body opacity .72 → 1 | 120ms |
| Change block type, alignment, direction or list style | Small surface settle; active editors/drawings use a steady fade | 140ms |
| Change existing drawing color or width | SVG stroke color and width interpolate | 160ms |
| Change mounted native text/list styles | Color, background and decoration color soften where an existing element's style changes | 150ms |
| Hover/select a block or change its surface colors | Outline, border and background colors transition | 140ms |
| Reveal resize handles | Fade and scale .65 → 1 | 110ms |
| Hover/press a resize handle | Grow to 1.18 / compress to .92, with hover color feedback | 110ms |
| Press Board tool/drawing-format buttons | Compress to .94 and release; colors soften | 100ms scale, 140ms colors |
| Activate a tool glyph | Fade and scale .8 → 1; large brush illustrations stay steady | 130ms |
| Choose drawing ink | Selected swatch check pops; swatch surface/border colors soften | 130ms check, 150ms colors |
| Choose brush width or eraser size | Selected width bar/eraser ring confirms with a small pop; ring/swatch size and scale changes soften where applicable | 130ms confirmation, 140ms size/scale |
| Check/uncheck a native checklist item | Checkbox scale .88 → 1.1 → 1; mounted checked-text color softens | 150ms |
| Add a Path Pen corner | Only the new anchor fades/scales in; existing anchor active fill changes soften | 100ms |
| Enable/disable history or Path Pen actions | Button opacity transitions | 120ms |
| Show placement instructions | Fade and rise 3px | 140ms |
| Show/hide the empty Board prompt | Fade and scale .98 ↔ 1, including exit where discrete display transitions are supported | 140ms |
| Change save status | Status label fades .45 → 1; surface, border and text colors soften | 120ms label, 140ms colors |

There are no continuous animation loops. Pan, zoom, drag, resize coordinates,
caret placement, typing, drawing and eraser geometry remain immediate.

## Implementation and limits

- A transient visual-change subscription runs after the store accepts its new
  canonical state and before normal record/layout subscribers remove old DOM.
  Decorative callback errors cannot prevent history/autosave notification.
- Actual deletion is immediate. Only a short inert, aria-hidden preview survives.
  Simple blocks use sanitized static content; rich editors, media and large
  subtrees use a static summary. No editor or media lifecycle is retained.
- Initial load, confirmed snapshot replacement, automatic height measurements,
  ordinary typing and viewport culling do not trigger block entrance effects.
  Undo restoration removes the corresponding old exit preview immediately.
- Lifecycle work admits at most 24 effects per transaction, 16 exit previews,
  48 pending entrances and 48 running script effects. Pending entrances expire
  after 250ms. Static copies are limited to 400 descendant elements. Offscreen
  or larger-than-2,000,000-screen-pixel surfaces skip lifecycle effects.
- Direct-child observation catches newly rendered cards without observing every
  rich editor keystroke. Path Pen reuses existing anchor DOM instead of rebuilding
  all anchors on each click.
- All new motion respects reduced motion. Changing that preference clears active
  script effects, pending entrances and exit previews. Unmount/reset also clears
  them. CSS motion and press transforms are disabled under reduced motion.
- Text style transitions apply to retained mounted native elements. Replaced
  editor nodes appear normally; this does not crossfade arbitrary rich-editor DOM.
  Empty-prompt exit transitions depend on browser support for discrete display
  transitions; unsupported browsers show/hide it immediately.
- Bulk/large/offscreen operations can intentionally omit decorative effects.
  No measured runtime-performance claim is made. Browser feel remains unverified.

New source responsibilities are split between scene orchestration, effect cleanup,
safe deletion previews, the mount component, editing notification and scoped CSS.
All new source files are below 500 lines; the changed workspace is 494 lines.

## Actual checks

- Focused formatting: passed (exit 0).
- `npm run types:check`: passed (exit 0).
- `npm run lint`: passed (exit 0); 728 correctly formatted files and no warnings
  or lint errors in 614 analyzed files.
- `npm run build`: passed (exit 0, 14.64s). Existing dynamic-import, chunk-size
  and plugin-timing warnings remain.
- `git diff --check`: passed.
- No automated tests written or run. No Playwright or browser automation used.
- No PHP/backend changes or migrations in this pass. Browser interaction,
  accessibility behavior and runtime performance require manual review below.

## Manual checklist

Reload the frontend and open a disposable Board with motion preferences enabled.

1. **Creation:** place text, a list, a divider and a resource block; duplicate and
   paste a block. Expect short pop-up entrances for inactive surfaces. A focused
   new text editor and a released drawing should fade without moving the caret
   or ink. Type immediately: expect immediate input without repeated pops.
2. **Deletion/history:** delete a simple text block and a drawing, cut a block,
   then Undo/Redo. Expect a short inward shrink/fade on removal and an entrance
   on restoration. Rapidly Undo during deletion: expect one restored block and
   no lingering ghost. Wait for Saved, reload: expect the actual final state.
3. **Rich deletion:** remove a code/editor/media/resource block. Expect a brief
   static summary where cloning would duplicate rich work. During the exit,
   try clicking/tabbing: the preview must never accept focus, clicks or edits.
4. **Editing:** enter/leave text and list editing, change block type, alignment,
   writing direction and list style. Expect small settle/fade feedback without
   focus loss. Type, select text and use IME: expect no per-keystroke animation.
5. **Styles:** select existing Pen, Path Pen and Highlighter drawings and change
   color/width. Expect short color/thickness transitions and the final correct
   shape. Undo/Redo and reload: expect persisted styles unchanged by animation.
   Change native text/list colors: expect retained styled elements to soften;
   recreated editor nodes may update immediately.
6. **Selection/resize:** hover/select/unselect blocks. Expect smooth outlines and
   handles appearing; hover and press handles for grow/compress feedback. Drag,
   resize, pan and zoom: expect exact pointer tracking without geometry lag.
7. **Drawing controls:** press tool and formatting controls, choose ink swatches,
   width presets and eraser sizes. Expect small confirmation pops and softened
   colors. Clicking Draw again must still only hide/show its settings while
   drawing remains active. Partial erasure must still leave one drawing block.
8. **Path Pen:** add several anchors, move the pointer, remove the last corner,
   finish and close paths. Expect only newly added anchors to pop; older anchors
   change fill without restarting. Finish/Cancel and history controls should
   fade between enabled/disabled states and remain responsive.
9. **Checklist:** toggle a native checklist item on/off. Expect a short checkbox
   bounce and softened checked text; state, history and autosave remain correct.
10. **Prompts/status:** place the first object, remove the last, choose/cancel a
    placement tool and edit until Saving/Saved changes. Expect empty prompt,
    placement hint and save-label transitions without extra prompts or controls.
11. **No replay/bulk:** reload an existing Board, pan objects out/in, then bulk
    duplicate/delete many blocks and quickly Undo. Expect no load/culling pop,
    bounded effects, responsive controls and no leftover previews. Not every
    block in a large action needs an effect.
12. **Reduced motion:** enable OS/browser reduced motion, reload and repeat
    creation, deletion, controls, Path Pen and styles. Expect immediate changes
    with no new motion. Switch the preference during an exit: expect immediate
    preview cleanup. Disable it again: subsequent actions should animate.
13. **Appearance/navigation:** repeat representative actions in light/dark,
    normal/frosted, fullscreen and narrow/touch layouts. Expect opaque readable
    controls, visible focus and restrained feedback. Navigate away during an
    animation and return: expect no stale preview or replayed entrances.

## Commit suggestions

- `feat(boards): add subtle lifecycle and interaction animations`
- `feat(boards): animate editing and drawing style feedback`
