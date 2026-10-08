# M3 writing review — rejected presentation, bounded input repairs

Date: 2026-10-08. Status: **M3 rejected by the user; input repairs implemented for manual review. Full Tiptap parity and M4 approval remain pending.**

Subsequent decision: the user approved M4 with “okey next” and chose reuse of the installed renderers. See [the M4 report](06-codemirror-markdown-m4-rich-blocks.md). The phase-approval statements below describe the state at this report's creation; M3 and replacement parity remain under manual review.

The user reported that Mermaid, headings, writing and the overall design do not feel like Tiptap. The earlier style correction did not satisfy that requirement. Reusing typography does not establish equivalent document editing. The current CodeMirror surface remains experimental and must not be presented as accepted replacement behavior.

## Findings and changes

- Completed formatting previously revealed its source punctuation when the caret entered it. Heading/list prefixes, task controls, inline delimiters and safe link syntax now retain their preview presentation while typing/selecting. Source remains available through the explicit Source switch. Unfinished syntax, unsupported rich syntax and unsafe/unresolved links retain raw source. A bare `#` remains visible until the heading shortcut's space is typed. This supersedes the automatic caret-reveal policy in the earlier M3 report.
- Enter in ordinary top-level paragraphs now inserts a paragraph boundary (`\n\n`). Enter at the end of an ATX heading starts a paragraph; splitting a heading in its middle carries its heading prefix into the second heading. Enter in an empty heading clears its prefix. Shift+Enter in ordinary paragraphs inserts a Markdown hard break (`  \n`). Source mode retains native source-editor Enter behavior. Nested lists/quotes/code/table/reserved-rich contexts retain their installed Markdown commands.
- Splitting inside supported inline formatting closes and reopens the active delimiters around the new paragraph, including a supported inline link's label/destination. This operates on Lezer syntax nodes and bounded source changes rather than reserializing the document.
- Backspace at the start of an ATX heading converts it to a paragraph, preserving its text. Backspace at the start of the second ordinary paragraph joins the preceding ordinary paragraph across one blank separator. Backspace/Delete at a supported inline formatting boundary removes the delimiter pair together, preventing a dangling counterpart. Complex nested boundary behavior remains a manual parity gate.
- Ctrl/Cmd+B/I/Shift+X with an empty selection previously inserted empty delimiter pairs. In particular `****` can become a divider. Empty-selection formatting now uses an ephemeral pending-format StateField and wraps the next ordinary text input. Toggling the same pending shortcut again cancels it without writing source or saving. At a matching closing delimiter, the shortcut moves the caret out of that format. Native composition is allowed to run without interception; pending mark behavior during IME composition is not claimed to match Tiptap yet.
- Source finder selections can still reveal the particular hidden syntax range they select; dismissing/changing the query rebuilds preview. Ordinary caret/selection movement no longer turns the document into source view. Copy remains canonical Markdown; rich clipboard parity is not implemented.
- The slash completion keymap retains priority over writing Enter. Fence completion retains priority over paragraph Enter. New writing commands exist only in the Live Preview presentation compartment. No save API, database migration, stored version, existing-body conversion or account setting was changed.

## Libraries and remaining architectural boundary

No new dependency. The user's already selected CodeMirror/Lezer packages supply the syntax tree, StateField/effects, input handlers, keymaps, decorations and atomic ranges. Orbium owns pending formatting, paragraph transactions and block interaction semantics. The official [decoration guidance](https://codemirror.net/examples/decoration/) distinguishes viewport decorators from directly supplied decorations for vertical block layout and documents atomic ranges for cursor/deletion behavior. These APIs alone do not provide Tiptap's rich node views or block controls.

Mermaid is still source in this build. No diagram preview, table widget, media widget or M4 implementation was added. The current phase boundary requires approval before that work. A direction question was sent: continue the migration and approve M4 rich blocks, or restore Tiptap as the default for new documents while keeping existing Markdown bodies and the experimental engine. No answer has been received at this report's creation. Neither direction has been silently selected. Existing format-1 documents still use Tiptap.

Full stored-mark interaction in existing nested formatting, toolbar/gutters/reorder, semantic empty blocks, rich clipboard, nested container styles, heading hard breaks, IME formatting, RTL/direction, rich blocks and performance acceptance remain open. This repair is not a claim that the editor now feels identical. M3 remains under review; replacement acceptance is **NO-GO / pending**.

## Actual checks

- `npm run lint`: **PASS**, 288 correctly formatted files, 223 linted files, zero warnings/errors.
- `npm run types:check`: **PASS**.
- `npm run build`: **PASS**, 7.32 seconds; existing large-chunk and ineffective dynamic-import warnings remain.
- `git diff --check` and untracked-file whitespace/EOF inspection: **PASS**.
- No automated tests, browser checks or performance benchmarks written/run. Runtime expectations below are for the user's manual checks.
- No commits/pushes created; preceding uncommitted M2/M3 work preserved. No PHP changes in this repair.

## Exact manual checklist

Use a format-2 scratch document with Live Preview active. Keep a Tiptap document open as the behavioral reference. These checks do not imply that Mermaid is fixed.

1. Type `#`, then Space, then `Heading`. Expected: the bare hash is visible; after Space the hash stays hidden, and typing the heading does not expose punctuation. Enter at the end, type `Paragraph`. Expected: normal paragraph appearance below the heading. Switch to Source: expected `# Heading\n\nParagraph` and no unexpected source changes. Undo/Redo, wait for Saved, reload and compare.
2. Type `/heading 2`, accept with Enter, write `Second heading`. Expected: the slash command accepts rather than inserting a paragraph; the heading prefix stays hidden. Put the caret after `Second`, press Enter. Expected: the remaining text is a second H2. At the start of an H2 press Backspace: expected its text remains and becomes a paragraph. In an empty H2 press Enter: expected a plain paragraph instead of a leftover empty heading.
3. In an empty paragraph press Ctrl/Cmd+B, type `Bold`, then press Ctrl/Cmd+B again and type ` plain`. Expected: no divider appears, `Bold` is bold, new text is plain, and source contains `**Bold** plain`. Repeat with italic and strike. Press the same shortcut twice before typing: expected plain text and no source/save mutation from the two shortcut presses alone. Check selected-word wrapping/unwrapping and Undo/Redo as well.
4. Type `**HelloWorld**`, then split between `Hello` and `World` with Enter. Expected: both resulting paragraphs retain bold text; Source contains `**Hello**\n\n**World**`. Repeat with italic/strike/inline code and an ordinary inline link. Check nested combinations manually; record mismatches rather than treating this as full nested parity.
5. Type two ordinary paragraphs using Enter. At the start of the second press Backspace. Expected: paragraphs join without deleting text; Undo restores the boundary. In a paragraph use Shift+Enter: expected a line break inside the same paragraph, with two spaces before LF in Source. A source-mode Enter should remain a literal single source newline.
6. Move/click/select inside completed marks, heading/list prefixes, tasks and safe links. Expected: rendered styling stays stable; Markdown does not appear just because the caret moves. Arrow through boundaries and use Backspace/Delete at bold/italic/strike/code edges; expected delimiter pairs are removed together, then Undo restores them. Select all/copy: expected canonical Markdown is retained. Use Source to edit the actual delimiters/destinations.
7. Open Find and search `**`, then a link destination. Expected: selected hidden source becomes visible for that match; dismiss the finder and expect preview to conceal it again. Search an ordinary word: expected visible matching text and correct source count. No second finder should open.
8. Repeat slash Up/Down/Enter/Tab/Escape, list/quote Enter/Backspace, list nesting, fence completion, task toggles, save/reload, offline/retry/conflict, retained tabs and split panes. Expected: commands target the active document, no text loss, no unexpected save from presentation changes. Real OS IME and mixed Arabic/English require manual checks; pending-format IME parity remains open.
9. Compare ordinary heading/paragraph/quote/list/code-chip spacing and interaction directly with Tiptap under the same theme/width/zoom. Record remaining design discrepancies. A Mermaid fence will still show source: rich-diagram repair requires the pending direction/phase choice, and this must not be counted as a passing parity check.

Suggested commit: `fix(editor): repair markdown heading and typing behavior`.
