# Inline icon picker redesign and full catalogs

## Phase and authorization

Inline-icon manual review, 2026-10-26. The user reported “the UI/UX is bad” and requested all emoji/icons that can be added. This authorizes the picker/catalog correction within `../phases/14-inline-icons.md`. It does not start another product phase. This report supersedes the original report's curated-catalog and picker-layout limitations.

## What changed

- Replaced large labeled tiles and tiny per-tile stars with a compact 460px picker, fixed search, four source tabs (**Emoji, Icons, Brands, Custom**), category browsing and a preview/favorite footer. Names appear on hover/focus and in the footer, leaving the grid available for actual symbols.
- Added native keyboard navigation: Down from search enters the grid; arrows move by row/column; Home/End and Page Up/Down navigate results; Enter/Space inserts. Source tabs retain Left/Right/Home/End navigation. The search field receives opening focus, and closing/inserting/uploading restores editor focus.
- Added complete local catalogs: **3,972 emoji**, **1,760 Lucide icon/alias names** and **3,463 brand icons**. These are complete supported datasets, not a claim to aggregate every icon pack on the internet. Lucide aliases can share a glyph.
- Emoji include all fully-qualified sequences and standalone components from the official [Unicode Emoji 18.0 dataset](https://www.unicode.org/Public/18.0.0/emoji/emoji-test.txt). Categories, flags, skin-tone variants and mixed-tone sequences are retained. The tone selector defaults to unmodified emoji; **All tones** exposes every catalog entry. Searching for skin/tone terms also exposes matching variations.
- Icons include every generated icon/alias in installed `lucide-react` **0.475.0**. Brands include every icon exported by installed `simple-icons` **16.33.0**, with `brand-` names in the existing built-in representation. Packages were not upgraded and no dependency was added.
- Search normalizes accents, separators and shortcodes, includes common emoji aliases and package-supplied brand aliases, and ranks exact/prefix names in colon completion. Browse all icons selects a matching source, including Brands. Markdown completions show the actual emoji/icon instead of a generic diamond; numeric queries such as `:100` work.
- Recent/favorite preference validation now accepts the full known emoji catalog, including flags and keycaps that the previous pictographic-regex check could discard. Favorites use the larger preview-footer button and work for custom images before insertion.
- Replaced the nested full Library browser with a focused, searchable workspace-image grid, one-click insertion, Upload, retry/error feedback and Load more. It uses the existing authorized Library image listing and attachment endpoints; file management remains in Library.
- Virtualized grid rows bound mounted cells to the visible area plus three rows of overscan. The generator creates **42 local SVG packs**, loaded on demand and reused across cells/editor symbols. Packs contain at most 128 icon names, arranged in catalog order so opening an alphabetic source does not eagerly request all SVG packs. The complete name/search index remains available to search. No external icon request occurs while browsing or rendering saved content.
- Preserved saved icon names and structures. The generator checks that the original small built-in catalog remains present. Both editor clients now advertise `editor_features.inline_icons: 2`; server save guards reject earlier clients when icons are involved, preventing the old limited allowlist from flattening new names. Existing version-1 legacy icon attributes and format-2 Markdown spans are unchanged.

## Main files

- `resources/js/components/inline-icons/inline-icon-picker.tsx`: picker state, search, insertion, preview and favorites.
- `icon-picker-navigation.tsx`, `icon-results-grid.tsx`, `custom-icon-browser.tsx`: focused navigation, bounded grid and workspace image browsing.
- `icon-catalog.ts`, `icon-glyph-loader.ts`, `data/`: name/emoji catalogs, search and local SVG loading.
- `scripts/inline-icons/generate-catalog.mjs`: reproducible catalog compiler from pinned Unicode text and installed packages. It checks old names before replacing generated pack outputs.
- `resources/data/inline-icons/emoji-test.txt`: original official Unicode source, with SHA-256 recorded in `data/manifest.json`.
- `public/third-party/inline-emoji-license.txt`, `inline-brands-license.txt`, `inline-brands-disclaimer.md`, `inline-brands-sources.json`: distributed upstream notices and per-brand source/license/guideline metadata.
- Original editor adapters, save payloads, server allowlist and capability checks retain the existing ownership/history/autosave boundaries.

All changed source components/services remain below roughly 500 lines. Generated Unicode/catalog/SVG/license data are data artifacts, not application logic.

## Persistent data and deployment

- No migration or dependency change. Existing Document content formats and custom attachment references are preserved.
- Deploy the server and built frontend together and reload open editors because the icon capability is now 2. Earlier open clients receive the reload validation error rather than overwriting icon content.
- Brand icons use stable built-in names such as `brand-github`. Formatting-preserving export/import retains their identity. Clean Markdown and Office retain the earlier readable label/image fallbacks.
- Regenerate with `npm run icons:generate`; then format outputs using `npm exec -- vp check --fix resources/js/components/inline-icons/data public/third-party/inline-brands-sources.json`.
- Recent and Saved preferences remain local to this browser/account/workspace. Native Board/Mind Map inline schemas are outside this correction; hosted Documents use their normal adapters.

## Actual checks

| Check | Result |
|---|---|
| `npm run icons:generate` | Passed; emitted the 3,972 / 1,760 / 3,463 catalog counts and 42 packs, including the old-name compatibility check |
| Targeted `vp check --fix` | Passed |
| `npm run lint` | Passed; all 834 files formatted, no warnings/errors across 667 linted files |
| `npm run types:check` | Passed |
| `npm run build` | Passed in 15.79 seconds, 5,653 modules transformed; emitted separate Lucide/brand asset chunks |
| Targeted `./vendor/bin/pint --test` | Passed for `InlineIconData.php` and `DocumentController.php` |
| `php -l` | Passed for both changed PHP files |
| `node --check scripts/inline-icons/generate-catalog.mjs` | Passed |
| `git diff --check` | Passed |
| Automated tests, Playwright, browser automation | Not written or run, following user instructions |
| Manual/browser acceptance and performance measurements | Pending user review; not claimed as verified |

The build retains warnings for large chunks, ineffective dynamic imports of the crop dialog/property header/Document loader, and plugin timing. The shared editor search metadata grows with the full catalog; only SVG paths are split into demand-loaded packs. No browser CPU/latency measurement was obtained. The initial lint run found formatting in the copied brand-attribution JSON; that generated file was formatted before the final full lint check.

## Manual test checklist

Use a disposable Document, reload the updated frontend/server, and repeat insertion/save checks in a legacy Document if one is available.

1. **Picker layout:** type `/icon` and accept Inline icon. Expected: a compact picker with focused search, four source tabs, category controls and a preview/footer. No large labeled cards or full Library management toolbar.
2. **Emoji coverage:** choose Emoji → All category → All tones and clear search. Expected: **3,972** results. Choose Flags and search `Morocco`; expected 🇲🇦. Search `unicorn`; expected 🦄. Insert one inside a sentence: expected no new block or leftover command text.
3. **Skin tones:** clear search/category, select Default tone and browse People & Body, then select Medium-dark and All tones. Expected: unmodified, matching-tone and complete sets respectively. Search `people holding hands` with All tones: expected mixed-tone variants are available. Newest sequences may use fallback boxes if the operating system font lacks the glyph.
4. **Full icon source:** choose Icons and search `telescope`, `alarm clock` or `accessibility`. Expected: searchable symbols beyond the old tiny list, with actual previews. Switch categories and clear search: expected the full source remains browseable; lower rows are reachable by scrolling.
5. **Brands:** choose Brands and search `GitHub`, then `Figma` or `Docker`. Expected: recognizable monochrome brand glyphs. Insert a brand inside a paragraph: expected text-sized inline rendering. Wait for Saved and reload: expected the same brand survives.
6. **Grid keyboard navigation:** focus search, press Down, then Right/Down/Page Down/Home/End. Expected: visible focus moves predictably and scroll follows it. Enter/Space inserts the focused cell. Tab reaches footer controls without traversing thousands of offscreen items. Escape closes and typing resumes in the Document.
7. **Search and completions:** type `:rocket`, `:github`, `:thumbsup` and `:100` in normal prose. Expected: relevant suggestions, actual Markdown preview glyphs, and Browse all icons opens the matching source. Literal `12:30`, URLs and code remain literal. Search `happy` in Emoji: expected smiling/grinning/laughing choices.
8. **Favorites/Recent:** hover or focus a cell, use the footer star, then open Saved. Expected: the chosen icon is present and can be inserted/unstarred. Insert a flag/keycap and a brand; reopen Recent and reload. Expected: those choices remain valid in local preferences. Recent/Saved are reachable from Custom as well as other sources.
9. **Custom images:** open Custom, search an existing image filename and click its thumbnail. Expected: immediate inline insertion without a second Use image step. Reopen, upload a PNG/WebP, and wait: expected inline insertion and editor focus after upload. Hover a custom thumbnail and star it; expected it appears in Saved. Load more fetches additional workspace images where available.
10. **Editing/history:** click an existing old rocket/home/custom icon and replace it with a newly available icon or brand. Delete and undo/redo it. Expected: one complete icon changes per action, surrounding text survives, and no metadata fragments appear.
11. **Persistence/export:** save a Document containing emoji, a new Lucide icon, a brand and a custom icon. Reload and export/import with formatting and image files. Expected: all identities/references survive. Clean Markdown retains readable label/image fallbacks.
12. **Workspace ownership:** check a saved custom image's Library usage, then try to delete it through Library. Expected: saved usage still protects it. A different workspace's Custom tab shows only that workspace's images.
13. **Themes and size:** repeat opening/search/selection in Light and Dark, a narrow viewport and reduced-motion mode. Expected: readable symbols/controls, a contained scrollable grid, usable focus and no new entrance motion when reduced motion is enabled.
14. **Hosted Document:** insert/replace from a Document card in a Board. Expected: saves update the original Document and remain visible on its normal page. The Board's native text/Mind Map schemas are unchanged.
15. **Stale-client guard (optional):** on disposable content, repeat an icon-containing save request in DevTools using capability 1 instead of 2. Expected: a reload validation error and no server-side content/revision overwrite. Normal current-client saves succeed.

## Limitations and stop gate

- This is the complete Unicode 18.0 RGI keyboard/display set and the complete two installed icon packages, not every third-party icon collection. Equivalent unqualified emoji spellings are not duplicated in the picker. Platform fonts still determine emoji artwork/support.
- Lucide categories use local name-based grouping; brands use alphabetic grouping. Remote packs, arbitrary SVG upload and native Board/Mind Map schema work are outside this slice.
- Browser appearance, keyboard feel and runtime performance await manual review. No screenshots or browser automation were used.

No commit/staging performed; unrelated existing work was preserved. Suggested commit: `feat(editor): redesign icon picker and add complete emoji and icon catalogs`.

Stop for manual review. Fix reported picker issues within this slice; do not begin another product phase automatically.
