# Uploaded video, audio, and PDF blocks

Approved 2026-10-16 as an editor/Library extension during the current review. No phase advancement.

## Insertion and reuse

The format-2 Markdown editor offers `/video`, `/audio`, and `/pdf`. Each opens a workspace Library picker restricted to that media type, with an Upload a new video/audio/PDF action. Search, sorting, refresh, and pagination keep that restriction. New uploads use the existing attachment upload limit (100 MiB by default, configurable downward with `ORBIUM_MAX_ATTACHMENT_MB`) and deployment limits still apply.

Files dropped or pasted into the editor use their detected upload type. Choosing `/file` remains a general non-image insertion path: supported media attachments also receive inline previews. Existing saved file links gain these previews automatically. Reuse references the original attachment ID and binary.

## Playback and reading

- Video: native browser controls for play/pause, seeking, volume, and supported fullscreen behavior.
- Audio: native browser controls for play/pause, progress/seeking, and volume.
- PDF: Open PDF mounts the browser's embedded reader on request. Page navigation and zoom are provided by the browser reader. A Fullscreen action expands the preview where supported.
- Media never autoplays; audio/video uses `preload=none`. PDF readers are not mounted until requested.
- Hiding a document/browser tab pauses playback. Removing or unmounting a viewer releases its media source. Returning to a hidden tab does not resume automatically. Scrolling out of the virtualized editor viewport may unmount a player and reset its playback position.
- Replace and Remove use document history/autosave and preserve block presentation wrappers. Removal deletes the reference, retaining the upload in Library. Downloads remain available.
- Supported nested file previews in callouts and table cells use the same player; editing remains owned by their enclosing block.

Browser playback depends on the codecs inside the container. Preview failures offer a download fallback; no server transcoding is added. PDF embedding, controls, and fullscreen vary by browser, especially on mobile or installations with the built-in PDF viewer disabled. Use Download when a native reader is unavailable.

The preview allowlist is MP4, WebM, Ogg, and QuickTime video MIME types; MPEG/MP3, MP4/M4A, Ogg, WebM, WAV, FLAC, and AAC audio MIME types; and `application/pdf`. Other uploads remain downloadable generic files. The server determines MIME from file contents rather than trusting the filename or the browser's supplied MIME.

## Library

The main Library offers All, Images, Videos, Audio, PDFs, and Files. Files includes all non-image uploads, including playable media and PDFs. Type-specific listings support the existing search, sort, pagination, remembered position, and previous/next detail navigation. Cards distinguish video and audio with their own icons. Detail pages use the same players/readers as document blocks.

## Delivery and compatibility

Inline previews use existing authenticated workspace/document attachment routes. Only allowlisted media and supported images are served inline; other MIME types remain downloads. `?download=1` forces a download. Responses retain private caching and `nosniff`; Symfony BinaryFileResponse handles byte-range requests for seeking without loading the complete binary into PHP memory. Metadata requests reject unavailable storage binaries.

Canonical source remains `[label](orbium:attachment/ID)`. Video/audio/PDF are MIME-driven presentations of file references; there is no new directive, database migration, editor format version, or archive version. Existing reference validation, usage protection (including Trash), ZIP binary inclusion, and import ID remapping apply unchanged. Statistics continue to count these references under Files. Single `.orbie`/Markdown files retain the existing external/missing-asset transfer behavior; ZIP packages carry the referenced binaries.

The legacy format-1 Tiptap editor is unchanged. These insertion commands and document previews apply to the current format-2 Markdown editor; Library previews are available independently of document format.
