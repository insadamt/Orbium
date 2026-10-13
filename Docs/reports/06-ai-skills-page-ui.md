# AI skills page UI review

Date: 2026-10-13. Status: implemented for manual review within the current document-transfer work.

## Changes

- Removed Copy skill, clipboard state, raw Markdown imports, and the read-only instruction field.
- The page uses the Settings island width, a neutral download panel with a prominent ZIP action, and a two-column contents/setup layout that stacks on smaller screens.
- Three concise contents summaries explain blocks, colors/styling, and document packages. Three numbered steps explain assistant setup, authoring, and document import. An example prompt gives users a concrete starting point.
- Footer explains the included showcase/theme and links directly to Editor styles. Bundle usage guidance now describes attaching extracted references for assistants that cannot read ZIPs. Settings search no longer advertises copying.

Uses existing theme tokens, shared buttons, Inertia links, and installed Lucide icons. No new CSS file, dependency, animation, migration, backend behavior, or persisted format change. Existing staged work was preserved; no commit or push was made. The dynamically assembled download includes updated usage documentation automatically.

## Actual checks

- Formatting of changed TypeScript and skill Markdown: PASS.
- `npm run lint`: PASS, 416 formatted files and no warnings/errors in 341 linted files.
- `npm run types:check`: PASS.
- `npm run build`: PASS, 9.79 seconds. Existing large-chunk and ineffective dynamic-import warnings remain.
- Skill structure validator: PASS.
- `git diff --check`: PASS.

No automated tests were written or run. PHP checks were not repeated because no PHP source changed. Visual/browser acceptance remains for the user's manual review.

## Manual checklist

1. Settings → AI skills. Expected: a prominent Download skill ZIP button, contents summaries, three numbered setup steps, example prompt, and Editor styles link. No copy button or raw source field appears.
2. Click Download skill ZIP. Expected: create-orbium-documents.zip downloads while Settings remains open. Extract it; expected: SKILL.md, three references, and two example assets. Usage instructions no longer direct you to a copy button.
3. At desktop width, review the contents and setup columns. Resize to tablet/phone width. Expected: layout stacks, text wraps, download remains reachable, and the page has no sideways overflow.
4. Repeat in Light/Dark and Normal/Frosted with still and animated wallpapers. Expected: panel, text, and button remain readable and match the surrounding Settings shell.
5. Use Tab and Enter to activate download and Editor styles. Expected: both links work with the keyboard; Editor styles opens within the existing Settings tab.
6. Filter Settings with `skills`, `orbie`, or `download`. Expected: AI skills remains discoverable. Clear the query; expected: normal categories return.

## Commit suggestion

`feat(settings): simplify AI skills page around ZIP download`

Stop for manual review; do not begin the next phase.
