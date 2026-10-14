# Phase 7 review — smooth tab content switching

Date: 2026-10-14.

## Implemented

App-tab content now settles into place with a 14px horizontal glide over 280ms.
Its direction follows the destination's tab-strip position. The workspace uses
a positional offset rather than a transform so fixed editor controls keep their
viewport anchoring. Opacity stays unchanged to preserve frosted backdrop rendering.

The transition follows the visible surface rather than the requested tab, keeping
outgoing documents still while an uncached destination loads. Retained editors
continue using their existing mount, selection, undo, scroll and autosave lifecycle.
Initial loading, navigation within one tab, cached-page refreshes and pane focus
do not replay the transition. Split creation/removal continues using its existing
animation; switching between separate split groups animates the whole destination.

Rapid switches cancel the previous animation. Operating-system reduced motion
skips animation and cancels playback immediately when enabled. No dependencies,
migrations or persisted formats changed. No commits created.

## Validation

- Targeted `npx vp fmt`: PASS, three files.
- `npm run types:check`: PASS.
- `npm run lint`: PASS, 476 formatted files and 391 linted files; no lint warnings/errors.
- `npm run build`: PASS, 9.80 seconds. Large-chunk, ineffective dynamic-import and plugin-timing warnings remain.
- `git diff --check`: PASS.
- Automated tests were neither written nor run, per user instructions.
- Visual smoothness and large-document performance await manual review.

## Exact manual checklist

Hard-reload once to load the rebuilt assets. Use disposable documents for edits.

1. Open two document tabs and visit both. Switch left and right repeatedly.
   Expected: destination content glides briefly from that direction and settles;
   no transparent flash, lingering offset, or navigation delay added by an exit.
2. Open workspace, folder, database, Settings and Library tabs. Switch among them.
   Expected: each destination gets the same short glide; selected tab, URL and
   content agree. A background server refresh does not replay the animation.
3. Scroll a long document well down, switch away, then return. Open its outline
   and editor menus and type in a disposable copy. Expected: scroll and editing
   state remain intact; fixed controls stay anchored. Wait for Saved, reload and
   confirm the edit persists. Repeat with a large document and assess smoothness.
4. Click three tabs quickly, then close a saved active tab. Expected: the last
   selected tab wins, content settles normally, and closing reveals the next tab
   without leftover animation. Reordering or renaming the active tab alone should
   not start a content glide.
5. Reload with several restored tabs; throttle the Network and select an unvisited
   document. Expected: outgoing content stays visible while loading; the glide
   starts when the destination appears. Navigate into a folder within one tab.
   Expected: this tab-switch animation does not replay for same-tab navigation.
6. Split two saved documents, click between panes, switch to another ordinary tab
   and back, then end the split. Expected: pane focus alone does not glide; the
   group glides when entered from a separate tab; split creation/removal retains
   its existing animation and each pane still scrolls independently.
7. Enable OS Reduce Motion and switch tabs. Expected: content changes immediately
   with no glide. Enable the preference during playback if practical. Expected:
   the offset clears immediately. Disable it and verify subsequent switches animate.
8. Repeat ordinary switches in Light/Dark and Normal/Frosted appearance modes.
   Expected: text stays readable and frosted surfaces retain their backdrop.

## Commit suggestion

`feat(navigation): add smooth directional tab content transitions`

Remain within the requested motion polish scope for manual review.
