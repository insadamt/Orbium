# Native Board icons, text selection and Mind Map zoom — 2026-10-28

## Authorization and outcome

The user reported that native Board text fields did not support `/icon`, requested icons that can be selected with ordinary text throughout rich-text blocks/page types, and requested local Mind Map Ctrl/Cmd plus/minus and wheel zoom. This is a correction within the current inline-icon review, preserving the preceding uncommitted selection-color work. It supersedes earlier reports' native-Board icon exclusion and click-to-replace behavior. No later phase was started.

### Insertion and persistence

- Native Board text, H1–H3, quote, callout and bullet/number/checklist editors now include the existing inline-icon atom, its serializer and preview. The slash menu includes **Inline icon** at the start of a field and `/icon` can also be used inside a sentence or an individual list item. Opening/cancelling preserves the command and neighboring content. The formatting toolbar offers insertion/replacement at the selected range.
- Board tables, Document tables and nested rich callout editors now mount inline-icon completions and the full shared picker. `/icon`, colon completions, Library image reuse and custom uploads work through their original owner. Nested editors use an explicit preference scope, so their separate React roots do not require Inertia page context. Picker clicks keep the active table/callout editor mounted.
- Native Board previews render Lucide, brand and custom icons with existing text marks. Block transforms, native copying, duplicate/history and saved data retain atoms rather than flattening them into empty text. Icon-bearing native text uses the normal React renderer when Instant Scene is enabled; other prepared text remains on its existing path.
- Server validation accepts bounded version-1 icon attributes and validates marks, source names, image ownership, purpose and MIME type. Attachment discovery includes native text/list/row icons, so existing Library usage/deletion protection applies. Older Mind Map inline-content versions retain their earlier text-only contract.

### Selection and formatting

- Normal click/drag is available to the editor selection system. Icons are atomic inline content with text-selection CSS; their SVG/image children do not capture pointer events. **Double-click** explicitly opens replacement. Ordinary typing, Shift+Arrow selection, Backspace/Delete and selections spanning text plus icons use editor behavior.
- The legacy Document selection toolbar now accepts icon-only selections and mixed text/icon selections. Previously it rejected every nontext atom. This applies to ordinary, database and hosted Documents through their existing editor.
- Markdown's atomic formatting runs now preserve icon identity through bold, italic, strike, underline, link and color changes. Inline code remains literal syntax and does not turn icon metadata into a code token. Native editors keep the existing text marks, and newly inserted/replaced icons retain the insertion/selection marks.
- Native icon clipboard text includes its canonical Markdown token. Rich HTML retains native atoms; valid inline Markdown icon snippets can be pasted into native editors. This supports text/icon copying between the app's native and Markdown editors while preserving safe marks/references. Unsupported block-shaped snippets keep the normal paste path. A plain external text destination may show the canonical token rather than artwork.
- The icon modal has no color controls. Selection-based colors from the earlier correction remain.

### Mind Map navigation

- Wheel/trackpad wheel over a map zooms locally, including Ctrl/Cmd+wheel. Wheel units are normalized and individual deltas are bounded. The pointer's map coordinate anchors the zoom; keyboard zoom uses the viewport center. Zoom is clamped to the existing view-control range.
- With the canvas/fullscreen dialog focused, `+`, `=`, `-`, Ctrl/Cmd plus/minus and numpad plus/minus zoom the map. `0`/Ctrl/Cmd+0 fits and recenters it. Unmodified characters in text/number inputs retain their normal editing behavior. Nested dialogs keep their own keyboard handling.
- Nonpassive wheel handling cancels browser page zoom/scroll for the map surface. The Board camera's capture handler explicitly defers map wheel events, preventing an embedded map gesture from first zooming its parent Board. Zoom updates transient viewport state, with no graph save/history action. Dragging empty space and scrollbars remain available for panning.

## Compatibility and deployment

- New additive migration: `2026_10_28_000001_add_board_inline_icons.php`. It upgrades the Board envelope/default/check constraint from **7 to 8**, without rewriting object content. Native object content version remains **1**.
- The migration was inspected with `--pretend` and **applied successfully to the local PostgreSQL database**. Other deployments must run `php artisan migrate` with the matching server/frontend and reload open Boards.
- Full saves, PATCH mutations, resource insertion and recovery snapshots advertise format 8. Known earlier envelopes adapt explicitly; native icon atoms in a pre-8 envelope are rejected. Format-7 clients cannot save through the new server. Downgrade refuses while native Board icon atoms remain, including in Trash; existing Mind Map atoms are not falsely treated as new native icons by that guard.
- Document format, legacy icon attributes and Mind Map graph formats remain as before. Existing custom-image authorization/reference handling is reused. No package, external service or generated catalog change.

## Actual checks

- Targeted formatting/lint: passed.
- `npm run lint`: passed; 858 files formatted and no warnings/errors across 689 linted files.
- `npm run types:check`: passed.
- `npm run build`: passed in 17.25 seconds. Existing warnings remain for large chunks, ineffective dynamic imports and plugin timing.
- Targeted `vendor/bin/pint --test`: passed for all five changed/new PHP files.
- `php -l`: passed for BoardBlockData, BoardContent, BoardInlineIcons, MindMapData and the additive migration.
- `php artisan migrate --pretend --path=database/migrations/2026_10_28_000001_add_board_inline_icons.php`: passed; inspected the four format/default/constraint operations.
- Targeted migration application: passed, 32.38 ms, local PostgreSQL.
- `git diff --check`: passed after documentation updates.

No automated tests, Playwright, browser automation or screenshots were written/run. Browser selection/clipboard/pointer feel and persistence acceptance remain pending manual review. Nothing was staged or committed.

Initial checks caught a nullable clipboard attribute, an unused binding/control-character lint warning and the separate-root authentication dependency; these were corrected before final checks. The first sandboxed migration-status query could not reach PostgreSQL; the approved local command succeeded, followed by SQL inspection and application.

## Exact manual test checklist

Reload the updated frontend/server before testing. Use disposable content and the same workspace for clipboard/image reuse checks.

1. **Board text and sentence insertion:** create a Text block, type `/` and choose Inline icon; insert a Lucide rocket. Then type `before /icon after`, put the caret after `/icon` and accept the command. Expected: the picker opens, insertion stays inside the sentence and both neighboring words survive. Open/cancel another command; expected its source is retained without a save caused just by opening.
2. **Every native writing type:** repeat insertion in H1–H3, quote, callout and bullet/number/checklists, including the second list item. Expected: icon remains inline, other items/check states/indents survive, and the block does not change type. Verify Emoji, Brands and Custom in addition to Lucide.
3. **Board tables:** test a basic table and a rich table with header/merged cells. Edit a cell and type `/icon` or `:rocket`. Expected: picker/completions work within that cell, only one picker opens and the editor stays mounted while browsing. Save/reload; expected icon, cell structure and marks survive.
4. **Document/page coverage:** repeat in a Markdown Document, a Document inside a database, an available legacy Document and hosted Markdown/legacy Document cards on a Board. Include paragraphs, headings, lists, quotes, callouts and table cells. Expected: the original page owns the save and each rich-text surface supports inline icons.
5. **Mind Map content:** in maps hosted by a Board and a Document, insert icons into topic paragraphs, headings, lists, quotes and callouts. Expected: measured height, topic width and existing formatting remain; finishing editing shows the same symbols/colors.
6. **Mixed pointer selection:** write `one [icon] two [brand] three`. Drag from before `one` to after `three`, then repeat with a selection beginning/ending on either side of an icon. Expected: icons can be included with text, no replacement modal opens during normal selection, and no hidden metadata fragments appear. Repeat native, Markdown, table/callout and Mind Map editors.
7. **Keyboard/toolbar selection:** use Shift+Arrow across an icon in both directions; select only an icon, then select text plus an icon. Expected: whole icons are selected, the formatting toolbar remains available in legacy Documents and Board/Mind Map editors, and surrounding text is not skipped. Apply color, bold/italic, strike/underline and a safe link; expected identity/reference remains intact and ordinary text formatting survives.
8. **Replacement and deletion:** double-click an icon to replace it, or use Insert inline icon with an icon selected. Expected: one symbol changes and its selected/insertion marks remain. Delete a selected icon or a text/icon range, then undo/redo. Expected: complete content restores/removes through normal editor history, without losing neighboring text or exposing syntax.
9. **Clipboard:** copy a text/icon selection between native Board fields, legacy Documents, Mind Maps and Markdown prose/cells in the same workspace. Expected: supported inline snippets retain symbols and safe marks; native rich HTML remains atomic. Plain external text may show canonical Markdown icon tokens. Paste into code/source fields; expected literal text rather than injected rich atoms.
10. **Custom images:** use a Library image and upload a PNG/WebP from native Board and table pickers. Expected: insertion completes, typing focus returns, the icon survives reload and saved Library usage protects it from deletion. Pending uploads guard Board switching/leaving through the existing owner busy state. Foreign-workspace/nonimage references must fail validation rather than save or expose another workspace's content.
11. **Transform/recovery:** change a native Board text block containing an icon into a heading/quote/list, duplicate it, then undo/redo and reload. Expected: icon/marks survive. Open older disposable Board content/drafts; expected known formats adapt without dropping ordinary text. A stale format-7 save must fail without overwriting format-8 content.
12. **Fullscreen map zoom:** open Mind Map Edit and read-only full preview from both Document and Board owners. Use Ctrl/Cmd+`+`, Ctrl/Cmd+`-`, numpad plus/minus, wheel and Ctrl/Cmd+wheel over the map. Expected: only map scale/percentage changes; browser page zoom and the parent Board camera stay unchanged.
13. **Anchoring/Fit:** zoom with the pointer near a branch, zoom a panned large map and a single-topic map, then press `0`/Ctrl/Cmd+0 and use Fit. Expected: zoom stays near the pointer/center as appropriate, Fit recenters the visible tree, and view changes do not create Saved/history actions. Drag blank canvas/scrollbars to pan.
14. **Editing/zoom boundaries:** type ordinary `+`, `-`, `=` and `0` inside a topic or number field. Expected: text input remains normal. Ctrl/Cmd plus/minus still controls the focused map. Close the map and use page zoom outside it; expected normal browser behavior. Open a picker/nested dialog and check its scrolling/keyboard behavior remains local.
15. **Themes/read-only:** repeat selection, custom icons, zoom and reduced-motion behavior in Light/Dark and a narrow window. Expected: readable controls/selection, no write from a read-only surface, no icon-modal color control, and no accidental parent-page/Board movement.

## Boundaries

Rich prose editors are covered. Code, math/diagram source, filenames, titles and other scalar metadata fields retain their literal contracts; this change does not embed visual atoms into those strings. Emoji/platform artwork and custom raster icons retain their original pixels. Office/clean export artwork fidelity retains the existing readable fallbacks. Actual browser/runtime acceptance is manual.

## Suggested commits

- `feat(editor): support native board icons and text-like inline selection`
- `fix(mindmap): keep keyboard and wheel zoom inside the canvas`

Stop for manual review within the current correction slice.
