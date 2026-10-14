# Table of contents menu animation

Phase 7 review — 2026-10-14.

## Changes

- The Contents popup now uses a reversible 140 ms opacity fade with stable geometry, matching the slash popup's reveal. Its previous animated slide/scale is removed.
- Floating rail positioning runs before paint. A newly mounted rail remains hidden until its position and available dimensions are calculated.
- Heading rows use the same persistent moving hover bar as menus and slash suggestions. Keyboard focus and the current reading location also drive the bar; current-location attribute changes are observed.
- Pin/unpin, heading navigation, hierarchy indentation, independent scrolling, Escape/outside dismissal and split-pane ownership retain their existing behavior. Closing remains inert immediately; reduced motion skips the fade and hover travel.

No migrations, persisted-format changes or commits. Other work in progress is preserved.

## Validation

- `npm run types:check`: PASS.
- `npm run lint`: PASS; 476 files formatted correctly and 391 files linted without warnings/errors.
- `npm run build`: PASS; bundle-size, mixed-import and plugin-timing warnings remain.
- `git diff --check`: PASS.

Automated tests were neither written nor run. Browser visual review remains pending.

## Manual checklist

1. Hard reload a document with headings. Hover the Contents rail repeatedly. Expected: the panel fades at its final position without sliding, scaling or flashing at another location.
2. Move between headings slowly, quickly and with Arrow/Home/End keys. Expected: one moving hover bar settles without blinking; labels and indentation remain readable.
3. Pin the panel, move the pointer out, then scroll the document through sections. Expected: the panel stays open and the bar follows the current reading section when no heading is hovered/focused. Select a heading; expected: the correct section is reached.
4. Close/reopen rapidly, use Escape and outside clicks, and test pin/unpin. Expected: reversible fading, no stuck panel, and closed content cannot receive input.
5. Open Contents in two split panes, resize, and switch tabs. Expected: each panel remains positioned within its own document and never flashes at the page origin.
6. Repeat in light/dark, RTL and OS reduced motion. Expected: readable surfaces and correct navigation; reduced motion reveals immediately and removes hover travel.

## Commit suggestions

- `feat(editor): match contents popup to shared menu motion`
- `fix(editor): stabilize table of contents reveal`
