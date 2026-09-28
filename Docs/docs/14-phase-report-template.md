# Phase N completion report

Codex must produce this report after every phase and then stop.

## Phase

`Phase N — Name`

## Implemented

- ...
- ...

## Explicitly not implemented in this phase

- ...
- ...

## Commits

| Commit | Purpose |
|---|---|
| `<sha> <message>` | ... |

## Migrations / persistent format changes

- None

or list:

- migration ...
- editor content format ...
- archive format impact ...

## Automated validation

```text
./vendor/bin/pint --test
PASS ...

php artisan test
PASS ...

npm run types:check
PASS

npm run lint
PASS

npm run test
PASS ...

npm run build
PASS

git diff --check
PASS
```

Use real results. Never invent a passing result.

## Manual validation for the user

1. ...
2. ...
3. ...

For every step, state the expected result.

## Known limitations

Only limitations intentionally allowed by the current phase:

- ...

## Issues discovered/fixed during verification

- ...

## Stop gate

Do not start Phase N+1.

Wait for one of:

- user reports a problem → fix within Phase N;
- user explicitly approves Phase N → then begin Phase N+1.
