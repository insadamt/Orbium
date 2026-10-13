# Orbium authoring skill ZIP bundle

Date: 2026-10-13. Status: implemented for manual review in the current document-transfer extension. This expands the earlier copyable skill; no next phase was started.

## Delivered

- Settings → AI skills now offers Download skill ZIP through an authenticated endpoint. The archive is assembled from maintained resources on each download; temporary output is deleted after sending.
- The ZIP has one `create-orbium-documents/` root with six files: SKILL.md; usage, blocks, and colors-and-effects references; an importable block-showcase.orbie; and a separate orbium-editor-theme.css starter theme.
- Detailed authoring reference covers inline formatting, all native block kinds, direction/alignment, lists/tasks, folding callouts, styled dividers, code/Mermaid, math, GFM/rich tables, images/files, mentions, placeholders, package generation/schema, ownership, checksums, and size limits.
- The color/effects guide includes all ten preset tokens and their exact current Light/Dark values, fixed hex syntax, complete CSS selector/property/value-function/variable policy, static shadow/rounded/background recipes, theme application, and Appearance usage. It identifies unsupported effects so assistants do not invent invalid metadata.
- Usage instructions cover assistant installation/sharing, practical prompts, Orbium navigation/editing, distinct skill/document/theme import destinations, import/export behavior, and troubleshooting.
- Copy skill and Read skill instructions include the entrypoint plus every Markdown reference for chat-only assistants. ZIP assets remain available through download.

No migrations, format changes, dependencies, AI service connection, automatic imports, commits, or pushes. Editor CSS and application Appearance preferences remain separate from portable document metadata.

## Actual validation results

- `npx vp fmt resources/js/pages/settings/ai-skills.tsx resources/skills/create-orbium-documents`: PASS.
- Pint formatting of new PHP files and routes: PASS.
- `./vendor/bin/pint --test`: PASS.
- PHP syntax checks for the new controller and archive service: PASS.
- `npm run types:check`: PASS.
- `npm run lint`: PASS; 416 checked files formatted, no warnings/errors in 341 linted files.
- `npm run build`: PASS; existing large-chunk and ineffective dynamic-import warnings remain.
- Focused PHPStan analysis of AiSkillController and OrbiumSkillArchive: PASS, zero errors.
- Skill creator `quick_validate.py`: PASS. This is skill metadata validation, not behavioral acceptance.
- `php artisan route:list --path=settings/ai-skills -v`: PASS; page and download routes both use web/auth middleware.
- Created `/tmp/create-orbium-documents.zip` using the actual archive service. Read-only archive inspection found six entries, each byte-for-byte identical to its maintained source.
- `git diff --check`: PASS.

No automated tests were written or run. No generated showcase or package was automatically imported. User browser/import/theme acceptance is pending. All new source/reference files remain below 500 lines.

## Exact manual checklist

1. Sign in → Settings → AI skills → Download skill ZIP. Expected: `create-orbium-documents.zip` downloads without navigating away from Settings. Extract it. Expected: the single root folder contains SKILL.md, three references, and two assets with working relative paths. Request the download route while signed out. Expected: authentication is required.
2. Click Copy skill and paste into a text editor. Expected: entrypoint plus blocks, colors-and-effects, and usage references, including the full preset color table and CSS restrictions. Expand Read skill instructions. Expected: the same combined text. Deny clipboard access if the browser permits it; expected: download/manual-copy fallback message.
3. Install the complete extracted folder in your assistant's configured skill directory, or attach the ZIP to an assistant capable of reading archives. Ask it to create a `.orbie` guide with color/underline, folded callout, RTL paragraph, styled divider, Mermaid, math, and merged table. Expected: the assistant uses the documented syntax and delivers a file or clearly explains its file-writing limitation.
4. Import the bundled `assets/block-showcase.orbie` through workspace/folder empty space → Import → Single document. Expected: new Orbium block showcase page, colored/underlined text, right-aligned Arabic, checklist, Roman list, folding callouts, double blue divider, code, diagram, math, and a merged table header. Missing page/image/file examples explain their missing status when opened. Save/reload; expected: content and native metadata persist.
5. Settings → Editor styles → Customize styles → Import `assets/orbium-editor-theme.css`. Expected: valid preview with blue headings, rounded quotes/callouts, neutral backgrounds, and subtle static callout shadow. Apply, open a document, switch Light/Dark, and reload. Expected: theme remains applied and variable-based surfaces adapt. Cancel an additional draft edit; expected: saved theme remains unchanged. Disable custom styles when finished if desired.
6. Ask an assistant to create two linked pages with a supplied PNG and PDF in a native document ZIP. Import through Whole package. Expected: verification, new sibling pages, mentions opening new copies, displayed image, downloadable PDF, and successful save/reload. Its ZIP uses manifest.json at root, unlike the skill ZIP.
7. Ask for unsupported document blur/animation. Expected: the assistant explains the relevant supported styling layer and offers static shadow or app Appearance guidance; it does not invent `blur`/`animation` JSON fields or unsupported editor CSS.
8. Navigate Settings with keyboard, open/close the instructions, select/copy text, and activate download. Repeat at narrow width and in Light/Dark and Normal/Frosted. Expected: readable wrapping controls, usable disclosure/manual-copy field, and no horizontal page overflow.

## Limitations

The ZIP is an assistant skill bundle and is not accepted by Orbium's document-package importer. Installing it does not configure or invoke an external AI service. Native files carry supported body formatting; account CSS needs separate application and affects all matching blocks, while app wallpapers/frosted surfaces are Appearance preferences. External assistant compliance and renderer/browser behavior require manual review.

## Suggested commits

- `feat(settings): download complete Orbium authoring skill as ZIP`
- `docs(skills): add blocks colors effects and usage references`

Stop for manual review; do not begin the next phase.
