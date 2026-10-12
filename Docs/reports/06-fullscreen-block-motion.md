# Editor review — Fullscreen block opening and closing motion

Date: 2026-10-12. Current Markdown editor review; manual acceptance pending.

## Changes

Table and Mermaid fullscreen previews share a restrained fade, vertical movement,
and scale animation: 220 ms on opening and 160 ms on closing. The backdrop fades
with the window. Reduced-motion preferences disable both animations.

The shared viewer now controls Radix's open state rather than immediately
destroying its React root on Close, Escape, or outside dismissal. Radix retains
the window through its CSS exit animation; the close autofocus event then disposes
the root and returns focus to the connected launch control. Source widget teardown
still disposes the viewer directly so obsolete previews do not linger.

Content mounting and initial fitting run in a layout effect before the first paint
to avoid an unfitted content flash during opening. Zoom, pan, and Fit retain their
existing behavior.

No dependencies, migrations, or persisted format changes. No commit created.
No next phase started.

## Validation

- Targeted `npx vp fmt`: passed for both changed source files.
- `npm run types:check`: passed.
- `npm run lint`: passed; 395 files correctly formatted and 325 linted without warnings or errors.
- `npm run build`: passed in 8.75 seconds. Existing large-chunk, ineffective-dynamic-import, and plugin-timing warnings remain.
- `git diff --check`: passed before this report; final check follows report creation.
- No automated tests written or run, per user instruction. Browser and visual acceptance remain pending.

## Manual test checklist

1. Reload a document with a Markdown table and a Mermaid diagram in Live Preview.
   Open each fullscreen preview. Expected: the backdrop fades in and the window
   gently scales and moves into place; content is fitted on its first visible frame.
2. Close each preview with the close icon, then reopen and press Escape, then
   reopen and click the exposed backdrop. Expected: each dismissal animates out,
   removes the backdrop, and returns focus to the corresponding launch control.
3. Open and immediately close each preview several times, including pressing
   Escape during the entry animation. Expected: no stuck window, backdrop, or
   blocked document; the launch control remains usable.
4. Zoom with the wheel and toolbar, drag to pan, and click Fit. Tab to the canvas
   and use plus/minus, arrow keys, and zero. Expected: zoom, pan, and fit continue
   to work; keyboard focus stays inside while the preview is open.
5. Repeat in Light and Dark appearance and with a narrow browser viewport.
   Resize an open preview. Expected: readable content and reachable controls;
   resizing refits content without replaying the opening animation.
6. Enable the operating system or browser's reduced-motion preference. Repeat
   opening and closing both previews. Expected: immediate visibility changes with
   no fade, scale, or movement; focus restoration and cleanup still work.
7. Open a preview and switch away from its document or remove its source widget
   using the available application navigation. Expected: no obsolete preview or
   backdrop remains after teardown. Reopen the document and preview successfully.

## Commit suggestions

- `feat(editor): animate fullscreen block previews`
- `feat(editor): smooth table and diagram preview transitions`

Await manual review within the current editor work.
