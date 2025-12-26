# Complete Migration Plan: css-tree → @projectwallace/css-parser

## Overview

Comprehensive migration from css-tree to @projectwallace/css-parser, starting with string utilities, then progressively migrating smaller files to larger files.

**Strategy:** Incremental replacement with commits after each successful validation.

---

## Phase 0: Setup Tracking Documents (3 steps)

### Step 0.1: Create parser-improvements.md ✅
**File:** `parser-improvements.md` (repo root)

### Step 0.2: Create MIGRATION-PLAN.md ✅
**File:** `MIGRATION-PLAN.md` (repo root)

### Step 0.3: Commit tracking documents
```bash
git add MIGRATION-PLAN.md parser-improvements.md
git commit -m "docs: add migration planning and parser improvement tracking"
```

---

## Phase 1: String Utilities ✅ COMPLETE

Replace internal string utils with Wallace's from `@projectwallace/css-parser`.

**Status:** All 4 string utilities successfully migrated
**Commits:** 4

### Step 1.1: Replace hasVendorPrefix ✅
**File:** `src/vendor-prefix.ts`
**Commit:** `61bc022` - "refactor: use Wallace is_vendor_prefixed for hasVendorPrefix"

---

### Step 1.2: Replace isCustom ✅
**File:** `src/properties/property-utils.ts`
**Commit:** `3a34b55` - "refactor: use Wallace is_custom for custom property detection"

---

### Step 1.3: Replace strEquals ✅
**File:** `src/string-utils.ts`
**Commit:** `f84e8af` - "refactor: use Wallace str_equals for string comparison"

---

### Step 1.4: Replace startsWith ✅
**File:** `src/string-utils.ts`
**Commit:** `cf3e6fe` - "refactor: use Wallace str_starts_with for prefix matching"
**Note:** Parameter order reversed - documented in parser-improvements.md

---

---

## Migration Challenge Discovered

### Structural Incompatibility
During migration planning, we discovered that Wallace parser and css-tree have fundamentally different AST structures:

1. **Parse-first requirement**: Files like `atrules/atrules.ts` and `values/*.ts` cannot be migrated independently because they receive css-tree nodes from `index.ts`
2. **Wallace's walk() only works with Wallace nodes**: Cannot use Wallace's walk on css-tree AST
3. **No compatibility adapter**: Wallace doesn't provide a css-tree compatibility mode

### Revised Strategy Options

**Option A: All-at-once migration (High Risk)**
- Migrate `index.ts` completely to Wallace parser in one large change
- Update all dependent files simultaneously
- Risk: Large, complex change affecting 770+ lines of walk logic

**Option B: Compatibility adapter (Recommended)**
- Create an adapter layer that wraps Wallace nodes to expose css-tree-compatible API
- Allows gradual file-by-file migration
- Adapter handles differences in children storage, location structure, type identification
- Risk: Additional maintenance burden for adapter layer

**Option C: Dual parser approach**
- Keep css-tree for main parsing temporarily
- Use Wallace utilities (string functions) where beneficial
- Plan full migration for a major version bump
- Risk: Dependency on both parsers

### Decision: Option C (Dual Parser Approach)

After attempting Option B (compatibility adapter), we discovered a fundamental blocker: the compatibility shim can only intercept imports in files we modify (like index.ts), but other files throughout the codebase (like `selectors/utils.ts`, `atrules/atrules.ts`) import css-tree's walk function directly. When these files receive Wallace nodes, css-tree's walk fails with errors like "ref.reduce is not a function".

**The dual parser approach (Option C) is the safest path forward:**
1. Keep css-tree for main analysis (current working state)
2. Add Wallace parser running in parallel to validate results
3. Gradually migrate analysis logic from css-tree to Wallace
4. Compare outputs to ensure correctness
5. Eventually remove css-tree dependency

This approach:
- ✅ Maintains working system throughout migration
- ✅ Validates Wallace parser correctness before switching
- ✅ Allows incremental feature migration
- ✅ No compatibility layer complexity
- ✅ Easy rollback at any point

---

## Phase 2: Incremental Wallace Migration 🚧 IN PROGRESS
**Status:** Wallace parser handling basic counting metrics

### Step 2.1: Wallace takes over basic counting metrics ✅
**File:** `src/index.ts`

**Commits:**
- `ae03e79` - Rules and declarations counting
- `959ae8d` - Empty rules counting
- `2ff3cf3` - Important declarations counting
- `1e53dcc` - Use Wallace is_empty property
- `b517953` - Nesting depth tracking
- `db7115d` - Rule metrics (ruleSizes, selectorsPerRule, declarationsPerRule)

**Implemented:**
- Wallace parse+walk inside `analyzeInternal()`
- Wallace directly updates metrics variables (no Wallace-specific vars)
- Removed counting logic from css-tree walk
- Double parse/walk tradeoff accepted for incremental migration

**Results:** All 228 tests pass - Wallace now handles:
- ✅ Rules counting (`totalRules++`)
- ✅ Declarations counting (`totalDeclarations++`)
- ✅ Empty rules counting (`node.block.is_empty`)
- ✅ Important declarations counting (`node.is_important`)
- ✅ Nesting depth tracking (atruleNesting, ruleNesting, selectorNesting, declarationNesting)
- ✅ Rule metrics (ruleSizes, selectorsPerRule, declarationsPerRule)

**AST Structure Learning:**
- Rule has children: `[SelectorList, Block]`
- SelectorList contains Selector nodes (count these for selectorsPerRule)
- Block contains Declaration nodes (count these for declarationsPerRule)

**Remaining with css-tree:**
- Selectors (blocked by parser bug)
- Collections requiring locations (properties, values, etc.)
- Context-dependent metrics (importantsInKeyframes, etc.)
- Unique nesting collections (need location format unification)
- Complexity calculations (need algorithm porting or context)

---

### Step 2.2: Attempted selector counting migration ❌ BLOCKED
**File:** `src/index.ts`
**Status:** Attempted but reverted due to Wallace parser bug

**Attempt:**
- Added manual context tracking (`currentAtruleName`, `inSelectorList`)
- Counted Selector nodes that are direct children of SelectorList
- Excluded selectors inside @keyframes
- Avoided counting nested selectors (e.g., inside `:not()`, `:is()`)

**Blocker discovered:** Wallace parser bug with comments in selector lists
- When a comment appears between comma-separated selectors, Wallace stops parsing
- Example: 6 selectors in list, but Wallace only parses 4 (stops at comment)
- Test case: `src/selectors/selectors.test.ts` - "counts Accessibility selectors"
- See `parser-improvements.md` "Parser Bugs > Comments in Selector Lists" for details

**Resolution:**
- Reverted selector counting back to css-tree approach: `totalSelectors = selectorComplexities.size()`
- Simplified Wallace walk to only count Rules and Declarations
- All 228 tests passing

**Lesson learned:** Wallace parser has parsing bugs that block migration of certain metrics

---

### Strategy: Incremental Integration

**Approach:** Wallace parser gradually takes over more functionality within the existing `analyzeInternal()` function:
1. Wallace walk runs before css-tree walk
2. Wallace updates metric variables directly (e.g., `totalRules++`, `emptyRules++`)
3. Remove corresponding logic from css-tree walk
4. Tests validate correctness after each migration
5. No comparison mode - direct replacement with test validation

**Next metrics to migrate:**
- ✅ Basic counting (rules, declarations, empty rules, importants)
- ✅ Nesting depth tracking (aggregate collections)
- 🎯 Simple metrics: ruleSizes, selectorsPerRule, declarationsPerRule
- 🎯 Complexity calculations (atruleComplexities, selectorComplexities, etc.)
- 🎯 Declaration/selector uniqueness tracking
- ⏸️ Context-dependent metrics (blocked until locations support)
- ⏸️ Selector metrics (blocked by parser bug)

**Blockers:**
- **Invalid CSS / Browser Hacks**: Wallace doesn't parse intentionally invalid CSS (e.g., `*zoom`, `_width`)
  - Properties with hacks CANNOT be migrated to Wallace
  - Must keep css-tree for property tracking that needs hack detection
  - Discovered: Wallace only parses valid CSS declarations
- **Selector counting**: Parser bug with comments in selector lists
- **Context tracking**: Some metrics need parent context (e.g., importantsInKeyframes)
- **Wallace AST Structure**: Blocks appear in BOTH `children` array AND `block` property
  - Walking both causes double-counting
  - Solution: Only walk `children`, Block nodes are already there

---

## Phase 3: Small Files - Values (5 steps)
**Status:** ⏸️ DEFERRED - Focus on dual parser first

### Step 2.1: values/browserhacks.ts
### Step 2.2: values/values.ts
### Step 2.3: values/vendor-prefix.ts
### Step 2.4: values/animations.ts
### Step 2.5: values/destructure-font-shorthand.ts

---

## Phase 3: Medium Files (2 steps)

### Step 3.1: atrules/atrules.ts
### Step 3.2: selectors/utils.ts

---

## Phase 4: Large File - Main Parser (1 step)

### Step 4.1: index.ts

---

## Phase 5: Cleanup (4 steps)

### Step 5.1: Remove css-tree-node-types.ts
### Step 5.2: Deprecate and export Wallace utilities
### Step 5.3: Remove css-tree dependency
### Step 5.4: Update parser-improvements.md

---

## Wallace Parser API Reference

### String Utilities (from `@projectwallace/css-parser`)
- `is_vendor_prefixed(str)` → boolean
- `is_custom(str)` → boolean
- `str_equals(a, b)` → boolean (case-insensitive)
- `str_starts_with(str, prefix)` → boolean (case-insensitive)
- `str_index_of(str, search)` → number

### Parser API
- `parse(source, options?)` → AST
  - Options: `skip_comments`, `parse_values`, `parse_selectors`, `parse_atrule_preludes`
- `walk(ast, callback, depth?)` → void
- `traverse(ast, options?)` → void (with enter/leave, depth tracking)

### Node Structure
- `type` (numeric), `type_name` (string like 'Rule', 'Declaration')
- `text` (source text), `name`/`property`, `value`
- `line`, `column`, `start`, `length`, `end` (position)
- `is_important`, `is_vendor_prefixed`, `has_error` (flags)
- `first_child`, `next_sibling`, `children` (array)
- `block` (for rules/atrules)

---

## Quality Validation (After Each Step)

```bash
npm run check    # TypeScript type checking
npm run lint     # Oxlint code quality
npm test         # Vitest test suite (or specific tests)
npm run build    # Vite build
npm run knip     # Unused code detection (cleanup steps)
```

All must pass before committing.
