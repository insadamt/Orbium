Summary: Records restoration of the existing V3 Document editor onto the Konva branch, including preservation evidence and manual acceptance. Depends on local main at b0095bf, the V3 stage-6 contract and the independent in-progress Board renderer changes.

# V3 Document editor branch integration

Date: 2026-11-01. Authorized by “can you bring the v3 document editor to this branch”. This restores the approved stage-6 implementation; it does not start stage 7 or change the Board migration scope.

## Cause and result

`feat/boards-konva-engine` was created from `origin/main` at `02c64ec`, while local `main` already contained the V3 implementation at `b0095bf`. The checkout therefore still selected format 2 and rejected stored format-3 Documents. The missing implementation existed in Git; it was not a missing dependency or editor feature flag.

Fast-forwarded the current branch to local `main`, retaining the original commits:

| Commit | Existing implementation restored |
|---|---|
| `73a5218` | V3 structure, explicit block IDs/types, owner transactions, editing, columns, matching server/transfer readers and empty-block motion work |
| `a130de5` | Empty-block Ctrl+Backspace and non-text caret fixes |
| `b0095bf` | Unused writing blocks preserved as spacers and empty-formatting cleanup |

The complete incoming difference covers 203 paths. Document creation, normal/Board-hosted editor routing, validation, rich previews, search, statistics, references and native/clean/Office/package transfers now use the same implementation as local `main`.

## Decisions and preservation

- Compared incoming paths with modified, staged and untracked paths before updating Git. There were no overlaps and no staged changes.
- Copied all 36 existing modified/untracked Konva files into `/tmp/orbium-v3-integration-i201w0ts`, with SHA-256 hashes in `manifest.json`. Immediately after integration, all 36 working files matched their backups byte for byte.
- Used `git merge --ff-only main` to retain the actual existing history. No new merge commit, cherry-pick, source reimplementation, stash, reset or branch switch was necessary. No unrelated files were staged, committed or pushed.
- A first merge attempt could not create `.git/ORIG_HEAD.lock` because Git metadata is read-only in the workspace sandbox. Repeating the same authorized command with elevated filesystem permission succeeded.
- Cherry-picking/reimplementing V3 would duplicate existing history or risk an incomplete frontend/server cutover. Stashing was unnecessary because the incoming paths did not overlap the ongoing Board work.
- No database reset, data conversion, migration or historical-file rewrite was performed. Saved format is 3, dialect `orbium-markdown-v3`, with explicit `++block` headers and capability guards. Retired development format-2 Documents remain unsupported, matching the existing V3 contract.

## Validation

Static checks run against the integrated working tree; manual runtime acceptance remains pending. No automated tests, fixtures, browser automation or Playwright were run.

| Check | Actual result |
|---|---|
| Konva backup comparison immediately after fast-forward | PASS: 36/36 byte-identical |
| Imported frontend formatting/lint (`vp check` with incoming frontend paths) | PASS: 131 formatted files; 128 linted files; no warnings/errors |
| `./vendor/bin/pint --test` | PASS |
| `npm run types:check` | PASS, exit 0 |
| `npm run build` | PASS, exit 0; 5,847 modules transformed; built in 94 seconds |
| `npm run lint` | FAIL: formatting issues in 14 existing files outside the incoming V3 difference |
| `git diff --check` | PASS, including the completed integration documentation |

Full lint lists `resources/css/explorer-views.css`, `resources/css/workspace-navigation.css`, Board `board-keyboard.ts`, `board-properties-panel.tsx`, `board-shape-data.ts`, `board-shapes.css`, `board-toolbar.tsx`, `use-board-tools.ts`, editor `columns/columns-widget.ts`, navigation `workspace-navigation-preferences.ts`, `workspace-navigation-settings.tsx`, `workspace-sidebar-tree.tsx`, `workspace-sidebar.tsx`, and `resources/js/layouts/app-layout.tsx`. Broad formatting changes were excluded from this integration.

Logs: `/tmp/orbium-v3-branch-imported-check.log`, `/tmp/orbium-v3-branch-types.log`, `/tmp/orbium-v3-branch-build.log`, `/tmp/orbium-v3-branch-lint.log`, `/tmp/orbium-v3-branch-pint.log`.

Build warnings concern chunks larger than 500 kB, ineffective dynamic imports for the Document editor loader/database property header, and plugin timings. They did not fail compilation. This integration makes no performance claim and leaves bundling changes outside scope.

## Manual checklist

Use a freshly reloaded frontend and matching server; use disposable Documents for edits. Do not reset the database. The comprehensive stage-6 checklist remains in `orbium-v3-stage-6-active-editor.md`.

1. Open an existing saved format-3 Document. Expected: the editor loads without the newer-editor/unsupported-format error; its content remains intact.
2. Create a Document, switch to Source, and record one `++block {"id":...,"type":...}++` header. Type text, wait for Saved, then reload. Expected: format 3 is used, text and ID persist, and Live Preview hides the header.
3. Insert a heading, bullet list, checklist and table next to one another; edit each, undo and redo. Expected: neighboring block types/content remain independent; tables show no tall outer caret while cell editing retains its caret.
4. Add an empty paragraph and leave it; return and type. Delete a separate empty block with Ctrl+Backspace. Expected: unused paragraphs preserve spacing as writable spacers; typing works; explicit deletion removes the intended block and undo restores it.
5. Create two columns, move a block between columns and resize the divider; save/reload. Expected: IDs, content, order and widths persist; undo remains owned by the Document.
6. Open the Document through a Board card and edit/save it there. Expected: the same format-3 Document loads; normal and hosted views reflect the saved content; native Board objects retain their own format.
7. Export a native `.orbie`, then import it into a disposable location; separately export clean Markdown. Expected: native content retains identified blocks; clean Markdown omits structural headers and remains readable.
8. Open the ongoing Board scene in its selected renderer, pan/zoom and edit an object. Expected: existing Board work remains available; no renderer defaults were changed by this integration. Board-engine feature/performance acceptance remains a separate checklist.

## Lessons and follow-up

Check local branches and history before concluding a previously implemented feature is absent. A branch created from a stale remote-tracking ref can omit unpushed local commits even when the feature is already available on local `main`. Base follow-up branches on the intended verified commit. Keep parallel tasks in separate worktrees when they need different Git bases.

Runtime focus, drag, composition, save/reload and performance are not verified by static checks. Remain at V3 stage-6 manual review; do not start stage 7 on the basis of this integration.

Suggested documentation commit: `docs(editor): record V3 integration into Konva branch`.
