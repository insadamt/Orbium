# Video, audio, and PDF blocks

Date: 2026-10-16. Approved editor/Library extension during the current review; no phase advancement. Implementation ready for manual acceptance.

## Implemented

- Added `/video`, `/audio`, and `/pdf` to the current Markdown editor's keyboard-operated slash menu. Each command opens a type-restricted Library picker with upload and reuse actions.
- Added inline video/audio players and an on-demand embedded PDF reader. Shared viewers also render supported nested file previews and Library detail previews.
- Added native playback controls, video/PDF fullscreen actions, download fallback, no autoplay, `preload=none`, and playback cleanup when viewers unmount. Hidden document/browser tabs pause playback without automatic resumption.
- Added Videos, Audio, and PDFs Library filters, video/audio card icons, filter persistence, and existing filtered detail navigation. Files still includes all non-image files.
- Added allowlisted inline attachment responses and retained forced downloads through `?download=1`. Existing authorized BinaryFileResponse delivery supplies byte-range handling. Metadata rejects missing binaries.
- Preserved canonical attachment links, workspace ownership, reuse, saved usage protection, autosave/history, and the existing export/import reference mechanism.
- Updated product/editor/Library documentation and added `Docs/docs/23-media-blocks.md`.

## Persistence and compatibility

No migration, dependency, content-format version, or package-format change. Media type is derived from stored MIME metadata. Canonical content remains `[label](orbium:attachment/ID)`, so existing document ZIP inclusion and ID remapping apply unchanged. Runtime round-trip acceptance is part of the checklist below. Statistics continue to group these blocks/uploads under Files.

No commits were created, and no files were staged.

## Actual checks

- `npm run types:check`: passed.
- `npm run lint`: passed formatting for 532 files and lint for 441 files, with no warnings or errors.
- `npm run build`: passed. Build reports existing large chunks, ineffective dynamic imports, and plugin timing diagnostics.
- `./vendor/bin/pint --test`: passed.
- PHP syntax checks on `AttachmentController.php`, `AttachmentMediaTypes.php`, `LibraryBrowseData.php`, and `LibraryCatalog.php`: passed.
- `git diff --check`: passed.
- New source files are below 500 lines; the modified Markdown editor remains below 500 lines.
- No automated tests were written or run, per the user's instructions. Browser/manual acceptance has not been performed by Codex.

## Exact manual checklist

Use a new Markdown document and local files: a browser-playable MP4 larger than 1 KB, an MP3, a PDF with at least two pages, a PNG, and a TXT file. Keep uploads below the configured attachment limit.

1. **Upload three types:** On separate empty lines, enter `/video`, `/audio`, and `/pdf`, choose each command using arrows and Enter, and choose Upload a new video/audio/PDF. Select the matching local file. Expected: each upload inserts the appropriate player/reader block; video/audio remain paused and PDF shows Open PDF. Wait for Saved, reload, and confirm all three remain.
2. **Playback controls:** Play the MP4, seek forward/backward, pause, adjust volume, enter Fullscreen, and exit with Escape. Play/pause/seek the MP3 using pointer and keyboard controls. Expected: normal native playback without editor text selection stealing the controls; filenames remain downloadable. Browser codec limitations show a preview error rather than losing the file reference.
3. **PDF controls:** Click Open PDF, navigate to page 2, change zoom, enter Fullscreen, and exit. Expected: the browser reader stays inside Orbium and supports its native controls. In browsers without an embedded PDF reader, use the retained download link; native viewer behavior varies by browser.
4. **Library reuse:** Open Library and select Videos, Audio, and PDFs in turn. Search a filename, change sorting, refresh, and use Load more if available. Open a detail page and use previous/next. Expected: results and neighbors match the selected type; detail pages have the matching viewer. Return to the document and reuse each upload through its slash command. Expected: restricted pickers have no type-switch tabs, search/pagination stay restricted, and reusing files adds no duplicate Library binary.
5. **Existing flows:** Insert the MP4/PDF through `/file`, then drag/drop MP3 and MP4 files into separate blank editor lines. Insert PNG through `/image` and TXT through `/file`. Expected: supported media receives a viewer, images remain images, and TXT stays a downloadable file. `/file` still excludes images; cover/icon pickers remain image-only.
6. **Block editing/history:** Replace each new block with another file of the same kind, remove it, then undo/redo. Duplicate and move a media block through its block menu. Type above/below it, wait for Saved, and reload. Expected: references, ordering, surrounding text, and presentation survive; replacing a video/audio/PDF opens its matching picker. Download each file and confirm the correct original contents/name.
7. **Playback lifecycle:** Play audio/video and switch to another Orbium tab, hide the browser tab, switch Source/Live Preview, and remove the playing block. Expected: hidden/removed players stop and do not resume automatically. Return to the document and verify controls still work. Scrolling a player out of CodeMirror's mounted viewport can reset playback position when it remounts.
8. **Persistence and deletion protection:** Reuse one upload in a second document, wait for Saved, and inspect its Library details and Delete review. Trash the original document and check again. Expected: saved usage links include references, including Trash; used files cannot be permanently deleted. Removing one reference leaves other references and the Library binary intact.
9. **Package round trip:** Export a document containing all three types as a document ZIP with its referenced assets. Import the ZIP into a separate workspace and open the imported document. Expected: all three viewers open the imported files; attachment IDs refer to destination uploads, and download contents match. A single Markdown/`.orbie` export retains its existing missing/external-asset behavior and does not bundle binaries.
10. **Wrong types and unavailable files:** Through `/video`, switch the native file picker to All files if available and choose TXT. Expected: a clear type error and no inserted video reference. Repeat with a TXT renamed to `.mp4`: server-detected MIME must prevent insertion as video. Use a disposable unavailable attachment or a missing-reference export to inspect missing media. Expected: a missing-file placeholder/error and retained source, with no endlessly playing stale media.
11. **Ownership and byte ranges:** In browser DevTools, copy an MP4 preview request URL. While authenticated, request it with `Range: bytes=0-1023`. Expected: HTTP 206, `Content-Range`, and a private inline media response. Add `?download=1`: expected attachment download. Open the same media URL in a signed-out/private window or substitute another account's workspace: expected authentication/404, without media bytes. These runtime checks remain manual.
12. **Layout/regression:** Repeat key controls in Light/Dark, a narrow window, and split document panes. Try a PDF or media codec the browser does not support, and upload an HTML/SVG file through general Library upload. Expected: usable wrapped filters and bounded viewers; download remains available for unsupported previews; arbitrary HTML/SVG is downloaded rather than served inline. Existing image/file insertion and ordinary document editing remain usable.

## Known limitations

- Native media codec, PDF, and fullscreen support vary by browser. No transcoding, custom PDF renderer, streaming service, external embeds, or transcription was added.
- Media/PDF insertion commands and document previews target format-2 Markdown documents. The legacy format-1 Tiptap editor is unchanged; Library previews are available independently.
- Scrolling beyond CodeMirror's mounted region may dispose a player and reset its position. Positions are not persisted, and playback is never resumed automatically.
- Statistics retain existing Files categorization. No separate Video/Audio/PDF statistics counters were added.
- No browser or package-round-trip acceptance result is claimed from static checks.

## Commit suggestions

- `feat(editor): add video audio and pdf blocks with library reuse`
- `feat(library): preview media uploads and serve authorized inline files`

## Review boundary

Await the user's manual review; continue fixes within this approved editor/Library scope. Do not advance to another phase without explicit approval.
