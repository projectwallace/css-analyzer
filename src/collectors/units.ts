import { type Dimension, DIMENSION } from '@projectwallace/css-parser'
import { create_context_counter } from '../engine/counter.ts'
import { define_collector } from '../engine/define-collector.ts'
import type {
	CollectorDef,
	ContextCountOptions,
	CountResult,
	WithContexts,
} from '../engine/types.ts'
import { get_context_property } from './shared.ts'

// These are units, not lengths: `s` and `ms` in `transition` and `animation` count too. Only the values
// that are names and numbers are left out (a font name, a z-index), as 9.x did.
const skipped_properties = new Set(['font-family', 'z-index'])

/** Units of every dimension (`px`, `em`, `s`, ...), lowercased; with `contexts` also per property */
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
					if (skipped_properties.has(ctx.property)) {
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
