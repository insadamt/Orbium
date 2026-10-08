# Divider toolbar completion report

## Scope and result

Focused correction in the current Markdown editor work. Double-click a divider to
open its dedicated toolbar. Color, thickness, style, theme-default color, and Reset
now apply immediately through normal autosave; there is no Apply button. The toolbar
stays open while changing options. Text formatting excludes horizontal-rule markers,
and the block context menu has no appearance controls.

## Implemented

- Retained compact divider controls, line preview, native color picker, thickness 1–12 px, and illustrated Solid/Dashed/Dotted/Double buttons.
- Each control writes only its changed metadata field, retaining all other choices. Reset removes the three appearance overrides.
- Divider appearance transactions preserve the current tooltip and control focus; repeated edits refresh the block range and source snapshot instead of reusing stale offsets.
- Other content edits, selection changes, and Undo/Redo dismiss the toolbar. Escape, Close, and outside clicks dismiss it without reverting already-applied changes.
- CodeMirror editor tooltips mount at document.body, outside document glass surfaces that can restrict backdrop sampling.
- Shared toolbar surface styling supplies a raised frosted background, blur, readable foreground, and theme-aware solid surface in normal mode. The text-color picker shares the surface styling.
- Text toolbar focus tracking includes its portalled tooltip, so color input interaction can keep it open.
- Main editor and nested rich-text editor integrations retained.
- Updated editor documentation.

## Library decision

The user previously selected the installed CodeMirror library and our own controls.
Reviewed the installed tooltip implementation and its
[official API](https://codemirror.net/docs/ref/#view.tooltips). Body mounting is
supported by the existing library; Orbium still owns appearance controls and metadata
persistence. No new library or infrastructure is needed. Native color-picker
presentation remains browser/OS dependent.

## Persistent format

No new migration or format change in this correction. The previously added optional
`dividerColor`, `dividerThickness`, and `dividerStyle` fields remain validated on
PHP and TypeScript and require a block wrapper around one thematic break. Existing
plain Markdown dividers keep their default appearance. Older application versions
reject these newly supported fields rather than silently dropping them.

## Validation

- Focused frontend formatting/lint: PASS.
- `npm run lint`: PASS.
- `npm run types:check`: PASS.
- `npm run build`: PASS; existing large-chunk and mixed static/dynamic import warnings remain.
- `git diff --check`: PASS.
- PHP formatting passed for the initial metadata implementation; this correction changes no PHP.
- No automated tests written or run, per user instruction.
- Manual browser and appearance acceptance remains pending.

## Manual validation checklist

1. Enable frosted surfaces and open a document containing text and a divider. Select paragraph text. Expected: the formatting toolbar has a visible frosted background and blurred content behind it, with readable buttons. Open its color menu: expected matching surface and usable swatches/custom picker.
2. Double-click the divider. Expected: a frosted Divider toolbar opens, text formatting does not appear, and no Apply button is present.
3. Change color several times, choose thicknesses 2/4/8 px, then choose Dashed/Dotted/Solid. Expected: the document divider and toolbar preview update immediately after every change; the toolbar stays open and preserves the other choices. No jump of editor focus or document scroll.
4. Choose Double and at least 3 px. Expected: two visible lines. Select Theme default color: expected adaptive theme color immediately replaces the custom hex color while thickness/style remain intact.
5. Click Reset. Expected: all three local overrides disappear immediately; the toolbar remains open with default choices. Customize again and close with Escape, Close, or an outside click. Expected: applied values remain. Wait for Saved and reload: expected the last values persist.
6. Change a style once, close the toolbar, then Undo/Redo. Expected: the prior style is restored/reapplied, the line remains a divider, and no colored `---` paragraph appears. Repeat Reset and Undo: expected customization returns.
7. Open the thickness dropdown and select with keyboard. Expected: the portalled dropdown does not prematurely dismiss the toolbar. Use Alt+Enter with the caret in a divider, Tab through controls, and Escape. Expected: toolbar opens, controls are reachable, and Escape returns focus to the editor.
8. In Markdown source mode inspect a customized divider. Expected: one valid `kind=block` wrapper retains the selected appearance fields. Duplicate/move it from the block menu. Expected: styling follows the rule; appearance controls remain absent from that menu.
9. Repeat text/divider toolbar checks in Light/Dark, normal/frosted surfaces, narrow split panes, and near viewport edges. Expected: frosted mode blurs the backdrop; normal mode uses a solid readable card; controls fit the viewport. Scroll while open: expected toolbar position follows its content or clips safely outside the viewport.
10. Repeat with two open documents and a divider inside a callout/table cell's local rich-text editor. Expected: only the intended divider changes and local content persists after save/reload. Normal paragraph selection/color formatting still works.

## Limitations

- Legacy Tiptap documents do not expose these Markdown divider controls.
- Double borders below 3 px cannot show separated lines; the toolbar explains this.
- Closing does not cancel changes because changes now apply immediately; Undo reverses them.
- Account styles may still affect surrounding block geometry.

## Commits

No commit created. Suggestions:

- `fix(editor): restore frosted toolbar surfaces`
- `feat(editor): apply divider appearance changes immediately`

Unrelated existing inline-preview edits were retained. No next phase started.
