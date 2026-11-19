import { str_index_of } from '@projectwallace/css-parser'
import type { CollectorDef, CountOptions, CountResult } from '../engine/types.ts'
import { line_height, line_height_properties } from '../extract/fonts.ts'
import { lowercase_unless_var } from '../extract/shared.ts'
import { define_counting_collector, type Normalize } from './shared.ts'

export type LineHeightsOptions = CountOptions & {
	/** `none` keeps the case as written */
	normalize?: Normalize
	skip_var?: boolean
}

export function line_heights(options: LineHeightsOptions = {}): CollectorDef<CountResult> {
	const lowercase = options.normalize !== 'none'

	return define_counting_collector(options, function setup(counter) {
		return {
			parse: { values: true },
			declaration: {
				properties: line_height_properties.set,
				enter(_node, ctx) {
					const value = ctx.value
					const match = value && line_height(ctx.property, value, ctx.font_shorthand)
					if (!match) {
						return
					}
					const text = match.text
					if (options.skip_var && str_index_of('var(', text) !== -1) {
						return
					}
					counter.add(lowercase ? lowercase_unless_var(text) : text, value)
				},
			},
		}
	})
}
