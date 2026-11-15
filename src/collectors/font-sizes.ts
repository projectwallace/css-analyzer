import { str_index_of } from '@projectwallace/css-parser'
import type { CollectorDef, CountOptions, CountResult } from '../engine/types.ts'
import { font_size, font_size_properties } from '../extract/fonts.ts'
import { lowercase_unless_var } from '../extract/shared.ts'
import { define_counting_collector, type Normalize } from './shared.ts'

export type FontSizesOptions = CountOptions & {
	/** `lowercase` (default) lowercases the values (`2EM` is `2em`; values with `var()` are kept). `none` keeps them as written. */
	normalize?: Normalize
	/** Leave out values that use `var()` */
	skip_var?: boolean
}

export function font_sizes(options: FontSizesOptions = {}): CollectorDef<CountResult> {
	const lowercase = options.normalize !== 'none'

	return define_counting_collector(options, function setup(counter) {
		return {
			parse: { values: true },
			declaration: {
				properties: font_size_properties.set,
				enter(_node, ctx) {
					const value = ctx.value
					const match = value && font_size(ctx.property, value, ctx.font_shorthand)
					if (!match) {
						return
					}
					const text = match.value
					if (options.skip_var && str_index_of('var(', text) !== -1) {
						return
					}
					counter.add(lowercase ? lowercase_unless_var(text) : text, value)
				},
			},
		}
	})
}
