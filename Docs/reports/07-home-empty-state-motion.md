# Home no-results motion — 2026-10-28

This report describes the requested appearance/disappearance animation for the centered home no-results state. It depends on the installed Motion library, explorer filter state, and shared viewport layout. It extends `07-home-feedback-style-correction.md` without changing filtering or persistence.

## Changes

- The icon, heading, guidance and action enter together with a 240 ms eased fade, 12 px upward settling and subtle 0.98-to-1 scale.
- They exit with a 180 ms fade and a small upward movement/scale change.
- Presence keeps the exiting surface mounted until the animation completes. The surface leaves layout immediately, so returning cards are not delayed and no blank slot is reserved.
- The exiting surface is inert and its reset action disabled. Rapid empty/nonempty changes reuse the same keyed surface rather than creating duplicate messages.
- OS reduced motion displays/removes the state immediately without travel or scale animation.
- No artificial height, persistent timers, backend changes, migration or new dependency. Genuine empty containers and the compact Reveal notice keep their existing behavior.

## Validation

- Targeted formatting: passed.
- `npm run lint`: passed; all 865 files formatted correctly, no warnings/errors across 695 linted files.
- `npm run types:check`: passed.
- `npm run build`: passed in 16.09 seconds, with chunk-size, mixed-import and plugin timing warnings.
- `git diff --check`: passed.
- No automated tests or browser automation written/run. Animation appearance and scroll behavior require manual verification.

## Manual checklist

1. In a populated workspace, search for an absent title. Expected: the centered group fades and settles into place together rather than appearing instantly.
2. Clear the search with its reset action or edit the query to match a page. Expected: the group fades/moves out; matching cards return immediately without waiting for the exit.
3. Quickly alternate matching and nonmatching queries. Expected: no duplicate messages, leftover faded surface or blocked card clicks.
4. Repeat in Grid, List, uniform Gallery and natural Gallery. Expected: both directions animate and do not introduce blank-page scrolling.
5. Repeat in Light/Dark and Normal/Frosted. Expected: existing surfaces and typography remain intact through the animation.
6. Enable OS reduced motion and repeat steps 1–2. Expected: immediate changes without translation/scale animation.
7. Navigate away while the state is entering/exiting and return. Expected: no leftover overlay and normal navigation/filtering.

## Commit suggestion and stop

No commit created. Suggested commit: `feat(explorer): animate no-results appearance and dismissal`

Remain on the current home-page polish review.
