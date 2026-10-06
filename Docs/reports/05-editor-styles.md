# Phase 5 review — Shareable editor styles

> Current UI review (2026-10-06): The approved dialog redesign supersedes the original inline settings UI and manual steps below. See [the redesign report and current checklist](05-editor-styles-redesign.md).

## Implemented

The user approved Settings → Editor styles on 2026-10-05. A user can import or write one base CSS theme, add independent declarations for each document block type, preview the result, and apply it across their documents. Export combines the base and overrides into a shareable `.css` file. Import replaces draft styles only; it preserves saved settings until Apply. Reset block returns to the base styles; Cancel discards drafts; Reset all and the enable switch require Apply.

Preferences are stored per account in PostgreSQL and shared with document pages. Open same-origin document panes receive a BroadcastChannel notification and fetch current preferences without altering document content or saving editor revisions. Stable classes are attached to actual block containers: decorations for ordinary blocks and explicit view classes for media/table blocks. Decoration updates map unchanged blocks and rebuild changed enclosing blocks only. The opening preview also uses ordinary block selectors.

CodeMirror provides CSS highlighting, completion, and editing history. CSSTree parses and validates CSS; Orbium owns allowed selectors/properties, source size limits, and scoped regeneration. Imported/stored source is never directly injected. Invalid drafts receive errors; invalid persisted themes fall back to defaults. CSS targets content rather than settings or app controls. New source files remain below 500 lines; the existing document editor remains below 500 lines.

## Libraries and limitations

- [CodeMirror](https://codemirror.net/) supplies the editor UI. It does not validate Orbium's policy; CSS completion can suggest syntax Orbium does not support. It is loaded with the Settings page.
- [CSSTree](https://github.com/csstree/csstree) supplies parsing, AST traversal/generation, and property validation. Its tolerant parser requires explicit parse-error handling. It is not a sanitizer or sandbox; our policy rejects unsupported syntax and scopes regenerated rules. Theme-variable values are also checked with the browser's CSS support API; their final computed value depends on the current theme.
- Own solution: stable block selector contract, account persistence, override precedence, scope generation, preview, import/export, and open-pane notification. This avoids building a CSS parser from scratch or replacing the existing document editor.

## Persistent changes

- Added migration `2026_10_05_200000_add_editor_styles_to_users_table.php`: nullable `users.editor_styles` JSON, cast to array. Defaults preserve existing document appearance.
- Migration applied successfully against the configured local PostgreSQL database; migration status reports batch 10, Ran. Initial sandboxed connection failed; retry with local-network access succeeded.
- No editor content schema or revision changes. Preferences are shared once as `editorStyles` rather than duplicated in serialized user props.
- GET/PUT `/settings/editor-styles` and authenticated GET `/settings/editor-styles/preferences` are registered.
- CSS export is standalone sharing. Full account archive integration remains for the approved portability phase.
- The user-approved scope change is recorded in the scope, editor spec, deferred features, decision log, and Phase 5 docs. No next phase started.

## Validation

- `./vendor/bin/pint --test` — passed.
- `npm run types:check` — passed.
- `npm run lint` — passed, including formatting checks.
- `npm run build` — passed with the existing large-chunk warning.
- `git diff --check` — passed.
- `php artisan route:list --path=settings/editor-styles` — passed, three routes registered.
- Scoped migration and migration-status check — passed.
- `npm audit --json` — reports five high-severity entries in the existing Mermaid/Chevrotain/lodash-es chain. Mermaid 12.0.0, Chevrotain 11.1.2, and lodash-es 4.17.23 are unchanged from HEAD. No dependency remediation is included in this feature.
- Automated tests were neither written nor run, per user instructions. No browser/manual acceptance result is claimed.

## Manual test checklist

1. Open **Settings → Editor styles**. Expand **Selectors and supported styles**. Expected: base editor, all 16 block choices, CSS help, import/export, enable switch, and sample preview are present. Existing documents retain their default appearance.
2. Enter `.orbium-heading-1 { color: #75a1ff; }` in **Base stylesheet**. Expected: the preview's H1 changes, settings controls stay unchanged, and documents remain unchanged before Apply.
3. Select **Heading 1 override** and enter `color: #eb8424; padding: 12px;`. Switch to another block and back. Expected: the override stays in the draft and the H1 is orange. **Reset block override** returns H1 to base blue.
4. Import `Docs/examples/editor-theme.css`. Expected: the base draft and preview update; prior draft overrides clear. Click **Cancel changes**. Expected: the saved theme returns and documents remain unchanged.
5. Import the starter theme again, add a Heading 1 override, and click **Apply to all documents**. Open an ordinary document and a document inside a database, in different workspaces if available. Expected: matching block styles apply to both; titles/covers and app chrome are unaffected. Refresh Settings and documents. Expected: preferences remain saved for the account.
6. Keep a document open in a split pane or another browser tab. Apply a different quote or callout style from Settings. Expected: already-open matching blocks update without a reload on browsers supporting BroadcastChannel. Draft document edits remain intact and the theme change does not create a document save or undo entry.
7. Create headings, paragraphs, lists, checklist, quote, callout, code, table, image, file, Mermaid, math, and divider blocks. Change their supported colors, padding, borders, and typography. Expected: matching visible containers change consistently with the sample; media source/preview buttons, attachment downloads, code copy/language controls, and table controls continue working. Image styling targets its wrapper; table styling targets the table rather than individual cells.
8. With styles applied, edit, split, duplicate, convert, reorder, delete, and undo blocks, especially adjacent blocks and paragraphs within lists/quotes. Expected: styles follow block types, unaffected neighboring blocks keep their styles, and content editing/autosave continue normally. Scroll and type in a long document. Expected: no whole-document class rebuild on selection-only transactions; writing remains usable.
9. **Export CSS**, then **Reset all → Apply**. Import the downloaded file. Expected: the combined appearance returns in preview. Apply and reload. Expected: the exported appearance is restored. Imported overrides are now ordered base rules; a new block override still takes priority. Import into a second account to check sharing; that account must Apply independently.
10. Try `.orbium-quote { position: fixed; }`, `body { color: red; }`, an `@import`, `background-color: url(...)`, `!important`, an unknown theme variable, invalid declaration syntax, and a CSS file larger than 50,000 bytes. Expected: clear errors, rejected enabled Apply/import, and no changes to saved document styles. A failed import retains the current draft.
11. Switch Light/Dark and inspect `var(--muted)`, `var(--foreground)`, and `var(--border)` styling. Add Arabic text to a quote with `border-inline-start` and logical padding. Expected: theme variables adapt and logical edges respect direction; fixed colors remain fixed. Explicit inline text formatting still takes priority over theme colors.
12. Edit draft CSS, **Cancel changes**, and inspect documents. Then uncheck **Enable custom styles → Apply**. Expected: cancel restores saved settings; disabling restores default document appearance while preserving CSS for later re-enabling. Re-enable and Apply, then **Reset all → Apply**. Expected: defaults return and persist after refresh.
13. Sign in as a different user without importing the theme. Expected: that account retains its own/default styles. Export the current document as Markdown. Expected: editor theme CSS is omitted and document content is unchanged.

## Known limitations

- Only exact documented `.orbium-*` selectors and appearance properties are supported. No arbitrary/nested selectors, media queries/other at-rules, positioning/display, transforms, animation, remote URLs, custom property definitions, !important, or negative dimensions.
- Combined exported UTF-8 CSS is limited to 50,000 bytes; each override is limited to 10,000 characters. Export/reimport preserves effective styling, not the original base/override separation.
- The preview has representative image/file/math/diagram markup, not uploaded attachments or live Mermaid rendering. It follows the current app theme.
- Without BroadcastChannel, existing documents update on navigation/reload. Cross-device live notification is not implemented.
- User CSS can reduce content readability. Settings remains outside its scope and offers Disable/Reset recovery.
- Styles affect block containers, not every internal sub-element. Syntax highlighting and explicit inline formatting remain intact.
- Full archive integration is deferred to the portability phase. This feature supplies standalone CSS sharing now.

## Suggested commits

- `feat(editor): add shareable account-wide CSS themes`
- `docs(editor): document theme selectors and manual acceptance`

No commits created. Remain in Phase 5 pending user manual review.

## 2026-10-06 — Focused CSS workspace

Implemented the approved large-dialog, CSS-first redesign: compact settings summary, grouped navigation with override/error markers, retained per-source editing history/cursor/scroll, theme-aware syntax colors, @codemirror/lint diagnostics with jump actions, focused/full preview, last-valid preview retention, persistent actions/status, and guarded dirty close. Account settings, document content, routes, selectors, and CSS sharing format remain compatible. No migration was required. Current checks and exact manual steps are in [the redesign report](05-editor-styles-redesign.md).
