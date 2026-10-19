# Boards — vertical icon toolbar

## Phase

Boards phase 4 manual review. The user requested the toolbar vertically at the left inside the Board, with icons only. This supersedes the horizontal toolbar placement while keeping the approved native Orbium app shell.

## Implemented

- Select, Hand, Text and Add now appear as icons in a vertical left rail, with horizontal separators and vertically grouped undo/redo.
- Removed the visible tool labels while retaining every button's existing accessible name, native hover title, selected state and disabled behavior.
- Reused the shared `floating-surface` treatment for the rail. Normal/Frosted appearances continue to follow Orbium preferences.
- Reserved rail width in the Board's normal layout instead of covering the canvas. Existing pointer, camera fit and selection controls therefore use the actual remaining canvas viewport without new coordinate offsets.
- Add opens to the right, aligned to its trigger; existing viewport collision handling and placement/dialog focus behavior remain.
- Fine pointers use 36px buttons in a 46px rail; coarse pointers use 42px buttons in a 54px rail. The rail scrolls vertically on short working areas. Editing retains the existing behavior of hiding placement tools while keeping history accessible.
- App bar, tabs, editable title, contextual selection controls and corner zoom remain in their existing locations.

## Commits

No commit created. Suggested messages:

- `refactor(boards): move tools into a vertical icon rail`
- `docs(boards): record vertical toolbar manual review`

## Persistent changes

None. No migrations, APIs, Board data, resource ownership or archive format changes.

## Validation

- Targeted `vp fmt`: PASS on the four modified source/style files.
- `npm run types:check`: PASS.
- `npm run lint`: PASS, all 639 checked files formatted and no warnings or lint errors across 536 linted files.
- `npm run build`: PASS, with existing large-bundle and ineffective dynamic-import warnings.
- `git diff --check`: PASS.
- No automated tests written or run, per user instruction. No PHP changes requiring PHP checks.

## Exact manual checklist

Use a disposable Board with several blocks.

1. Open the Board. Expected: an icon-only vertical rail sits at the left inside the Board, beside the canvas. No horizontal tool row or visible Select/Hand/Text/Add labels remains. The Orbium app bar/tabs/title remain visible.
2. Hover each tool and history button, then navigate with Tab. Expected: meaningful native hover hints, visible focus, accessible button names and the existing selected/disabled states. The rail's icon buttons do not resize when chosen.
3. Choose Text, then click the canvas. Type and finish editing. Expected: placement matches the pointer inside the remaining canvas, the active editor works, and undo/redo remain available vertically while placement tools hide during editing.
4. Open Add. Choose Heading, Image and another rich block in separate attempts. Expected: the picker prefers the right side, remains within the viewport, all labeled choices remain available, and the selected block places correctly. Use keyboard choice followed by Enter on the canvas to confirm center placement; Escape cancels an unused placement.
5. Open Add → Link page or create Document. Expected: the existing picker receives focus and linking/creation retains its previous behavior.
6. Use Hand and wheel pan, cursor-centered zoom, Fit all and Fit selection. Select, resize and move blocks near the left edge. Expected: content, selection borders and contextual controls stay aligned within the canvas; the tool rail does not cover them.
7. Duplicate a block, then undo/redo with the rail and keyboard shortcuts. Expected: the same history behavior and disabled states as before. Wait for Saved and reload: changes persist.
8. Repeat at 1440px, 768px and 360px widths, in light/dark and Normal/Frosted appearances. Expected: rail stays vertical and icon-only; Add remains usable through collision handling; corner zoom remains accessible.
9. On a touch/coarse-pointer device or equivalent browser emulation, check tool targets. Reduce window height or open the touch keyboard. Expected: 42px targets, rail scrolls when necessary so undo/redo remain reachable, and the normal app navigation remains accessible.

## Known limits

Visual and interaction acceptance remains pending for the user. No browser or screenshot validation is claimed. Existing build warnings remain.

## Stop gate

Remain in Boards phase-4 manual review; no later phase started.
