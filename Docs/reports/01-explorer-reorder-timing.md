# Explorer reorder timing review

Focused motion adjustment within the existing explorer review; no next phase started.

Changed layout shifts and stack settling from 300 ms to 600 ms, using power2.inOut easing for a gentler start and finish. Gap closing, slot restoration, and saved sibling reorders use this calmer timing. No persistent format changes or commit created.

Validation: TypeScript passed; formatting/lint passed (451 files formatted, no warnings or lint errors in 369 files); production build passed in 12.61 seconds with the existing chunk/import/plugin timing warnings; git diff --check passed. No automated tests written or run.

Manual checklist:

1. Select multiple items and drag: remaining siblings close gaps more slowly and smoothly.
2. Release over empty space or press Escape: the stack and remaining siblings settle over approximately 600 ms without blinking.
3. Reorder siblings in Grid, List, and Gallery: cards glide into saved positions at the same pace. Reload confirms ordering.
4. Enable reduced motion: positions still update immediately.

Suggested commit: `fix(hierarchy): slow explorer reorder and settling animations`
