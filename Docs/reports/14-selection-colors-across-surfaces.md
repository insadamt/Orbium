# Selection colors across content surfaces — 2026-10-28

## Authorization and result

The user clarified that color support must cover Boards, Mind Maps and every existing surface with the feature, and requested a repository-wide search. This extends the current color review across the already approved Board/Mind Map implementations. No later phase, browser automation or automated tests were started.

The audit followed all shared icon picker/glyph/DOM/node consumers, Markdown formatting and nested rich inputs, Board block/selection/drawing tools and Mind Map topic/branch controls.

| Surface | Result |
|---|---|
| Markdown Document prose, headings, lists, quotes and callouts | Existing selection Text color applies to inline vector icons; replacing a symbol now retains color and underline metadata |
| Legacy Documents, including database Documents | Existing selection Text color marks; replacement retains marks |
| Hosted Markdown/legacy Document cards on Boards | Same original Document adapters and saves; no Board snapshot rewrite of hosted content |
| Document rich table cells and nested rich inputs | Existing shared Markdown selection formatter/rendering supports colored inline icons |
| Board native text, heading, quote, callout and lists | New Selection color in the selected-block toolbar applies to the whole selected block, without entering text editing; existing text-selection color remains |
| Board native tables | New whole-block color updates canonical rich cell sources or older inline rows, retaining cell metadata, structure and inline icons already present in source |
| Board Mind Map objects | New Selection color recolors all supported topic text/icons in the selected map |
| Board multi-selection | One commit recolors supported selected objects; unrelated blocks remain unchanged |
| Board drawings | Existing single-drawing palette remains; multi-selection now recolors drawings alongside other supported objects |
| Mind Map topics in Boards and Documents | New Topic color in the topic dock applies to the selected topic's prose and inline icons, without needing a text selection; text-selection toolbar remains |
| Mind Map decorative topic icons | Follow a uniform topic text color; mixed/default topic colors retain the existing branch-color fallback |
| Emoji, uploaded image icons, photos, media and resource cards | Original artwork/owner appearance retained; no image tint or rewriting of linked content |
| Code blocks, math and Mermaid | Existing literal/syntax/renderer color rules retained; whole-content prose coloring skips code blocks |

The icon modal contains no color controls.

## Implementation and persistence

- A focused pure document helper changes only textColor marks on text/icon leaves, preserving other marks and skipping code blocks.
- A focused Markdown helper reuses the existing atomic formatting runs/serializer for full cell sources. Table row/cell metadata and merged-cell structure are retained through the canonical table serializer.
- Board controls resolve the live selected IDs and latest records for each action, use the original validated commit/save/history boundary, and omit unsupported objects. Color summaries are cached by immutable object identity; the toolbar subscribes to store changes so multi-selection state follows saves/undo.
- Single drawings retain their existing controls. Multi-selection converts preset tokens to the current theme's explicit hex for drawing storage, matching its existing format. Default restores currentColor; width/opacity/geometry remain unchanged.
- Topic changes use the existing version-7 structured body adapter. Older topic text is retained while being explicitly adapted when coloring requires marks. Whole-map Board coloring uses the same adapter. The existing byte/node limits can reject oversized results; existing validation feedback is retained.
- No migration, new content field or backend change. Deploy the built frontend and reload. Previously saved icon metadata and all existing Board/Document formats remain readable.
- Native Board text/list inline schemas still contain their existing text/break nodes; this change adds color controls to them rather than introducing a new icon insertion format. Existing source-based table icons and Mind Map icons receive colors.

## Actual checks

- Targeted formatting/lint: passed.
- `npm run lint`: passed; 853 checked files formatted, no warnings/errors across 684 linted files.
- `npm run types:check`: passed.
- `npm run build`: passed in 15.56 seconds. Existing warnings remain for chunk sizes, ineffective dynamic imports and plugin timing.
- `git diff --check`: passed.
- Initial targeted checks caught a missing new topic callback; connected it before the final checks.

No PHP changed; PHP syntax/Pint are not applicable. No automated tests or Playwright/browser automation were written or run. Browser selection, appearance, history and persistence acceptance remain pending manual review. No staging or commit performed.

## Exact manual checklist

Use disposable content and reload the built frontend.

1. **Native Board types:** create text, heading, quote, callout, bullet/number/check lists and a table. Select each block without entering text editing and use **Selection color**. Expected: the entire block's supported content changes color while its type, layout, list checks/indents and table structure stay intact.
2. **Board partial text selection:** enter a block, select a word and use its existing Text color control. Expected: only that word changes; leaving editing shows the saved formatting. The whole-block color tool is hidden while editing.
3. **Board multi-selection:** select several writing/list/table blocks plus a drawing and an image/resource card. Apply Red and then a custom hex. Expected: supported text/table/drawing objects change together; image artwork/resource content remain unchanged. Undo once after a preset choice restores the previous accepted selection state; redo reapplies it.
4. **Drawing parity:** select one drawing. Expected: its original Drawing color/width controls appear without a duplicate Selection color. Select two drawings and use Selection color. Expected: both recolor, retaining their width, opacity, position and path gaps. Default restores theme foreground.
5. **Tables:** use a rich table with header/merged cells, bold/link text and an existing source-based vector icon. Apply whole-table color, finish and reopen editing. Expected: cell structure, icon identity and other marks survive; cell text and vector icons match the selected color. Repeat with a simple/older table and verify rows/columns remain.
6. **Whole Board map:** select a Mind Map object on a Board and use Selection color. Expected: supported text and inline/decorative icons throughout that map use the color; code blocks remain literal. Other Board objects are unchanged.
7. **Selected topic:** open Mind Map Edit on both a Board and a Document. Select a topic containing prose/heading/list/quote/callout and inline vector icons, then use **Topic color** in the left dock without entering text editing. Expected: that topic's supported text/icons and decorative badge match. Its children, branch connectors and branch appearance metadata stay unchanged.
8. **Topic partial selection/default:** edit a topic, select part of its text/icons and use Text color. Expected: only selected inline content changes; the decorative badge follows a uniform whole-topic color or falls back to branch color when mixed. Use Topic color → Default; expected explicit prose/icon color is removed and existing branch fallback returns. Code content remains unchanged.
9. **Replacement:** in a Markdown Document, color an inline vector icon and underline it; click it and choose another symbol. Expected: the replacement retains its color and underline metadata. Repeat in a hosted Document and legacy/Mind Map editor; expected original save ownership/marks remain.
10. **Save/history:** after each supported action wait for Saved, reload and reopen. Expected: all colors persist. Undo/redo whole-block, multi-selection and topic actions; expected text, icon identities and metadata restore together. Reapplying the same color should not create a duplicate content action.
11. **Boundaries:** try selection coloring in a read-only/disabled surface and while composing topic text. Expected: no content write. Switch the selected topic/block or clear Board selection while the menu is open; expected subsequent actions cannot recolor an old object. Dismiss without choosing; expected no content change.
12. **Themes/accessibility:** test preset/custom/default in Light/Dark, narrow viewport and keyboard use. Expected: text presets follow theme, explicit hex stays fixed, controls remain reachable, popup focus stays usable and icon picker has no color UI.

## Suggested commits

- `feat(editor): apply selection colors across boards and mind maps`
- `fix(editor): preserve inline icon color when replacing symbols`

Stop for manual review in the current color slice.
