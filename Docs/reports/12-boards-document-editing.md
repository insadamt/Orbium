# Boards — Document-like editing

2026-10-18. Current phase-4 review. The user requested easier editing like Documents after approving Document-style presentation without six-dot handles.

## Implemented

- **Click to write:** an unmodified click/tap on native text, headings, quotes, callouts, lists or tables enters editing at the clicked location. Activation waits for pointer release; moving beyond the existing six-screen-pixel threshold continues to drag the object. Hand, middle-button/Space panning, pinch, resize and multi-selection keep their own behavior. Interactive links, checkboxes and players keep their direct actions.
- **Nearby formatting:** selecting native text shows the existing Board formatting/link controls in a Document-styled toolbar beside the selection. It is portaled outside the transformed canvas and follows camera, scrolling, resizing and visual-viewport changes. Structural list/table controls remain in the contextual lane. Ctrl/Cmd+K opens link editing at a selection or caret; existing mark keyboard shortcuts remain available.
- **Writing menu:** type `/` in otherwise empty Text/Heading/Quote/Callout content to filter native Text, H1/H2/H3, bullet list, numbered list, checklist, Quote and Callout commands. Arrow keys choose, Enter applies, Escape dismisses the menu first, and outside pointer actions dismiss it. Keyboard selection scrolls the menu internally when needed.
- **Typing shortcuts:** from plain Text, `#`, `##`, `###`, `-`, `*`, `+`, `1.`, `>`, `[]` and `[ ]` followed by Space convert the object. Ctrl/Cmd+Alt+0–3 changes writing/heading styles while preserving inline content. Backspace on an empty Heading/Quote/Callout returns it to Text.
- **Validated conversion:** writing commands replace native type/data through the existing validated snapshot commit and shared Board undo history. Object ID, position, width and original-resource ownership stay intact. Native editors remount when block kind changes so list and paragraph schemas do not become mixed. Existing text-height measurement adapts after conversion. Read-only and composition states prevent command application.
- **Focused technical editing:** Math/Diagram switch from preview to a focused source field while editing, then return to preview on Done. Code retains its shared input. Ctrl/Cmd+Enter finishes native editing; Escape continues to use the existing innermost-action behavior and upload/composition protections.
- Updated Board help/accessible hints and documentation. Extracted content callbacks, popover anchoring, writing commands and click activation by responsibility; moved gesture types and pinch geometry out of the pointer hook to keep source files below 500 lines.

## Scope and limitations

This adds familiar Document editing interactions to the existing independent typed Board blocks. It does not embed arbitrary Document fragments or restore six-dot gutters. The writing menu converts the current object; it does not insert nested blocks or create Documents. It intentionally offers the supported writing types rather than Document-only commands.

Native Text/Heading/Quote/Callout and table-cell Enter behavior remains a line break within that spatial object; lists retain their established item splitting/indenting behavior. Rich HTML paste still uses the existing plain-text insertion path. Source/media/resource entry remains explicit through their existing double-click/Edit actions. To select text by dragging, first click to enter editing; an initial drag on inactive content still moves the object.

This is frontend-only: no API, backend, dependency, migration, persisted format or default-geometry changes. Existing unrelated uncommitted work was preserved. No commits were created and no later phase started.

## Actual validation

| Check | Result |
|---|---|
| Targeted `vp fmt` | Passed for changed/new source files |
| `npm run types:check` | Passed, exit 0 |
| `npm run lint` | Passed, exit 0: 636 formatted files, 533 files without warnings/errors |
| `npm run build` | Passed, exit 0; built in 10.55s |
| `git diff --check` and explicit whitespace inspection of touched untracked Board files/docs | Passed |
| Source size | Changed/new Board sources stay below 500 lines; canvas 480, pointer hook 468, native editor 338 |

The build retains the previously recorded mixed static/dynamic import, chunk-size and plugin-timing notices. Logs: `/tmp/orbium-board-editing-types.log`, `/tmp/orbium-board-editing-lint.log`, `/tmp/orbium-board-editing-build.log`.

No automated tests were written or run. Live browser interaction and visual acceptance remain pending. PHP/migration checks do not apply.

## Exact manual checklist

Use a disposable **Board editing review** Board. Start at 100% zoom with Select active.

1. **Click/caret:** create a paragraph, heading, quote, callout, list and small table. Finish editing, then click in the middle of each object's text. Expected: one click opens editing near that text/cell; typing changes the intended content. No six-dot handle appears.
2. **Drag separation:** finish editing, drag an inactive writing object beyond six screen pixels, then release. Expected: it moves and remains selected without entering editing. Shift-click two objects and drag the selection; repeat with Hand, Space, middle-button pan, resize handles and touch pinch. Expected: those actions keep their original meaning. A plain click after returning to a single selection edits it.
3. **Formatting:** click into a paragraph and drag to select a word. Expected: formatting appears beside that selection. Apply bold, italic, underline and inline code, then undo. Expected: the selection is preserved and content/history update correctly. Collapsing the selection hides the formatting toolbar.
4. **Links:** select text and press Ctrl/Cmd+K, enter `https://example.com` and Apply. Repeat at an empty caret, remove an existing link and try an unsafe address such as `javascript:alert(1)`. Expected: the popover remains reachable and correctly anchored; valid links work, unsafe input shows validation feedback and text is preserved.
5. **Slash commands:** in an empty Text block type `/`, use arrows and Enter to choose Heading 2. Type a title. Repeat in a new Text block with `/check` and choose Checklist. Expected: the same object changes type, focus remains ready for writing and checklist Enter/Tab behavior still works. Try Quote/Callout and the remaining menu types.
6. **Menu dismissal:** type `/` in empty writing and press Escape once. Expected: the menu closes, the slash stays literal and editing continues. Press Escape again: editing finishes. Re-enter, filter to no results, erase the query and click outside. Expected: the menu closes/updates predictably without losing content.
7. **Markdown shortcuts:** create separate Text blocks and type `# `, `## `, `### `, `- `, `1. `, `> ` and `[] `. Expected: each marker converts into the intended native type and does not remain as visible content. Ordinary prose containing these characters away from the marker position remains literal. In an empty heading/quote/callout, press Backspace: it becomes Text.
8. **Conversion/history:** write formatted text, use Ctrl/Cmd+Alt+2, then Ctrl/Cmd+Alt+0. Expected: heading/text conversion retains inline formatting and position. Undo/redo a slash or Markdown conversion. Expected: literal command/marker content and type restore correctly; list versus paragraph editors remain usable after each transition.
9. **Lists/tables:** enter and split three list items, add a soft break, indent/outdent, toggle tasks and undo/redo. Edit table cells with Tab/Shift+Tab and add/remove rows/columns from contextual controls. Expected: previous native structural behavior remains working and the text toolbar does not replace structural controls.
10. **Technical blocks:** edit code and change/copy its source. Edit a nonempty equation and Mermaid diagram using their header Edit actions. Expected: Math/Diagram source receives focus, preview is hidden during source editing, Done returns to rendered content, and invalid source remains recoverable. Try Ctrl/Cmd+Enter and Escape to finish.
11. **Zoom/responsive:** select text and open the slash/link menu at 50%, 100% and 200%; pan/zoom the camera and inspect a narrow viewport with the touch keyboard open. Expected: controls remain screen-sized, follow their content, stay bounded and hide when their anchor moves outside the canvas. Repeat in Light/Dark and Normal/Frosted.
12. **Persistence/guards:** edit and convert blocks, wait for Saved and reload. Expected: types, text/marks, positions and measured heights persist. Check upload and IME composition protections, linked Document editing and normal standalone Documents. Expected: protected operations remain protected and ordinary Document behavior remains unchanged.

## Commit suggestions

- `feat(boards): add document-like native writing interactions`
- `refactor(boards): separate editing and pointer responsibilities`

Stop for manual review before any later phase.
