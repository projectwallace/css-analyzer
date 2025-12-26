# @projectwallace/css-parser API Improvements

Issues and enhancement suggestions discovered during css-tree → Wallace parser migration.

## API Inconsistencies

### `str_starts_with` parameter order
**Issue:** The parameter order for `str_starts_with(string, prefix)` is the opposite of common JavaScript conventions and our internal `startsWith(prefix, string)` function.

**Impact:** When migrating from custom implementations, developers must remember to swap parameters.

**Suggestion:** Consider documenting this clearly or providing an alias that matches common JS conventions where the needle comes before the haystack.

## Missing Features
_(To be filled during migration)_

## Type Definition Issues
_(To be filled during migration)_

## Performance Observations
_(To be filled during migration)_

## Documentation Gaps
_(To be filled during migration)_

## Developer Experience
_(To be filled during migration)_
