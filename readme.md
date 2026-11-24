# CSS Analyzer

<div align="center">
  <img src="logo.svg" height="160" width="160" alt="Analyzer logo">
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
const { colors: result } = analyze(css, {
	colors: colors({ locations: true }),
})
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

The preset takes the global `locations` option only. To give one collector other options, spread the preset and replace that collector:

```js
analyze(css, {
	...design_tokens_collectors(),
	colors: colors({ normalize: 'none' }),
})
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
					if (ctx.is_important) {
						counter.add(ctx.property, node)
					}
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

- Hooks: `stylesheet`, `rule`, `atrule`, `selector`, `declaration` (`{ properties?, enter }`), `value` (`{ types, properties?, enter }`), `comment`. Types in [src/engine/types.ts](./src/engine/types.ts).
- `selector` gets style rule selectors only, without `ctx` (use `rule` for `depth`/`atrule_stack`).
- `ctx` holds lazy, shared facts about the current node: see [src/engine/context.ts](./src/engine/context.ts).
- `counter.add(item, node)`: the node is where `locations` come from.
- Don't keep nodes or `ctx` after a handler returns.

### Utilities

Functions that take a node parsed with `@projectwallace/css-parser` (`parse_value()`, `parse_selector()`, or an at-rule `prelude` from `parse()`) and return plain data.

```js
import { parse_selector, parse_value } from '@projectwallace/css-parser'
import { get_specificity } from '@projectwallace/css-analyzer/selectors'
import { get_declared_container_names } from '@projectwallace/css-analyzer/values'

get_specificity(parse_selector('a.b > #c')) // [1, 1, 1]
get_declared_container_names(parse_value('sidebar card / size'))
// [{ value: 'sidebar', line: 1, column: 1, start_offset: 0, end_offset: 7 }, ...]
```

| Entry point          | Source                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------- |
| `/selectors`         | [src/selectors](./src/selectors/index.ts)                                               |
| `/values`            | [src/values](./src/values/index.ts)                                                     |
| `/atrules`           | [src/atrules](./src/atrules/index.ts)                                                   |
| `/properties`        | [src/properties](./src/properties/index.ts)                                             |
| `/stylesheet`        | [src/stylesheet](./src/stylesheet/index.ts)                                             |
| `/extract`           | [src/extract](./src/extract/index.ts)                                                   |
| `/utils/collections` | [src/utils/collections](./src/utils/collections/index.ts) (`DefinedUsed`, `KeywordSet`) |

**`Match`** ([src/utils/location.ts](./src/utils/location.ts)): `{ value, line, column, start_offset, end_offset }`

- `value` is always the source text; derived data gets its own field (`name`, `hack`, `text`, `unit`, ...).
- Offsets are relative to the parsed source; `end_offset` is exclusive.

### Extractors

The per-declaration logic of the collectors, for linters and editors: `extract_*(property, value): Match[]`.

```js
import { parse_value } from '@projectwallace/css-parser'
import { extract_colors } from '@projectwallace/css-analyzer/extract'

extract_colors('border', parse_value('1px solid RED'))
// [{ value: 'RED', text: 'RED', format: 'named', line: 1, column: 11, start_offset: 10, end_offset: 13 }]
```

- Single-property extractors (`extract_z_indexes`, `extract_box_shadows`, ...) take only the value.
- Property sets are exported as `KeywordSet`s (`font_size_properties`, ...) to skip declarations early.
- Values are returned as written; normalizing is up to you.

## Upgrading from 9.x

See [MIGRATION.md](./MIGRATION.md).

## Acknowledgements

Browser hack patterns for value detection were sourced from:

- [Always Twisted - ReLiCSS Old CSS](https://www.alwaystwisted.com/relicss/old-css)
- [Browserhacks](https://browserhacks.com/)

## Related projects

- [CSS Design Tokens](https://github.com/projectwallace/css-design-tokens) - Get DTCG tokens from CSS (uses this css-analyzer)
- [Project Wallace Stylelint plugin](https://github.com/projectwallace/stylelint-plugin) - Lint your CSS based on the metrics in this CSS analyzer
- [Wallace CLI](https://github.com/projectwallace/wallace-cli) - CLI tool for @projectwallace/css-analyzer
- [Color Sorter](https://github.com/projectwallace/color-sorter) - Sort CSS colors by hue, saturation, lightness and opacity
