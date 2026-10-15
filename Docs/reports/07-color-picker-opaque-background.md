# Opaque color picker background

Phase 7 review — 2026-10-15.

The text color picker now uses the opaque light/dark popover color in both Normal and Frosted appearances. A picker-specific CSS rule overrides the shared translucent glass treatment and disables backdrop filtering. The spectrum, hue strip, swatches, hex input and Default action retain their behavior.

No persisted format changes or commits. Existing staged work was preserved.

## Validation

- Scoped CSS formatting: PASS.
- `npm run lint`: PASS; 497 files formatted, 409 source files linted without warnings/errors.
- `npm run types:check`: PASS.
- `npm run build`: PASS; existing large-chunk, overlapping-import and plugin-timing warnings remain.
- `git diff --check`: PASS.

No automated tests written or run, per user instructions. Visual acceptance remains for manual review.

## Manual checklist

1. Open a document over a bright wallpaper or visible text and open Text color. Expected: the picker panel has an opaque background; content behind it does not show through.
2. Repeat in Light/Dark and Normal/Frosted. Expected: a solid theme-appropriate picker in every combination, with readable labels and controls.
3. Choose a preset, spectrum color and custom hex value, then Default. Expected: only the selected text changes and all picker actions work as before.

Suggested commit: `fix(editor): make color picker background opaque`
