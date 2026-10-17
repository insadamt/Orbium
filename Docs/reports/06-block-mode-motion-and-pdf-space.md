# Block mode motion and fullscreen PDF space

Date: 2026-10-17. Current editor/media review; no phase advancement.

## Changes

- Shared rich-block Edit/Preview controls reveal the incoming editor or preview with a 200 ms fade and 5px vertical movement. This covers Mermaid, display math, and other blocks exposing those controls. Code remains directly editable.
- Mode, focus, and CodeMirror measurement still update immediately. Repeated activation retains focus behavior without restarting motion. OS reduced motion disables the reveal.
- Fixed PDF fullscreen inset precedence: the later shared Mermaid dialog styles previously overrode the PDF-specific inset. The PDF dialog now stays 4px from viewport edges on desktop and narrow screens.
- Reduced the modal title bar to 44px, stage margins to 4px, page padding to 12px, and fullscreen file/reader control spacing. Removed the redundant base PDF width cap.
- Auto zoom now subtracts measured viewport padding instead of a fixed 40px, so the page fills the available width correctly. Percentage zoom and the existing canvas pixel budget remain intact.

## Validation

- Formatting and lint: passed; 549 formatted files and 455 linted files, no warnings/errors.
- TypeScript: passed (`npm run types:check`).
- Production build: passed (`npm run build`); existing ineffective dynamic-import, large-chunk, and plugin-timing warnings remain.
- `git diff --check`: passed.
- No automated tests written or run, per user instructions. Browser appearance and behavior remain for manual acceptance.

## Manual test checklist

1. Open a format-2 document containing Mermaid and display math. Click Edit, modify valid source, and click Preview. Expected: a short fade/slide on each actual mode switch, source input receives focus, and the latest source renders correctly.
2. Toggle Edit/Preview rapidly, then click the active mode again. Expected: the final selected mode stays usable, focus behaves normally, no duplicate panels appear, and active-mode clicks do not restart the reveal.
3. Save/reload the document and use undo/redo after source edits. Expected: content persists; switching modes creates no content history entries.
4. Enable OS reduced motion and repeat the mode switches. Expected: panels appear immediately without fade or travel.
5. Open a multi-page PDF fullscreen from a document and from Library details on a wide desktop window. Expected: the dialog is nearly edge-to-edge, with compact headers and controls, and the main page uses the remaining width at Auto zoom. Scroll vertically to read a tall page.
6. Toggle page previews, navigate pages, rotate, and choose Auto and 150% zoom. Expected: Auto adjusts to available width; explicit zoom remains at the selected percentage; scrolling, thumbnails, and rotation work.
7. Resize to a narrow window and repeat fullscreen navigation. Expected: controls wrap, Close remains reachable, and Auto fits the page to the remaining viewport without a forced 180px page width.
8. Close using Escape and Close, then reopen. Expected: focus returns to the expand trigger, inline reader sizing returns, and page/zoom/rotation/sidebar state is preserved.
9. Repeat key checks in light/dark themes and a split document pane. Expected: readable surfaces and controls, with the modal covering its owning viewport.

## Scope and commits

No schema, saved-content format, dependency, or archive changes. Existing unrelated code-language and select changes were preserved. No commits or staging performed.

Suggested commit messages:

- `feat(editor): animate block editor and preview transitions`
- `fix(pdf): maximize fullscreen reading space`

## Limitations

The PDF reader still renders one main page at a time. Auto fills width and may require vertical scrolling on portrait pages. Motion applies to the shared block mode controls, rather than the whole-document Source/Live Preview setting or directly editable code blocks.
