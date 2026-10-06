# Database document deletion report

## Scope

Focused database usability update; no next-phase work.

## Implemented

- Table row options now include **Move to Trash**.
- Gallery cards have a separate, keyboard-accessible Trash button outside the document link.
- Both views reuse the existing Radix-based database dialog for confirmation, cancellation, pending state, and validation error display.
- A database-specific authenticated DELETE route checks workspace ownership, visible database ancestry, and direct document membership before calling the existing hierarchy Trash action.
- Successful deletion returns to the database and preserves client view state and scroll position. A success notification confirms the operation.
- Soft deletion retains the document body, structured values, and attachments for the existing workspace Trash restore flow.
- Database behavior documentation updated.

## Libraries

Reviewed Radix Alert Dialog: https://www.radix-ui.com/primitives/docs/components/alert-dialog

It provides confirmation-dialog focus handling and accessibility, but does not implement server deletion, authorization, or asynchronous error handling. The user selected reuse of Orbium's existing Radix Dialog wrapper. No dependency changes.

## Commits

No commit created. Suggested message:

`feat(databases): add recoverable document deletion in table and gallery`

## Migrations / persistent format changes

None. Existing soft deletion and restoration behavior is reused.

## Validation results

- Targeted frontend formatting: PASS.
- `./vendor/bin/pint --test`: PASS.
- PHP syntax checks for DatabaseController and routes/web.php: PASS.
- `npm run types:check`: PASS.
- `npm run lint`: PASS, formatting and lint checks reported no errors or warnings.
- `npm run build`: PASS. Warnings reported for chunks larger than 500 kB and mixed static/dynamic imports in document modules.
- `git diff --check`: PASS.
- Automated tests: neither written nor run, per user instructions.
- Interactive behavior: awaiting user manual validation.

## Manual test checklist

1. Create or use a database with at least two documents. Give one a distinctive title, body text, and property values; save the document and return to Table.
   - Expected: both documents and the saved values appear.
2. Open that row's **…** menu and select **Move to Trash**. Click **Cancel**, then repeat and press Escape.
   - Expected: confirmation names the document; each cancellation leaves it visible and unchanged.
3. Select **Move to Trash** again and confirm.
   - Expected: the confirm button shows a pending state and is disabled during the request; a success notification appears; the row and count update; the database stays open.
4. Switch to Gallery and reload the page.
   - Expected: the trashed document is absent from both views after reload; the other document remains.
5. Open the workspace, open its top controls menu, and select **Trash**. Restore the document, then reopen its database and document.
   - Expected: the document returns to the same database with its body, property values, and any saved cover/files intact.
6. In Gallery, click the card's Trash icon; cancel, then repeat and confirm.
   - Expected: the icon opens confirmation without opening the document; cancellation retains the card; confirmation removes it while Gallery stays selected. Clicking a different card still opens its document.
7. Restore again. Apply a search/filter and sort, then delete a matching document from Table or Gallery.
   - Expected: the current search, filters, sort, and view stay selected; only the chosen document disappears and counts update. Delete the final visible document to check the empty state.
8. Use Tab to reach the Table row options or Gallery Trash button and activate with Enter. Navigate the dialog using Tab; cancel with Escape.
   - Expected: controls are keyboard reachable, focus stays inside confirmation while open, and cancellation does not delete anything.
9. Check Gallery with natural and uniform layouts and cover, body, and no-preview modes.
   - Expected: the Trash button remains visible and usable; titles and properties remain readable.

## Known limitations

This adds recoverable deletion of one document at a time. Permanent document deletion and bulk deletion are outside this change. Manual UI verification remains pending.
