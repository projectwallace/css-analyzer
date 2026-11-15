import type { CollectorDef, CountOptions, CountResult } from '../engine/types.ts'
import { box_shadow_properties } from '../extract/whole-values.ts'
import { define_counting_collector } from './shared.ts'

/** The whole `box-shadow` value, as written (vendor prefixed properties included) */
export function box_shadows(options: CountOptions = {}): CollectorDef<CountResult> {
	return define_counting_collector(options, function setup(counter) {
		return {
			parse: { values: true },
			declaration: {
				properties: box_shadow_properties.set,
				enter(_node, ctx) {
					const text = ctx.clean_value_text
					if (text === undefined) {
						return
					}
					counter.add(text, ctx.value!)
				},
			},
		}
	})
}
