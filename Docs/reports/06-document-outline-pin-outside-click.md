# Editor review — Keep pinned TOC open on outside clicks

Date: 2026-10-12. Current editor review; no phase advancement.

## Change

Outside-click dismissal is now enabled only for an expanded, unpinned TOC. Pinning removes the outside-pointer listener; unpinning restores it. Editing the document, clicking blank space or interacting with a neighboring split pane keeps a pinned panel open. Close, Escape and clicking the pinned rail still explicitly dismiss it. Hidden tabs still reset pin state.

Updated the editor documentation to reflect the requested behavior. No commit or push was made.

## Validation

- Targeted `npx vp fmt`: passed.
- `npm run types:check`: passed.
- `npm run lint`: passed; 378 files correctly formatted and 310 linted without warnings/errors.
- `npm run build`: passed in 9.07 seconds with existing chunk-size and ineffective-dynamic-import warnings. Log: `/tmp/orbium-toc-pin-build.log`.
- `git diff --check`: passed.

No automated tests were written or run. Manual interaction verification remains pending.

## Manual checklist

1. Open a document TOC and activate Pin. Click in the editor, type, then click blank space outside the TOC. Expected: the panel remains open and Pin stays active; editing works normally.
2. Select a heading while pinned. Expected: the document navigates and the TOC stays open. Move the pointer away and scroll the document. Expected: the pinned TOC remains open.
3. Unpin, then click outside the TOC. Expected: the panel dismisses. Hover/focus the rail again. Expected: normal preview behavior resumes.
4. Pin again and use Close, then reopen/pin and press Escape with focus inside the TOC. Expected: both explicit actions dismiss the panel. Clicking the pinned rail also collapses it.
5. Split two documents, pin one TOC and click/type/scroll in the other document. Expected: the pinned TOC remains open and the other document stays independently usable.
6. Switch away from the document tab and return. Expected: transient pin state resets as before.

## Suggested commit messages

- `fix(editor): keep pinned TOC open on outside clicks`
- `fix(editor): dismiss only unpinned outlines on outside interaction`
