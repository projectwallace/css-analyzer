# Migrating from 9.x to 10

## The quick way

```diff
-import { analyze } from '@projectwallace/css-analyzer'
+import { analyze_compat as analyze } from '@projectwallace/css-analyzer/presets'
```

`analyze_compat(css)` returns the 9.x report: the same nested shape, camelCase keys and numbers (including ordered `items`). It runs every collector, so it is as expensive as 9.x was. Moving to collectors is where the speed-up and the smaller bundles come from.

What it does **not** have:

- the `useLocations` option (use `locations: true` on a collector instead)
- `__meta__` (parse and analyze timings)
- `uniqueWithLocations`

## From `analyze()` to collectors

| 9.x                                           | 10                                                                                 |
| --------------------------------------------- | ---------------------------------------------------------------------------------- |
| `analyze(css).values.colors`                  | `analyze(css, { colors: colors() }).colors`                                        |
| `analyze(css, { useLocations: true })`        | `colors({ locations: true })` per collector                                        |
| `colors.unique` is `{ red: 3 }`               | `colors.unique` is `Map { 'red' => { count: 3 } }`                                 |
| `totalUnique`                                 | `total_unique`                                                                     |
| `uniquenessRatio`                             | `summarize(result).uniqueness_ratio`                                               |
| `{ min, max, mean, mode, range, sum, items }` | `summarize_numbers(result)`; `items` with `{ sequence: true }` (`result.sequence`) |
| `itemsPerContext`                             | `by_context`, with `contexts: true`                                                |
| `specificity.{min,max,mean,...}`              | `summarize_specificity(result)`                                                    |
| `ratio` fields                                | compute from the totals, or use `summarize()`                                      |

Rules of thumb:

- All names are `snake_case` now (functions, options, result keys).
- One result shape for everything that is counted: `{ total, total_unique, unique: Map }`.
- Derived statistics are separate functions, so you only pay for what you use.
- Per-property counts (`by_context`) use the normalized property by default: lowercase, no vendor prefix or hack character (`-webkit-box-shadow` is `box-shadow`). Pass `property: 'as_written'` for the old behaviour.

## Behaviour changes

- `var()` is now tracked as a use of a custom property in every property. 9.x skipped `font-family`, `transition`, `animation` and `z-index`, so a custom property used only there looked unused.
- The collectors lowercase values the same way everywhere (values with `var()` keep their case). In 9.x a longhand timing function was left as written and a `font` shorthand size was always lowercased.
- Embedded `data:` URIs in `@import` preludes are not counted (only `url()` values).
- `animation-name: red` still counts `red` as a color, as in 9.x.

## Utilities

All pure utilities now accept CSS text or a parsed node and return plain data. No callbacks, no parser nodes in results, `snake_case` names:

| 9.x                                                              | 10                                                                                                |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `calculateSpecificity(sel)`, `getSpecificity`                    | `get_specificity(sel)` → `Specificity[]`                                                          |
| `getSpecificityForAST(node)`                                     | `get_specificity(node)[0]`                                                                        |
| `compareSpecificity`                                             | `compare_specificity` (ascending, as in `/selectors`)                                             |
| `selectorComplexity(node)`                                       | `get_complexity(sel)` → `number[]`                                                                |
| `isSelectorPrefixed(node, cb)`                                   | `get_vendor_prefixes(sel)` → `string[]`                                                           |
| `isAccessibilitySelector(node, cb)`                              | `get_accessibility_selectors(sel)` → `string[]`                                                   |
| `getCombinators(node, cb)`                                       | `get_combinators(sel)` → `{ name, loc }[]`                                                        |
| `isValueBrowserhack(value, cb)`                                  | `get_value_browserhacks(value)` → `string[]`                                                      |
| `isValuePrefixed(value, cb)`                                     | `get_prefixed_values(value)` → `string[]`                                                         |
| `isValueReset(value)`                                            | `is_value_reset(value)`                                                                           |
| `analyzeAnimation(value, cb)`                                    | `analyze_animation(value)` → `{ durations, timing_functions, names, keywords }`                   |
| `destructureFontShorthand(value, cb)`                            | `destructure_font_shorthand(value)` → `{ font_size, line_height, font_family, keywords } \| null` |
| `isMediaBrowserhack(node, cb)`                                   | `get_media_browserhacks(prelude)` → `string[]`                                                    |
| `isSupportsBrowserhack(node, cb)`                                | `get_supports_browserhacks(prelude)` → `string[]`                                                 |
| `namedColors`, `systemColors`, `colorFunctions`, `colorKeywords` | `named_colors`, `system_colors`, `color_functions`, `color_keywords`                              |
| `isPropertyHack`                                                 | `is_property_hack`                                                                                |

Removed: `isIe9Hack` (use `get_value_browserhacks`), `hasVendorPrefix`, `cssKeywords` (use `keywords` from `/values`), the `Collection`, `ContextCollection` and `AggregateCollection` classes, and the `Location` / `UniqueWithLocations` types of the old result (`Location` is still exported and gained an optional `source`).

## New

- Collectors, `create_analyzer()` for many inputs, and `merge()` for independent results.
- Your own collectors with `define_collector()`.
- Presets for design tokens, everything, and 9.x compatibility.
