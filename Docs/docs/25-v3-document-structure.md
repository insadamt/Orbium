Summary: Defines the inactive V3 structure foundation so later editor transactions and integrations use identical boundaries and version guards. It depends on `../phases/orbium-v3-document-editor.md`, the shared JSON contract, existing Orbium metadata validators and the stage-2 review gate.

Current runtime: stage 6 activates these foundations in the product. See [Active V3 editor](29-v3-active-editor.md); the stage descriptions below retain their original implementation/review boundaries.

# V3 structure foundation

## Activation boundary

Stage 2 adds isolated frontend/PHP parsing, source indexing and native codecs. It does not install them in `markdown-editor.tsx`, change `MarkdownContract::FORMAT_VERSION`, advertise new capabilities, accept V3 in the existing transfer UI, or save V3 to the database. The existing format-2 product remains active.

The future matched runtime contract is saved `content_format_version: 3`, native `.orbie` envelope `version: 3`, dialect `orbium-markdown-v3` and `editor_features.stable_blocks: 1`. These are declared in `resources/js/lib/editor-v3-contract.json`, consumed directly by TypeScript and PHP. Document package manifest version is a separate contract; no package version/definition is changed here. Stage 6 must switch every reader/writer together after transaction, preview and column integration is safe.

Stage 3 adds the still-inactive owner command layer described in `26-v3-owner-transactions.md`. Its candidate validation reuses the field's exported pure safe-body range mapper; no additional document authority or automatic parser activation is introduced.

Historical development files receive no V3 migration. Isolated V3 codecs reject non-V3 envelopes; existing format-2 UI behavior remains until activation. No documents are reset or deleted.

## Identity and types

A structural header is column-zero `++block {"id":"…","type":"…"}++` on one LF-delimited line, with optional trailing spaces/tabs. Exactly `id` and `type` are permitted. Duplicate JSON keys, including escaped spellings of the same key, are rejected. There is no closing block marker.

IDs are 1–128 ASCII letters/digits/underscores/hyphens, starting with a letter or digit. This includes the specification's illustrative IDs and UUIDs. Production creation uses cryptographic UUIDs; the frontend helper calls `crypto.randomUUID()` without a weak fallback. Block and column IDs share one uniqueness namespace per document. Node, attachment and map-topic identities remain separate semantic data.

Canonical names are `paragraph`, `heading-1` through `heading-6`, `bullet-list`, `numbered-list`, `checklist`, `quote`, `callout`, `divider`, `code`, `mermaid`, `math`, `table`, `image`, `file`, `video`, `audio`, `pdf`, `mindmap`, and `columns`. This formalizes existing supported content; no new slash commands or H4–H6 UI are introduced. Markdown syntax does not infer/change these identities or types.

## Source ranges and scopes

`v3-structure-parser.ts` and `V3StructureParser` produce block, column and directive ranges plus bounded diagnostics. `parentId: null` means root flow; a child block's `parentId` is its column ID. A column's `layoutId` is its owning columns block. `order` is zero-based among siblings in that scope.

- `from` is the start of the header line; `headerTo` excludes that line's LF.
- `bodyFrom` begins after the LF, or at EOF for a header without a final newline.
- Ordinary `bodyTo`/`to` reach the next sibling header, column close or EOF. Blank body/separator bytes are retained; an explicitly empty block remains a record.
- A column's `bodyTo` is the start of its closing directive line; `to` includes that line and its LF if present.
- A complete layout ends at its outer directive close. Its block `bodyTo` excludes the closing line's LF; `to` includes it. Whitespace after a closed layout is a gap, not an extra implicit block.
- Every directive records owning `blockId`, metadata, colon fence length, header/body/complete ranges. Structural editing can use these spans without guessing Markdown nodes.

Frontend ranges use CodeMirror UTF-16 positions (`offsetUnit: utf-16`). PHP ranges use native UTF-8 byte positions (`offsetUnit: utf-8-bytes`). Do not send a PHP byte range directly to CodeMirror or compare numeric positions across Unicode source without conversion. Source line numbers in diagnostics are one-based and shared.

An empty body document with no blocks is a valid structural starting state; stage-3 creation decides when to insert its first identified paragraph. Existing source bytes are never reserialized by structural parsing. Parsing errors do not authorize removing offending text or inventing identities.

## Literal and directive recognition

The scanner tracks matching backtick/tilde code fences, dollar math fences, and Orbium directive scopes. Header-like lines inside those literals, escaped lines, indented code and opaque rich/presentation directive bodies are not new block identities. List items and quote/callout internals do not acquire their own IDs. An incomplete literal/directive reports a diagnostic rather than exposing its contents as safe sibling edits.

Existing rich/presentation metadata rules are reused. Column directives additionally require exactly `kind: column` and a valid `id`. A `columns` block must contain exactly one root columns directive, with two/three widths of at least 1500 totaling 10000; direct children are matching column directives. Nested columns, a fourth column, unowned layout text and headers outside a column inside the layout fail validation. A layout's children may use the existing nested rich/presentation directives.

Outer colon fences must be longer than nested fences, matching the current serializer's fence-selection strategy. Closing fences match their opening length. Headers inside code do not affect directive closing or identity uniqueness.

Limits are canonical source 2 MiB, each source line 128 KiB, 100,000 LF-delimited lines, 100,000 blocks, directive/metadata nesting 32, and 100 reported diagnostics. Source must be valid Unicode without NUL and use LF. Native file decoding first normalizes a leading UTF-8 BOM and CRLF/CR line endings, matching existing import normalization; body bytes are then preserved. Titles contain 1–255 Unicode scalar characters, with no CR/LF/NUL and at least one non-whitespace character.

This is structural validation. It is not a substitute for the existing complete rich-body schema checks, safe URL/rendering rules, workspace reference validation, upload authorization or save transaction. Stage 6 must combine those checks with the new structure before enabling persistent V3 writes. The math literal in the review sample illustrates parsing opacity; it does not claim a valid KaTeX expression.

## Incremental index and invalid source

`V3DocumentIndex` provides ID maps, scoped sibling lists and binary range lookup. Invalid structures retain diagnostics/range records for inspection but return no block/column edit targets. At a column delimiter the range lookup resolves its layout; a block lookup at EOF can resolve the final block, including an empty final block.

`v3StructureField` derives its state from the owner's immutable CodeMirror `Text`. Ordinary single-line body changes map existing block/column/directive ranges and update source-byte accounting without whole-source serialization or reparsing. Changes involving structural/literal lines, line breaks, invalid Unicode/limits, headers or an already-invalid document fall back to a bounded full structural scan. It currently maps the flat range arrays and rebuilds lookup maps; no constant-time update or measured performance improvement is claimed. More localized structural rescanning can be refined only with evidence.

The field keeps a last-valid index **together with its own original source snapshot**. When current raw source is invalid, it remains fully available and current edit-target lookup is disabled. Recovery snapshots never authorize writes against new coordinates. The field adds no transaction filters, source rewrites, independent history, editor mounts or UI. Later mode/transaction integration must render diagnostics and preserve this distinction explicitly.

## Manual review entry points

`php artisan documents:inspect-v3 <path>` decodes a native V3 file and prints JSON; `--body` inspects envelope-free LF source with structured diagnostics. The command reads bounded regular local files, rejects URL wrappers/pipes/devices and performs no import/database writes. Native decoding throws on invalid structure instead of silently returning a partially accepted document.

`v3-source-inspection.ts` allows manual development-console changes against an isolated CodeMirror state without mounting a view or touching the app's current Document. `v3-document-file.ts` exposes native encode/decode and index lookups for the same review. These are manual tools with no automatic assertions or test runner.

Use `../examples/orbium-v3-structure.orbie` and `../examples/orbium-v3-columns.orbie` only through these review entry points. The exact commands, expected ranges/identities, invalid-source recovery and native round-trip steps are in `../reports/orbium-v3-stage-2-structure.md`. Do not import the samples into the current format-2 editor.
