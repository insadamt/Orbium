# New database property visibility

## Cause and change

Views with saved `visible_property_ids` omitted newly created properties, so new columns appeared hidden by default. Property creation now appends the new ID to explicit Table/Gallery visibility lists in the same transaction as property creation. Existing hidden properties and visible ordering are preserved; views without a visibility list continue to show all properties. Filters, sorts, widths, and appearance are retained.

No migration or historical data rewrite is required. Previously hidden properties remain unchanged because saved configuration cannot distinguish intentional hiding from the earlier bug; show these once through View settings.

## Manual checklist

1. Open a database, hide one property, reorder the visible properties, and Apply settings. Create a Text property from the Table header `+`.
   Expected: the new column appears immediately at the end; the hidden property stays hidden and existing order is preserved.
2. Open View settings.
   Expected: the new property is marked visible. Reload the page; the column remains visible.
3. Configure Gallery visibility, then create a property through its settings. Add a value to a document and view the card.
   Expected: the new property is visible in Gallery and Table; previously hidden properties remain hidden in each view.
4. Hide all custom properties, Apply, then create another property.
   Expected: the new property alone becomes visible alongside the built-in title.
5. Create a fresh database and add several properties before configuring visibility.
   Expected: every property is visible by default.
6. Set filters, sorts, widths, and Gallery appearance; create another property.
   Expected: the new property appears, and these existing settings remain intact.
7. Cancel creating a property or attempt an invalid submission.
   Expected: no extra property or visibility entry is saved.

## Validation

- Pint formatting and PHP syntax: passed.
- Frontend TypeScript, lint/formatting, production build, and diff whitespace checks: passed.
- Build retains import overlap, large chunk, and plugin timing warnings.
- `composer types:check`: failed with 63 errors in existing code, including property config type inference and missing iterable value types. No errors reported in the new visibility helper on the final run.
- No automated tests written or run, per project instructions. Browser behavior remains for manual review.

Suggested commit: `fix(databases): show newly created properties by default`
