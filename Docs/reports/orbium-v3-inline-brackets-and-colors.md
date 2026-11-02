Summary: Stage-6 repair of bracket escaping and inline color continuity in the existing CodeMirror/Orbium dialect; depends on the shared formatting serializer, reference-link handling, and Live Preview input/decoration layers.

# V3 inline brackets and colors — 2026-11-02

## Problem and scope

Repeated square brackets inside colored Markdown prose could turn into different parser nodes, lose their inherited color during a subsequent formatting rewrite, or leave a hidden `:orbium[...]{...}` span malformed when a literal closing bracket was typed. The old serializer escaped only unmatched brackets, so balanced literal pairs could be interpreted as Markdown syntax. Reference-style links were treated as protected source and excluded from whole-link color selection.

## Repair

- Escape every **literal, unescaped** square bracket while serializing colored, underlined, or linked prose; preserve existing Markdown escapes and inline code delimiters. Recognized real reference-style links remain intact instead of being escaped into plain text.
- Treat reference links as atomic visible content: whole-link formatting may retain/inherit color, while partial link-syntax selections do not rewrite or split their syntax.
- In Live Preview, single-character `[` and `]` input **inside a validated Orbium inline span** is stored as escaped Markdown so the span cannot close prematurely. It is not applied to source mode, code, linked or other opaque markup, IME composition, or pending inline-formatting input.
- Make preview links inside an explicitly colored inline span inherit that color. No changes to global link styling, other color presets, the V3 block grammar, or the persisted `.orbie` structure.

## Verification and limits

Static source inspection completed. This edit was authored through the connected GitHub repository, not a local checkout. A local Node dependency install, formatter, lint, TypeScript check, and production build could not be run in this environment. Per repository phase instructions, no automated tests or browser automation were added or run. Browser acceptance remains pending; this patch does not rewrite already malformed saved spans automatically.

## Exact manual acceptance

1. In a disposable V3 paragraph, write `abc[][][][]xyz`, select all and apply Blue. Expected: every visible character, including all brackets, is blue. Switch to Source: literal brackets are escaped inside a valid single Orbium color span.
2. With the caret between the colored letters, type `[` and `]` separately, repeatedly, and near both visible color boundaries. Expected: visible brackets and blue color remain, no raw metadata flashes, and the caret stays next to typed text.
3. Recolor the selection Red, then Blue, then Default. Expected: no lost characters, unexpected white segments or extra backslashes in Live Preview; Source remains valid.
4. Repeat with `[label][reference]` where the reference has an actual definition. Expected: the real Markdown reference link stays functional while a whole-link color operation applies to its visible label; partially selecting its source syntax does not corrupt it.
5. Repeat with `\\[literal\\]`, `[a](https://example.com)`, inline code containing `[]`, bold+color, underline+color, and a paragraph containing multiple differently colored spans. Expected: existing escapes, links, code and individual styles are preserved.
6. Repeat in V3 columns, callouts and table cells. Test typing, paste, undo/redo, Source-to-Live switching, save and hard reload in Light/Dark. Expected: visible content, colors, and structural block IDs persist without raw delimiter text.
7. Type raw `[` and `]` in explicit Source mode, and use a literal standalone Markdown link in a non-colored paragraph. Expected: normal source editing/link syntax is unchanged.

Remain in stage-6 manual review.


## Backspace follow-up — 2026-11-02

After the original formatting repair, pressing Backspace could expose raw color metadata in Live Preview. Literal brackets were represented by two Markdown source characters, but the editor could delete just one source character. A broken escape could turn a visible bracket into a premature span delimiter. Deletion at the visible start or end could also damage an inline wrapper's hidden marker.

This follow-up makes Backspace/Delete remove an escaped square bracket atomically, expands partial keyboard selections at escaped brackets, and unwraps a whole color/underline wrapper at its visible boundary rather than deleting a hidden marker. The dialect now recognizes a closing bracket only when a valid metadata object immediately follows, and recovers an unbalanced literal opening bracket at the last valid metadata suffix. The V3 document format and UI do not change.

Manual acceptance: In a disposable V3 paragraph, color text followed by many bracket pairs. Repeatedly press Backspace and Delete inside the brackets and at both color boundaries. Check selection across a bracket, undo/redo, recoloring, Source/Live switching, save and reload. One key press must remove one visible bracket, never expose raw metadata, and not change unrelated colors. Repeat in V3 columns, table cells and callouts. Check links and code.

Verification: Authored through connected GitHub without a local dependency environment; formatter, lint, TypeScript, build and browser checks could not be run. No automated tests or browser automation were added or run as instructed by root AGENTS.md. Manual acceptance is still required.
