# Boards phase 1 — Native page foundation

This is the active phase for the 2026-10-18 Boards request. It does not advance the existing release/portability phases.

## Read first

- `../docs/24-boards.md`
- `../docs/02-domain-model.md`
- `../docs/04-data-model.md`
- `../docs/05-ui-ux-system.md`
- `../docs/08-search-navigation.md`
- `../docs/19-library.md`

## Tasks

1. Add a forward migration allowing `board` and retain existing Node lifecycle/ownership.
2. Enforce Boards as leaves through creation, move, bulk move, and restoration.
3. Add the authorized Board route and an honest, minimalist empty page using the existing shell.
4. Integrate creation, all explorer presentations and filters, icons, context menus, Search Master, breadcrumbs, tabs/history, favorite state, and Trash.
5. Run format, lint, type, and build checks; do not write or run automated tests.
6. Produce a completion report with exact manual steps, actual validation outcomes, limitations, and suggested conventional commit messages.

## Stop gate

Stop after this phase. Wait for explicit user approval before spatial canvas implementation. Missing specification text must be supplied before dependent Mind Map or later requirements are implemented.
