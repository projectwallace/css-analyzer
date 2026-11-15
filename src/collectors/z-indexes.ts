import type { CollectorDef, CountOptions, CountResult } from '../engine/types.ts'
import { z_index_properties } from '../extract/whole-values.ts'
import { define_counting_collector } from './shared.ts'

/** The values of every `z-index` declaration, as written */
export function z_indexes(options: CountOptions = {}): CollectorDef<CountResult> {
	return define_counting_collector(options, function setup(counter) {
		return {
			parse: { values: true },
			declaration: {
				properties: z_index_properties.set,
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
