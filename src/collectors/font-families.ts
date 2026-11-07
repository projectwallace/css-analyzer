import { str_index_of } from '@projectwallace/css-parser'
import type { CollectorDef, CountOptions, CountResult } from '../engine/types.js'
import { SYSTEM_FONTS } from '../values/destructure-font-shorthand.js'
import { define_counting_collector } from './shared.js'

export type FontFamiliesOptions = CountOptions & {
	/** Leave out values that use `var()` */
	skip_var?: boolean
}

const PROPERTIES = new Set(['font-family', 'font'])

/** Font families are counted as written (case and quotes are kept) */
export function font_families(options: FontFamiliesOptions = {}): CollectorDef<CountResult> {
	return define_counting_collector(options, function setup(counter) {
		return {
			parse: { values: true },
			declaration: {
				properties: PROPERTIES,
				enter(_node, ctx) {
					const text =
						ctx.property === 'font' ? ctx.font_shorthand?.font_family : ctx.clean_value_text
					if (!text) {
						return
					}
					if (ctx.property === 'font-family' && SYSTEM_FONTS.has(text)) {
						return
					}
					if (options.skip_var && str_index_of('var(', text) !== -1) {
						return
					}
					counter.add(text, ctx.at(ctx.value!))
				},
			},
		}
	})
}
