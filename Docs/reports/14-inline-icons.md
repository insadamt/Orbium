# Inline icons completion report

## Phase

Approved Document editor extension, 2026-10-26. Implementation is ready for manual review; browser acceptance remains pending. Authorization and boundaries are recorded in `../phases/14-inline-icons.md`.

## Implemented

- Shared Emoji / Built-in icons / My icons picker with search, Recent and Favorites. Arrow keys/Home/End switch picker tabs; ordinary Tab/Enter operate choices. The built-in catalog uses curated Lucide assets already installed in the project, with an included ISC notice.
- `/icon` opens the picker at the insertion point. `:rocket` and other colon queries offer searchable emoji and built-in completions plus Browse all icons. Emoji remain ordinary text, including emoji pasted from an operating-system picker.
- Built-ins and custom image icons occupy one text-sized inline unit. Click or keyboard-focus and activate an icon to replace it. Arrow navigation and Backspace/Delete operate on the complete atom; editable-source mode remains available in Markdown Documents.
- Custom icons reuse workspace Library images or upload PNG, JPEG, GIF or WebP images through existing Document attachment endpoints. Existing ownership, saved-use tracking, protected deletion and reference-remapping mechanisms include the custom image reference.
- Markdown/CodeMirror and legacy JSON/Tiptap Document editors use their existing history, autosave, revisions and conflict handling. Hosted Document cards edit the original Document through the same adapters. Uploads retain an insertion anchor and reject insertion if its text changes. Legacy uploads prevent leaving/closing during a pending request and mark hosted sessions busy.
- Account/workspace/browser-local Recent and Favorites. Picker choices, colon completions and new uploads update Recent. Custom images can be starred from Recent after insertion. Preferences tolerate unavailable browser storage and are not stored in Document content.
- A shared server/client built-in allowlist, server validation of icon source/attributes and image MIME/purpose checks. Older clients without `editor_features.inline_icons: 1` cannot save an icon-containing Document through either editor endpoint. This prevents unknown atoms or formatting from disappearing in whole-document saves.
- Inline Markdown formatting preserves icon source as opaque content. Standard references inside custom icons remain visible to existing attachment discovery and transfer remapping. Search/plain text retain icon labels; legacy statistics include labels without inventing a new block count.
- Formatting-preserving Markdown/.orbie transfers retain the inline metadata. Clean Markdown and legacy convenience exports use readable built-in labels or custom image references. Office export models retain the existing readable label/image fallbacks.

Main implementation: `resources/js/components/inline-icons/`, the two Document editor adapters, `app/Services/Editor/InlineIconData.php`, existing editor inspection/save paths and Markdown inline metadata validation. The existing empty-document Markdown paste handler was extracted to `markdown-import-paste.ts` to keep the Markdown editor below 500 lines.

## Explicitly outside this slice

- Native Board text/list/table inline schemas and Mind Map topic schemas are unchanged. Hosted Document cards receive the feature; native Board/Mind Map text can still contain ordinary Unicode emoji.
- Brand packs, arbitrary SVG uploads, icon drawing, full Unicode emoji taxonomy/skin-tone controls and remote icon services are not added. The picker contains a curated initial collection; operating-system emoji paste still works.
- Recent/Favorites sync and whole-account portability remain outside this work. No new whole-account archive format is defined.
- Vector fidelity in Office or clean Markdown exports is not promised. Custom images in those export formats follow the existing image presentation rather than necessarily remaining one-em symbols.
- Nested Markdown table-cell editors render existing icons but do not have the main Document picker adapter. Source-mode edits can retain their metadata. Emoji continue to work normally.

## Commits

No commits or staging performed. Existing uncommitted Board/Mind Map work was preserved.

Suggested commit messages:

- `feat(editor): add inline emoji, built-in and custom icon picker`
- `feat(editor): preserve inline icon references and guard older saves`

These are suggestions, not completed commits. Review hunks carefully because several touched files already contained unrelated uncommitted work.

## Migrations and persistent formats

- No migration or new dependency.
- Markdown retains content format 2 and adds validated inline metadata: `:orbium[rocket]{"icon":"rocket"}` or `:orbium[![My icon](orbium:attachment/123)]{"icon":"custom"}`. Existing color/underline metadata and outer formatting remain supported.
- Legacy Documents retain content format 1 and add an atomic `inlineIcon` node with version-1 attributes (`kind`, `label`, `name` or `attachmentId`). Reference inspection/remapping includes custom icons. Older servers reject the unknown node/metadata rather than silently accepting it.
- Deploy frontend and server together and reload open editors. Requests from stale clients are rejected when icons are involved. No existing Document is rewritten automatically.

## Validation actually performed

| Check | Actual result |
|---|---|
| Targeted `vp check --fix` | Passed after correcting two control-regex lint warnings |
| `npm run lint` | Passed; all 782 files correctly formatted, no warnings/errors across 662 linted files |
| `npm run types:check` | Passed |
| `npm run build` | Passed, 5,605 modules transformed; emitted large-chunk, ineffective dynamic-import and plugin-timing warnings |
| Targeted `./vendor/bin/pint --test` | Passed for all seven touched PHP files |
| `php -l` | Passed for all seven touched PHP files |
| `git diff --check` | Passed |
| Automated tests / Playwright | Not written or run, following the user's instructions |
| Browser/manual acceptance | Not performed by Codex; checklist below is for the user |

The build warnings concern chunk sizes and imports of the crop dialog, database property header and Document editor loader. No baseline build was run to measure a before/after bundle comparison.

## Manual validation for the user

Use a disposable Document in your current workspace. Reload Orbium after starting the updated frontend/server. Repeat the basic insertion/replacement/save checks in an existing legacy Document if one is available; do not change production content formats merely to manufacture a fixture.

1. **Open the picker:** type `Launch /icon` in an ordinary paragraph, then accept **Inline icon** with Enter. Expected: the picker opens at the command's position, offers the five tabs, and Cancel/Escape inserts nothing. The rest of the paragraph stays intact.
2. **Emoji:** open `/icon`, search `rocket` on Emoji and choose 🚀. Continue typing ` after review`. Expected: the emoji stays within the sentence; typing continues immediately after it without creating another block.
3. **Colon completion:** on another line type `:rocket`. Use Up/Down and Enter or Tab to choose the emoji, then repeat and choose the built-in rocket. Expected: the query is replaced with the selected inline item, with no leftover colon/query. **Browse all icons…** opens the shared picker.
4. **Literal text:** type `12:30`, `https://example.com`, and `:rocket` inside inline code and a fenced code block. Expected: these remain literal; code does not open the icon completion menu. Ctrl+Space still opens Search Master.
5. **Built-ins:** choose **Built-in icons**, search `heart`, insert it in a heading and in a paragraph. Expected: the icon uses the surrounding text size/color and remains within the line. Check Light and Dark appearance.
6. **Library reuse:** open `/icon` → My icons. Choose an existing workspace image and confirm **Use image**. Expected: it appears as a small inline icon, not a media card, and surrounding text is preserved.
7. **New upload:** open My icons → Upload a new icon and choose a small PNG/WebP. Expected: an upload produces an inline icon and the image remains available in Library for reuse. Cancel a second file chooser: expected no new icon or changed paragraph. For a legacy Document, upload progress/errors remain visible inside the picker and closing is blocked while uploading.
8. **Replace:** click a built-in/custom icon, choose a different source/type, and continue typing. Expected: exactly that icon is replaced. Focus another icon with Tab and use Enter/Space: expected the same picker. Escape without choosing preserves the existing icon.
9. **Delete and undo:** place the caret immediately after an icon and press Backspace; undo and redo. Repeat using a keyboard-focused icon and Delete. Expected: the whole icon disappears/reappears as a unit, with no visible metadata fragments. Text around it remains intact.
10. **Formatting:** select a sentence spanning a built-in and custom icon. Apply bold/italic, then color to the surrounding text, undo, and toggle Source/Live Preview. Expected: both icons retain their identity; readable surrounding formatting survives. Source exposes a complete `:orbium[...]` span rather than flattened icon text.
11. **Recent/Favorites:** insert through picker, colon completion and a new upload. Open Recent: expected the inserted choices appear. Star a built-in and custom image there, then open Favorites. Expected: both appear; unstar removes the favorite. Reload: expected local preferences remain in this account/workspace. A different workspace has separate preferences.
12. **Save and reload:** wait for Saved, reload and reopen the Document. Expected: emoji, built-ins and custom icons remain in the same sentences. Replace an icon, wait for Saved and reopen: expected the replacement is retained.
13. **Library protection:** after saving a custom icon, open its Library details/delete review. Expected: the Document is listed as a saved usage and deleting the used image is blocked. Remove the icon and save; if no other saved usage exists, expected deletion becomes available.
14. **Export/import:** export the disposable Markdown Document with formatting and referenced image files included; import it as a new Document. Expected: built-in identity and custom image references survive with remapped uploaded IDs. Export clean Markdown: expected built-in labels and custom image references are readable fallbacks. For legacy Documents, convenience Markdown export should succeed using those fallbacks.
15. **Hosted Document:** open the same Document in a Board card, enter Document editing and insert/replace an icon. Expected: it saves to the original Document, survives leaving/re-entering the card, and the normal Document page shows the same edit. Existing Board/Mind Map controls and ordinary text remain usable.
16. **Stale-client protection (optional, disposable content):** in browser DevTools repeat a disposable Document save request with `editor_features.inline_icons` omitted after the Document contains an icon. Expected: a validation error asks you to reload, with no server-side content/revision change. A current normal save still succeeds.

## Issues fixed during implementation checks

- Explicitly typed the ProseMirror anchor plugin after TypeScript inferred its state as `null` only.
- Removed duplicate intermediate server guards/validation branches during integration review.
- Kept opaque icon source intact during Markdown formatting and normalized direct selections to whole icon boundaries.
- Included editor editability in Markdown widget equality so read-only/active transitions rebuild interactive controls correctly. Nested previews without the picker adapter do not advertise an inactive replacement button.
- Waited for the legacy editor view to initialize before accessing its DOM from the picker adapter.
- Normalized uploaded icon labels by Unicode character, avoided control-regex lint warnings, and included newly uploaded/colon-inserted icons in Recent.

## Stop gate

Stop here for the user's manual review. Fix reported icon issues within this slice; do not begin another product phase automatically.
