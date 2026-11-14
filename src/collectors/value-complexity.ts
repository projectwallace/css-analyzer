import type { CollectorDef, CountOptions, CountResult } from '../engine/types.ts'
import { get_value_weight } from './complexity.ts'
import { define_counting_collector } from './shared.ts'

/** Complexity of every value: 1, plus 1 per vendor prefixed value and browserhack */
export function value_complexity(options: CountOptions = {}): CollectorDef<CountResult<number>> {
	return define_counting_collector<number>(options, function setup(counter) {
		return {
			parse: { values: true },
			declaration: {
				enter(_node, ctx) {
					if (!ctx.value) {
						return
					}
					counter.add(get_value_weight(ctx), ctx.value)
				},
			},
		}
	})
}
