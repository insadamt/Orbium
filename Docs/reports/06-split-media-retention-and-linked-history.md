# Split-page media retention and linked move history

## Scope

Follow-up to the user's split-page block move review. PDFs/videos still created
new viewers after a transfer; the user also requested one Ctrl+Z/Ctrl+Y operation
to undo/redo a cross-page move. This supersedes the independent-undo limitation
in the earlier split-page block move report. No migration phase advancement.

## Changes

- Transfer loaded PDF/video/audio player instances into the destination, with
  synchronous installation from cached attachment metadata. Original widgets
  relinquish ownership so their disposal cannot destroy the transferred player.
- Preserve PDF document/canvas, page, zoom, rotation and sidebar preferences.
  A width change can require a new raster; render into a separate canvas and keep
  the existing pixels visible until its replacement is ready.
- Preserve media playback time, volume, mute and prior playing/paused intent.
  Rebind resize, visibility, fullscreen and editing actions to the destination.
  Playback resumption is subject to browser policy.
- Carry nested players in callouts and table cells. Scope adoption to the moved
  range so an existing duplicate attachment cannot claim the incoming viewer.
- Use workspace Library binary URLs for player/image sources; metadata and
  document edits keep their existing authorized routes. Original-page removal
  does not invalidate a retained player's binary URL.
- Capture the outgoing motion snapshot before media adoption, retaining visible
  PDF pixels and video frames for the exit animation. Snapshot media checks use
  element names because adopted iframe media retains its original realm's
  prototype; both entrance and exit snapshots therefore retain their pixels.
- Link each insertion/removal with inverse history effects. Ctrl/Cmd+Z and
  Ctrl+Y/Ctrl/Cmd+Shift+Z reverse/reapply both pages. Each editor executes its own
  CodeMirror history command in its own window realm.
- Newer local edits undo normally first. A counterpart with newer edits, no
  longer mounted, read-only or composing blocks paired reversal with a notice.
  Redo branches invalidated by new edits cannot reverse only half a move.
- Transfer preview collection also parses nested callout bodies and table cells
  for prepared Mermaid/math output.

## Block audit

| Blocks | Handling |
|---|---|
| Paragraphs, headings, lists/checklists, quotes, dividers, mentions and inline formatting | Complete Markdown source and presentation metadata; normal synchronous preview decorations |
| Code | Source/language preserved; destination code editor owns editing/highlighting |
| Tables and callouts | Content/presentation preserved; nested prepared previews and media included |
| Mermaid, display math and inline math | Reuse prepared sanitized/rendered output before insertion |
| Images | Preserve source/presentation and use stable workspace binary URLs |
| Generic files | Reuse loaded metadata and rebuild page-owned download/edit controls |
| PDF | Transfer the loaded reader and canvas; preserve page/zoom/rotation |
| Video/audio | Transfer the loaded media element and controls; preserve playback state |
| Empty/presentation wrappers | Preserve canonical source and normal destination decorations |

## Persistence and commits

No API, migration, dependency or canonical-content-format changes. Autosaves are
still separate requests, not an atomic two-page server transaction. Linked
history lasts while the participating editors remain mounted; reload resets it.
Virtualized viewers that were already unmounted cannot retain a loaded instance.
No browser/device acceptance is claimed.

No commit created. Suggestions:

- `fix(editor): retain media players across split-page block moves`
- `feat(editor): link undo and redo for cross-page block moves`

## Manual test checklist

Use two disposable Markdown Live Preview pages in the same workspace.

1. Load a PDF in A. Select page 3 and 150% zoom; expand, rotate and close. Move
   the block to B and back. Expected: current page, zoom, rotation and loaded
   canvas survive; no return to page 1 or initial document-loading placeholder.
2. Repeat between panes of different widths using Auto zoom. Expected: the old
   page stays visible while the new size renders, then swaps cleanly; reader
   controls/fullscreen/Close still work in the destination.
3. Play a video, seek forward and change volume/mute. Move while playing, then
   while paused. Repeat for audio. Expected: loaded player/time/volume persist;
   paused media stays paused, and playing media resumes when the browser permits.
4. Move a callout/table containing PDF/video/audio, including two references to
   the same file with different page/time positions. Place another reference to
   that file in B first. Expected: each instance retains its own state; the
   existing destination instance is not replaced or swapped with the moved one.
5. Move paragraphs, headings, nested lists/checklists, quotes, dividers, code,
   tables, callouts, styled/RTL blocks, images, generic files, mentions, Mermaid,
   display math and inline math in both directions. Expected: complete content
   and presentation survive, rich previews stay rendered and destination editing
   controls operate on B rather than changing A. Check nested diagram/equation
   previews too. Images/downloads remain available after deleting original A.
6. Move a paragraph A → B and press Ctrl+Z once with focus in A; repeat with
   focus in B. Expected: each undo restores the block only in A and removes it
   from B. Ctrl+Y restores the full move. Repeat using Ctrl/Cmd+Shift+Z, rich
   block controls and immediately after dropping without clicking the editor.
7. Repeat step 6 for PDF, video and nested media. Expected: the reader/player
   moves back/forward without resetting its retained state or duplicating it.
8. Make two consecutive moves and undo twice, then redo twice. Expected: moves
   reverse/reapply in order across both pages, with each block appearing once.
9. Move a block and type in B. Ctrl+Z in B first removes the typing, then reverses
   the move across both pages. Try Ctrl+Z in A while B still has that newer edit.
   Expected: a notice blocks the move, and neither page is partially reversed.
10. Undo a move and type new content in either page. Attempt redo from the other
    page. Expected: the abandoned move redo is blocked; no half-transfer or
    duplicated content. Ordinary typing undo/redo and same-page reorder remain
    functional.
11. Close the other page before undoing a move. Expected: a notice requests both
    pages, with no partial reversal. Try an over-limit destination and cancel a
    drag with Escape. Expected: original content/player remains usable, with no
    source removal or orphaned viewer.
12. Repeat core moves/history with reduced motion, empty pages, wheel scrolling
    and both retained/iframe-backed panes. Expected: correct placement and
    cleanup. Wait for both Saved states and reload; expected: final content
    persists and the normal fresh editor history starts empty.

## Validation

Automated tests were neither written nor run, per the user's instructions.
Final formatting, lint, type/build and diff results are recorded below.
Unrelated concurrent navigation/scrolling changes are left intact.

- Targeted formatting: passed.
- `npm run types:check`: passed (exit 0).
- `npm run lint`: passed (exit 0); 556 files formatted correctly, no warnings
  or lint errors in 462 files.
- `npm run build`: passed (exit 0), 13.31 seconds. Existing large-chunk,
  mixed static/dynamic import and plugin-timing warnings remain.
- `git diff --check`: passed (exit 0).

No PHP files changed, so PHP checks were unnecessary. Changed/new source files
for this follow-up remain under 500 lines. The initial type check found an
inferred empty-history-array type; explicitly typing the registry fixed it.
The final checks above passed after all implementation changes.
