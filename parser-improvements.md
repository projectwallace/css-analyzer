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

## Parser Bugs

### Comments in Selector Lists
**Issue:** When a comment appears inside a selector list (between comma-separated selectors), the Wallace parser stops parsing the selector list and does not include selectors that appear after the comment.

**Example:**
```css
[aria-hidden],
img[role="presentation"],
.selector:not([role="tablist"]),
body[role=tabpanel]:focus,

/* comment here */
img[loading="lazy"],
[hidden] {}
```

**Expected behavior:** 6 selectors in the SelectorList
**Actual behavior:** 4 selectors in the SelectorList (stops at comment)

**Impact:**
- Selector counting is incorrect when comments exist in selector lists
- Cannot rely on Wallace for accurate selector metrics
- Blocks migration of selector-related analysis

**Workaround:** Continue using css-tree for selector counting until fixed.

**Test case:** See `src/selectors/selectors.test.ts` - "counts Accessibility selectors"

## Type Definition Issues
_(To be filled during migration)_

## Performance Observations
_(To be filled during migration)_

## Documentation Gaps
_(To be filled during migration)_

## Developer Experience

### Simple Walk vs Context-Aware Walk

**Observation:** Wallace's `walk()` function is simple and performant, but lacks the contextual awareness that css-tree's walk provides.

**Example - Selector Counting:**
- css-tree's walk has `this.atrule` context to know if we're inside a @keyframes rule
- Selectors inside @keyframes are tracked separately (not counted as regular selectors)
- Wallace's walk visits all Selector nodes equally, without parent context
- Result: Cannot directly replace context-dependent logic with Wallace walk

**Migration Implication:**
- ✅ Good for: Simple counting (Rules, Declarations)
- ❌ Complex for: Context-dependent logic (Selectors in different atrule contexts)
- Strategy: Migrate simple metrics first, keep css-tree walk for complex analysis

## Developer Experience
_(To be filled during migration)_
