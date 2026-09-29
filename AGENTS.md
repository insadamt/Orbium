# Orbium implementation instructions

Read `Docs/START_HERE.md`, `Docs/AGENTS.md`, and the documentation for the active phase before changing code. Work on one phase at a time and wait for explicit user approval before starting the next phase.

The user will test manually. Do not write or run automated tests; finish each phase with exact manual steps and expected results. Run relevant formatting, lint, type, and build checks, and report their actual results. Give commit message suggestions when finishing.

Use intention-revealing names and keep high-level flows readable. Extract low-level details into named functions or services. Do not hide writes behind query-like names. Use DTOs when arguments become unclear. Add comments only to explain why. Do not abstract duplication before the concept is proven. Keep new source files under roughly 500 lines and split by responsibility.

The user's instructions here take precedence over the automated-test requirements in `Docs/AGENTS.md`.
