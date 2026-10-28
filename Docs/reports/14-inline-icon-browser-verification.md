# Inline icon browser investigation — 2026-10-28

## Observed in the app

The user explicitly requested Browser verification after repeated selection failures. Used the Browser plugin against the local app. With the user's approval, recovered access by resetting the local account password; credentials are intentionally omitted from this report. Created the disposable Board **Icon selection browser check — 2026-10-28**, Board 159, without changing the user's existing documents/Boards.

Before the changes in this report:

- Typed `before :icon`. The Inline icons completion appeared with Browse all icons selected. Enter removed `:icon` but no picker appeared, including on a subsequent DOM check. No browser console error was recorded.
- Typed `:rocket`, moved down to the vector result and accepted it. The Board contained `before [rocket] after` with one native `inlineIcon` DOM node and the expected attributes. Saved status appeared, and reopening the saved Board retained the icon/text.
- Ctrl+A selected the words and icon together. The browser selection read `before \uFFFC after`, and the icon acquired the selection decoration. The formatting toolbar remained hidden, leaving no usable text-color control for that range.
- Pointer drag and Home/Shift+End attempts did not produce a native selection. These results are not accepted as a conclusive application diagnosis because ordinary text cursor movement also failed through this Browser connection. Screenshot/native locator calls timed out; direct DOM controls remained usable until the browser view subsequently lost its page attachment.

## Changes awaiting UI retest

- Legacy/native picker setup now observes the editor's `create`/`mount` lifecycle rather than polling animation frames before attaching the icon request listener. This removes a readiness dependency that could leave a recognized command without a picker listener.
- Native Board selection updates and pointer-release/cancellation now position the formatting controls immediately. Resize/camera/scroll updates retain their existing frame scheduling. Pointer completion uses capture phase so an outer event boundary cannot leave the selection gesture active.
- Mind Map selection updates/release similarly measure the toolbar immediately; ordinary transactions/scroll/resize keep scheduled positioning.

These changes address the observed picker/toolbar failures but do not establish successful drag selection, color-menu behavior or Mind Map parity until the browser retest completes. No saved format, migration, backend source or dependency change. Preserve earlier native icon/color/completion/zoom work.

## Actual checks

- Targeted formatting: passed on the three changed source files.
- `npm run lint`: passed; all 860 files formatted, no warnings/errors in 691 linted files.
- `npm run types:check`: passed.
- `npm run build`: passed in 17.13 seconds, with existing large-chunk, ineffective dynamic-import and plugin-timing warnings.
- `git diff --check`: passed.
- No automated test suite or test files were run/added. Browser interaction was explicitly authorized by the user.
- Final browser retest is pending reconnection; do not report this correction as visually verified.

## Manual acceptance / browser retest

1. Reload Board 159, edit its text and type `:icon`. Accept Browse all icons. Expected: full picker opens, choose a vector symbol, no command fragment remains. Repeat `/icon`, toolbar insertion and cancellation.
2. Select `before [rocket] after` by dragging forward and backward, then with Shift+Arrow. Expected: one continuous text/icon selection, no object move or replacement dialog, and the text toolbar appears after release.
3. Choose Red, custom hex and Default. Expected: selected words/vector icon change/reset together while unselected words remain unchanged. Undo/redo, finish, wait for Saved and reload to confirm content/colors.
4. Repeat in Board headings, quote, callout, lists and Document-style table cells, then Mind Map paragraph/heading/list/quote/callout topic editing. Expected: equivalent insertion/selection/toolbar/color behavior, with original owner/history/save boundaries.
5. Repeat icon-only selection, adjacent icons, line-end/wrapped icons, double-click replacement and mixed copy/paste/delete/undo. Check Light/Dark and several canvas zooms. Expected: whole icon identity/marks remain intact and selection decorations clear on deselection.

## Suggested commit

`fix(editor): attach icon pickers on readiness and reveal selection controls`
