Summary: Reports the inactive V3 syntax/index implementation, actual static checks and manual parser/round-trip/recovery steps. It depends on `../docs/25-v3-document-structure.md`, the preserved V3 specification and stage-1 integration map; application activation belongs to later stages.

# V3 stage 2 — syntax, validation and structural index

## Phase and delivered behavior

The user approved the next stage with “next” on 2026-10-31. This stage implements the isolated V3 foundation described in specification section 12.2. It does not enable partially integrated V3 saves or advance into the transaction/keyboard/column UI stages.

- Shared canonical type, ID, resource-limit and version contract in `resources/js/lib/editor-v3-contract.json`, used by PHP and TypeScript. Future saved/file version 3 and `stable_blocks: 1` are explicit; the active format-2 contracts are untouched.
- Strict single-line headers, recognized types, UUID generation helper, global block/column identity uniqueness, duplicate/unknown JSON-key validation, Unicode checks and source bounds.
- Matching scoped scanners for ordinary/rich blocks, persistent column identities, dynamic directive fences, literal code/math, escaped/indented examples, explicit empty blocks and source diagnostics. Markdown syntax does not infer block identity/type.
- Frontend ID/scope maps and binary range lookup. A CodeMirror state field maps safe single-line body edits, reparses potentially structural edits, retains actual invalid source and keeps a separate last-valid source/index snapshot. Invalid indexes return no edit targets.
- Native V3 file codecs preserve validated body bytes after LF/BOM normalization; older envelopes are rejected by these codecs. No existing transfer UI or package format is changed.
- Read-only `documents:inspect-v3` CLI command, isolated frontend source-state inspector and two manual `.orbie` samples. None import/save content or mount an app editor.
- Documented exact source-range units, formal type names, structural-only validation scope and future activation requirements in `../docs/25-v3-document-structure.md`.

## Limits and integration boundary

The existing UI, animations, Enter/Shift+Enter behavior, source/live rendering, autosave, stored format 2, hosted documents and file import/export paths remain active as before. These foundation modules are not installed into them. Existing bullet/checklist corruption is not claimed fixed in this stage.

Structural validation does not replace existing rich-body schema, safe URL/rendering, workspace/attachment/reference or authorization checks. Those must be combined before runtime activation. The manual math-literal example demonstrates header opacity, not KaTeX validity.

Ordinary safe body changes avoid full-source parsing/serialization but still map flat ranges and rebuild lookup maps. Structural changes currently rescan the bounded document. Runtime performance and frontend/PHP behavioral agreement remain unmeasured; there is no performance improvement claim.

Frontend coordinates are UTF-16; PHP coordinates are UTF-8 bytes. The output identifies its unit explicitly. PHP ranges must not be fed directly to CodeMirror for Unicode source.

New source files are under 500 lines. No dependencies, database migrations, user-data resets, persistent format activation or old-document adapters were added. TypeScript JSON-module resolution was enabled solely to import the shared contract. Prior stage-1 documentation remains in the working tree.

## Actual verification

| Check | Actual result |
| --- | --- |
| Targeted `npm exec -- vp check --fix resources/js/components/editor/markdown/structure resources/js/lib/editor-v3-contract.json tsconfig.json` | PASS: formatting completed; no warnings/lint errors in all seven lintable TS files. |
| `npm run types:check` | PASS, exit 0 after correcting the scanner's explicit owner type annotation. |
| `./vendor/bin/pint --test` | PASS, exit 0; PHP formatting only. |
| `php -l` on the seven added PHP files | PASS for all seven. |
| `npm run lint` | FAIL, exit 1: the same 18 existing formatting findings documented in stage 1; none of those files were changed. |
| `npm run build` | PASS, exit 0, 5709 modules transformed, 17.13 s. Existing chunk-size, ineffective dynamic import and plugin timing warnings remain. |
| `php artisan documents:inspect-v3 --help` | PASS: command registration/options are available; this does not execute the parser. |
| Tracked/new-file whitespace and documentation review | PASS after final changes. |

The inactive foundation is covered by types and targeted lint; the main production build does not exercise parser behavior or bundle these unused modules through an app entry point. Build time is not a runtime benchmark. `Docs/**` remains ignored by the repository formatter/linter and was reviewed separately.

No automated tests, browser automation, fixture parser runs or runtime assertions were executed by the agent. The checklist below is for the user's manual verification. `php artisan test`, `npm run test` and Playwright were not run.

Static review also corrected dollar/code fence whitespace matching, avoided repeated full-column scans while counting layout children, preserved JSON numeric semantics across PHP/JavaScript validation and kept Unicode line-separator characters inside single LF-delimited metadata lines.

## Manual checklist — CLI

Run commands from the repository root. Use copies in `/tmp` for destructive sample edits; do not import the samples through the existing Document UI.

1. Run `php artisan documents:inspect-v3 Docs/examples/orbium-v3-structure.orbie`.
   - Expected: exit 0, `valid: true`, title `V3 structure review`, `offsetUnit: utf-8-bytes`, exactly 10 structural blocks. The `review-empty` paragraph is retained with an empty body. The bullet list/checklist/divider have their explicit types. Literal/escaped/indented examples do not become extra identities, even where their ID repeats `review-summary`.
2. Run `php artisan documents:inspect-v3 Docs/examples/orbium-v3-columns.orbie`.
   - Expected: exit 0, exactly seven blocks and two columns. `review-layout` is a root `columns` block; `review-left` and `review-right` belong to it; each has two children ordered 0/1. `review-after-layout` has `parentId: null`. The fence-like line inside the right-hand code block does not close the column. Four directive records describe the layout, both columns and the left presentation wrapper.
3. Copy the structure sample to `/tmp/orbium-v3-invalid.orbie`; change `review-checklist` to `review-bullets` in its actual header. Run the inspector on the copy.
   - Expected: exit 1 and a duplicate-ID error with a source line. The original file, user documents and copied content remain untouched by inspection.
4. Restore the copy and repeat separately with an empty ID, unknown type, duplicate `id` JSON keys, escaped duplicate key `"\u0069d"`, extra header key, malformed JSON and `++endblock`.
   - Expected: each fails clearly; there is no identity regeneration, automatic legacy conversion or silent block removal.
5. Copy the columns sample to `/tmp/orbium-v3-columns-invalid.orbie`. Separately remove a column ID; give a child block the same ID as `review-left`; change widths to `[3000,3000,4000]`; add an unexpected direct block between columns; change a column child to a nested `columns` block.
   - Expected: each copy fails for identity, column-count, invalid-parent or nested-layout structure. Valid children in the original sample remain intact.
6. On another copy remove the final closing literal fence, then separately a column/layout closing directive. Try a native envelope with version 2 or 4.
   - Expected: incomplete source and unsupported native versions fail; content is never rewritten by the inspector. Unclosed literal content is not exposed as safe new sibling blocks.
7. To see the complete diagnostic records, remove only the first native envelope line in a disposable copy and run `php artisan documents:inspect-v3 /tmp/orbium-v3-body.md --body`.
   - Expected: body inspection returns JSON `structure.diagnostics` with `code`, `message`, one-based `line` and byte `from`/`to`; a valid body is accepted without an envelope. The native mode requires its versioned envelope.
8. Try a URL as the command path, an unavailable file and, if already available locally, a named pipe/device path. Review the shared limits and inspect an over-limit disposable source if desired.
   - Expected: only readable bounded regular local files are accepted. Invalid UTF-8, NUL, raw CR in `--body`, overlong lines/source and excessive nesting are rejected. Native file decoding normalizes a leading BOM and CRLF/CR before source validation.

## Manual checklist — frontend index, round trips and recovery

Use the development app with its existing Vite server running. Open developer tools. These commands operate on an isolated in-memory state; they do not change the open Document. If the page has no `/@vite/client` script, start the normal development setup and reload first; this is not a production-console workflow.

1. Import the manual inspection modules and load the sample through the development server:

   ```js
   const viteOrigin = new URL(document.querySelector('script[src*="/@vite/client"]').src).origin;
   const v3Files = await import(`${viteOrigin}/resources/js/components/editor/markdown/structure/v3-document-file.ts`);
   const v3Review = await import(`${viteOrigin}/resources/js/components/editor/markdown/structure/v3-source-inspection.ts`);
   const nativeSample = await fetch(`${viteOrigin}/Docs/examples/orbium-v3-structure.orbie`).then(response => response.text());
   const decoded = v3Files.decodeV3DocumentFile(nativeSample);
   const inspection = v3Review.createV3SourceInspection(decoded.source);
   inspection.inspect();
   ```

   - Expected: `valid: true`, `updateKind: parsed`, 10 blocks, no diagnostics and unchanged body source. Compare identities, types and scope with the PHP result. Numeric offsets after Arabic/emoji differ because the frontend explicitly reports UTF-16.
2. Inspect `decoded.index.blockById('review-empty')`, `decoded.index.neighbor('review-bullets', 1)` and `decoded.index.blockAt(decoded.source.indexOf('TASK-GAMMA'))`.
   - Expected: the empty paragraph exists; the neighbor and task location resolve `review-checklist` with type `checklist`. A lookup at `decoded.source.length` resolves the final root paragraph. Native headers never become inferred Markdown types.
3. Evaluate `v3Files.decodeV3DocumentFile(v3Files.encodeV3DocumentFile(decoded.title, decoded.source)).source === decoded.source`. Repeat with the columns file and a copy using CRLF/BOM.
   - Expected: `true` for canonical LF body, all IDs/empty blocks/directives retained. Native BOM/newlines normalize once; subsequent round trips preserve the normalized body. Envelope JSON spelling is allowed to canonicalize.
4. Make an ordinary body edit:

   ```js
   const bodyPosition = inspection.inspect().source.indexOf('PARAGRAPH-DELTA') + 'PARAGRAPH-DELTA'.length;
   inspection.applySourceChanges({ from: bodyPosition, insert: '!' });
   ```

   - Expected: `valid: true`, `updateKind: mapped-body`; same IDs/types/order, later ranges moved by one UTF-16 position. Only the isolated source changes.
5. Make a malformed source edit while retaining a recovery snapshot:

   ```js
   const validSnapshot = inspection.inspect().source;
   const typePosition = validSnapshot.indexOf('"type":"paragraph"') + '"type":"'.length;
   inspection.applySourceChanges({ from: typePosition, to: typePosition + 'paragraph'.length, insert: 'unknown' });
   ```

   - Expected: `valid: false`, `updateKind: parsed`; `source` still contains `unknown`, diagnostics identify the header, and `lastValidSource === validSnapshot`. There is no automatic rollback/rewrite. A `V3DocumentIndex` built from an invalid parse returns no block/column edit targets.
6. Repair that edit with `inspection.applySourceChanges({ from: typePosition, to: typePosition + 'unknown'.length, insert: 'paragraph' })`. Separately try adding a new line/structural header in a disposable inspection state, including an incomplete header, then repair it.
   - Expected: valid structure recovers after repair with existing IDs intact. Structural/line-break edits take the `parsed` path; raw incomplete text remains visible in the inspection result while invalid.
7. Repeat the ordinary edit inside `LEFT-TEXT` in the columns sample. Inspect the block ranges, its `parentId`, the second column's IDs and trailing root sibling before/after. Make a duplicate child ID and then repair it.
   - Expected: the safe child edit maps the owner structure without serializing the layout; all unrelated source bytes/identities stay unchanged. Duplicate identity disables current edit targeting until repaired; the last valid snapshot stays separate.
8. Open an ordinary Document, a database Document and a Board-hosted Document through the normal app; use existing source/live, typing, save/reload and import/export controls.
   - Expected: current format-2 behavior is unchanged. V3 samples remain unsupported by the existing import UI in this stage. No menus, motion, keyboard semantics or persistent user content have changed.

These outcomes are expected manual acceptance criteria, not agent-observed results. A real source/live editor's caret/header protection, rich rendering, undo semantics, saved round trips and performance still require later integration and manual review.

## Commits and stop gate

No commits created. Suggested message:

```text
feat(editor): add V3 structural parsing and source index foundation
```

Stop for stage-2 review. Fix reported parser/index issues within this stage. Explicit approval is required before stage 3 (stable-ID owner transactions); no stage-3 editing operations or active V3 save path were started.
