# Mermaid source editor padding correction

Date: 2026-10-16. Current editor review; no phase advancement.

## Fix

The shared source controls exposed their initial textarea as a fixed object property. Mermaid and display math replace that textarea using `useContentEditor`, so the rich-card styling attached its padding class to the detached original input. Expose the current input through a getter instead. The visible Mermaid/math source textarea now receives the existing 16px padding, inset width/margins, and rounded corners.

No CSS specificity override, dependency, migration, content-format, or archive change.

Suggested commit: `fix(editor): style the active rich source editor`

## Manual test checklist

1. Reload a format-2 document, open a Mermaid block's Edit action, and click the first source line. Expected: text and caret have 16px space on all sides inside the source textarea.
2. Type multiple lines, select text, and switch to Preview and back. Expected: editing works, padding remains, and the updated diagram renders. Save/reload and confirm the source persists.
3. Open display math's Edit action. Expected: its replacement source textarea also has the same padding; edit/preview and undo/redo continue to work.
4. Repeat in Light/Dark themes and a narrow pane. Expected: the textarea stays within its card with usable scrolling and no horizontal document overflow.

Browser appearance remains subject to manual acceptance. No automated tests were written or run, as instructed.

## Actual validation

- Formatting: passed for the changed source file.
- `npm run lint`: passed; 541 files correctly formatted, 448 files linted with no warnings/errors.
- `npm run types:check`: passed.
- `npm run build`: passed in 13.21s; existing dynamic-import, chunk-size, and plugin-timing warnings remain.
- `git diff --check`: passed.
