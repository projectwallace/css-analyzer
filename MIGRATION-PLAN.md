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

### Recommendation
Phase 1 (string utilities) provides immediate value with zero risk. For the full parser migration, **Option B (compatibility adapter)** would enable the safest gradual migration path, though it requires implementing the adapter first.

---

## Phase 2: Small Files - Values (5 steps)
**Status:** ⏸️ BLOCKED - Requires index.ts migration first

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
