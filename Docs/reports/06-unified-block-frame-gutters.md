# Consistent Markdown block frames and handles

Date: 2026-10-30. Implementation committed on main; browser acceptance pending.

## Change

- Reuse the existing `.orbium-markdown-block-layout` CodeMirror BlockWrapper as the measured, shared frame for ordinary Markdown and rich blocks. Apply 0.375rem vertical padding to that wrapper, not external widget margins.
- Remove the inconsistent default vertical margin utilities (`my-4`/`my-5`) from rich widget roots. Preserve each block's internal surface, border and content padding.
- Remove Live Preview heading-specific leading padding so the common wrapper owns the block's outer vertical spacing. Keep heading typography.
- Remove the redundant table root bottom margin; `.orbium-table-frame` still reserves 27px at the bottom for its edge buttons.
- Replace the type-specific descendant-search gutter measurement with the common block wrapper's top and measured padding. Use CodeMirror's coordinates only when a measurable wrapper is absent.
- Preserve document and nested-column scopes, existing drag/drop commands, animations, history, document format, APIs and dependencies.

## Manual acceptance

1. Hover paragraphs, H1–H6, bullet/ordered/check lists, quotes, callouts, code, tables, image/file, math, Mermaid and columns. The grip should always be aligned at a consistent distance below the enclosing block frame's start.
2. Repeat inside two and three columns, including an Arabic or RTL heading, a resized image and a tall rich block. Parent and child gutters must remain separate.
3. Check long documents and custom account editor styles. Caret and hover targeting should not drift after rich blocks, even when scrolling and editing.
4. Test table add-row/column/fullscreen controls, image resize/toolbar, code editor, and toggle/callout controls. None should be clipped or covered by adjacent blocks.
5. Drag blocks above/below and beside other blocks; undo and redo. Ensure the drop indicator, animated snapshot, save and reload all remain correct.
6. Check light/dark, browser zoom 80%/125%, split panes and reduced motion.

## Verification

Source-level exact replacement and invariant checks completed. Runtime TypeScript, lint, build and browser checks remain pending: no project dependency runtime or connected deployment is available in this session.
