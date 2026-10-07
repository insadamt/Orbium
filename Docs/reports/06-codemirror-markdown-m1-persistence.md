# M1 — Markdown persistence and server inspection

Date: 2026-10-07. Branch: `editor/codemirror-markdown`. Base: accepted M0 `5f9057d06ece36be62602e800bcbe6a086165885`. Status: implemented for manual review; M2 is gated on explicit approval. No automated tests were written or run. Runtime manual acceptance belongs to the user.

## Storage and temporary runtime boundary

Migration `2026_10_07_000001_add_markdown_to_documents.php` adds nullable TEXT `documents.markdown`. Existing JSONB `content`, version defaults, header fields, revision and existing rows are retained. The migration has not been executed by the agent; no database reset or conversion occurred. Markdown is a plain UTF-8 string, without a structured-data cast. The model explicitly casts `content_format_version` and `revision` to integers.

- Version **1**: current Tiptap JSON; `content` is authoritative. Normal UI creation still produces version 1.
- Version **2**: `orbium-markdown-v1`; `markdown` is authoritative. Only an explicit Markdown save changes a document to version 2.
- Markdown saves leave old JSON untouched; it is historical transition data, not an updated equivalent body. There is no JSON → Markdown exporter/adapter or Markdown → JSON dual write.
- A version-2 document returns HTTP 409 from the current Tiptap page. JSON save rejects version 2 under the document lock with `errors.content_format_version`. This prevents an old retained editor from overwriting Markdown or replacing its derived index. Use a separate scratch document for API review and close its Tiptap tab first.
- Current Tiptap editor, autosave URL/body, retained tabs, normal/database creation and existing import/export implementation are unchanged. Their runtime compatibility still requires the manual checks below. No CodeMirror body editor, frontend parser or new npm package is introduced.

## Dependency and parser architecture

Direct Composer requirement: `league/commonmark: ^2.10.3`; locked version remains **2.10.3**. Composer regenerated only the lockfile content hash, without changing package versions. The M1 prompt explicitly selected this library. Its standard CommonMark/GFM grammar and extension APIs avoid maintaining an in-house Markdown parser. It does not supply Orbium metadata schemas, dollar math, exact inline byte ranges or database authorization. References: [custom block parsing](https://commonmark.thephpleague.com/2.x/customization/block-parsing/), [inline parsing](https://commonmark.thephpleague.com/2.x/customization/inline-parsing/), [security and bounds](https://commonmark.thephpleague.com/2.x/security/).

`MarkdownParserService` builds an environment with CommonMark core and GFM, plus focused parsers for Orbium block directives, inline spans/atoms, dollar math, callout markers and malformed reserved constructs. CommonMark handles indentation, quotes/lists, code precedence, link labels/destinations/reference definitions, escapes, tables and ordinary marks. There is no HTML conversion/inspection. The inspector traverses AST nodes and returns `MarkdownInspectionResult` containing normalized source, the existing four-field `DocumentInspectionResult`, and typed attachment uses carrying image/file kind and source line.

`OrbiumMetadata` scans JSON string/delimiter boundaries, rejects duplicate decoded keys (including escaped key spellings), and validates kind-specific keys/types. Unknown keys/kinds, nulls, invalid Unicode/surrogates, invalid colors/enums/widths and unsafe schema combinations fail with Laravel validation errors. Parser-library exceptions become a generic `markdown` error; clients receive no parser exception details. Diagnostics include block/paragraph lines where available and a bounded directive-header excerpt for metadata failures. A dedicated callout paragraph parser prevents a colon-leading title from being discarded as a CommonMark reference definition.

## Dialect support

| Syntax | Server behavior |
| --- | --- |
| CommonMark blocks/marks, H1–H6 | Source preserved; semantic text inspected; heading levels never clamped |
| GFM tables/tasks/strike/autolinks | Standard AST traversal; checkbox state is source semantics; HTTP(S)/email autolinks only |
| Node links, including reference-style links | `orbium:node/<positive decimal ID>`; labels decoded, one leading @ removed for the unique index; images cannot mention nodes |
| Attachment images/file links | Actual destinations only; typed uses prevent deduplication from masking invalid image use |
| Obsidian callouts | First paragraph of a blockquote starts `[!TYPE]`, optional +/- folding and title; unknown ASCII types preserved; escaped opening bracket remains an ordinary quote |
| `kind=block` | Exactly one child block; optional direction; align only for paragraph/heading; listType only for ordered list |
| `kind=image` | Exactly one attachment image; independent caption, positive integer width, allowed alignment |
| `kind=empty` | No body; optional direction/alignment; authored empty block retained in source |
| `kind=code` | Exactly one standard fence; mermaid-language fence treated as literal code |
| Inline `:orbium[...]` | Balanced brackets, escaped delimiters, opaque code/math, nested spans; nonempty inline content within one Markdown block (soft wrapping allowed); lowercase hex/preset color and/or underline=true |
| Fenced code/Mermaid | Exact decoded literal source; case-insensitive first mermaid info token; other info retained; no execution |
| Inline/block dollar math | Verbatim LaTeX; single-dollar inline rules; `$$` block lines; code precedence; no evaluation |
| Math escape forms | Bodyless `kind=math` with latex; JSON-only inline `:orbium-math{"latex":"..."}` |
| Rich tables | table → row → cell directives; recursive cell blocks; header/alignment/spans/colwidth; rectangular grid, span overlap/bounds and width consistency validation |
| Raw HTML | Stored and inspected as literal inert source; no HTML/JS execution or remote fetch |

Directive fences are at least three colons; nested directives must be shorter than every enclosing directive. The closer contains exactly its fence's colon run after container prefixes. Standard fenced code and math bodies are opaque to directive closing. Unclosed directives fail. Literal reserved openers use a backslash escape or code. Ordinary unfinished emphasis, links without reserved destinations, fences and math remain saveable as source; an unfinished math block is inspected through end-of-input, without evaluating it. Malformed reserved references, partial Orbium link destinations/spans/JSON/directives never acquire partial semantic metadata.

## Derived text, references and previews

Text, inline code and decoded labels contribute literal text. Soft wrapping becomes one space; hard breaks become LF. Block containers join children with LF; list items, quotes, callout bodies, paragraphs, headings and table rows therefore remain separated. Table cells use TAB; paragraphs inside rich cells use LF. Reference-definition-only paragraphs contribute no searchable text. Empty authored blocks contribute empty text with their surrounding boundaries. No global trim rewrites code/math whitespace.

Callout type/folding markers and task checkboxes do not contribute syntax text. Callout title/body text is retained with LF boundaries and leading marker whitespace removed. Images contribute alt text; image metadata adds its separate caption after LF. File links contribute their label. Mentions contribute @ plus their decoded label with one conventional leading @ removed; every occurrence remains searchable. Repeated targets use the **last source occurrence** for the unique source/target mention index.

Code, math LaTeX, raw HTML and Mermaid source remain searchable, preserving M0's chosen product semantics. IDs/destinations, JSON presentation metadata, Markdown punctuation and previews do not contribute, except that a literal ID/reference authored in prose/code/math/raw HTML remains literal searchable text. These separator and media-label improvements apply only to format 2. Version-1 derivation and existing search/gallery consumers are unchanged; existing JSON rows are not reindexed. Logical-text ↔ editor-position mapping awaits the replacement editor.

Mentions must resolve to live nodes in the same workspace with live, valid, acyclic ancestry. Attachments must be live, in the same workspace, and owned by the source document. Image uses additionally require purpose=image and MIME PNG/JPEG/GIF/WebP. A file link may download an image attachment. Neither titles nor display labels grant identity/ownership. Unused reference definitions are syntax-validated but do not create mention/attachment relations.

Mermaid contributes `sha256(source) → source`. Remove only the parser's single structural trailing fence newline; retain authored whitespace/blank source lines, decode container indentation and normalize document line endings to LF. Identical diagrams share a hash. No rendering occurs. Saving prunes obsolete hashes transactionally. Preview upload membership now dispatches explicitly by saved format: JSON traversal for version 1, Markdown inspection for version 2, rejection for unknown/missing formats. Existing renderer-version checks, cache entry limit and preview API remain in place.

## Save API and transaction

Authenticated, CSRF-protected endpoint:

```text
PUT /workspaces/{workspace}/documents/{node}/markdown
route name: documents.markdown.update
Content-Type: application/json
Accept: application/json
```

```json
{"markdown":"# Body\n\nText","revision":7,"content_format_version":2}
```

Empty string is valid; missing/null source is invalid. Non-JSON requests return HTTP 415 to avoid form middleware changing source whitespace. Existing editor-body middleware also preserves whitespace and empty JSON strings on this endpoint. Browser-derived `plain_text`, `mentions`, `attachment_ids` and `mermaid_sources_by_hash` are prohibited. Other extra fields are never used by the action. Only source, revision and version form `MarkdownSaveData`.

`SaveMarkdownDocument` checks version/revision/source, inspects, then locks the document row, checks optimistic revision and supported existing version, validates source/reference visibility and ownership, stores source/version/plain text/incremented revision, prunes previews, and replaces the mention index in one transaction. Header/database values are separate. A version-1 → version-2 write is an explicit API transition only, using the same current revision; it does not claim that old JSON was converted.

Successful response: `{"revision":8,"saved_at":"<ISO timestamp>"}`. Rejected input is HTTP 422 with Laravel `{message, errors}` using `markdown`, `revision`, or `content_format_version`; unauthorized/unavailable documents use existing 401/redirect/404 behavior. Revision conflict wording matches JSON save. Rejected saves leave body, revision, plain text, mention index and caches unchanged.

## Source/complexity limits

`MarkdownContract` centralizes dialect, version, **2,097,152 bytes (2 MiB)** of incoming UTF-8 source, **131,072 bytes per source line (128 KiB)**, **32 AST levels**, and **100,000 nodes**. Byte size is checked before CRLF/CR normalization, then LF source is persisted unchanged otherwise. Invalid UTF-8 and NUL bytes are rejected. This canonical limit is independent of the unchanged 400 KB convenience importer and JSON's 1 MiB save limit. It gives the approximately 163 KB TEST document substantial headroom.

CommonMark is configured to bound nesting and delimiters (1,000 per inline input line). GFM's autocomplete budget equals the AST node bound so exhausting it cannot yield an accepted truncated table. Rich tables permit at most 1,000 rows/columns and 10,000 covered coordinates; large span integers fail before grid expansion. Mermaid source additionally stays within the current 50,000-byte preview-source budget. These limits constrain server work; they are not a replacement-editor performance claim. M2 must expose the same source/complexity contract to the browser rather than copying an importer limit.

## Semantic reference remapping primitive

`MarkdownReferenceRemapper::remap(source, nodeIds, attachmentIds)` requires positive mapped IDs for semantic destinations, including reference definitions. It parses/inspects the original source, identifies lexical candidate byte ranges, probes each candidate through the structural parser, and accepts a range only when AST comparison proves that exclusively the intended destination changed. Labels, literals, metadata, code info strings and AST shape must remain equal. Replacements are applied from right to left; the final AST must match the fully mapped expected destination set and pass reinspection. This also handles shared/unused reference definitions and attachment destinations inside image wrappers.

The lexical regex finds candidates; it is not the authority for deciding whether a reference exists. It never replaces bare numeric substrings. Prose, code, math, Mermaid, captions, external URLs and unrelated JSON strings survive unchanged. Missing maps, failed structural proofs or post-remap size/schema errors return validation failure without side effects.

Known foundation limitation: candidate source spelling must contain the literal `orbium:<kind>/<id>` destination (angle-bracket destinations and reference definitions work). CommonMark may decode escaped/entity-encoded destination spellings during ordinary inspection; remapping those rejects explicitly if it cannot prove a literal range. Work is bounded to 256 lexical candidates and 32 MiB aggregate source parsing budget, so it may reject a large archive body that otherwise saves normally. A later archive implementation needs efficient parser-produced ranges and these limits reviewed; no full archive/export/restore product is implemented here.

## Quality checks actually run

| Command | Result |
| --- | --- |
| `npx vp fmt <frontend paths>` | Not applicable; no frontend source touched |
| `npm run types:check` | PASS |
| `npm run lint` | PASS; 268 formatted files, 204 linted files |
| `./vendor/bin/pint --test` | PASS |
| `composer types:check` | FAIL: 45 existing errors outside changed files; full gate remains failing |
| Focused PHPStan command below | PASS: zero errors in all new/touched PHP files |
| PHP syntax lint on touched files | PASS: all 34 new/touched PHP files; largest source file 173 lines |
| `composer validate --strict` | PASS |
| `composer update league/commonmark --minimal-changes --no-scripts --no-install` | PASS after permitted network retry; unchanged package versions; no advisories reported |
| `npm run build` | PASS; chunk-size and ineffective dynamic-import warnings |
| `git diff --check` | PASS |

Full PHPStan failures are in unchanged database actions/controller/models, Trash services, navigation/workspace controllers, Node relation typing, JSON inspector and search services. No suppressions/baseline entries or unrelated cleanup were added. Focused command:

```bash
./vendor/bin/phpstan analyse --debug --no-progress \
  app/Services/Markdown app/Actions/Documents app/Models/Document.php \
  app/Http/Controllers/DocumentController.php app/Services/Editor/MermaidPreviewCache.php \
  bootstrap/app.php routes/web.php \
  database/migrations/2026_10_07_000001_add_markdown_to_documents.php
```

## Exact manual verification

These are user-run checks, not automated tests executed by the agent. Run from the repository with the normal development database/server. Do not use a real writing document for the format-2 endpoint.

1. **Schema/creation.** Run `git branch --show-current`, `git status --short`, `php artisan migrate:status`, then `php artisan migrate --path=database/migrations/2026_10_07_000001_add_markdown_to_documents.php`. Expect the migration adds only nullable markdown. Create a scratch document in the UI; it remains editable Tiptap/version 1. Upload a PNG and PDF to it before converting it; note workspace/document/target-node/image/file IDs from routes and upload responses. Close this document's editor tab. Leave another normal document available for compatibility review.
2. **Inspector setup.** Run `php artisan tinker`. Paste the following and retain the variables for later checks:

```php
$inspector = app(\App\Services\Markdown\MarkdownDocumentInspector::class);
$source = file_get_contents(base_path('Docs/examples/orbium-markdown-m1.md'));
$result = $inspector->inspect($source);
$result->derived;
```

Expect successful source-only inspection without database reference authorization; mentions `[42 => 'Last label']`, attachment IDs `[91, 92]`, and one Mermaid hash for `"graph TD\n  A --> B"`. There are typed image=true and file=false uses of ID 91. `$result->source === $source` is true for this LF file. Compare the following constructs in `$result->derived->plainText`:

| Check | Expected result |
| --- | --- |
| **3. Ordinary Markdown/headings** | H1–H6 text, decoded bold/italic/strike/code; no heading clamp or punctuation; soft wrapping joins with space; hard break is LF |
| **4. GFM table** | Header/cell text separated by TAB, rows by LF; alignment spelling retained in source |
| **5. Checklist** | Pending/completed/ordinary/nested item text separated; checkbox syntax absent from text and preserved in source |
| **6. Mermaid** | Exact source and SHA-256 entry; wrapped literal mermaid code has no diagram entry |
| **7. Math** | Inline/block LaTeX and both escape forms preserved in text/source; fake reference strings in LaTeX create no relations |
| **8. Mentions** | @Architecture Notes and @Last label in text; last label for target 42; inline and reference-style destinations both inspected |
| **9. Attachments** | Image alt, separate caption, file labels searchable; duplicate IDs deduplicated while image/file uses remain distinct |
| **10. Callout** | Title and body separated; `[!NOTE]+` marker absent from text; type/folding/source retained; escaped marker remains literal |
| **11. Block metadata** | Centered paragraph, ordered-list start/type and authored empty directive preserved; metadata JSON excluded from text |
| **12. Inline color/underline** | Colored/Outer/Inner and math text preserved; span JSON/punctuation excluded; preset/hex tokens unchanged in source |
| **13. Rich-table escape** | Cell blocks and nested list separated; columns TAB; source widths/header/align/directives intact |
| **14. Fake references** | Code, inline code, math, literal-code wrapper, caption and ordinary raw URI add no extra relations; raw HTML remains literal inert text |

15. **Remapping.** In the same Tinker session:

```php
$remapper = app(\App\Services\Markdown\MarkdownReferenceRemapper::class);
$mapped = $remapper->remap($source, [42 => 107], [91 => 230, 92 => 231]);
echo $mapped;
$inspector->inspect($mapped)->derived;
```

Expect only semantic node/attachment destinations, including `[target]`'s definition, to change. Captions, prose numbers, code/math/Mermaid, external URL, reference title and labels remain unchanged. Derived IDs are 107/230/231; Mermaid hashes stay equal. Calling `remap($source, [], [])` fails on a missing map. Calling it on `"[@X](orbium:node/&#52;2)"` with `[42 => 107]` fails explicitly on unsupported source spelling rather than corrupting text.

16. **Authenticated save setup.** In Tinker replace the numeric scratch document ID below. Record its initial revision and old JSON, then exit Tinker:

```php
$document = \App\Models\Document::findOrFail(123);
$document->only(['node_id', 'content_format_version', 'revision', 'markdown']);
$oldJson = $document->content;
```

In browser DevTools on a logged-in Orbium page, set W/D/R to the actual workspace/document/revision numbers, then paste:

```js
var W = 1, D = 123, R = 0;
var csrf = document.querySelector('meta[name="csrf-token"]').content;
var saveMarkdown = async (markdown, revision = R, version = 2, extra = {}) => {
  const response = await fetch(`/workspaces/${W}/documents/${D}/markdown`, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrf},
    body: JSON.stringify({markdown, revision, content_format_version: version, ...extra}),
  });
  const body = await response.json();
  console.log(response.status, body);
  if (response.ok) R = body.revision;
  return {status: response.status, body};
};
await saveMarkdown('# API body\n\nSaved from the M1 endpoint.');
```

Expect 200, revision increment and timestamp. Reload the document in Tinker (`findOrFail(D)`): version 2, exact markdown, server-derived plain text, unchanged JSON. Visiting its Tiptap page returns 409. Keep API work on this scratch document.

17. **Owned mention/file/image validation.** Set T/I/F to actual target-node/PNG/PDF IDs in the same workspace/scratch document:

```js
var T = 42, I = 91, F = 92;
await saveMarkdown(`[@Architecture Notes](orbium:node/${T})\n\n![Diagram](orbium:attachment/${I})\n\n[Report.pdf](orbium:attachment/${F})`);
await saveMarkdown(`![Bad image](orbium:attachment/${F})`);
await saveMarkdown(`[Download image](orbium:attachment/${I})`);
```

Expect success, then 422 `errors.markdown` for PDF-as-image, then success for downloading the PNG as a file. In Tinker inspect `DB::table('mentions')->where('source_document_node_id', D)->get()` and document `plain_text` after the first successful request: one target relation with display_text Architecture Notes, searchable labels. Repeat with `[file link](orbium:attachment/F)` plus `![bad](orbium:attachment/F)` in one source; it must still fail. Try a nonexistent/other-workspace/trashed target and an attachment owned by another document; each fails without changing revision/body/index. A target beneath a trashed ancestor also fails. Presentation metadata cannot bypass attachment-purpose/MIME checks.

18. **Malformed reserved syntax and security.** Execute these individually with the current R:

```js
await saveMarkdown('[@Bad](orbium:node/042)');
await saveMarkdown('[@Bad](orbium:node/42');
await saveMarkdown(':::orbium {"kind":"block","align":"bogus"}\nBody\n:::');
await saveMarkdown(':::orbium {"kind":"empty","dir":"auto","dir":"rtl"}\n:::');
await saveMarkdown(':::orbium {"kind":"empty","unknown":true}\n:::');
await saveMarkdown(':orbium[Text]{"underline":false}');
await saveMarkdown(':orbium[Text]{"color":"#ABCDEF"}');
await saveMarkdown(':orbium[unclosed');
await saveMarkdown('[Bad](javascript:alert(1))');
await saveMarkdown(':::orbium {"kind":"empty"}');
```

Expect 422 with specific markdown errors; R and saved state remain unchanged. Inspect `"> [!NOTE]: Title\n> Body"`: it must retain the title/body as a callout rather than create a reference definition. Test an escaped directive/code sample from the supplied file through the inspector: it succeeds without metadata. Ordinary `"**unfinished"` and `"$unfinished"` save successfully. For a ragged rich grid, inspect the sample after deleting the second cell in its second rich row: it fails with a source line. Try rowspan beyond the row count, inconsistent colwidth values and three equal nested fence lengths: each fails.

19. **Revision/version/empty-source/derived-metadata handling.** Record `var stale = R`, then save `"Next revision"`, then call `saveMarkdown('Stale overwrite', stale)`. Expect the first succeeds and the second returns 422 `errors.revision`, with current state preserved. `saveMarkdown('Wrong version', R, 1)` returns 422 `errors.content_format_version`. `saveMarkdown('Untrusted', R, 2, {plain_text:'browser authority'})` returns 422. `saveMarkdown('')` succeeds with empty stored source/plain text. `saveMarkdown('  spaced  \r\n')` stores `"  spaced  \n"` without trimming source. Missing/null markdown fails; no JSON conversion occurs. A manual PUT to the old JSON endpoint for this format-2 scratch document must return 422 format-version error.

20. **Byte/complexity limits.** In DevTools:

```js
await saveMarkdown(('a'.repeat(1023) + '\n').repeat(2048));
await saveMarkdown(('a'.repeat(1023) + '\n').repeat(2048) + 'x');
await saveMarkdown(('é'.repeat(511) + '\n').repeat(2051));
await saveMarkdown('x'.repeat(131073));
```

Expect exactly 2 MiB ASCII source accepted, 2 MiB+1 rejected with `errors.markdown`, the multibyte input rejected on byte count (2,098,173 bytes despite fewer characters), and one 128 KiB+1 line rejected. Rejected requests do not increment revision. Application source limits apply when upstream PHP/nginx request limits permit the request; an upstream 413 must be distinguished from an application 422.

21. **Preview cache membership.** Save a small `mermaid` fence via the API and inspect its hash. Use the Network panel's existing Tiptap Mermaid upload request as a template with the scratch W/D, same renderer version, source, render ID and existing safe SVG; matching saved source should be accepted, other source rejected. Change/remove the fence through the Markdown endpoint and query `document_mermaid_previews` for D: obsolete hash rows must disappear. The explicit literal-code wrapper must never authorize a diagram upload. Repeat a normal diagram/cache upload on a version-1 document: current behavior is retained.

22. **Current editor compatibility.** Open a separate existing format-1 normal document and database document. Type/edit text, mention a live node, insert PNG/PDF, edit Mermaid/math/table/callout, press Ctrl/Mod+S, switch between retained tabs, then reload. Expect current autosave endpoint/JSON body, persistence and tab behavior to work. Create a new normal/database document: version remains 1 and markdown null. Export/import Markdown using existing menus: behavior and 400 KB importer constraint remain the current implementation. Check Search Master/gallery snippets on normal documents and the scratch document's derived text; Markdown search text does not authorize opening it in Tiptap.

## M2 handoff and stop

No M2 work is authorized by this implementation. M2 needs a deliberate scratch/development-data creation/reset plan, a CodeMirror document lifecycle/DTO and save integration, browser-visible shared size/version limits, parser parity/source-position mapping, retained-tab and finder updates, and the approved performance baseline using TEST. Do not feed preserved stale JSON from a version-2 row to Tiptap. Efficient complete source ranges and archive-scale remapping remain future work; no archive acceptance is claimed. Existing JSON formatting/search behavior is intentionally retained until cutover/reindex decisions are approved.

Commit message suggestions: `feat(editor): add canonical markdown inspection`, `feat(documents): add markdown persistence path`, `docs(editor): record markdown persistence contract`. Source commits: `26b1991 feat(editor): add canonical markdown inspection` and `fea7765 feat(documents): add markdown persistence path`. The documentation commit and pushed HEAD are reported with delivery. Working-tree cleanliness is checked after commits. Stop after M1 and wait for explicit approval before M2.
