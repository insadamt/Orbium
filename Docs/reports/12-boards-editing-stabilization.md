# Boards — Editing stabilization

2026-10-19. Current phase-4 review. The user reported widespread glitches, stopped review, then authorized repairs with “can we fix it”. This pass repairs concrete failures and records the limits of verification; it does not claim that every reported glitch is resolved.

## Reproduced failures and repairs

| Finding | Evidence and repair |
|---|---|
| Finishing code editing can blank the Board | Reproduced in disposable Board 153: create code, enter source, type `const answer = 42;`, then finish. Browser logged `NotFoundError: Failed to execute 'removeChild' on 'Node'`. `mountCodeLanguageSelect` calls `select.replaceWith(host)` on a select rendered by React; React then tries to remove its missing select. Board code now renders the shared React `AppSelect` directly. The Document widget's imperative adapter remains unchanged. |
| Choosing a code language ends editing before applying the choice | Observed the editor return to Plain text preview instead of retaining the chosen TypeScript value. React portal events bubble through their component ancestry into the Board canvas even when their DOM is outside it. Pointer, keyboard, tool-keyboard, source-shortcut and object double-click routing now check DOM ownership before acting. TypeScript selection remained active and persisted after this repair. |
| Edit entry can leave keyboard focus on the canvas | The browser session exposed an active native editor while `document.activeElement` was still the canvas. Native entry previously queued a frame and then called Tiptap's `focus`, which queues another frame. Native selection and focus now occur during layout, and technical source fields no longer add an extra focus frame. The final native click-to-edit check reported `Board text` as the active element. |

## Additional source-backed corrections

- Native typing no longer compares and potentially replaces complete editor content on every reflected data prop. A transient reset version identifies deliberate undo/redo, reload/reset and writing conversions. Normal typing stays owned by the editor. Explicit external resets retain both selection ends where possible, rather than collapsing to the start of the previous selection.
- Native extensions are initialized once per block editor session. Type changes retain the existing keyed remount, so list and paragraph schemas remain separate.
- Finishing editing clears the shared pointer location. Table editing without a clicked point starts at the first cell instead of the last one.
- Link editing retains a selection bookmark while the address field owns focus. Formatting toolbar pointer-down preserves the selection for pointer input as well as mouse input.
- Slash-command acceptance resolves the live query at keydown instead of trusting possibly stale React menu state. `/h1`–`/h3` shorthand works. Escape is handled by the native editor/menu before the canvas; composition and AltGraph guard conversions.
- Ctrl/Cmd+Enter finishes source editing before the code input keymap can insert its own line. Popup keyboard events stay with their popup.
- Inactive block controls become read-only during uploads or linked-resource locks. The active owning editor keeps its existing operation-specific protections.

The early investigation also examined table Enter interception. The current contract intentionally retains line breaks inside native table cells; exercised row insertion/undo worked, so that behavior was not changed.

## Browser inspection performed

Used the in-app browser against `http://127.0.0.1:8000`. Created disposable **Board repair review — 18 Oct**, Board 153, through the visible workspace UI. Existing user Board/document content was not edited. The disposable Board remains available for review at `http://127.0.0.1:8000/workspaces/1/boards/153`.

| Interactive sequence | Observed result |
|---|---|
| Select native text and apply Bold | Mark appeared on the selected text. |
| Select text, open link popover, enter `https://example.com`, Apply | The original `alpha beta` text remained intact and received the link. |
| `/check` → Checklist; type an item; Enter | Checklist conversion and item splitting worked in the exercised sequence. |
| Click a table cell; add a row; Undo | Table went from three rows to four and back to three, retained `Last`, and kept the table editor active. |
| `/h2`; Escape; Escape | First Escape dismissed the menu and retained `/h2` in the active editor. Second Escape finished editing. |
| Reopen `/h2`; Enter; Undo | Heading conversion focused the heading editor. Undo restored Text containing literal `/h2`. |
| Open code; choose TypeScript; Ctrl+Enter | After the ownership/event repairs, the Board remained rendered with its TypeScript code preview. |
| Reload the Board | Checklist, table, text and code source/language remained present. |
| Final native writing activation | The text editor was present and `document.activeElement` identified `Board text`. |

Browser logs retained the earlier reproduced `removeChild` exception and a development hot-refresh Hook-order error after editing a custom Hook's layout. A full reload restored the development page; those retained messages were not presented as newly occurring errors after the final source finish sequence.

Browser control intermittently timed out during locator interactions/screenshots, and animated menus could retain their exit layer while the inspection view was hidden. Native browser controls and a visible inspection view completed the code-picker sequence. These control failures are separate from the reproduced application exception.

**Not certified:** Home/Arrow caret navigation and zoom settling were inconclusive in the remote session. Real keyboard caret placement, camera behavior, mobile/touch, IME, upload/resource-lock concurrency, all media types and conflict recovery still need manual acceptance. No complete Board quality claim is made from the exercised sequences.

## Checks and scope

| Check | Actual result |
|---|---|
| Targeted `vp fmt` | Passed for touched source files |
| `npm run types:check` | Passed, exit 0 |
| `npm run lint` | Passed, exit 0; 636 files formatted, 533 files without warnings/errors |
| `npm run build` | Passed, exit 0; 71.1s |
| `git diff --check` plus whitespace inspection of touched untracked Board sources/docs | Passed |
| Changed source size | All touched Board source files remain below 500 lines; canvas 487, pointer hook 472 |

Build retains existing mixed static/dynamic-import, large-chunk and plugin-timing notices. Logs: `/tmp/orbium-board-repair-types.log`, `/tmp/orbium-board-repair-lint.log`, `/tmp/orbium-board-repair-build.log`.

No automated tests were written or run. Browser work consisted of interactive UI inspection, not an automated test suite. PHP/migration checks do not apply. No API, persistence schema, dependency or content format changed. Existing unrelated working-tree changes were preserved. No commits were created and no later phase started.

## Short manual review — start here

1. **Code stability:** reload, open a disposable Board, insert Code, change its language, type and finish with Done and Ctrl/Cmd+Enter. Re-enter twice and reload after Saved. Expected: no blank Board, language/source persist and controls remain usable.
2. **Writing focus:** click writing and type immediately; click the beginning/middle of a sentence, then try Home/End, arrows and Shift-selection. Open formatting and edit a link. Expected: typing reaches the intended caret, selection does not jump and popup actions do not exit the editor.
3. **Commands/history:** type `/h2`, accept with Enter, type a title and undo/redo. Repeat with a checklist and a table row action. Expected: content/type restore together; one Escape dismisses a menu and the next finishes editing.

## Remaining manual checks

4. **Canvas ownership:** drag inactive content, resize, pan/zoom and Shift-select. Open a popup, use its arrows/search and select an option. Expected: popup events do not move/create/select underlying canvas objects; camera and selection settle correctly.
5. **Locks:** while a native upload or dirty linked Document owns an operation, try toggling an inactive checklist or entering another editor. Expected: unrelated content is protected while the active owner can complete its operation.
6. **Composition/touch:** type with an IME and use a touch keyboard. Expected: composition is not interrupted by conversion/history/finish commands; toolbar interactions preserve the intended selection.
7. **Persistence/recovery:** wait for Saved and reload; exercise the existing conflict/recovery review separately. Expected: authored content and layout survive and protected drafts remain recoverable.

## Commit suggestions

- `fix(boards): prevent code picker unmount crash`
- `fix(boards): isolate popup events and stabilize editor focus`

Stop for manual review. The short checklist and remaining inconclusive cases must be reviewed before calling Board editing accepted.
