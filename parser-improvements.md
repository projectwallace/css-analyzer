# @projectwallace/css-parser API Improvements

Issues and enhancement suggestions discovered during css-tree → Wallace parser migration.

## API Inconsistencies

### `str_starts_with` parameter order
**Issue:** The parameter order for `str_starts_with(string, prefix)` is the opposite of common JavaScript conventions and our internal `startsWith(prefix, string)` function.

**Impact:** When migrating from custom implementations, developers must remember to swap parameters.

**Suggestion:** Consider documenting this clearly or providing an alias that matches common JS conventions where the needle comes before the haystack.

## Missing Features

### CSS-Tree Compatibility Mode
**Issue:** Wallace parser does not provide a css-tree compatibility mode or adapter layer, making migration from css-tree an all-or-nothing proposition.

**Impact:** Projects using css-tree cannot gradually migrate - they must rewrite all AST traversal code at once.

**Observed Differences:**
1. **Children storage**: Wallace uses `first_child`/`next_sibling` + `children` array, while css-tree uses a custom List type with `.first`, `.last`, `.size`
2. **Location structure**: Wallace uses discrete properties (`line`, `column`, `start`, `length`, `end`) while css-tree uses nested objects (`loc.start.line`, `loc.start.offset`, `loc.end.offset`)
3. **Type identification**: Wallace provides `type` (numeric) and `type_name` (string) while css-tree primarily uses `type` (string)

**Suggestion:** Provide a css-tree compatibility adapter that wraps Wallace nodes to match css-tree's API, enabling gradual migration.

## Type Definition Issues
_(To be filled during migration)_

## Performance Observations
_(To be filled during migration)_

## Documentation Gaps
_(To be filled during migration)_

## Developer Experience
_(To be filled during migration)_
