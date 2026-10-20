# Board PDF, video and audio blocks

Date: 2026-10-20. Phase 4 Board review; no later phase started.

## Implemented

- Dedicated Video, Audio and PDF choices in Add, with distinct icons, placement
  hints, empty prompts, selection labels and accessible block labels.
- Existing click/Enter placement and automatic return to Select.
- Matching upload accept lists and Library media filters, including replacement.
- Client validation for chosen Library files and server-detected upload/metadata
  MIME; server validation checks the saved attachment type and workspace ownership.
- Shared Document/Library PDF reader and video/audio players, retaining download,
  fullscreen where supported, captions, automatic content height and Board history.
- Existing Image and generic File remain available; generic File continues to
  preview supported media by MIME.

## Persistence and compatibility

Media choices are native `file` objects with optional `data.media_kind` equal to
`pdf`, `video` or `audio`. Existing attachment IDs/name/caption and usage extraction
are unchanged. No migration, dependency, new persisted block kind or version bump:
Board format 4 and native content format 1 remain. Existing objects need no rewrite.
Older servers reject the optional field; client and server must deploy together.
Removing the Board object retains the workspace Library binary.

## Validation

- Scoped `vp fmt` on the 11 changed Board TypeScript/TSX files: passed.
- `vendor/bin/pint app/Services/Boards/BoardBlockData.php`: passed.
- `vendor/bin/pint --test app/Services/Boards/BoardBlockData.php`: passed.
- `php -l app/Services/Boards/BoardBlockData.php`: passed.
- `npm run types:check`: passed after removing the obsolete resource-kind check
  from the placement callback; resource insertion has its own callback.
- `npm run lint`: passed; all 657 files formatted, 550 linted without warnings/errors.
- `npm run build`: passed. Warnings cover large chunks, mixed static/dynamic
  imports for Document UI modules, and plugin timings.
- `git diff --check`: passed.
- No automated tests were written or run, per the user's instructions.
- Browser/manual acceptance has not been performed by the agent.

## Manual test checklist

Use a Board and a workspace containing a multi-page PDF, a browser-supported MP4
or WebM video, and MP3 or WAV audio. Allow saves to finish before reloading or
checking Library usage.

1. Open Add. Expect Image, Video, Audio, PDF and File under Media. Choose PDF,
   then press Escape. Expect no block to be created and Select to be restored.
2. Choose PDF and click empty canvas. Expect one PDF placeholder at that location,
   its editing controls above it, and the Add tool returned to Select. Finish
   editing, choose Video and press Enter. Expect one Video placeholder at the
   view center. Repeat for Audio; dragging instead of clicking must not insert.
3. Edit the PDF block and choose from Library. Expect only PDFs, including after
   search, sorting, refresh and Load more where available. Choose a PDF. Expect
   the shared inline reader. Repeat for Video and Audio with their matching files.
4. Upload a matching new file into each type, including a drop into an empty block
   while editing. Expect the correct player/reader and no automatic playback.
   Replace from Library and upload replacement; expect both paths to keep the
   original type restriction.
5. In a fresh empty PDF block, drop an audio file while editing (or override the
   OS file filter). Expect a matching-type error and no attachment set. The upload
   remains in Library. Repeat with an incompatible file for Video or Audio. Then
   choose a correct file; expect the error to clear and the preview to load.
6. In the PDF reader, change pages and zoom, open fullscreen, close with Escape.
   Expect reader state to survive and focus to return. Scrolling the inline reader
   should scroll its content rather than pan the Board; Ctrl/Cmd-wheel should
   continue to zoom the canvas.
7. Play/pause, seek, mute and change volume for Video and Audio. Expect working
   playback without moving the Board. Open/exit video fullscreen where supported;
   Audio must have no fullscreen control. Hide the browser tab while playing;
   expect playback to pause and remain paused when returning.
8. Finish editing, select the block, press Enter to edit, add a caption, then finish.
   Move it, adjust width and scale from a corner. Expect readable media, fitting
   content/selection bounds and a preserved caption. Undo/redo replacement,
   movement and insertion; expect the previous references and layouts to return.
9. Wait for Saved and reload the Board. Expect all media references, labels,
   captions and positions to persist. Playback position/PDF page after a full
   reload is not persisted. Existing Image and File blocks must still work.
10. With a saved media block present, inspect its file in Library. Expect its saved
    Board usage to prevent deletion. Remove the block and wait for Saved; expect
    the file to remain in Library and its Board usage to disappear unless another
    saved reference (including Trash) still uses it.
11. Repeat Add, picker selection and fullscreen with keyboard navigation and a
    narrow viewport. Expect usable menus/controls and normal Escape dismissal.
    Repeat with reduced motion and Light/Dark appearance; expect the existing
    shared control behavior and styling.

## Limits and handoff

Browser codec support and existing upload/deployment limits still apply; no
transcoding or remote URL embeds are added. Preview failures retain download.
Playback/viewer state follows the existing mounted player lifecycle and can reset
when a block is culled/unmounted. Manual acceptance is pending.

Existing unrelated working-tree changes were preserved. No commit was created.

Suggested commit messages:

- `feat(boards): add PDF video and audio insertion tools`
- `feat(boards): support typed media uploads and Library reuse`

Remain in phase-4 manual review.

## Media movement correction — 2026-10-20

The user reported that loaded media blocks could not move. The player root carried
`data-board-interactive`, causing the Board pointer handler to ignore every player
descendant, including its filename header. The marker now applies only to PDF
reader, video stage and playback-control surfaces. Header text/icon/space can
select, drag and double-click to edit; download/fullscreen buttons retain normal
control ownership. The separate wheel-ownership marker stays on the player root.
No persistence or shared Document/Library player changes were needed.

Manual regression checklist (pending user review):

1. Finish editing, then drag the filename/type header of an existing loaded PDF,
   video and audio block. Expect selection and movement without playback actions.
2. Save and reload. Expect each moved block at its saved position. Undo/redo a
   move; expect the previous/new position without changing its attachment.
3. Click play/pause, seek and volume; use PDF page/zoom/scroll controls and both
   supported fullscreen actions. Expect normal controls with no block movement.
4. Double-click the filename header or select it and press Enter. Expect editing
   controls. Finish editing, then drag again; expect movement to work.
5. Shift-select two media headers and drag one. Expect both selected objects to
   move together. Check width/corner resizing, image movement and ordinary file
   download links; expect existing behavior.

Suggested fix commit: `fix(boards): allow dragging media blocks by their headers`

Correction validation: scoped `vp fmt`, `npm run types:check`, `npm run lint`,
`npm run build` and `git diff --check` passed. Build warnings remain for large
chunks, mixed static/dynamic Document imports and plugin timings. No automated
tests were written or run; browser acceptance is pending the checklist above.

## Video/PDF surface movement follow-up — 2026-10-20

The header-only change did not cover dragging the large video and PDF surfaces.
Interactive markers now cover only PDF/playback control strips. Inline PDF pages
can start Board selection/movement. Outside editing, video pixels pass pointer
input to their draggable stage; the Play button and playback controls remain
interactive. Native fullscreen videos retain input through their controls state.
PDF wheel scrolling and Ctrl/Cmd-wheel canvas zoom retain their existing behavior.
No persistence changes or automated tests.

Manual checklist (pending):

1. Finish editing a loaded Video. Drag the image away from the Play button;
   expect movement. Use Play, seek, volume and fullscreen; expect controls to work
   without moving the block. Exit fullscreen and drag the image again.
2. Finish editing a loaded PDF. Drag the rendered page; expect movement. Use
   page/zoom controls; expect their actions without movement. Wheel over the PDF;
   expect reader scrolling. Open fullscreen; expect normal reading controls.
3. Drag both headers, resize both blocks and undo/redo moves. Expect the original
   Board behavior. Wait for Saved and reload; expect final positions to persist.
4. Play/drag an Audio block and move an Image; expect no regression. Enter editing
   and use Done before moving, as for other native blocks.

Suggested commit: `fix(boards): enable dragging video and PDF preview surfaces`

Follow-up checks: scoped formatting, TypeScript, repository lint, production build
and whitespace validation passed. The build retains large-chunk and mixed
static/dynamic-import warnings. Browser verification remains pending user review.
