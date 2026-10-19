# Boards — Block presentation refinement

## Phase and outcome

2026-10-18, current phase-4 review. The user approved the proposed next enhancement, starting with block presentation, with “okey go ahead”. This pass refines the existing native blocks as one visual system.

## Implemented

- Consolidated final block presentation into `resources/js/components/boards/board-block-presentation.css`. Removed the historical presentation section from `board-object-design.css`, leaving selection/inspector geometry there.
- Shared body size/leading, content border, tint, radius and caption tokens. Typography applies to both preview and active content: body 16px/1.65, headings 36/28/21px, tables 14px, code 13px, captions 12px.
- Refined transparent writing, links, inline code, list spacing and checked-item tone. Quotes use a restrained rule; callouts use a quiet surface and directional accent.
- Tables have internal row/column rules, clear first-row weight and preserved selected-cell contrast. Outer padding no longer doubles the table frame.
- Removed the duplicated outer code language label. The existing shared code renderer supplies one language/Copy header; preview/edit headers have matching 44px minimum height, with consistent code padding.
- Consistent equation/diagram padding, image corner treatment, secondary captions, media empty states and caption fields.
- Refined resource titles, metadata, header spacing and preview rhythm. “Linked document/database/board” is now actual rendered text, rather than a CSS-generated prefix.
- Preserved transparent writing/images, shared Normal/Frosted appearance, manual media dimensions, typed native data, editing/history behavior, ownership and recovery contracts.

## Review artifact

Standalone gallery: `/home/insayd/.codex/visualizations/2026/10/18/01a150cc-41d5-76b0-b14a-15ebb5724ca8/boards-presentation.html`.

It embeds the application's block styles and has light/dark and Normal/Frosted toggles. It contains fictional representative text, lists, a table, code, resource metadata, media, equation and diagram samples. Image/equation/diagram content is illustrative; the gallery is not a live Board or a screenshot. Its controls do not exercise persistence, editing, players or renderers. Visual acceptance still requires the actual Board checklist below.

## Compatibility and scope

No migration, dependency, API or stored-format changes. Typography can change wrapping and cause the existing automatic text-height measurement to settle/save an updated height once. Manual object positions and media dimensions are retained.

This pass does not add table column dragging, image tools, richer resource data, spreadsheet paste, block conversion, Mind Maps or a later phase. Those remain separate proposed enhancements. Existing unrelated uncommitted work is preserved. No commits were made.

## Validation

| Check | Actual result |
|---|---|
| Targeted `vp fmt` | Passed for all six changed source files |
| `npm run types:check` | Passed; `tsc --noEmit`, exit 0 |
| `npm run lint` | Passed; 628 files correctly formatted, 526 files without warnings/errors |
| `npm run build` | Passed in 14.28s |
| `git diff --check` and separate whitespace inspection of untracked changed files | Passed |
| Source size | Presentation CSS 303 lines; Board canvas 493 lines; changed source files remain under 500 lines |

The build retains existing mixed static/dynamic import warnings for document-image-crop-dialog, database-property-header and document-editor-loader, plus large-chunk and plugin-timing notices. Full log: `/tmp/orbium-board-presentation-build.log`.

No automated tests were written or run. PHP/migration checks do not apply to these frontend presentation changes. Live visual acceptance was not performed; source/static checks and the gallery do not substitute for manual browser review.

## Representative-board manual checklist

Use a disposable Board named **Presentation review**. Start at 100% zoom. Put ordinary writing/list/quote samples together, table/code/callout samples together, and media/resources together so each group can be compared at ordinary zoom instead of shrinking the entire Board to fit.

1. **Typography group:** create headings at all three sizes, a paragraph with bold, a link and inline code, a three-item list and a checklist. Expected: a clear size hierarchy, consistent reading rhythm, restrained inline styles and readable list markers. Toggle a checklist item: state remains correct and completed text is quieter.
2. **Quote/callout group:** add the same two-line text as a quote and a callout. Expected: quote remains transparent with a quiet rule; callout has a subtle distinct surface, balanced inset and no oversized header/card chrome.
3. **Preview/edit comparison:** double-click each writing/list/table sample, type, undo, and finish. Expected: matching fonts/wrapping and stable content origin; formatting/structural controls remain outside content. Initial automatic-height settling after the new typography is expected; repeated edit entry alone should not keep changing height.
4. **Table group:** create a 3×2 table with first row “Area / Next action” and different values beneath. Navigate with Tab, select cells and edit. Expected: subdued first row, aligned padding, internal rules without a heavy double outer frame, and a distinguishable cell selection.
5. **Code group:** insert TypeScript code with multiple lines. Expected: exactly one language/Copy header in preview; Copy works, syntax remains readable and editing shows the language control/Copy without adding a second header. Empty code shows its placeholder below the header, not on top of it.
6. **Media group:** add landscape and portrait images with captions, an empty image/file object, and a playable file. Expected: images preserve their existing fit and resize behavior; captions are secondary; empty actions are readable; player controls remain reachable and working.
7. **Equation/diagram group:** add nonempty Math and Mermaid blocks, including a wide diagram. Expected: balanced inset, readable content, working source editing/full-preview controls, and usable internal scrolling when needed.
8. **Resource group:** link a Document, Database and another Board. Expected: title hierarchy and actual “Linked …” metadata are clear; Refresh/Open still work; Document editing persists to its original; card removal keeps its target.
9. **Appearance:** repeat the comparisons in light/dark and Normal/Frosted, plus reduced transparency if available. Expected: readable body/metadata, consistent shared Frosted treatment, visible selection indicators and no unexpected opaque wrappers around bare writing/images.
10. **Zoom and narrow views:** inspect at 50%, 100% and 200%, then in a roughly 390px-wide viewport. Expected: no additional headers, clipped controls or caption overlap; ordinary body content is judged at 100%, while camera/selection/resize behavior remains as before.
11. **Persistence:** wait for Saved, reload, and review the three groups again. Expected: text, formatting, original resource links, object positions and settled text heights persist. Undo/recovery/navigation protections continue to work as described in the UX correction report.

## Commit suggestions

- `style(boards): unify native block presentation`
- `fix(boards): remove duplicate code preview headers`

## Stop gate

Remain in phase-4 manual review. No later feature phase started.
