# Phase 5 review — Multi-ratio covers and Gallery layouts

## Changed

- Cover crop now offers 16:9, 9:16, 3:2, 4:3, 1:1, and 4:5 for documents, folders, and databases. Every new cover opens the crop dialog. The selected ratio is saved with the cover reference and travels with a moved document.
- Opened pages show the saved crop centered and height-limited. Existing covers without ratio metadata retain the wide banner and icon overlap.
- Workspace-root, folder, and database Galleries offer natural masonry or uniform cards. Uniform cards have ratio and whole-image/crop-to-fill controls. Existing Galleries keep their prior fixed preview size until their appearance is edited; new containers default to natural masonry.
- Gallery settings persist on the server. Database settings remain in its Gallery view configuration; explorer settings belong to the workspace root or folder. They affect previews only.

## Library review

The existing crop dialog supports the extra ratios without another dependency. `react-easy-crop` supplies adjustable crop geometry but would still require the existing export and upload flow. React Photo Album expects image dimensions and is less suited to cards containing titles and database properties. Masonic handles variable-height cards but adds virtualization and window-scroll integration that are not needed for the current Gallery sizes and split panes. Orbium uses a focused measured masonry layout. Browser support for `ResizeObserver` is required for that layout.

## Verification

- `./vendor/bin/pint --test` — passed.
- `npm run types:check` — passed.
- `npm run lint` — passed.
- `npm run build` — passed; the existing over-500 kB chunk warning remains.
- `git diff --check` — passed.
- `php artisan route:list --path=gallery` — passed; both explorer Gallery update routes are registered.
- `php artisan migrate:status` — could not connect to the configured local PostgreSQL instance on port 54329. The migration was not applied in this workspace.
- Automated tests were not written or run, as requested. Browser confirmation is pending user manual review.

## Manual checklist

1. Upload a cover on a document, folder, and database. Try each of the six ratios; change ratios during cropping, drag, zoom, use arrow keys, and cancel. Expected: the preview updates, the chosen crop saves, and cancel leaves the old cover unchanged.
   Before this step, start the configured PostgreSQL instance and run `php artisan migrate`.
2. Open each page at desktop and narrow widths. Expected: the full new cover is centered, no stretching or clipping, title and icon remain clear, and tall covers do not dominate the page. Existing wide covers retain their banner layout.
3. Open a workspace-root Gallery and a folder Gallery with mixed cover ratios and missing covers. Switch to Natural and back to Uniform. Try each uniform ratio with Show whole and Crop to fill. Expected: Natural shows full crops in varying card heights; Uniform aligns cards and follows the fit choice; missing covers show type icons.
4. In a database Gallery, repeat the appearance choices with Cover, Content, and None previews, visible properties, filters, and sorts. Expected: the same document set and values remain, and only the preview presentation changes.
5. Refresh and reopen each container, including from another app tab. Expected: its own Gallery appearance persists. Move a covered document between folders or databases; expected: the document's opened cover and ratio stay the same while the destination Gallery controls its preview.
6. Reorder explorer cards by drag and keyboard, open cards, and use item actions in both Gallery layouts. Repeat in a split pane and with a narrow viewport. Expected: all actions remain reachable and masonry cards do not overlap.

## Known limits

- Crop output for GIF input is a still JPEG, matching the existing crop flow.
- Masonry uses measured cards rather than virtualization; very large Galleries may require performance review.
- No browser/manual acceptance result is claimed yet.

## Suggested commits

- `feat(covers): support selectable cover aspect ratios`
- `feat(gallery): add per-container cover layout settings`
