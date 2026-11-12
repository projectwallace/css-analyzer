import type { CollectorDef, CountOptions, CountResult } from '../engine/types.ts'
import { define_counting_collector } from './shared.ts'

const properties = new Set(['box-shadow'])

/** The whole `box-shadow` value, as written (vendor prefixed properties included) */
export function box_shadows(options: CountOptions = {}): CollectorDef<CountResult> {
	return define_counting_collector(options, function setup(counter) {
		return {
			parse: { values: true },
			declaration: {
				properties,
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
