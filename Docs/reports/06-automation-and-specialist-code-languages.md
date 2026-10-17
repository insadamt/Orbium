# Automation and specialist code languages

Date: 2026-10-17. Editor review; no phase advancement.

## Implemented

- Expanded from 78 to 93 options: AppleScript, AutoHotkey, AutoIt, Tcl, Ada, CoffeeScript, Elm, QML, ReasonML, Smalltalk, Vala, SAS, Stata, AsciiDoc and Gherkin.
- Registered all 15 installed Highlight.js grammars in the shared factory used by Markdown and legacy JSON editors. Ordered its imports and registration entries alphabetically.
- Added searchable fence aliases: `osascript`, `ahk`, `au3`, `tk`, `adb`, `ads`, `coffee`, `cson`, `iced`, `qt`, `re`, `rei`, `st`, `do`, `ado`, `adoc` and `feature`.
- Added matching Simple Icons marks for Ada, AutoHotkey, AutoIt, CoffeeScript, Elm, ReasonML and Vala. Source metadata confirms these refer to their actual languages. Other new choices use neutral terminal/document/checklist/chart/code symbols rather than unrelated product logos.
- Retained original logo artwork, 24px sizing, existing dropdown search/icons, border-free trigger focus styling, unknown tag preservation, autosave and persistence formats.
- No dependencies or database changes; no commit created. Browser acceptance remains manual.

## Validation

- `npm run types:check`: passed.
- `npm run lint`: passed, including repository formatting checks.
- `npm run build`: passed; large-chunk and ineffective-dynamic-import warnings remain.
- `git diff --check`: passed.
- No automated tests written or run, per user instructions.

## Manual checklist

1. Open a code language picker. Expected: 93 choices, with Plain text first and the others alphabetized; all 15 additions are available and have logos or neutral symbols.
2. Search `osascript`, `ahk`, `au3`, `tk`, `coffee`, `qt`, `re`, `st`, `ado`, `adoc` and `feature`. Expected: the corresponding new language appears among results. Short terms may match several labels. Arrow/Enter selection and Escape dismissal retain their behavior.
3. Select each addition and paste its sample below. Expected: editable, highlighted source; AsciiDoc/Gherkin remain literal code rather than changing the surrounding document.

| Language | Sample |
|---|---|
| AppleScript | `display dialog "Hello"` |
| AutoHotkey | `MsgBox, Hello` |
| AutoIt | `MsgBox(0, "Demo", "Hello")` |
| Tcl | `set name "World"; puts "Hello $name"` |
| Ada | `procedure Hello is begin null; end Hello;` |
| CoffeeScript | `square = (x) -> x * x` |
| Elm | `main = text "Hello"` |
| QML | `import QtQuick 2.0` followed by `Rectangle { width: 100; height: 100 }` |
| ReasonML | `let square = x => x * x;` |
| Smalltalk | `Transcript show: 'Hello'; cr.` |
| Vala | `void main () { print ("Hello"); }` |
| SAS | `data demo; x = 1; run;` |
| Stata | `display "Hello"` |
| AsciiDoc | `= Hello` followed by a blank line and `*bold* text` |
| Gherkin | `Feature: Greeting` followed by `Scenario: Hello` and `Given a user` on separate lines |

4. Create fences using `ahk`, `coffee`, `qt`, `re`, `adoc` and `feature`. Expected: AutoHotkey, CoffeeScript, QML, ReasonML, AsciiDoc and Gherkin labels. Original tags stay preserved until a different language is selected.
5. Change language, edit code, Copy, undo/redo, wait for Saved and reload. Expected: source and language persist, copied content matches source, and undo/redo restores changes. Previously supported and unknown custom language tags remain usable.
6. Check light/dark themes, a narrow window and split panes. Expected: readable 24px icons and labels, bounded searchable/scrollable menus, independent selectors, and no focus border after selection.
7. Repeat representative additions in a legacy JSON document if available. Expected: matching options, icons, highlighting and Copy. Read-only Markdown still disables source/language edits. Unrelated app selects keep their existing behavior.

## Suggested commit

`feat(editor): add automation and specialist code languages`
