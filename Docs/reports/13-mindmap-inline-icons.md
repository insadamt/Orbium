# Mind Map icon presentation and inline icons — 2026-10-26

The user requested more noticeable branch icons outside the topic text and inline icon support. This is an authorized extension of Mind Map phase-5 review, superseding the earlier exclusion of topic-body icons and small image references. Existing organization tools and separate Document inline-icon work were preserved. No later phase was started; nothing was staged or committed.

## Result

- Decorative branch icons now appear once in a 36 px badge above the topic's left edge, with a 23 px glyph, color tint and short connecting stem. The badge stays visible while editing. Layouts reserve 44 px above icon-bearing topics; bounds, Fit and active-topic reveal include that space, while connectors still attach to the text frame.
- Branch text supports inline emoji, built-in/brand glyphs and custom PNG/JPEG/GIF/WebP icons. Type `/icon` in an empty text block, type `:query` at a word boundary, or use Emoji & icons in the selection toolbar. Colon completions offer direct choices plus Browse all; slash opens the shared full picker.
- The shared picker retains categories, search, skin tones, keyboard grid navigation, preview/favorites, Recent and Library image reuse/upload. Non-emoji glyphs can be clicked or keyboard-activated for replacement and deleted as atomic items. Emoji remain editable Unicode text. Cancelling preserves the original token or selection.
- Paragraphs, headings, list items, quotes and callouts render icons with safe existing text marks. Automatic topic height and independent width continue to apply. Code blocks keep colon/slash text literal; icon insertion is disabled there.
- Custom icon requests use the original Board or Document owner routes. Pending uploads guard navigation, matching tab close and fullscreen close. Failed uploads keep the picker open with an error and preserve accepted content. Existing owner history/autosave, composition and read-only boundaries remain.

## Persistence and references

Graph **7** allows version-1 `inlineIcon` atoms in structured topic bodies. Each has a canonical source/name or positive JavaScript-safe attachment ID, a nonempty control-free label of at most 160 code points and supported marks. Unknown fields, invalid names/sources, code-block atoms and icons in graphs 1–6 are rejected. Topic `text` must exactly project icons to their labels. Existing 500-code-point topic, 64 KiB graph, body nesting/node, ancestry and width limits remain.

Accepted body edits upgrade to 7. Style/layout/width changes retain newer versions. Graph versions 1–6 remain readable and literal until an accepted mutation needs an upgrade. Both legacy full-save clients advertise mindmap capability **7**, retaining inline-icons capability **2**; the existing stored-graph guard protects newer maps. No migration or outer Board/Document envelope change is required. Deploy matching frontend/server and reload open editors.

Attachment discovery includes all topic bodies, including collapsed descendants, in native Boards, Markdown and legacy Documents. Existing workspace image ownership/type validation, Library usage/deletion protection and package asset discovery apply. Native `.orbie` packages with images preserve and remap nested attachment IDs. Markdown remapping changes only parsed Mind Map headers and verifies the resulting complete AST against expected changes; code samples and unrelated metadata remain protected.

Standalone `.orbie` exports and packages omitting an image replace that custom atom with its marked readable label. This preserves the exact text projection without an unresolved source-installation ID. Built-in atoms remain in formatting-preserving transfers. Standard Markdown and Office exports keep the existing complete topic outline, including readable icon labels.

Mind Map picker Recent/Favorites are browser-local and scoped by workspace, separately from the ordinary Document picker's account/workspace preferences. Markdown maps mount a separate React root without the Inertia page context; an explicit preference scope lets them reuse the picker safely. Preferences are not portable document content.

## Actual checks

- `npm run check:fix`: passed formatting and lint.
- `npm run lint`: passed; 848 files correctly formatted, 679 source files with no warnings/errors.
- `npm run types:check`: passed.
- `npm run build`: passed in 16.45 seconds. Existing large-chunk, mixed static/dynamic import and plugin-timing warnings remain. Log: `/tmp/orbium-mindmap-inline-icons-build.log`.
- `vendor/bin/pint --test`: passed for all changed PHP files and the two new Mind Map reference services.
- `php -l`: passed for all 11 changed/new PHP files.
- `git diff --check`: passed, including after this report.
- New source files remain below 500 lines. The inline controller is 259 lines; shared picker 423; writing menu 401; graph document helper 256; map block 348; scene 288.
- No automated tests, Playwright, browser automation or screenshot tooling were written/run. Runtime interaction, appearance and transfer acceptance remain for manual validation.

## Manual checklist

Reload the matching client/server. Use disposable content in a native Board and normal Markdown Document. Repeat save/history/upload checks in hosted Markdown and legacy Documents where available.

1. **External badge:** create a root, four branches and grandchildren. Select Branch appearance, choose a Lucide icon and a brand on different topics, and set inherited/overridden colors. Expect one larger badge above each decorated frame, no duplicate icon within the label and readable contrast. Enter text editing; the badge remains outside the text. Remove a badge and expect its reserved space to disappear.
2. **Layouts and sizing:** mix decorated/undecorated topics, long headings, multiline text and widths 100/180/320/800. Switch Balanced, Right/Left tree, Top-down/Bottom-up, Outline, Brace, Fishbone and both Timeline orientations. Use Fit, zoom and branch search/reveal. Expect badges included in bounds, no clipped badges or topic overlap, and connectors attached to the frame. Repeat in embedded/fullscreen/read-only views, narrow windows and light/dark themes.
3. **Slash insertion:** double-click a topic, create an empty paragraph and type `/icon`; choose Inline icon, then an emoji, Lucide icon and brand in separate attempts. Expect the token replaced at the original caret with a single chosen item and continued text editing. Escape from the picker should preserve `/icon`; finishing text editing should preserve accepted content.
4. **Colon completion:** in ordinary text type `Status :rocket`, then ArrowDown/Up and Enter/Tab. Expect only the colon query replaced and surrounding text retained. Choose Browse all and select from the full picker. Test a query with no matches, Escape, and a colon within a URL/word. Dismissed/literal text must remain editable without an unexpected icon insertion.
5. **Toolbar and marks:** select text and use Emoji & icons; verify the selected range is the insertion/replacement target and cancelling leaves it unchanged. Insert an icon between words, select it with surrounding text, and apply text color, bold/italic, underline and a safe link. Expect saved preview/edit rendering and automatic height to remain correct. Resize the branch afterward; text/icons should wrap without clipping.
6. **Replace/delete:** click a built-in or custom inline glyph, then choose another glyph or emoji. Expect only that atom replaced. Focus a glyph with the keyboard and use Enter/Space to replace it; Backspace/Delete should remove the whole glyph. Undo/Redo must restore exact prior content through the original Board/Document history. Ordinary emoji should behave as Unicode text.
7. **Custom images:** choose Custom, reuse a workspace Library image and upload a small PNG/JPEG/GIF/WebP. Expect correct Board/Document attachment URLs, image-sized inline glyphs and visible Library usage after saving, including if the topic is collapsed. A referenced image must retain existing deletion protection. Try a non-image upload and a failed request: expect a useful error, unchanged accepted map and retry availability.
8. **Upload safeguards:** with a throttled custom upload pending, try Escape, outside click, Done, page navigation, browser reload and closing the owning app tab. Expect the upload/picker to remain protected; closing an unrelated tab must remain possible. On success, expect one insertion at the captured range and normal navigation afterward. On failure, expect no insertion and an error. Confirm the underlying Board/Document does not move or handle picker shortcuts.
9. **Code and text types:** use `/` to create headings, lists, checklist, quote, callout and code. Inline choices should work in ordinary nested text; code-block `/icon` and `:rocket` remain literal and the toolbar icon control is disabled there. Test IME/non-Latin composition and rapid typing; completion must not interrupt composition or drop accepted text.
10. **Save/reopen/history:** add a badge and several inline glyphs/custom images, change layout, resize and collapse a branch; wait for Saved, close and reload. Expect exact bodies, glyphs, image references, labels, colors, order, widths and collapse state in Board, Markdown and legacy owners. Undo/Redo each change; opening/cancelling pickers or searching alone must not add history entries.
11. **Transfers:** export a Document as a native `.orbie` package with images, import into another workspace and open its map. Expect custom images with remapped IDs, built-in atoms/marks and graph layout retained. Export a standalone `.orbie` and a native package with images excluded: expect custom icons replaced by readable marked labels, built-ins retained and no stale custom attachment IDs. Standard Markdown/DOCX/PDF should contain the complete topic outline with icon labels. Repeat with collapsed icons and a directive inside a quote/list where available.
12. **Compatibility and rejection:** open an older graph-1–6 map; preview/open/close must not rewrite it. Edit its body and expect graph 7. Using a copied save request on disposable content, try icons in graph 6, unknown builtin, invalid source/attrs, a non-image or foreign-workspace attachment ID, an atom inside code, mismatched topic text and an unsupported graph version. Expect rejection with the stored revision/content unchanged. For a stored graph-7 legacy map, lower mindmap capability to 6 while omitting the map from a full save: expect a reload rejection and preserved content. Existing graph/text/depth/byte limits should still reject invalid changes.
13. **Read-only and regression:** fullscreen preview/embedded maps show saved badges/inline icons but no insertion tools. Exercise existing drag/reorder, reparenting, search, bulk collapse, branch resize and normal Document inline-icon pickers. Expect accepted data preserved, original owner saves/history, keyboard focus restoration and no duplicate selection border.

## Limitations and commit suggestions

Decorative branch badges use the built-in/brand catalog; emoji/custom images are available inline in topic text. General media blocks, tables, nested diagrams, graphical export and new account archive capabilities are outside this request. Runtime and visual acceptance remain unverified until the manual checklist is completed.

Suggested commits for this follow-up (review alongside the existing uncommitted organization work):

- `feat(mindmap): support inline icons in branch text`
- `feat(mindmap): display branch icons as external badges`

A single combined commit is also reasonable: `feat(mindmap): enhance branch icons and add inline icon support`.
