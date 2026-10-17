# Git and additional technical code formats

Date: 2026-10-17. Editor review; no phase advancement.

## Implemented

- Expanded from 93 to 106 choices: Git commands, PostgreSQL / PL/pgSQL, Vim Script, OpenSCAD, Processing, LLVM IR, VBScript, Stylus, XQuery, Thrift, Coq, Java Properties and DNS zone files.
- Registered the 12 installed Highlight.js grammars in the shared factory for both editors. Registered Git as a Bash alias inside the highlighter so the selector/fence can retain `git` without duplicating the grammar or changing Bash selections.
- Git uses its own logo; PostgreSQL, Vim, OpenSCAD, LLVM and Stylus use matching marks. Processing, Properties, DNS, XQuery and Thrift use neutral palette/file/network/schema symbols; VBScript and Coq use the code fallback. Generic SQL keeps its neutral symbol.
- Added aliases for Git commands, PostgreSQL/PL/pgSQL, Vim Script, OpenSCAD, Processing, LLVM IR, VBScript, Stylus, XQuery, Properties and DNS zones. They work in search and fence normalization.
- Preserved original logos, 24px sizing, dropdown icons/search, border-free focus styling, unknown tags, autosave and content formats. No database or dependency changes; no new commit created.

## Validation

- `npm run types:check`: passed.
- `npm run lint`: passed, including repository formatting checks.
- `npm run build`: passed; large-chunk and ineffective-dynamic-import warnings remain.
- `git diff --check`: passed.
- No automated tests written or run, per user instructions. Browser acceptance remains manual.

## Manual checklist

1. Open a Markdown code language selector. Expected: 106 choices, Plain text first and other labels alphabetized; all 13 additions are selectable with logos or neutral icons.
2. Search `git`, `postgresql`, `plpgsql`, `vimscript`, `scad`, `pde`, `ll`, `vbs`, `styl`, `xq`, `bind` and `zone`. Expected: corresponding choices appear among filtered results. Short queries may match several languages. Arrow/Enter selection and Escape dismissal still work.
3. Select Git commands and enter `git commit -m "Hello" && git status`. Expected: Git logo, preserved Git commands label and Bash-style shell highlighting, including the quoted string. Create a `git` fence, wait for Saved and reload: tag/label/source remain. Bash remains Bash and Diff still handles patches.
4. Select PostgreSQL / PL/pgSQL. Expected: PostgreSQL logo; switch to generic SQL: expected neutral database icon. Source remains unchanged by changing the language.
5. Select each remaining addition and paste its sample below. Expected: editable, highlighted source appropriate to that grammar; configuration/model snippets remain literal text and do not execute or render.

| Language / format | Sample |
|---|---|
| PostgreSQL / PL/pgSQL | `SELECT now()::timestamp;` |
| Vim Script | `let g:greeting = "Hello"` |
| OpenSCAD | `cube([10, 10, 10]);` |
| Processing | `void setup() { size(100, 100); }` |
| LLVM IR | `define i32 @main() { ret i32 0 }` |
| VBScript | `MsgBox "Hello"` |
| Stylus | `body` followed by an indented `color red` |
| XQuery | `for $x in (1, 2) return $x` |
| Thrift | `struct User { 1: string name }` |
| Coq | `Theorem demo : True. Proof. exact I. Qed.` |
| Java Properties | `greeting=Hello` |
| DNS zone files | `example.com. 3600 IN A 192.0.2.1` |

6. Create fences tagged `postgresql`, `scad`, `pde`, `vbs`, `xq` and `zone`. Expected: the corresponding canonical labels, with authored fence tags retained until choosing another language.
7. Change language, edit, copy, undo/redo, wait for Saved and reload. Expected: source/selection persist and copied code matches source. Previously supported and unknown language tags continue to work.
8. Check light/dark, narrow windows and split panes. Expected: original 24px icons, bounded searchable/scrollable dropdown, independent selectors and no focus border after selecting a language.
9. Repeat Git and several new formats in a legacy JSON document if available. Expected: the same options, icons and highlighting; Copy works. Read-only Markdown still disables language/source changes.

## Limits

Git commands uses Bash highlighting. Dedicated commit-message, Git log and interactive-rebase grammars are not included. The editor only displays code and never runs Git commands.

## Suggested commit

`feat(editor): add git commands and technical code formats`
