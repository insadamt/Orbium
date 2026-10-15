# Image width animation

Phase 7 review — 2026-10-15.

## Implemented

- Added a shared 260 ms width transition to image figures in Markdown/CodeMirror and legacy JSON/Tiptap documents. Fill available width expands smoothly; smaller keyboard widths and undo animate back down.
- Height follows the image's natural proportions. Figure layout moves captions, toolbar placement and subsequent content with the width change without scaling text or control icons.
- Corner dragging disables the transition and begins at the current displayed width, including when it interrupts a Fill animation. Releasing restores command-driven motion.
- Markdown's existing image-size observer updates the width label and requests editor measurement as the figure changes size.
- OS reduced motion switches widths immediately.

The Fill command, persisted width, resize limits, undo history and autosave keep their existing behavior. No migrations, new dependencies, format changes or commits. This remains within Phase 7.

## Validation

- Scoped formatting/lint: PASS.
- `npm run lint`: PASS; 498 files formatted and 409 source files linted without warnings/errors.
- `npm run types:check`: PASS.
- `npm run build`: PASS; existing large-chunk, overlapping-import and plugin-timing warnings remain.
- `git diff --check`: PASS.

No automated tests written or run, per user instructions. Browser visual and interaction acceptance remains pending manual review.

## Manual checklist

1. Open a document with a loaded image narrower than the editor. Select it and click Fill available width. Expected: the image expands over approximately 260 ms, keeps its aspect ratio and stops at available width; its caption/toolbar follow its changing layout.
2. Undo Fill, then redo it. Expected: the image shrinks back and expands again smoothly; one undo reverses the width edit.
3. Focus a corner resize handle and use Left/Right, then Shift+Left/Right. Expected: keyboard size changes animate in both directions while respecting width limits. In Markdown, the width label follows the displayed width during animation.
4. Drag a corner to make the image smaller or larger. Expected: the image follows the pointer immediately without transition lag. Release and click Fill again: expected smooth expansion resumes.
5. Click Fill and immediately grab a corner during expansion. Expected: dragging begins from the current visible size without jumping to the animation's final size.
6. Repeat Fill/Undo with left-, center- and right-aligned images. Expected: the appropriate alignment edge or center stays anchored as the image grows or shrinks. Already-full-width images stay stable.
7. Wait for Saved and reload. Expected: the final width and alignment persist, with no automatic Fill on reload.
8. Repeat in a narrow/split document and a legacy JSON/Tiptap document if available. Expected: no horizontal overflow, correct final size and independent pane behavior.
9. Enable OS reduced motion. Expected: Fill, keyboard sizing and undo/redo apply immediately; drag resizing remains responsive.

Suggested commit: `feat(editor): animate image fill and width changes`
