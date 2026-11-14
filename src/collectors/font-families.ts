import { str_index_of } from '@projectwallace/css-parser'
import type { CollectorDef, CountOptions, CountResult } from '../engine/types.ts'
import { system_fonts } from '../values/destructure-font-shorthand.ts'
import { define_counting_collector } from './shared.ts'

export type FontFamiliesOptions = CountOptions & {
	/** Leave out values that use `var()` */
	skip_var?: boolean
}

const properties = new Set(['font-family', 'font'])

/** Font families are counted as written (case and quotes are kept) */
export function font_families(options: FontFamiliesOptions = {}): CollectorDef<CountResult> {
	return define_counting_collector(options, function setup(counter) {
		return {
			parse: { values: true },
			declaration: {
				properties,
				enter(_node, ctx) {
					const text =
						ctx.property === 'font' ? ctx.font_shorthand?.font_family : ctx.clean_value_text
					if (!text) {
						return
					}
					if (ctx.property === 'font-family' && system_fonts.has(text)) {
						return
					}
					if (options.skip_var && str_index_of('var(', text) !== -1) {
						return
					}
					counter.add(text, ctx.value!)
				},
			},
		}
	})
}
