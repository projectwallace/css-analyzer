import { is_function, FUNCTION } from '@projectwallace/css-parser'
import type { CollectorDef, CountOptions, CountResult } from '../engine/types.ts'
import { ends_with } from '../utils/string-utils.ts'
import { define_counting_collector } from './shared.ts'
import { NO_VALUE_WALK } from './value-helpers.ts'

/** Every `*-gradient()` function, as written, including nested ones and `var()` fallbacks */
export function gradients(options: CountOptions = {}): CollectorDef<CountResult> {
	return define_counting_collector(options, function setup(counter) {
		return {
			value: {
				types: [FUNCTION],
				enter(node, ctx) {
					if (NO_VALUE_WALK.has(ctx.property)) {
						return
					}
					if (is_function(node) && ends_with('gradient', node.name)) {
						counter.add(node.text, node)
					}
				},
			},
		}
	})
}
