import { str_index_of } from '@projectwallace/css-parser'
import type { CollectorDef, CountOptions, CountResult } from '../engine/types.ts'
import { define_counting_collector, lowercase_unless_var, type Normalize } from './shared.ts'

export type LineHeightsOptions = CountOptions & {
	normalize?: Normalize
	/** Leave out values that use `var()` */
	skip_var?: boolean
}

const PROPERTIES = new Set(['line-height', 'font'])

export function line_heights(options: LineHeightsOptions = {}): CollectorDef<CountResult> {
	const lowercase = options.normalize !== 'none'

	return define_counting_collector(options, function setup(counter) {
		return {
			parse: { values: true },
			declaration: {
				properties: PROPERTIES,
				enter(_node, ctx) {
					const text =
						ctx.property === 'font' ? ctx.font_shorthand?.line_height : ctx.clean_value_text
					if (text === undefined) {
						return
					}
					if (options.skip_var && str_index_of('var(', text) !== -1) {
						return
					}
					counter.add(lowercase ? lowercase_unless_var(text) : text, ctx.at(ctx.value!))
				},
			},
		}
	})
}
