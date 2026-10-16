# Expanded PDF, native video fullscreen, and rich block cards

Date: 2026-10-16. Current editor/Library review; no phase advancement.

## Implemented

- Enlarged the inline PDF viewport to min(620px, 70vh). The expanded PDF dialog uses an 8px viewport inset and its reader fills the available stage without the previous 1100px width cap. Auto zoom fills the reader width, including on wide screens.
- Removed fullscreen from audio. Existing audio playback/download/edit actions remain.
- Video fullscreen now requests native fullscreen on the video element itself. Only the video and transient browser playback controls appear; the file heading and Orbium card controls stay outside fullscreen. Inline click/key handlers defer to browser controls during fullscreen. Native iOS video fullscreen is the fallback when the standard API is unavailable.
- Restore Orbium controls and focus to the expand trigger when native fullscreen exits. Disable the action when neither fullscreen API is available; rejected requests retain a clear download fallback. Release fullscreen listeners on unmount and exit standard fullscreen if its video is removed.
- Removed the Code block subtitle while retaining language selection. Added 16px padding inside rich source editors, including Mermaid. Rounded document table frames and corner-cell backgrounds without clipping row/column handles.
- Matched Mermaid, display math, and code cards to the media surface: rounded border, type/language icon, compact identity header, icon controls, and a muted inset content area. Kept Mermaid full preview, source/preview switching, math rendering, language selection, animated copy, and direct code editing. Inline math is unchanged.
- Updated Mermaid's virtualized height estimate for the new frame dimensions and updated editor/media docs.

## Persistence and commits

No dependency, migration, saved-content, or archive-format changes. The user requested committing the complete media/rich-card update together with the final polish below. Commit: `feat(editor): unify rich block cards and refine media previews`.

Suggested commit messages:

- `feat(editor): unify rich block cards and expand PDF preview`
- `fix(media): use native video fullscreen and remove audio expansion`

## Actual validation

- Formatter: passed for changed source/style files.
- `npm run lint`: passed; 541 files correctly formatted and 448 files linted without warnings/errors.
- `npm run types:check`: passed.
- `npm run build`: passed after the final polish. Existing ineffective dynamic-import, chunk-size, and plugin-timing warnings remain.
- `git diff --check`: passed.
- No automated tests written or run, per the user's instructions. Browser appearance and native fullscreen behavior await manual acceptance.

## Manual test checklist

Use a format-2 document containing an MP3, playable MP4, multi-page PDF, Mermaid diagram, display equation, inline equation, and fenced code block.

1. **PDF size:** Reload and open the PDF's expanded preview on a wide desktop window. Expected: an 8px outer inset, reader spanning nearly the entire available width/height, left thumbnails, and a large page using Auto zoom. Inline PDF should also be taller than before. Explicit zoom percentages remain at their selected natural-page scale.
2. **PDF controls/state:** Select a thumbnail, rotate, change zoom, toggle the sidebar, close, and reopen. Expected: navigation works and the same mounted viewer retains page/zoom/rotation/sidebar preference. Close/Escape restores trigger focus and inline layout.
3. **Audio:** Inspect the document and Library audio previews. Expected: no fullscreen action; play/pause, seeking, mute, volume, download, and document replace/remove still work.
4. **Video fullscreen:** Play the MP4, seek to a recognizable position, and click fullscreen. Expected: actual browser fullscreen showing the video and native playback controls, without the Orbium modal, heading, or document. Video should fill the screen while preserving its aspect ratio and playback position. Test pause/seek/volume with browser controls; playback should not toggle twice from the inline click handler.
5. **Video exit/cleanup:** Exit with Escape or the native exit action. Expected: Orbium inline controls return, native controls disappear, playback position remains, and focus returns to the expand action. Repeat while paused. Remove/replace the video after exiting and check undo/redo. If practical, navigate away using the browser during fullscreen: expected no stale fullscreen viewer.
6. **Browser support:** Repeat video fullscreen on target desktop browsers and iOS Safari where available. Expected: standard or native iOS fullscreen. Where both APIs are unavailable, the action is disabled. If the browser rejects a request, expect an explanatory error and working download link.
7. **Mermaid:** Expected: the same rounded card/header/inset styling as media, a diagram icon, and compact labelled icon actions. Click Edit, modify a label, then Preview. Expected: updated diagram, preserved source, undo/redo and autosave; full preview still opens. Invalid syntax should show the existing error with editable source retained.
8. **Math:** Click the display equation's Edit icon, change its expression, and return to Preview. Expected: matching card appearance and rendered equation. Undo/redo, save/reload, and invalid-expression recovery should work. Inline math should remain in the text flow with its prior editing behavior.
9. **Code:** Change language, type/edit code, and use Copy. Expected: language icon/selector and compact copy action in the matching header, editable highlighted code, correct copied content, horizontal scrolling, undo/redo, and save/reload. Read-only documents should continue to prevent source/language changes while allowing copy and preview actions.
10. **Final polish:** Inspect a code header: expected only its language selector/icon and copy action, without a Code block subtitle. Open Mermaid source: expected 16px inset text with usable selection and caret. Inspect all four table corners, hover rows, scroll a wide table, open fullscreen, and use row/column handles: expected rounded header/last-row backgrounds, preserved grid borders, and accessible handles. Repeat with one-row/one-column tables and RTL direction.
11. **Layout/regressions:** Repeat in Light/Dark, narrow windows, split panes, and reduced motion. Expected: bounded cards, readable headers, usable actions, no diagram overflow, preserved block direction/alignment, and no disruption to normal text editing or table/image controls. Repeat PDF/video/audio checks in Library detail previews.

## Known limitations

Native fullscreen and its transient controls depend on browser/device support. This update styles format-2 rich blocks; the legacy editor is unchanged. PDF search, selectable text, printing controls, annotations, and forms remain outside scope. Verification above is static/build validation, not completed browser acceptance.
