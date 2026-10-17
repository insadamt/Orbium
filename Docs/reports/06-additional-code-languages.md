# Additional code languages

Date: 2026-10-17. Editor review; no phase advancement.

## Implemented

- Expanded from 65 to 78 choices: GLSL, Awk, Gradle, Handlebars, Twig, Crystal, D, Haxe, Pascal, Delphi, Prolog, Verilog and VHDL.
- Registered 12 installed Highlight.js grammars in the shared factory used by Markdown and legacy JSON editors. Pascal and Delphi have separate labels backed by the same grammar's existing aliases.
- Added fence/search aliases for shader extensions, Awk variants, Handlebars, Crystal, Haxe, Pascal/Delphi and HDL extensions. Existing `pl` remains Perl to avoid changing old fences.
- Added matching Simple Icons marks for Gradle, Handlebars, Crystal, D, Haxe and Delphi. Other new choices use appropriate neutral symbols or the existing code fallback. No abbreviation badges, unrelated logos or dependency downloads.
- Retained original 24px logos, dropdown icons/search, border-free trigger focus styling, unknown language tags and existing persistence formats. No database or dependency changes; no commit created.

## Validation

- `npm run types:check`: passed.
- `npm run lint`: passed, including repository formatting checks.
- `npm run build`: passed; large-chunk and ineffective-dynamic-import warnings remain.
- `git diff --check`: passed.
- No automated tests written or run, per user instructions. Browser acceptance remains manual.

## Manual checklist

1. Open a Markdown document's language picker. Expected: 78 choices, Plain text first and the rest alphabetized; all 13 additions can be selected and show an icon without adding a focus border to the button.
2. Search `frag`, `gawk`, `hbs`, `cr`, `hx`, `pas`, `dpr`, `sv` and `vhd`. Expected: GLSL, Awk, Handlebars, Crystal, Haxe, Pascal, Delphi, Verilog and VHDL are included in the matching results. Short searches can match other names too. Arrow/Enter selection and Escape dismissal work as before.
3. Select each language and paste its sample below. Expected: source is editable and syntax highlighting appears. Templates stay literal code rather than rendering as document content.

| Language | Sample |
|---|---|
| GLSL | `void main() { gl_Position = vec4(1.0); }` |
| Awk | `BEGIN { print "Hello" }` |
| Gradle | `plugins { id 'java' }` |
| Handlebars | `{{#if user}}<p>{{user.name}}</p>{{/if}}` |
| Twig | `{% if user %}<p>{{ user.name }}</p>{% endif %}` |
| Crystal | `puts "Hello"` |
| D | `import std.stdio; void main() { writeln("Hello"); }` |
| Haxe | `class Main { static function main() { trace("Hello"); } }` |
| Pascal | `program Hello; begin writeln('Hello'); end.` |
| Delphi | `procedure Hello; begin Writeln('Hello'); end;` |
| Prolog | `parent(alice, bob). ancestor(X, Y) :- parent(X, Y).` |
| Verilog | `module hello(input wire clk); endmodule` |
| VHDL | `entity hello is port (clk : in bit); end hello;` |

4. Create fences tagged `pas`, `dpr`, `hbs`, `frag` and `sv`. Expected: Pascal, Delphi, Handlebars, GLSL and Verilog labels. A `pl` fence still displays Perl, and `prolog` displays Prolog.
5. Change a language, edit source, copy, undo/redo, wait for Saved and reload. Expected: selected language and source persist; copied text matches the code. Existing and unknown tags remain supported.
6. Inspect the original logos and new icons in light/dark themes and narrow/split panes. Expected: legible 24px artwork, bounded scrollable/searchable menu, and no abbreviation badges. Pascal/Prolog show code symbols; hardware languages show chip symbols.
7. Repeat several additions in a legacy JSON document if available. Expected: matching language selection, highlighting, icons and Copy. Read-only Markdown still disables edits and language selection.

## Suggested commit

`feat(editor): add shader template and hardware code languages`
