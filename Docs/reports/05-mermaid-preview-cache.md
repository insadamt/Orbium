# Phase 5 review — persistent Mermaid previews

Date: 2026-10-05.

## Scope and result

Mermaid source remains in the document JSON. The app now stores rendered SVG as disposable, document-scoped PostgreSQL cache data. Reopening a document loads the matching saved SVGs and avoids Mermaid layout for those diagrams. Existing uncached documents prepare their diagrams on first open; Markdown imports with diagrams show a preparation screen until the document saves and all eligible diagrams have been rendered and uploaded. Subsequent source edits prepare a new SVG after autosave. Saving removes cache entries for removed or changed sources.

## Changes

- Added `document_mermaid_previews`, keyed by document, source hash, and renderer version. The migration cascades when its document is deleted. SVG is not added to the 1 MB editor JSON format.
- Added an authorized preview upload endpoint. It accepts only a source present in the saved document, limits source and SVG size, and serializes with document saves so stale source entries cannot be inserted after a save removes them.
- Included matching cached previews in the document response. Browser display sanitizes cached SVG again. Newly rendered previews continue to use Mermaid's strict configuration and DOMPurify.
- Added progress and error feedback for first preparation. Unchanged diagrams are reused by source; invalid diagrams preserve their Mermaid code.
- Moved Markdown paste handling into its own module to keep the editor component at roughly 500 lines.

## Library decision and limitations

No dependency was added. The installed Mermaid 12 renderer already returns SVG, and the installed DOMPurify sanitizes it. [Mermaid's render API](https://mermaid.js.org/config/setup/mermaid/interfaces/Mermaid.html) supports this path. The [official Mermaid CLI](https://github.com/mermaid-js/mermaid-cli/blob/master/docs/already-installed-chromium.md) was considered for server rendering, but it relies on a browser runtime; Orbium's production image removes Node dependencies after the frontend build. The current browser renderer avoids that new deployment requirement.

This cache removes repeated Mermaid layout work. It does not virtualize the Tiptap document or guarantee that first-time rendering of a very complex diagram will not occupy the browser's main thread. SVGs are included in the document response, so cache hits trade rendering time for response size and SVG parsing. Browser timing with `test.md` is needed before making speed claims. Preview caching is limited to 200 distinct sources per document and 512 KB per SVG; larger or invalid previews retain editable source and report a cache error. A Mermaid version or rendering configuration change needs a cache version bump.

## Migration and compatibility

- New migration: `2026_10_05_000001_create_document_mermaid_previews.php`.
- Document JSON format and Markdown export remain source based. Old documents open and fill missing cache entries. Old cache versions are ignored and removed on a later save.
- Deployments must run `php artisan migrate` before serving the new code.

## Validation

- `./vendor/bin/pint --test`: passed.
- `npm run types:check`: passed.
- `npm run lint`: passed, 215 formatted files and 154 linted files in scope.
- `npm run build`: passed; existing large-chunk warnings remain.
- `php artisan route:list --path=mermaid-previews`: passed; one POST route registered.
- `git diff --check`: passed.
- Automated tests were neither written nor run, per user instructions. Manual checks below remain for the user.

## Manual test checklist

1. Run `php artisan migrate`, create an empty document, and import `test.md`. Expected: a preparation screen displays diagram progress, then closes; the document becomes editable and its save indicator reads Saved.
2. Refresh and scroll through several diagrams, including one near the end. Expected: previously prepared diagrams appear without a new Mermaid layout pass or prolonged Rendering message. Compare opening and scrolling time with the prior build on the same browser and device.
3. Edit one Mermaid source into a valid diagram, wait for Saved and preparation to finish, then refresh. Expected: the new diagram appears and the old SVG is not shown. Edit it back and repeat.
4. Enter invalid Mermaid, wait for Saved, switch to Preview, and refresh. Expected: an error is shown, the source remains editable, and other diagrams still display.
5. Duplicate a Mermaid block, refresh, then delete or change one copy. Expected: identical sources display correctly; a cache entry is kept while any block still uses its source and removed after the last use is saved.
6. On a disposable document, interrupt the network during preview upload and then reload online. Expected: source content remains saved; missing previews can be prepared on the next open.
7. Open a document from a different account or workspace. Expected: its diagrams are visible only to its owner, and the preview upload endpoint rejects unauthorized access.

## Commits

No commit created. Suggested message: `feat(editor): persist Mermaid SVG previews per document`.

## Stop gate

Remain in Phase 5 review for the user's manual validation.
