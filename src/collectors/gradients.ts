import { FUNCTION } from '@projectwallace/css-parser'
import type { CollectorDef, CountOptions, CountResult } from '../engine/types.ts'
import { is_gradient } from '../extract/gradients.ts'
import { define_counting_collector } from './shared.ts'

/** Every gradient function (see `is_gradient_function()`), as written, including nested ones and `var()` fallbacks */
export function gradients(options: CountOptions = {}): CollectorDef<CountResult> {
	return define_counting_collector(options, function setup(counter) {
		return {
			value: {
				types: [FUNCTION],
				enter(node, ctx) {
					if (is_gradient(node, ctx.property)) {
						counter.add(node.text, node)
					}
				},
			},
		}
	})
}
