Summary: Records the user-requested writable empty-block amendment and manual acceptance checklist; depends on the stage-6 spacer widgets, native input composition, checked owner history and Markdown paste normalization.

# Writable empty blocks — 2026-11-01

The user explicitly requested “make empty block can be write in it”. This supersedes the earlier request for non-editable spacing and the corresponding manual expectations in the spacer and Enter/blink reports. This work remains within stage-6 review.

## Changes

Previously, spacer widgets prevented paste and swallowed printable keys. Native editor input and clipboard handlers also explicitly ignored a single spacer. These three entry points now accept writing.

- Every live spacer has a transparent native textarea, a text cursor and an accessible writing label. It has no visible placeholder, so repeated Enter still creates blank spacing rather than repeated writing hints.
- Clicking or focusing a spacer does not change saved content. Leaving without typing preserves its blank row instead of creating an abandoned empty paragraph that cleanup would remove.
- First ordinary text promotes the same identified block to a paragraph through a checked owner operation. Focus and the caret move to normal text editing. A first `#` or `>` remains a paragraph draft so the established space-triggered Markdown shortcuts can run normally. Typing `/` opens normal completion after the focus handoff.
- Browser-composed input remains in the native input until composition ends; the owner write then publishes committed text. No composing DOM is replaced partway through a composition session.
- Plain-text paste uses the existing Markdown normalizer. Ordinary paragraph text keeps the spacer ID; structured Markdown or multiple paragraphs uses checked block paste and its normal new identities. Text pasted into the native input uses its plain-text representation, not private clipboard metadata.
- Native editor typing/paste into a single spacer no longer silently disappears. Existing multi-block selection and native clipboard resolution retain their established paths. Shift-click still selects a block range, and the focus helper does not collapse that range into a spacer input.
- Enter in a still-empty spacer inserts a writing paragraph after it. Backspace/Delete removes the empty spacer through owner history. These actions and text promotion bypass block-motion masking.
- Input admission checks current editability/read-only state. Existing owner availability, column ownership, source validation and composition guards still apply. Rejected text stays in its input with browser validation feedback so it can be copied or retried. This is a local input draft, not a new persistent draft store; do not assume it survives widget destruction/navigation.

Persisted spacers remain whitespace-only. No schema, backend, capability, dependency or migration changes were required. Read-only previews still render blank space. Prior uncommitted work was preserved; no staging or commits were performed.

## Checks

- Changed-file formatting/lint: passed for the four changed/new TypeScript files.
- `npm run types:check`: passed.
- `npm run build`: passed, with existing large-chunk, mixed-import and plugin-timing warnings.
- `npm run lint`: blocked by the same 17 existing formatting failures listed in the earlier stability repair report. No unrelated formatting changes were made.
- `git diff --check` and changed-file summary/size/whitespace review: passed. The four source files remain below 500 lines and include top summaries.
- No PHP files changed, so PHP checks were not repeated.
- No automated tests, fixture execution, Playwright, browser automation or interactive editor verification was performed. Manual results below remain unchecked.

## Manual checklist

Reload the updated application and use a disposable V3 Document.

- [ ] **Write in blank space:** Type `Before`, press Enter several times, and type `After`. Click one intermediate blank row and type `Middle`, continuing immediately with more characters. Expect visible text in that row, a caret after the text, and no missing/duplicated first character or structural-boundary error. In Source, verify that ordinary text changed that spacer's type to `paragraph` while retaining its ID.
- [ ] **Untouched blank space:** Click another blank row and then another block without typing. Expect the blank row and its `spacer` identity to remain. Repeat after saving and reloading. Untouched rows must have no repeated “Write, or press /” hints.
- [ ] **Paste:** Paste `Hello world` into a blank row. Expect one writable paragraph with the original ID and its caret at the end. In another blank row paste `# Title`, then two paragraphs separated by a blank line. Expect checked heading/paragraph blocks, correct order and no text hidden in spacer bodies. Type again immediately after each paste.
- [ ] **Shortcuts:** In separate blank rows, type `/`, `#` followed by Space, and `>` followed by Space. Expect the slash menu, heading shortcut and quote shortcut respectively, with usable normal editing afterward.
- [ ] **Composition:** Use a real IME to enter and confirm a multi-character word in a blank row. Expect candidates and composition to remain visible until confirmation, then one committed copy with its caret at the end. Cancel another composition; untouched spacing must remain. Repeat in a column.
- [ ] **Keyboard/history:** In a blank row press Enter, then type. Expect a writing paragraph after the row. Delete another blank spacer with Backspace/Delete; undo and redo. Undo a first text promotion; expect the blank spacer to return, then redo to restore the text. Existing blocks must stay visible without an Enter/promotion fade.
- [ ] **Selection:** Shift-click handles across a blank row. Expect a consecutive block range. Copy, paste elsewhere, delete and undo it; the range must not collapse merely because a spacer is selected. A normal click inside a spacer must return to single-row writing.
- [ ] **Scopes and persistence:** Repeat writing and paste inside a column and a Board-hosted Document. Expect content in the selected column/document, stable caret focus, Saved status and the same text after reload. Hosted read-only previews should show the text where the spacer was promoted.
- [ ] **Read-only:** Open a read-only surface, or change permission while a blank row is focused. Expect typing/paste not to change saved content. Read-only previews should retain untouched blank spacing.

## Commit message suggestions

- `feat(editor): allow typing in empty spacer blocks`
- `fix(editor): promote blank spacing into writable content`

No commits were created. Remain at stage-6 manual review.
