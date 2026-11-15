import { str_index_of } from '@projectwallace/css-parser'
import type { CollectorDef, CountOptions, CountResult } from '../engine/types.ts'
import { font_family, font_family_properties } from '../extract/fonts.ts'
import { define_counting_collector } from './shared.ts'

export type FontFamiliesOptions = CountOptions & {
	/** Leave out values that use `var()` */
	skip_var?: boolean
}

/** Font families are counted as written (case and quotes are kept) */
export function font_families(options: FontFamiliesOptions = {}): CollectorDef<CountResult> {
	return define_counting_collector(options, function setup(counter) {
		return {
			parse: { values: true },
			declaration: {
				properties: font_family_properties.set,
				enter(_node, ctx) {
					const value = ctx.value
					const match = value && font_family(ctx.property, value, ctx.font_shorthand)
					if (!match) {
						return
					}
					const text = match.value
					if (options.skip_var && str_index_of('var(', text) !== -1) {
						return
					}
					counter.add(text, value)
				},
			},
		}
	})
}
