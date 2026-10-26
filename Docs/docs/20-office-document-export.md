# Word and PDF document export

Approved on 2026-10-14 as an extension of the current document-transfer/editor review. This does not start whole-account portability or a later phase.

## User flow

Open **Export…** from a Markdown document's actions menu or its workspace/folder context menu. Choose **Single document**, then **Word document (.docx)** or **PDF (.pdf)**. Choose A4 or Letter, portrait or landscape, and optional page numbers. Export downloads a file named after the document title. A4 portrait without page numbers is the default. PDF downloads directly without a browser print dialog.

Editor export captures the source supplied when the dialog opens, including unsaved body changes. Context-menu export uses saved source. Export does not save or replace document content. Package export continues to offer `.orbie` and `.md` only. Word/PDF import and multi-document office export are outside this extension. Legacy format-1/Tiptap documents retain their existing export flow.

## Document appearance

Both formats use one document model and one Word layout:

- White paper, 1-inch margins, 11-point Liberation Sans body text and larger title/headings.
- Semantic headings, bold/italic/strike/underline, explicit text color, nested lists and checklist labels.
- Automatic Arabic/Hebrew paragraph direction and explicit block alignment/direction.
- Simple shaded quotes/callouts and monospace code with preserved line breaks.
- Standard tables with repeating header rows, header shading and preserved rich-cell row/column spans. Ordinary rows stay together when they fit; exceptionally tall rows depend on the document reader. Table columns use equal widths rather than the editor's pixel widths.
- Owned body images embedded as PNG, with captions and sizing bounded by the page or table cell. Animated images export their first frame.
- Mermaid diagrams and equations embedded as images. They remain readable but are not editable diagrams/equation objects in Word.

Orbium covers/icons, database properties, interactive controls, account themes, editor CSS/effects and application backgrounds are omitted. Dividers use a simple neutral rule. Small differences can occur when opening DOCX in Word/Google Docs because of fonts and reader pagination. PDFs use the deployment's installed fonts and LibreOffice version.

## References and rendering

Only attachments accessible to the authenticated user in the document's workspace are embedded. Unavailable images become labeled placeholders; unavailable file/page references receive an unavailable label. External image URLs are not fetched. Available file/page references become installation URLs that can require authentication. Ordinary HTTP(S)/mailto links remain clickable; relative Markdown links become readable labels because they have no reliable exported target. Files and related pages are not embedded.

Laravel parses and validates source with the existing Markdown parser/reference rules, then creates a neutral structured document model. It stages accessible images into a private temporary directory. The separate Node runtime generates DOCX with `docx`; `sharp` normalizes images; MathJax renders supported base/AMS/newcommand equations to PNG. Unsupported or invalid equations fail export with a clear error instead of silently disappearing.

Mermaid uses the existing strict, light SVG renderer in the client, sanitizes its output and sends PNGs keyed by the inspected diagram-source hashes. No live editor DOM or screenshot is exported. The server requires exactly the current document's diagram hashes and validates PNG dimensions/size before re-encoding. Invalid diagrams stop the download with a visible error. The PDF itself is generated on the server by converting the generated DOCX with headless LibreOffice. Chromium and browser printing are not used.

Exports are authenticated, workspace scoped and CSRF protected. Only one export per user runs at a time; the endpoint allows six starts per minute. It bypasses the workspace write-serialization middleware because conversion does not modify workspace data and must not block autosave. It uses an isolated LibreOffice profile for each request. Renderer command arguments are passed without a shell. Renderer output containing document content is neither shown nor logged. Temporary files are removed after delivery or handled generation failure; abrupt server/process termination can leave a private temporary directory requiring administrator cleanup.

Limits: existing 2 MiB Markdown/AST limits; 100 distinct diagrams; each submitted diagram at most 4 MiB base64 and 4096×4096 pixels; 30 MiB of unique source image bytes plus diagram PNG bytes per export; raster input at most 16,777,216 pixels. Each rendering process has a 60-second deadline and Node has a 256 MiB heap limit. Large or complex exports can reach these limits and should be reduced. No network image ingestion or archive/storage format changes are introduced.

## Deployment

The PHP Docker image installs `libreoffice-writer`, `fonts-liberation`, and `fonts-noto-core`, and retains an isolated Node export runtime under `scripts/document-export/node_modules`. Root frontend dependencies are still removed after the frontend build. Rebuild an existing Docker installation:

```bash
docker compose up --build -d
```

For local development, install the export runtime separately:

```bash
npm ci --prefix scripts/document-export --omit=dev
```

Word export needs Node.js 22 and the runtime dependencies. PDF additionally needs a headless LibreOffice Writer installation. On Debian/Ubuntu:

```bash
sudo apt-get install libreoffice-writer fonts-liberation fonts-noto-core
```

On Arch Linux, install LibreOffice Writer and the equivalent Liberation/Noto font packages through the system package manager.

The PHP process must be able to execute `node` and `soffice`. Set `ORBIUM_EXPORT_NODE_BINARY` or `ORBIUM_LIBREOFFICE_BINARY` to an executable's full path when it is outside that process's PATH. Restart PHP after changing its environment; clear/rebuild Laravel's configuration cache if used. Keep `APP_URL` correct for installation links. Docker's PHP execution and nginx FastCGI timeouts are 150 seconds; external reverse proxies need to allow conversion to finish. Missing runtime dependencies produce an export error; Word remains usable if only LibreOffice is missing.

See [the review report](../reports/06-office-document-export.md) for actual checks and manual acceptance steps.


## Mind Map fallback (2026-10-24)

Mind Maps export as a full indented text outline, including collapsed topics, using the existing monospace block layout. Graph labels are plain text; no links/images are inferred from them. This preserves topic content/ancestry without silently omitting an unsupported interactive block. Word/PDF do not contain an editable graphical map, application controls or viewport state. Canonical formatting-preserving Document exports remain the route for retaining the actual graph.
