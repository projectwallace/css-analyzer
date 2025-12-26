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

## Phase 1: String Utilities (4 steps)

Replace internal string utils with Wallace's from `@projectwallace/css-parser`.

### Step 1.1: Replace hasVendorPrefix
**File:** `src/vendor-prefix.ts`

Replace lines 1-12 with:
```typescript
import { is_vendor_prefixed } from '@projectwallace/css-parser'

export function hasVendorPrefix(keyword: string): boolean {
	return is_vendor_prefixed(keyword)
}
```

**Validation:** `npm run check && npm run lint && npm test && npm run build`

**Commit:** "refactor: use Wallace is_vendor_prefixed for hasVendorPrefix"

---

### Step 1.2: Replace isCustom
**File:** `src/properties/property-utils.ts`

Add import and replace lines 23-27:
```typescript
import { is_custom } from '@projectwallace/css-parser'

export function isCustom(property: string): boolean {
	return is_custom(property)
}
```

**Validation:** `npm run check && npm run lint && npm test && npm run build`

**Commit:** "refactor: use Wallace is_custom for custom property detection"

---

### Step 1.3: Replace strEquals
**File:** `src/string-utils.ts`

Add import and replace lines 26-39:
```typescript
import { str_equals } from '@projectwallace/css-parser'

export function strEquals(base: string, maybe: string): boolean {
	return str_equals(base, maybe)
}
```

**Validation:** `npm run check && npm run lint && npm test && npm run build`

**Commit:** "refactor: use Wallace str_equals for string comparison"

---

### Step 1.4: Replace startsWith
**File:** `src/string-utils.ts`

Update import and replace lines 81-94:
```typescript
import { str_equals, str_starts_with } from '@projectwallace/css-parser'

export function startsWith(base: string, maybe: string): boolean {
	return str_starts_with(base, maybe)
}
```

**Note:** `endsWith()` has no Wallace equivalent - keep for now.

**Validation:** `npm run check && npm run lint && npm test && npm run build`

**Commit:** "refactor: use Wallace str_starts_with for prefix matching"

---

## Phase 2: Small Files - Values (5 steps)

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
