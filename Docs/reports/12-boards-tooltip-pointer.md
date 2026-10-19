# Tooltip diamond removal

2026-10-19. Boards phase-4 manual review.

Removed the decorative Arrow from shared TooltipContent, eliminating the diamond-shaped pointer on Board controls and other shared tooltips. One source line removed; existing tooltip content and behavior remain. No commits, dependencies or persistent changes. No automated tests written or run; browser visual acceptance remains pending.

## Actual checks

TypeScript, repository lint/format checks and `git diff --check` passed. Production build passed in 19.95s with existing mixed-import and chunk-size warnings. Logs are `/tmp/orbium-tooltip-pointer-{types,lint,build}.log`.

Targeted `vp fmt` reports that shared UI source is excluded by repository ignore rules; its existing formatting was retained.

## Manual checklist

1. Hover Board rail, block-action and text-formatting buttons. Expected: tooltips show labels/shortcuts without a diamond pointer.
2. Keyboard-focus a tooltip trigger and repeat in light/dark appearance near viewport edges. Expected: readable text, bounded positioning and normal dismissal.

## Commit suggestion

`style(ui): remove tooltip diamond pointers`

Remain in Boards phase-4 review. No later phase started.
