import type { CollectorDef, CountOptions, CountResult } from '../engine/types.ts'
import { get_value_browserhacks } from '../values/browserhacks.ts'
import { get_prefixed_values } from '../values/vendor-prefix.ts'
import { define_counting_collector } from './shared.ts'

/**
 * Complexity of every value: 1, plus 1 for every vendor prefixed value and browserhack.
 * Items are numbers; use `summarize_numbers()` for min, max, mean, ...
 */
export function value_complexity(options: CountOptions = {}): CollectorDef<CountResult<number>> {
	return define_counting_collector<number>(options, function setup(counter) {
		return {
			parse: { values: true },
			declaration: {
				enter(_node, ctx) {
					if (!ctx.value) {
						return
					}
					let complexity = 1
					if (ctx.clean_value_text !== undefined) {
						complexity += get_prefixed_values(ctx.value).length
						if (!ctx.is_custom) {
							complexity += get_value_browserhacks(ctx.value).length
						}
					}
					counter.add(complexity, ctx.value)
				},
			},
		}
	})
}
