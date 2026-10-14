# Animated menu stability correction

Phase 7 review — 2026-10-14.

## Changes

- Replaced per-item shared-layout highlight crossfades with one persistent hover bar per menu. Its position and size animate directly; it does not unmount, change animation ownership, or fade out when movement settles.
- Shared that hover-bar implementation across action dropdowns, submenus, selects, table property/axis menus and slash/mention suggestions. Old row hover/selection backgrounds are suppressed so they cannot paint a second highlight.
- Removed the globally shared radio-dot animation ID. Radio and checkbox choices use a static checkmark with reserved space; Trash no longer renders duplicate indicators.
- Changed controlled menu state to read the supplied value immediately, avoiding a second state mirror and delayed opening/closing.
- Slash suggestions now use the shared surface dimensions, action icons and moving bar. A CodeMirror tooltip adapter locates each editor's tooltip through its own API, including body-portaled tooltips, and removes its handlers when the tooltip/editor closes. Pointer hover updates the actual completion selection, so Enter accepts the highlighted option.
- The DOM select adapter now replaces the native control with the shared React dropdown rather than keeping a hidden native select in the rendered tree. Code-language and table-alignment controls retain their existing value/write handlers.
- Highlight measurements compensate for entrance scale, scrolling and nested clipped lists. Each menu retains independent state; reduced motion applies position changes immediately.

No migrations, persisted format changes or commits. Existing unrelated explorer changes remain intact.

## Validation

- `npm run types:check`: PASS.
- `npm run build`: PASS (12.38 seconds), with bundle-size, mixed-import and plugin-timing warnings.
- `git diff --check`: PASS.
- `npm run lint`: final full-project run reports formatting issues in concurrently added, unrelated files: `components/animate-ui/components/community/playful-todolist.tsx`, `components/animate-ui/primitives/radix/checkbox.tsx`, `hooks/use-controlled-state.tsx`, and `lib/get-strict-context.tsx`. These root-level files were left untouched.
- Scoped formatting/lint check over the changed menu files: PASS, 42 files formatted correctly and 39 files linted without warnings/errors. The broader application-source check also caught the concurrently moved to-do/checkbox files.
- No automated tests written or run, as instructed. Browser visual acceptance remains pending.

## Manual checklist

1. Hard reload, then open a workspace/account dropdown. Move between rows slowly and quickly, pausing for a full second after each move. Expected: one hover bar moves and stays visible after settling; no blink, duplicate background or text flash.
2. Open an editor block context menu, enter Text alignment and Text direction, and choose values. Reopen them, then open another select elsewhere. Expected: one static check marks the current value; no dot travels between menus, no duplicate mark and no extra open/close frame. Parent submenu highlighting stays stable.
3. In a database Table, open a Select property, hover options, filter the list, select/clear a value and reopen it. Repeat with Multi-select and create a new option. Expected: the same moving highlight as other menus; scroll/filter changes do not leave a bar over the search field/footer; values save and Multi-select remains open where intended.
4. Open editor table row/column menus, move between their actions, and apply a safe sort or move on a disposable table. Expected: shared hover motion, no settling blink, correct row/column behavior and disabled boundary actions. Check any available table-alignment selector too.
5. Type `/` on a blank line. Hover Heading, Code, Table and other choices, pause after moving, then press Enter. Reopen, filter by typing and navigate with arrows/Enter/Tab/Escape. Expected: shared frosted menu, icons and a moving hover bar; the highlighted command inserts once; filtering and long-list scrolling remain usable without stealing editor focus.
6. Type a mention and repeat pointer/keyboard selection. Open slash menus in separate document panes/tabs. Expected: each editor owns its menu, selection and highlight; no cross-pane animation or orphan popup.
7. Open a code-language selector, choose a language, reopen and scroll its options. Check shared selects in Export, Library and view settings. Expected: the shared dropdown appears throughout, one current-value check is visible, and no browser-native popup appears.
8. Repeat in light/dark and reduced motion. Scroll a long dropdown and open a menu near the viewport edge. Expected: readable surfaces, correctly clipped highlight, no selection-dot animation, and immediate highlight positioning with reduced motion.

## Commit suggestions

- `fix(ui): stabilize menu highlights and selection indicators`
- `fix(editor): unify slash and table menu interactions`
