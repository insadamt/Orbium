# Inline icon colors — 2026-10-27

## Scope and result

The user requested inline icon colors, then clarified that colors must come from text selection, with no color controls in the icon modal. This report supersedes the earlier modal-based implementation within the current inline-icon review.

- Select text containing Lucide or brand icons and use the existing **Text color** toolbar control. Presets, spectrum/hex and Default text color apply through the normal formatting transaction.
- Markdown's formatting reader previously protected icon source from all formatting. It now exposes each selected icon as one atomic run for color changes, preserving its icon name, label, reference and other metadata. Serialization updates only its color metadata; it never splits icon syntax into fragments. Other formatting commands retain the existing protected-icon behavior.
- The Markdown icon widget renders its existing color metadata. Selection color state includes selected icons, so the toolbar reflects their color.
- Legacy Documents and Mind Map topic editors already support selection-based textColor marks. Icon replacement now retains the existing marks rather than discarding them. Topic previews use the existing mark renderer.
- The icon modal keeps its original insertion/replacement UI with no color control or Apply action. Hosted Documents use the same editor adapters.
- Presets follow the theme; custom hex colors stay fixed. Default text color removes the selected icon's explicit color.

## Compatibility and limitations

No migration, new schema, capability bump, dependency or backend change is required. The implementation reuses validated Markdown color metadata and legacy/Mind Map textColor marks. Previously saved colored icons remain readable. Reload the built frontend.

Emoji and custom images retain their original artwork. Native Board text has no new icon schema. Clean/Office export glyph fidelity retains the existing readable label/image fallback limitation. Browser appearance, interaction and persistence acceptance remain pending manual review.

## Actual checks

- Targeted formatting/lint: passed.
- `npm run lint`: passed; all 849 checked files formatted, no warnings/errors across 680 linted files.
- `npm run types:check`: passed.
- `npm run build`: passed in 15.96 seconds; existing warnings remain for large chunks, ineffective dynamic imports and plugin timing.
- `git diff --check`: passed.

No automated tests, browser automation or Playwright were written or run, as instructed. No PHP changed, so PHP formatting/syntax checks are not applicable. No files staged or committed.

## Manual test checklist

Reload the updated app and use disposable content. Repeat core selection/color/save checks in a Markdown Document, an available legacy Document, a hosted Document card in a Board and a Mind Map topic.

1. Type `/icon`, browse Icons/Brands, and insert a rocket and GitHub into a sentence. Expected: the modal has its normal search, tabs, grid and favorites footer, with no Icon color control or Apply button.
2. Drag to select a sentence including both icons. Use **Text color** in the selection toolbar and choose Red. Expected: selected text and both vector icons turn red; unselected text stays unchanged.
3. Select only one icon using Shift+Arrow across it, then choose Blue through Text color. Expected: the toolbar is available, only that icon changes and the icon remains intact. In Markdown source, its original name/label and valid metadata remain.
4. With the selection retained, use the spectrum or hex input to choose `#12ab78`, then another color. Expected: the text/icon selection remains valid during successive changes, without duplicated icons or exposed metadata fragments.
5. Choose Default text color. Expected: selected text/icons return to the default inherited color. Undo and redo. Expected: the previous and reset colors return through normal editor history.
6. Apply a color, wait for Saved and reload. Expected: text and icon colors survive. In a Mind Map, finish topic editing before saving/reloading; expected its preview and reopened editor agree.
7. Click a colored icon and replace it with another vector icon. Expected: the replacement retains the selection-applied color. In legacy/Mind Map text, add another mark such as bold before replacement; expected that mark survives too. Close the picker without choosing; expected content stays unchanged.
8. Repeat preset/custom/reset in Light and Dark. Expected: presets follow the existing theme palette and custom hex stays fixed. Select across line breaks and multiple paragraphs; expected all selected vector icons are colored without changing unrelated content.
9. Include emoji and a Library image icon in a colored selection. Expected: their artwork stays unchanged; vector icons and ordinary text respond to text color. Upload/replacement/deletion remain usable.
10. Export/import with formatting retained, including a colored icon/topic icon. Expected: identity and color metadata/marks survive. Clean exports may use the documented readable fallback.

## Suggested commit

`feat(editor): color inline icons through text selection`

Stop for manual review within the current phase.
