# PDF fullscreen reader enhancement

Date: 2026-10-16. Current editor/Library review; no phase advancement.

## Implemented

- Removed the Fit page width button from PDF previews.
- Added a zoom selector with Auto and 50%, 75%, 100%, 125%, 150%, 200%, and 300% presets. Percentage zoom now refers to the natural PDF page size; Auto limits the page to available width without enlarging it.
- Added a fullscreen toolbar with a page-preview sidebar toggle, first/last-page actions, existing previous/next and direct page-number navigation, zoom controls, and clockwise rotation in 90-degree steps. The existing download action remains available in the file header.
- Added clickable, numbered page thumbnails on the left with current-page highlighting and automatic sidebar scrolling to the selected page. Thumbnails retain the original document orientation.
- Render thumbnails sequentially near the sidebar viewport; release their canvases when scrolled away, collapsed, or destroyed. Main-page rendering retains its existing pixel budget and cancellation lifecycle.
- Preserve page, zoom, rotation, and sidebar preference when the same viewer expands/closes. Thumbnail controls stay inside the modal's focus boundary.
- Added focused-page shortcuts: Left/Right and Page Up/Down navigate, Home/End jump to the first/last page, and +/− zoom.
- Updated the media specification. New/changed source files remain under 500 lines.

## Persistence and commits

No migrations, saved-content, archive, or dependency changes. No staging or commits performed.

Suggested commit messages:

- `feat(pdf): add fullscreen thumbnails and reader controls`
- `fix(pdf): remove fit-width button and improve fullscreen navigation`

## Actual validation

- Formatting: passed with `vp fmt` for the four changed source/style files.
- `npm run lint`: passed; 538 files correctly formatted and 446 files linted with no warnings/errors.
- `npm run types:check`: passed.
- `npm run build`: passed; 5302 modules transformed and 201 PDF support items copied. Existing ineffective dynamic-import, large-chunk, and plugin-timing warnings remain.
- `git diff --check`: passed.
- No automated tests written or run, as instructed. Browser behavior and appearance require the manual checks below.

## Manual test checklist

Use a PDF with at least five pages in a format-2 document, then repeat key checks in its Library detail preview.

1. Reload and view the inline PDF. Expected: the first page loads, previous/next and page input work, zoom has Auto and percentage presets, and no Fit page width button appears.
2. Open fullscreen. Expected: the toolbar sits above the PDF, numbered thumbnails appear on the left, and page 1 is highlighted. Scroll only the thumbnail sidebar. Expected: additional page previews appear without changing the main page.
3. Click page 3's thumbnail, use Next/Previous, and enter page 5 in the page input. Expected: the main page, page number, and highlighted thumbnail agree; navigation brings the selected thumbnail into view. Enter 0 or a number above the page count: expected clamping to the valid range.
4. Use First page and Last page. Expected: the correct endpoint renders and endpoint navigation buttons disable appropriately. Repeat with a one-page PDF: all page-navigation buttons should be disabled.
5. Toggle the page-preview sidebar off/on. Expected: the main viewport uses the available space, Auto zoom adapts, and thumbnails return with the selected page highlighted.
6. Select 100%, then 150%, then zoom with +/− buttons. Expected: correct percentage labels and consistent natural-size scaling. Choose Auto: expected a page bounded by the available width. At larger percentages, scroll the page horizontally/vertically inside the reader.
7. Click Rotate clockwise four times. Expected: 90°, 180°, 270°, then original orientation; the document's original page rotation is respected. Navigate while rotated: expected the rotation preference to apply to the next page. Thumbnails remain in original orientation.
8. Select page 3, 125% zoom, and a rotated view; hide the sidebar, close fullscreen, and reopen it. Expected: page, zoom, rotation, and hidden sidebar preference remain. Escape and Close should return focus to the expand button and restore the inline layout.
9. Focus the main page viewport. Use Left/Right, Page Up/Down, Home/End, and +/−. Expected: page/zoom changes without moving the editor caret. Tab through the modal: expected visible focus and focus staying within the modal; Enter on a thumbnail selects its page.
10. Repeat in Light/Dark themes, a narrow window, split panes, and reduced motion. Expected: readable controls, a bounded left sidebar, wrapped toolbar, scrollable page, and accessible Close button.
11. Open a large multi-page PDF and scroll the sidebar quickly, change pages rapidly, toggle the sidebar, then close/remove the viewer. Expected: selected page settles correctly, no stuck loading state, no duplicate viewer, and no continuing canvas rendering after removal. Download should still return the original file.
12. Open a damaged or password-protected PDF. Expected: the existing clear error/download fallback remains usable.

## Known limitations

The reader continues to render one main page at a time. Text selection, document search, printing controls, annotations, and forms are not included. Runtime state is retained only for the current mounted viewer. Browser verification remains pending user acceptance.
