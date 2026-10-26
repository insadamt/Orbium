# Block header and icon consistency — 2026-10-26

The user reported that the approved Mind Map styling had not been applied consistently to other blocks' icons and controls. This correction stays within the current review phase.

## Corrected

- React block headers now render icons from the same SVG source as imperative Markdown widgets and shared media players. Mind Map, Code, Math and Mermaid no longer use different icon families depending on the renderer.
- Type glyphs use a consistent 20-pixel size in the existing type badge. Header action glyphs use 17 pixels in 32-pixel buttons, with the shared rounded focus/hover treatment. Edit/preview controls retain accessible names and hover titles.
- Code always retains the generic Code type badge. Language logos remain available as smaller secondary icons beside the language name/picker instead of replacing the main badge. This applies to Markdown, legacy and native Board Code headers. Copy uses the same action-button sizing.
- Native Board Mermaid and cached Instant Scene Mermaid now put fullscreen beside Edit in the header. Fullscreen is removed from inside the preview body. Both renderers identify the block as **Mermaid / Diagram**, matching Documents.
- Plain-file fallback cards now use the shared File badge/heading and icon-only source, preview, replace and remove actions. Updating attachment metadata changes the title without destroying the type badge. Real video/audio/PDF players continue to own their existing header; fallback wrapper styling is removed when a player is installed to avoid an extra nested frame.
- Existing source editing, language selection, copy, media players, prepared SVG caching, fullscreen lifecycle and persistence ownership remain in place. No schema, migration, backend or dependency change was required.

## Checks

Final checks passed:

- Targeted `vp check --fix`: formatting and lint passed for the affected source files.
- `npm run types:check`: passed.
- `npm run lint`: passed; 752 files correctly formatted and 636 source files checked without warnings/errors.
- `npm run build`: passed; 5,575 modules transformed in 15.21 seconds. Existing large-chunk, mixed static/dynamic import and plugin-timing warnings remain. Log: `/tmp/orbium-block-icons-build.log`.
- `git diff --check`: passed.
- Changed/new source files remain below 500 lines: native source block 419, prepared surface 172, file widget 232, shared React glyph adapter 21 and language badge 16.

No automated tests, Playwright or browser automation were written or run. Visual/runtime acceptance remains manual. No PHP files changed in this correction. Markdown documentation is excluded by the repository formatter configuration.

## Exact manual checklist

Reload the frontend. Use a disposable Board and Markdown Document; include a legacy Document if available.

1. **Compare headers:** place Mind Map, Code, Math and Mermaid beside one another in both owners. Expected: consistent type-badge size and SVG stroke treatment, aligned heading identity and equally sized icon actions. Math/Mermaid glyphs should match between Document and Board renderers. Buttons show useful hover names and keyboard focus rings.
2. **Code languages/copy:** select Python, then JavaScript or another language. Expected: the main Code badge stays unchanged; the smaller language logo/name changes beside the picker. Copy remains an icon-sized action and copies the original source. Repeat in Markdown, native Board and legacy Code when available. Save/reload: source and language survive.
3. **Board Mermaid/fullscreen:** inspect an inactive cached Mermaid block, enter/leave editing, pan it away and back, and reopen fullscreen. Expected: Edit and fullscreen appear together in the header; no separate fullscreen button sits inside the diagram; no duplicate header action accumulates. Diagram content, native camera, original source saves and reduced-motion behavior remain usable. If comparing with `?boardRenderer=original`, verify the same header treatment there.
4. **Plain files and players:** insert/reuse a normal non-media file. Expected: File badge, heading and icon actions; no fallback Replace/Remove text buttons. Rename/replace it through existing controls: the type badge remains intact. Repeat with audio/video/PDF: the actual player's own header remains, playback/reader controls work and there is no extra enclosing fallback card. Verify a disposable missing attachment still shows its existing error/replacement controls.
5. **Legacy controls:** if available, open legacy Code, Math and Mermaid. Expected: the same badge/action glyphs as Markdown/native Boards. Math/Mermaid edit/preview and Mermaid fullscreen remain functional. Code language selection and copying still work. No data conversion is required just to inspect icons.
6. **Responsive/interaction:** check light/dark themes, a narrow split pane and Board zoom. Tab to header actions and activate them. Expected: icons retain their intended dimensions, actions remain aligned/reachable, and clicking a header action does not move the Board block. Ordinary source changes, Undo/Redo and saves still belong to their original owner.

## Limits and commit suggestions

These changes were checked through source inspection and static/build validation; browser appearance and interactions remain unverified until manual review. Existing image-only floating controls and normal writing blocks keep their established layout rather than acquiring unrelated header actions. No performance/thermal claims are made.

No commit was created; earlier uncommitted work was preserved.

- `fix(editor): unify block header icons and actions`
- `fix(boards): align cached diagram controls with document blocks`
