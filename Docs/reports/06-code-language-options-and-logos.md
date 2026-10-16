# Code language options and logo clarity

Date: 2026-10-16. Editor review; no phase advancement.

## Implemented

- Expanded the selector from 17 to 54 choices. Added Arduino, Diff, GraphQL, INI, Kotlin, Less, Lua, Makefile, Markdown, Objective-C, Perl, R, Ruby, SCSS, Swift, Visual Basic .NET, WebAssembly, and XML.
- Replaced internal identifiers with readable labels (C++, C#, JavaScript, Plain text, etc.) and added common fence aliases.
- Set code header SVG logos to 24px after size review and retained readable Markdown contrast. Reused Simple Icons, Lowlight common grammars and selected Highlight.js grammars; vendored four pinned Devicon language paths with their MIT license without installing an icon runtime dependency. Highlight.js is now explicitly declared at its already installed version for direct grammar imports.
- Shared vector rendering between both editors; plain text, INI and unknown tags have a consistent code symbol. Removed inaccurate ecosystem substitutions: C# and Visual Basic now have language-specific marks instead of .NET; Java replaces OpenJDK; Objective-C replaces Apple. SQL, Diff and Makefile use neutral database, diff and file symbols instead of PostgreSQL, Git and GNU.
- Fixed legacy editor logo updates when switching languages through the selector.
- Preserved unknown tags and existing source formats. No migrations or persistence changes.

- Added 19 further choices with registered highlighting in both editors: Clojure, CMake, Dart, Dockerfile, Elixir, Erlang, Fortran, F#, Groovy, Haskell, Julia, Lisp, MATLAB, Nginx configuration, OCaml, PowerShell, Scala, Scheme, and TOML. Registration imports only the selected extra grammars. Aliases include `clj`, `ex`, `fs`, `f#`, `hs`, `jl`, `ml`, and `ps1`.

## Logo audit

All 35 choices were reviewed against the installed Simple Icons definitions or
[Devicon source](https://github.com/devicons/devicon/tree/6a37858047b0e8d9c9c0e68f4a071fc410652e89/icons).
The original 35-choice contact sheet was rendered and visually inspected at 20px in the preceding review. The current size is 24px; browser layout acceptance remains manual.

| Languages / formats | Representation |
|---|---|
| Arduino, Bash, C, C++, CSS, Go, GraphQL, HTML, JavaScript, JSON, Kotlin, Less, Lua, Markdown, Perl, PHP, Python, R, Ruby, Rust, Swift, TypeScript, WebAssembly, XML, YAML | Matching Simple Icons marks |
| SCSS | Sass mark, the project that provides SCSS syntax |
| C#, Java, Objective-C, Visual Basic .NET | Matching Devicon language marks, pinned and licensed in `resources/js/components/editor/language-icons` |
| SQL | Neutral database symbol |
| Diff | Neutral additions/deletions symbol |
| Makefile | Neutral file symbol |
| Plain text, INI, Lisp, MATLAB, Scheme | Neutral code symbol |
| Clojure, CMake, Dart, Dockerfile, Elixir, Erlang, Fortran, F#, Groovy, Haskell, Julia, Nginx, OCaml, Scala, TOML | Matching Simple Icons marks (Docker for Dockerfile, Nginx for its configuration) |
| PowerShell | Neutral terminal symbol |

## Validation

- `npm run types:check`: passed.
- `npm run lint`: passed; repository formatting and lint checks found no errors or warnings.
- `npx vp fmt --check` on the four changed source files: passed.
- `npm run build`: passed; reported large-chunk and ineffective-dynamic-import warnings.
- `git diff --check`: passed.
- No automated tests written or run, per user instructions. Browser acceptance remains for the user.

## Manual checklist

1. Open a Markdown document, insert a code block, and open its language selector. Expected: readable labels including C++, C#, Kotlin, Swift, GraphQL and XML, with all options reachable by scrolling/keyboard.
2. Select Kotlin and enter `val message = "Hello"`; select Swift with `let message = "Hello"`, then Ruby with `puts "Hello"`. Expected: the label and recognizable logo update immediately, and source has syntax highlighting.
3. Switch through C#, Java, Objective-C and Visual Basic .NET. Expected: C#, Java coffee-cup, Objective-C and VB marks, without .NET, OpenJDK or Apple substitution. Check SQL, Diff and Makefile: expected neutral database, diff and file symbols. Then select Plain text and INI. Expected: a clean vector code symbol, not tiny text or an empty badge; INI highlights assignments such as `enabled=true`.
4. Use Markdown source to create fences tagged `kt`, `rb`, `rs`, `md`, `jsx`, and `tsx`. Expected: selectors display Kotlin, Ruby, Rust, Markdown, JavaScript and TypeScript respectively. Original tags remain until the selected language changes.
5. Create a fence tagged `custom-language`. Expected: the tag remains visible/selectable with a code-symbol fallback; editing and save/reload preserve it without errors.
6. Change a language, edit code, copy it, undo/redo, wait for Saved, and reload. Expected: copied content matches the code, undo/redo restores changes, and reload preserves language/source.
7. Repeat language changes in a legacy JSON document if available. Expected: logo follows every selection, including undo/redo, and highlighting/copy remain usable.
8. Inspect light/dark themes, a narrow window, and split panes. Expected: 24px logos stay sharp, centered and unclipped, names remain readable, and copy remains reachable. In read-only Markdown, language/source remain disabled and copying works.

9. Open the selector and scroll through all 54 choices. Expected: the 19 added choices are reachable, with no duplicate aliases and Plain text first.
10. Try Dart (`void main() { print("Hello"); }`), PowerShell (`Write-Host "Hello"`), Dockerfile (`FROM alpine:latest`), Elixir (`IO.puts("Hello")`), and TOML (`[app]` followed by `enabled = true`). Expected: syntax highlighting after selecting each language, matching logos or the neutral terminal symbol, and correct save/reload.
11. Create fences tagged `f#`, `clj`, `ex`, `hs`, `jl`, `ml`, and `ps1`. Expected: F#, Clojure, Elixir, Haskell, Julia, OCaml, and PowerShell labels respectively. Repeat a new language in the legacy editor if available: expected highlighting and icon changes there too.

## Commit suggestion

`feat(editor): add more code languages and enlarge language icons`

No commit created. Awaiting manual review.
