# Copyable Orbium document creation skill

Date: 2026-10-13. Status: implemented for manual review as an extension of the current document-transfer work. No later phase was started.

## Delivered

- Settings → AI skills at `/settings/ai-skills`, inside the existing authenticated Settings shell and category search.
- Copy skill, Download SKILL.md, and a read-only instruction field for manual copying when browser clipboard access fails.
- One maintained, self-contained skill at `resources/skills/create-orbium-documents/SKILL.md`, imported directly by the page so copied, displayed, and downloaded instructions agree.
- Version-2 single-file and ZIP package authoring guidance: Markdown/native formatting, exact manifest fields, checksums, local relationship keys, attachment ownership, supported image types, missing references, limits, Python generation recipe, delivery, and manual import instructions.

No migrations, persisted format changes, new dependencies, AI-service connection, automatic imports, commits, or pushes. Full account archives are outside this skill's scope.

## Validation

Actual results:

- `npx vp fmt` on the new Settings page, Settings layout, and skill: PASS.
- `npm run lint`: PASS; all 412 checked files formatted, no warnings or lint errors in 341 linted files. The initial run found formatting issues in the new Markdown skill; formatting resolved them.
- `npm run types:check`: PASS.
- `./vendor/bin/pint --test`: PASS.
- `php -l routes/settings.php`: PASS.
- `php artisan route:list --path=settings/ai-skills -v`: PASS; the GET/HEAD route uses web/auth middleware. The vendor-exclusion filter hides Inertia routes, so route inspection uses the unfiltered command. Local route cache was cleared during inspection.
- Skill creator's `quick_validate.py resources/skills/create-orbium-documents`: PASS after final formatting. This validates skill structure, not generated package acceptance.
- `npm run build`: PASS after final skill formatting. Existing large-chunk, ineffective dynamic-import, and plugin-timing warnings remain.
- `git diff --check`: PASS.

No automated tests were written or run. Browser acceptance and AI-generated document/package import are reserved for the user's manual review. New source files remain under 500 lines.

## Exact manual checklist

1. Sign in, open Settings → AI skills. Expected: the existing Settings island shows Create Orbium documents, Copy skill, Download SKILL.md, and Read skill instructions. Refresh this route. Expected: the same page remains accessible. Open the route signed out. Expected: authentication is required.
2. In Settings top Search, type `orbie` or `packages`. Expected: AI skills appears among matching categories. Select it and clear search. Expected: the page and normal categories remain usable.
3. Click Copy skill and paste into a plain-text editor. Expected: a success message and complete Markdown beginning with YAML `name: create-orbium-documents`, including version-2 format, package recipe, and import instructions. Download SKILL.md. Expected: its text matches the copied instructions.
4. Deny clipboard permission where supported and click Copy skill. Expected: a useful failure message with download/manual-copy alternatives. Expand Read skill instructions, focus the read-only field, select all and copy. Expected: complete instructions can be copied without editing the source.
5. Paste the skill into an external AI assistant and ask: “Create a standalone project-notes .orbie page with a heading, checklist, colored/underlined sentence, callout, and math.” Import its file via workspace/folder empty space → Import → Single document. Expected: a new editable page with the chosen title and supported formatting; save/reload preserves its body.
6. Ask the assistant: “Create an Orbium ZIP package with Overview and Details pages that mention each other.” Import through empty space → Import → Whole package. Expected: verification succeeds, two new sibling pages appear, and both mentions open the new copies after reload. Reimport once. Expected: another pair is added; existing pages remain unchanged.
7. Supply a PNG/JPEG and PDF to the external assistant and request a package containing an image with caption and a file download. Expected: imported media displays, the PDF downloads, and ownership/checksums validate. If the assistant cannot create files, expected: it explains that limitation and supplies a runnable recipe rather than claiming a ZIP exists.
8. In a disposable copy of a generated ZIP, change document bytes without updating the checksum. Import it. Expected: verification rejects it before creating pages or assets.
9. Navigate the Settings page using Tab/Enter/Space. Repeat in Light/Dark, Normal/Frosted, and at narrow width. Expected: buttons, instruction disclosure, and manual-copy field remain usable and readable, with wrapping controls and no horizontal page overflow.

## Known limitations

External assistants still need file-writing capability to produce downloadable artifacts and must follow the contract. Successful structure validation of the skill does not establish behavioral acceptance of generated artifacts. Clipboard availability depends on browser permissions and secure context; download and manual copying remain available. No skill installation is performed in the user's external assistant.

## Commit suggestions

- `feat(settings): add copyable Orbium document creation skill`
- `docs(documents): document AI skill sharing and manual acceptance`

Stop for manual review; do not begin the next phase.
