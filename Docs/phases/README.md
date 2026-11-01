Summary: Lists implementation phases and approval gates so work remains independently reviewable; depends on repository instructions and user authorization for each feature phase.

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

Document columns were authorized on 2026-10-30 with “okey go ahead do it”. Follow `16-document-columns.md` for this focused feature phase and stop after `../reports/16-document-columns.md` for manual review.

The V3 Document editor refactor was requested on 2026-10-31 with “implement it all”. Follow `orbium-v3-document-editor.md` section 12 in order, preserving the explicit review gate after each implementation stage. Stage 1 audit/static baseline and manual runtime capture steps are in `../reports/orbium-v3-stage-1-baseline.md`; the source map is `../plans/orbium-v3-integration-map.md`. Stage 2 was approved with “next” and stage 3 with “continue”: isolated syntax/index/native codecs and stable-ID owner transactions are implemented but inactive. See `../docs/25-v3-document-structure.md`, `../docs/26-v3-owner-transactions.md` and `../reports/orbium-v3-stage-3-transactions.md`. Stage 4 was approved with “okey continue”: inactive keyboard/selection/paste adapters and manual inspection are implemented; see `../docs/27-v3-editing-ux.md` and `../reports/orbium-v3-stage-4-editing.md`. Stage 5 was approved with “continue”: identified column transactions, cleanup/dissolution, projected editing and the opt-in column surface are implemented; see `../docs/28-v3-columns.md` and `../reports/orbium-v3-stage-5-columns.md`. Stop for stage-5 review before coordinated feature/storage integration. Root `AGENTS.md` overrides automated-test requirements: manual behavior testing only, with formatting/lint/type/build checks. The current product continues to use format 2.

V3 stage 6 is authorized by “continue but make now the new editor who works instead of the v2”. The matched active editor/storage/transfer cutover is documented in `../docs/29-v3-active-editor.md` and `../reports/orbium-v3-stage-6-active-editor.md`. Stop for this manual review before stage 7. Earlier inactive-stage notes describe historical foundations.
