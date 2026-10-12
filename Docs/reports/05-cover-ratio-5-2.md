# Phase 5 review — 5:2 cover aspect ratio

## Implemented

- Added 5:2 to document, folder, and database cover cropping, exporting at 1200 × 480 pixels.
- Added 5:2 to the shared uniform Gallery ratio choices and server validation for workspace, folder, and database Gallery settings.
- Updated cover documentation. Existing storage supports the new value; no migration is required.

## Validation

- `./vendor/bin/pint --test` — passed.
- `npm run types:check` — passed.
- `npm run lint` — passed, including formatting validation.
- `npm run build` — passed, with large-chunk, ineffective dynamic import, and plugin timing warnings.
- `git diff --check` — passed.
- Automated tests were neither written nor run, per user instructions. Manual acceptance is pending.

## Manual test checklist

1. Open a document, add or replace its cover, and select **5:2**. Expected: the preview becomes wide and the dialog states **1200 × 480 pixels**. Drag and zoom, confirm, then refresh. Expected: the saved crop keeps its 5:2 shape without stretching.
2. Repeat on a folder and a database. Expected: 5:2 is selectable, saves successfully, and remains after refresh.
3. Start replacing an existing cover, select 5:2, then cancel. Expected: the original cover remains unchanged.
4. Open workspace-root, folder, and database Galleries. Set appearance to **Uniform**, choose **5:2**, and try **Show whole** and **Crop to fill**. Expected: previews use 5:2 framing, each fit option works, and the selected appearance persists after refresh.
5. Repeat cropping at a narrow viewport and select an existing ratio such as 16:9. Expected: all seven choices remain reachable and existing ratios still save correctly.

## Commit suggestion

`feat(covers): add 5:2 cover and gallery aspect ratio`

No commit was created. This change stays within Phase 5 review.
