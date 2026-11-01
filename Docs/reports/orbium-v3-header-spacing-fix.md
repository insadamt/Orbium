Summary: Records the stage-6 repair for phantom block gaps and rejected typing in Live Preview; depends on the V3 active editor, CodeMirror replacement boundaries, body wrappers and owner/column selection handling.

# V3 hidden-header spacing and caret repair

The user reported large gaps between a paragraph, heading and bullet list. Clicking a gap allowed a caret, but typing produced “This Live Preview edit crosses a structural boundary. Use a block action or repair the raw source.” This is a stage-6 integration defect, not a new phase.

## Cause and changes

- Hidden identity headers used block replacements with both edges non-inclusive. CodeMirror retains an empty line before a block replacement with an open starting edge. The legacy wrapper collector also treated `V3Header` nodes as visible blocks, adding a padded layout frame around hidden metadata.
- Header replacements now include their starting edge and exclude their ending edge. This removes the phantom line while keeping insertion at the first body position visible. `V3Header` nodes receive no wrappers. Visible column layouts keep their outer spacing, while their projections own nested body wrappers.
- A focused selection helper redirects collapsed carets from identity headers into body content. Backward navigation uses the previous sibling's editable end, retaining actual blank body lines. Forward/pointer placement skips heading/list/quote prefixes; presentation fences and rich widget focus keep their existing body ownership. Nonempty text and handle selections are left intact.
- The Live Preview transaction filter applies the helper to selection-only transactions. Source-to-Live switching also applies it, because the outgoing Source state does not have the live filter installed. New column projections initialize their caret in body content instead of at source offset zero.
- Structural writes remain protected. This repair changes presentation/selection only; it does not rewrite saved source, remove genuine blank lines, change IDs, migrate data or change document formats.

## Verification

- Formatting and focused lint: applied `npm exec -- vp check --fix`, then ran `npm exec -- vp check` on the five changed TypeScript/TSX files. **PASS:** all five correctly formatted, no warnings or lint errors.
- Type check: `npm run types:check`. **PASS**, exit 0.
- Production build: `npm run build`. **PASS**, 5,759 modules, 18.20 seconds. Existing large-chunk, ineffective-dynamic-import and plugin-timing warnings remain.
- Repository lint: `npm run lint` still fails on the same 17 existing formatting files recorded during stage 6. None are among the five files changed by this repair. The failures cover explorer/navigation CSS, Board controls, legacy column/drag/writing modules and navigation/layout components. Unrelated files were not reformatted.
- Whitespace: `git diff --check`. **PASS**, exit 0. All five changed source files remain below 500 lines (79–481 lines), with file summaries and comments explaining the non-obvious boundaries.
- No automated tests, fixture execution or browser automation were written or run. Visual, pointer, keyboard and IME acceptance remains manual. No staging or commit was performed.

Logs: `/tmp/orbium-v3-header-gap-format.log`, `/tmp/orbium-v3-header-gap-types.log`, `/tmp/orbium-v3-header-gap-build.log`, `/tmp/orbium-v3-header-gap-lint.log`.

## Manual checklist

Use a disposable V3 Document and reload the app to load the rebuilt frontend.

1. **Original example:** type a paragraph, press Shift+Enter, open `/` and choose Heading 1, enter a title, then Shift+Enter and choose a bullet list from `/`. Expected: normal paragraph/heading/list spacing, without an extra empty row for each hidden header. Visible typography and handles remain intact.
2. **Gap clicks:** click just above/below each visible body and type a unique word. Expected: a caret in visible body text and visible inserted characters; no structural-boundary warning and no modified hidden identity line. Undo the inserted words.
3. **Beginning of a body:** click before the first visible paragraph character, type several characters, then undo/redo. Repeat for a heading and list. Expected: inserted text remains visible; heading/list types and markers are retained; each undo/redo restores the expected text.
4. **Keyboard boundaries:** use Left/Right and Up/Down to cross the paragraph, heading and list boundaries; type after crossing. Expected: no stop on an invisible identity line, no trapped caret between ordinary text blocks and no structural warning. Backspace/Delete at body boundaries retain their existing V3 conversion/merge behavior.
5. **Source switch:** switch to Source, place a collapsed caret at the beginning and then inside each `++block` line, and return to Live Preview. Type a character after each switch. Expected: caret moves into visible body content; heading/list/quote prefixes and identity headers remain valid. Return to Source and verify IDs are unchanged.
6. **Actual blank lines and empty blocks:** use Enter to add a real blank line inside a paragraph; create empty paragraph blocks with Shift+Enter. Expected: intentional blank lines stay editable, empty blocks retain their writing hint, and typing at the first body position appears immediately. The fix does not collapse genuine source whitespace.
7. **Columns:** create a two-column layout, edit the first paragraph immediately after focus, and add a heading/list in each column. Repeat gap clicks and keyboard navigation inside a column. Expected: typing starts in the projected body, no header-sized gaps or structural warnings, and ordinary column/grid spacing remains.
8. **Rich/styled neighbors:** put a code block or table between paragraphs and apply alignment or direction to a text block. Navigate across neighboring bodies and type in their visible text; edit the rich block through its normal controls. Expected: rich widget focus and presentation stay usable, no typing into hidden directive closes, and structural boundaries remain protected.
9. **Selection/history/save:** select a text range across blocks, select blocks with handles, use Ctrl/Cmd+A, and undo/redo ordinary edits. Save and reload. Expected: selections retain their existing scope, accepted edits survive reload, and hidden headers/IDs do not change due to clicks or mode switches.
10. **Invalid source and input:** on a disposable copy, duplicate an ID in Source and return live. Expected: existing diagnostics remain and the editor does not silently repair or save invalid source. Undo in Source to recover. After recovery, try real IME composition at the first body position: characters should stay visible without duplication or structural notices.

## Commit suggestion

`fix(editor): remove phantom V3 header gaps and protect caret placement`

Earlier V3 work remains uncommitted. Review the full working tree before choosing staging/commit boundaries. Remain in stage-6 manual review; stage 7 has not started.
