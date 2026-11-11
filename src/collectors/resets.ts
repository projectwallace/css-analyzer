import type { CollectorDef, CountOptions, CountResult } from '../engine/types.ts'
import { spacing_reset_properties } from '../properties/property-utils.ts'
import { is_value_reset } from '../values/values.ts'
import { define_counting_collector } from './shared.ts'

/** Spacing properties that are reset to 0 (`margin: 0`), counted by property */
export function resets(options: CountOptions = {}): CollectorDef<CountResult> {
	return define_counting_collector(options, function setup(counter) {
		return {
			parse: { values: true },
			declaration: {
				properties: spacing_reset_properties,
				enter(_node, ctx) {
					if (ctx.clean_value_text === undefined) {
						return
					}
					if (is_value_reset(ctx.value!)) {
						counter.add(ctx.property, ctx.value!)
					}
				},
			},
		}
	})
}
