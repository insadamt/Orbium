# Editor review — Block handle alignment

Date: 2026-10-15. Status: implemented; manual acceptance pending.

## Findings and changes

The Markdown block element resolver returned the first child of a layout wrapper.
An explicit center/right alignment or direction choice can add a presentation
wrapper whose first child is a hidden metadata replacement. Measuring that child
placed the Plus and six-dot controls against hidden source geometry instead of
the visible paragraph or heading.

The shared resolver now retains the complete layout wrapper and handles both
element and text nodes returned by CodeMirror. Control positioning searches for
the first visible anchor or text line inside it. This covers alignment and explicit
direction wrappers, heading padding, and hidden rich-block anchors. Line borders
and the editor root border are included in positioning, with the same origin used
for handle animation. Existing scale conversion remains in place.

Drag feedback and drop targeting use this same block resolver, so their bounds
now include the complete wrapper rather than its first child. Existing working
tree changes were preserved. This remains within the current editor review;
no next phase, persistence changes, new dependencies, commits, or pushes.

## Actual validation

- Targeted `npx vp fmt`: passed for both changed source files.
- `npm run lint`: passed; 478 files correctly formatted, 393 files linted,
  no warnings or errors.
- `npm run types:check`: passed.
- `npm run build`: passed in 11.93 seconds; large-chunk, mixed static/dynamic
  import, and plugin timing warnings remain.
- `git diff --check`: passed.
- No automated tests were written or run, as instructed.
- Browser behavior has not been verified. PHP checks do not apply to this change.

## Manual test checklist

1. Reload and open a Markdown document in Live Preview. Create a paragraph and
   heading, then use each block menu to select Center, Right, and Left in turn.
   Expected: Plus and the six dots stay vertically centered on the visible first
   text line, including the heading's top padding.
2. Set those blocks to RTL, LTR, then Auto, with center/right alignment. Add a
   paragraph long enough to wrap. Expected: controls align with the first visible
   line; no jump to a hidden header or closing directive.
3. Use an existing editor theme with paragraph/heading padding and borders;
   repeat step 1. Expected: controls account for the styled text's position.
4. Hover a list, quote, code block, table, math block, and Mermaid block. Switch
   rich blocks between editing and preview. Expected: controls use a visible
   toolbar, first table row, or first text line rather than a hidden anchor.
5. Click the six dots on a centered block and duplicate it; undo. Drag the block
   above and below another block, then undo/redo. Expected: only the intended
   complete block moves or duplicates; drop feedback spans its visible bounds.
6. Scroll, resize, repeat at 80% and 125% zoom, and check both split panes.
   Expected: controls keep their vertical alignment in the correct document.
   Wait for Saved and reload; expected: alignment and content persist.

## Commit suggestion

`fix(editor): anchor block handles to visible content inside presentation wrappers`
