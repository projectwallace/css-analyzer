import { get_name } from '../adapter/css-parser.js'
import type { CollectorDef, CountOptions, CountResult } from '../engine/types.js'
import { endsWith } from '../string-utils.js'
import { NO_VALUE_WALK, define_counting_collector } from './shared.js'

/** Every `*-gradient()` function, as written, including nested ones and `var()` fallbacks */
export function gradients(options: CountOptions = {}): CollectorDef<CountResult> {
	return define_counting_collector(options, function setup(counter) {
		return {
			value: {
				types: ['function'],
				enter(node, ctx) {
					if (NO_VALUE_WALK.has(ctx.property)) return
					if (endsWith('gradient', get_name(node))) {
						counter.add(node.text, ctx.at(node))
					}
				},
			},
		}
	})
}
