# Migrating from 9.x to 10

## Breaking changes at a glance

- **Node.js >= 22.18** (was >= 18). The source uses `.ts` import specifiers; the published package is plain ES modules plus types.
- `analyze()` takes collectors and returns only what they report (see below).
- `unique` and `by_context` are `Map`s, not plain objects. Use `to_json(result)` to get plain data for `JSON.stringify()`.
- All names are `snake_case`.
- **Selectors inside at-rule preludes are no longer in the data**: `@scope (.card) to (.content)` and `@supports selector(:has(a))`. 9.x counted them; now `selectors()`, `specificity()` and `stylesheet()` all leave them out, so `selectors().total`, the specificity results and `stylesheet().source_lines_of_code` / `complexity` can be lower than in 9.x for CSS that uses these at-rules (all other CSS gives the same numbers). Selectors of style rules inside these at-rules are still counted.
- `DefinedUsed` and `KeywordSet` moved from the package root to `@projectwallace/css-analyzer/utils/collections`.
- Need the 9.x report shape in one call? `analyze_compat` is tracked in [#649](https://github.com/projectwallace/css-analyzer/pull/649); `analyze_all()` returns the same data under new keys (see the table below).

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

## Where did each 9.x key go?

`analyze_all(css)` has one key per collector; with `analyze(css, { key: collector() })` the key is yours. Everything counted has `{ total, total_unique, unique }`. The `ratio` and `uniquenessRatio` fields are gone (see above).

| 9.x                                                               | 10 (collector → path in its result)                                                                 |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `stylesheet.size`, `linesOfCode`                                  | `stylesheet()` → `size`, `lines`                                                                    |
| `stylesheet.sourceLinesOfCode`, `stylesheet.complexity`           | `stylesheet()` → `source_lines_of_code`, `complexity` (numbers, same as 9.x; see Behaviour changes) |
| `stylesheet.comments`                                             | `stylesheet()` → `comments` (`{ total, size }`)                                                     |
| `stylesheet.embeddedContent`                                      | `stylesheet()` → `embedded` (count result by mime type, plus `size`)                                |
| `atrules.{total,unique}`                                          | `atrules()` → `total`, `unique`                                                                     |
| `atrules.fontface`                                                | `atrules()` → `font_faces` (`{ total, items }`)                                                     |
| `atrules.import`, `charset`, `scope`, `function`                  | `atrules()` → `imports`, `charsets`, `scopes`, `functions`                                          |
| `atrules.media` (`browserhacks`, `features`)                      | `atrules()` → `media` (`browserhacks`, `features`)                                                  |
| `atrules.supports`                                                | `atrules()` → `supports` (`browserhacks`)                                                           |
| `atrules.keyframes` (`defined`, `used`, ..., `prefixed`)          | `atrules()` → `keyframes` (`defined`, `used`, `unused`, `unknown`, `prefixed`)                      |
| `atrules.container.names`, `atrules.layer`                        | `atrules()` → `containers` (`names`), `layers`                                                      |
| `atrules.property`                                                | `atrules()` → `properties` (also tracks `var()` use)                                                |
| `atrules.complexity`, `atrules.nesting`                           | `atrules()` → `complexity`, `nesting` (items are numbers: `summarize_numbers()`)                    |
| `rules.{total,empty,sizes,nesting,selectors,declarations}`        | `rules()` → same names; `empty` is a number                                                         |
| `selectors.{total,unique}`, `complexity`, `nesting`               | `selectors()` → `total`, `unique`, `complexity`, `nesting`                                          |
| `selectors.specificity`                                           | `specificity()` + `summarize_specificity()`                                                         |
| `selectors.id`                                                    | `selectors()` → `ids` (selectors that contain an ID)                                                |
| `selectors.pseudoClasses`, `pseudoElements`, `customElements`     | `selectors()` → `pseudo_classes`, `pseudo_elements`, `custom_elements`                              |
| `selectors.accessibility`, `attributes`, `keyframes`, `prefixed`  | `selectors()` → same names                                                                          |
| `selectors.combinators`                                           | `selectors()` → `combinators`                                                                       |
| `declarations.{total,unique,complexity,nesting}`                  | `declarations()` → same names                                                                       |
| `declarations.importants`                                         | `declarations()` → `importants` (`{ total, in_keyframes }`)                                         |
| `properties.{total,unique}`                                       | `properties()` → `total`, `unique` (normalized: `-webkit-transition` is `transition`)               |
| `properties.prefixed`, `shorthands`, `browserhacks`, `complexity` | `properties()` → same names                                                                         |
| `properties.custom` (`defined`, `used`, `unused`, `importants`)   | `properties()` → `custom`                                                                           |
| `properties.anchorNames`                                          | `properties()` → `anchor_names`                                                                     |
| `values.colors` (`itemsPerContext`, `formats`)                    | `colors({ contexts: true })` → `by_context`, `formats`                                              |
| `values.gradients`                                                | `gradients()`                                                                                       |
| `values.fontFamilies`, `fontSizes`, `lineHeights`                 | `font_families()`, `font_sizes()`, `line_heights()`                                                 |
| `values.zindexes`                                                 | `z_indexes()`                                                                                       |
| `values.textShadows`, `boxShadows`                                | `text_shadows()`, `box_shadows()`                                                                   |
| `values.borderRadiuses` (`itemsPerContext`)                       | `border_radiuses({ contexts: true })` → `by_context`                                                |
| `values.animations.{durations,timingFunctions,names}`             | `durations()`, `timing_functions()`, `animation_names()`                                            |
| `values.prefixes`, `values.browserhacks`                          | `value_prefixes()`, `value_browserhacks()`                                                          |
| `values.units` (`itemsPerContext`)                                | `units({ contexts: true })` → `by_context`                                                          |
| `values.complexity`                                               | `value_complexity()` (items are numbers)                                                            |
| `values.keywords`, `resets`, `displays`                           | `keywords()`, `resets()`, `displays()`                                                              |

## Behaviour changes

- `var()` is now tracked as a use of a custom property in every property. 9.x skipped `font-family`, `transition`, `animation` and `z-index`, so a custom property used only there looked unused.
- The collectors lowercase values the same way everywhere (values with `var()` keep their case). In 9.x a longhand timing function was left as written and a `font` shorthand size was always lowercased.
- `stylesheet().embedded` uses the standard count shape: `{ total, total_unique, unique: Map<mime type, { count, locations? }>, size }`. The per-type `size` of 9.x is gone; `size` is the total of all embedded content.
- Embedded `data:` URIs in `@import` preludes are not counted (only `url()` values).
- `animation-name: red` is no longer counted as a color (9.x counted it).

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

Removed: `isIe9Hack` (use `get_value_browserhacks`), `hasVendorPrefix`, `cssKeywords` (use `keywords` from `/values`), the `Collection`, `ContextCollection` and `AggregateCollection` classes, and the `Location` / `UniqueWithLocations` types of the old result (`Location` is still exported).

## New

- Collectors.
- Your own collectors with `define_collector()`.
- `to_json(result)`: a copy of a result without `Map`s, for `JSON.stringify()` (`unique` was a plain object in 9.x, it is a `Map` now).
- Presets for design tokens and for everything (`analyze_all`). `design_tokens_collectors(options)` and `all_collectors(options)` are functions; `{ locations: true }` turns locations on for every collector. The keys of the design-token preset are the collector names (`border_radiuses`, `timing_functions`).
- `by_context` only exists on `colors`, `units` and `border_radiuses` results when `contexts: true` is passed; the types follow the option.
