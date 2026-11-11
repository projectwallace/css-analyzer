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

### Serialize results

`unique` and `by_context` are `Map`s, which `JSON.stringify()` turns into `{}`. Use `to_json()` to get a plain copy that serializes (to send results between workers, store them or snapshot them):

```js
import { to_json } from '@projectwallace/css-analyzer'

JSON.stringify(to_json(result.colors)) // '{"total":12,"total_unique":5,"unique":{"red":{"count":3}, ...}}'
```

### Locations

Locations are opt-in per collector:

```js
const { colors: result } = analyze(css, { colors: colors({ locations: true }) })
result.unique.get('red').locations // [{ line: 3, column: 14, offset: 26, length: 3 }, ...]
```

### Ordered numbers (for charts)

Numeric series (nesting, sizes, complexity, specificity) are counted as values. Pass `sequence: true` to also get them in source order:

```js
import { rules } from '@projectwallace/css-analyzer/collectors'
const { r } = analyze(css, { r: rules({ sequence: true }) })
r.sizes.sequence // [2, 3, 1]
```

Use `summarize_numbers(result.sizes)` for min, max, mean, mode, median, range and sum.

### Already parsed?

`analyze()` also accepts an AST from `@projectwallace/css-parser`. Parse it with values, selectors and at-rule preludes enabled so every collector has what it needs.

### Presets

```js
import { analyze_design_tokens, analyze_all } from '@projectwallace/css-analyzer/presets'

analyze_design_tokens(css) // colors, font_sizes, font_families, line_heights, gradients, box_shadows, border_radiuses, durations, timing_functions
analyze_all(css) // every collector, flat: result.colors, result.atrules, result.selectors, ...
analyze_design_tokens(css, { locations: true }) // locations for every collector
```

Each preset also exists as a function that returns a collector map (`design_tokens_collectors(options)`, `all_collectors(options)`), which you can spread, narrow or extend. The keys are the collector names.
`analyze(css, { ...design_tokens_collectors({ locations: true }), z_indexes: z_indexes() })`.

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
| `stylesheet`                                               | size, lines, comments, embedded `data:` content                                                                                              |
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
			declaration(node, ctx) {
				if (ctx.is_important) counter.add(ctx.property, ctx)
			},
			result() {
				return counter.result()
			},
		}
	})
}

analyze(css, { important: important_declarations() })
```

A collector subscribes to what it needs: `stylesheet`, `rule`, `atrule`, `selector`, `declaration`, `value` and `comment`. The engine walks the CSS once and only dispatches to subscribers. `selector` handlers get the selectors of style rules (not keyframe selectors, nor selectors in at-rule preludes) and no `ctx`: use `rule` when you need `depth` or `atrule_stack`. Collectors must not keep nodes or the `ctx` object after the handler returns.
`ctx` offers lazy, shared facts: `property`, `raw_property`, `is_important`, `is_custom`, `is_browserhack`, `is_vendor_prefixed`, `value`, `value_text`, `clean_value_text`, `font_shorthand`, `depth`, `atrule_stack` and (in `stylesheet`) `css`. Counters take the node that was found (`counter.add(item, node)`): that is where `locations` come from.

`comment` handlers only run when you pass CSS text to `analyze()`: the comments of an AST that was parsed elsewhere are not available.

### Utilities

Small functions that work on their own: they accept CSS text or an already parsed node and return plain data.

```js
import { get_specificity, compare_specificity } from '@projectwallace/css-analyzer/selectors'
import { is_value_reset, get_value_browserhacks } from '@projectwallace/css-analyzer/values'

get_specificity('a.b > #c') // [[1, 1, 1]]
is_value_reset('0 0px') // true
```

Also: `get_complexity`, `get_vendor_prefixes`, `get_accessibility_selectors`, `get_combinators` (`/selectors`); `destructure_font_shorthand`, `analyze_animation`, `get_prefixed_values`, `named_colors`, `system_colors`, `color_functions`, `keywords` (`/values`); `get_media_browserhacks`, `get_supports_browserhacks` (`/atrules`); `shorthand_properties`, `is_property_hack` (`/properties`); `get_embed_type` (`/stylesheet`).

`DefinedUsed` (track what is defined and what is used, for names like custom properties or keyframes) and `KeywordSet` (a case-insensitive set of keywords) are the building blocks the built-in collectors use. They are exported from `@projectwallace/css-analyzer/utils/collections`.

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
