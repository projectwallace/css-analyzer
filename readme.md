# CSS Analyzer

<div align="center">
  <img src="logo.svg" height="160" width="160" alt="Analyzer logo">
</div>

<div align="center">
  <a href="https://npmjs.org/package/@projectwallace/css-analyzer"><img src="https://badgen.net/npm/v/@projectwallace/css-analyzer" alt="version" /></a>
  <a href="https://npmjs.org/package/@projectwallace/css-analyzer"><img src="https://badgen.now.sh/npm/dm/@projectwallace/css-analyzer" alt="downloads" /></a>
  <a href="https://packagephobia.com/result?p=%40projectwallace%2Fcss-analyzer"><img src="https://packagephobia.com/badge?p=%40projectwallace%2Fcss-analyzer" alt="install size" /></a>
</div>

<div align="center">
Turn your CSS into <b>actionable stats</b> — specificity, complexity, design tokens, and 200+ more metrics.
</div>

## Features

- Extremely **detailed** (200+ metrics)
- **Pick what you need**: metrics are opt-in collectors, so you only pay (runtime and bundle size) for what you use
- **Tree-shakable** ES modules and **TypeScript** types, with the result type inferred from the collectors you pass
- Write your **own collectors** with the same API the built-ins use
- **Design system** audit ready: a design-tokens preset (colors, font sizes, shadows, ...) and uniqueness ratios via `summarize()`
- Runs anywhere — **NodeJS and browsers**
- Tiny footprint, only one dependency
- Battle-tested — powers [Project Wallace](https://www.projectwallace.com)

## Install

```sh
pnpm add @projectwallace/css-analyzer
```

## Usage

### Pick the metrics you need

```js
import { analyze } from '@projectwallace/css-analyzer'
import { colors, font_sizes, z_indexes } from '@projectwallace/css-analyzer/collectors'

const result = analyze(css, {
	colors: colors(),
	font_sizes: font_sizes(),
	z: z_indexes(),
})

result.colors.total // 12
result.colors.total_unique // 5
result.colors.unique.get('red') // { count: 3 }
result.font_sizes.unique // Map { '16px' => { count: 4 }, ... }
```

- The keys are yours: they become the keys of the result.
- Every collector is a function: call it (`colors()`), optionally with options.
- Only the parts of the CSS that your collectors need are parsed. A collector set that only looks at values never parses selectors.

All collectors count things the same way: `{ total, total_unique, unique: Map<string, { count, locations? }> }`.
Derived numbers are separate functions, so unused statistics cost nothing:

```js
import { summarize } from '@projectwallace/css-analyzer'
import { summarize_specificity, specificity } from '@projectwallace/css-analyzer/collectors'

summarize(result.colors) // { uniqueness_ratio: 0.41 }

const { s } = analyze(css, { s: specificity() })
summarize_specificity(s) // { total, min, max, sum, mean, mode }
```

`summarize_specificity` only accepts the result of `specificity()` (type `SpecificityResult`); passing the result of another collector is a type error.

### Locations

Locations are opt-in per collector:

```js
const { colors: result } = analyze(css, { colors: colors({ locations: true }) })
result.unique.get('red').locations // [{ line: 3, column: 14, start_offset: 26, end_offset: 29 }, ...]
```

### Ordered numbers (for charts)

Numeric series (nesting, sizes, complexity, specificity) are counted as values. Pass `sequence: true` to also get them in source order:

```js
import { rules } from '@projectwallace/css-analyzer/collectors'
const { r } = analyze(css, { r: rules({ sequence: true }) })
r.sizes.sequence // [2, 3, 1]
```

Use `summarize_numbers(result.sizes)` for min, max, mean, mode, median, range and sum.

### Presets

```js
import { analyze_design_tokens, analyze_all } from '@projectwallace/css-analyzer/presets'

analyze_design_tokens(css) // colors, font_sizes, font_families, line_heights, gradients, box_shadows, border_radiuses, durations, timing_functions, text_shadows, units
analyze_all(css) // every collector, flat: result.colors, result.atrules, result.selectors, ...
analyze_design_tokens(css, { locations: true }) // locations for every collector
```

Each preset also exists as a function that returns a collector map (`design_tokens_collectors(options)`, `all_collectors(options)`), which you can spread, narrow or extend. The keys are the collector names.
`analyze(css, { ...design_tokens_collectors({ locations: true }), z_indexes: z_indexes() })`.

#### Design tokens

`analyze_design_tokens` has 11 collectors: `colors`, `font_sizes`, `font_families`, `line_heights`, `gradients`, `box_shadows`, `border_radiuses`, `durations`, `timing_functions`, `text_shadows` and `units`. The result is keyed by collector name, like every other result: `result.colors`, `result.units`, ...
`colors`, `border_radiuses` and `units` also have `by_context` (counts per property). It deliberately leaves out `z_indexes`, `displays`, `keywords` and everything about selectors, rules and at-rules.

The preset takes the global `locations` option only. To give one collector other options, spread the preset and replace that collector:

```js
analyze(css, { ...design_tokens_collectors(), colors: colors({ normalize: 'none' }) })
```

### Typing a collector map

Collectors are plain functions, so their types come for free. With `isolatedDeclarations`, write the type of an exported map with `ReturnType`:

```ts
import { colors, font_sizes, type ResultOf } from '@projectwallace/css-analyzer/collectors'

export const collectors: {
	colors: ReturnType<typeof colors<{ contexts: true }>>
	font_sizes: ReturnType<typeof font_sizes>
} = { colors: colors({ contexts: true }), font_sizes: font_sizes() }

export type Report = ResultOf<typeof collectors>
```

`CollectorDef`, `CountResult`, `ContextCountResult`, `Location` and `ResultOf` can be imported from `@projectwallace/css-analyzer/collectors` too.

### Collectors

| Collector                                                  | Counts                                                                                                                                       |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `stylesheet`                                               | size, lines, source lines of code, complexity, comments, embedded `data:` content                                                            |
| `atrules`                                                  | every at-rule, with `@font-face`, `@import`, `@media`, `@supports`, `@keyframes`, `@container`, `@layer`, `@property`, `@function`, `@scope` |
| `rules`, `selectors`, `specificity`                        | rule sizes and nesting, selector kinds and complexity, specificity                                                                           |
| `declarations`, `properties`                               | declarations, `!important`, prefixes, custom properties, shorthands, hacks, anchor names                                                     |
| `colors`, `gradients`                                      | colors (with formats and per-property counts), gradients                                                                                     |
| `font_sizes`, `font_families`, `line_heights`              | font values (also from the `font` shorthand)                                                                                                 |
| `box_shadows`, `text_shadows`, `border_radiuses`           | shadows and radii                                                                                                                            |
| `durations`, `timing_functions`, `animation_names`         | transitions and animations                                                                                                                   |
| `units`, `z_indexes`, `displays`, `keywords`, `resets`     | other values                                                                                                                                 |
| `value_prefixes`, `value_browserhacks`, `value_complexity` | vendor prefixes, hacks, complexity of values                                                                                                 |

Options (all optional): `locations`, `sequence` (numeric series), `contexts` (`colors`, `units`, `border_radiuses`: count per property in `by_context`, which only exists with `contexts: true`), `normalize: 'none'` (keep the authored case), `skip_var` (font sizes, families, line heights).

### Write your own collector

```js
import { analyze, define_collector, create_counter } from '@projectwallace/css-analyzer'

function important_declarations() {
	return define_collector(function init() {
		const counter = create_counter()
		return {
			declaration: {
				enter(node, ctx) {
					if (ctx.is_important) counter.add(ctx.property, node)
				},
			},
			result() {
				return counter.result()
			},
		}
	})
}

analyze(css, { important: important_declarations() })
```

A collector subscribes to what it needs: `stylesheet`, `rule`, `atrule`, `selector`, `declaration` (`{ properties?, enter }`), `value` (`{ types, properties?, enter }`) and `comment`. The engine walks the CSS once and only dispatches to subscribers. `selector` handlers get the selectors of style rules (not keyframe selectors, nor selectors in at-rule preludes) and no `ctx`: use `rule` when you need `depth` or `atrule_stack`. Collectors must not keep nodes or the `ctx` object after the handler returns.
`ctx` offers lazy, shared facts: `property`, `raw_property`, `is_important`, `is_custom`, `is_browserhack`, `is_vendor_prefixed`, `value`, `value_text`, `clean_value_text`, `font_shorthand`, `depth`, `atrule_stack` and (in `stylesheet`) `css`. Counters take the node that was found (`counter.add(item, node)`): that is where `locations` come from.

### Utilities

Small functions that work on their own: they take a parsed node and return plain data. Parsing the CSS is up to you, with `@projectwallace/css-parser`: `parse_value()` for a value, `parse_selector()` for a selector (`parse_selector_list()` for a list, which you walk with `for_each`), and the `prelude` of an at-rule from `parse()` for an at-rule prelude. Only names (a property, a function name) are text.

```js
import { parse_selector, parse_value } from '@projectwallace/css-parser'
import { get_specificity, compare_specificity } from '@projectwallace/css-analyzer/selectors'
import { is_value_reset, get_value_browserhacks } from '@projectwallace/css-analyzer/values'

get_specificity(parse_selector('a.b > #c')) // [1, 1, 1]
is_value_reset(parse_value('0 0px')) // true

// compare_specificity sorts ascending: lowest specificity first
;[
	[0, 1, 1],
	[2, 0, 0],
	[0, 0, 1],
].sort(compare_specificity) // [[0, 0, 1], [0, 1, 1], [2, 0, 0]]
compare_specificity([0, 1, 0], [0, 1, 0]) // 0
```

Utilities that find things return `Match`es: `{ value, line, column, start_offset, end_offset }`, so a tool (a linter, an editor) can point at what was found. `value` is what was found as written, except where the util normalizes it (`get_vendor_prefixes`, `get_accessibility_selectors`, the browserhack utils and unquoted names from `get_animation_names` return the normalized name; the location still points at the source). Offsets (`start_offset`, and `end_offset` which is exclusive) are relative to the source the node came from: for `parse_value('a b')` that is `'a b'`, for an at-rule prelude it is the whole stylesheet that was parsed.

```js
import { parse_value } from '@projectwallace/css-parser'
import { get_declared_container_names } from '@projectwallace/css-analyzer/values'

get_declared_container_names(parse_value('sidebar card / size'))
// [{ value: 'sidebar', line: 1, column: 1, start_offset: 0, end_offset: 7 }, { value: 'card', line: 1, column: 9, start_offset: 8, end_offset: 12 }]
```

Also: `get_complexity`, `get_vendor_prefixes`, `get_accessibility_selectors`, `get_combinators` (`/selectors`); `destructure_font_shorthand`, `analyze_animation`, `analyze_transition`, `get_animation_names`, `get_declared_container_names`, `get_font_families`, `get_anchor_names`, `is_gradient_function`, `get_prefixed_values`, `named_colors`, `system_colors`, `color_functions`, `keywords` (`/values`); `get_media_browserhacks`, `get_supports_browserhacks`, `get_container_query_name`, `get_keyframes_name`, `get_layer_names`, `get_static_features`, `get_query_bounds`, `find_contradiction`, `validate_property_registration` (`/atrules`); `is_shorthand_property`, `is_spacing_reset_property`, `is_border_radius_property`, `is_property_hack` (`/properties`); `get_embed_type` (`/stylesheet`).

`DefinedUsed` (track what is defined and what is used, for names like custom properties or keyframes) and `KeywordSet` (a case-insensitive set of keywords) are the building blocks the built-in collectors use. They are exported from `@projectwallace/css-analyzer/utils/collections`.

`DefinedUsed` can keep something with every name, so you can point at it later: a node, or a `Match` from the name utilities (`get_keyframes_name`, `get_layer_names`, `get_font_families`, `get_anchor_names`, `get_declared_container_names`, `get_animation_names`).

```js
import { parse, parse_value } from '@projectwallace/css-parser'
import { DefinedUsed } from '@projectwallace/css-analyzer/utils/collections'
import { get_animation_names } from '@projectwallace/css-analyzer/values'
import { get_keyframes_name } from '@projectwallace/css-analyzer/atrules'

const keyframes = new DefinedUsed()
const sheet = parse('@keyframes spin {} a { animation: fade 1s, spin 2s }')
const spin = get_keyframes_name(sheet.first_child.prelude)!
keyframes.define(spin.value, spin)
for (const name of get_animation_names(parse_value('fade 1s, spin 2s'))) {
	keyframes.use(name.value, name)
}
const { unknown } = keyframes.analyze() // ['fade']
const { usages } = keyframes.payloads() // usages.get('fade') is the Match of `fade`
```

### Extractors

For tools that already have the CSS in hand, like a linter or an editor: the logic of the collectors, per declaration. Pass the property and the parsed value and get the matches, with where they are. Collectors use the same code, so a tool and the analyzer never disagree about what a color or a font size is.

```js
import { parse_value } from '@projectwallace/css-parser'
import { extract_colors, extract_font_sizes } from '@projectwallace/css-analyzer/extract'

extract_colors('border', parse_value('1px solid RED'))
// [{ value: 'RED', format: 'named', line: 1, column: 11, start_offset: 10, end_offset: 13 }]
extract_font_sizes('font', parse_value('bold 12px/1.5 serif')) // [{ value: '12px', ... }]
extract_font_sizes('color', parse_value('red')) // []
```

`extract_colors`, `extract_gradients`, `extract_units`, `extract_font_sizes`, `extract_line_heights`, `extract_font_families` (the whole list as written; `get_font_families()` splits it), `extract_z_indexes`, `extract_box_shadows`, `extract_text_shadows`, `extract_border_radiuses`, `extract_durations` and `extract_timing_functions` all return `Match[]` and an empty array for properties they do not handle. Extractors that look at a fixed set of properties also export that set as a `KeywordSet` (`font_size_properties`, `z_index_properties`, ...), so you can skip declarations early. Values are as written (a hex color loses its browserhack); normalizing (lowercasing, `skip_var`) is up to you or the collector options.

`get_feature_bounds()` (`/atrules`) lists the numeric bounds of the parsed prelude of a `@media` or `@container` at-rule: `(min-width: 400px)`, `(width >= 400px)` and `(50px <= width <= 100px)` become `{ feature, direction, value, unit, inclusive, query }` plus a location. `or` and `not` are not interpreted, and `query` tells the comma separated queries apart.

## Upgrading from 9.x

See [MIGRATION.md](./MIGRATION.md).

## Acknowledgements

Browser hack patterns for value detection were sourced from:

- [Always Twisted - ReLiCSS Old CSS](https://www.alwaystwisted.com/relicss/old-css)
- [Browserhacks](https://browserhacks.com/)

## Related projects

- [CSS Design Tokens](https://github.com/projectwallace/css-design-tokens) - Get DTCG tokens from CSS (uses this css-analyzer)
- [Wallace CLI](https://github.com/projectwallace/wallace-cli) - CLI tool for
  @projectwallace/css-analyzer
- [Color Sorter](https://github.com/projectwallace/color-sorter) - Sort CSS colors
  by hue, saturation, lightness and opacity
- [Project Wallace Stylelint plugin pack](https://github.com/projectwallace/stylelint-plugin) - Lint your CSS based on the metrics in this CSS analyzer
