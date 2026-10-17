# Code language picker icons

Date: 2026-10-16. Editor review; no phase advancement.

## Implemented

- Committed the preceding 54-language update as `ffc6f02` (`feat(editor): expand code languages and improve language logos`).
- Restored the previous Simple Icons and Devicon logos at the user's request, retaining 24px sizing. Removed abbreviation badges; original Rust, Perl, PHP, XML, Go, Lua, Less, Objective-C and Bash artwork is used again.
- SQL, Diff, Makefile and other formats without a matching logo retain neutral symbols.
- Added matching decorative 24px icons to every language dropdown row in Markdown and legacy JSON editors. Unknown tags retain the neutral code symbol.
- Added optional icons to the shared select option model and DOM select bridge. Existing callers continue to render text-only options. Language dropdowns supply the icons through a focused wrapper.
- Set each menu item's text value explicitly to its language name so badge text does not interfere with keyboard typeahead. Menu icon classes prevent the shared menu's default 16px SVG rule shrinking them.
- Removed the code language trigger focus ring, including when menu focus returns after selecting a language. Keyboard focus uses a subtle background instead; other selects keep their focus styles.
- No dependency, content format or persistence changes in this follow-up.

## Validation

- `npm run lint`: passed, including repository formatting checks; no lint errors or warnings.
- `npm run types:check`: passed.
- `npm run build`: passed; reports large-chunk and ineffective-dynamic-import warnings.
- `git diff --check`: passed.
- Original logo artwork was restored from commit `ffc6f02`. Browser menu and layout acceptance remains manual.
- No automated tests written or run, per user instructions.

## Manual checklist

1. Open a Markdown document's code language dropdown. Expected: all 54 options have aligned 24px icons and readable names; the active-language check stays in its own column.
2. Inspect Rust, Perl, PHP, XML, Go, Lua, Less and Objective-C. Expected: the original logos in both dropdown and header, with no abbreviation badges. Compare C#, Python and TypeScript: expected their recognizable logos.
3. Select several languages, including C#, Rust and SQL. Expected: the correct row check, label and header icon update immediately; source and highlighting remain intact.
4. Open the dropdown with the keyboard, type `Rust`, then use arrows and Enter. Expected: typeahead uses the language name using its full language name, arrows move between options, Enter selects, and Escape closes. Repeat `PHP` and `Objective-C`.
5. Scroll to the last option and inspect a narrow window/split pane. Expected: the menu remains bounded and scrollable; icons, selection checks and labels do not overlap.
6. Repeat in light/dark themes. Expected: badges and logos inherit readable foreground/hover colors without clipping. The closed header keeps one icon beside the selector.
7. Try an unknown fenced language, save/reload, then undo/redo a language change. Expected: unknown tag remains preserved with a code symbol; known selections restore their matching header/menu icons.
8. Repeat in a legacy JSON document if available. Expected: matching dropdown icons, immediate header updates, highlighting and Copy. In read-only Markdown, language selection remains disabled while Copy works.
9. Open existing text-only selects in Settings or another app page. Expected: their prior text-only layout, selected state and keyboard behavior remain intact.

10. Select a language, then close the menu. Expected: no ring/border around the language button. Tab to the button: expected a subtle focus background, with Enter/Space opening the menu and normal arrow-key selection. Other app selects retain their focus ring.

## Commit suggestion

`feat(editor): add language logos to code selector`

The preceding update is committed. This follow-up remains uncommitted for review.
