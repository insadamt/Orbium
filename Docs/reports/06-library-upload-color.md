# Library Upload button contrast

Date: 2026-10-13. User-requested Library appearance refinement; no phase advancement.

## Implemented

- Added a dedicated monochrome Upload button style to the Library toolbar, empty-state Upload a file button, and reuse picker Upload a new image/file buttons.
- Light appearance uses near-black with white text. Dark appearance uses off-white with near-black text. Hover and keyboard focus use a distinct gray shade; heavier labels make Upload easier to identify.
- Existing disabled states remain available. No dependencies, migrations, or persistent data changes. No commits created.

## Validation

- `npm run types:check`: passed.
- `npm run lint`: passed formatting and lint checks.
- `npm run build`: passed with existing large-chunk and ineffective-dynamic-import warnings.
- `git diff --check`: passed.
- No automated tests written or run. Manual visual acceptance remains pending.

## Manual checklist

1. Open Library in Light, then Dark appearance. Expected: Upload stands out in monochrome with readable text and icon.
2. Hover Upload and focus it with Tab. Expected: its gray shade changes while text remains readable.
3. Open a workspace without uploads. Expected: Upload a file uses the same monochrome style.
4. Run `/image` and `/file`. Expected: Upload a new image/file uses the monochrome style; clicking it still opens the file chooser.
5. Check Normal/Frosted surfaces with an image background. Expected: Upload retains its solid, visible monochrome surface. Start an upload: the toolbar action becomes visibly disabled until the upload completes.

## Commit suggestion

`style(library): emphasize upload actions with monochrome contrast`
