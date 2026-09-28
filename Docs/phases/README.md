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
