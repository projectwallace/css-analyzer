import type { CollectorDef, CountOptions, CountResult } from '../engine/types.js'
import { define_counting_collector } from './shared.js'

const PROPERTIES = new Set(['box-shadow'])

/** The whole `box-shadow` value, as written (vendor prefixed properties included) */
export function box_shadows(options: CountOptions = {}): CollectorDef<CountResult> {
	return define_counting_collector(options, function setup(counter) {
		return {
			parse: { values: true },
			declaration: {
				properties: PROPERTIES,
				enter(_node, ctx) {
					const text = ctx.clean_value_text
					if (text === undefined) return
					counter.add(text, ctx.at(ctx.value!))
				},
			},
		}
	})
}
