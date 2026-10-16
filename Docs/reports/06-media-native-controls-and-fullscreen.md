# Media appearance and fullscreen correction

Date: 2026-10-16. Current editor/Library review; no phase advancement. Supersedes the browser-control presentation described in the initial media report.

## Changed

- Replaced the audio/video browser control bars with Orbium playback controls: monochrome play/pause, seeking, elapsed/total time, mute, and volume. Video has a centered play affordance and keyboard playback/seek support.
- Replaced the media blocks' file/code-style Edit source/Preview toolbar and duplicate download/MIME footer with compact filename/type headers, subtle rounded surfaces, and icon actions. Replace/remove actions appear on hover/focus and remain visible on touch devices. General file blocks retain their original text actions.
- Replaced the browser PDF frame with PDF.js canvas rendering and app-styled page navigation, page-number input, zoom, and fit-width controls. Nearby readers load their first page automatically, with a loading indicator and download fallback.
- Added expanded views for audio, video, and PDF using the same Radix modal styling, blurred backdrop, close button, opening/closing animations, and reduced-motion behavior as table fullscreen. This uses an app dialog rather than the browser Fullscreen API.
- Expanded views move the existing player/reader into the modal and restore it on close. PDF page/zoom and media position stay with that instance; playback restoration accounts for browsers pausing media during DOM relocation. The document reserves its original block height, and Escape/Close returns focus to the expand action.
- Shared viewers apply in documents, supported nested media, and Library details. Playback visibility cleanup, authenticated routes, saved references, and upload/transfer formats are preserved.

## Dependencies and delivery

Added `pdfjs-dist` 6.4.299 and development dependency `vite-plugin-static-copy` 4.1.1. The PDF engine is dynamically imported when a reader approaches the viewport. PDF.js worker, fonts, CMaps, WebAssembly support, color profiles, and licenses are delivered from the local installation; there is no CDN dependency. Versioned support-asset directories avoid mixing PDF engine versions across deployments.

The implementation follows the [PDF.js rendering lifecycle](https://mozilla.github.io/pdf.js/examples/) and the [static-copy plugin's development/build asset handling](https://github.com/sapphi-red/vite-plugin-static-copy).

The initial static-copy installation encountered an npm peer resolver exception. Dependencies were subsequently installed successfully, unrelated toolchain version changes were removed from the lockfile, and a clean `npm ci` passed. Existing locked package versions remain unchanged.

No migrations, persisted content changes, archive changes, staging, or commits.

## Actual validation

- `npm ci`: passed from the final lockfile.
- `npm run types:check`: passed.
- `npm run lint`: passed; 537 files formatted and 445 files linted without warnings/errors.
- `npm run build`: passed. Existing ineffective dynamic imports and large-chunk warnings remain. The PDF engine adds a separate lazy chunk and worker asset.
- Build output inspection: PDF support files and licenses exist under `public/build/pdfjs-6.4.299/`; the static-copy plugin copied 201 items.
- `git diff --check`: passed.
- New and changed source modules remain below 500 lines each.
- No automated tests were written or run. Browser appearance, playback, and PDF rendering await the user's manual acceptance; static checks do not establish those outcomes.

## Manual test checklist

Use an existing Markdown document with an MP3, a playable MP4, and a PDF of at least two pages. Restart the development server after pulling these dependency/Vite changes; otherwise build and reload the production app.

1. **Existing blocks:** Reload the document in Live Preview. Expected: all three blocks have compact filename headers and app icon actions, with no Edit source/Preview bar or duplicate raw MIME footer. Audio has a monochrome playback bar; video has a dark contained preview; PDF renders its first page with app page/zoom controls when near the viewport.
2. **Audio controls:** Play/pause, drag the seek control, adjust volume, and toggle mute. Tab to each control and use Space/arrows. Expected: accurate time/progress, working keyboard controls, and no editor caret jumps. Browser codec failures retain a clear message and download action.
3. **Video controls:** Use the center play button, bottom play/pause, seek, volume, and mute. Focus the video and use Space or K, then Left/Right arrows. Expected: matching app controls; keyboard seeks by five seconds; the native browser control bar does not appear.
4. **PDF controls:** Select page 2 using Next and the page-number input, zoom in/out, then Fit page width. Scroll within the preview. Expected: the correct page renders, controls retain the selected page, the document body does not hijack the PDF controls, and the loading indicator clears. Try a damaged/password-protected PDF: expected a useful download fallback rather than a browser PDF toolbar.
5. **Expanded presentation:** Open fullscreen for audio, video, and PDF. Compare with a table's fullscreen view. Expected: matching app overlay, inset dialog, close control, and transitions; the browser remains in its normal window. Background document controls are inert and Tab stays in the modal.
6. **Expanded state:** While video/audio plays, expand and close it. Expand a PDF on page 2 at a changed zoom and close it. Expected: no duplicated player, retained playback position, retained PDF page/zoom, and the original document height remains stable. User-paused media must stay paused. Close via X, Escape, and outside dismissal; expected focus returns to the expand action.
7. **Editing/regression:** Hover or keyboard-focus a media card, replace its file, remove it, and undo. Repeat with a plain TXT attachment. Expected: media actions appear without a source toolbar; TXT still has visible Replace/Remove text actions; normal history/autosave and reload preserve references. Download each type and verify original contents.
8. **Library and nested media:** Open the same uploads in Library detail pages. Place a supported attachment reference inside a callout/table cell. Expected: the same viewer styling and expanded shell, without a duplicate filename link underneath nested media. Hiding the document/browser tab pauses playback; removing/unmounting a viewer closes its expanded view and releases its resources.
9. **Themes and dimensions:** Repeat in Light/Dark, a narrow window, split panes, and reduced motion. Expected: theme-aware surfaces and monochrome controls, wrapping controls without horizontal page overflow, bounded video/PDF previews, usable expanded Close controls, and reduced-motion transitions disabled.
10. **Local PDF assets:** In browser Network tools, open a PDF after restarting the dev server and also from a production build. Expected: the worker and any requested fonts/CMaps/WASM/color profiles load from the current installation, without CDN requests or missing support-asset errors. Reloading unrelated documents without a PDF should not fetch the PDF engine.

## Limits

- Playback still depends on browser-supported codecs; there is no transcoding.
- The custom PDF reader renders one page at a time. It supplies extracted page text to assistive technology, but does not yet implement text selection, PDF search, annotations, editable forms, or password entry. Original files remain downloadable.
- CodeMirror virtualization can still dispose offscreen media and reset playback position. This review preserves the existing behavior outside an open expanded view.
- No browser/manual acceptance is claimed from the successful build.

## Commit suggestions

- `fix(editor): match media blocks to Orbium controls and fullscreen design`
- `feat(editor): add app-styled pdf reader with local rendering assets`

Remain within the current editor review and await manual feedback.
