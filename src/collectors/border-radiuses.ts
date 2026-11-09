import { define_collector } from '../engine/define-collector.ts'
import { create_context_counter } from '../engine/counter.ts'
import type {
	CollectorDef,
	ContextCountOptions,
	CountResult,
	WithContexts,
} from '../engine/types.ts'
import { get_context_property } from './shared.ts'
import { border_radius_properties } from '../properties/property-utils.ts'

/** Values of `border-radius` and its longhands; with `contexts` also counted per property */
export function border_radiuses<O extends ContextCountOptions = {}>(
	options?: O,
): CollectorDef<WithContexts<CountResult, O>> {
	return define_collector<WithContexts<CountResult, O>>(function init() {
		const counter = create_context_counter(options)
		return {
			parse: { values: true },
			declaration: {
				properties: border_radius_properties.set,
				enter(_node, ctx) {
					const text = ctx.clean_value_text
					if (text === undefined) {
						return
					}
					counter.add(text, get_context_property(ctx, options?.property), ctx.value!)
				},
			},
			result: () => counter.result() as WithContexts<CountResult, O>,
		}
	})
}
