# Contents navigation blink correction

Phase 7 review — 2026-10-14.

## Changes

- Removed the preliminary jump to a heading, two-frame wait, and return to the original position before the scroll tween. That sequence exposed the destination before smooth navigation began.
- Markdown now selects and focuses without a scroll effect, then measures the heading during CodeMirror's measurement cycle. Offscreen headings use CodeMirror's line-block geometry without first rendering them through a scroll jump.
- Legacy rich text measures its heading element without changing scroll position. Both editors use one bounded scroll destination with the existing 96px controls inset.
- Smooth scrolling, interruption, cancellation, pinned panels, reduced motion and split/iframe pane ownership remain supported.

No migrations, persisted-format changes, dependencies or commits.

## Validation

- Targeted `npx vp fmt`: PASS; three source files.
- `npm run types:check`: PASS.
- `npm run lint`: PASS; 475 files correctly formatted, 390 files linted without warnings/errors.
- `npm run build`: PASS; 21.14 seconds. Mixed-import, bundle-size and plugin-timing warnings remain.
- `git diff --check`: PASS.

Automated tests were neither written nor run, as requested. Browser visual acceptance remains pending. Offscreen CodeMirror geometry can be estimated before its destination is rendered; landing accuracy in long documents with media needs manual verification.

## Manual test checklist

1. Reload a document with H1/H2 headings separated by several screens of text. From the top, hover Contents and click a distant title. Expected: one smooth scroll to the heading below the floating controls, with no flash of the destination followed by a return to the starting position; the unpinned panel closes.
2. Select headings above and below the current section, including the first and last headings and duplicate titles. Expected: the correct destination each time, without blinking or a late jump. Near the document end, the scroll stops at its available limit.
3. Repeat in a long Markdown document with images, tables and diagrams between headings, then in Source mode. Expected: distant headings land correctly in both modes and previews remain intact. Repeat in an existing legacy JSON/Tiptap document if available.
4. Pin Contents and click successive headings, including a second selection while scrolling. Expected: the panel stays open and the latest selection replaces the previous navigation. Wheel, touch, PageDown or a click in the document stops automated scrolling.
5. Open two documents in split view and navigate in each pane. Repeat with an iframe-backed pane if available. Expected: only the selected document's owning pane scrolls; the other document and outer page stay at their positions. Switch tabs during a scroll; expected: no delayed navigation after returning.
6. Enable OS/browser reduced motion, reload and select headings with mouse and keyboard (Tab, arrows, Enter). Expected: immediate navigation without blinking, correct focus and usable Contents controls. Disable reduced motion; expected: smooth scrolling resumes.
7. Make an edit before using Contents, wait for Saved and reload. Expected: the edit persists; heading navigation itself does not change document text or add a content undo step.

## Commit message suggestions

- `fix(editor): prevent blinking during contents navigation`
- `fix(editor): measure heading destinations before scrolling`

Remain in the current review phase pending manual feedback.
