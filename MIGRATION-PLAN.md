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

## Phase 2: Incremental Wallace Migration ⚠️ PARTIAL
**Status:** Wallace parser handling rules and declarations counting

### Step 2.1: Wallace takes over rules and declarations counting ✅
**File:** `src/index.ts`
**Commit:** `ae03e79` - "refactor: Wallace parser takes over rules and declarations counting"

Implemented:
- Wallace parse+walk inside `analyzeInternal()`
- Wallace updates `totalRules` and `totalDeclarations` directly
- Removed counting from css-tree walk (deleted `totalRules++` and `totalDeclarations++`)
- Double parse/walk tradeoff accepted for incremental migration

**Results:** All 228 tests pass - Wallace now owns this functionality!
- ✅ Rules counting: Migrated from css-tree to Wallace
- ✅ Declarations counting: Migrated from css-tree to Wallace
- ✅ Identical output - zero behavioral changes

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

### Step 2.2: Compare basic metrics
**File:** `src/index.ts`

In development/test mode, run both parsers and compare results:

```typescript
export function analyze(css: string, options?: AnalyzeOptions) {
	const cssTreeResult = analyzeInternal(css, options)

	if (process.env.NODE_ENV === 'development' || process.env.WALLACE_COMPARE) {
		const wallaceResult = analyzeWithWallace(css)
		compareResults(cssTreeResult, wallaceResult)
	}

	return cssTreeResult
}
```

**Validation:** Tests pass, comparison logs show in development

**Commit:** "feat: add dual parser comparison in development mode"

---

### Step 2.3: Migrate first metric (stylesheet.size)
**File:** `src/index.ts`

Move the simplest metric (stylesheet size) to Wallace parser:

```typescript
function analyzeWithWallace(css: string) {
	const ast = wallaceParse(css)
	return {
		stylesheet: {
			size: css.length, // Simple, no parsing needed
			// ... more to come
		}
	}
}
```

**Validation:** Comparison shows matching size

**Commit:** "feat: migrate stylesheet.size to Wallace parser"

---

### Step 2.4: Document learnings
**File:** `parser-improvements.md`

Update with any API issues discovered during dual parser implementation.

**Commit:** "docs: update parser improvements from dual parser work"

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
