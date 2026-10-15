# Document properties collapsed by default

Changed the database document Properties section's initial state to collapsed. The existing Properties toggle, accessible expanded state, and inline editing remain available. Opening the section and saving a value keeps it expanded during the current document session. Reloading starts collapsed again.

## Validation

Formatting, frontend TypeScript, lint, production build, and diff whitespace checks passed. Build retains import overlap, large chunk, and plugin timing warnings.

## Manual checklist

1. Open a database document from Table and then another from Gallery.
   Expected: Properties starts collapsed; document content remains visible.
2. Click Properties, edit a value, and wait for saving.
   Expected: fields expand, the value saves, and the section stays expanded.
3. Collapse the section and use Tab plus Enter/Space to expand it again.
   Expected: toggle works with pointer and keyboard and reports the correct expanded state.
4. Reload the document.
   Expected: Properties starts collapsed and the edited value is retained when expanded.

No automated tests written or run, as instructed. Manual browser review remains pending.

Suggested commit: `fix(documents): collapse database properties by default`
