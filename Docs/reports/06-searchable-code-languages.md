# Searchable code languages

Date: 2026-10-16. Editor review; no phase advancement.

## Implemented

- Expanded from 54 to 65 selector choices. Added HTTP, Protocol Buffers, LaTeX, Windows Batch, Apache configuration, Assembly (x86), Assembly (ARM), Nix and Nim, plus explicit JSX and TSX labels.
- Registered the nine extra Highlight.js grammars through the existing shared factory, retaining highlighting in both Markdown and legacy JSON editors. JSX/TSX use the JavaScript/TypeScript grammars' built-in aliases.
- Preserved original logos and 24px sizing. Added matching Apache, LaTeX and Nim logos; JSX/TSX use JavaScript/TypeScript marks. HTTP, Protocol Buffers, Batch and Assembly use neutral format symbols; Nix uses the code fallback.
- Added optional search support to the existing select. Only code language selectors opt in. Search matches case-insensitive labels, canonical tags and aliases. JSX/TSX also match React and their underlying language names.
- Search receives focus on opening. Arrow keys move from search into results, Enter selects, Escape closes, and Arrow Up from the first result returns to search. Typing from a result resumes search. Results scroll beneath the search field; no matches shows a message; reopening clears search.
- Retained the requested border-free trigger focus styling, unknown tag preservation, existing autosave and source formats. No dependency or database changes.
- Previous uncommitted picker icons and focus styling remain part of the working tree. No new commit created.

## Validation

- `npm run types:check`: passed.
- `npm run lint`: passed, including repository formatting checks.
- `npm run build`: passed; reports large-chunk and ineffective-dynamic-import warnings.
- `git diff --check`: passed.
- No automated tests written or run, per user instructions. Browser interactions await manual acceptance.

## Manual checklist

1. Open a code language selector in a Markdown document. Expected: focused search field, 65 choices with icons, Plain text first and the remaining options alphabetized. Selecting a language does not leave a focus border around the button.
2. Search `proto`, `bat`, `tex`, `ps1`, `arm` and `react`. Expected: Protocol Buffers, Windows Batch, LaTeX, PowerShell, Assembly (ARM), and JSX/TSX respectively. Repeat with mixed case and leading/trailing spaces. Clear the query: all options return.
3. Search an impossible name. Expected: “No matches found.” Enter does nothing; the current language stays unchanged. Clear the input and search again: results recover.
4. Search `assembly`; press Arrow Down, then Arrow Down/Up to navigate and Enter to select. Expected: navigation follows filtered options and selection updates the header/icon. Arrow Up from the first result returns to search. Type while a result is focused: search resumes. Escape closes and returns focus to the button. Reopen: empty query and full list.
5. Select HTTP and enter `GET / HTTP/1.1` with a `Host: example.com` header. Select Protocol Buffers with `syntax = "proto3"; message User { string name = 1; }`. Expected: highlighted source, usable editing, and corresponding neutral icons.
6. Try LaTeX (`\\section{Hello}`), Batch (`@echo off`), Apache (`<VirtualHost *:80>`), x86 (`mov eax, 1`), ARM (`mov r0, #1`), Nix (`{ enabled = true; }`) and Nim (`echo "Hello"`). Expected: each is available and highlights through its selected grammar. LaTeX remains literal source rather than rendering math.
7. Create fenced blocks tagged `jsx` and `tsx`, then select those languages directly. Expected: distinct JSX/TSX labels, preserved fence tags and highlighted component syntax. Existing `js`/`ts` fences still display JavaScript/TypeScript. Search `javascript` or `typescript`: the relevant JSX/TSX choice is also discoverable.
8. Edit, copy, undo/redo, wait for Saved and reload. Expected: selected language and source persist, copied content matches source, and unknown custom language tags remain preserved/searchable.
9. Repeat search and new-language selection in a legacy JSON document if available. Expected: matching options, icons, highlighting and copy behavior. In read-only Markdown, selection and code editing stay disabled.
10. Check light/dark, narrow windows, split panes and reduced motion. Expected: bounded menu, readable icons/labels, stable search field above scrollable results, independent selectors per pane and no animation-dependent behavior.
11. Open unrelated Settings or other app selects. Expected: existing text-only layout, no added search field, normal focus styling and keyboard selection.

## Suggested commit

`feat(editor): add searchable language picker and more code formats`
