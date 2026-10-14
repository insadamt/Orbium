# Enter and heading formatting repair report

Date: 2026-10-14

Phase: maintenance of the existing document editor during manual review. No next phase started.

## Changes and causes

- Enter previously closed and reopened every inline formatting span at the caret, even at the start or end of its visible text. An empty color span such as `:orbium[]{"color":"preset:blue"}` is rejected by the Markdown parser and appears as literal text. Paragraph splitting now moves boundary markers with their text and only reopens formatting when text remains. This covers ordinary and presentation-wrapped paragraphs/headings, including nested marks and selected text within a formatted span.
- Presentation wrappers used inclusive block replacements to hide their header and closing source. The header replacement also covered line decorations at the body's start, including heading classes and direction/alignment attributes. The body-facing replacement boundaries are now non-inclusive, keeping heading presentation and editor-theme effects available after alignment/direction changes.
- Presented paragraph splitting now declines multiple selections, matching the ordinary writing command's existing single-selection requirement.

## Persistence and commits

No migrations, dependencies, or content-format changes. Existing document content is not rewritten automatically. Previously generated literal empty spans can be deleted manually; this repair prevents creating them through Enter.

No commits created. Suggested commit messages:

- `fix(editor): preserve heading styles and prevent empty spans on Enter`
- `fix(editor): keep formatting boundaries intact when splitting blocks`

## Actual validation

- Formatting: `npm exec -- vp fmt` on the four changed editor source files — PASS.
- `npm run types:check` — PASS.
- `npm run lint` — PASS; 477 files correctly formatted, no warnings or lint errors in 392 files.
- `npm run build` — PASS. Warnings remain for chunks over 500 kB, ineffective dynamic imports, and plugin timings.
- `git diff --check` — PASS.
- A source-parser diagnostic confirmed a colored heading inside an alignment wrapper retains its heading and color-span syntax nodes. This is source inspection, not browser acceptance.
- Automated tests were not written or run, following the user's instructions. Manual browser acceptance remains pending.

Unrelated navigation-file edits appeared in the working tree during this task; they were not changed as part of this repair.

## Manual checklist

Reload Orbium to load the updated editor. Use a disposable Markdown document in Live Preview.

1. Create an H2 containing `02 · Frontend UX`, select its text, and apply the blue text color. Click after the final visible character and press Enter, then type `Next paragraph`.
   - Expected: the heading keeps its size and color; the next block is normal text, with no literal `:orbium[]` or JSON.
2. Repeat Enter at the end of a colored normal paragraph and H1/H3. Repeat with bold, italic, underline, and nested bold plus color.
   - Expected: the preceding text keeps its formatting and the new block contains no empty formatting markers. Enter at the end of a heading creates normal text.
3. Put the caret in the middle of a colored heading or paragraph and press Enter. Repeat at its first visible character and with a selection wholly within its formatted text.
   - Expected: middle splits preserve formatting on the remaining text on both sides; a heading split in the middle keeps both heading portions. A start split creates no empty visible formatting syntax. A selected portion is replaced by the split without losing surrounding text.
4. On H1, H2, and H3 with a saved editor theme/effect, open the six-dot block menu and choose Left, Center, and Right alignment. Then choose RTL, LTR, and Auto direction. Repeat on a blue heading and an Arabic heading.
   - Expected: the requested alignment/direction takes effect, while heading size, theme effects, and inline color remain. Reopening the menu still identifies the original heading level.
5. On a heading with explicit alignment and direction, press Enter at the end and in the middle. Type into the new block.
   - Expected: no wrapper headers, closing directives, or inline JSON appear; completed text stays editable. The existing heading retains its presentation, and the following block keeps the existing alignment/direction inheritance behavior.
6. Undo and redo the split and alignment/direction changes. Wait for Saved, reload, then toggle Source and Live Preview.
   - Expected: Undo/Redo and reload preserve text, heading levels, formatting, alignment, and direction. Source shows canonical Markdown when requested; Live Preview renders it again.

## Stop gate

Remain in editor maintenance and await the user's manual review. No later phase started.
