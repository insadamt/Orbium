# Explorer rearrangement speed adjustment

Changed layout rearranging and stack settling from 600 ms to 420 ms, retaining power2.inOut easing. This covers gap closing, restoring slots, and saved sibling reorders. No persistent format changes or commit created; no next phase started.

Validation: TypeScript passed; formatting/lint passed (454 files formatted, no warnings or lint errors in 371 files); build passed in 11.79 seconds with existing chunk/import/plugin timing warnings; git diff --check passed. No automated tests written or run.

Manual checklist:

1. Drag several selected items: the remaining cards close gaps at the quicker 420 ms pace.
2. Release over empty space or press Escape: stack settling and slot restoration finish at the same pace without blinking.
3. Reorder items in Grid, List, and Gallery: saved positions animate smoothly and persist after reload.
4. Enable reduced motion: changes still apply immediately.

Suggested commit: `fix(hierarchy): tune rearrangement animations to 420ms`
