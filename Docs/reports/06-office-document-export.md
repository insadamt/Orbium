# Word and PDF export review

Date: 2026-10-14. Status: implemented for manual acceptance within the current document-transfer/editor review. No later phase or whole-account portability work was started.

## Implemented

- **Single document → Word document (.docx) / PDF (.pdf)** in the existing export dialog, available from document actions and workspace/folder document context menus.
- A shared clean document layout with title/headings, standard typography, white pages, 1-inch margins, A4/Letter, portrait/landscape, and optional page numbers.
- Current editor source export without saving or mutating it; context exports use saved source.
- Semantic formatting, editable nested lists/tables, rich-cell spans, block alignment/direction, Arabic text, image captions, shaded callouts, code, and useful reference links.
- Embedded owned body images and PNG renderings of diagrams/equations. Missing references become visible labels/placeholders; no external images are fetched.
- Direct server-generated PDF downloads using DOCX → LibreOffice conversion. No Chromium or browser print dialog.
- Authenticated, validated, bounded generation with per-user concurrency protection, isolated renderer profiles, process deadlines, private staging, and cleanup after handled failure/delivery. Long conversion bypasses the workspace write lock so it cannot hold autosave behind a renderer.
- Separate lockfile/runtime for document generation, Docker dependencies/fonts/timeouts, local setup instructions, and formatter/Git/Docker exclusions for nested runtime dependencies.

Specification: [Word/PDF export](../docs/20-office-document-export.md).

## Configuration and compatibility

No database migrations, persisted editor changes, archive format changes, account replacement, commits, or pushes. Existing `.orbie`, Markdown and ZIP package formats remain available; packages do not offer Word/PDF. Word/PDF import, legacy Tiptap office export, multi-document office export, covers/icons, database properties, and Orbium themes/effects are outside this extension.

The local ignored `.env` received the available local Node and bundled LibreOffice executable paths where no prior export overrides existed. Laravel's local configuration cache was cleared. Compose explicitly uses its installed `node`/`soffice`, so local paths are not applied inside the container. No existing secret/config values were printed or replaced. Local runtime dependencies were installed; the Docker image was not rebuilt or started.

## Actual validation

- `./vendor/bin/pint --test`: PASS across the repository.
- `npm run types:check`: PASS.
- `npm run lint`: PASS; 445 files formatted, zero warnings/errors in 363 linted files. A later renderer-only edit also passed `npm run check:fix` and Node syntax checks.
- `npm run build`: PASS, 10.28 seconds. Existing large-chunk/ineffective-dynamic-import warnings remain.
- Focused PHPStan over new export services/controller/config and modified transfer controller/routes: PASS, zero errors.
- Full PHPStan: FAIL with 62 errors across 16 unchanged database/trash/navigation/editor/library/search files; none of its reported errors occur in modified files. Parallel PHPStan initially hit the sandbox loopback restriction; serial `--debug` analysis produced the results above.
- Node syntax checks for all four renderer modules: PASS.
- `php artisan route:list --path=office-export`: PASS, authenticated export route registered.
- `docker compose config --quiet`: PASS. Full Docker image build and deployed conversion remain pending.
- `npm audit --prefix scripts/document-export --omit=dev`: PASS, zero vulnerabilities. A patched `@xmldom/xmldom` override resolves the transitive vulnerability reported during initial dependency installation.
- `git diff --check`: PASS.
- Generated synthetic DOCX/PDF samples through the application model/exporter, then rendered PDF pages with Poppler and visually inspected every page. A three-page A4 portrait sample showed English/Arabic, inline/display equations, numbering, nested lists, code, repeated table headers and page numbers. A one-page Letter landscape sample showed merged cells, code/display math inside a rich cell, a missing-image label/caption, mixed-direction writing and an embedded illustration. The final media sample used the checkout's configured runtime paths directly.
- Automated tests were neither authored nor run, following the user's instructions. Browser acceptance and actual Microsoft Word/Google Docs acceptance are pending; sample artifact generation/rendering was visual layout review, not an automated test suite. Temporary synthetic review artifacts remain outside the repository under `/tmp`.

During review, small table rows initially split across pages; they now stay together and headers repeat consistently. Rich cells render their block contents, including code and equations, rather than treating them as ordinary table inlines.

## Manual test checklist

1. **Basic Word export:** Open a Markdown document, choose document actions → Export… → Single document → Word document (.docx) → Export document. Open the download in Word, LibreOffice Writer or Google Docs. Expected: the title-based filename, editable text/headings/lists/tables, white pages, ordinary typography and no Orbium UI/background/theme. Also try a workspace/folder document's context-menu Export… entry; expected: its saved document exports.
2. **Direct PDF:** Export the same document as PDF and open it in a PDF viewer. Expected: a direct `.pdf` download with no print dialog; comparable layout, selectable/searchable body text and clickable external links. Export an empty document; expected: a valid title-only file.
3. **Latest writing:** Add a unique sentence, immediately open Export and download either format. Expected: the current editor body is included even before autosave finishes. Close the dialog or complete export, then continue editing/undoing; expected: export did not replace or save new body content by itself.
4. **Page options:** Export a long document using default A4 portrait, then Letter landscape with Include page numbers enabled. Expected: corresponding paper dimensions/orientation, margins around the content and sequential footer numbers only when enabled. Open a long table spanning pages; expected: header rows repeat and small rows stay together. Try a wide table in landscape and rich cells merged horizontally/vertically; expected: cells remain in their logical positions. Exceptionally tall rows and extremely wide content need manual reader/pagination review.
5. **Formatting and direction:** Include H1–H3, bold/italic/strike/underline, colored text, numbered/bullet/check lists, a quote/callout, code, Arabic text, mixed Arabic/English and explicit RTL/right alignment. Expected: readable semantic formatting, correct numbering/nesting, preserved code line breaks, readable Arabic glyphs and logical direction. Changing Orbium Light/Dark or account CSS should not change the page background/layout.
6. **Media and formulas:** Insert an owned image with a caption and a Mermaid diagram, plus inline/display math. Export both formats, including a rich table cell with code or math. Expected: embedded media survives opening the download separately from Orbium; captions remain; content fits the page/cell; code and math in cells remain visible. Diagram/equation images are not editable source objects in Word.
7. **Links and missing references:** Mention a disposable second page and link a file. Expected: available references are labeled clickable installation links and may require sign-in. Trash the disposable page, then export its mentioning document again; expected: a readable unavailable label rather than an error page link. Export an imported single-file document with missing media placeholders; expected: visible missing-image/file labels and preserved captions.
8. **Failure recovery:** Temporarily enter an invalid Mermaid diagram or unsupported equation in a disposable document and export. Expected: a visible error, no partial download, and the original document retained. Correct the source and retry; expected: success. A missing LibreOffice installation should affect PDF only, with Word still usable. Generation reaching size/pixel/time limits should reject clearly rather than silently omit content.
9. **Existing export regression:** Switch from PDF/Word to Package. Expected: the format resets to Orbium and only Orbium/Markdown choices remain; the existing asset/related-page controls work. Download `.orbie`, `.md`, and ZIP as before. Expected: existing transfer formats remain usable. Navigate between retained tabs and try split panes after exports; expected: normal editing, autosave and navigation.
10. **Deployment:** For Docker, rebuild with `docker compose up --build -d`, then repeat Word/PDF/media exports inside that installation. Expected: packaged Node, LibreOffice and fonts work without host executable paths. Local runtime installation/configuration steps are in the specification; restart the local PHP process if it has retained an older environment. Existing account/data remain intact.

## Known limitations

- Single Markdown document only; covers/properties/themes and related-page contents are omitted.
- Math uses supported base/AMS/newcommand syntax and becomes an image; Mermaid becomes an image. Complex unsupported math fails explicitly. Checklist states are readable labels rather than interactive Word controls.
- Embedded animations export a still frame. External image URLs remain placeholders.
- Word/Google Docs can substitute fonts and repaginate. Pixel-based editor table widths and visual divider/effect styling do not carry into the document layout.
- Reference links point at this installation and may require authentication. Configure the public application URL correctly.
- Export runtime dependencies must be installed on local/non-Docker servers. PDF requires LibreOffice. Existing Docker images require rebuilding.
- Generation limits are documented. Abrupt process/server termination can leave private temporary export directories; normal failure/delivery removes them.

## Suggested commits

- `feat(documents): add shared Word and PDF document exports`
- `build(exports): package document renderer and LibreOffice runtime`
- `docs(exports): document office export setup and manual acceptance`

Manual acceptance is pending. Stop within this extension until the user reports review results or approves further work.
