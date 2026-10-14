# Phase 7 review — page opening reveal

Date: 2026-10-14.

## Implemented

Opening a page within the current app tab now reveals its content with an 18px
upward glide over 320ms. The initial ready surface also gets this reveal.
Switching between separate app tabs keeps the existing 14px directional glide
over 280ms. Motion follows the visible page rather than the requested URL, so an
outgoing retained document stays still while its replacement loads.

Page identity uses the visible route path. Query/hash changes and background
refreshes do not replay the reveal. Split creation/removal keeps its existing
choreography, and focusing a split pane does not start a new reveal. Retained
documents keep their existing editor lifecycle. Positional offsets preserve fixed
editor controls; opacity remains unchanged to preserve frosted backdrop rendering.
Rapid navigation cancels prior motion. OS reduced motion skips playback and
cancels any active animation when enabled.

No dependencies, migrations or persisted formats changed. No commits created.
This change remains within Phase 7 motion polish.

## Validation

- Targeted `npx vp fmt`: PASS, two navigation files.
- `npm run types:check`: PASS.
- `npm run lint`: PASS, 477 formatted files and 392 linted files, no warnings/errors.
- `npm run build`: PASS, 18.09 seconds. Large-chunk, ineffective dynamic-import
  and plugin-timing warnings remain.
- `git diff --check`: PASS.
- Automated tests were neither written nor run, per user instructions.
- Browser appearance and perceived smoothness await manual review.

## Exact manual checklist

Hard-reload once to load the rebuilt assets. Use disposable content for editing.

1. Open a workspace, enter a folder, then open a document within the same tab.
   Expected: each arriving page briefly glides upward and settles, without an
   outgoing-page animation or an added exit delay.
2. Reload a document and visit database, Settings and Library pages.
   Expected: the first ready page reveals once and each same-tab route opening
   receives the same upward motion.
3. Open two app tabs and switch left/right, including a cached document.
   Expected: the existing directional horizontal glide remains; content, selected
   tab and URL agree. Scroll a long document, switch away and return; its scroll
   and editor state should remain intact.
4. Edit a disposable document, wait for Saved, change database filters or Library
   search, and rename the active tab. Expected: these updates do not replay the
   page reveal. Reload the edited document and confirm the change persisted.
5. Open several pages quickly, then use navigation Back/Forward. If practical,
   throttle the network and open an uncached document. Expected: the latest
   destination settles with no lingering offset; outgoing content stays still
   while waiting for a ready destination.
6. Split two documents, focus each pane, navigate to a separate tab and return,
   then end the split. Expected: pane focus does not reveal the workspace;
   split creation/removal retains its existing motion; separate tab switches
   retain their directional glide.
7. Enable OS Reduce Motion and open pages/switch tabs. Expected: immediate
   content changes with no glide. Enabling it during playback should immediately
   clear the offset. Disable it and verify later navigation animates again.
8. Repeat openings in Light/Dark and Normal/Frosted appearance. Open editor menus
   and the Contents rail during/after arrival. Expected: readable surfaces,
   preserved backdrop blur and viewport-anchored fixed controls.

## Commit suggestions

- `feat(navigation): reveal pages on opening`
- `feat(ui): add reduced-motion-aware page entrance animations`
