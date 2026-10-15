# Code block Animate UI copy button

Replaced the code toolbar's text button with the requested Animate UI CopyButton
in the Markdown editor and retained Tiptap editor. The ghost icon button animates
from copy to check, shows Copied for 1.5 seconds, and reads current code when clicked.
Clipboard failures display an accessible message. Empty code can be copied,
reset timers are cleared on unmount, and reduced motion disables icon transitions
and hover/tap scaling.

The requested shadcn installer succeeded with `--yes`. It generated files at the
repository root; the three new component files were moved under resources/js to
match Orbium's TypeScript alias. The existing controlled-state hook was reused.
No package, lockfile, database, content format, or export changes were needed.
Existing unrelated block-handle work was preserved. No commit was created.

## Validation

- Targeted `vp fmt`: PASS for all six changed/new source files.
- `npm run types:check`: PASS after omitting the native HTML content attribute
  from the component props so the lazy code reader can be accepted.
- `npm run lint`: PASS, including formatting.
- `npm run build`: PASS with large-chunk and ineffective-dynamic-import warnings.
- `git diff --check`: PASS.
- Automated tests were neither written nor run, per the user's instructions.
- Browser/manual checks remain for the user.

## Manual checklist

1. Open a Markdown document with a multiline code block. Click its copy icon,
   then paste into a plain text editor. Expected: exact code, including whitespace,
   without fences or the language label; the icon changes to a check and shows
   Copied, then resets after 1.5 seconds.
2. Edit the code, copy again immediately, and paste. Expected: latest content.
   Copy a second code block. Expected: each button copies its own block.
3. Focus Copy code with Tab and activate it with Enter and Space. Expected:
   visible keyboard focus and successful copying without submitting a form.
4. Copy an empty block. Expected: clipboard becomes empty and success appears.
5. Deny clipboard permission in browser site settings and click copy. Expected:
   a readable failure message with instructions to select and copy manually.
   Restore permission and retry. Expected: successful copying and cleared error.
6. Check Light/Dark themes and enable the operating system's reduced motion.
   Expected: theme-appropriate ghost button; reduced motion switches icons
   without blur, scale, or hover/tap motion.
7. Switch source/preview, scroll the block out and back, and switch document tabs
   during feedback. Expected: controls still work after remount with no errors.
8. Repeat copy/edit/keyboard checks in an existing legacy Tiptap document.
   Expected: the same button and exact latest code.

## Suggested commit

`feat(editor): use Animate UI copy buttons in code blocks`
