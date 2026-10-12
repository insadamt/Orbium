# Database option creation report

## Phase

Focused Phase 3 database enhancement requested by the user.

## Implemented

- Select and Multi-select pickers display Create “name” when a trimmed, non-empty search has no matching choice.
- Creation adds the option to the shared property schema and selects it for the current document atomically.
- Select replaces its current value and closes the picker. Multi-select preserves selected values, clears the search, and stays open.
- Works in Table cells and the document property header. Partial reloads refresh schema and values after creation.
- Creation locks the database, refreshes current property configuration, and reuses case-insensitive existing names to avoid duplicate concurrent additions.
- Existing ownership, document/property membership, property type, option count, and name length validation apply. Failed writes roll back schema and value changes and display an error.

## Persistence

Uses existing property config options and database values. No migration, editor format change, or archive format change.

## Validation

- Frontend formatting: PASS.
- `npm run types:check`: PASS.
- `npm run lint`: PASS (formatting and lint).
- `npm run build`: PASS; warnings about chunks over 500 kB and mixed static/dynamic imports.
- `./vendor/bin/pint --test`: PASS.
- PHP syntax checks for ManageDatabase, DatabaseController, and routes/web.php: PASS.
- `git diff --check`: PASS.
- Automated tests were neither written nor run, per user instructions.
- Manual interaction verification is pending user review.

## Manual checklist

1. Create or open a database with Select Status and Multi-select Tags properties and two documents. Open a Status cell and search for a new name such as Reviewing. Expected: Create “Reviewing” appears. Click it. Expected: Reviewing is selected and the picker closes.
2. Reload, open Status on the second document, and search Reviewing. Expected: the saved option is available to select, with no Create action. Search reviewing and then a matching substring. Expected: the existing choice is found without a Create action.
3. Select an existing Tag on the first document, then search a new name such as Research and click Create. Expected: both tags remain selected; the search clears and the picker stays open. Select or deselect another tag. Expected: ordinary editing still works. Reload. Expected: the saved selections persist.
4. Open the first document through its title. Create another option from its property header. Expected: the new value appears there. Return to Table and open the same property on another document. Expected: the option is available. Check property settings. Expected: newly created names appear in the configured options.
5. Open a picker for a property with no options, type a name, and create it. Expected: the first option saves. Search with an empty string or only spaces. Expected: no Create action. Search `  Follow-up  ` and create it. Expected: the stored name is Follow-up without surrounding spaces.
6. Search a new name longer than 100 characters and click Create. Expected: a validation error appears and neither the option nor the document value changes. Retry with a valid short name. Expected: creation succeeds. On a property already containing 100 options, try creating another. Expected: an error appears and existing options and selections remain unchanged.
7. In two browser tabs, open the same property, search the same new name with different capitalization, and create it in each tab. Expected after reload: one shared option exists and both documents use its canonical spelling. If the second tab has already refreshed, select the existing option instead.

## Commits

No commit created. Suggested message: `feat(databases): create select options from unmatched searches`.

## Scope and limitations

Creation is offered only when search finds no matching option, including partial matches. Existing schema limits remain in force. Manual review is pending; no later phase was started.
