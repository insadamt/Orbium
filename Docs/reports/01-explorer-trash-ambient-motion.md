# Explorer blended Trash glow with idle and active motion

Focused visual refinement within the existing explorer review. No additional phase started.

## Changes

- Removed the 180px-high clipping region that gave the glow a rectangular edge; decoration now clips only at the viewport boundaries.
- Replaced the single gradient with three independently blurred layers that fade to transparency and blend into the bottom edge.
- Idle GSAP motion gently breathes/drifts the layers with different periods; active hover uses brighter intensity, faster pulses, and stronger expansion.
- Hover state changes keep current visual values so switching between idle and active does not reset the glow abruptly.
- Motion responds to the reduced-motion preference with a still field and immediate active intensity. Loops and media contexts are stopped during cleanup.
- Existing drop-to-Trash, item-count, recovery, and keyboard action behavior remain intact.

No persistent format changes or commit created.

## Validation

- Targeted formatting/lint: passed.
- `npm run types:check`: passed.
- `npm run lint`: passed; 455 files formatted, no warnings or lint errors in 372 files.
- `npm run build`: passed, exit code 0, 10.89 seconds, with existing large-chunk and ineffective dynamic import warnings.
- `git diff --check`: passed.
- No automated tests written or run. The glow appearance and animation need user visual review.

## Manual checklist

1. Drag a selection and hold away from the delete target for about 10 seconds.
   - Expected: red light blends into the screen without a rectangular cutoff; independent layers slowly breathe and drift while idle.
2. Hover the target for several seconds, then move away. Repeat quickly.
   - Expected: brighter, quicker expansion/pulsing on hover and a smooth return to idle without a glow reset.
3. Drop on the target, then restore from Trash.
   - Expected: selected items are deleted/restored normally, and the glow fades out after the drop.
4. Press Escape during another drag.
   - Expected: cards return and the glow/loops disappear.
5. Repeat in Light/Dark, different viewport sizes, and reduced motion.
   - Expected: no visible clipping box or horizontal scrollbar; reduced motion shows a still glow with immediate hover intensity changes.

Suggested commit: `feat(hierarchy): add blended idle and active trash glow motion`
