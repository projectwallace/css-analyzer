import { str_index_of } from '@projectwallace/css-parser'
import type { CollectorDef, CountOptions, CountResult } from '../engine/types.ts'
import { SYSTEM_FONTS } from '../values/destructure-font-shorthand.ts'
import { define_counting_collector, type Normalize } from './shared.ts'
import { lowercase_unless_var } from './value-helpers.ts'

export type FontSizesOptions = CountOptions & {
	normalize?: Normalize
	/** Leave out values that use `var()` */
	skip_var?: boolean
}

const PROPERTIES = new Set(['font-size', 'font'])

export function font_sizes(options: FontSizesOptions = {}): CollectorDef<CountResult> {
	const lowercase = options.normalize !== 'none'

	return define_counting_collector(options, function setup(counter) {
		return {
			parse: { values: true },
			declaration: {
				properties: PROPERTIES,
				enter(_node, ctx) {
					const text =
						ctx.property === 'font' ? ctx.font_shorthand?.font_size : ctx.clean_value_text
					if (text === undefined) {
						return
					}
					if (options.skip_var && str_index_of('var(', text) !== -1) {
						return
					}
					// The font shorthand never reaches this point for system fonts and global keywords
					if (ctx.property === 'font-size' && SYSTEM_FONTS.has(text)) {
						return
					}
					counter.add(lowercase ? lowercase_unless_var(text) : text, ctx.value!)
				},
			},
		}
	})
}
