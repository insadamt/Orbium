# Boards — Remove Properties and preserve highlight travel across dividers

2026-10-19. Boards phase-4 manual review, following the user's explicit correction.

## Changes

- Removed Properties/Hide properties from selection More, along with the inspector's state, mount and focus-return wiring. Selection toolbar positioning no longer reserves space for that inspector.
- Hide More during editing because its remaining duplicate/arrange/layer/delete actions are only available outside editing. Done and contextual controls remain.
- Shared menu highlights retain their last hovered option while the pointer crosses separators and gaps. Surface focus caused by Radix's item-leave handling no longer clears that position, so entering the next option can animate continuously. Pointer exit, keyboard navigation, disabled-option filtering and reduced-motion handling remain in place.

No backend, persistence, migration or dependency changes. No commits created. No automated tests written or run, per user instructions. Live browser acceptance remains pending.

## Validation

- Targeted `vp fmt`: passed for all four changed source files.
- `npm run types:check`: passed, exit 0.
- `npm run lint`: passed, exit 0; 642 files formatted and 537 linted without warnings/errors.
- `npm run build`: passed, exit 0; built in 14.90s. Existing mixed static/dynamic import warnings (image crop, database property header, document editor loader), chunk-size and plugin-timing notices remain.
- `git diff --check`: passed.

Logs: `/tmp/orbium-toolbar-divider-types.log`, `/tmp/orbium-toolbar-divider-lint.log`, `/tmp/orbium-toolbar-divider-build.log`. PHP and migration checks do not apply to this frontend-only correction.

## Manual checklist

1. Select one native Board block and open More. Expected: no Properties/Hide properties item; duplicate, layer and delete actions remain. Multi-select blocks: arrangement controls remain available.
2. Enter editing with Enter/double-click. Expected: no empty More menu; Done and block-specific editing controls remain. Finish editing: More returns.
3. Open More and hover slowly from Duplicate across the first divider to Bring to front, then from Send to back across the second divider to Delete. Pause on each divider, repeat upward and move quickly between groups. Expected: one highlight remains at the previous option while over the gap, then slides to the next option without disappearing/reappearing. Only click destructive actions on disposable blocks.
4. Open Text style and another app dropdown containing dividers; repeat crossing groups. Expected: continuous highlight travel there too. Leave the menu and reopen: no stale floating highlight remains outside its menu.
5. Navigate More with Arrow Up/Down, Home/End and Escape; try the multi-selection Arrange submenu. Expected: keyboard focus/selection works, dividers are skipped, disabled entries stay unavailable and Escape closes the menu normally.
6. Repeat representative checks in light/dark, Normal/Frosted, a narrow window and with OS reduced motion. Expected: readable controls; reduced motion places the highlight immediately with no travel animation.

## Commit suggestions

- `refactor(boards): remove selection properties option`
- `fix(ui): preserve menu highlight motion across separators`

Remain in Boards phase-4 manual review. No later phase started.
