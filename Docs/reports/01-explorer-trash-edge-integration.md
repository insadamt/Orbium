# Explorer Trash target integrated with viewport edge

Focused visual correction within the existing explorer review; no next phase started.

The drag-to-Trash target now sits flush against the bottom viewport edge. Removed its rounded card, border, tinted panel background, and detached slide animation. The icon/label sit directly over a broad red gradient originating below the viewport, fading into the screen. Hover strengthens the effect from its bottom origin. The target fades in/out in place and keeps existing deletion/recovery behavior.

Validation: targeted formatting/lint passed; TypeScript passed; full formatting/lint passed (454 files formatted, no warnings or lint errors in 371 files); build passed in 11.09 seconds with existing chunk/import/plugin timing warnings; git diff --check passed. No automated tests written or run. No persistent format changes or commit created.

Manual checklist:

1. Drag selected items: the delete affordance fades into the bottom edge without a floating panel or gap beneath it.
2. Hover and leave the target: the red ambient strengthens and softens while staying anchored to the bottom edge.
3. Drop on the target: the group fades into it and moves to restorable Trash.
4. Press Escape instead: items return, and the effect fades away.
5. Repeat in Light/Dark, Grid/List/Gallery, and reduced motion; scroll before dragging.
   - Expected: readable labels, a viewport-anchored effect, consistent deletion, and immediate reduced-motion changes.

Suggested commit: `style(hierarchy): blend drag-to-trash target into viewport edge`
