import type { CollectorDef, CountOptions, CountResult } from '../engine/types.ts'
import { define_counting_collector } from './shared.ts'

const PROPERTIES = new Set(['text-shadow'])

/** The whole `text-shadow` value, as written */
export function text_shadows(options: CountOptions = {}): CollectorDef<CountResult> {
	return define_counting_collector(options, function setup(counter) {
		return {
			parse: { values: true },
			declaration: {
				properties: PROPERTIES,
				enter(_node, ctx) {
					const text = ctx.clean_value_text
					if (text !== undefined) {
						counter.add(text, ctx.value!)
					}
				},
			},
		}
	})
}
