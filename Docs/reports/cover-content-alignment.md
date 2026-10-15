# Cover and content left-edge alignment

## Change

On `codex/database-portrait-header`, covers now align their left edges with the content below. Document headers use the same centered 780px maximum-width column as properties/editor content. Folder headers start at the same left edge as folder items instead of being centered in a narrower wrapper. Database covers align with Table/Gallery. Height limits, proportions, and existing side/stacked arrangements are retained.

## Validation

- Targeted CSS formatting: passed.
- npm run lint: passed, including repository formatting; no warnings or lint errors.
- npm run types:check: passed.
- npm run build: passed with bundle-size, import, and plugin-timing warnings.
- git diff --check: passed.
- Automated tests: not written or run, per project instructions.
- Browser visual review remains for the user.

## Manual checklist

1. Open a document with a square or landscape cover.
   - Expected: cover left edge aligns vertically with the outer left edge of the properties/editor column below.
2. Open a folder in Grid, List, and Gallery views.
   - Expected: cover left edge aligns with the folder item area in every view.
3. Open a database and switch Table/Gallery.
   - Expected: cover left edge aligns with the data view below.
4. Try panoramic and portrait covers, resize the window, and check a narrow split pane.
   - Expected: covers preserve proportions, stay bounded, and remain aligned with the content edge as layouts change.

## Persistence and commit

No migrations, dependencies, stored-data changes, or commit.

Suggested message: `fix(headers): align cover edges with page content`

## Stop

Code checks complete; awaiting manual review. No phase advancement.
