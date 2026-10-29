# Implementation phases

The phases are designed to produce manually inspectable results without letting later systems hide defects in earlier foundations.

## Sequence

1. `00-foundation.md`
2. `01-hierarchy.md`
3. `02-editor.md`
4. `03-databases.md`
5. `04-search-navigation.md`
6. `05-orbit.md`
7. `06-portability.md`
8. `07-settings-onboarding-polish.md`
9. `08-release.md`

## Gate

The 2026-10-18 Boards feature begins with `09-boards-foundation.md`. Its subsequent feature phases require the same explicit approval gate and do not imply approval of the existing release phases.

Boards phases 1–3, including the independent native-block correction in `11-boards-native-correction.md`, were approved on 2026-10-18. Phase 4 is authorized by “okey go ahead”: follow `12-boards-resource-cards.md` and stop after `../reports/12-boards-resource-cards.md` for manual review. The initial document-fragment implementation remains superseded. The user explicitly authorized phase 5 on 2026-10-24 with “okey work on the mindmap block go ahead”. Follow `13-mindmap-block.md` for the confirmed core, scope interpretation of the truncated source and the manual-review gate.

After every phase:

```text
Automated checks
      ↓
Codex report
      ↓
User manual validation
      ↓
Fixes if needed
      ↓
Explicit user approval
      ↓
Next phase
```

Codex must not chain phases automatically.

Native Board shapes were authorized on 2026-10-29 with “okey go ahead”. Follow `15-board-shapes.md` and `../plans/board-shapes.md`, then stop after `../reports/15-board-shapes.md` for manual review. Connected arrows and rotation remain separately gated.
