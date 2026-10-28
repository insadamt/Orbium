# Inline icon completion, selection and color repair — 2026-10-28

## Review finding and changes

The user still could not use `:icon`, select icons together with text, or recolor the result consistently. This report corrects the previous source/build-only handoff within the same inline-icon review. Earlier browser behavior was not established by those checks.

Concrete source findings:

- Native Board editors installed the inline-icon node and slash menu but **did not install the colon suggestion extension**. This is now installed using the existing shared completion implementation and menu. The shared suggestion extension runs before ordinary StarterKit newline handlers, and Board Enter/Tab/Escape/arrow handling defers to an active icon completion before its ordinary newline/finish handlers. Portaled suggestion menus identify themselves as editor controls, so the Board does not treat a menu click as a canvas interaction.
- The literal `:icon`/`:icons` query was handled as a catalog search. It is now a reserved picker command: Enter on Browse all icons opens the full picker with an empty search in native, Markdown and Mind Map adapters. Ordinary queries such as `:rocket` still search actual symbols. Native/Markdown/Mind Map prefixes include parentheses/brackets as well as whitespace. Escape exits the native suggestion plugin rather than only hiding its React menu.
- Inline graphics were empty graphical spans with `user-select: all`, and Mind Maps independently enforced a flex box for their icons. They now contain a transparent, aria-hidden object-replacement character that supplies a real inline selection position. SVG/image artwork is painted over it without capturing pointer events. Containers use inline-block/text selection in all renderers. Image-error fallback retains the selection character. The inline atom remains one saved editor unit; no replacement character is added to the content model.
- Board/Mind Map and legacy Document text colors previously used separate focus/selection command chains. They now share one explicit transaction that restores the saved selection and applies/resets the color across all its ranges, including inline atoms. Spectrum input can retain focus while editing the same range. Other marks remain intact.
- Native icon views and Board/Mind Map previews now read their textColor mark directly and refresh the rendered glyph color when marks change. Board links now inherit color instead of forcing the theme foreground over a selected color. Reset removes the explicit icon color. This avoids relying on mark-wrapper inheritance alone during editor updates. Existing Markdown metadata rendering and read-only preview marks remain the persistence representations.

The icon modal still contains no color controls. Normal click/drag remains available for selection; double-click explicitly opens replacement. Existing Board block/topic selection-color controls are preserved.

## Compatibility

No additional schema, migration, dependency or catalog change in this repair. Keep the prior Board format-8 migration/server/frontend together and reload open editors. It was applied locally in the preceding correction. Native icon version 1, Markdown inline metadata and Mind Map graph versions are unchanged.

SVG icons/brands follow text colors. Emoji and uploaded raster images keep their original artwork. Literal code/math/source/scalar fields retain their earlier contracts. Cross-workspace custom references still require normal owner validation.

## Actual verification

- Targeted formatting/lint: passed.
- `npm run lint`: passed; 859 files formatted and no warnings/errors across 690 linted files.
- `npm run types:check`: passed after correcting the callback binding.
- `npm run build`: passed in 18.21 seconds. Existing warnings remain for large chunks, ineffective dynamic imports and plugin timing.
- `git diff --check`: passed.
- No PHP/schema changes in this repair, so additional PHP/migration checks were not applicable.

No automated tests or Playwright were written/run. A short manual desktop/browser check was requested under the user's tool-use permission rule; it has not been performed without an affirmative reply. Therefore pointer interaction and visual/browser acceptance are not claimed as verified.

An initial TypeScript check caught the suggestion callback's `this` binding while adding Escape handling; the callback now captures the owning editor explicitly before final checking. No staging or commits were performed. The prior selection-color, native Board and zoom work remains in the working tree.

## Exact manual checklist

Fully reload the current page first. The app currently has a Vite hot file, and mounted editor extension arrays are initialized on mount; a production build/HMR update alone does not establish that an existing editor instance received a newly installed extension. Use disposable content; repeat the core steps in Board Text/H1–H3/Quote/Callout, every list style and table cells, then normal/database/hosted Documents and Mind Map topic rich text.

1. Type `:icon` and press Enter. Expected: a Browse all icons completion opens the full picker with empty search, rather than a search for the word icon. Repeat `:icons`. Choose a Lucide icon/brand and type after it; expected one inline symbol with no leftover command.
2. Type `:rocket` at the start, after a space and after `(` or `[`. Expected: matching completions appear; Up/Down selects, Enter/Tab inserts. Native Board Enter must accept the suggestion instead of inserting a hard break. Type a colon query, press Escape and then Enter; expected normal text/newline handling, without an invisible completion being accepted.
3. Write `before [icon] middle [brand] after`. Drag in both directions across the complete line and across just an icon plus one adjacent word. Expected: icon artwork and ordinary text can be included in one selection; no picker opens during the drag. Repeat with Shift+Arrow across each symbol and an icon-only selection.
4. With the mixed range selected, use Text color → Red, then a custom hex. Expected: every selected vector symbol and selected word updates together; unselected text stays unchanged. Move the spectrum several times; expected the saved target range stays the same even though the picker owns focus.
5. Reset to Default text color. Expected: selected text/icons lose their explicit color together. Undo/redo; expected the prior/reset colors return without changing icon identity or neighbor text. Finish editing and wait for Saved; reload and verify the same result.
6. Double-click a symbol to replace it; expected exactly that symbol changes while its marks remain. Cancel replacement; expected unchanged content. Copy/paste/delete a mixed selection and undo; expected whole symbols and text remain intact, with no visible placeholder character or metadata fragments.
7. Test a custom image and an unavailable image reference. Expected: ordinary selection still crosses the icon/fallback; original image pixels remain unchanged when text color changes. No selection placeholder should be visible outside the browser's normal highlight.
8. Repeat in Light/Dark, a narrow viewport, Board text at different canvas zooms and Mind Map topics at different zooms. Expected: glyph/selection boxes stay aligned and completion/color menus remain usable. Read-only content must not write.

## Suggested commit

`fix(editor): wire colon icons and unify text selection colors`

Stop for manual review in the current correction slice.
