# Document callout menu and conversion repair

Date: 2026-10-20. Status: implemented; manual acceptance pending.

## Scope and findings

Focused repair requested during review; no later phase is started.
Markdown callouts use a Blockquote syntax node, so the block menu labelled them
Quote. The conversion handler also explicitly rejected their source.

## Changes

- Preview rendering, menu identification and conversion share the existing
  callout marker/body parsing rules through `readCalloutSource`.
- The block menu identifies callouts as Callout and ordinary quotes as Quote.
- Callouts can convert to the existing text, heading, list, quote and code targets.
  Conversion removes the callout marker/folding syntax and its outer quote
  prefixes, retaining the body Markdown. Explicit titles become leading content;
  implicit type labels such as NOTE do not become text.
- Existing conversion transactions retain undo/redo, presentation metadata and
  autosave behavior. No persistent format changes or migrations.
- Existing unrelated working-tree changes were preserved. No commit created.

## Validation

- Targeted `npx vp check` on all four changed source files: passed.
- `npm run lint`: passed; formatting checked 659 files, lint checked 551 files.
- `npm run types:check`: passed.
- `npm run build`: passed, with warnings about mixed static/dynamic imports,
  chunks exceeding 500 kB and plugin timing.
- `git diff --check`: passed.
- No automated tests were written or run, as requested. Browser behavior awaits
  the manual checks below.

## Manual checklist

1. Open a Markdown Document, insert `/callout`, and type `Remember **this**`.
   Open its six-dot block menu. Expected: the first row says Callout.
2. Choose Callout → Text. Expected: the callout surface disappears, the text
   remains with bold formatting, and no `[!NOTE]` marker or extra NOTE text appears.
3. Undo. Expected: the original callout returns. Redo. Expected: text returns.
4. Undo back to the callout before each conversion and choose Heading 1,
   Heading 2, Heading 3, Bullet list, Numbered list, Checklist, Quote and Code.
   Expected: each target renders correctly with the original body; Code retains
   the literal body Markdown, and Quote has the ordinary quote presentation.
5. Use Source mode to add the following callout, then return to Live Preview:

   ```markdown
   > [!WARNING]- Review this
   > First **important** line
   > Second line
   ```

   Expected: a folded titled callout whose menu says Callout. Convert it to
   Text. Expected: `Review this` and both body lines survive; no WARNING marker
   or folding suffix remains. Undo restores the folded callout and its title.
6. Change a callout's Text direction to Right to left, reopen its menu, then
   convert it to Text. Expected: it still says Callout before conversion and
   the converted text retains the direction setting.
7. Create an ordinary Quote and open its block menu. Expected: it says Quote;
   converting it to Text still works.
8. Convert a callout, wait for autosave to finish, and reload the Document.
   Expected: the converted block and its full text persist; nearby blocks remain
   unchanged.

## Commit suggestion

`fix(editor): correct callout menu label and enable block conversion`
