# Editor review — Remove raw source from table sorting menu

Date: 2026-10-12. Focused fix within the current editor review.

Removed the column menu title that displayed raw header Markdown and Orbium color metadata. The menu now contains only Sort ascending and Sort descending. Header formatting, stored content, and sorting behavior are unchanged. No commit created.

## Validation

- `npm run lint`: passed, including formatting; no warnings or errors.
- `npm run types:check`: passed.
- `npm run build`: passed; chunk-size and mixed static/dynamic import warnings remain.
- `git diff --check`: passed.
- No automated tests written or run. Manual verification remains pending.

## Manual test checklist

1. Reload the document shown in the screenshot and open the Marque column menu. Expected: only Sort ascending and Sort descending; no Markdown or color metadata above them.
2. Dismiss the menu. Expected: Marque retains its existing red color and bold formatting.
3. Sort ascending, then descending. Expected: complete body rows reorder together; the header stays fixed. Undo, wait for Saved, and reload. Expected: the restored content and header formatting persist.

## Suggested commit

`fix(editor): remove raw markdown title from table sorting menu`

Remain in the current editor review; do not start another phase.
