import { define_collector } from '../engine/define-collector.js'
import { create_context_counter, merge_context_counts } from '../engine/counter.js'
import type { CollectorDef, ContextCountOptions, ContextCountResult } from '../engine/types.js'
import { border_radius_properties } from '../properties/property-utils.js'

/** Values of `border-radius` and its longhands; with `contexts` also counted per property */
export function border_radiuses(
	options: ContextCountOptions = {},
): CollectorDef<ContextCountResult> {
	return define_collector<ContextCountResult>(function init() {
		const counter = create_context_counter(options)
		return {
			parse: { values: true },
			declaration: {
				properties: border_radius_properties.set,
				enter(_node, ctx) {
					const text = ctx.clean_value_text
					if (text === undefined) return
					counter.add(text, ctx.property, ctx.at(ctx.value!))
				},
			},
			result: () => counter.result(),
		}
	}, merge_context_counts)
}
