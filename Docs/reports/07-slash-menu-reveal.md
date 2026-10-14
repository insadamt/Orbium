# Slash menu reveal correction

Phase 7 review — 2026-10-14.

## Change

The slash/mention popup previously scaled the same DOM element CodeMirror measures
and repositions. The entrance animation could therefore affect the placement
measurements while opening.

The popup now keeps its measured dimensions stable and fades in over 140 ms after
CodeMirror's first successful positioning callback. It remains invisible during
offscreen setup. Filtering and subsequent positioning do not restart the fade.
The adapter preserves the existing tooltip callback and cleans up on dismissal.
Reduced motion reveals immediately after placement. Hover-bar movement is unchanged.

No migrations or content-format changes. No commit created. Unrelated checkbox
edits were left untouched.

## Validation

- `npm run types:check`: PASS.
- `npm run lint`: PASS; 476 files formatted correctly and 391 files linted without warnings/errors.
- `npm run build`: PASS; bundle-size, mixed-import and plugin-timing warnings remain.
- `git diff --check`: PASS.
No automated tests written or run. Browser visual acceptance remains pending.

## Manual checklist

1. Hard reload a document. Type `/` on an empty line, dismiss with Escape and repeat several times. Expected: one brief fade at the final position, with no scaling, jump or flash.
2. Open `/` near the bottom and right edges of the viewport and in an RTL paragraph. Expected: the menu chooses its position before becoming visible and stays within the viewport.
3. Type `/head`, delete back to `/`, hover rows and use arrows/Enter. Expected: filtering does not replay the reveal; the hover bar remains smooth and the selected command inserts once.
4. Repeat with a mention and in a split document pane. Expected: each popup reveals smoothly at its own caret.
5. Enable OS reduced motion and reopen `/`. Expected: immediate appearance after placement, without a fade or scale.

## Commit suggestions

- `fix(editor): reveal slash menu after tooltip placement`
- `fix(editor): stabilize slash menu entrance animation`
