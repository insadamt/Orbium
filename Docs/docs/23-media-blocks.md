# Uploaded video, audio, and PDF blocks

Approved 2026-10-16 as an editor/Library extension during the current review. No phase advancement.

## Insertion and reuse

The format-2 Markdown editor offers `/video`, `/audio`, and `/pdf`. Each opens a workspace Library picker restricted to that media type, with an Upload a new video/audio/PDF action. Search, sorting, refresh, and pagination keep that restriction. New uploads use the existing attachment upload limit (100 MiB by default, configurable downward with `ORBIUM_MAX_ATTACHMENT_MB`) and deployment limits still apply.

Files dropped or pasted into the editor use their detected upload type. Choosing `/file` remains a general non-image insertion path: supported media attachments also receive inline previews. Existing saved file links gain these previews automatically. Reuse references the original attachment ID and binary.

## Playback and reading

- Audio and video use Orbium's own playback controls: play/pause, seek, elapsed/total time, mute, and volume. Media uses the browser decoder without its default control bar.
- Filename/type headers, file size where available, monochrome icon actions, and theme-aware rounded surfaces replace the file/code editing toolbar. Replace/remove actions appear on hover, keyboard focus, and touch devices. General non-media file blocks retain their existing controls.
- PDF pages render through a lazy-loaded PDF.js worker. Inline controls provide previous/next page, page-number input, zoom buttons, and a zoom selector with Auto and 50–300% presets. Percentage zoom uses the PDF’s natural page size; Auto fills the available reader width. The fit-page-width button is removed. Fullscreen adds a left page-preview sidebar with current-page highlighting and a visibility toggle, first/last-page actions, and clockwise rotation. Thumbnails render lazily near the sidebar viewport and release canvases when scrolled away or closed. The main reader renders only the selected page. Page, zoom, rotation, and sidebar preference survive expanding/closing the same viewer. Focused-page shortcuts support Left/Right or Page Up/Down, Home/End, and +/−. Extracted page text is available to assistive technology; text selection, annotations, search, and forms remain outside this reader.
- PDF expands into an app modal inset 8px from the viewport, with the reader filling its available width and height. The inline PDF viewport is also taller (up to 620px or 70vh). Escape/Close restores focus; the same reader moves into the dialog, preserving page, zoom, and rotation. Audio has no fullscreen action. Video requests native fullscreen on the video element itself, showing only the video and browser playback controls; leaving fullscreen restores Orbium controls and trigger focus. Browser-native iOS video fullscreen is used when the standard API is unavailable. The video stage’s inline size limits do not apply in fullscreen. Unsupported browsers disable the video fullscreen action, and failed requests show a download fallback.
- Media never autoplays. Audio/video requests metadata for duration; nearby PDF readers load their first page when they enter the viewport margin. PDF.js and its rendering assets are served locally rather than from a CDN.
- Reordering a mounted Markdown media block retains its existing player/reader and source. PDF canvas pixels and loaded video frames are copied into the inert motion snapshots. Identical file references preserve separate state; actual source replacement still replaces the player.
- Hiding a document/browser tab pauses playback. Removing or unmounting a viewer releases its media source and closes its expanded view. Returning to a hidden tab does not resume automatically. Scrolling out of the virtualized editor viewport may unmount a player and reset its playback position.
- Replace and Remove use document history/autosave and preserve block presentation wrappers. Removal deletes the reference, retaining the upload in Library. Downloads remain available.
- Supported nested file previews in callouts and table cells use the same player; editing remains owned by their enclosing block.

Browser playback depends on the codecs inside the container. Preview failures offer a download fallback; no server transcoding is added. Password-protected PDFs retain a download option for opening in another PDF app. Large PDF pages have bounded rendering dimensions and are rendered one page at a time.

PDF rendering follows the [PDF.js document/page/render lifecycle](https://mozilla.github.io/pdf.js/examples/). Versioned fonts, CMaps, color profiles, and WebAssembly assets are copied with [vite-plugin-static-copy](https://github.com/sapphi-red/vite-plugin-static-copy) for both local development and production builds, including their distributed licenses.

The preview allowlist is MP4, WebM, Ogg, and QuickTime video MIME types; MPEG/MP3, MP4/M4A, Ogg, WebM, WAV, FLAC, and AAC audio MIME types; and `application/pdf`. Other uploads remain downloadable generic files. The server determines MIME from file contents rather than trusting the filename or the browser's supplied MIME.

## Library

The main Library offers All, Images, Videos, Audio, PDFs, and Files. Files includes all non-image uploads, including playable media and PDFs. Type-specific listings support the existing search, sort, pagination, remembered position, and previous/next detail navigation. Cards distinguish video and audio with their own icons. Detail pages use the same players/readers as document blocks.

## Delivery and compatibility

Inline previews use existing authenticated workspace/document attachment routes. Only allowlisted media and supported images are served inline; other MIME types remain downloads. `?download=1` forces a download. Responses retain private caching and `nosniff`; Symfony BinaryFileResponse handles byte-range requests for seeking without loading the complete binary into PHP memory. Metadata requests reject unavailable storage binaries.

Canonical source remains `[label](orbium:attachment/ID)`. Video/audio/PDF are MIME-driven presentations of file references; there is no new directive, database migration, editor format version, or archive version. Existing reference validation, usage protection (including Trash), ZIP binary inclusion, and import ID remapping apply unchanged. Statistics continue to count these references under Files. Single `.orbie`/Markdown files retain the existing external/missing-asset transfer behavior; ZIP packages carry the referenced binaries.

The legacy format-1 Tiptap editor is unchanged. These insertion commands and document previews apply to the current format-2 Markdown editor; Library previews are available independently of document format.
