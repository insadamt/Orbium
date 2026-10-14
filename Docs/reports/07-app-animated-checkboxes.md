# Animated checkboxes across the app

Phase 7 — UI polish, requested 2026-10-14.

## Implemented

- Shared Radix checkboxes, native checkbox inputs, menu checkbox items and editor task checkboxes now share a 200 ms checkmark reveal. Checkbox hover/press scaling remains subtle; OS reduced motion removes transitions and scaling.
- Converted native controls in wallpaper settings, custom editor styles, style previews, database properties/view settings, and document export options. Existing shared controls cover login Remember me and Trash selection/confirmation. The wallpaper pause and custom-style enable controls now display as animated checkbox boxes.
- Preserved native input change events, form names/values, IDs/labels, controlled/default checked states, disabled states and read-only previews. Trash selection supports an animated indeterminate dash.
- Removed editor text-wave overlays, SVG wave geometry, task text observers, animation-frame scheduling, GSAP checkbox tweens and obsolete Trash indicator CSS. The installed todo example also uses the shared checkbox without a text strike.
- No migrations, document format or archive changes. Existing unrelated working-tree edits were retained. No commit created.

## Validation

- Targeted formatting: PASS.
- `npm run types:check`: PASS.
- `npm run lint`: PASS, no formatting errors or lint warnings/errors.
- `npm run build`: PASS; existing large-chunk and ineffective dynamic-import warnings remain.
- `git diff --check`: PASS.
- Automated tests were neither written nor run. Browser validation is pending the user's manual review.

## Manual test checklist

1. Reload the app, open a document and click a checklist box. Expected: the checkmark reveals in about 200 ms and hover/press gently scales the box. Task text has no wave or added strike. Uncheck/recheck, undo/redo and reload after Saved; expected correct checked state and unchanged text. Repeat in a legacy Tiptap document and a nested rich preview; preview-only checkboxes remain disabled.
2. Open Trash with multiple entries. Select one, select all, then clear all. Expected: partial selection shows a dash, all selection shows a checkmark, and selected counts/actions remain correct. Open a permanent-delete confirmation using disposable data and toggle its required acknowledgement; expected its action remains gated. Cancel afterward.
3. Open a database with a Checkbox property. Toggle it, wait for save and reload. Expected: animation and persisted value, with busy controls disabled. Toggle the checkbox in database view settings and save; expected the preference persists.
4. In Appearance, toggle Pause animated wallpapers and wallpaper boolean options. In Editor styles, toggle Custom styles. Expected: animated boxes and unchanged preference behavior. The completed checklist style preview stays checked and read-only.
5. Open document Export and toggle package inclusion choices and office page numbers. Expected: checkbox animation, unchanged inclusion/counts and correct page-number setting. Disabled choices remain noninteractive.
6. Open a menu with checkbox choices, such as a database multi-select picker. Toggle choices with mouse and keyboard. Expected: animated boxed indicators and correct independent selection; labels have no strike.
7. On the login page, click Remember me, then its label. Use Tab and Space on checkbox controls throughout the app. Expected: one toggle per activation, preserved labels and form behavior. Verify light/dark themes and split panes.
8. Enable OS reduced motion and repeat checkbox toggles and hover/press. Expected: immediate state changes with no scaling; checkmarks/dashes remain visible and controls work normally.

## Commit suggestion and review boundary

Suggested commit: `feat(ui): unify animated checkboxes without text strikethroughs`.

Remain in Phase 7; manual acceptance is pending. No later phase was started.
