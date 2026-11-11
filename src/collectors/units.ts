import { type Dimension, DIMENSION } from '@projectwallace/css-parser'
import { create_context_counter } from '../engine/counter.ts'
import { define_collector } from '../engine/define-collector.ts'
import type {
	CollectorDef,
	ContextCountOptions,
	CountResult,
	WithContexts,
} from '../engine/types.ts'
import { NO_VALUE_WALK, get_context_property } from './shared.ts'

/** Units of every dimension (`px`, `em`, ...), lowercased; with `contexts` also per property */
export function units<O extends ContextCountOptions = {}>(
	options?: O,
): CollectorDef<WithContexts<CountResult, O>> {
	return define_collector<WithContexts<CountResult, O>>(function init() {
		const counter = create_context_counter(options)
		return {
			parse: { values: true },
			value: {
				types: [DIMENSION],
				enter(node, ctx) {
					if (NO_VALUE_WALK.has(ctx.property)) {
						return
					}
					counter.add(
						(node as Dimension).unit.toLowerCase(),
						get_context_property(ctx, options?.property),
						node,
					)
				},
			},
			result: () => counter.result() as WithContexts<CountResult, O>,
		}
	})
}
