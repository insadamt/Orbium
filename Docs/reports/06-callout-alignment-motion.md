# Callout text alignment motion repair

Date: 2026-10-20. Status: implemented; manual visual acceptance pending.

## Cause and changes

The alignment animation selected the entire rich callout card. Measuring a DOM
range across its children included full-width block rectangles, whose left edges
stay fixed when text alignment changes. The animation therefore calculated zero
horizontal travel.

- Text bounds now come from individual text-node ranges so the measurement tracks
  visible glyphs rather than descendant block boxes. This also applies to ordinary
  text alignment through the shared motion helper.
- Markdown callouts supply visible title, preview paragraphs/headings and editor
  rows as animation targets. The callout card stays fixed. Hidden/collapsed rows
  and rows inside media, tables and code previews are excluded.
- Menu commands and undo/redo share these targets. Existing 260 ms timing,
  interruption and reduced-motion handling remain in place.

No migrations, persistent changes, new dependencies or commits. Prior alignment
and conversion-option changes remain intact. No later phase started.

## Validation

- `npm run lint`: passed, including formatting.
- `npm run types:check`: passed.
- `npm run build`: passed, with mixed static/dynamic import, large chunk and plugin timing warnings.
- `git diff --check`: passed.
- No automated tests were written or run, as instructed. Visual browser checks
  are left for the user's manual acceptance.

## Manual checklist

1. With reduced motion disabled, insert `/callout` and type a short sentence.
   Change Left → Center → Right → Left in the block menu. Expected: the text
   moves smoothly for about 260 ms; the surrounding card stays fixed.
2. Repeat with multiple paragraphs, bold text, inline links and an internal
   heading. Expected: visible text rows move to their respective final positions
   without moving the card or hiding content.
3. Add a titled folded callout through Source mode, for example
   `> [!WARNING]- Review this` followed by `> Check this`. Change alignment while
   collapsed and expanded. Expected: the visible title animates; expanded body
   text animates too; collapsed contents stay hidden.
4. Undo and redo alignment changes. Expected: smooth reverse/forward text motion,
   one normal history step per change, and the correct final alignment.
5. Repeat on a paragraph and heading, then an image. Expected: text motion still
   works; image alignment retains movement of its figure/caption/toolbar.
6. Interrupt movement by clicking, typing or scrolling. Expected: it ends at the
   committed alignment without leaving temporary offsets. Repeat in a split
   Document: only the edited block in its own pane moves.
7. Enable OS reduced motion and repeat. Expected: immediate alignment with no
   animation. Disable it, wait for autosave, reload. Expected: alignment persists
   and subsequent alignment changes animate normally.

## Commit suggestion

`fix(editor): animate callout text alignment using glyph bounds`
