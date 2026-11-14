import type { CollectorDef, CountOptions, CountResult } from '../engine/types.ts'
import { define_counting_collector } from './shared.ts'
import { get_animation_names } from './value-helpers.ts'

/** Names used in `animation` and `animation-name`, quotes removed */
export function animation_names(options: CountOptions = {}): CollectorDef<CountResult> {
	return define_counting_collector(options, function setup(counter) {
		return {
			parse: { values: true },
			declaration: {
				properties: new Set(['animation', 'animation-name']),
				enter(_node, ctx) {
					for (const name of get_animation_names(ctx)) {
						counter.add(name, ctx.value!)
					}
				},
			},
		}
	})
}
