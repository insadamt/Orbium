# Explorer stack return handoff correction

Focused fix within the existing explorer bulk-action review. No next phase started.

## Changes

- Reveal the original cards synchronously before removing the settled drag preview.
- Temporarily suppress original opacity transitions during that handoff to avoid a second fade/blink.
- Animate returning preview backgrounds, borders, outlines, and shadows to match the original cards.
- Retain overflow-button layout space in preview cards, with buttons disabled and invisible, avoiding title/layout shifts on return.
- Replace the overflow visibility rule based on focus-within with hover and keyboard-visible focus. Mouse focus remaining after a drag no longer leaves three dots visible.

No migrations or persisted format changes. No commit created.

## Validation

- Targeted frontend formatting and lint: passed.
- `npm run types:check`: passed.
- `npm run lint`: passed; 450 files formatted, no warnings or lint errors in 368 files.
- `npm run build`: passed, exit code 0, 11.59 seconds. Large-chunk, ineffective dynamic import, and plugin timing warnings remain.
- `git diff --check`: passed.
- No automated tests written or run, per user instructions. Visual behavior awaits manual verification.

## Manual checklist

1. Select several cards, drag them into a stack, and release over empty space with the pointer away from the original cards.
   - Expected: cards return and remain visible continuously, without blinking, a second fade, or title/layout shift. Three dots stay hidden.
2. Repeat with Escape, a single unselected item, and nonadjacent selections in Grid, List, and Gallery.
   - Expected: the same continuous return; selected borders remain, with no checkmarks.
3. After release, hover a returned card and then move the pointer away.
   - Expected: only the hovered card shows its three dots; they hide when the pointer leaves despite retained mouse focus.
4. Tab to a card or its overflow button and open its actions.
   - Expected: keyboard focus reveals the button and actions remain usable.
5. Repeat cancellation and valid folder/reorder drops in Normal/Frosted, Light/Dark, and reduced-motion appearance.
   - Expected: no blink at the return handoff; valid group moves remain saved and reduced motion switches without animated travel.

Suggested commit: `fix(hierarchy): prevent drag return flicker and lingering overflow buttons`
